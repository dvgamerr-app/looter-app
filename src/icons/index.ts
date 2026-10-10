// 24x24 stroke icons (fill none, stroke currentColor). Each icon is a list of SVG path `d` strings, so
// the renderer never needs v-html.
export const icons = {
  dashboard: ['M3 10.5 12 3l9 7.5', 'M5 9.5V21h14V9.5', 'M10 21v-6h4v6'],
  items: ['M21 8 12 3 3 8l9 5 9-5Z', 'M3 8v8l9 5 9-5V8', 'M12 13v8'],
  recipes: ['m14 7 3 3', 'm4 20 9-9', 'm13 6 5-3 3 3-3 5-3-1-1-3Z'],
  quests: ['M12 4v11', 'M12 17.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 1 0 0-3Z'],
  gathering: ['M8 6h13', 'M8 12h13', 'M8 18h13', 'M3 6h.01', 'M3 12h.01', 'M3 18h.01'],
  settings: [
    'M12 9a3 3 0 1 0 0 6 3 3 0 1 0 0-6Z',
    'M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1',
  ],
  capture: [
    'M4 8V5a1 1 0 0 1 1-1h3',
    'M16 4h3a1 1 0 0 1 1 1v3',
    'M20 16v3a1 1 0 0 1-1 1h-3',
    'M8 20H5a1 1 0 0 1-1-1v-3',
    'M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 1 0 0-5Z',
  ],
  overlay: ['M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z', 'M13 9h5v6h-5z'],
  plus: ['M12 5v14M5 12h14'],
  edit: ['M4 20h4L19 9l-4-4L4 16v4Z', 'm13.5 6.5 4 4'],
  delete: ['M4 7h16', 'M10 11v6M14 11v6', 'M6 7l1 13h10l1-13', 'M9 7V4h6v3'],
  chevronLeft: ['m15 6-6 6 6 6'],
  chevronRight: ['m9 6 6 6-6 6'],
  chevronDown: ['m6 9 6 6 6-6'],
  check: ['m5 12 5 5L20 7'],
  warning: ['M12 3 2 20h20L12 3Z', 'M12 10v5', 'M12 18h.01'],
  close: ['M6 6l12 12M18 6 6 18'],
  minus: ['M5 12h14'],
  pin: ['M12 17v5', 'M9 3h6l-1 6 3 3v2H7v-2l3-3-1-6Z'],
  search: ['M11 4a7 7 0 1 0 0 14 7 7 0 1 0 0-14Z', 'm20 20-4-4'],
  drag: ['M9 6h.01', 'M15 6h.01', 'M9 12h.01', 'M15 12h.01', 'M9 18h.01', 'M15 18h.01'],
  arrowUp: ['M12 19V5', 'm5 12 7-7 7 7'],
  arrowDown: ['M12 5v14', 'm19 12-7 7-7-7'],
  image: ['M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z', 'M8.5 9a1 1 0 1 0 0 2 1 1 0 1 0 0-2Z', 'm4 17 5-5 4 4 3-3 4 4'],
  more: ['M5 11.5a.5.5 0 1 0 0 1 .5.5 0 1 0 0-1Z', 'M12 11.5a.5.5 0 1 0 0 1 .5.5 0 1 0 0-1Z', 'M19 11.5a.5.5 0 1 0 0 1 .5.5 0 1 0 0-1Z'],
} as const satisfies Record<string, readonly string[]>

export type IconName = keyof typeof icons
