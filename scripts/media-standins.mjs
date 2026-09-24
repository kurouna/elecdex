/*
 * Stand-ins for the media shot's web panes. They are meant to read as a television's video
 * home and a social timeline at a glance - dark, rows of pictures, posts with avatars - without
 * copying either site: no logo, no wordmark, no one's name or post, only made-up channels,
 * accounts and pictures drawn here (user decision 2026-09-24: "like it, not a copy").
 */

/** Pictures drawn here, each its own page so it can fill a frame of any size. */
const SCENES = {
  sunset: `<style>
html,body{margin:0;height:100%;overflow:hidden;background:#0b0620}
.sky{position:absolute;inset:0 0 38% 0;background:linear-gradient(#0b0620,#3a0d52 55%,#b3246a 85%,#ff7a4d)}
.sun{position:absolute;left:50%;bottom:30%;width:34vh;height:34vh;margin-left:-17vh;border-radius:50%;
background:linear-gradient(#ffe066,#ff7a4d 60%,#ff3d7f);
-webkit-mask:linear-gradient(#000 0 50%,transparent 50% 54%,#000 54% 62%,transparent 62% 67%,#000 67% 74%,transparent 74% 80%,#000 80% 86%,transparent 86% 92%,#000 92%)}
.ground{position:absolute;inset:62% 0 0 0;background:#12051f;perspective:30vh;overflow:hidden}
.grid{position:absolute;inset:-100% -50% 0 -50%;transform:rotateX(62deg);transform-origin:bottom;
background-image:linear-gradient(#ff3dd4 2px,transparent 2px),linear-gradient(90deg,#ff3dd4 2px,transparent 2px);
background-size:6vh 6vh;opacity:.75}
.hills{position:absolute;left:0;right:0;bottom:38%;height:14vh;background:#1a0630;
clip-path:polygon(0 100%,0 60%,8% 30%,17% 62%,27% 20%,38% 70%,50% 45%,61% 75%,72% 25%,83% 58%,92% 35%,100% 55%,100% 100%)}
</style><div class="sky"></div><div class="sun"></div><div class="hills"></div><div class="ground"><div class="grid"></div></div>`,
  city: `<style>
html,body{margin:0;height:100%;overflow:hidden;background:linear-gradient(#020617,#0b1d3a 60%,#16325c)}
.moon{position:absolute;right:14%;top:9%;width:14vh;height:14vh;border-radius:50%;background:#e8f1ff;box-shadow:0 0 40px #9cc3ff}
.row{position:absolute;left:0;right:0;display:flex;align-items:flex-end;gap:1vh}
.b{flex:1;background:#050b18;background-image:radial-gradient(#ffd66b 30%,transparent 32%);background-size:3vh 4.4vh;background-position:.8vh 1vh}
.far .b{background-color:#0d1a33;opacity:.8}
.water{position:absolute;left:0;right:0;bottom:0;height:10vh;background:linear-gradient(#0a1a33,#020617)}
</style><div class="moon"></div>
<div class="row far" style="bottom:10vh">${[44, 62, 50, 76, 55, 68, 48, 80, 58, 70].map((h) => `<div class="b" style="height:${h}vh"></div>`).join('')}</div>
<div class="row" style="bottom:10vh">${[30, 50, 38, 60, 34, 46, 56, 36, 48, 32].map((h) => `<div class="b" style="height:${h}vh"></div>`).join('')}</div>
<div class="water"></div>`,
  aurora: `<style>html,body{margin:0;height:100%;overflow:hidden;background:linear-gradient(#01060f,#062a2a 55%,#0b3b2e)}
.a{position:absolute;left:-10%;right:-10%;height:40vh;border-radius:50%;filter:blur(3vh);opacity:.8}
.m{position:absolute;left:0;right:0;bottom:0;height:28vh;background:#020a0c;clip-path:polygon(0 100%,0 40%,20% 10%,35% 55%,55% 0,75% 50%,100% 20%,100% 100%)}
</style><div class="a" style="top:10vh;background:linear-gradient(90deg,transparent,#3dffb0,#27c2ff,transparent)"></div>
<div class="a" style="top:24vh;background:linear-gradient(90deg,transparent,#a64dff,#3dffb0,transparent);opacity:.5"></div><div class="m"></div>`,
  circuit: `<style>html,body{margin:0;height:100%;overflow:hidden;background:#04110b;
background-image:linear-gradient(#0f3 1px,transparent 1px),linear-gradient(90deg,#0f3 1px,transparent 1px);background-size:8vh 8vh}
.c{position:absolute;left:30%;top:28%;width:40%;height:44%;border:1vh solid #19ff7a;border-radius:2vh;box-shadow:0 0 6vh #19ff7a66;background:#021a0e}
</style><div class="c"></div>`,
  dunes: `<style>html,body{margin:0;height:100%;overflow:hidden;background:linear-gradient(#ffb36b,#ff7a59 45%,#6b2a4a)}
.d{position:absolute;left:-20%;right:-20%;border-radius:50% 50% 0 0}
</style><div class="d" style="bottom:-30vh;height:70vh;background:#c2553f"></div><div class="d" style="bottom:-45vh;height:70vh;left:10%;background:#8f3438"></div>`,
  ocean: `<style>html,body{margin:0;height:100%;overflow:hidden;background:linear-gradient(#0a2a55,#1a6ea8 50%,#07324f 50%,#021526)}
.s{position:absolute;left:40%;top:30%;width:20vh;height:20vh;border-radius:50%;background:#fff3c4;box-shadow:0 0 8vh #fff3c4}
</style><div class="s"></div>`,
  forest: `<style>html,body{margin:0;height:100%;overflow:hidden;background:linear-gradient(#bfe3d0,#6aa88a)}
.t{position:absolute;bottom:0;width:0;height:0;border-left:9vh solid transparent;border-right:9vh solid transparent}
</style>${[5, 18, 31, 44, 57, 70, 83].map((x, i) => `<div class="t" style="left:${x}%;border-bottom:${50 + (i % 3) * 14}vh solid ${i % 2 ? '#1f5a44' : '#2d7a5a'}"></div>`).join('')}`,
}

