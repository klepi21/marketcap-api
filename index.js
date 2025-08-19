const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

const CMC_API = 'https://pro-api.coinmarketcap.com/v1';
const API_KEY = 'dedeeaca-864e-411f-831a-d23b379b4015';

app.get('/api/marketcap', async (req, res) => {
  try {
    const response = await axios.get(`${CMC_API}/global-metrics/quotes/latest`, {
      headers: {
        'X-CMC_PRO_API_KEY': API_KEY,
        'Accept': 'application/json'
      }
    });
    
    const marketCap = response.data.data.quote.USD.total_market_cap;
    res.json({ marketCap: marketCap });
  } catch (error) {
    console.error('Error fetching market cap:', error);
    res.status(500).json({ error: 'Failed to fetch market cap' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});