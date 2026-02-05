/**
 * Play On Pricing Tool - Price Fetcher
 * Aggregates pricing data from multiple sources
 */

const axios = require('axios');
const cheerio = require('cheerio');
const UserAgent = require('user-agents');

class PriceFetcher {
  constructor() {
    this.userAgent = new UserAgent({ deviceCategory: 'desktop' });
    this.timeout = 10000; // 10 second timeout
  }

  /**
   * Get random user agent to avoid blocking
   */
  getHeaders() {
    return {
      'User-Agent': this.userAgent.random().toString(),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    };
  }

  /**
   * Main price lookup - tries PriceCharting first, then eBay
   */
  async lookupPrice(query, platform = null) {
    const results = {
      query,
      platform,
      timestamp: new Date().toISOString(),
      sources: {},
      bestPrice: null,
      priceRange: { low: null, high: null }
    };

    // Try PriceCharting
    try {
      const pcData = await this.fetchPriceCharting(query, platform);
      if (pcData) {
        results.sources.pricecharting = pcData;
      }
    } catch (error) {
      console.error('PriceCharting fetch error:', error.message);
      results.sources.pricecharting = { error: error.message };
    }

    // Try eBay sold listings
    try {
      const ebayData = await this.fetchEbaySold(query, platform);
      if (ebayData) {
        results.sources.ebay = ebayData;
      }
    } catch (error) {
      console.error('eBay fetch error:', error.message);
      results.sources.ebay = { error: error.message };
    }

    // Calculate best price from available sources
    results.bestPrice = this.calculateBestPrice(results.sources);
    results.priceRange = this.calculatePriceRange(results.sources);
    
    // Add Play On pricing recommendations
    if (results.bestPrice) {
      results.playOnPricing = {
        sellPrice85: Math.round(results.bestPrice * 0.85 * 100) / 100,
        sellPrice90: Math.round(results.bestPrice * 0.90 * 100) / 100,
        maxBuyPrice50: Math.round(results.bestPrice * 0.50 * 100) / 100,
        maxBuyPrice40: Math.round(results.bestPrice * 0.40 * 100) / 100
      };
    }

    return results;
  }

  /**
   * Fetch pricing data from PriceCharting
   */
  async fetchPriceCharting(query, platform) {
    // Build search URL
    const platformSlug = this.getPriceChartingPlatform(platform);
    const searchQuery = encodeURIComponent(query);
    
    let searchUrl = `https://www.pricecharting.com/search-products?q=${searchQuery}&type=videogames`;
    if (platformSlug) {
      searchUrl += `&console=${platformSlug}`;
    }

    try {
      const response = await axios.get(searchUrl, {
        headers: this.getHeaders(),
        timeout: this.timeout
      });

      const $ = cheerio.load(response.data);
      
      // Check if we got direct product page or search results
      const productTitle = $('#product_name').text().trim();
      
      if (productTitle) {
        // Direct product page
        return this.parsePriceChartingProduct($, productTitle);
      }

      // Parse search results
      const results = [];
      $('.offer').each((i, el) => {
        if (i >= 5) return false; // Limit to 5 results
        
        const title = $(el).find('.product_name').text().trim();
        const loosePrice = this.parsePrice($(el).find('.price.js-price').first().text());
        const cibPrice = this.parsePrice($(el).find('.price.js-price').eq(1).text());
        const newPrice = this.parsePrice($(el).find('.price.js-price').eq(2).text());
        const url = $(el).find('a').first().attr('href');

        if (title) {
          results.push({
            title,
            prices: {
              loose: loosePrice,
              cib: cibPrice,
              new: newPrice
            },
            url: url ? `https://www.pricecharting.com${url}` : null
          });
        }
      });

      // Alternative parsing for different page structure
      if (results.length === 0) {
        $('table.hoverable-rows tbody tr').each((i, el) => {
          if (i >= 5) return false;
          
          const title = $(el).find('td').first().text().trim();
          const loosePrice = this.parsePrice($(el).find('td.price').first().text());
          
          if (title && loosePrice) {
            results.push({
              title,
              prices: { loose: loosePrice, cib: null, new: null },
              url: null
            });
          }
        });
      }

      if (results.length > 0) {
        return {
          source: 'pricecharting',
          searchUrl,
          results,
          topResult: results[0]
        };
      }

      return null;
      
    } catch (error) {
      throw new Error(`PriceCharting fetch failed: ${error.message}`);
    }
  }

