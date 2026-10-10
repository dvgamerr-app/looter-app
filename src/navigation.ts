import type { IconName } from './icons'

export interface NavItem {
  name: 'dashboard' | 'items' | 'recipes' | 'quests' | 'gathering' | 'settings'
  path: string
  label: string
  icon: IconName
  /** Ctrl+<n> shortcut. */
  shortcut: number
  /** The page needs an active profile (UI/UX Design Plan section 2.2). */
  needsProfile: boolean
}

export const navItems: NavItem[] = [
  { name: 'dashboard', path: '/', label: 'Dashboard', icon: 'dashboard', shortcut: 1, needsProfile: false },
  { name: 'items', path: '/items', label: 'Items', icon: 'items', shortcut: 2, needsProfile: true },
  { name: 'recipes', path: '/recipes', label: 'Recipes', icon: 'recipes', shortcut: 3, needsProfile: true },
  { name: 'quests', path: '/quests', label: 'Quests', icon: 'quests', shortcut: 4, needsProfile: true },
  { name: 'gathering', path: '/gathering', label: 'Gathering List', icon: 'gathering', shortcut: 5, needsProfile: true },
  { name: 'settings', path: '/settings', label: 'Settings', icon: 'settings', shortcut: 6, needsProfile: false },
]
