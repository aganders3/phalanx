const { handle } = require('../src/handler.js')

const get = (path, headers = {}) =>
  handle(new Request(`https://romans.example${path}`, { headers }), {})

describe('worker fallback handler', () => {
  test('landing page', async () => {
    const res = get('/')
    expect(res.status).toBe(200)
    expect((await res.json()).salve).toBeDefined()
  })

  test.each([
    ['/mcmxciv', '/MCMXCIV'],
    ['/McMxCiV/', '/MCMXCIV'],
    ['/01994', '/1994'],
    ['/1994/', '/1994'],
    ['/42?utm_source=lol', '/42']
  ])('%s redirects to %s', (path, target) => {
    const res = get(path)
    expect(res.status).toBe(301)
    expect(new URL(res.headers.get('Location')).pathname).toBe(target)
  })

  test.each([
    ['/0', 418],
    ['/4000', 418],
    ['/IIII', 404],
    ['/banana', 404]
  ])('%s is a %i', (path, status) => {
    expect(get(path).status).toBe(status)
  })

  test('browsers get an HTML error page with a tip link when configured', async () => {
    const res = handle(
      new Request('https://romans.example/banana', { headers: { Accept: 'text/html' } }),
      { TIP_URL: 'https://ko-fi.com/example' }
    )
    const body = await res.text()
    expect(res.headers.get('Content-Type')).toMatch(/text\/html/)
    expect(body).toContain('https://ko-fi.com/example')
    expect(body).toContain('https://github.com/qbunt/romans')
  })

  test('no tip link when TIP_URL is unset', async () => {
    const body = await get('/banana').json()
    expect(body.tip_jar).toBeUndefined()
    expect(body.powered_by).toBe('https://github.com/qbunt/romans')
  })
})
