const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

const CMC_API = 'https://pro-api.coinmarketcap.com/v1';
const API_KEY = 'dedeeaca-864e-411f-831a-d23b379b4015';

// Cache configuration
let cachedMarketCap = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const MIN_TIME_BETWEEN_CALLS = 5000; // 5 seconds minimum between API calls

app.get('/marketcap', async (req, res) => {
  const now = Date.now();

  // Return cached data if it's fresh enough
  if (cachedMarketCap && (now - lastFetchTime < CACHE_DURATION)) {
    console.log('Returning cached market cap:', cachedMarketCap);
    return res.json({ marketCap: cachedMarketCap });
  }

  // If we're hitting the API too frequently, return cached data or error
  if (now - lastFetchTime < MIN_TIME_BETWEEN_CALLS) {
    if (cachedMarketCap) {
      console.log('Rate limit hit, returning cached market cap:', cachedMarketCap);
      return res.json({ marketCap: cachedMarketCap });
    }
    return res.status(429).json({ error: 'Too many requests', message: 'Please try again in a few seconds' });
  }

  try {
    const response = await axios.get(`${CMC_API}/global-metrics/quotes/latest`, {
      headers: {
        'X-CMC_PRO_API_KEY': API_KEY,
        'Accept': 'application/json'
      }
    });
    
    const marketCap = response.data.data.quote.USD.total_market_cap;
    
    // Only update cache if we got a valid number
    if (marketCap > 0) {
      cachedMarketCap = marketCap;
      lastFetchTime = now;
    }
    
    console.log('Fetched new market cap:', marketCap);
    res.json({ marketCap: marketCap });
    
  } catch (error) {
    console.error('Error fetching market cap:', error.message);
    
    // Return cached data if available, otherwise return error
    if (cachedMarketCap) {
      console.log('Error fetching, returning cached market cap:', cachedMarketCap);
      return res.json({ 
        marketCap: cachedMarketCap,
        isCached: true,
        error: 'Failed to fetch fresh data, returning cached value'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch market cap',
      message: error.message
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});