# Play On Pricing Tool

**Fair Prices. Sincere Service. Quality Finds.**

A mobile-first pricing tool for video game resellers. Look up market values, calculate ROI, and track sourcing sessions — all from your phone while in the field.

![Play On Logo](public/images/logo.svg)

## Features

- 🔍 **Price Lookup** - Search PriceCharting and eBay sold listings in one place
- 💰 **ROI Calculator** - Instant profit calculations with buy/pass recommendations
- 📊 **Session Tracker** - Track items found during sourcing trips
- 📱 **Mobile-First** - Designed for use on your phone in the field
- 🔌 **Offline Support** - Works even with spotty cell coverage (PWA)
- 🎮 **Platform Codes** - Quick reference for SKU codes

## Tech Stack

- **Backend**: Node.js + Express
- **Frontend**: EJS templates + Vanilla JS
- **Styling**: Custom CSS with Play On brand system
- **Data Sources**: PriceCharting, eBay sold listings
- **Caching**: node-cache for API response caching
- **PWA**: Service worker for offline support

## Quick Start

### Local Development

```bash
# Clone the repo
git clone https://github.com/yourusername/play-on-pricing-tool.git
cd play-on-pricing-tool

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start development server
npm run dev
```

Visit `http://localhost:3000`

### Production Build

```bash
npm start
```

## Deploying to Railway

### Option 1: Deploy from GitHub (Recommended)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/play-on-pricing-tool.git
   git push -u origin main
   ```

2. **Deploy on Railway**
   - Go to [railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway auto-detects Node.js and deploys

3. **Add Environment Variables**
   - Go to your service's "Variables" tab
   - Add: `NODE_ENV=production`

4. **Generate Domain**
   - Go to "Settings" → "Networking"
   - Click "Generate Domain" or add custom domain

### Option 2: Deploy with Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up

# Generate domain
railway domain
```

## Custom Domain Setup

To use `pricing.playontech.store`:

1. In Railway dashboard, go to Settings → Networking → Custom Domain
2. Add `pricing.playontech.store`
3. In your DNS provider, add a CNAME record:
   - Name: `pricing`
   - Target: `your-app.up.railway.app`
4. Railway handles SSL automatically

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Price lookup page |
| `/calculator` | GET | ROI calculator page |
| `/session` | GET | Sourcing session tracker |
| `/platforms` | GET | Platform codes reference |
| `/api/price` | GET | Price lookup API |
| `/api/calculate-roi` | POST | ROI calculation API |
| `/api/search` | GET | Search suggestions |
| `/health` | GET | Health check |

### Price Lookup API

```bash
GET /api/price?query=super+mario+odyssey&platform=NSW
```

Response:
```json
{
  "query": "super mario odyssey",
  "platform": "NSW",
  "bestPrice": 35.00,
  "playOnPricing": {
    "sellPrice85": 29.75,
    "sellPrice90": 31.50,
    "maxBuyPrice50": 17.50
  },
  "sources": {
    "pricecharting": { ... },
    "ebay": { ... }
  }
}
```

## Project Structure

```
play-on-pricing-tool/
├── src/
│   ├── server.js          # Express server
│   ├── routes/
│   │   ├── pricing.js     # Page routes
│   │   └── api.js         # API routes
│   └── utils/
│       └── priceFetcher.js # Price data aggregator
├── views/
│   ├── index.ejs          # Price lookup page
│   ├── calculator.ejs     # ROI calculator
│   ├── session.ejs        # Session tracker
│   ├── platforms.ejs      # Platform codes
│   └── error.ejs          # Error page
├── public/
│   ├── css/styles.css     # Brand-styled CSS
│   ├── js/app.js          # Frontend JavaScript
│   ├── images/            # Logo and icons
│   ├── manifest.json      # PWA manifest
│   └── sw.js              # Service worker
├── package.json
├── railway.json           # Railway config
└── README.md
```

## Brand Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Deep Navy | `#1A365D` | Primary, headers |
| Trust Blue | `#3182CE` | Links, accents |
| Retro Gold | `#D69E2E` | Highlights, CTAs |
| Player Green | `#38A169` | Success, profits |
| Soft White | `#F7FAFC` | Backgrounds |
| Cool Gray | `#718096` | Body text |
| Charcoal | `#2D3748` | Headlines |

## Pricing Strategy

- **Sell Price**: 85-90% of market value
- **Max Buy Price**: 50% of market value
- **Minimum Profit Target**: $5 per item
- **Target ROI**: 70%+

## License

MIT License - Feel free to use and modify for your own resale business.

---

**Play On** — *Fair Prices. Sincere Service. Quality Finds.*

Built with ❤️ in Murfreesboro, Tennessee
