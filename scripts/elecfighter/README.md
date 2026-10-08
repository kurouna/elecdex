# ELECFIGHTER art

The fighters of ELECFIGHTER (docs/elec16-elecfighter-design.md) are plain humans in wire and
fill, drawn ahead of time. Here they are 3D data; three.js draws them to bitmaps, and the game
imports the bitmaps alone (cells, art rows and boxes), never the models.

| File | What it is |
|---|---|
| `models/human.gltf` | The base human: glTF 2.0, one embedded buffer, a skinned mesh (860 triangles: octagonal limbs, rounded knees and elbows, 6-point fists and shoes at 1x) on 19 bones. Made by `build-models.mjs`. |
| `models/effects.gltf` | `spark` (an icosahedron, the hit spark) and `shard` (a thin triangular prism). |
| `slots.json` | The camera, pixels a metre, and eight fighter slots (four used, four reserved). |
| `poses.json` | The poses: joint rotations per bone, shared by every slot; `rows`, the game's pose rows, a picture each; `tweens`, the in-between pictures; `seq`, each row's pictures in turn; `trans`, the pictures a row begins with by the row before; `throws`, the throw frame by frame. Written by `pose-book.mjs`. |
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

## In-between pictures (`fighters/frames.txt`)

A pose row (its boxes, what the engine's state machine chooses) may show several pictures in
turn. `TWEENS` in `pose-book.mjs` draws each in-between with `blend(a, b, t)` - every
place, turn and pole of two poses interpolated, the limbs solved afresh - and `SEQ` gives a row
its pictures as `[picture, until]`: shown while the row's clock is below `until`, the last one
holding. The clock is the frames since the row began (entering a state again starts it again;
a hitstop holds it), or for the walk's steps (`step: true`) the points walked into the step
(0-7), so walking back plays the step backwards; the step (8 points each) is the one the place
is in now, as the clock is, though the engine chose the pose before the frame's move. At most
four pictures a row. The art script writes `fighters/frames.txt` (shared by every slot: a row
of 10 words, the clock's kind, four art rows and their ends, and the tenth the row's
transitions, `first | count << 8`); `engine/look.e16.ts` (`picStep`) reads it each frame and copies a
new picture into the fighter's room only when it changes. In-betweens have no boxes: the row's
boxes hold for all its pictures, so the fight plays the same whatever is drawn. In
`art.txt` they follow the 61 rows and the two KO rows, in `TWEENS`'s order. A row's thresholds
count from its start, so a slot's quicker or slower move (design 3.1) only shortens or
lengthens its last picture. A row entered after the frame's pose was set (a strike's, a
landing's: its clock 0xffff until the next frame) keeps the picture showing, so a hitstop holds
the picture the blow found.

Some in-betweens are drawn by hand (`DRAWN` in `pose-book.mjs`: the throw's, sitting up, the
tech's stagger); a body a throw carries face down or upside down is posed upright and turned
bodily (`turned`).

### Transitions (`TRANS`, `fighters/transitions.txt`)

A row may begin with other pictures by the row the fighter came from (`fRowWas`, kept by
`poseSet`): `{ from, to, pics }`, rows from and rows to, and at most two `[picture, until]` by
the new row's clock, over the row's own pictures until the last `until` (at most 16 frames).
The row's own sequence keeps its clock underneath, so its thresholds never move. The first entry
whose `from` holds the row before is taken; an entry with no pictures stops later ones.

| From | To | Pictures |
|---|---|---|
| stand, walk, breath (0, 51-54, 60) | crouch, crouch guard (1, 8) | `chalf` 3 |
| crouch, crouch guard, a crouching move's recovery | stand, walk, breath | `chalf` 3 |
| stand, walk, breath | guard (7) | `ghalf` 2 |
| guard | stand, walk, breath | `ghalf` 2 |
| hit (5) / crouching hit (6) | stand rows / crouch | `hit3` 3 / `hitc3` 3 |
| the throw's rows, held (48-50, 58) | guard (the tech) | `stag` 6, `stag2` 12 |
| air hit (11), held (58) | down (9) | none (the row's `bounce` at once) |
| any other | down | `knock` 3 |
| a jump attack (36-47) | jump (3) / land (4) | `jump` 5 / `land` 2 |

`transitions.txt` holds an entry as 3 words, `first | last << 8` of the rows from and two
`art row | until << 8` (art row 255: none); `frames.txt`'s tenth word finds a row's entries
(`first | count << 8`).

### The throw (`THROWS`, `fighters/throws.txt`)

Both fighters of a throw show its own pictures, by the thrower's frames since it took hold (0-25:
the tech window 1-7, the slam at 16, free at 26), forward and back. Keys
`[frame, thrower, turned, thrown, share, off, dy]`: the thrower's picture and whether it is drawn
turned about, the thrown's picture, and where the thrown is drawn - `share` sixteenths of the way
from the thrower to where the thrown stands (16 there), and below 0 of the way to where the slam
will land it (-16 there: the back throw's mirror point, or, with the thrower's back to a wall, in
front of it, where the walls and the bodies' push put it - look.e16.ts `landX`), `off` points
more ahead of the thrower, `dy` points up. The thrower is drawn turned only when the thrown
lands behind it. A picture holds to the next key; the place moves evenly between keys. The art
script writes 26 frames each way (4 words: thrower `art | turned << 8`, thrown the same,
`share & 255 | off << 8`, `dy`); the engine takes the count from the table's length. The thrown's
words from 16 on are never read: from the slam it is down, drawn by its own row. Only the drawing
moves: the thrown has no boxes while held, and its place, the tech window, the slam and the
damage are the engine's (hit.e16.ts).

| Frames | Forward: thrower / thrown | Back: thrower / thrown |
|---|---|---|
| 0-3 | `throw` / `thrown`, where it stands | the same |
| 4-7 | `tpull` / `thrown`, pulled in a little by 4, then still (the tech window: on its feet) | the same |
| 8-9 | `tpull` / `tlift`, off its feet | `tpull`, `theave` / `tlift`, `tface` over the shoulder |
| 10-12 | `theave` / `tair` overhead | `theave` / `tinv`, upside down behind |
| 13-15 | `tslam` / `tair` driven down in front | `tslam` turned / `tair` driven down behind (at a wall: in front, `tslam` not turned) |
| 16-25 | `tslam` (the slam's hitstop), `tsettle` from 19; the thrown is down (its own row) | the same, turned; it faces round when free |

The slam puts the thrown in the down row, whose first picture is the floor's `bounce`.

## Redrawing one pose

1. Edit the pose in `pose-book.mjs` (`BOOK`): the hips' `t` and `r`, a foot's or fist's `at`
   (the ankle or wrist, model metres) and its `knee` or `elbow` pole. A limb reaches at most
   0.815 m from its hip (shin and foot); asked further, it comes out straight towards the
   point. Give a limb stretched straight its `at` where it lands, not past it: an in-between
   blends the two poses' points, so a point far out keeps the blended limb straight too.
   In-betweens blended from it follow by themselves; to add one, give it a name in `TWEENS` and
   a place in a row's `SEQ`.
2. `node scripts/elecfighter/pose-book.mjs` writes `poses.json`.
3. `node scripts/elecfighter-art.mjs` draws every used slot afresh (about 20 s): it overwrites
   each `fighters/<id>/art/cells.png`, `art.txt`, `poses.txt` (the boxes drafted from the new
   drawing), `limbs.txt`, `fighters/frames.txt`, the check pictures
   `docs/elecfighter-mock/p3-boxes-<id>.png` (every row with its boxes, then the in-betweens)
   and the select's busts (drawn from `idle`). It never writes `fighters/<id>/boxes.txt`: the
   lines set by hand there are laid over the draft every time. If the redraw moves a limb a hand
   line names (S3's jabs, S4's kicks), set that line to the new drawing by hand: a hit box must
   stay within 2 points of its limb.
4. `npm run gen:elec16` rebuilds the game (`compiled.s`, `assets.e16.ts`, games.json).
5. Check: open the check picture; `npx vitest run tests/unit/elec16-elecfighter` (its four files; no
   isolated points, the room of 32 cells, every hit box on its limb, light and heavy apart by
   silhouette, the cartridge's banks, the reaches the CPU and the select's REACH bar read). A
   reach that moved may need the design's numbers (3.1), DAEMON's range (`cpu/opponents.txt`)
   and the REACH bar's steps (`scenes/select.e16.ts`) brought along.
