import type { ConnectionCountry } from '@shared/metrics'
import { type Quake, quakeSeverity } from '@shared/quakes'
import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Group,
  Line,
  LineBasicMaterial,
  LineLoop,
  LineSegments,
  Mesh,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
  WebGLRenderer,
} from 'three'
import { arcPoints, type Home, latLonToVec3, type Vec3, visibleQuakes } from './geo.ts'
import landPoints from './land-points.json'

/**
 * The world view: a dotted globe with this machine's position, a pin for each
 * country it has connections to, arcs between them, and a few satellites.
 *
 * eDEX-UI vendored the ENCOM globe (a 43,000-line three.js build of its own).
 * This is a small scene on current three.js: the continents are one Points draw
 * call, each connection an arc and a spike, all with two shaders. Everything is
 * rebuilt only when the connection set changes; a frame is a rotation and a draw.
 *
 * Earthquakes from JMA's list (when alerts or a quakes pane keep it current) are
 * rings at their epicentres, sized by magnitude and coloured by intensity, for a
 * day; one from the last hour also sends out a pulse.
 */

export interface GlobeColors {
  accent: Color
  surface: Color
  warn: Color
  danger: Color
}

/** One pulse: a ring growing out from the epicentre and fading. */
const PULSE_PERIOD_MS = 2000
/** Which earthquakes are marked is re-read this often, so they expire without a new report. */
const QUAKE_RECHECK_MS = 60_000

/**
 * One full turn. Slower than eDEX-UI's 45 s, so that at ten frames a second each
 * step is under half a degree and the turn still reads as smooth.
 */
const DAY_MS = 90_000
const TILT = 0.35

/**
 * Draw order, fixed. Every layer is transparent, and three.js otherwise sorts
 * transparent objects back to front by the centre of each one's bounding
 * sphere. The land's centre is not the globe's - most land is in the north - so
 * for part of every turn the continents sorted behind the sphere, which was then
 * painted over them: the dots vanished for stretches, from the first frame on.
 * The sphere goes first (writing depth, so far-side dots stay hidden), then the
 * land, then everything drawn over the land.
 */
const ORDER = { sphere: 0, land: 1, markers: 2 } as const

const POINT_VERTEX = /* glsl */ `
  uniform float uSize;
  varying float vFacing;
  void main() {
    vec4 view = modelViewMatrix * vec4(position, 1.0);
    // How much the point faces the camera: dots on the far side fade out.
    vFacing = normalize(normalMatrix * position).z;
    gl_PointSize = uSize;
    gl_Position = projectionMatrix * view;
  }
`

const POINT_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  varying float vFacing;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    if (dot(c, c) > 0.25) discard;
    float alpha = mix(0.08, 0.95, smoothstep(-0.15, 0.35, vFacing));
    gl_FragColor = vec4(uColor, alpha);
  }
