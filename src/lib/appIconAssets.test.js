import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

function pngSize(path) {
  const b = fs.readFileSync(path)
  assert.equal(b.subarray(1, 4).toString(), 'PNG')
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) }
}

test('publishes the existing pnvPlan music logo as install icons', () => {
  const html = fs.readFileSync('index.html', 'utf8')
  assert.match(html, /rel="apple-touch-icon" href="%BASE_URL%apple-touch-icon\.png"/)
  assert.match(html, /rel="manifest" href="%BASE_URL%site\.webmanifest"/)

  assert.deepEqual(pngSize('public/apple-touch-icon.png'), { width: 180, height: 180 })
  assert.deepEqual(pngSize('public/icon-192.png'), { width: 192, height: 192 })
  assert.deepEqual(pngSize('public/icon-512.png'), { width: 512, height: 512 })

  const manifest = JSON.parse(fs.readFileSync('public/site.webmanifest', 'utf8'))
  assert.equal(manifest.name, 'pnvPlan')
  assert.deepEqual(manifest.icons.map((icon) => icon.src), ['icon-192.png', 'icon-512.png'])
})
