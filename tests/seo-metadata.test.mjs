import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8')

test('canonical metadata is configured for the public origin', () => {
  const layout = read('../app/layout.tsx')
  assert.match(layout, /metadataBase:\s*new URL\('https:\/\/neotechzgz\.vercel\.app'\)/)
  assert.match(layout, /alternates:\s*\{\s*canonical:\s*'\/'\s*\}/)
})

test('sitemap contains public pages only', () => {
  const sitemap = read('../app/sitemap.ts')
  assert.match(sitemap, /\/servicios/)
  assert.match(sitemap, /\/planes/)
  assert.doesNotMatch(sitemap, /\/(?:login|register|account|admin)(?:['`]|\$\{base\})/)
})

test('robots blocks API and private routes', () => {
  const robots = read('../app/robots.ts')
  for (const path of ['/api/', '/account', '/admin', '/login', '/register', '/auth']) {
    assert.ok(robots.includes(path), `missing robots disallow for ${path}`)
  }
})

test('auth and account routes are marked noindex', () => {
  for (const path of ['../app/login/layout.tsx', '../app/register/layout.tsx', '../app/account/layout.tsx']) {
    assert.match(read(path), /index:\s*false/)
    assert.match(read(path), /follow:\s*false/)
  }
})
