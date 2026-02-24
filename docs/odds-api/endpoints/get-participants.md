# GET participants

Returns list of participants for a given sport. Depending on the sport, a participant can be either a team or an individual. For example for NBA, a list of teams is returned. For tennis, a list of players is returned.

This endpoint does not return players on a team.

The returned list should be treated as a whitelist and may include participants that are not currently active.

## Endpoint

**GET** `/v4/sports/{sport}/participants?apiKey={apiKey}`

## Parameters

- **sport** - The sport key obtained from calling the /sports endpoint
- **apiKey** - The API key associated with your subscription. [See usage plans](https://the-odds-api.com/#get-access)

## Schema

For the detailed API spec, see the [Swagger API docs](https://app.swaggerhub.com/apis-docs/the-odds-api/odds-api/4?view=uiDocs#/default/get_v4_sports__sport__participants)

## Example Request

**GET** `https://api.the-odds-api.com/v4/sports/americanfootball_nfl/participants?apiKey=YOUR_API_KEY`

## Example Response

```json
[
    {
        "full_name": "Arizona Cardinals",
        "id": "par_01hqmkr1xsfxmrj5pdq0f23asx"
    },
    {
        "full_name": "Atlanta Falcons",
        "id": "par_01hqmkr1xtexkbhkq7ct921rne"
    },
    {
        "full_name": "Baltimore Ravens",
        "id": "par_01hqmkr1xvev9rf557fy09k2cx"
    },
    {
        "full_name": "Buffalo Bills",
        "id": "par_01hqmkr1xwe6prjwr3j4gpqwx8"
    },
    {
        "full_name": "Carolina Panthers",
        "id": "par_01hqmkr1xxf2ebbqzb95qzxxxm"
    },
    {
        "full_name": "Chicago Bears",
        "id": "par_01hqmkr1xye20ahvp8fr2bvt74"
    },
    {
        "full_name": "Cincinnati Bengals",
        "id": "par_01hqmkr1xze7xbceshy9tka512"
    },
    {
        "full_name": "Cleveland Browns",
        "id": "par_01hqmkr1y0ez5bem3gdncd8a0d"
    },
    {
        "full_name": "Dallas Cowboys",
        "id": "par_01hqmkr1y1esas88pmaxe87by4"
    },
    {
        "full_name": "Denver Broncos",
        "id": "par_01hqmkr1y2e15tjsz9afcsj7da"
    },
    {
        "full_name": "Detroit Lions",
        "id": "par_01hqmkr1y3fex9sq94dgg1107y"
    },
    {
        "full_name": "Green Bay Packers",
        "id": "par_01hqmkr1y4ez38hyananses4hq"
    },
    {
        "full_name": "Houston Texans",
        "id": "par_01hqmkr1y5f63reha26n71p2jx"
    },
    {
        "full_name": "Indianapolis Colts",
        "id": "par_01hqmkr1y6f10rxbf8y2y2xthh"
    },
    {
        "full_name": "Jacksonville Jaguars",
        "id": "par_01hqmkr1y7e2r9kcn2qe0dt1d5"
    },
    {
        "full_name": "Kansas City Chiefs",
        "id": "par_01hqmkr1y8e9gt2q2rhmv196pv"
    },
    {
        "full_name": "Las Vegas Raiders",
        "id": "par_01hqmkr1y9fkaaeekn9w035jft"
    },
    {
        "full_name": "Los Angeles Chargers",
        "id": "par_01hqmkr1yafvas6wtv3jfs9f7a"
    },
    {
        "full_name": "Los Angeles Rams",
        "id": "par_01hqmkr1ybfmfb8mhz10drfe21"
    },
    {
        "full_name": "Miami Dolphins",
        "id": "par_01hqmkr1ycf7dsbr1997gz03y9"
    },
    {
        "full_name": "Minnesota Vikings",
        "id": "par_01hqmkr1ydf6vrfmd5f07caj88"
    },
    {
        "full_name": "New England Patriots",
        "id": "par_01hqmkr1yeffz9y9spwv8bx3na"
    },
    {
        "full_name": "New Orleans Saints",
        "id": "par_01hqmkr1yfe62tp0rvy8bn2jyc"
    },
    {
        "full_name": "New York Giants",
        "id": "par_01hqmkr1ygfzrv5sqe2v97c43e"
    },
    {
        "full_name": "New York Jets",
        "id": "par_01hqmkr1yhe4sb3y0wfzga67tf"
    },
    {
        "full_name": "Philadelphia Eagles",
        "id": "par_01hqmkr1yjedgakx37g743855e"
    },
    {
        "full_name": "Pittsburgh Steelers",
        "id": "par_01hqmkr1yker5bwcznt0b1jpj1"
    },
    {
        "full_name": "San Francisco 49ers",
        "id": "par_01hqmkr1ymfv0a8kfg96ha10ag"
    },
    {
        "full_name": "Seattle Seahawks",
        "id": "par_01hqmkr1ynfwaa91y9zvagkavd"
    },
    {
        "full_name": "Tampa Bay Buccaneers",
        "id": "par_01hqmkr1ypeszan8sq8dh7rqbg"
    },
    {
        "full_name": "Tennessee Titans",
        "id": "par_01hqmkr1yqexebpc06vyfwxqqm"
    },
    {
        "full_name": "Washington Commanders",
        "id": "par_01hqmkr1yrfsvbjjasn01a7xz4"
    }
]
```

## Response Headers

The following response headers are returned

- **x-requests-remaining** - The usage credits remaining until the quota resets
- **x-requests-used** - The usage credits used since the last quota reset
- **x-requests-last** - The usage cost of the last API call

## Usage Quota Costs

A call to this endpoint costs 1 usage credit.
