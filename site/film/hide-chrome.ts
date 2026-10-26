// Unlisted film routes: the stage covers the viewport, so the docs chrome (and the Next dev badge) are taken out of the way.
export const hideChrome = `div.mx-auto.grid > :is(aside, header) { display: none } html, body { overflow: hidden; background: var(--gray-950) } nextjs-portal { display: none }`
