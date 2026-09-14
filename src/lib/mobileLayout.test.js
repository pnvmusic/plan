import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8')
const layout = readFileSync(new URL('../components/Layout.jsx', import.meta.url), 'utf8')

const compact = (value) => value.replace(/\s+/g, '')
const compactCss = compact(css)

test('mobile shell respects iPhone top and side safe areas', () => {
  assert.match(compactCss, /\.topbar\{[^}]*padding-top:max\([^}]*env\(safe-area-inset-top\)/)
  assert.match(compactCss, /\.topbar\{[^}]*padding-left:max\([^}]*env\(safe-area-inset-left\)/)
  assert.match(compactCss, /\.topbar\{[^}]*padding-right:max\([^}]*env\(safe-area-inset-right\)/)
  assert.match(compactCss, /\.sidebar\{[^}]*padding-top:env\(safe-area-inset-top\)/)
})

test('mobile navigation exposes a reachable accessible menu control', () => {
  assert.match(layout, /aria-label="เปิดเมนู"/)
  assert.match(layout, /aria-expanded=\{open\}/)
  assert.match(compactCss, /\.menu-toggle\{[^}]*min-width:44px[^}]*min-height:44px/)
})

test('mobile scrolling avoids accidental page-width overflow and delayed taps', () => {
  assert.match(compactCss, /html,body\{[^}]*overflow-x:hidden/)
  assert.match(compactCss, /button,[^}]*\{[^}]*touch-action:manipulation/)
  assert.match(compactCss, /\.scroll-x\{[^}]*-webkit-overflow-scrolling:touch/)
})
