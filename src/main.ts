import { createApp } from 'vue'
import './index.css'
import App from './App.vue'
import { router } from './router'
import { loadProfiles } from './stores/profiles'
import { loadSettings } from './stores/settings'

// Load both stores first so the first paint already shows the right profile and sidebar state.
await Promise.all([loadProfiles(), loadSettings()])
createApp(App).use(router).mount('#app')