const scene = (name) =>
  `<!doctype html><html><head><meta charset="utf-8"><title>${name}</title></head><body>${SCENES[name]}</body></html>`

/*
 * A television's video home: a rail of plain icons, the featured video large with its
 * title over it, and a row of thumbnails beneath with made-up channels. The rail and
 * the red dot on the featured title are generic; there is no logo anywhere.
 */
const TV_ROW = [
  ['aurora', 'Aurora over the fjord, 4K', 'Northern Window', '1.2M views'],
  ['circuit', 'Building a clock from logic chips', 'Bench Notes', '380K views'],
  ['dunes', 'Desert drive at golden hour', 'Long Roads', '96K views'],
  ['ocean', 'Moonrise over a quiet sea', 'Slow Coast', '2.4M views'],
  ['forest', 'Rain in the pines - 3 hours', 'Quiet Hours', '5.1M views'],
]

const TV = `<!doctype html><html><head><meta charset="utf-8"><title>Home</title><style>
html,body{margin:0;height:100%;overflow:hidden;background:#0f0f0f;color:#f1f1f1;font-family:system-ui,sans-serif}
.rail{position:absolute;left:0;top:0;bottom:0;width:8vh;display:flex;flex-direction:column;align-items:center;gap:4vh;padding-top:6vh;background:#0a0a0a}
.rail i{display:block;width:3.2vh;height:3.2vh;border:.4vh solid #aaa;border-radius:.8vh}
.rail i:first-child{border-color:#fff;background:#fff3}
.rail i.round{border-radius:50%}
.main{position:absolute;left:8vh;right:0;top:0;bottom:0;padding:4vh 4vh 0}
.hero{position:relative;height:58%;border-radius:1.4vh;overflow:hidden}
.hero iframe,.thumb iframe{border:0;width:100%;height:100%;pointer-events:none}
.hero .shade{position:absolute;inset:0;background:linear-gradient(90deg,#000c,transparent 60%)}
.hero .text{position:absolute;left:4vh;bottom:4vh;max-width:50%}
.hero h1{margin:0 0 1vh;font-size:5vh;font-weight:700;letter-spacing:.02em}
.hero p{margin:0 0 2vh;font-size:2vh;color:#ddd}
.hero .play{display:inline-flex;align-items:center;gap:1.2vh;padding:1.2vh 2.6vh;border-radius:5vh;background:#f1f1f1;color:#0f0f0f;font-weight:700;font-size:2vh}
.hero .play b{width:0;height:0;border-left:1.6vh solid #0f0f0f;border-top:1vh solid transparent;border-bottom:1vh solid transparent}
.live{display:inline-block;margin-right:1vh;padding:.2vh 1vh;border-radius:.5vh;background:#e02020;font-size:1.6vh;font-weight:700;vertical-align:middle}
h2{margin:3vh 0 1.6vh;font-size:2.4vh;font-weight:600}
.row{display:flex;gap:2vh}
.card{flex:0 0 22%}
.thumb{height:13vh;border-radius:1vh;overflow:hidden;background:#222}
.card .t{margin-top:1vh;font-size:1.8vh;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.card .c{font-size:1.5vh;color:#aaa}
</style></head><body>
<div class="rail"><i></i><i class="round"></i><i></i><i></i><i class="round"></i></div>
<div class="main">
<div class="hero"><iframe src="/scene/sunset"></iframe><div class="shade"></div>
<div class="text"><h1><span class="live">LIVE</span>NIGHT DRIVE</h1><p>Synthwave radio · Neon Hours · 12K watching</p>
<span class="play"><b></b>Play</span></div></div>
<h2>Recommended</h2>
<div class="row">${TV_ROW.map(([s, t, c, v]) => `<div class="card"><div class="thumb"><iframe src="/scene/${s}"></iframe></div><div class="t">${t}</div><div class="c">${c} · ${v}</div></div>`).join('')}</div>
</div></body></html>`

