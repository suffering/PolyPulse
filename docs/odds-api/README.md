# Odds API Documentation V4

## Overview

Get started with The Odds API in **3 steps**

**Step 1**

Get an API key via email

[See plans](https://the-odds-api.com/#get-access)

**Step 2**

Get a list of in-season sports

**Details**

GET [/v4/sports?apiKey=YOUR_API_KEY](https://api.the-odds-api.com/v4/sports?apiKey=YOUR_API_KEY)

```json
{
  "key": "americanfootball_nfl",
  "group": "American Football",
  "title": "NFL",
  "description": "US Football",
  "active": true,
  "has_outrights": false
},
...
```

**Step 3**

Use the sport **key** from step 2 to get a list of upcoming events and odds from different bookmakers

Use the `oddsFormat` parameter to show odds in either decimal or American format

**Details**

GET [/v4/sports/americanfootball_nfl/odds?regions=us&oddsFormat=american&apiKey=YOUR_API_KEY](https://api.the-odds-api.com/v4/sports/americanfootball_nfl/odds?regions=us&oddsFormat=american&apiKey=YOUR_API_KEY)

```json
{
  "id": "bda33adca828c09dc3cac3a856aef176",
  "sport_key": "americanfootball_nfl",
  "commence_time": "2021-09-10T00:20:00Z",
  "home_team": "Tampa Bay Buccaneers",
  "away_team": "Dallas Cowboys",
  "bookmakers": [
  {
    "key": "fanduel",
    "title": "FanDuel",
    "last_update": "2021-06-10T10:46:09Z",
    "markets": [
    {
      "key": "h2h",
      "outcomes": [
        {
          "name": "Dallas Cowboys", 
          "price": 240 
        },
        {
          "name": "Tampa Bay Buccaneers", 
          "price": -303
        }
      ]
  ...
```

## Host

All requests use the host `https://api.the-odds-api.com`

Connections that require IPv6 can use `https://ipv6-api.the-odds-api.com`

## Documentation Index

- [GET sports](./endpoints/get-sports.md) - List of in-season sports
- [GET odds](./endpoints/get-odds.md) - Upcoming and live games with odds
- [GET scores](./endpoints/get-scores.md) - Live and completed game scores
- [GET events](./endpoints/get-events.md) - List of events without odds
- [GET event odds](./endpoints/get-event-odds.md) - Odds for a single event
- [GET event markets](./endpoints/get-event-markets.md) - Available markets for an event
- [GET participants](./endpoints/get-participants.md) - List of participants (teams/players)
- [GET historical odds](./endpoints/get-historical-odds.md) - Historical odds snapshots
- [GET historical events](./endpoints/get-historical-events.md) - Historical events list
- [GET historical event odds](./endpoints/get-historical-event-odds.md) - Historical odds for a single event
- [Rate Limiting](./rate-limiting.md) - API rate limits and error handling
- [Code Samples](./code-samples.md) - Example code for Python and Node.js

## More Info

Stay up to date on new sports, bookmakers and features by [following us on Twitter](https://twitter.com/The_Odds_API)

[X.com](https://twitter.com/The_Odds_API) • [Bluesky](https://bsky.app/profile/oddsapi.bsky.social) • [Github](https://github.com/the-odds-api)

[Status](https://status.the-odds-api.com/) • [Terms](https://the-odds-api.com/terms-and-conditions.html) • [Privacy Policy](https://the-odds-api.com/privacy.html) • [Contact](mailto:team@the-odds-api.com)

© 2026 The Odds API
