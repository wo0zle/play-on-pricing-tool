/**
 * Play On Pricing Tool - Frontend JavaScript
 * Fair Prices. Sincere Service. Quality Finds.
 */

// ===========================
// State Management
// ===========================
const state = {
  currentSearch: null,
  priceData: null,
  session: {
    items: [],
    totalCost: 0,
    totalValue: 0,
    startTime: null
  },
  isLoading: false
};

// Load session from localStorage
function loadSession() {
  const saved = localStorage.getItem('playOnSession');
  if (saved) {
    try {
      state.session = JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load session:', e);
    }
  }
}

// Save session to localStorage
function saveSession() {
  localStorage.setItem('playOnSession', JSON.stringify(state.session));
}

// ===========================
// API Functions
// ===========================

async function searchPrice(query, platform = null) {
  const params = new URLSearchParams();
  params.append('query', query);
  if (platform) params.append('platform', platform);
  
  const response = await fetch(`/api/price?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch price data');
  }
  return response.json();
}

async function calculateROI(data) {
  const response = await fetch('/api/calculate-roi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    throw new Error('Failed to calculate ROI');
  }
  return response.json();
}

// ===========================
// UI Functions
// ===========================

function showLoading(container) {
  container.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p>Searching prices...</p>
    </div>
  `;
}

function showError(container, message) {
  container.innerHTML = `
    <div class="empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <p>${message}</p>
    </div>
  `;
}

function formatPrice(price) {
  if (price === null || price === undefined) return '—';
  return '$' + price.toFixed(2);
}

function formatPercent(value) {
  if (value === null || value === undefined) return '—';
  return value + '%';
}

function renderPriceResults(data) {
  const container = document.getElementById('priceResults');
  if (!container) return;
  
  state.priceData = data;
  
  let html = '<div class="price-results">';
  
  // Main price display
  html += `
    <div class="price-grid">
      <div class="price-item">
        <div class="price-label">Best Price</div>
        <div class="price-value highlight">${formatPrice(data.bestPrice)}</div>
      </div>
      <div class="price-item">
        <div class="price-label">Sell @ 85%</div>
        <div class="price-value">${formatPrice(data.playOnPricing?.sellPrice85)}</div>
      </div>
      <div class="price-item">
        <div class="price-label">Sell @ 90%</div>
        <div class="price-value">${formatPrice(data.playOnPricing?.sellPrice90)}</div>
      </div>
      <div class="price-item">
        <div class="price-label">Max Buy @ 50%</div>
        <div class="price-value gold">${formatPrice(data.playOnPricing?.maxBuyPrice50)}</div>
      </div>
    </div>
  `;
  
  // Price range
  if (data.priceRange?.low !== null) {
    html += `
      <p class="text-muted text-center mb-md">
        Price range: ${formatPrice(data.priceRange.low)} — ${formatPrice(data.priceRange.high)}
      </p>
    `;
  }
  
  // Source tabs
  html += '<div class="source-tabs">';
  if (data.sources.pricecharting) {
    html += '<button class="source-tab active" data-source="pricecharting">PriceCharting</button>';
  }
  if (data.sources.ebay) {
    html += '<button class="source-tab" data-source="ebay">eBay Sold</button>';
  }
  html += '</div>';
  
  // Source details
  html += '<div class="source-content">';
  
  // PriceCharting details
  if (data.sources.pricecharting?.topResult) {
    const pc = data.sources.pricecharting.topResult;
    html += `
      <div class="source-panel" id="panel-pricecharting">
        <h4>${pc.title || 'Price Data'}</h4>
        <div class="price-grid mt-md">
          <div class="price-item">
            <div class="price-label">Loose</div>
            <div class="price-value">${formatPrice(pc.prices?.loose)}</div>
          </div>
          <div class="price-item">
            <div class="price-label">CIB</div>
            <div class="price-value">${formatPrice(pc.prices?.cib)}</div>
          </div>
          <div class="price-item">
            <div class="price-label">New/Sealed</div>
            <div class="price-value">${formatPrice(pc.prices?.new)}</div>
          </div>
        </div>
      </div>
    `;
  }
  
  // eBay details
  if (data.sources.ebay?.stats) {
    const ebay = data.sources.ebay;
    html += `
      <div class="source-panel hidden" id="panel-ebay">
        <h4>eBay Sold Listings (${ebay.stats.count} sales)</h4>
        <div class="price-grid mt-md">
          <div class="price-item">
            <div class="price-label">Average</div>
            <div class="price-value">${formatPrice(ebay.stats.average)}</div>
          </div>
          <div class="price-item">
            <div class="price-label">Median</div>
            <div class="price-value">${formatPrice(ebay.stats.median)}</div>
          </div>
          <div class="price-item">
            <div class="price-label">Low</div>
            <div class="price-value">${formatPrice(ebay.stats.min)}</div>
          </div>
          <div class="price-item">
            <div class="price-label">High</div>
            <div class="price-value">${formatPrice(ebay.stats.max)}</div>
          </div>
        </div>
      </div>
    `;
  }
  
  html += '</div>';
  
  // Quick ROI calculator
  html += `
    <div class="card mt-lg">
      <div class="card-header">
        <h3 class="card-title">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Quick ROI Check
        </h3>
      </div>
      <div class="form-group">
        <label class="form-label">What's the asking price?</label>
        <input type="number" class="form-input" id="quickCostInput" placeholder="0.00" step="0.01" min="0">
      </div>
      <button class="btn btn-primary mt-md" onclick="quickROICheck()">
        Check Profit
      </button>
      <div id="quickROIResult"></div>
    </div>
  `;
  
  html += '</div>';
  
  container.innerHTML = html;
  
  // Add tab event listeners
  document.querySelectorAll('.source-tab').forEach(tab => {
    tab.addEventListener('click', () => switchSourceTab(tab.dataset.source));
  });
}

function switchSourceTab(source) {
  // Update tab states
  document.querySelectorAll('.source-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.source === source);
  });
  
  // Show/hide panels
  document.querySelectorAll('.source-panel').forEach(panel => {
    panel.classList.toggle('hidden', panel.id !== `panel-${source}`);
  });
}