  /**
   * Parse a PriceCharting product page
   */
  parsePriceChartingProduct($, title) {
    const prices = {};
    
    // Try to find price table
    $('#price_data td.price').each((i, el) => {
      const price = this.parsePrice($(el).text());
      const label = $(el).prev('td').text().toLowerCase().trim();
      
      if (label.includes('loose')) prices.loose = price;
      else if (label.includes('cib') || label.includes('complete')) prices.cib = price;
      else if (label.includes('new') || label.includes('sealed')) prices.new = price;
    });

    // Alternative: get from specific elements
    if (!prices.loose) {
      prices.loose = this.parsePrice($('#used_price').text() || $('#complete_price').text());
    }
    if (!prices.cib) {
      prices.cib = this.parsePrice($('#complete_price').text());
    }
    if (!prices.new) {
      prices.new = this.parsePrice($('#new_price').text());
    }

    return {
      source: 'pricecharting',
      title,
      prices,
      topResult: { title, prices }
    };
  }

  /**
   * Fetch eBay sold listings data
   */
  async fetchEbaySold(query, platform) {
    // Build eBay search URL for completed/sold items
    let searchQuery = query;
    if (platform) {
      const platformName = this.getEbayPlatformName(platform);
      if (platformName) {
        searchQuery = `${query} ${platformName}`;
      }
    }

    const encodedQuery = encodeURIComponent(searchQuery);
    const searchUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodedQuery}&LH_Complete=1&LH_Sold=1&_sop=13`;

    try {
      const response = await axios.get(searchUrl, {
        headers: this.getHeaders(),
        timeout: this.timeout
      });

      const $ = cheerio.load(response.data);
      const soldItems = [];
      
      // Parse sold listings
      $('.s-item').each((i, el) => {
        if (i >= 10) return false; // Limit to 10 items
        
        const title = $(el).find('.s-item__title').text().trim();
        const priceText = $(el).find('.s-item__price').text().trim();
        const price = this.parsePrice(priceText);
        const dateText = $(el).find('.s-item__title--tagblock .POSITIVE').text().trim();
        
        // Skip "Shop on eBay" placeholder items
        if (title && !title.toLowerCase().includes('shop on ebay') && price > 0) {
          soldItems.push({
            title,
            price,
            soldDate: dateText || null
          });
        }
      });

      if (soldItems.length === 0) {
        return null;
      }

      // Calculate statistics
      const prices = soldItems.map(item => item.price).filter(p => p > 0);
      const avgPrice = prices.length > 0 
        ? Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 100) / 100 
        : null;
      const medianPrice = this.calculateMedian(prices);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);

      return {
        source: 'ebay_sold',
        searchUrl,
        stats: {
          count: soldItems.length,
          average: avgPrice,
          median: medianPrice,
          min: minPrice,
          max: maxPrice
        },
        recentSales: soldItems.slice(0, 5)
      };

    } catch (error) {
      throw new Error(`eBay fetch failed: ${error.message}`);
    }
  }

  /**
   * Search for games (for autocomplete)
   */
  async searchGames(query, platform = null) {
    const platformSlug = this.getPriceChartingPlatform(platform);
    const searchQuery = encodeURIComponent(query);
    
    let searchUrl = `https://www.pricecharting.com/search-products?q=${searchQuery}&type=videogames`;
    if (platformSlug) {
      searchUrl += `&console=${platformSlug}`;
    }

