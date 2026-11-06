// Pre-renders every possible answer as a static asset.
// Static asset requests are served by Cloudflare without invoking the Worker,
// so they're free and don't count toward the Workers request quota.
//
// Only uppercase numerals are written: macOS filesystems are case-insensitive,
// so `MCMXCIV` and `mcmxciv` would clobber each other. Lowercase and mixed-case
// requests fall through to the Worker, which redirects to the canonical form.

const fs = require('fs')
const path = require('path')
const { romanize } = require('../../romans.js')

const OUT = path.join(__dirname, '..', 'public')

fs.rmSync(OUT, { recursive: true, force: true })
fs.mkdirSync(OUT)

for (let decimal = 1; decimal < 4000; decimal++) {
  const roman = romanize(decimal)
  const body = `${JSON.stringify({ decimal, roman })}\n`
  fs.writeFileSync(path.join(OUT, String(decimal)), body)
  fs.writeFileSync(path.join(OUT, roman), body)
}

// Extensionless files would otherwise be served as application/octet-stream.
fs.writeFileSync(
  path.join(OUT, '_headers'),
  `/*
  Content-Type: application/json; charset=utf-8
  Cache-Control: public, max-age=31536000, immutable
  Access-Control-Allow-Origin: *
  X-Powered-By: Ancient Rome
`
)

console.log(`Wrote ${fs.readdirSync(OUT).length} files to ${OUT}`)