function quickROICheck() {
  const costInput = document.getElementById('quickCostInput');
  const resultContainer = document.getElementById('quickROIResult');
  
  if (!costInput || !resultContainer || !state.priceData?.bestPrice) {
    return;
  }
  
  const costPaid = parseFloat(costInput.value) || 0;
  const marketValue = state.priceData.bestPrice;
  
  if (costPaid <= 0) {
    resultContainer.innerHTML = '<p class="text-muted mt-md">Enter an asking price</p>';
    return;
  }
  
  const sellPrice85 = marketValue * 0.85;
  const profit = sellPrice85 - costPaid;
  const roi = (profit / costPaid) * 100;
  const maxBuy = marketValue * 0.50;
  
  const isProfitable = profit >= 5;
  const isBelowMax = costPaid <= maxBuy;
  const recommendation = isProfitable && isBelowMax ? 'buy' : 'pass';
  
  resultContainer.innerHTML = `
    <div class="recommendation ${recommendation} mt-md">
      <div class="recommendation-icon">
        ${recommendation === 'buy' 
          ? '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>'
          : '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>'
        }
      </div>
      <div class="recommendation-text">
        <div class="recommendation-action">${recommendation === 'buy' ? 'Good Deal!' : 'Pass'}</div>
        <div class="recommendation-details">
          Profit: ${formatPrice(profit)} | ROI: ${roi.toFixed(0)}%
          ${!isBelowMax ? `<br>Above max buy price (${formatPrice(maxBuy)})` : ''}
        </div>
      </div>
    </div>
  `;
}

// ===========================
// ROI Calculator Page
// ===========================

function initCalculator() {
  const form = document.getElementById('roiForm');
  if (!form) return;
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const marketValue = parseFloat(document.getElementById('marketValue').value);
    const costPaid = parseFloat(document.getElementById('costPaid').value);
    const condition = document.getElementById('condition').value;
    
    if (isNaN(marketValue) || isNaN(costPaid)) {
      alert('Please enter valid numbers');
      return;
    }
    
    try {
      const result = await calculateROI({ marketValue, costPaid, condition });
      renderROIResult(result);
    } catch (error) {
      console.error('ROI calculation error:', error);
      alert('Failed to calculate ROI');
    }
  });
}

function renderROIResult(result) {
  const container = document.getElementById('roiResult');
  if (!container) return;
  
  const { pricing, recommendation } = result;
  
  container.innerHTML = `
    <div class="price-grid">
      <div class="price-item">
        <div class="price-label">Sell @ 85%</div>
        <div class="price-value">${formatPrice(pricing.sellPrice85)}</div>
      </div>
      <div class="price-item">
        <div class="price-label">Sell @ 90%</div>
        <div class="price-value">${formatPrice(pricing.sellPrice90)}</div>
      </div>
      <div class="price-item">
        <div class="price-label">Profit (85%)</div>
        <div class="price-value ${pricing.grossProfit85 >= 0 ? 'highlight' : 'text-danger'}">${formatPrice(pricing.grossProfit85)}</div>
      </div>
      <div class="price-item">
        <div class="price-label">ROI</div>
        <div class="price-value">${formatPercent(pricing.roi85)}</div>
      </div>
    </div>
    
    <div class="recommendation ${recommendation.action}">
      <div class="recommendation-icon">
        ${recommendation.action === 'buy' 
          ? '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>'
          : '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>'
        }
      </div>
      <div class="recommendation-text">
        <div class="recommendation-action">${recommendation.action === 'buy' ? 'Buy It!' : 'Pass'}</div>
        <div class="recommendation-details">
          ${recommendation.isProfitable ? '✓ Meets profit threshold ($5+)' : '✗ Below profit threshold'}<br>
          ${recommendation.isBelowMaxCost ? '✓ Below 50% of market value' : '✗ Above 50% of market value'}
        </div>
      </div>
    </div>
  `;
}

