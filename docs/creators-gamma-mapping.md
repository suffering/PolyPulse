# Creators Page – Gamma / Data API Mapping

This document explains how the `/creators` page builds its data from the Polymarket Gamma and Data APIs.

## Endpoints

- **Gamma events**: `GET https://gamma-api.polymarket.com/events`
  - Used via `fetchPolymarketEvents()` in `lib/polymarket.ts`.
  - Provides:
    - `events[].eventCreators[]` (creator attribution)
    - `events[].volume` (event notional volume)
    - `events[].liquidity` (event-level liquidity / open interest)
    - `events[].markets[]` (per-market volume & liquidity)
- **Gamma public search**: `GET https://gamma-api.polymarket.com/public-search`
  - Used via `publicSearchProfiles()` in `lib/creator-wallet-resolver.ts`.
  - Provides:
    - `profiles[].proxyWallet` (creator wallet)
    - `profiles[].name`, `profiles[].pseudonym`
- **Gamma public profile**: `GET https://gamma-api.polymarket.com/public-profile?address=...`
  - Used to verify candidate wallets in `verifyCandidateWallet()`.
- **Data API leaderboard**: `GET https://data-api.polymarket.com/v1/leaderboard`
  - Used via `fetchUserTradingVolume()` in `lib/polymarket.ts`.
  - Provides:
    - `vol` (total trading volume per wallet, in USDC)

## CreatorStats fields

Defined in `lib/polymarket.ts`:

- `id`: from `eventCreators[].id` (fallback to handle / URL when missing).
- `name`: `eventCreators[].creatorName` (fallback `creatorHandle` or `"Unknown Creator"`).
- `handle`: `eventCreators[].creatorHandle`.
- `image`: `eventCreators[].creatorImage`.
- `url`: `eventCreators[].creatorUrl`.
- `totalMarkets`:
  - Count of all markets (active + closed) attributed to the creator.
  - Incremented once per `event.markets[]` entry when that event lists the creator.
- `activeMarkets`:
  - Subset of `totalMarkets` where `event.closed === false` and `market.closed !== true`.
- `openInterest`:
  - Sum over markets of:
    - `market.liquidityNum ?? market.liquidity`
    - Fallback: `event.liquidity ?? event.openInterest`
  - Represents creator-level open interest derived from liquidity, not volume.
- `walletAddress`:
  - Resolved via Gamma `public-search` + `public-profile` in `creator-wallet-resolver.ts`.
- `totalVolume`:
  - **Gamma only:** aggregate notional volume of all events/markets attributed to the creator.
  - Source: `event.volume` when present; else sum of `market.volumeNum ?? market.volume24hr ?? market.volume24h ?? market.volume` per event. Added once per event per creator (no double-counting).
  - Displayed in USD via `formatCurrency()`. Not overwritten by leaderboard (Data API) trading volume.

## Pagination / limits

`aggregateCreatorStats()` paginates Gamma events:

- Active events: up to `maxPagesActive = 20` pages of `limit = 100` → **2,000 active events**.
- Closed events: up to `maxPagesClosed = 10` pages of `limit = 100` → **1,000 closed events**.

Only creators appearing in these first ~3,000 events (ordered by event volume) are included in the `/creators` page. The list is therefore:

- “Creators from the top ~3,000 events by volume”, **not** “all creators on Polymarket”.

