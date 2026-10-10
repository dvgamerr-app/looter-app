import { createApp } from 'vue'
import '../index.css'
import CaptureSelection from './CaptureSelection.vue'

// No store is loaded here: the page only needs the frame the main process sends to this window.
createApp(CaptureSelection).mount('#app')
