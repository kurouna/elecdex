# ELECFIGHTER art

The fighters of ELECFIGHTER (docs/elec16-elecfighter-design.md) are plain humans in wire and
fill, drawn ahead of time. Here they are 3D data; three.js draws them to bitmaps, and the game
imports the bitmaps alone (cells, art rows and boxes), never the models.

| File | What it is |
|---|---|
| `models/human.gltf` | The base human: glTF 2.0, one embedded buffer, a skinned mesh (860 triangles: octagonal limbs, rounded knees and elbows, 6-point fists and shoes at 1x) on 19 bones. Made by `build-models.mjs`. |
| `models/effects.gltf` | `spark` (an icosahedron, the hit spark) and `shard` (a thin triangular plate). |
| `slots.json` | The camera, pixels a metre, and eight fighter slots (four used, four reserved). |
| `poses.json` | The poses: joint rotations per bone, shared by every slot, and `rows`: the game's pose rows, a picture each. Written by `pose-book.mjs`. |
| `pose-book.mjs` | The poses as described by hand: where the hips sit, where each fist and foot goes, which way knees and elbows point. Edit here, run it, and it writes `poses.json`. |
| `ik.mjs` | The posing helper: forward kinematics from a model's glTF and a two-bone solver (hinged knees and elbows). |
| `fighters.mjs`, `effects.mjs` | The game's fighters (cells, art rows, drafted boxes, limbs, KO pieces, a check picture) and effects (spark, firewall, shadows), for `scripts/elecfighter-art.mjs`. |
| `screens.mjs` | The game's screens' pictures: the bands' large letters (`art/big.png`), the title's map (`art/title.png`: the stage and the logo, lettered here from the bold font), the select's busts (`art/busts.png`, `art/busts.txt`: each slot drawn again with the camera nearer). |
| `svg/stage.svg`, `svg/hud.svg` | The stage (512 x 288, BG0) and the HUD frame (320 x 36, BG1), in palette colours only. |
| `svg/logo.svg` | The title's logo, drawn into the title's map by `screens.mjs`. |
| `stage.mjs` | The game's stage GRID from `svg/stage.svg`: its map (`stages/grid/art/stage.png`), the stage palette's row and `stages/grid/stage.txt` (the raster's bands and floor lines). Run by `node scripts/elecfighter-art.mjs`; the PNG is the source afterwards. |
| `scene.mjs` | The scene both the viewer and the bitmap renderer use: posing, build, materials, wire, camera, light. |
| `viewer.html`, `viewer.mjs` | The design viewer. |
| `render.html`, `render-page.mjs`, `render-main.mjs`, `bitmaps.mjs` | The bitmap renderer: three.js's WebGLRenderer in a hidden Electron window. |
| `mock.mjs` | Writes `docs/elecfighter-mock/human-*.png` and prints the counts. |

```bash
node scripts/elecfighter/mock.mjs           # every mock PNG (Electron, SwiftShader; ELECFIGHTER_GPU=1 for the GPU)
node scripts/elecfighter/serve.mjs          # the viewer: open the address it prints
node scripts/elecfighter/build-models.mjs   # only to make the base models afresh
node scripts/elecfighter/pose-book.mjs      # poses.json afresh from the pose book
node scripts/elecfighter-art.mjs            # the game's pictures afresh (overwrites them; `stage` for the stage alone)
```

## How a bitmap is drawn

- Orthographic camera, the fighter facing screen right, turned `camera.yaw` degrees toward
  the viewer and looked at `camera.pitch` degrees down; one light from the upper front, fixed in
  the world. No anti-aliasing, pixel ratio 1, a render target with nearest filtering.
- Fills are flat, three tones a material (lit, mid, shade) by the face's angle to the light;
  wire is 1-pixel `LineSegments`, depth-tested (the fills carry a polygon offset): the outline
  and the borders between materials in bright wire, creases sharper than 50 degrees on the near
  side in dim wire (an octagonal limb's 45-degree faces draw none, so no stripes). The far side
  (bones ending `_l`, unless a pose lists them in `near`) is one flat shade inside a dim outline.
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

Written by `pose-book.mjs`: edit the book, not the file. The stance leads with the near side
(the right fist and foot forward), so the chest turns from the camera and the body reads
side-on; light strikes come from the lead side, heavy ones from the rear side with the body
turning through (their limb listed in `near`). `strikes` names the bones an active picture strikes
with: the art script drafts its hit box from them (and leaves them out of the hurt boxes).
`rows` lists the game's pose rows (engine/fighter.e16.ts) by picture; rows may share one.

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

## In the game (`scripts/elecfighter-art.mjs`)

Every used slot in every picture of `rows` is cut into 16 x 16 cells (empty ones dropped) and
written into the game's folder: `fighters/<id>/art/cells.png` (the source from then on),
`art.txt` (each row's first cell, count and places; the last two rows are the KO's pieces, the
`down` and `air` poses' own triangles in pieces that each fit a cell, the game taking the one of
the pose the fighter breaks in; every picture of a slot moved up so the stand's lowest point is
on the foot line), `poses.txt` (boxes drafted from the posed
model: hurt boxes round the upper body and the legs, the striking limb's box as the hit box from
10 points ahead, a heavy's recovery leaving its limb as a third hurt box; a crouch's hurt boxes
all 60 high; the anti-air's split at its invulnerable line; then `boxes.txt`, set by hand and
never written once there, laid over them) and `limbs.txt` (the striking limbs, for the tests).
`docs/elecfighter-mock/p3-boxes-<id>.png` shows the boxes over the poses.
