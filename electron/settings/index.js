// import { existsSync, mkdirSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { screen } from 'electron'
import yaml from 'yaml'
import { debounce } from '../helper'


const user = {
  textColor: '#e8e8e8',
  backgroundColor: '#1c1c1f',
  titlebar: {
    activeBackground: '#1c1c1f',
    activeForeground: '#004fe9',
    inactiveBackground: '#18181a',
    inactiveForeground: '#8f8f8f'
  }
}

// const config = {
//   config: join(app.getPath('home'), '.infra'),
//   width: 1160,
//   height: 725
// }

// if (!existsSync(config.config)) mkdirSync(config.config)
// settings.configure({
//   atomicSave: true,
//   dir: config.config,
//   fileName: 'settings.json',
//   numSpaces: 2,
//   prettify: true
// })

export const initilizeApp = async () => {
  const themeConfigFile = join(config.config, 'config.yaml')
  await writeFile(themeConfigFile, yaml.stringify({ config, user }))
  return { config, user }
}

// export const config = {
//   width: 1160,
//   height: 725,
//   titleBar: {
//     color: '#1c1c1f',
//     symbolColor: '#0052ec'
//   }
// }

export const themeExternal = (fileyaml) => {
  console.log('fileyaml: %s', fileyaml)
}

const eventSetPosition = (mainWindow) => {
  let [winX, winY] = mainWindow.getPosition()
  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  const [winWidth, winHeight] = mainWindow.getSize()
  if (winX < 0) winX = 0
  if (winX > width - winWidth) winX = width - winWidth
  if (winY < 0) winY = 0
  if (winY > height - winHeight) winY = height - winHeight
  // settings.set('position', { x: winX, y: winY })
  const config = {
    maximized: mainWindow.isMaximized(),
    width: winWidth,
    height: winHeight,
    x: winX,
    y: winY
  }

  console.log(config)
  if (config.maximized) {
    console.log({ maximized: config.maximized })
    // settings.set('position.maximized', config.maximized)
  } else {
    console.log({ config })
    // settings.set('position', config)
  }
}

export const onWindowPositionEvent = (mainWindow) =>
  debounce(() => eventSetPosition(mainWindow), 200)
