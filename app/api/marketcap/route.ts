import { NextResponse } from 'next/server';
import axios from 'axios';
import Pusher from 'pusher';
import { kv } from '@vercel/kv';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';
const API_KEY = 'CG-VqoAu8R54gsE7ZLLDxekGPvX';
const CACHE_KEY = 'total_marketcap';
const CACHE_TTL = 300; // 5 minutes cache to stay within limits

// Rate limiting constants
const CALLS_PER_MINUTE_LIMIT = 30;
const MONTHLY_CALLS_TARGET = 9995;
const CALLS_PER_HOUR = Math.floor(MONTHLY_CALLS_TARGET / (30 * 24)); // ~14 calls per hour
const MINIMUM_INTERVAL = Math.ceil(60 / CALLS_PER_MINUTE_LIMIT * 1000); // Minimum ms between calls

// Initialize Pusher
const pusher = new Pusher({
  appId: "2039169",
  key: "f58a58a4ff460ccb28c3",
  secret: "b5d73646014e4d1f5235",
  cluster: "us2",
  useTLS: true,
});

let lastApiCallTime = 0;
let apiCallsThisHour = 0;
let hourStartTime = new Date().setMinutes(0, 0, 0);

async function shouldMakeApiCall() {
  const now = Date.now();
  
  // Reset hourly counter if we're in a new hour
  if (now - hourStartTime >= 3600000) {
    apiCallsThisHour = 0;
    hourStartTime = new Date().setMinutes(0, 0, 0);
  }

  // Check if we're within our hourly limit
  if (apiCallsThisHour >= CALLS_PER_HOUR) {
    return false;
  }

  // Ensure minimum interval between calls
  if (now - lastApiCallTime < MINIMUM_INTERVAL) {
    return false;
  }

  return true;
}

async function fetchMarketCap() {
  try {
    // Check cache first
    const cached = await kv.get(CACHE_KEY);
    if (cached) {
      const cachedData = JSON.parse(cached.toString());
      // If cache is less than 5 minutes old, use it
      if (Date.now() - cachedData.timestamp < CACHE_TTL * 1000) {
        return cachedData;
      }
    }

    // Check if we should make an API call
    if (!await shouldMakeApiCall()) {
      // Return cached data even if expired
      if (cached) {
        return JSON.parse(cached.toString());
      }
      throw new Error('Rate limit reached');
    }

    // Update API call tracking
    lastApiCallTime = Date.now();
    apiCallsThisHour++;

    // Fetch from CoinGecko API
    const response = await axios.get(`${COINGECKO_API}/global`);
    
    const marketCap = response.data.data.total_market_cap.usd;
    const timestamp = Date.now();
    
    const data = {
      marketCap,
      timestamp,
      lastUpdated: new Date(timestamp).toISOString()
    };
    
    // Cache the result
    await kv.set(CACHE_KEY, JSON.stringify(data), { ex: CACHE_TTL });
    
    // Broadcast via Pusher only if value changed significantly (>0.1%)
    if (!cached || Math.abs(marketCap - JSON.parse(cached.toString()).marketCap) / marketCap > 0.001) {
      await pusher.trigger('market-cap', 'update', data);
    }

    return data;
  } catch (error) {
    console.error('Error fetching market cap:', error);
    
    // If we have cached data, return it
    const cached = await kv.get(CACHE_KEY);
    if (cached) {
      return JSON.parse(cached.toString());
    }
    
    throw new Error('Failed to fetch market cap and no cache available');
  }
}

export async function GET() {
  try {
    const data = await fetchMarketCap();
    return NextResponse.json({
      ...data,
      pusherChannel: 'market-cap',
      pusherEvent: 'update',
      pusherKey: "f58a58a4ff460ccb28c3",
      pusherCluster: "us2",
      nextUpdate: new Date(lastApiCallTime + CACHE_TTL * 1000).toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch market cap' },
      { status: 500 }
    );
  }
}

// Force dynamic to handle rate limiting properly
export const dynamic = 'force-dynamic';