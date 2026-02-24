# GET historical events

Returns a list of historical events as they appeared in the API at the given timestamp (`date` parameter). The response includes event id, home and away teams, and the commence time for each event. Odds are not included in the response. This endpoint can be used to find historical event ids to be used in the historical event odds endpoint. This endpoint is only available on paid usage plans.

## Endpoint

**GET** `/v4/historical/sports/{sport}/events?apiKey={apiKey}&date={date}`

## Parameters

- **sport** - The sport key obtained from calling the /sports endpoint
- **apiKey** - The API key associated with your subscription. [See usage plans](https://the-odds-api.com/#get-access)
- **date** - The timestamp of the data snapshot to be returned, specified in ISO8601 format, for example `2021-10-18T12:00:00Z` The historical odds API will return the closest snapshot equal to or earlier than the provided `date` parameter.
- **dateFormat** - Optional - Determines the format of timestamps in the response. Valid values are `unix` and `iso` (ISO 8601). Defaults to `iso`.
- **eventIds** - Optional - Comma-separated game ids. Filters the response to only return games with the specified ids.
- **commenceTimeFrom** - Optional - filter the response to show games that commence on and after this parameter. Values are in ISO 8601 format, for example 2023-09-09T00:00:00Z. This parameter has no effect if the sport is set to 'upcoming'.
- **commenceTimeTo** - Optional - filter the response to show games that commence on and before this parameter. Values are in ISO 8601 format, for example 2023-09-10T23:59:59Z. This parameter has no effect if the sport is set to 'upcoming'.
- **includeRotationNumbers** - Optional - if `true`, the response will include the home and away rotation numbers if available. See [this link](https://the-odds-api.com/releases/rotation-numbers.html) for details. Valid values are `true` or `false`.

## Schema

For the detailed API spec, see the [Swagger API docs](https://app.swaggerhub.com/apis-docs/the-odds-api/odds-api/4?view=uiDocs#/historical%20events/get_v4_historical_sports__sport__events)

## Example Request

**GET** `https://api.the-odds-api.com/v4/historical/sports/basketball_nba/events?apiKey=YOUR_API_KEY&date=2023-11-29T22:42:00Z`

## Example Response

The response schema is almost the same as that of the /events endpoint, but wrapped in a structure that contains information about the snapshot, including:

- **timestamp** - The timestamp of the snapshot. This will be the closest available timestamp equal to or earlier than the provided date parameter.
- **previous_timestamp** - the preceding available timestamp. This can be used as the date parameter in a new request to move back in time.
- **next_timestamp** - The next available timestamp. This can be used as the date parameter in a new request to move forward in time.

```json
{
    "timestamp": "2023-11-29T22:40:39Z",
    "previous_timestamp": "2023-11-29T22:35:39Z",
    "next_timestamp": "2023-11-29T22:45:40Z",
    "data": [
        {
            "id": "da359da99aa27e97d38f2df709343998",
            "sport_key": "basketball_nba",
            "sport_title": "NBA",
            "commence_time": "2023-11-30T00:10:00Z",
            "home_team": "Detroit Pistons",
            "away_team": "Los Angeles Lakers"
        },
        {
            "id": "0a502b246aa29f8ac2edb7a3ddf71ae9",
            "sport_key": "basketball_nba",
            "sport_title": "NBA",
            "commence_time": "2023-11-30T00:10:00Z",
            "home_team": "Orlando Magic",
            "away_team": "Washington Wizards"
        },
        {
            "id": "2667f897a67e6cdad61bd26a3b941d83",
            "sport_key": "basketball_nba",
            "sport_title": "NBA",
            "commence_time": "2023-11-30T00:40:00Z",
            "home_team": "Toronto Raptors",
            "away_team": "Phoenix Suns"
        },
        ...
    ]
}
```

## Response Headers

The following response headers are returned

- **x-requests-remaining** - The usage credits remaining until the quota resets
- **x-requests-used** - The usage credits used since the last quota reset
- **x-requests-last** - The usage cost of the last API call

## Usage Quota Costs

This endpoint costs 1 from usage quota. If no events are found, it will not cost.
