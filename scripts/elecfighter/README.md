# ELECFIGHTER art (design stage)

The fighters of ELECFIGHTER (docs/elec16-elecfighter-design.md) are plain humans in wire and
fill, drawn ahead of time. Here they are 3D data; three.js draws them to bitmaps, and the game
will only ever import the bitmaps.

| File | What it is |
|---|---|
| `models/human.gltf` | The base human: glTF 2.0, one embedded buffer, a skinned mesh (660 triangles) on 19 bones. Made by `build-models.mjs`. |
| `models/effects.gltf` | `spark` (an icosahedron, the hit spark) and `shard` (a thin triangular plate). |
| `slots.json` | The camera, pixels a metre, and eight fighter slots (four used, four reserved). |
| `poses.json` | The poses: joint rotations per bone, shared by every slot. |
| `svg/stage.svg`, `svg/hud.svg` | The stage (512 x 288, BG0) and the HUD frame (320 x 36, BG1), in palette colours only. |
| `scene.mjs` | The scene both the viewer and the bitmap renderer use: posing, build, materials, wire, camera, light. |
| `viewer.html`, `viewer.mjs` | The design viewer. |
| `render.html`, `render-page.mjs`, `render-main.mjs`, `bitmaps.mjs` | The bitmap renderer: three.js's WebGLRenderer in a hidden Electron window. |
| `mock.mjs` | Writes `docs/elecfighter-mock/human-*.png` and prints the counts. |

```bash
node scripts/elecfighter/mock.mjs           # every mock PNG (Electron, SwiftShader; ELECFIGHTER_GPU=1 for the GPU)
node scripts/elecfighter/serve.mjs          # the viewer: open the address it prints
node scripts/elecfighter/build-models.mjs   # only to make the base models afresh
```

## How a bitmap is drawn

- Orthographic camera, the fighter facing screen right, turned `camera.yaw` degrees toward
  the viewer and looked at `camera.pitch` degrees down; one light from the upper front, fixed in
  the world. No anti-aliasing, pixel ratio 1, a render target with nearest filtering.
- Fills are flat, three tones a material (lit, mid, shade) by the face's angle to the light;
  wire is 1-pixel `LineSegments`, depth-tested (the fills carry a polygon offset): the outline
  and the borders between materials in bright wire, creases (`EdgesGeometry`, 30 degrees) in dim
  wire. The far side (bones ending `_l`) is a tone darker and its outline dim.
- Every material writes a palette index (index / 255 in red), so the result is the indices
  themselves; a pixel that is not one is counted (always 0 so far). Isolated points are then
  given their neighbours' colour, and the sprite is cut into 16 x 16 cells.

## Palette indices (one fighter palette)

1 wire bright, 2 wire dim, 3-5 fill A (suit), 6-8 fill B (gloves, shoes, belt), 9-11 fill C
(head and neck), 12 glow, 13 void, 14-15 spare. P1 and CPU differ only in 3-11
(`palettes.mjs`).

## Bones

```
hips
├─ spine ─ chest ─┬─ neck ─ head
│                 ├─ clavicle_l ─ upperarm_l ─ forearm_l ─ hand_l
│                 └─ clavicle_r ─ upperarm_r ─ forearm_r ─ hand_r
├─ thigh_l ─ shin_l ─ foot_l
└─ thigh_r ─ shin_r ─ foot_r
```

The model stands 1.75 m tall (7.5 heads), Y up, facing +Z, its left on +X, arms hanging. Every
rest rotation is identity, so a bone's frame is the model's axes. `_l` is the model's own left,
which is the side away from the camera when a fighter faces right.

## Poses (`poses.json`)

`order` lists the poses; each pose gives `bones.<name>.r = [x, y, z]`, Euler degrees applied
in the order Y, X, Z (yaw, then pitch, then roll) after the bone's rest rotation, and `hips`
may move by `t = [x, y, z]` metres. On a hanging limb, -X swings it forward and +X back; +Z
moves a limb toward the model's left. Every pose is set on the ground (its lowest point at 0)
and the sprite's origin is the model's origin on the ground. A missing bone keeps its rest
rotation.

## Slots (`slots.json`)

```json
{ "id": "S3", "used": true, "role": "power", "model": "models/human.gltf",
  "build": { "scale": 1.05, "girth": 1.3, "shoulders": 1.2, "hips": 1.08 } }
```

`build` keys (all default to 1): `scale` (the whole figure), `girth` (thickness of every
part), `shoulders`, `hips` (width), `torso` (spine and chest length), `arms`, `legs`
(length), `head` (size). They become scales on the bones in each bone's rest frame (`boneScales`
in scene.mjs): a bone's children move with its length, its vertices scale about its head.

## Swapping a model

Put a `.gltf` (embedded buffer, one skinned mesh, any number of primitives) in `models/` and
point a slot's `model` at it. It needs the bone names above; other bones are carried along
unposed. Its materials say their fill by `extras.fill` (`"A"`, `"B"` or `"C"`; else the name's
first letter, else A). Its bones should rest with identity rotations like the base human's for
the poses to mean the same thing; a model rigged in another rest pose needs its own poses.
Check it in the viewer, then run `mock.mjs`.
