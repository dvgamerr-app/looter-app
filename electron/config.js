import { existsSync, mkdirSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { app } from 'electron'
import settings from 'electron-settings'
import yaml from 'yaml'

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

const config = {
  config: join(app.getPath('home'), '.items-loot'),
  width: 1160,
  height: 725
}

if (!existsSync(config.config)) mkdirSync(config.config)
settings.configure({
  atomicSave: true,
  dir: config.config,
  fileName: 'settings.json',
  numSpaces: 2,
  prettify: true
})

export const initilizeApp = async () => {
  const themeConfigFile = join(config.config, 'config.yaml')
  await writeFile(themeConfigFile, yaml.stringify({ config, user }))
  // if (!existsSync(themeConfigFile)) {
  //   await writeFile(themeConfigFile, yaml.stringify(configDefault))
  // } else {
  //   const themefile = await readFile(themeConfigFile, { encoding: 'utf8' })
  //   configDefault = Object.assign(configDefault, yaml.parse(themefile))
  // }
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

export const settingApp = ''
