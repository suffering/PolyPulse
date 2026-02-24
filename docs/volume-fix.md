# Volume Display Fix

## Issue
The "Total Volume" column on the `/creators` page was displaying the **aggregate volume of all markets created by each creator**, which was:
1. Incorrectly calculated (double-counting event volumes when markets lacked individual volume data)
2. Not representative of the creator's actual trading activity on Polymarket

## Solution
Updated the "Total Volume" column to display each creator's **personal trading volume** from the Polymarket leaderboard API.

## Changes Made

### 1. Added New API Function (`lib/polymarket.ts`)
```typescript
export async function fetchUserTradingVolume(walletAddress: string): Promise<number>
```
- Fetches a user's total trading volume from the Polymarket Data API `/v1/leaderboard` endpoint
- Uses query parameters: `user`, `timePeriod=ALL`, `orderBy=VOL`, `category=OVERALL`
- Returns the `vol` field from the leaderboard response
- Returns 0 if the user is not found on the leaderboard (no trading activity)

### 2. Updated Creator Stats Interface (`lib/polymarket.ts`)
```typescript
export interface CreatorStats {
  // ...
  /** Personal trading volume from Polymarket leaderboard API (requires wallet address) */
  totalVolume: number;
  // ...
}
```
- Clarified that `totalVolume` now represents personal trading volume
- Requires wallet address to be resolved first

### 3. Removed Market Volume Aggregation (`lib/polymarket.ts`)
- Removed all volume calculation logic from `aggregateCreatorStats()`
- `totalVolume` is now initialized to 0 and enriched later via the leaderboard API
- Removed the `creatorEventVolumeCounted` tracking map (no longer needed)

### 4. Added Volume Enrichment Function (`lib/polymarket.ts`)
```typescript
export async function enrichCreatorWithVolume(creator: CreatorStats): Promise<CreatorStats>
```
- Enriches a creator with their personal trading volume
- Only works for creators with resolved wallet addresses
- Called after wallet enrichment completes

### 5. Updated Cache Layer (`lib/creators-cache.ts`)
- Added `volumeCoverage` tracking to `CachedCreators` type
- Updated `enrichCreatorsBestEffort()` to:
  1. First enrich wallet addresses
  2. Then enrich trading volumes for creators with wallets
- Added `computeVolumeCoverage()` function
- Re-sorts creators by volume after enrichment completes
- Increased initial wait time from 1.2s to 2s to allow more time for enrichment

### 6. Updated Frontend (`app/creators/page.tsx`)
- Added `volumeCoverage` to `CreatorsResponse` type
- Updated `refetchInterval` to also check `volumeCoverage` and refetch faster if volumes are still being enriched
- Frontend will automatically refetch every 5 seconds until all volumes are loaded

## API Endpoint Used
**Polymarket Data API - Trader Leaderboard**
- Endpoint: `https://data-api.polymarket.com/v1/leaderboard`
- Documentation: https://docs.polymarket.com/api-reference/core/get-trader-leaderboard-rankings
- Response field: `vol` (number) - Total trading volume for the user

## Verification
Tested with "Open Source Intel" creator:
- App displays: $11,166.75
- Polymarket API returns: $11,166.746611
- ✅ Exact match

Tested with "zerohedge" creator:
- App displays: $0.00
- Polymarket API: Not on leaderboard (no trading activity)
- ✅ Correct behavior - creator only creates markets but doesn't trade

## Expected Behavior
- **Creators who trade**: Display their actual personal trading volume from Polymarket
- **Creators who don't trade**: Display $0.00 (most creators fall into this category)
- **Creators without wallet addresses**: Display $0.00 (cannot fetch volume without wallet)

## Performance
- Initial page load: Fast (~6-7 seconds for aggregation + wallet resolution)
- Volume enrichment: Happens in background after initial load
- Progressive enhancement: Volumes appear as they're fetched
- Cache TTL: 5 minutes
- Auto-refetch: Every 5 seconds until all volumes loaded, then every 5 minutes