    try {
      const response = await axios.get(searchUrl, {
        headers: this.getHeaders(),
        timeout: this.timeout
      });

      const $ = cheerio.load(response.data);
      const suggestions = [];

      // Parse search results
      $('.offer, table.hoverable-rows tbody tr').each((i, el) => {
        if (i >= 8) return false;
        
        const title = $(el).find('.product_name, td').first().text().trim();
        const platform = $(el).find('.console-name, .console').text().trim();
        
        if (title && title.length > 0) {
          suggestions.push({
            title: title.substring(0, 100), // Limit title length
            platform: platform || null
          });
        }
      });

      return suggestions;

    } catch (error) {
      console.error('Search error:', error.message);
      return [];
    }
  }

  /**
   * Calculate best price from multiple sources
   */
  calculateBestPrice(sources) {
    const prices = [];

    if (sources.pricecharting?.topResult?.prices) {
      const pc = sources.pricecharting.topResult.prices;
      if (pc.cib) prices.push(pc.cib);
      else if (pc.loose) prices.push(pc.loose);
    }

    if (sources.ebay?.stats?.median) {
      prices.push(sources.ebay.stats.median);
    }

    if (prices.length === 0) return null;
    
    // Return average of available prices
    return Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 100) / 100;
  }

  /**
   * Calculate price range from all sources
   */
  calculatePriceRange(sources) {
    const allPrices = [];

    if (sources.pricecharting?.topResult?.prices) {
      const pc = sources.pricecharting.topResult.prices;
      if (pc.loose) allPrices.push(pc.loose);
      if (pc.cib) allPrices.push(pc.cib);
    }

    if (sources.ebay?.stats) {
      if (sources.ebay.stats.min) allPrices.push(sources.ebay.stats.min);
      if (sources.ebay.stats.max) allPrices.push(sources.ebay.stats.max);
    }

    if (allPrices.length === 0) return { low: null, high: null };

    return {
      low: Math.min(...allPrices),
      high: Math.max(...allPrices)
    };
  }

  /**
   * Parse price string to number
   */
  parsePrice(priceStr) {
    if (!priceStr) return null;
    
    // Remove currency symbols and commas
    const cleaned = priceStr.replace(/[^0-9.]/g, '');
    const price = parseFloat(cleaned);
    
    return isNaN(price) ? null : price;
  }

  /**
   * Calculate median of array
   */
  calculateMedian(arr) {
    if (arr.length === 0) return null;
    
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    return sorted.length % 2 !== 0
      ? sorted[mid]
      : Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 100) / 100;
  }

  /**
   * Convert platform code to PriceCharting slug
   */
  getPriceChartingPlatform(code) {
    const mapping = {
      'PS5': 'playstation-5',
      'PS4': 'playstation-4',
      'PS3': 'playstation-3',
      'PS2': 'playstation-2',
      'PS1': 'playstation',
      'PSP': 'psp',
      'VITA': 'playstation-vita',
      'XSX': 'xbox-series-x',
      'XB1': 'xbox-one',
      'X360': 'xbox-360',
      'XBOX': 'xbox',
      'NSW': 'nintendo-switch',
      'WIIU': 'wii-u',
      'WII': 'wii',
      'GCN': 'gamecube',
      'N64': 'nintendo-64',
      'SNES': 'super-nintendo',
      'NES': 'nes',
      '3DS': 'nintendo-3ds',
      'DS': 'nintendo-ds',
      'GBA': 'gameboy-advance',
      'GBC': 'gameboy-color',
      'GB': 'gameboy',
      'GEN': 'sega-genesis',
      'DC': 'sega-dreamcast',
      'SAT': 'sega-saturn'
    };
    
    return mapping[code?.toUpperCase()] || null;
  }

  /**
   * Convert platform code to eBay search term
   */
  getEbayPlatformName(code) {
    const mapping = {
      'PS5': 'PlayStation 5',
      'PS4': 'PlayStation 4',
      'PS3': 'PlayStation 3',
      'PS2': 'PlayStation 2',
      'PS1': 'PlayStation',
      'PSP': 'PSP',
      'VITA': 'PS Vita',
      'XSX': 'Xbox Series X',
      'XB1': 'Xbox One',
      'X360': 'Xbox 360',
      'XBOX': 'Xbox',
      'NSW': 'Nintendo Switch',
      'WIIU': 'Wii U',
      'WII': 'Wii',
      'GCN': 'GameCube',
      'N64': 'Nintendo 64',
      'SNES': 'Super Nintendo',
      'NES': 'NES',
      '3DS': 'Nintendo 3DS',
      'DS': 'Nintendo DS',
      'GBA': 'Game Boy Advance',
      'GBC': 'Game Boy Color',
      'GB': 'Game Boy',
      'GEN': 'Sega Genesis',
      'DC': 'Dreamcast',
      'SAT': 'Sega Saturn'
    };
    
    return mapping[code?.toUpperCase()] || null;
  }
}

module.exports = PriceFetcher;
