/**
 * Play On Pricing Tool - API Routes
 * Handles price lookups from multiple sources
 */

const express = require('express');
const router = express.Router();
const PriceFetcher = require('../utils/priceFetcher');
const NodeCache = require('node-cache');

// Cache prices for 1 hour to reduce API calls
const priceCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

// Price lookup endpoint
router.get('/price', async (req, res) => {
  try {
    const { query, platform, upc } = req.query;
    
    if (!query && !upc) {
      return res.status(400).json({ 
        error: 'Missing required parameter: query or upc' 
      });
    }

    // Generate cache key
    const cacheKey = `price_${(query || upc).toLowerCase()}_${platform || 'all'}`;
    
    // Check cache first
    const cachedResult = priceCache.get(cacheKey);
    if (cachedResult) {
      return res.json({ ...cachedResult, cached: true });
    }

    // Fetch fresh prices
    const priceFetcher = new PriceFetcher();
    const result = await priceFetcher.lookupPrice(query || upc, platform);
    
    // Cache the result
    priceCache.set(cacheKey, result);
    
    res.json({ ...result, cached: false });
    
  } catch (error) {
    console.error('Price lookup error:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch price data',
      message: error.message 
    });
  }
});

// Search suggestions endpoint
router.get('/search', async (req, res) => {
  try {
    const { q, platform } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ suggestions: [] });
    }

    const priceFetcher = new PriceFetcher();
    const suggestions = await priceFetcher.searchGames(q, platform);
    
    res.json({ suggestions });
    
  } catch (error) {
    console.error('Search error:', error.message);
    res.status(500).json({ 
      error: 'Search failed',
      suggestions: [] 
    });
  }
});

// ROI calculation endpoint
router.post('/calculate-roi', (req, res) => {
  try {
    const { marketValue, costPaid, condition, sellPricePercent = 0.85 } = req.body;
    
    if (!marketValue || !costPaid) {
      return res.status(400).json({ 
        error: 'Missing required fields: marketValue and costPaid' 
      });
    }

    const conditionAdjustments = {
      'like-new': 1.0,
      'excellent': 0.95,
      'good': 0.85,
      'acceptable': 0.70
    };

    const conditionMultiplier = conditionAdjustments[condition] || 1.0;
    const adjustedMarketValue = marketValue * conditionMultiplier;
    
    const sellPrice85 = Math.round(adjustedMarketValue * 0.85 * 100) / 100;
    const sellPrice90 = Math.round(adjustedMarketValue * 0.90 * 100) / 100;
    
    const grossProfit85 = Math.round((sellPrice85 - costPaid) * 100) / 100;
    const grossProfit90 = Math.round((sellPrice90 - costPaid) * 100) / 100;
    
    const roi85 = costPaid > 0 ? Math.round((grossProfit85 / costPaid) * 100) : 0;
    const roi90 = costPaid > 0 ? Math.round((grossProfit90 / costPaid) * 100) : 0;
    
    // Profit thresholds
    const minProfitThreshold = 5; // Minimum $5 profit
    const maxCostPercent = 0.50; // Max 50% of market value
    
    const isProfitable = grossProfit85 >= minProfitThreshold;
    const isBelowMaxCost = costPaid <= (adjustedMarketValue * maxCostPercent);
    const recommendation = isProfitable && isBelowMaxCost ? 'buy' : 'pass';

    res.json({
      input: {
        marketValue,
        costPaid,
        condition,
        conditionMultiplier
      },
      adjusted: {
        marketValue: adjustedMarketValue
      },
      pricing: {
        sellPrice85,
        sellPrice90,
        grossProfit85,
        grossProfit90,
        roi85,
        roi90
      },
      recommendation: {
        action: recommendation,
        isProfitable,
        isBelowMaxCost,
        minProfitThreshold,
        maxCostPercent: maxCostPercent * 100
      }
    });
    
  } catch (error) {
    console.error('ROI calculation error:', error.message);
    res.status(500).json({ 
      error: 'Calculation failed',
      message: error.message 
    });
  }
});

// Platform lookup
router.get('/platforms', (req, res) => {
  const platforms = [
    { code: 'PS5', name: 'PlayStation 5', pricecharting: 'playstation-5' },
    { code: 'PS4', name: 'PlayStation 4', pricecharting: 'playstation-4' },
    { code: 'PS3', name: 'PlayStation 3', pricecharting: 'playstation-3' },
    { code: 'PS2', name: 'PlayStation 2', pricecharting: 'playstation-2' },
    { code: 'PS1', name: 'PlayStation', pricecharting: 'playstation' },
    { code: 'PSP', name: 'PSP', pricecharting: 'psp' },
    { code: 'VITA', name: 'PS Vita', pricecharting: 'playstation-vita' },
    { code: 'XSX', name: 'Xbox Series X/S', pricecharting: 'xbox-series-x' },
    { code: 'XB1', name: 'Xbox One', pricecharting: 'xbox-one' },
    { code: 'X360', name: 'Xbox 360', pricecharting: 'xbox-360' },
    { code: 'XBOX', name: 'Xbox', pricecharting: 'xbox' },
    { code: 'NSW', name: 'Nintendo Switch', pricecharting: 'nintendo-switch' },
    { code: 'WIIU', name: 'Wii U', pricecharting: 'wii-u' },
    { code: 'WII', name: 'Wii', pricecharting: 'wii' },
    { code: 'GCN', name: 'GameCube', pricecharting: 'gamecube' },
    { code: 'N64', name: 'Nintendo 64', pricecharting: 'nintendo-64' },
    { code: 'SNES', name: 'Super Nintendo', pricecharting: 'super-nintendo' },
    { code: 'NES', name: 'NES', pricecharting: 'nes' },
    { code: '3DS', name: 'Nintendo 3DS', pricecharting: 'nintendo-3ds' },
    { code: 'DS', name: 'Nintendo DS', pricecharting: 'nintendo-ds' },
    { code: 'GBA', name: 'Game Boy Advance', pricecharting: 'gameboy-advance' },
    { code: 'GBC', name: 'Game Boy Color', pricecharting: 'gameboy-color' },
    { code: 'GB', name: 'Game Boy', pricecharting: 'gameboy' },
    { code: 'GEN', name: 'Sega Genesis', pricecharting: 'sega-genesis' },
    { code: 'DC', name: 'Dreamcast', pricecharting: 'sega-dreamcast' },
    { code: 'SAT', name: 'Saturn', pricecharting: 'sega-saturn' }
  ];
  
  res.json({ platforms });
});

// Cache stats (for monitoring)
router.get('/cache-stats', (req, res) => {
  res.json({
    stats: priceCache.getStats(),
    keys: priceCache.keys().length
  });
});

module.exports = router;
