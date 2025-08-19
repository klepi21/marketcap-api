import { NextResponse } from 'next/server';
import axios, { AxiosError } from 'axios';

const CMC_API = 'https://pro-api.coinmarketcap.com/v1';
const API_KEY = 'dedeeaca-864e-411f-831a-d23b379b4015';

interface CMCResponse {
  data: {
    quote: {
      USD: {
        total_market_cap: number;
        total_volume_24h: number;
        last_updated: string;
      };
    };
  };
  status: {
    timestamp: string;
    error_code: number;
    error_message: string | null;
  };
}

async function fetchMarketCap() {
  try {
    // Fetch from CoinMarketCap API
    const response = await axios.get<CMCResponse>(`${CMC_API}/global-metrics/quotes/latest`, {
      headers: {
        'X-CMC_PRO_API_KEY': API_KEY,
        'Accept': 'application/json'
      }
    });
    
    const marketCap = response.data.data.quote.USD.total_market_cap;
    const volume24h = response.data.data.quote.USD.total_volume_24h;
    const lastUpdated = response.data.data.quote.USD.last_updated;
    
    return {
      marketCap,
      volume24h,
      lastUpdated,
      timestamp: Date.now()
    };
  } catch (error) {
    if (error instanceof AxiosError) {
      console.error('Error details:', error.response?.data || error.message);
      // If we hit rate limit, throw specific error
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded');
      }
    } else {
      console.error('Unknown error:', error);
    }
    throw error;
  }
}

export async function GET() {
  try {
    const data = await fetchMarketCap();
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof AxiosError) {
      const status = error.response?.status === 429 ? 429 : 500;
      return NextResponse.json(
        { 
          error: 'Failed to fetch market cap',
          details: error.response?.data || error.message,
          timestamp: new Date().toISOString()
        },
        { status }
      );
    }
    return NextResponse.json(
      { 
        error: 'Failed to fetch market cap',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Make sure the endpoint is always fresh
export const dynamic = 'force-dynamic';
export const runtime = 'edge';