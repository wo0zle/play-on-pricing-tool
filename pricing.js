/**
 * Play On Pricing Tool - Main Routes
 */

const express = require('express');
const router = express.Router();

// Platform data for dropdowns
const platforms = [
  { code: 'PS5', name: 'PlayStation 5', gen: 'current' },
  { code: 'PS4', name: 'PlayStation 4', gen: 'current' },
  { code: 'PS3', name: 'PlayStation 3', gen: 'previous' },
  { code: 'PS2', name: 'PlayStation 2', gen: 'retro' },
  { code: 'PS1', name: 'PlayStation 1', gen: 'retro' },
  { code: 'PSP', name: 'PlayStation Portable', gen: 'handheld' },
  { code: 'VITA', name: 'PlayStation Vita', gen: 'handheld' },
  { code: 'XSX', name: 'Xbox Series X/S', gen: 'current' },
  { code: 'XB1', name: 'Xbox One', gen: 'current' },
  { code: 'X360', name: 'Xbox 360', gen: 'previous' },
  { code: 'XBOX', name: 'Original Xbox', gen: 'retro' },
  { code: 'NSW', name: 'Nintendo Switch', gen: 'current' },
  { code: 'WIIU', name: 'Wii U', gen: 'previous' },
  { code: 'WII', name: 'Wii', gen: 'previous' },
  { code: 'GCN', name: 'GameCube', gen: 'retro' },
  { code: 'N64', name: 'Nintendo 64', gen: 'retro' },
  { code: 'SNES', name: 'Super Nintendo', gen: 'retro' },
  { code: 'NES', name: 'Nintendo Entertainment System', gen: 'retro' },
  { code: '3DS', name: 'Nintendo 3DS', gen: 'handheld' },
  { code: 'DS', name: 'Nintendo DS', gen: 'handheld' },
  { code: 'GBA', name: 'Game Boy Advance', gen: 'handheld' },
  { code: 'GBC', name: 'Game Boy Color', gen: 'handheld' },
  { code: 'GB', name: 'Game Boy', gen: 'handheld' },
  { code: 'PC', name: 'PC Games', gen: 'pc' },
  { code: 'GEN', name: 'Sega Genesis', gen: 'retro' },
  { code: 'DC', name: 'Dreamcast', gen: 'retro' },
  { code: 'SAT', name: 'Saturn', gen: 'retro' },
  { code: 'ACC', name: 'Accessories', gen: 'other' },
  { code: 'BOOK', name: 'Books/Guides', gen: 'other' },
  { code: 'MERCH', name: 'Merchandise', gen: 'other' }
];

// Condition grades
const conditions = [
  { code: 'like-new', name: 'Like New', adjustment: 1.0, description: 'Near perfect, minimal wear' },
  { code: 'excellent', name: 'Excellent', adjustment: 0.95, description: 'Light wear, minor scratches' },
  { code: 'good', name: 'Good', adjustment: 0.85, description: 'Moderate wear, plays fine' },
  { code: 'acceptable', name: 'Acceptable', adjustment: 0.70, description: 'Heavy wear but works' }
];

// Main pricing tool page
router.get('/', (req, res) => {
  res.render('index', {
    title: 'Play On Pricing Tool',
    brandName: 'Play On',
    tagline: 'Fair Prices. Sincere Service. Quality Finds.',
    platforms,
    conditions
  });
});

// ROI Calculator page
router.get('/calculator', (req, res) => {
  res.render('calculator', {
    title: 'ROI Calculator - Play On',
    brandName: 'Play On',
    tagline: 'Fair Prices. Sincere Service. Quality Finds.',
    platforms,
    conditions
  });
});

// Sourcing session tracker
router.get('/session', (req, res) => {
  res.render('session', {
    title: 'Sourcing Session - Play On',
    brandName: 'Play On',
    tagline: 'Fair Prices. Sincere Service. Quality Finds.',
    platforms,
    conditions
  });
});

// Platform codes reference
router.get('/platforms', (req, res) => {
  res.render('platforms', {
    title: 'Platform Codes - Play On',
    brandName: 'Play On',
    tagline: 'Fair Prices. Sincere Service. Quality Finds.',
    platforms
  });
});

module.exports = router;