// ===========================
// Session Tracker
// ===========================

function initSession() {
  loadSession();
  
  if (!state.session.startTime) {
    state.session.startTime = new Date().toISOString();
  }
  
  renderSessionStats();
  renderSessionItems();
}

function addToSession(item) {
  state.session.items.push({
    ...item,
    timestamp: new Date().toISOString()
  });
  state.session.totalCost += item.costPaid || 0;
  state.session.totalValue += item.marketValue || 0;
  
  saveSession();
  renderSessionStats();
  renderSessionItems();
}

function renderSessionStats() {
  const container = document.getElementById('sessionStats');
  if (!container) return;
  
  const profit = state.session.totalValue * 0.85 - state.session.totalCost;
  const roi = state.session.totalCost > 0 
    ? ((profit / state.session.totalCost) * 100).toFixed(0) 
    : 0;
  
  container.innerHTML = `
    <div class="stat-card">
      <div class="stat-value">${state.session.items.length}</div>
      <div class="stat-label">Items</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${formatPrice(state.session.totalCost)}</div>
      <div class="stat-label">Spent</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${formatPrice(state.session.totalValue)}</div>
      <div class="stat-label">Value</div>
    </div>
    <div class="stat-card">
      <div class="stat-value profit">${formatPrice(profit)}</div>
      <div class="stat-label">Est. Profit</div>
    </div>
  `;
}

function renderSessionItems() {
  const container = document.getElementById('sessionItems');
  if (!container) return;
  
  if (state.session.items.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <p>No items in this session yet</p>
      </div>
    `;
    return;
  }
  
  let html = '';
  state.session.items.slice().reverse().forEach((item, index) => {
    const profit = (item.marketValue * 0.85) - item.costPaid;
    html += `
      <div class="session-item">
        <div class="session-item-info">
          <div class="session-item-title">${item.title}</div>
          <div class="session-item-meta">${item.platform || ''} • ${item.condition || ''}</div>
        </div>
        <div class="session-item-price">
          <div class="session-item-cost">Paid: ${formatPrice(item.costPaid)}</div>
          <div class="session-item-profit">+${formatPrice(profit)}</div>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

function clearSession() {
  if (confirm('Clear all items from this session?')) {
    state.session = {
      items: [],
      totalCost: 0,
      totalValue: 0,
      startTime: new Date().toISOString()
    };
    saveSession();
    renderSessionStats();
    renderSessionItems();
  }
}

// ===========================
// Search Functionality
// ===========================

function initSearch() {
  const searchForm = document.getElementById('searchForm');
  const searchInput = document.getElementById('searchInput');
  
  if (!searchForm || !searchInput) return;
  
  searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const query = searchInput.value.trim();
    const platform = document.getElementById('platformSelect')?.value || null;
    
    if (!query) return;
    
    const resultsContainer = document.getElementById('priceResults');
    showLoading(resultsContainer);
    
    try {
      const data = await searchPrice(query, platform);
      
      if (data.error) {
        showError(resultsContainer, data.error);
        return;
      }
      
      if (!data.bestPrice && !data.sources?.pricecharting && !data.sources?.ebay) {
        showError(resultsContainer, 'No price data found. Try a different search.');
        return;
      }
      
      renderPriceResults(data);
      
    } catch (error) {
      console.error('Search error:', error);
      showError(resultsContainer, 'Failed to fetch price data. Please try again.');
    }
  });
  
  // Focus search input on page load
  searchInput.focus();
}

// ===========================
// Initialization
// ===========================

document.addEventListener('DOMContentLoaded', () => {
  // Initialize based on current page
  const path = window.location.pathname;
  
  if (path === '/' || path === '/index.html') {
    initSearch();
  } else if (path === '/calculator') {
    initCalculator();
  } else if (path === '/session') {
    initSession();
  }
  
  // Service worker for offline support
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.log('Service worker registration failed:', err);
    });
  }
});

// Expose functions for onclick handlers
window.quickROICheck = quickROICheck;
window.addToSession = addToSession;
window.clearSession = clearSession;
