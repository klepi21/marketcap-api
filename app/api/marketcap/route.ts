import { NextResponse } from 'next/server';
import axios from 'axios';

const CMC_API = 'https://pro-api.coinmarketcap.com/v1';
const API_KEY = 'dedeeaca-864e-411f-831a-d23b379b4015';

function formatMarketCap(value: number): string {
  const trillion = 1_000_000_000_000.0;
  const trillionValue = value / trillion;
  return String(trillionValue.toFixed(2));
}

export async function GET() {
  try {
    const response = await axios.get(`${CMC_API}/global-metrics/quotes/latest`, {
      headers: {
        'X-CMC_PRO_API_KEY': API_KEY,
        'Accept': 'application/json'
      }
    });
    
    const marketCap = response.data.data.quote.USD.total_market_cap;
    return NextResponse.json({
      marketCap: formatMarketCap(marketCap)
    });
  } catch (error) {
    console.error('Error fetching market cap:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market cap' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';