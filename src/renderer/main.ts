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

import { mount } from 'svelte'
import App from './App.svelte'

const target = document.getElementById('app')
if (!target) throw new Error('#app mount point is missing from index.html')

mount(App, { target })
