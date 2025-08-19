const axios = require('axios');

const CMC_API = 'https://pro-api.coinmarketcap.com/v1';
const API_KEY = 'dedeeaca-864e-411f-831a-d23b379b4015';

function formatMarketCap(value) {
  const trillion = 1_000_000_000_000.0;
  const trillionValue = value / trillion;
  return trillionValue.toFixed(2);
}

module.exports = async (req, res) => {
  try {
    const response = await axios.get(`${CMC_API}/global-metrics/quotes/latest`, {
      headers: {
        'X-CMC_PRO_API_KEY': API_KEY,
        'Accept': 'application/json'
      }
    });
    
    const marketCap = response.data.data.quote.USD.total_market_cap;
    res.json({ marketCap: formatMarketCap(marketCap) });
  } catch (error) {
    console.error('Error fetching market cap:', error);
    res.status(500).json({ error: 'Failed to fetch market cap' });
  }
};