/*
 * A social timeline: two tabs at the top, then posts - a round avatar with initials, a
 * name and a handle, the text, sometimes a picture, and counts under it. Plain shapes
 * for the actions and no bird, no letter mark: it reads as a timeline, not as the site.
 */
const POSTS = [
  [
    'NH',
    '#7c5cff',
    'Neon Hours',
    '@neonhours',
    '2m',
    "Tonight's set is live - three hours of synthwave for the drive home.",
    'sunset',
    [24, 118, 1.2],
  ],
  [
    'CL',
    '#1d9bf0',
    'City Lights Daily',
    '@citylights',
    '14m',
    'The skyline after the rain, from the 40th floor.',
    'city',
    [8, 64, 740],
  ],
  [
    'BN',
    '#19b36b',
    'Bench Notes',
    '@benchnotes',
    '1h',
    'New video: a clock built from 74-series chips, and why it runs two seconds fast.',
    null,
    [31, 22, 410],
  ],
  [
    'QH',
    '#f59e0b',
    'Quiet Hours',
    '@quiethours',
    '3h',
    'Three hours of rain in a pine forest. Headphones recommended.',
    'forest',
    [5, 40, 2.1],
  ],
]

const count = (n) => (n < 10 ? `${n}K` : `${n}`)

const SOCIAL = `<!doctype html><html><head><meta charset="utf-8"><title>Timeline</title><style>
html,body{margin:0;background:#000;color:#e7e9ea;font-family:system-ui,sans-serif;font-size:15px}
.tabs{position:sticky;top:0;display:flex;border-bottom:1px solid #2f3336;background:#000d}
.tabs div{flex:1;padding:16px 0;text-align:center;color:#71767b;font-weight:600}
.tabs div.on{color:#e7e9ea;box-shadow:inset 0 -4px 0 #1d9bf0}
.post{display:flex;gap:12px;padding:12px 16px;border-bottom:1px solid #2f3336}
.av{flex:none;width:40px;height:40px;border-radius:50%;display:grid;place-items:center;font-weight:700;color:#fff;font-size:14px}
.body{flex:1;min-width:0}
.who b{color:#e7e9ea}.who span{color:#71767b}
.text{margin:2px 0 8px;line-height:1.35}
.pic{height:170px;border:1px solid #2f3336;border-radius:16px;overflow:hidden;margin-bottom:8px}
.pic iframe{border:0;width:100%;height:100%;pointer-events:none}
.acts{display:flex;justify-content:space-between;max-width:320px;color:#71767b;font-size:13px}
.acts span::before{content:'';display:inline-block;width:12px;height:12px;margin-right:6px;border:1.5px solid #71767b;vertical-align:-2px}
.acts span:nth-child(1)::before{border-radius:50% 50% 50% 0}
.acts span:nth-child(2)::before{border-radius:2px}
.acts span:nth-child(3)::before{border-radius:50%}
</style></head><body>
<div class="tabs"><div class="on">For you</div><div>Following</div></div>
${POSTS.map(
  ([ini, colour, name, handle, ago, text, pic, [r, s, l]]) =>
    `<div class="post"><div class="av" style="background:${colour}">${ini}</div><div class="body">
<div class="who"><b>${name}</b> <span>${handle} · ${ago}</span></div>
<div class="text">${text}</div>
${pic ? `<div class="pic"><iframe src="/scene/${pic}"></iframe></div>` : ''}
<div class="acts"><span>${r}</span><span>${s}</span><span>${count(l)}</span></div></div></div>`,
).join('')}
</body></html>`

/** The page for a path of the stand-in server, or null. */
export function standInPage(url) {
  if (url.startsWith('/scene/')) {
    const name = url.slice('/scene/'.length).replace(/[/?].*$/, '')
    return SCENES[name] === undefined ? null : scene(name)
  }
  if (url.startsWith('/tv/')) return TV
  if (url.startsWith('/x/')) return SOCIAL
  return null
}
