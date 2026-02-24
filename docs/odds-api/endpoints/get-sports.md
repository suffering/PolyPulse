# GET sports

Returns a list of in-season sport objects. The sport key can be used as the `sport` parameter in other endpoints. This endpoint does not count against the usage quota.

## Endpoint

**GET** `/v4/sports/?apiKey={apiKey}`

## Parameters

- **apiKey** - The API key associated with your subscription. [See usage plans](https://the-odds-api.com/#get-access)
- **all** - Optional - if this parameter is set to true (`all=true`), a list of both in and out of season sports will be returned

Try it out in the browser

[https://api.the-odds-api.com/v4/sports/?apiKey=YOUR_API_KEY](https://api.the-odds-api.com/v4/sports/?apiKey=YOUR_API_KEY)

Viewing JSON in the browser is easier with a prettifier such as [JSON Viewer](https://chrome.google.com/webstore/detail/json-viewer/gbmdgpbipfallnflgajpaliibnhdgobh) for Chrome

## Schema

For a detailed API spec, see the [Swagger API docs](https://app.swaggerhub.com/apis-docs/the-odds-api/odds-api/4?view=uiDocs#/sports/get_v4_sports)

## Example Request

**GET** `https://api.the-odds-api.com/v4/sports/?apiKey=YOUR_API_KEY`

## Example Response

```json
[
    {
        "key": "americanfootball_ncaaf",
        "group": "American Football",
        "title": "NCAAF",
        "description": "US College Football",
        "active": true,
        "has_outrights": false
    },
    {
        "key": "americanfootball_nfl",
        "group": "American Football",
        "title": "NFL",
        "description": "US Football",
        "active": true,
        "has_outrights": false
    },
    {
        "key": "americanfootball_nfl_super_bowl_winner",
        "group": "American Football",
        "title": "NFL Super Bowl Winner",
        "description": "Super Bowl Winner 2021/2022",
        "active": true,
        "has_outrights": true
    },
    {
        "key": "aussierules_afl",
        "group": "Aussie Rules",
        "title": "AFL",
        "description": "Aussie Football",
        "active": true,
        "has_outrights": false
    },
    {
        "key": "baseball_mlb",
        "group": "Baseball",
        "title": "MLB",
        "description": "Major League Baseball",
        "active": true,
        "has_outrights": false
    },
    {
        "key": "basketball_nba",
        "group": "Basketball",
        "title": "NBA",
        "description": "US Basketball",
        "active": true,
        "has_outrights": false
    },
    {
        "key": "cricket_test_match",
        "group": "Cricket",
        "title": "Test Matches",
        "description": "International Test Matches",
        "active": true,
        "has_outrights": false
    },
    {
        "key": "golf_masters_tournament_winner",
        "group": "Golf",
        "title": "Masters Tournament Winner",
        "description": "2022 WInner",
        "active": true,
        "has_outrights": true
    },
    {
        "key": "golf_the_open_championship_winner",
        "group": "Golf",
        "title": "The Open Winner",
        "description": "2021 WInner",
        "active": true,
        "has_outrights": true
    },
    {
        "key": "golf_us_open_winner",
        "group": "Golf",
        "title": "US Open Winner",
        "description": "2021 WInner",
        "active": true,
        "has_outrights": true
    },
    {
        "key": "icehockey_nhl",
        "group": "Ice Hockey",
        "title": "NHL",
        "description": "US Ice Hockey",
        "active": true,
        "has_outrights": false
    },
    {
        "key": "mma_mixed_martial_arts",
        "group": "Mixed Martial Arts",
        "title": "MMA",
        "description": "Mixed Martial Arts",
        "active": true,
        "has_outrights": false
    },
    {
        "key": "rugbyleague_nrl",
        "group": "Rugby League",
        "title": "NRL",
        "description": "Aussie Rugby League",
        "active": true,
        "has_outrights": false
    },
    {
        "key": "soccer_australia_aleague",
        "group": "Soccer",
        "title": "A-League",
        "description": "Aussie Soccer",
        "active": true,
        "has_outrights": false
    },
    {
        "key": "soccer_brazil_campeonato",
        "group": "Soccer",
        "title": "Brazil Série A",
        "description": "Brasileirão Série A",
        "active": true,
        "has_outrights": false
    },
    {
        "key": "soccer_denmark_superliga",
        "group": "Soccer",
        "title": "Denmark Superliga",
        "description": "",
        "active": true,
        "has_outrights": false
    },
    {
        "key": "soccer_finland_veikkausliiga",
        "group": "Soccer",
        "title": "Veikkausliiga - Finland",
        "description": "",
        "active": true,
        "has_outrights": false
    },
    {
        "key": "soccer_japan_j_league",
        "group": "Soccer",
        "title": "J League",
        "description": "Japan Soccer League",
        "active": true,
        "has_outrights": false
    },
    {
        "key": "soccer_league_of_ireland",
        "group": "Soccer",
        "title": "League of Ireland",
        "description": "Airtricity League Premier Division",
        "active": true,
        "has_outrights": false
    },
    {
        "key": "soccer_norway_eliteserien",
        "group": "Soccer",
        "title": "Eliteserien - Norway",
        "description": "Norwegian Soccer",
        "active": true,
        "has_outrights": false
    },
    {
        "key": "soccer_spain_segunda_division",
        "group": "Soccer",
        "title": "La Liga 2 - Spain",
        "description": "Spanish Soccer",
        "active": true,
        "has_outrights": false
    },
    {
        "key": "soccer_sweden_allsvenskan",
        "group": "Soccer",
        "title": "Allsvenskan - Sweden",
        "description": "Swedish Soccer",
        "active": true,
        "has_outrights": false
    },
    {
        "key": "soccer_sweden_superettan",
        "group": "Soccer",
        "title": "Superettan - Sweden",
        "description": "Swedish Soccer",
        "active": true,
        "has_outrights": false
    },
    {
        "key": "soccer_uefa_european_championship",
        "group": "Soccer",
        "title": "UEFA Euro 2020",
        "description": "UEFA European Championship",
        "active": true,
        "has_outrights": false
    },
    {
        "key": "soccer_usa_mls",
        "group": "Soccer",
        "title": "MLS",
        "description": "Major League Soccer",
        "active": true,
        "has_outrights": false
    },
    {
        "key": "tennis_atp_french_open",
        "group": "Tennis",
        "title": "ATP French Open",
        "description": "Men's Singles",
        "active": true,
        "has_outrights": false
    },
    {
        "key": "tennis_wta_french_open",
        "group": "Tennis",
        "title": "WTA French Open",
        "description": "Women's Singles",
        "active": true,
        "has_outrights": false
    }
]
```

## Response Headers

Calls to the /sports endpoint will not affect the quota usage. The following response headers are returned:

- **x-requests-remaining** - The usage credits remaining until the quota resets
- **x-requests-used** - The usage credits used since the last quota reset
- **x-requests-last** - The usage cost of the last API call

## Usage Quota Costs

This endpoint does not count against the usage quota.
