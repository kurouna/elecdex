import '@fontsource/chakra-petch/latin-400.css'
import '@fontsource/chakra-petch/latin-600.css'
import '@fontsource/saira-condensed/latin-300.css'
import '@fontsource/saira-condensed/latin-500.css'
import '@fontsource/saira-condensed/latin-700.css'
import '@fontsource-variable/jetbrains-mono/index.css'
import './styles/tokens.css'
import './styles/reset.css'
import './styles/frames.css'
import './styles/crt.css'
import './styles/cloud-pane.css'
import './styles/motion.css'
import './styles/effects.css'
import './styles/press.css'

import { mount } from 'svelte'
import App from './App.svelte'
import { mendCanvasFonts } from './lib/canvas-font.ts'
import { watchPageFaults } from './lib/fault-report.ts'

// An exception nothing caught is said as a toast, so it reaches whoever can report it.
watchPageFaults()
// Before any shell draws: this Chromium drops the font xterm gives its glyphs (lib/canvas-font.ts).
mendCanvasFonts()

const target = document.getElementById('app')
if (!target) throw new Error('#app mount point is missing from index.html')

mount(App, { target })
