# GET odds

Returns a list of upcoming and live games with recent odds for a given sport, region and market

## Endpoint

**GET** `/v4/sports/{sport}/odds/?apiKey={apiKey}&regions={regions}&markets={markets}`

## Parameters

- **sport** - The sport key obtained from calling the /sports endpoint. `upcoming` is always valid, returning any live games as well as the next 8 upcoming games across all sports
- **apiKey** - The API key associated with your subscription. [See usage plans](https://the-odds-api.com/#get-access)
- **regions** - Determines the bookmakers to be returned. For example, `us`, `us2` (United States), `uk` (United Kingdom), `au` (Australia) and `eu` (Europe). Multiple regions can be specified if comma delimited. See the [list of bookmakers by region](https://the-odds-api.com/sports-odds-data/bookmaker-apis.html).
- **markets** - Optional - Determines which odds market is returned. Defaults to `h2h` (head to head / moneyline). Valid markets are `h2h` (moneyline), `spreads` (points handicaps), `totals` (over/under) and `outrights` (futures). Multiple markets can be specified if comma delimited. `spreads` and `totals` markets are mainly available for US sports and bookmakers at this time. Each specified market costs 1 against the usage quota, for each region.
  
  Lay odds are automatically included with `h2h` results for relevant betting exchanges (Betfair, Matchbook etc). These have a `h2h_lay` market key.
  
  For sports with outright markets (such as Golf), the market will default to `outrights` if not specified. Lay odds for outrights (`outrights_lay`) will automatically be available for relevant exchanges.
  
  For more info, see [descriptions of betting markets](https://the-odds-api.com/sports-odds-data/betting-markets.html).
- **dateFormat** - Optional - Determines the format of timestamps in the response. Valid values are `unix` and `iso` (ISO 8601). Defaults to `iso`.
- **oddsFormat** - Optional - Determines the format of odds in the response. Valid values are `decimal` and `american`. Defaults to `decimal`. When set to `american`, small discrepancies might exist for some bookmakers due to rounding errors.
- **eventIds** - Optional - Comma-separated game ids. Filters the response to only return games with the specified ids.
- **bookmakers** - Optional - Comma-separated list of bookmakers to be returned. If both `bookmakers` and `regions` are both specified, `bookmakers` takes priority. Bookmakers can be from any region. Every group of 10 bookmakers is the equivalent of 1 region. For example, specifying up to 10 bookmakers counts as 1 region. Specifying between 11 and 20 bookmakers counts as 2 regions.
- **commenceTimeFrom** - Optional - filter the response to show games that commence on and after this parameter. Values are in ISO 8601 format, for example 2023-09-09T00:00:00Z. This parameter has no effect if the sport is set to 'upcoming'.
- **commenceTimeTo** - Optional - filter the response to show games that commence on and before this parameter. Values are in ISO 8601 format, for example 2023-09-10T23:59:59Z. This parameter has no effect if the sport is set to 'upcoming'.
- **includeLinks** - Optional - if `true`, the response will include bookmaker links to events, markets, and betslips if available. Valid values are `true` or `false`
- **includeSids** - Optional - if `true`, the response will include source ids (bookmaker ids) for events, markets and outcomes if available. Valid values are `true` or `false`. This field can be useful to construct your own links to handle variations in state or mobile app links.
- **includeBetLimits** - Optional - if `true`, the response will include the bet limit of each betting option, mainly available for betting exchanges. Valid values are `true` or `false`
- **includeRotationNumbers** - Optional - if `true`, the response will include the home and away rotation numbers if available. See [this link](https://the-odds-api.com/releases/rotation-numbers.html) for details. Valid values are `true` or `false`.

Try it out in the browser

[https://api.the-odds-api.com/v4/sports/upcoming/odds/?regions=...](https://api.the-odds-api.com/v4/sports/upcoming/odds/?regions=us&markets=h2h&apiKey=YOUR_API_KEY)

Viewing JSON in the browser is easier with a prettifier such as [JSON Viewer](https://chrome.google.com/webstore/detail/json-viewer/gbmdgpbipfallnflgajpaliibnhdgobh) for Chrome

## Schema

For a detailed API spec, see the [Swagger API docs](https://app.swaggerhub.com/apis-docs/the-odds-api/odds-api/4?view=uiDocs#/current%20events/get_v4_sports__sport__odds)

## Example Request

**GET** `https://api.the-odds-api.com/v4/sports/americanfootball_nfl/odds/?apiKey=YOUR_API_KEY&regions=us&markets=h2h,spreads&oddsFormat=american`

## Example Response

```json
[
    {
        "id": "bda33adca828c09dc3cac3a856aef176",
        "sport_key": "americanfootball_nfl",
        "commence_time": "2021-09-10T00:20:00Z",
        "home_team": "Tampa Bay Buccaneers",
        "away_team": "Dallas Cowboys",
        "bookmakers": [
            {
                "key": "unibet",
                "title": "Unibet",
                "last_update": "2021-06-10T13:33:18Z",
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
                    },
                    {
                        "key": "spreads",
                        "outcomes": [
                            {
                                "name": "Dallas Cowboys",
                                "price": -109,
                                "point": 6.5
                            },
                            {
                                "name": "Tampa Bay Buccaneers",
                                "price": -111,
                                "point": -6.5
                            }
                        ]
                    }
                ]
            },
            {
                "key": "caesars",
                "title": "Caesars",
                "last_update": "2021-06-10T13:33:48Z",
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
                                "price": -278
                            }
                        ]
                    },
                    {
                        "key": "spreads",
                        "outcomes": [
                            {
                                "name": "Dallas Cowboys",
                                "price": -110,
                                "point": 6.5
                            },
                            {
                                "name": "Tampa Bay Buccaneers",
                                "price": -110,
                                "point": -6.5
                            }
                        ]
                    }
                ]
            }
        ]
    }
]
```

## Response Headers

The following response headers are returned

- **x-requests-remaining** - The usage credits remaining until the quota resets
- **x-requests-used** - The usage credits used since the last quota reset
- **x-requests-last** - The usage cost of the last API call

## Usage Quota Costs

The usage quota cost is 1 per region per market.

```
cost = [number of markets specified] x [number of regions specified]
```

**Examples**

- **1 market, 1 region**  
  Cost: 1  
  Example `/v4/sports/americanfootball_nfl/odds?markets=h2h&regions=us&...`

- **3 markets, 1 region**  
  Cost: 3  
  Example `/v4/sports/americanfootball_nfl/odds?markets=h2h,spreads,totals&regions=us&...`

- **1 market, 3 regions**  
  Cost: 3  
  Example `/v4/sports/soccer_epl/odds?markets=h2h&regions=us,uk,eu&...`

- **3 markets, 3 regions**  
  Cost: 9  
  Example: `/v4/sports/basketball_nba/odds?markets=h2h,spreads,totals&regions=us,uk,au&...`

### Keeping track of quota usage

To keep track of usage credits, every API call includes the following response headers:

- **x-requests-remaining** - The usage credits remaining until the quota resets
- **x-requests-used** - The usage credits used since the last quota reset
- **x-requests-last** - The usage cost of the last API call

## More info

- The list of events returned in the /odds endpoint mirrors events that are listed by major bookmakers. This usually includes games for the current round
- Events may temporarily become unavailable after a round, before bookmakers begin listing the next round of games
- Events may be unavailable if the sport is not in season. For popular sports, bookmakers may begin listing new season events a few months in advance
- If no events are returned, the request will not count against the usage quota
- To determine if an event is in-play, the `commence_time` can be used. If `commence_time` is less than the current time, the event is in-play. The /odds endpoint does not return completed events
