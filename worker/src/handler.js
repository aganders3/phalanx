// Fallback for anything that isn't a pre-rendered static asset:
// the landing page, non-canonical input (redirects), and errors.

const { romanize, deromanize } = require('../../romans.js')

const CREDIT_URL = 'https://github.com/qbunt/romans'

const escapeHtml = (s) =>
  s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

const wantsHtml = (request) =>
  (request.headers.get('Accept') || '').includes('text/html')

const footer = (env) => ({
  powered_by: CREDIT_URL,
  ...(env.TIP_URL ? { tip_jar: env.TIP_URL } : {})
})

const htmlPage = (env, title, message) => {
  const tip = env.TIP_URL
    ? ` &middot; <a href="${escapeHtml(env.TIP_URL)}">Toss a denarius in the tip jar</a>`
    : ''
  return `<!DOCTYPE html>
<html lang="la">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
  body { font-family: Georgia, serif; max-width: 36rem; margin: 4rem auto; padding: 0 1rem; line-height: 1.5; }
  h1 { letter-spacing: 0.1em; }
  code { background: #f3efe6; padding: 0.1em 0.3em; }
  footer { margin-top: 3rem; font-size: 0.9em; color: #666; }
</style>
<h1>${escapeHtml(title)}</h1>
<p>${message}</p>
<footer>Powered by <a href="${CREDIT_URL}">romans</a>${tip}</footer>
</html>
`
}

const respond = (request, env, status, title, message, data) => {
  if (wantsHtml(request)) {
    return new Response(htmlPage(env, title, message), {
      status,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    })
  }
  return Response.json({ ...data, ...footer(env) }, {
    status,
    headers: { 'Access-Control-Allow-Origin': '*' }
  })
}

const redirect = (url, target) =>
  new Response(null, {
    status: 301,
    headers: {
      Location: new URL(`/${target}`, url).toString(),
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  })

const landing = (request, env) =>
  respond(
    request,
    env,
    200,
    'SALVE',
    'Roman numerals as a service. Try <a href="/1994"><code>/1994</code></a> or <a href="/MCMXCIV"><code>/MCMXCIV</code></a>.',
    {
      salve: 'Roman numerals as a service',
      usage: ['/1994', '/MCMXCIV'],
      sla: '99.IX% uptime'
    }
  )

const nulla = (request, env) =>
  respond(request, env, 418, 'NVLLA', 'The Romans had no zero. Neither do we.', {
    error: 'NVLLA: the Romans had no zero'
  })

const tooBig = (request, env) =>
  respond(request, env, 418, 'NIMIS', 'The Romans got bored at MMMCMXCIX. So did we.', {
    error: 'NIMIS: maximum is 3999 (MMMCMXCIX)'
  })

const notFound = (request, env) =>
  respond(request, env, 404, 'NON INVENITVR', 'That is neither a number nor a Roman numeral.', {
    error: 'NON INVENITVR: expected an integer 1-3999 or a Roman numeral'
  })

const handle = (request, env = {}) => {
  const url = new URL(request.url)
  const seg = url.pathname.replace(/^\/+|\/+$/g, '')

  if (seg === '') return landing(request, env)

  if (/^\d+$/.test(seg)) {
    const n = Number(seg)
    if (n === 0) return nulla(request, env)
    if (n >= 4000) return tooBig(request, env)
    // Leading zeros, trailing slashes, query strings, etc.
    return redirect(url, String(n))
  }

  if (/^[ivxlcdm]+$/i.test(seg)) {
    try {
      return redirect(url, romanize(deromanize(seg.toUpperCase())))
    } catch {
      return notFound(request, env)
    }
  }

  return notFound(request, env)
}

module.exports = { handle }
