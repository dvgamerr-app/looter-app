import { createRouter, createWebHashHistory } from 'vue-router'
import { navItems } from './navigation'
import { loadProfiles, useProfiles } from './stores/profiles'
import GameDashboard from './views/GameDashboard.vue'
import GatheringView from './views/GatheringView.vue'
import ItemsView from './views/ItemsView.vue'
import QuestsView from './views/QuestsView.vue'
import RecipesView from './views/RecipesView.vue'
import SettingsView from './views/SettingsView.vue'

const components = {
  dashboard: GameDashboard,
  items: ItemsView,
  recipes: RecipesView,
  quests: QuestsView,
  gathering: GatheringView,
  settings: SettingsView,
}

// Hash history because the production page is loaded from file://.
export const router = createRouter({
  history: createWebHashHistory(),
  routes: navItems.map((item) => ({
    path: item.path,
    name: item.name,
    component: components[item.name],
    meta: { needsProfile: item.needsProfile },
  })),
})

// Pages that need a profile send the user back to the dashboard until one exists (UI/UX Design Plan 2.2).
router.beforeEach(async (to) => {
  await loadProfiles()
  if (to.meta.needsProfile && useProfiles().state.activeProfileId === null) return { name: 'dashboard' }
})
