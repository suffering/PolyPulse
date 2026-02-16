# PolyPulse +EV Engine

A real-time tool that finds positive expected value bets on Polymarket sports markets by comparing against sportsbook odds.

## Features

- **Live +EV opportunities** – Compares Polymarket prices to DraftKings, FanDuel, BetMGM, etc.
- **NBA Championship markets** – MVP focuses on NBA Finals winner outrights
- **EV calculation** – `(TrueProbability × PolymarketPayout) - Stake`
- **Quality tiers** – Excellent (≥5%), Good (2-5%), Marginal (0-2%)
- **API quota protection** – 5min Odds API cache, 60s Polymarket refresh

## Setup

```bash
npm install
cp .env.local.example .env.local  # Add ODDS_API_KEY
npm run dev
```

## Environment

- `ODDS_API_KEY` – From [The Odds API](https://the-odds-api.com/) (500 req/month free)

## API Routes

- `GET /api/odds/[sport]` – Sportsbook odds (5min cache)
- `GET /api/polymarket?sport=` – Polymarket events
- `GET /api/ev?sport=nba` – Matched +EV opportunities

## Tech Stack

Next.js 14, TypeScript, TailwindCSS, shadcn/ui, React Query
