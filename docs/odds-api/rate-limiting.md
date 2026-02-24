# Rate Limiting (status code 429)

Requests are rate limited in order to protect our systems from sudden bursts in traffic. If you encounter the rate limit, the API will respond with a status code of 429, in which case try spacing out requests over several seconds. More information can be [found here](https://the-odds-api.com/liveapi/guides/v4/api-error-codes.html#exceeded-freq-limit).

## Handling Rate Limits

When you receive a 429 status code:

1. Wait a few seconds before retrying
2. Implement exponential backoff for retries
3. Consider reducing the frequency of your API calls
4. Monitor your request rate to stay within limits

## Best Practices

- Space out requests over several seconds
- Implement request queuing for bulk operations
- Cache responses when possible to reduce API calls
- Monitor response headers for rate limit information
