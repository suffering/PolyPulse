# Code Samples

Get started right away with [code samples for Python and NodeJs](https://the-odds-api.com/liveapi/guides/v4/samples.html). Code samples are also available on [Github](https://github.com/the-odds-api)

## Quick Start Examples

### Python

```python
import requests

# Get sports
sports_response = requests.get(
    'https://api.the-odds-api.com/v4/sports',
    params={'apiKey': 'YOUR_API_KEY'}
)
sports = sports_response.json()

# Get odds for a sport
odds_response = requests.get(
    f'https://api.the-odds-api.com/v4/sports/{sport_key}/odds',
    params={
        'apiKey': 'YOUR_API_KEY',
        'regions': 'us',
        'markets': 'h2h',
        'oddsFormat': 'american'
    }
)
odds = odds_response.json()
```

### Node.js

```javascript
const axios = require('axios');

// Get sports
const sportsResponse = await axios.get(
  'https://api.the-odds-api.com/v4/sports',
  { params: { apiKey: 'YOUR_API_KEY' } }
);
const sports = sportsResponse.data;

// Get odds for a sport
const oddsResponse = await axios.get(
  `https://api.the-odds-api.com/v4/sports/${sportKey}/odds`,
  {
    params: {
      apiKey: 'YOUR_API_KEY',
      regions: 'us',
      markets: 'h2h',
      oddsFormat: 'american'
    }
  }
);
const odds = oddsResponse.data;
```

## Additional Resources

- [Official Code Samples](https://the-odds-api.com/liveapi/guides/v4/samples.html)
- [GitHub Repository](https://github.com/the-odds-api)
- [Swagger API Documentation](https://app.swaggerhub.com/apis-docs/the-odds-api/odds-api/4)
