# GET event odds

Returns odds for a single event. Accepts [any available betting markets](https://the-odds-api.com/sports-odds-data/betting-markets.html) using the `markets` parameter. Coverage of non-featured markets is currently limited to selected bookmakers and sports, and expanding over time.

**When to use this endpoint**: Use this endpoint to access odds for any supported market. Since the volume of data returned can be large, these requests will only query one event at a time. If you are only interested in the most popular betting markets, including head-to-head (moneyline), point spreads (handicap), over/under (totals), the main /odds endpoint is simpler to integrate and more cost-effective.

## Endpoint

**GET** `/v4/sports/{sport}/events/{eventId}/odds?apiKey={apiKey}&regions={regions}&markets={markets}&dateFormat={dateFormat}&oddsFormat={oddsFormat}`

## Parameters

Parameters are the same as for the /odds endpoint with exceptions listed below. [All available market keys](https://the-odds-api.com/sports-odds-data/betting-markets.html) are accepted in the markets parameter.

- **eventId** - The id of an upcoming or live game, to be used in the URL path. Event ids can be found in the "id" field in the response of the events endpoint.
- **includeMultipliers** - Optional. Applicable to US DFS sites. If `true`, the response will include the multipliers in each bet selection outcome if available. Valid values are `true` or `false`. Defaults to `false`.

## Schema

For the detailed API spec, see the [Swagger API docs](https://app.swaggerhub.com/apis-docs/the-odds-api/odds-api/4?view=uiDocs#/current%20events/get_v4_sports__sport__events__eventId__odds)

## Example Request

**GET** `https://api.the-odds-api.com/v4/sports/americanfootball_nfl/events/a512a48a58c4329048174217b2cc7ce0/odds?apiKey=YOUR_API_KEY&regions=us&markets=player_pass_tds&oddsFormat=american`

## Example Response

The response schema is almost the same as that of the /odds endpoint with a few differences:

- A single game is returned, determined by the `eventId` parameter.
- The `last_update` field is only available on the market level in the response and not on the bookmaker level. This reflects the fact that markets can update on their own schedule.
- Relevant markets will have a `description` field in their outcomes.

```json
{
    "id": "a512a48a58c4329048174217b2cc7ce0",
    "sport_key": "americanfootball_nfl",
    "sport_title": "NFL",
    "commence_time": "2023-01-01T18:00:00Z",
    "home_team": "Atlanta Falcons",
    "away_team": "Arizona Cardinals",
    "bookmakers": [
        {
            "key": "draftkings",
            "title": "DraftKings",
            "markets": [
                {
                    "key": "player_pass_tds",
                    "last_update": "2023-01-01T05:31:29Z",
                    "outcomes": [
                        {
                            "name": "Over",
                            "description": "David Blough",
                            "price": -205,
                            "point": 0.5
                        },
                        {
                            "name": "Under",
                            "description": "David Blough",
                            "price": 150,
                            "point": 0.5
                        },
                        {
                            "name": "Over",
                            "description": "Desmond Ridder",
                            "price": -270,
                            "point": 0.5
                        },
                        {
                            "name": "Under",
                            "description": "Desmond Ridder",
                            "price": 195,
                            "point": 0.5
                        }
                    ]
                }
            ]
        },
        {
            "key": "fanduel",
            "title": "FanDuel",
            "markets": [
                {
                    "key": "player_pass_tds",
                    "last_update": "2023-01-01T05:35:06Z",
                    "outcomes": [
                        {
                            "name": "Over",
                            "description": "David Blough",
                            "price": -215,
                            "point": 0.5
                        },
                        {
                            "name": "Under",
                            "description": "David Blough",
                            "price": 164,
                            "point": 0.5
                        },
                        {
                            "name": "Over",
                            "description": "Desmond Ridder",
                            "price": 196,
                            "point": 1.5
                        },
                        {
                            "name": "Under",
                            "description": "Desmond Ridder",
                            "price": -260,
                            "point": 1.5
                        }
                    ]
                }
            ]
        }
    ]
}
```

## Response Headers

The following response headers are returned

- **x-requests-remaining** - The usage credits remaining until the quota resets
- **x-requests-used** - The usage credits used since the last quota reset
- **x-requests-last** - The usage cost of the last API call

## Usage Quota Costs

The usage quota cost depends on the number of markets and regions used in the request.

```
cost = [number of unique markets returned] x [number of regions specified]
```

**Examples of usage quota costs**

- **1 market, 1 region**  
  Cost: 1  
  Example `/v4/sports/americanfootball_nfl/events/a512a48a58c4329048174217b2cc7ce0/odds?markets=h2h&regions=us&...`

- **3 markets, 1 region**  
  Cost: 3  
  Example `/v4/sports/americanfootball_nfl/events/a512a48a58c4329048174217b2cc7ce0/odds?markets=h2h,spreads,totals&regions=us&...`

- **1 market, 3 regions**  
  Cost: 3  
  Example `/v4/sports/soccer_epl/events/037d7b6bb128546961e2a06680f63944/odds?markets=h2h&regions=us,uk,eu&...`

- **3 markets, 3 regions**  
  Cost: 9  
  Example: `/v4/sports/basketball_nba/events/0b83beff5f82f8623eea93dbc1d7cd4e/odds?markets=h2h,spreads,totals&regions=us,uk,au&...`

### Keeping track of quota usage

To keep track of usage credits, every API response includes the following response headers:

- **x-requests-remaining** - The usage credits remaining until the quota resets
- **x-requests-used** - The usage credits used since the last quota reset
- **x-requests-last** - The usage cost of the last API call

## More info

- When calculating the market component of usage quota costs, a count of unique markets in the API response is used. For example if you specify 5 different markets and 1 region in the API call, and data is only available for 2 markets, the cost will be [2 markets] x [1 region] = 2
- Responses with empty data do not count towards the usage quota.
