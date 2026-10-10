import { createApp } from 'vue'
import '../index.css'
import { loadSettings } from '../stores/settings'
import OverlayPanel from './OverlayPanel.vue'

// The overlay only needs the settings (steps, hide-complete) and the gathering result; it never loads
// the item, recipe or quest lists (F9-R11).
await loadSettings()
createApp(OverlayPanel).mount('#app')
