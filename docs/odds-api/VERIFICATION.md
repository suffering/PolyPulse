# Odds API Implementation Verification

Checked against `docs/odds-api/README.md`, `endpoints/get-odds.md`, `get-events.md`, `get-sports.md`, `code-samples.md`, and `rate-limiting.md`.

## Endpoint & Parameters

| Doc requirement | Our code | Status |
|-----------------|----------|--------|
| **Host** `https://api.the-odds-api.com` | `ODDS_API_BASE = "https://api.the-odds-api.com/v4"` | ✓ |
| **Path** `GET /v4/sports/{sport}/odds` | `${ODDS_API_BASE}/sports/${sport}/odds?..."` | ✓ |
| **apiKey** (required) | `apiKey=${apiKey}` in query | ✓ |
| **regions** (e.g. us, uk, eu) | `regions=us` | ✓ |
| **markets** (optional; default h2h) | We pass explicitly: `h2h`, `h2h,totals`, or `outrights` per sport | ✓ |
| **oddsFormat** (optional; default **decimal**) | We pass `oddsFormat=american` so all `outcome.price` values are American | ✓ |

We intentionally request **American** odds so we can use the documented outcome shape (`"price": 240`, `"price": -303`) and convert with `americanToDecimal(price)`.

## Response Shape (get-odds.md)

- Response body is a **root-level array** of event objects (not `{ events: [...] }`).
- Our code: `const events: OddsApiEvent[] = await res.json();` — correct.
- Each event: `id`, `sport_key`, `commence_time`, `home_team`, `away_team`, `bookmakers`.
- Each bookmaker: `key`, `title`, `last_update`, `markets`.
- Each market: `key`, `outcomes`.
- Each outcome: `name`, `price` (American when `oddsFormat=american`); `point` optional for spreads.

Our TypeScript interfaces in `lib/odds-api.ts` match this.

## Response Headers

- Doc: `x-requests-remaining`, `x-requests-used`, `x-requests-last`.
- We read `x-requests-remaining` and cache it. Header names are case-insensitive. ✓

## American → Decimal Conversion

Doc example: `"price": 240` (underdog), `"price": -303` (favorite).

- Positive American: decimal = `1 + price/100` (e.g. 240 → 3.4).
- Negative American: decimal = `1 + 100/|price|` (e.g. -303 → ~1.33).

Implemented consistently in:
- `lib/odds-api.ts`: `americanToDecimal()`, used in `getBestSportsbookOdds()`.
- `lib/calculator.ts`: `americanToDecimal()` for EV.
- `lib/matching.ts`: inline same formula and `americanToDecimalFromPrice()`.

All match the standard conversion. ✓

## Rate Limiting (429)

- Doc: on 429, wait and retry.
- We retry with delays `[1000, 2000]` ms and then throw with a clear message. ✓

## Usage Quota

- Cost = markets × regions (e.g. 1 market + 1 region = 1).
- We request one market (or comma-separated) per call; we cache for 5 minutes to reduce calls. ✓

## Soccer / 3-way markets

- get-odds.md lists markets: `h2h`, `spreads`, `totals`, `outrights`. Soccer 1X2 is returned as `h2h` (three outcomes: Home, Away, Draw) or `h2h_3_way` depending on bookmaker. We request `h2h,h2h_3_way` for soccer so Draw odds are available.
- **Regions**: Soccer odds are often not offered by US bookmakers for European leagues (EPL, La Liga, etc.). The Odds API EPL example uses `regions=uk`. We pass `regions=us,uk` for all soccer game and outright fetches so UK (and EU) bookmakers are included and soccer events return data. Sport keys (e.g. `soccer_epl`, `soccer_spain_la_liga`, `soccer_usa_mls`) match the [official sports list](https://the-odds-api.com/sports-odds-data/sports-apis.html).

## Summary

- Endpoint, query params, and response parsing are correct.
- American odds are requested and converted correctly.
- Headers and rate limiting are handled. Only improvement made: validate that the response is an array before use.
