const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

const CMC_API = 'https://pro-api.coinmarketcap.com/v1';
const API_KEY = 'dedeeaca-864e-411f-831a-d23b379b4015';
const CACHE_FILE = path.join(__dirname, 'cache.json');

// In-memory cache
let memoryCache = {
  marketCap: null,
  lastUpdated: null
};

// Load cache from file on startup
async function loadCache() {
  try {
    const data = await fs.readFile(CACHE_FILE, 'utf8');
    memoryCache = JSON.parse(data);
    console.log('Cache loaded from file:', memoryCache);
  } catch (error) {
    console.log('No cache file found or error reading cache:', error.message);
  }
}

// Save cache to file
async function saveCache() {
  try {
    await fs.writeFile(CACHE_FILE, JSON.stringify(memoryCache));
    console.log('Cache saved to file');
  } catch (error) {
    console.error('Error saving cache:', error);
  }
}

// Initialize cache on startup
loadCache();

app.get('/api/marketcap', async (req, res) => {
  try {
    // Check if we have recent cache (less than 5 minutes old)
    const now = Date.now();
    const cacheAge = now - (memoryCache.lastUpdated || 0);
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    if (memoryCache.marketCap && cacheAge < CACHE_DURATION) {
      console.log('Returning cached market cap:', memoryCache.marketCap);
      return res.json({ 
        marketCap: memoryCache.marketCap,
        lastUpdated: memoryCache.lastUpdated,
        fromCache: true 
      });
    }

    const response = await axios.get(`${CMC_API}/global-metrics/quotes/latest`, {
      headers: {
        'X-CMC_PRO_API_KEY': API_KEY,
        'Accept': 'application/json'
      }
    });
    
    const marketCap = response.data.data.quote.USD.total_market_cap;
    
    // Update cache
    memoryCache = {
      marketCap: marketCap,
      lastUpdated: now
    };
    
    // Save to file asynchronously
    saveCache();

    res.json({ 
      marketCap: marketCap,
      lastUpdated: now,
      fromCache: false 
    });
  } catch (error) {
    console.error('Error fetching market cap:', error);
    
    // If we have cached data, return it as fallback
    if (memoryCache.marketCap) {
      console.log('Returning cached data as fallback');
      return res.json({ 
        marketCap: memoryCache.marketCap,
        lastUpdated: memoryCache.lastUpdated,
        fromCache: true,
        isError: true 
      });
    }
    
    res.status(500).json({ error: 'Failed to fetch market cap' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});