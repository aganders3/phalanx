# Phalanx: Roman Numerals as a Service 🏛️

Enterprise-grade, edge-replicated, 100% precomputed Roman numeral conversion.
SLA: 99.IX% uptime.

```shell
$ curl https://phalanx.aganders3.workers.dev/1994
{"decimal":1994,"roman":"MCMXCIV"}

$ curl https://phalanx.aganders3.workers.dev/MCMXCIV
{"decimal":1994,"roman":"MCMXCIV"}
```

## How it's free

Every valid answer (1–3999 and their numerals, ~8,000 files) is pre-rendered
into `public/` at build time and served as a [static asset][assets]. Static
asset requests don't invoke the Worker and don't count toward the free plan's
daily request limit.

The Worker (`src/handler.js`) only runs for everything else:

| Request              | Response                         |
| -------------------- | -------------------------------- |
| `/`                  | landing page                     |
| `/mcmxciv`, `/01994` | `301` to the canonical form      |
| `/0`, `/4000`        | `418 I'm a teapot` (NVLLA/NIMIS) |
| anything else        | `404` (NON INVENITVR)            |

Browsers (`Accept: text/html`) get an HTML page; everyone else gets JSON.

**Don't enable [Workers Cache][cache]**: it makes static asset requests billable.

## Deploy

```shell
cd worker
npm install
npx wrangler login     # once
npm run deploy         # builds public/ then deploys
```

Local dev: `npm run dev`.

## Tip jar

Set `TIP_URL` in `wrangler.jsonc` (ko-fi, GitHub Sponsors, …) to show a tip
link on the landing and error pages. Credit to the
[romans](https://github.com/qbunt/romans) library is always shown.

[assets]: https://developers.cloudflare.com/workers/static-assets/
[cache]: https://developers.cloudflare.com/workers/cache/
