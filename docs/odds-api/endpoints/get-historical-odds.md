# GET historical odds

Returns a snapshot of games with bookmaker odds for a given sport, region and market, at a given historical timestamp. Historical odds data is available from June 6th 2020, with snapshots taken at 10 minute intervals. From September 2022, historical odds snapshots are available at 5 minute intervals. This endpoint is only available on paid usage plans.

## Endpoint

**GET** `/v4/historical/sports/{sport}/odds?apiKey={apiKey}&regions={regions}&markets={markets}&date={date}`

## Parameters

Parameters are the same as for the /odds endpoint, with the addition of the `date` parameter.

- **date** - The timestamp of the data snapshot to be returned, specified in ISO8601 format, for example `2021-10-18T12:00:00Z` The historical odds API will return the closest snapshot equal to or earlier than the provided `date` parameter.

## Schema

For a detailed API spec, see the [Swagger API docs](https://app.swaggerhub.com/apis-docs/the-odds-api/odds-api/4?view=uiDocs#/historical%20events/get_v4_historical_sports__sport__odds)

## Example Request

**GET** `https://api.the-odds-api.com/v4/historical/sports/americanfootball_nfl/odds/?apiKey=YOUR_API_KEY&regions=us&markets=h2h&oddsFormat=american&date=2021-10-18T12:00:00Z`

## Example Response

The response schema is the same as that of the /odds endpoint, but wrapped in a structure that contains information about the snapshot, including:

- **timestamp** - The timestamp of the snapshot. This will be the closest available timestamp equal to or earlier than the provided `date` parameter.
- **previous_timestamp** - the preceding available timestamp. This can be used as the `date` parameter in a new request to move back in time.
- **next_timestamp** - The next available timestamp. This can be used as the `date` parameter in a new request to move forward in time.

[More sample responses for selected sports](https://the-odds-api.com/historical-odds-data/#sample-historical-odds-data)

```json
{
    "timestamp": "2021-10-18T11:55:00Z",
    "previous_timestamp": "2021-10-18T11:45:00Z",
    "next_timestamp": "2021-10-18T12:05:00Z",
    "data": [
        {
            "id": "4edd5ce090a3ec6192053b10d27b87b0",
            "sport_key": "americanfootball_nfl",
            "sport_title": "NFL",
            "commence_time": "2021-10-19T00:15:00Z",
            "home_team": "Tennessee Titans",
            "away_team": "Buffalo Bills",
            "bookmakers": [
                {
                    "key": "draftkings",
                    "title": "DraftKings",
                    "last_update": "2021-10-18T11:48:09Z",
                    "markets": [
                        {
                            "key": "h2h",
                            "outcomes": [
                                {
                                    "name": "Buffalo Bills",
                                    "price": -294
                                },
                                {
                                    "name": "Tennessee Titans",
                                    "price": 230
                                }
                            ]
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

The usage quota cost for historical odds is 10 per region per market.

```
cost = 10 x [number of markets specified] x [number of regions specified]
```

**Examples of usage quota costs for historical odds**

- **1 market, 1 region**  
  Cost: 10  
  Example `/v4/historical/sports/americanfootball_nfl/odds?markets=h2h&regions=us&...`

- **3 markets, 1 region**  
  Cost: 30  
  Example `/v4/historical/sports/americanfootball_nfl/odds?markets=h2h,spreads,totals&regions=us&...`

- **1 market, 3 regions**  
  Cost: 30  
  Example `/v4/historical/sports/soccer_epl/odds?markets=h2h&regions=us,uk,eu&...`

- **3 markets, 3 regions**  
  Cost: 90  
  Example: `/v4/historical/sports/basketball_nba/odds?markets=h2h,spreads,totals&regions=us,uk,au&...`

### Keeping track of quota usage

To keep track of usage credits, every API response includes the following response headers:

- **x-requests-remaining** - The usage credits remaining until the quota resets
- **x-requests-used** - The usage credits used since the last quota reset
- **x-requests-last** - The usage cost of the last API call

## More info

- Responses with empty data do not count towards the usage quota.
- Prior to September 18th 2022, only decimal odds were captured in historical snapshots. American odds before this time are calculated from decimal odds and may include small rounding errors.
- Data errors aren't common but they can occur from time to time. We are usually quick to correct errors in the current odds API, however they can still be present in historical odds snapshots. In future we plan to remove known errors from historical snapshots.
- Bookmakers, sports and markets will only be available in the historical odds API from the time that they were added to the current odds API.
