# GET event markets

Returns available market keys for each bookmaker for a single event.

This endpoint only returns recently seen market keys for each bookmaker - it is not a comprehensive list of all supported markets. As an event's commence time approaches, this endpoint will return more market keys as bookmakers open more markets.

## Endpoint

**GET** `/v4/sports/{sport}/events/{eventId}/markets?apiKey={apiKey}&regions={regions}&dateFormat={dateFormat}`

## Parameters

- **sport** - The sport key obtained from calling the sports endpoint.
- **eventId** - The id of an upcoming or live game. Event ids can be found in the "id" field in the response of the events endpoint.
- **apiKey** - The API key associated with your subscription. [See usage plans](https://the-odds-api.com/#get-access)
- **regions** - Determines the bookmakers to be returned. For example, `us`, `us2` (United States), `uk` (United Kingdom), `au` (Australia) and `eu` (Europe). Multiple regions can be specified if comma delimited. See the [list of bookmakers by region](https://the-odds-api.com/sports-odds-data/bookmaker-apis.html).
- **bookmakers** - Optional - Comma-separated list of bookmakers to be returned. If both `bookmakers` and `regions` are both specified, `bookmakers` takes priority. Bookmakers can be from any region. Every group of 10 bookmakers is the equivalent of 1 region. For example, specifying up to 10 bookmakers counts as 1 region. Specifying between 11 and 20 bookmakers counts as 2 regions.
- **dateFormat** - Optional - Determines the format of timestamps in the response. Valid values are `unix` and `iso` (ISO 8601). Defaults to `iso`.

## Schema

For the detailed API spec, see the [Swagger API docs](https://app.swaggerhub.com/apis-docs/the-odds-api/odds-api/4?view=uiDocs#/current%20events/get_v4_sports__sport__events__eventId__markets)

## Example Request

**GET** `https://api.the-odds-api.com/v4/sports/baseball_mlb/events/19699ba901294e39cb07fc4f19929a38/markets?apiKey=YOUR_API_KEY&regions=us`

## Example Response

```json
{
    "id": "19699ba901294e39cb07fc4f19929a38",
    "sport_key": "baseball_mlb",
    "sport_title": "MLB",
    "commence_time": "2025-08-06T16:36:00Z",
    "home_team": "Philadelphia Phillies",
    "away_team": "Baltimore Orioles",
    "bookmakers": [
        {
            "key": "fanduel",
            "title": "FanDuel",
            "markets": [
                {
                    "key": "alternate_spreads",
                    "last_update": "2025-08-06T07:39:57Z"
                },
                {
                    "key": "batter_doubles",
                    "last_update": "2025-08-06T07:39:57Z"
                },
                {
                    "key": "batter_hits",
                    "last_update": "2025-08-06T07:39:57Z"
                },
                {
                    "key": "batter_home_runs",
                    "last_update": "2025-08-06T07:39:57Z"
                },
                ...
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

A call to this endpoint costs 1 usage credit.
