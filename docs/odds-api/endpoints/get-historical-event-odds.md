# GET historical event odds

Returns historical odds for a single event as they appeared at a specified timestamp. Accepts [any available betting markets](https://the-odds-api.com/sports-odds-data/betting-markets.html) using the `markets` parameter. Historical data for additional markets (player props, alternate lines, period markets) are available after 2023-05-03T05:30:00Z. This endpoint is only available on paid usage plans.

**Tip**

When querying historical odds for [featured markets](https://the-odds-api.com/sports-odds-data/betting-markets.html#featured-betting-markets), the historical odds endpoint is simpler to implement and more cost-effective.

## Endpoint

**GET** `/v4/historical/sports/{sport}/events/{eventId}/odds?apiKey={apiKey}&regions={regions}&markets={markets}&dateFormat={dateFormat}&oddsFormat={oddsFormat}&date={date}`

## Parameters

Parameters are the same as for the /odds endpoint, with additional parameters listed below. [All available market keys](https://the-odds-api.com/sports-odds-data/betting-markets.html) are accepted in the markets parameter.

- **eventId** - The id of a historical game, to be used in the URL path. Historical event ids can be found in the "id" field in the response of the historical events endpoint.
- **date** - The timestamp of the data snapshot to be returned, specified in ISO8601 format, for example `2023-11-29T22:42:00Z` The historical odds API will return the closest snapshot equal to or earlier than the provided `date` parameter. Historical data for additional markets are available after 2023-05-03T05:30:00Z. Snapshots are available at 5 minute intervals.
- **includeMultipliers** - Optional. Applicable to US DFS sites. If `true`, the response will include the multipliers in each bet selection outcome if available. Valid values are `true` or `false`. Defaults to `false`.

## Schema

For the detailed API spec, see the [Swagger API docs](https://app.swaggerhub.com/apis-docs/the-odds-api/odds-api/4?view=uiDocs#/historical%20events/get_v4_historical_sports__sport__events__eventId__odds)

## Example Request

**GET** `https://api.the-odds-api.com/v4/historical/sports/basketball_nba/events/da359da99aa27e97d38f2df709343998/odds?apiKey=YOUR_API_KEY&date=2023-11-29T22:45:00Z&regions=us&markets=player_points,h2h_q1`

## Example Response

The response schema is almost the same as that of the /event odds endpoint, but wrapped in a structure that contains information about the snapshot, including:

- **timestamp** - The timestamp of the snapshot. This will be the closest available timestamp equal to or earlier than the provided date parameter.
- **previous_timestamp** - the preceding available timestamp. This can be used as the date parameter in a new request to move back in time.
- **next_timestamp** - The next available timestamp. This can be used as the date parameter in a new request to move forward in time.

```json
{
    "timestamp": "2023-11-29T22:40:39Z",
    "previous_timestamp": "2023-11-29T22:35:39Z",
    "next_timestamp": "2023-11-29T22:45:40Z",
    "data": {
        "id": "da359da99aa27e97d38f2df709343998",
        "sport_key": "basketball_nba",
        "sport_title": "NBA",
        "commence_time": "2023-11-30T00:10:00Z",
        "home_team": "Detroit Pistons",
        "away_team": "Los Angeles Lakers",
        "bookmakers": [
            {
                "key": "draftkings",
                "title": "DraftKings",
                "last_update": "2023-11-29T22:40:09Z",
                "markets": [
                    {
                        "key": "h2h_q1",
                        "last_update": "2023-11-29T22:40:55Z",
                        "outcomes": [
                            {
                                "name": "Detroit Pistons",
                                "price": 2.5
                            },
                            {
                                "name": "Los Angeles Lakers",
                                "price": 1.56
                            }
                        ]
                    },
                    {
                        "key": "player_points",
                        "last_update": "2023-11-29T22:40:55Z",
                        "outcomes": [
                            {
                                "name": "Over",
                                "description": "Anthony Davis",
                                "price": 1.83,
                                "point": 23.5
                            },
                            {
                                "name": "Under",
                                "description": "Anthony Davis",
                                "price": 1.91,
                                "point": 23.5
                            },
                            {
                                "name": "Over",
                                "description": "Ausar Thompson",
                                "price": 1.87,
                                "point": 11.5
                            },
                            {
                                "name": "Under",
                                "description": "Ausar Thompson",
                                "price": 1.87,
                                "point": 11.5
                            },
                            ...
                        ]
                    }
                ]
            }
        ]
    }
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
cost = 10 x [number of unique markets returned] x [number of regions specified]
```

**Examples of usage quota costs**

- **1 market, 1 region**  
  Cost: 10  
  Example `/v4/historical/sports/americanfootball_nfl/events/a512a48a58c4329048174217b2cc7ce0/odds?markets=player_pass_tds&regions=us&...`

- **3 markets, 1 region**  
  Cost: 30  
  Example `/v4/historical/sports/americanfootball_nfl/events/a512a48a58c4329048174217b2cc7ce0/odds?markets=player_pass_tds,player_anytime_td,player_rush_longest&regions=us&...`

- **1 market, 3 regions**  
  Cost: 30  
  Example `/v4/historical/sports/basketball_nba/events/037d7b6bb128546961e2a06680f63944/odds?markets=player_points&regions=us,us2,au&...`

- **3 markets, 3 regions**  
  Cost: 90  
  Example: `/v4/historical/sports/basketball_nba/events/0b83beff5f82f8623eea93dbc1d7cd4e/odds?markets=player_points,player_assists,alternate_spreads&regions=us,us2,au&...`

### Keeping track of quota usage

To keep track of usage credits, every API response includes the following response headers:

- **x-requests-used**
- **x-requests-remaining**
- **x-requests-last**

## More info

- When calculating the market component of usage quota costs, a count of unique markets in the API response is used. For example if you specify 5 different markets and 1 region in the API call, and data is only available for 2 markets, the cost will be 10 x [2 markets] x [1 region] = 20
- Responses with empty data do not count towards the usage quota.
