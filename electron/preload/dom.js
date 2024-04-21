export const domReady = (condition = ['complete', 'interactive']) => {
  return new Promise((resolve) => {
    if (condition.includes(document.readyState)) {
      resolve(true)
    } else {
      document.addEventListener('readystatechange', () => {
        if (condition.includes(document.readyState)) {
          resolve(true)
        }
      })
    }
  })
}

export const safeDOM = {
  append(parent, child) {
    if (!Array.from(parent.children).find((e) => e === child)) {
      return parent.appendChild(child)
    }
  },
  remove(parent, child) {
    if (Array.from(parent.children).find((e) => e === child)) {
      return parent.removeChild(child)
    }
  },
}

export const createPreloading = (user) => {
  const oStyle = document.createElement('style')
  const oDiv = document.createElement('div')

  oStyle.id = 'loading-style'
  // const rootTheme: string = ''
  /**
   * https://tobiasahlin.com/spinkit
   * https://connoratherton.com/loaders
   * https://projects.lukehaas.me/css-loaders
   * https://matejkustec.github.io/SpinThatShit
   */
  const className = `logo-menu`
  oStyle.innerHTML = `
:root {
  --system-titleBar-height: 31px;
  --user-text-color: ${user.textColor};
  --user-background-color: ${user.backgroundColor};
}

body {
  --user-titlebar-foreground: ${user.titlebar.activeForeground};
  --user-titlebar-background: ${user.titlebar.activeBackground};
}
body.inactive {
  --user-titlebar-foreground: ${user.titlebar.inactiveForeground};
  --user-titlebar-background: ${user.titlebar.inactiveBackground};
}

@keyframes ellipsis {
  to { width: 22px; }
}
@keyframes fadeIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}
@keyframes fadeOut {
  0% { opacity: 1; }
  100% { opacity: 0; }
}
@keyframes loader {
  0% { box-shadow: 0 40px 0 var(--user-titlebar-foreground); }
  100% { box-shadow: 0 20px 0 var(--user-titlebar-foreground); }
}
.fade-out { animation: fadeOut .3s both; }
.fade-in { animation: fadeIn .3s both; }

.${className}, .${className}:after, .${className}:before  {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  box-shadow: 0 40px 0 var(--user-titlebar-foreground);
  animation: loader 0.8s ease-in-out alternate infinite;
}
.${className}:after, .${className}:before {
  content: '';
  position: absolute;
}

.${className} {
  position: relative;
  animation-delay: 0.32s;
  transform: scale(0.3);
}
.${className}:after {
  right: -30px;
  animation-delay: 0.16s;
}
.${className}:before {
  left: -30px;
  animation-delay: 0.48s;
}
.wrap {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--user-titlebar-background);
  display: flex;
  flex-direction: column;
  z-index: 9;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-size: 0.85rem;
  font-weight: 400;
  color: var(--user-text-color);
}
.wrap .text {
  color: #919191;
  font-size: 0.7rem;
  letter-spacing: .05em;
  margin-top: 15px;
}
// .wrap .text:after {
//   font-size: 1.3rem;
//   content: '\\2026';
//   overflow: hidden;
//   display: inline-block;
//   vertical-align: bottom;
//   animation: ellipsis steps(4, end) 1200ms infinite;
//   width: 0px;
// }

    `
  oDiv.id = 'loading'
  oDiv.className = 'wrap'
  oDiv.innerHTML = `
<div class="payload-icon ${className}"></div>
<div class="payload-msg"><div class="text">Initialize</div></div>
`

  return {
    append() {
      safeDOM.append(document.head, oStyle)
      safeDOM.append(document.body, oDiv)
      document.addEventListener('readystatechange', this.remove)
    },
    remove() {
      oDiv.classList.add('fade-out')
      setTimeout(() => {
        safeDOM.remove(document.body, oDiv)
      }, 300)
    },
  }
}
