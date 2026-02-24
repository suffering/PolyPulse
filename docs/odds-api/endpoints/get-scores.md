# GET scores

Returns a list of upcoming, live and recently completed games for a given sport. Live and recently completed games contain scores. Games from up to 3 days ago can be returned using the `daysFrom` parameter. Live scores update approximately every 30 seconds.

The scores endpoint applies to selected sports and is gradually being expanded to more sports. See the current [list of covered sports and leagues](https://the-odds-api.com/sports-odds-data/sports-apis.html).

## Endpoint

**GET** `/v4/sports/{sport}/scores/?apiKey={apiKey}&daysFrom={daysFrom}&dateFormat={dateFormat}`

## Parameters

- **sport** - The sport key obtained from calling the /sports endpoint.
- **apiKey** - The API key associated with your subscription. [See usage plans](https://the-odds-api.com/#get-access)
- **daysFrom** - Optional - The number of days in the past from which to return completed games. Valid values are integers from `1` to `3`. If this parameter is missing, only live and upcoming games are returned.
- **dateFormat** - Optional - Determines the format of timestamps in the response. Valid values are `unix` and `iso` (ISO 8601). Defaults to `iso`.
- **eventIds** - Optional - Comma-separated game ids. Filters the response to only return games for the specified game ids.

## Schema

For the detailed API spec, see the [Swagger API docs](https://app.swaggerhub.com/apis-docs/the-odds-api/odds-api/4?view=uiDocs#/current%20events/get_v4_sports__sport__scores)

## Example Request

**GET** `https://api.the-odds-api.com/v4/sports/basketball_nba/scores/?daysFrom=1&apiKey=YOUR_API_KEY`

## Example Response

```json
[
    {
        "id": "572d984e132eddaac3da93e5db332e7e",
        "sport_key": "basketball_nba",
        "sport_title": "NBA",
        "commence_time": "2022-02-06T03:10:38Z",
        "completed": true,
        "home_team": "Sacramento Kings",
        "away_team": "Oklahoma City Thunder",
        "scores": [
            {
                "name": "Sacramento Kings",
                "score": "113"
            },
            {
                "name": "Oklahoma City Thunder",
                "score": "103"
            }
        ],
        "last_update": "2022-02-06T05:18:19Z"
    },
    {
        "id": "e2296d6d1206f8d185466876e2b444ea",
        "sport_key": "basketball_nba",
        "sport_title": "NBA",
        "commence_time": "2022-02-06T03:11:26Z",
        "completed": true,
        "home_team": "Portland Trail Blazers",
        "away_team": "Milwaukee Bucks",
        "scores": [
            {
                "name": "Portland Trail Blazers",
                "score": "108"
            },
            {
                "name": "Milwaukee Bucks",
                "score": "137"
            }
        ],
        "last_update": "2022-02-06T05:21:01Z"
    },
    {
        "id": "4b25562aa9e87b57aa16f970abaec8cc",
        "sport_key": "basketball_nba",
        "sport_title": "NBA",
        "commence_time": "2022-02-07T02:11:01Z",
        "completed": false,
        "home_team": "Los Angeles Clippers",
        "away_team": "Milwaukee Bucks",
        "scores": [
            {
                "name": "Los Angeles Clippers",
                "score": "40"
            },
            {
                "name": "Milwaukee Bucks",
                "score": "37"
            }
        ],
        "last_update": "2022-02-07T02:47:23Z"
    },
    {
        "id": "19434a586e3723c55cd3d028b90eb112",
        "sport_key": "basketball_nba",
        "sport_title": "NBA",
        "commence_time": "2022-02-08T00:10:00Z",
        "completed": false,
        "home_team": "Charlotte Hornets",
        "away_team": "Toronto Raptors",
        "scores": null,
        "last_update": null
    }
]
```

**Tip**

The game `id` field in the scores response matches the game `id` field in the odds response

## Response Headers

The following response headers are returned

- **x-requests-remaining** - The usage credits remaining until the quota resets
- **x-requests-used** - The usage credits used since the last quota reset
- **x-requests-last** - The usage cost of the last API call

## Usage Quota Costs

The usage quota cost is 2 if the `daysFrom` parameter is specified (returning completed events), otherwise the usage quota cost is 1.

**Examples**

- **Return live and upcoming games, and games completed within the last 3 days**  
  Only live and completed games will have scores  
  Cost: 2  
  Example `/v4/sports/americanfootball_nfl/scores?daysFrom=3&apiKey=...`

- **Return live and upcoming games**  
  Only live games will have scores  
  Cost: 1  
  Example `/v4/sports/americanfootball_nfl/scores?apiKey=...`

### Keeping track of quota usage

To keep track of usage credits, every API call includes the following response headers:

- **x-requests-remaining** - The usage credits remaining until the quota resets
- **x-requests-used** - The usage credits used since the last quota reset
- **x-requests-last** - The usage cost of the last API call
