# PolyPulse

**Polymarket intelligence for traders.** Real-time market data, +EV opportunity scanning, wallet portfolio tracking, and trader analytics — in one dark-mode dashboard.

**Live:** [polypulse.live](https://polypulse.live)

---

## Features

### +EV Engine (`/ev`)
Compare Polymarket prices against sportsbook lines to surface positive expected-value opportunities. Supports NBA, MLB, NHL, tennis, and multiple soccer leagues (MLS, EPL, La Liga, Ligue 1, Serie A, Bundesliga). Filter by sport, sort by EV, and refresh odds on demand.

### Markets (`/markets`)
Browse active Polymarket events and questions sorted by 24h volume. Data is pulled directly from the [Gamma API](https://gamma-api.polymarket.com) with canonical event/market linking — no stale or mismatched rows.

### Leaderboard (`/leaderboard`)
All-time and filtered trader rankings by PnL, volume, and trade count via Polymarket's Data API.

### Portfolio (`/portfolio`)
Connect a browser wallet (MetaMask or any injected provider on Polygon) to view your positions, trade history, PnL chart, and profile stats. Wallet state is verified against `eth_accounts` on each session — no phantom connections.

### Live Feed (`/live`)
Streaming feed of recent Polymarket trades with pause/resume and row highlighting.

### Volume (`/volume`)
Exchange-wide volume breakdown: 24h, weekly, monthly, and all-time.

### Creators (`/creators`)
Market creator stats — total markets, active markets, volume, and open interest.

### Search (`/search`)
Look up any wallet address or Polymarket username for profile data, PnL history, and performance charts.

### AI Assistant
Page-aware AI chat (OpenAI) with context from whatever screen you're on — EV cards, leaderboard rows, live trades, etc.

---

## Tech Stack

| Layer | Tools |
|---|---|
| Framework | [Next.js 14](https://nextjs.org) (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS, Radix UI |
| Data fetching | TanStack React Query |
| Charts | Recharts |
| Wallet | ethers.js v6 (browser extension, Polygon mainnet) |
| APIs | Polymarket Gamma + Data APIs, The Odds API, OpenAI |

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm or pnpm
- (Optional) [The Odds API](https://the-odds-api.com) key for +EV features
- (Optional) OpenAI API key for the AI assistant

### Install

```bash
git clone https://github.com/suffering/PolyPulse.git
cd PolyPulse
npm install
```

### Environment

Copy the example env file and fill in your keys:

```bash
cp .env.local.example .env.local
```

| Variable | Required | Description |
|---|---|---|
| `ODDS_API_KEY` | For +EV | The Odds API key for sportsbook line comparison |
| `OPENAI_API_KEY` | For AI chat | Server-side OpenAI key (never expose as `NEXT_PUBLIC_*`) |

The app works without either key — markets, leaderboard, live feed, and volume pages run on public Polymarket APIs alone.

### Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build

```bash
npm run build
npm start
```

---

## Project Structure

```
app/
  (landing)/          # Home page
  (app)/              # Authenticated app pages (markets, ev, portfolio, etc.)
  api/                # Route handlers (proxy to external APIs + matching logic)
components/
  landing/            # Sidebar, hero, ticker
  portfolio/          # Wallet-connected portfolio UI
  wallet/             # Connect button, wallet UI
  ai/                 # Page-aware AI assistant
lib/
  polymarket.ts       # Gamma + Data API client, market helpers
  matching.ts         # Polymarket ↔ sportsbook event matching
  odds-api.ts         # The Odds API client
  wallet/             # ethers.js wallet service, session monitor, storage
  portfolio.ts        # Portfolio data hooks
  leaderboard.ts      # Leaderboard fetching + formatting
public/               # Static assets (logo, nav icons)
```

---

## API Routes

All external API calls go through Next.js route handlers so keys stay server-side.

| Route | Purpose |
|---|---|
| `/api/ev` | Match Polymarket markets to sportsbook odds, compute EV |
| `/api/markets/events` | Active Polymarket events |
| `/api/markets` | Active Polymarket markets |
| `/api/leaderboard` | Trader rankings |
| `/api/volume` | Exchange volume stats |
| `/api/live/trades` | Recent trade feed |
| `/api/creators` | Market creator stats |
| `/api/portfolio/*` | Positions, trades, PnL, profile for a wallet |
| `/api/traders/[address]/*` | Public trader profile + performance |
| `/api/search/profile` | Wallet/username lookup |
| `/api/ai/chat` | Page-aware AI assistant |

---

## Wallet Integration

PolyPulse connects via the browser's injected Web3 provider (MetaMask, etc.) on **Polygon mainnet (chain ID 137)**.

- Connection requires an explicit user approval (`eth_requestAccounts`)
- On page load, stored state is verified against `eth_accounts` — if the wallet isn't actually connected, the session is cleared
- USDC balance and CTF approvals are read on-chain after connect
- 30-minute idle timeout auto-disconnects

No seed phrases or private keys are ever stored.

---

## Deployment

PolyPulse is deployed on [Vercel](https://vercel.com). Push to `main` to trigger a production deploy (once the Git integration is connected).

```bash
# Manual deploy
npx vercel --prod
```

Set `ODDS_API_KEY` and `OPENAI_API_KEY` in your Vercel project environment variables.

---

## Disclaimer

PolyPulse is an analytics tool, **not financial advice**. Prediction markets carry risk. Always do your own research before trading.

---

## Author

Built by **Daniel Makarovskiy** — made in NYC.
