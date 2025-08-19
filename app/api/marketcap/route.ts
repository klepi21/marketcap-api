import { NextResponse } from 'next/server';
import axios, { AxiosError } from 'axios';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';
const API_KEY = 'CG-VqoAu8R54gsE7ZLLDxekGPvX';

interface CoinGeckoResponse {
  data: {
    total_market_cap: {
      usd: number;
    };
  };
}

async function fetchMarketCap() {
  try {
    // Fetch from CoinGecko API
    const response = await axios.get<CoinGeckoResponse>(`${COINGECKO_API}/global`, {
      headers: {
        'x-cg-pro-api-key': API_KEY,
        'Accept': 'application/json'
      }
    });
    
    const marketCap = response.data.data.total_market_cap.usd;
    const timestamp = Date.now();
    
    return {
      marketCap,
      timestamp,
      lastUpdated: new Date(timestamp).toISOString()
    };
  } catch (error) {
    if (error instanceof AxiosError) {
      console.error('Error details:', error.response?.data || error.message);
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
      return NextResponse.json(
        { 
          error: 'Failed to fetch market cap',
          details: error.response?.data || error.message,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
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