`

const ARC_VERTEX = /* glsl */ `
  attribute float aT;
  varying float vT;
  void main() {
    vT = aT;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const ARC_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uTime;
  varying float vT;
  void main() {
    // Dashes flowing outward from home.
    float dash = step(0.45, fract(vT * 6.0 - uTime * 0.6));
    gl_FragColor = vec4(uColor, 0.25 + 0.6 * dash);
  }
`

const RIM_VERTEX = /* glsl */ `
  varying float vRim;
  void main() {
    vec3 n = normalize(normalMatrix * normal);
    vRim = 1.0 - abs(n.z);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const RIM_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uSurface;
  varying float vRim;
  void main() {
    gl_FragColor = vec4(mix(uSurface, uColor, pow(vRim, 3.0) * 0.55), 0.92);
  }
`

export class GlobeScene {
  private readonly renderer: WebGLRenderer
  private readonly scene = new Scene()
  private readonly camera = new PerspectiveCamera(32, 1, 0.1, 20)
  private readonly world = new Group()
  private readonly markers = new Group()
  private readonly satellites: Array<{ dot: Points; orbit: Group; speed: number }> = []
  private readonly pointMaterial: ShaderMaterial
  private readonly arcMaterial: ShaderMaterial
  private readonly rimMaterial: ShaderMaterial
  private readonly lineMaterial = new LineBasicMaterial({ transparent: true, opacity: 0.35 })
  private readonly spikeMaterial = new LineBasicMaterial({ transparent: true, opacity: 0.9 })
  private readonly orbitMaterial = new LineBasicMaterial({ transparent: true, opacity: 0.12 })
  private readonly quakeMaterials = {
    minor: new LineBasicMaterial({ transparent: true, opacity: 0.7 }),
    moderate: new LineBasicMaterial({ transparent: true, opacity: 0.85 }),
    severe: new LineBasicMaterial({ transparent: true, opacity: 0.95 }),
  }
  private readonly pulseMaterials = {
    minor: new LineBasicMaterial({ transparent: true }),
    moderate: new LineBasicMaterial({ transparent: true }),
    severe: new LineBasicMaterial({ transparent: true }),
  }
  private readonly quakeGroup = new Group()
  private readonly pulses: Array<{ ring: LineLoop; size: number }> = []
  private quakes: readonly Quake[] = []
  private quakeKey = ''
  private quakesCheckedAt = 0
  private home: Home | null = null
  private connections: ConnectionCountry[] = []
  private readonly started = performance.now()
  // Uniforms are held directly, so updates need no lookup by name.
  private readonly accent = { value: new Color() }
  private readonly surface = { value: new Color() }
  private readonly pointSize = { value: 2 }
  private readonly time = { value: 0 }

  constructor(canvas: HTMLCanvasElement, colors: GlobeColors) {
    this.renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true })
    this.renderer.setClearColor(0x000000, 0)

    this.camera.position.set(0, 0, 4.2)
    this.world.rotation.x = TILT
    this.scene.add(this.world)

    this.rimMaterial = new ShaderMaterial({
      vertexShader: RIM_VERTEX,
      fragmentShader: RIM_FRAGMENT,
      uniforms: { uColor: this.accent, uSurface: this.surface },
      transparent: true,
    })
    const sphere = new Mesh(new SphereGeometry(0.995, 48, 32), this.rimMaterial)
    sphere.renderOrder = ORDER.sphere
    this.world.add(sphere)

    this.pointMaterial = new ShaderMaterial({
      vertexShader: POINT_VERTEX,
      fragmentShader: POINT_FRAGMENT,
      uniforms: { uColor: this.accent, uSize: this.pointSize },
      transparent: true,
      depthWrite: false,
    })
    const land = new Points(landGeometry(), this.pointMaterial)
    land.renderOrder = ORDER.land
    this.world.add(land)

    this.arcMaterial = new ShaderMaterial({
      vertexShader: ARC_VERTEX,
      fragmentShader: ARC_FRAGMENT,
      uniforms: { uColor: this.accent, uTime: this.time },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    })
    this.markers.renderOrder = ORDER.markers
    this.world.add(this.markers)
    this.quakeGroup.renderOrder = ORDER.markers
    this.world.add(this.quakeGroup)
    this.addSatellites()
    this.setColors(colors)
  }

  setColors(colors: GlobeColors): void {
    this.accent.value.copy(colors.accent)
    this.surface.value.copy(colors.surface)
    this.lineMaterial.color.copy(colors.accent)
    this.spikeMaterial.color.copy(colors.accent)
    this.orbitMaterial.color.copy(colors.accent)
    for (const materials of [this.quakeMaterials, this.pulseMaterials]) {
      materials.minor.color.copy(colors.accent)
      materials.moderate.color.copy(colors.warn)
      materials.severe.color.copy(colors.danger)
    }
  }

  /** The earthquake list; the scene picks what to mark, and picks again each minute. */
  setQuakes(quakes: readonly Quake[]): void {
    this.quakes = quakes
    this.rebuildQuakes(Date.now())
  }

  setHome(home: Home | null): void {
    this.home = home
    this.rebuildMarkers()
  }

  setConnections(countries: ConnectionCountry[]): void {
    const same =
      countries.length === this.connections.length &&
      countries.every(
        (c, i) => c.code === this.connections[i]?.code && c.count === this.connections[i]?.count,
      )
    if (same) return
    this.connections = countries
    this.rebuildMarkers()
  }

  resize(width: number, height: number, ratio: number): void {
    this.renderer.setPixelRatio(Math.min(ratio, 2))
    this.renderer.setSize(width, height, false)
    this.camera.aspect = width / Math.max(1, height)
    // Keep the whole globe in view whether the pane is tall or wide.
    this.camera.position.z = this.camera.aspect < 1 ? 4.2 / this.camera.aspect : 4.2
    this.camera.updateProjectionMatrix()
    this.pointSize.value = Math.max(1.5, Math.min(width, height) / 170) * Math.min(ratio, 2)
  }

  /** Draws one frame. `spin` false holds the globe still (reduced motion). */
  render(now: number, spin: boolean): void {
    const elapsed = now - this.started
    // Start with home facing the viewer, then turn.
    const facing = this.home ? -this.home.lon * (Math.PI / 180) : 0
    this.world.rotation.y = facing + (spin ? (elapsed / DAY_MS) * Math.PI * 2 : 0)
    this.time.value = spin ? elapsed / 1000 : 0
    for (const s of this.satellites) s.orbit.rotation.y = s.speed * (spin ? elapsed / 1000 : 0)
    if (this.quakes.length > 0 && now - this.quakesCheckedAt >= QUAKE_RECHECK_MS) {
      this.rebuildQuakes(Date.now())
    }
    if (this.pulses.length > 0) {
      const phase = spin ? (elapsed % PULSE_PERIOD_MS) / PULSE_PERIOD_MS : 0.5
      for (const pulse of this.pulses) pulse.ring.scale.setScalar(pulse.size * (1 + 3 * phase))
      for (const material of Object.values(this.pulseMaterials)) {
        material.opacity = 0.9 * (1 - phase)
      }
    }
    this.renderer.render(this.scene, this.camera)
  }

  dispose(): void {
    this.scene.traverse((object) => {
      if (object instanceof Mesh || object instanceof Points || object instanceof Line) {
        object.geometry.dispose()
      }
    })
    for (const material of [
      this.pointMaterial,
      this.arcMaterial,
      this.rimMaterial,
      this.lineMaterial,
      this.spikeMaterial,
      this.orbitMaterial,
      ...Object.values(this.quakeMaterials),
      ...Object.values(this.pulseMaterials),
    ]) {
      material.dispose()
    }
    this.renderer.dispose()
    // dispose() frees buffers but keeps the context until the canvas is collected;
    // losing it now returns it to Chromium's small pool at once (lib/webgl.ts).
    this.renderer.forceContextLoss()
  }

  private rebuildMarkers(): void {
    for (const child of [...this.markers.children]) {
      if (child instanceof Line || child instanceof Points || child instanceof Mesh)
        child.geometry.dispose()
      this.markers.remove(child)
    }
    const home = this.home

    // Home: a ring on the surface and a tall spike.
    if (home) {
      this.markers.add(ring(home.lat, home.lon, 0.06, this.spikeMaterial))
      this.markers.add(ring(home.lat, home.lon, 0.11, this.lineMaterial))
      this.markers.add(spike(home.lat, home.lon, 0.3, this.spikeMaterial))
    }

    // Each country: a spike whose height follows the connection count, and an arc from home.
    for (const c of this.connections) {
      const height = 0.08 + 0.05 * Math.log2(1 + c.count)
      this.markers.add(spike(c.lat, c.lon, height, this.spikeMaterial))
      if (home && home.country !== c.code) {
        const points = arcPoints(home, c)
        const geometry = new BufferGeometry()
        geometry.setAttribute('position', new Float32BufferAttribute(points.flat(), 3))
        geometry.setAttribute(
          'aT',
          new Float32BufferAttribute(
            points.map((_, i) => i / (points.length - 1)),
            1,
          ),
        )
        this.markers.add(new Line(geometry, this.arcMaterial))
      }
    }
  }

  private rebuildQuakes(now: number): void {
    this.quakesCheckedAt = performance.now()
    const visible = visibleQuakes(this.quakes, now)
    const key = visible
      .map(({ quake: q, pulse }) =>
        [q.id, q.lat, q.lon, q.magnitude, q.maxIntensity, pulse].join(':'),
      )
      .join('|')
    if (key === this.quakeKey) return
    this.quakeKey = key
    for (const child of [...this.quakeGroup.children]) {
      if (child instanceof LineLoop) child.geometry.dispose()
      this.quakeGroup.remove(child)
    }
    this.pulses.length = 0
    // Oldest first, so the newest is drawn on top where rings overlap.
    for (const { quake, pulse } of [...visible].reverse()) {
      const severity = quakeSeverity(quake)
      const size = 0.012 + 0.008 * Math.max(0, (quake.magnitude ?? 3) - 2)
      this.quakeGroup.add(ring(quake.lat, quake.lon, size, this.quakeMaterials[severity]))
      if (!pulse) continue
      const circle = flatRing(this.pulseMaterials[severity])
      circle.position.set(...latLonToVec3(quake.lat, quake.lon, 1.004))
      circle.quaternion.setFromUnitVectors(
        new Vector3(0, 0, 1),
        new Vector3(...latLonToVec3(quake.lat, quake.lon)),
      )
      circle.scale.setScalar(size)
      this.quakeGroup.add(circle)
      this.pulses.push({ ring: circle, size })
    }
  }

  private addSatellites(): void {
    const orbits = [
      // Close in, so the orbits stay inside the pane at any aspect ratio.
      { inclination: 0.5, radius: 1.16, speed: 0.22 },
      { inclination: -0.9, radius: 1.24, speed: -0.3 },
      { inclination: 1.3, radius: 1.32, speed: 0.16 },
    ]
    for (const o of orbits) {
      const orbit = new Group()
      orbit.rotation.z = o.inclination
      const path: number[] = []
      for (let i = 0; i < 96; i++) {
        const a = (i / 96) * Math.PI * 2
        path.push(Math.cos(a) * o.radius, 0, Math.sin(a) * o.radius)
      }
      const pathGeometry = new BufferGeometry()
      pathGeometry.setAttribute('position', new Float32BufferAttribute(path, 3))
      const trace = new LineLoop(pathGeometry, this.orbitMaterial)
      trace.renderOrder = -1
      orbit.add(trace)

      const dotGeometry = new BufferGeometry()
      dotGeometry.setAttribute('position', new Float32BufferAttribute([o.radius, 0, 0], 3))
      const dot = new Points(dotGeometry, this.pointMaterial)
      dot.renderOrder = ORDER.markers
      orbit.add(dot)
      this.scene.add(orbit)
      this.satellites.push({ dot, orbit, speed: o.speed })
    }
  }
}

function landGeometry(): BufferGeometry {
  const coords = landPoints as number[]
  const positions: number[] = []
  for (let i = 0; i < coords.length; i += 2) {
    positions.push(...latLonToVec3(coords[i] ?? 0, coords[i + 1] ?? 0, 1.002))
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  return geometry
}

/** A vertical line from the surface at a place, `height` above it. */
function spike(
  lat: number,
  lon: number,
  height: number,
  material: LineBasicMaterial,
): LineSegments {
  const geometry = new BufferGeometry()
  geometry.setAttribute(
    'position',
    new Float32BufferAttribute(
      [...latLonToVec3(lat, lon, 1.002), ...latLonToVec3(lat, lon, 1 + height)],
      3,
    ),
  )
  return new LineSegments(geometry, material)
}

/** A unit circle in the XY plane, to be placed on the surface and scaled (a pulse). */
function flatRing(material: LineBasicMaterial): LineLoop {
  const positions: number[] = []
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2
    positions.push(Math.cos(a), Math.sin(a), 0)
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  return new LineLoop(geometry, material)
}

/** A small circle on the surface around a place, `size` in radians of arc. */
function ring(lat: number, lon: number, size: number, material: LineBasicMaterial): LineLoop {
  const positions: number[] = []
  const [cx, cy, cz] = latLonToVec3(lat, lon)
  // Two tangent vectors at the centre: east and north.
  const [ex, ey, ez]: Vec3 = [Math.cos((lon * Math.PI) / 180), 0, -Math.sin((lon * Math.PI) / 180)]
  const [nx, ny, nz]: Vec3 = [cy * ez - cz * ey, cz * ex - cx * ez, cx * ey - cy * ex]
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2
    const u = Math.cos(a) * size
    const v = Math.sin(a) * size
    const x = cx + ex * u + nx * v
    const y = cy + ey * u + ny * v
    const z = cz + ez * u + nz * v
    const len = Math.hypot(x, y, z) / 1.004
    positions.push(x / len, y / len, z / len)
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  return new LineLoop(geometry, material)
}
