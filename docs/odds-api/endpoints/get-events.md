# GET events

Returns a list of in-play and pre-match events for a specified sport or league. The response includes event id, home and away teams, and the commence time for each event. Odds are not included in the response. This endpoint does not count against the usage quota.

## Endpoint

**GET** `/v4/sports/{sport}/events?apiKey={apiKey}`

## Parameters

- **sport** - The sport key obtained from calling the /sports endpoint
- **apiKey** - The API key associated with your subscription. [See usage plans](https://the-odds-api.com/#get-access)
- **dateFormat** - Optional - Determines the format of timestamps in the response. Valid values are `unix` and `iso` (ISO 8601). Defaults to `iso`.
- **eventIds** - Optional - Comma-separated game ids. Filters the response to only return games with the specified ids.
- **commenceTimeFrom** - Optional - filter the response to show games that commence on and after this parameter. Values are in ISO 8601 format, for example 2023-09-09T00:00:00Z. This parameter has no effect if the sport is set to 'upcoming'.
- **commenceTimeTo** - Optional - filter the response to show games that commence on and before this parameter. Values are in ISO 8601 format, for example 2023-09-10T23:59:59Z. This parameter has no effect if the sport is set to 'upcoming'.
- **includeRotationNumbers** - Optional - if `true`, the response will include the home and away rotation numbers if available. See [this link](https://the-odds-api.com/releases/rotation-numbers.html) for details. Valid values are `true` or `false`.

## Schema

For the detailed API spec, see the [Swagger API docs](https://app.swaggerhub.com/apis-docs/the-odds-api/odds-api/4?view=uiDocs#/current%20events/get_v4_sports__sport__events)

## Example Request

**GET** `https://api.the-odds-api.com/v4/sports/americanfootball_nfl/events?apiKey=YOUR_API_KEY`

## Example Response

```json
[
    {
      "id": "a512a48a58c4329048174217b2cc7ce0",
      "sport_key": "americanfootball_nfl",
      "sport_title": "NFL",
      "commence_time": "2023-01-01T18:00:00Z",
      "home_team": "Atlanta Falcons",
      "away_team": "Arizona Cardinals"
    },
    {
      "id": "0ba747b1414a31b05ef37f0bf3d7fbe9",
      "sport_key": "americanfootball_nfl",
      "sport_title": "NFL",
      "commence_time": "2023-01-01T18:00:00Z",
      "home_team": "Tampa Bay Buccaneers",
      "away_team": "Carolina Panthers"
    },
    {
      "id": "d7120d8231032db343cb86b20cfaaf48",
      "sport_key": "americanfootball_nfl",
      "sport_title": "NFL",
      "commence_time": "2023-01-01T18:00:00Z",
      "home_team": "Detroit Lions",
      "away_team": "Chicago Bears"
    },
    {
      "id": "c7e2faa6faf714fbe08621a727604cd8",
      "sport_key": "americanfootball_nfl",
      "sport_title": "NFL",
      "commence_time": "2023-01-01T18:00:00Z",
      "home_team": "Washington Commanders",
      "away_team": "Cleveland Browns"
    },
    {
      "id": "2ed3fd0d267bbae31360e9f19d5adbab",
      "sport_key": "americanfootball_nfl",
      "sport_title": "NFL",
      "commence_time": "2023-01-01T18:00:00Z",
      "home_team": "Kansas City Chiefs",
      "away_team": "Denver Broncos"
    },
    ...
]
```

## Response Headers

The following response headers are returned

- **x-requests-remaining** - The usage credits remaining until the quota resets
- **x-requests-used** - The usage credits used since the last quota reset
- **x-requests-last** - The usage cost of the last API call

## Usage Quota Costs

This endpoint does not count against the usage quota.
