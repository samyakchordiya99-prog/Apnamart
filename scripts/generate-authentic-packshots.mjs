import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';

const OUT_DIR = resolve('public/products');
mkdirSync(OUT_DIR, { recursive: true });

function createSvgPackshot({
  brand,
  name,
  weight,
  category,
  bgGradient = ['#f8fafc', '#e2e8f0'],
  packColor = ['#3b82f6', '#1d4ed8'],
  accentColor = '#f59e0b',
  badgeText = '100% QUALITY ASSURED',
  icon = '🛒',
  subText = 'ApnaMart Fresh & Verified',
  shape = 'pouch', // 'pouch' | 'bottle' | 'box' | 'can' | 'fresh_bowl' | 'bar'
  productDetail = ''
}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bgGradient[0]}" />
      <stop offset="100%" stop-color="${bgGradient[1]}" />
    </linearGradient>
    <linearGradient id="packGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${packColor[0]}" />
      <stop offset="100%" stop-color="${packColor[1]}" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#0f172a" flood-opacity="0.14" />
    </filter>
    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background Canvas -->
  <rect width="500" height="500" rx="32" fill="url(#bgGrad)" />
  <circle cx="250" cy="240" r="180" fill="#ffffff" opacity="0.65" />

  <!-- Top Category / Badge Pill -->
  <g transform="translate(250, 42)">
    <rect x="-110" y="-16" width="220" height="32" rx="16" fill="#ffffff" filter="url(#shadow)" />
    <text x="0" y="5" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="800" fill="#475569" letter-spacing="1">${category.toUpperCase()}</text>
  </g>

  <!-- Main Product Container (Pouch / Box / Bottle) -->
  <g filter="url(#shadow)">
    ${
      shape === 'pouch'
        ? `
        <!-- Standup Pouch -->
        <path d="M 120 120 C 140 100, 360 100, 380 120 L 395 380 C 395 400, 105 400, 105 380 Z" fill="url(#packGrad)" />
        <!-- Top Seal Notch -->
        <line x1="120" y1="135" x2="380" y2="135" stroke="#ffffff" stroke-width="2" stroke-opacity="0.4" stroke-dasharray="4,4" />
        <rect x="190" y="115" width="120" height="6" rx="3" fill="#ffffff" opacity="0.3" />
        `
        : shape === 'box'
        ? `
        <!-- Box Shape -->
        <rect x="110" y="110" width="280" height="280" rx="20" fill="url(#packGrad)" />
        <rect x="110" y="110" width="280" height="30" rx="10" fill="#ffffff" opacity="0.15" />
        `
        : shape === 'bottle'
        ? `
        <!-- Bottle Shape -->
        <rect x="220" y="90" width="60" height="40" rx="6" fill="#cbd5e1" />
        <path d="M 220 130 C 180 160, 150 190, 150 250 L 150 380 C 150 400, 350 400, 350 380 L 350 250 C 350 190, 320 160, 280 130 Z" fill="url(#packGrad)" />
        <rect x="170" y="220" width="160" height="130" rx="12" fill="#ffffff" opacity="0.95" />
        `
        : shape === 'fresh_bowl'
        ? `
        <!-- Fresh Bowl / Sprout Container -->
        <ellipse cx="250" cy="385" rx="140" ry="25" fill="#94a3b8" opacity="0.3" />
        <path d="M 100 240 L 130 380 C 135 395, 365 395, 370 380 L 400 240 Z" fill="#ffffff" stroke="#cbd5e1" stroke-width="3" />
        <ellipse cx="250" cy="240" rx="150" ry="35" fill="url(#packGrad)" />
        <ellipse cx="250" cy="236" rx="140" ry="30" fill="#ffffff" opacity="0.85" />
        `
        : `
        <!-- Default Standard Card -->
        <rect x="110" y="110" width="280" height="280" rx="24" fill="url(#packGrad)" />
        `
    }

    <!-- Product Branding Label Area -->
    <g transform="translate(250, 240)">
      ${
        shape !== 'bottle'
          ? `
          <rect x="-115" y="-95" width="230" height="190" rx="16" fill="#ffffff" opacity="0.94" filter="url(#shadow)" />
          `
          : ''
      }
      
      <!-- Brand Name -->
      <text x="0" y="-62" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="900" fill="${packColor[1]}" letter-spacing="1">${brand.toUpperCase()}</text>
      
      <!-- Primary Product Icon / Artwork -->
      <text x="0" y="-8" text-anchor="middle" font-size="44">${icon}</text>
      
      <!-- Product Full Title -->
      <text x="0" y="32" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="800" fill="#0f172a">
        ${name.length > 24 ? name.substring(0, 22) + '…' : name}
      </text>
      
      <!-- Subtitle Detail (e.g. Crisp, Washed, Pure) -->
      <text x="0" y="52" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10.5" font-weight="600" fill="#64748b">${productDetail || subText}</text>
      
      <!-- Weight Tag Badge -->
      <g transform="translate(0, 75)">
        <rect x="-45" y="-12" width="90" height="24" rx="12" fill="${accentColor}" />
        <text x="0" y="4" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="800" fill="#ffffff">${weight}</text>
      </g>
    </g>
  </g>

  <!-- ApnaMart Quality Seal (Bottom Left) -->
  <g transform="translate(68, 440)">
    <circle cx="16" cy="16" r="16" fill="#16a34a" />
    <path d="M 10 16 L 14 20 L 22 12" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
    <text x="38" y="14" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10.5" font-weight="800" fill="#166534">APNAMART</text>
    <text x="38" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="600" fill="#475569">100% Genuine</text>
  </g>

  <!-- Freshness / Fast Delivery Badge (Bottom Right) -->
  <g transform="translate(425, 440)">
    <circle cx="-16" cy="16" r="16" fill="#7c3aed" />
    <text x="-16" y="22" text-anchor="middle" font-size="16">⚡</text>
    <text x="-40" y="14" text-anchor="end" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10.5" font-weight="800" fill="#6d28d9">EXPRESS</text>
    <text x="-40" y="26" text-anchor="end" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="600" fill="#475569">10-15 Mins</text>
  </g>
</svg>`;
}

// DEFINITION OF ALL 45+ CUSTOM PACKSHOTS
const PACKSHOTS = [
  // 1. Biscuits & Cookies
  {
    file: 'parle-krackjack.svg',
    brand: 'Parle',
    name: 'Krackjack Sweet & Salty',
    weight: '200 g',
    category: 'Biscuits & Bakery',
    bgGradient: ['#f0fdf4', '#dcfce7'],
    packColor: ['#15803d', '#166534'],
    accentColor: '#dc2626',
    icon: '🍪',
    shape: 'pouch',
    productDetail: 'The Original Sweet & Salty Crackers'
  },
  {
    file: 'nutrichoice-digestive.svg',
    brand: 'Britannia',
    name: 'NutriChoice Hi-Fibre',
    weight: '100 g',
    category: 'Biscuits & Bakery',
    bgGradient: ['#fefce8', '#fef08a'],
    packColor: ['#ca8a04', '#a16207'],
    accentColor: '#16a34a',
    icon: '🌾',
    shape: 'pouch',
    productDetail: '100% Whole Wheat Fibre Digestive'
  },
  {
    file: 'good-day-butter.svg',
    brand: 'Britannia',
    name: 'Good Day Butter Cookies',
    weight: '200 g',
    category: 'Biscuits & Bakery',
    bgGradient: ['#fffbeb', '#fef3c7'],
    packColor: ['#f59e0b', '#d97706'],
    accentColor: '#b45309',
    icon: '🧈',
    shape: 'pouch',
    productDetail: 'Rich Melt-in-Mouth Butter Cookies'
  },
  {
    file: 'priyagold-butter-bite.svg',
    brand: 'PriyaGold',
    name: 'Butter Bite Cashew',
    weight: '100 g',
    category: 'Biscuits & Bakery',
    bgGradient: ['#fff1f2', '#ffe4e6'],
    packColor: ['#e11d48', '#be123c'],
    accentColor: '#f59e0b',
    icon: '🍪',
    shape: 'pouch',
    productDetail: 'Crisp Cashew Nut Butter Biscuits'
  },
  {
    file: 'oreo-lemon-cream.svg',
    brand: 'Cadbury',
    name: 'Oreo Lemon Crème Biscuit',
    weight: '120 g',
    category: 'Biscuits & Bakery',
    bgGradient: ['#fefce8', '#fef9c3'],
    packColor: ['#eab308', '#ca8a04'],
    accentColor: '#1d4ed8',
    icon: '🍋',
    shape: 'pouch',
    productDetail: 'Zesty Lemon Cream Filled Cookies'
  },

  // 2. Dals, Pulses & Sprouts
  {
    file: 'yellow-moong-dal-dhuli.svg',
    brand: 'Tata Sampann',
    name: 'Yellow Moong Dal Dhuli',
    weight: '500 g',
    category: 'Atta, Rice & Dal',
    bgGradient: ['#fefce8', '#fef08a'],
    packColor: ['#eab308', '#ca8a04'],
    accentColor: '#15803d',
    icon: '✨',
    shape: 'pouch',
    productDetail: 'Unpolished Protein-Rich Washed Moong'
  },
  {
    file: 'green-moong-dal-chilka.svg',
    brand: 'Tata Sampann',
    name: 'Moong Dal Chilka (Split)',
    weight: '500 g',
    category: 'Atta, Rice & Dal',
    bgGradient: ['#f0fdf4', '#bbf7d0'],
    packColor: ['#16a34a', '#15803d'],
    accentColor: '#eab308',
    icon: '🌱',
    shape: 'pouch',
    productDetail: 'Split Green Moong with Nutritious Husk'
  },
  {
    file: 'clean-whole-matki.svg',
    brand: 'ApnaMart Royal',
    name: 'Clean Whole Moth (Matki)',
    weight: '500 g',
    category: 'Atta, Rice & Dal',
    bgGradient: ['#faf5ff', '#f3e8ff'],
    packColor: ['#9333ea', '#7e22ce'],
    accentColor: '#eab308',
    icon: '🫘',
    shape: 'pouch',
    productDetail: 'Clean Handpicked Whole Moth Beans'
  },
  {
    file: 'white-urad-dal-dhuli.svg',
    brand: 'Tata Sampann',
    name: 'White Urad Dal Dhuli',
    weight: '500 g',
    category: 'Atta, Rice & Dal',
    bgGradient: ['#f8fafc', '#e2e8f0'],
    packColor: ['#475569', '#334155'],
    accentColor: '#0ea5e9',
    icon: '⚪',
    shape: 'pouch',
    productDetail: 'Washed Urad Dal for Idli, Dosa & Vada'
  },
  {
    file: 'black-urad-dal-chilka.svg',
    brand: 'Tata Sampann',
    name: 'Black Urad Dal Chilka',
    weight: '500 g',
    category: 'Atta, Rice & Dal',
    bgGradient: ['#f1f5f9', '#cbd5e1'],
    packColor: ['#1e293b', '#0f172a'],
    accentColor: '#16a34a',
    icon: '⚫',
    shape: 'pouch',
    productDetail: 'Split Black Urad for Dal Makhani'
  },

  // 3. Fresh Sprouts (Ankurit)
  {
    file: 'fresh-moong-sprouts.svg',
    brand: 'ApnaMart Fresh',
    name: 'Fresh Moong Sprouts',
    weight: '200 g',
    category: 'Fruits & Vegetables',
    bgGradient: ['#f0fdf4', '#dcfce7'],
    packColor: ['#16a34a', '#15803d'],
    accentColor: '#166534',
    icon: '🌿',
    shape: 'fresh_bowl',
    productDetail: 'Crisp Germinated Ready-to-Eat Sprouts'
  },
  {
    file: 'fresh-kala-chana-sprouts.svg',
    brand: 'ApnaMart Fresh',
    name: 'Fresh Desi Chana Sprouts',
    weight: '200 g',
    category: 'Fruits & Vegetables',
    bgGradient: ['#fefce8', '#fef08a'],
    packColor: ['#ca8a04', '#854d0e'],
    accentColor: '#15803d',
    icon: '🌱',
    shape: 'fresh_bowl',
    productDetail: 'High-Protein Sprouted Brown Bengal Gram'
  },
  {
    file: 'fresh-matki-sprouts.svg',
    brand: 'ApnaMart Fresh',
    name: 'Fresh Matki Sprouts',
    weight: '200 g',
    category: 'Fruits & Vegetables',
    bgGradient: ['#fdf2f8', '#fce7f3'],
    packColor: ['#db2777', '#be185d'],
    accentColor: '#16a34a',
    icon: '🥗',
    shape: 'fresh_bowl',
    productDetail: 'Tender Sprouted Moth Beans for Usal'
  },
  {
    file: 'fresh-tri-sprouts.svg',
    brand: 'ApnaMart Fresh',
    name: 'Tri-Sprouts Mix Bowl',
    weight: '250 g',
    category: 'Fruits & Vegetables',
    bgGradient: ['#ecfdf5', '#d1fae5'],
    packColor: ['#059669', '#047857'],
    accentColor: '#dc2626',
    icon: '🥗',
    shape: 'fresh_bowl',
    productDetail: 'Healthy Moong, Chana & Matki Power Mix'
  },

  // 4. Sugar & Sweet Essentials
  {
    file: 'madhur-crystal-sugar.svg',
    brand: 'Madhur',
    name: 'Pure Crystal Sugar',
    weight: '1 kg',
    category: 'Atta, Rice & Dal',
    bgGradient: ['#eff6ff', '#dbeafe'],
    packColor: ['#2563eb', '#1d4ed8'],
    accentColor: '#3b82f6',
    icon: '💎',
    shape: 'pouch',
    productDetail: '100% Sulphur-Free Sparkling Pure Sugar'
  },
  {
    file: 'uttam-sugar.svg',
    brand: 'Uttam Sugar',
    name: 'White Crystal Sugar',
    weight: '1 kg',
    category: 'Atta, Rice & Dal',
    bgGradient: ['#f8fafc', '#e2e8f0'],
    packColor: ['#0284c7', '#0369a1'],
    accentColor: '#0ea5e9',
    icon: '🧊',
    shape: 'pouch',
    productDetail: 'Hygienic Refined White Crystal Sugar'
  },
  {
    file: 'ferrero-rocher.svg',
    brand: 'Ferrero Rocher',
    name: 'Hazelnut Pralines Box',
    weight: '200 g',
    category: 'Chocolates & Sweets',
    bgGradient: ['#fefce8', '#fef08a'],
    packColor: ['#ca8a04', '#a16207'],
    accentColor: '#854d0e',
    icon: '🍫',
    shape: 'box',
    productDetail: 'Crisp Hazelnut and Milk Chocolate Gift Pack'
  },

  // 5. Bread & Bakery
  {
    file: 'brown-bread.svg',
    brand: 'English Oven',
    name: '100% Whole Wheat Brown Bread',
    weight: '400 g',
    category: 'Dairy, Bread & Eggs',
    bgGradient: ['#fef3c7', '#fde68a'],
    packColor: ['#d97706', '#b45309'],
    accentColor: '#15803d',
    icon: '🍞',
    shape: 'box',
    productDetail: 'Zero Maida High-Fibre Toast Bread'
  },
  {
    file: 'harvest-gold-atta-bread.svg',
    brand: 'Harvest Gold',
    name: '100% Atta Whole Wheat Bread',
    weight: '400 g',
    category: 'Dairy, Bread & Eggs',
    bgGradient: ['#ffedd5', '#fed7aa'],
    packColor: ['#ea580c', '#c2410c'],
    accentColor: '#16a34a',
    icon: '🥖',
    shape: 'box',
    productDetail: 'Pure Wheat Atta Nutrition for Breakfast'
  },

  // 6. Tea & Beverages
  {
    file: 'red-label-tea.svg',
    brand: 'Brooke Bond',
    name: 'Red Label Strong Tea',
    weight: '500 g',
    category: 'Tea & Coffee',
    bgGradient: ['#fef2f2', '#fee2e2'],
    packColor: ['#dc2626', '#b91c1c'],
    accentColor: '#eab308',
    icon: '☕',
    shape: 'pouch',
    productDetail: 'Swad Apnepan Ka - Extra Strong CTC Tea'
  },
  {
    file: 'red-label-natural-care.svg',
    brand: 'Brooke Bond',
    name: 'Red Label Natural Care',
    weight: '500 g',
    category: 'Tea & Coffee',
    bgGradient: ['#f0fdf4', '#dcfce7'],
    packColor: ['#16a34a', '#15803d'],
    accentColor: '#dc2626',
    icon: '🫖',
    shape: 'pouch',
    productDetail: 'Blended with Tulsi, Ginger, Mulethi & Ashwagandha'
  },
  {
    file: 'tata-tea-gold.svg',
    brand: 'Tata Tea',
    name: 'Tata Tea Gold CTC & Leaves',
    weight: '500 g',
    category: 'Tea & Coffee',
    bgGradient: ['#f8fafc', '#e2e8f0'],
    packColor: ['#0f172a', '#020617'],
    accentColor: '#eab308',
    icon: '✨',
    shape: 'pouch',
    productDetail: 'Rich Taste with 15% Long Gently Rolled Leaves'
  },
  {
    file: 'tata-coffee-grand.svg',
    brand: 'Tata Coffee',
    name: 'Tata Coffee Grand Blend',
    weight: '100 g',
    category: 'Tea & Coffee',
    bgGradient: ['#fff1f2', '#ffe4e6'],
    packColor: ['#881337', '#4c0519'],
    accentColor: '#f59e0b',
    icon: '☕',
    shape: 'pouch',
    productDetail: 'Flavour Locked Decoction Crystals'
  },
  {
    file: 'real-mixed-fruit.svg',
    brand: 'Real Fruit Power',
    name: 'Real Mixed Fruit Juice',
    weight: '1 L',
    category: 'Cold Drinks & Juices',
    bgGradient: ['#fff7ed', '#ffedd5'],
    packColor: ['#ea580c', '#c2410c'],
    accentColor: '#16a34a',
    icon: '🧃',
    shape: 'box',
    productDetail: 'Goodness of 9 Fruits with Rich Vitamin C'
  },
  {
    file: 'minute-maid-orange.svg',
    brand: 'Minute Maid',
    name: 'Pulpy Orange Fruit Drink',
    weight: '1 L',
    category: 'Cold Drinks & Juices',
    bgGradient: ['#fff7ed', '#ffedd5'],
    packColor: ['#f97316', '#ea580c'],
    accentColor: '#84cc16',
    icon: '🍊',
    shape: 'bottle',
    productDetail: 'Refreshing Orange Drink with Real Fruit Pulp'
  },

  // 7. Staples, Oils & Atta
  {
    file: 'fortune-chakki-atta.svg',
    brand: 'Fortune',
    name: 'Fortune Chakki Fresh Atta',
    weight: '5 kg',
    category: 'Atta, Rice & Dal',
    bgGradient: ['#fefce8', '#fef08a'],
    packColor: ['#16a34a', '#15803d'],
    accentColor: '#eab308',
    icon: '🌾',
    shape: 'pouch',
    productDetail: '100% Traditional Stone Ground Wheat Flour'
  },
  {
    file: 'saffola-gold-oil.svg',
    brand: 'Saffola',
    name: 'Saffola Gold Healthy Oil',
    weight: '1 L',
    category: 'Oil, Ghee & Masala',
    bgGradient: ['#fefce8', '#fef08a'],
    packColor: ['#ca8a04', '#a16207'],
    accentColor: '#dc2626',
    icon: '🫒',
    shape: 'bottle',
    productDetail: 'Pro-Heart Dual-Seed Blended Edible Oil'
  },
  {
    file: 'fortune-mustard-oil.svg',
    brand: 'Fortune',
    name: 'Kachi Ghani Mustard Oil',
    weight: '1 L',
    category: 'Oil, Ghee & Masala',
    bgGradient: ['#fefce8', '#fef9c3'],
    packColor: ['#d97706', '#b45309'],
    accentColor: '#15803d',
    icon: '🟡',
    shape: 'bottle',
    productDetail: 'Pure Cold Pressed Pungent Mustard Oil'
  },
  {
    file: 'patanjali-cow-ghee.svg',
    brand: 'Patanjali',
    name: 'Pure Desi Cow Ghee',
    weight: '500 ml',
    category: 'Oil, Ghee & Masala',
    bgGradient: ['#f0fdf4', '#dcfce7'],
    packColor: ['#15803d', '#166534'],
    accentColor: '#f59e0b',
    icon: '🪔',
    shape: 'box',
    productDetail: 'Authentic Traditional Cow Milk Ghee'
  },
  {
    file: 'patanjali-til-oil.svg',
    brand: 'Patanjali',
    name: 'Pure Sesame (Til) Pooja Oil',
    weight: '1 L',
    category: 'Pooja & Daily Essentials',
    bgGradient: ['#fefce8', '#fef08a'],
    packColor: ['#ca8a04', '#a16207'],
    accentColor: '#ea580c',
    icon: '🪔',
    shape: 'bottle',
    productDetail: 'Auspicious Pure Sesame Oil for Mandir Deepam'
  },

  // 8. Spices & Masala
  {
    file: 'catch-haldi.svg',
    brand: 'Catch',
    name: 'Pure Turmeric (Haldi) Powder',
    weight: '200 g',
    category: 'Oil, Ghee & Masala',
    bgGradient: ['#fefce8', '#fef08a'],
    packColor: ['#eab308', '#ca8a04'],
    accentColor: '#c2410c',
    icon: '🌿',
    shape: 'pouch',
    productDetail: 'Low-Temperature Ground High-Curcumin Haldi'
  },
  {
    file: 'mdh-deggi-mirch.svg',
    brand: 'MDH',
    name: 'Deggi Mirch Mild Red Chilli',
    weight: '100 g',
    category: 'Oil, Ghee & Masala',
    bgGradient: ['#fef2f2', '#fee2e2'],
    packColor: ['#dc2626', '#b91c1c'],
    accentColor: '#f59e0b',
    icon: '🌶️',
    shape: 'pouch',
    productDetail: 'Unique Blend for Rich Red Gravy Color'
  },
  {
    file: 'catch-garam-masala.svg',
    brand: 'Catch',
    name: 'Super Garam Masala Sprinkler',
    weight: '100 g',
    category: 'Oil, Ghee & Masala',
    bgGradient: ['#fffbeb', '#fef3c7'],
    packColor: ['#b45309', '#78350f'],
    accentColor: '#d97706',
    icon: '🧂',
    shape: 'bottle',
    productDetail: 'Table Sprinkler with Rich Warm Whole Spices'
  },

  // 9. Breakfast Grains, Poha & Millets
  {
    file: 'poha-thin.svg',
    brand: 'ApnaMart Royal',
    name: 'Poha Thin (Flattened Rice)',
    weight: '500 g',
    category: 'Instant Food & Breakfast',
    bgGradient: ['#f8fafc', '#e2e8f0'],
    packColor: ['#0284c7', '#0369a1'],
    accentColor: '#16a34a',
    icon: '🥣',
    shape: 'pouch',
    productDetail: 'Quick-Soaking Flattened Rice Flakes'
  },
  {
    file: 'dalia-broken-wheat.svg',
    brand: 'Tata Sampann',
    name: 'Dalia (Broken Wheat)',
    weight: '500 g',
    category: 'Atta, Rice & Dal',
    bgGradient: ['#fefce8', '#fef08a'],
    packColor: ['#d97706', '#b45309'],
    accentColor: '#15803d',
    icon: '🌾',
    shape: 'pouch',
    productDetail: 'Coarse Cracked Golden Wheat for Khichdi'
  },
  {
    file: 'jowar-whole-grain.svg',
    brand: 'ApnaMart Organic',
    name: 'Jowar (Sorghum) Whole Grain',
    weight: '1 kg',
    category: 'Atta, Rice & Dal',
    bgGradient: ['#f8fafc', '#e2e8f0'],
    packColor: ['#64748b', '#475569'],
    accentColor: '#16a34a',
    icon: '🌾',
    shape: 'pouch',
    productDetail: 'Gluten-Free Nutritious Sorghum Millet'
  },
  {
    file: 'bajra-whole-grain.svg',
    brand: 'ApnaMart Organic',
    name: 'Bajra (Pearl Millet) Whole',
    weight: '1 kg',
    category: 'Atta, Rice & Dal',
    bgGradient: ['#f1f5f9', '#cbd5e1'],
    packColor: ['#475569', '#334155'],
    accentColor: '#eab308',
    icon: '🌾',
    shape: 'pouch',
    productDetail: 'Iron-Rich Winter Superfood Pearl Millet'
  },
  {
    file: 'ragi-whole-grain.svg',
    brand: 'ApnaMart Organic',
    name: 'Ragi (Finger Millet) Whole',
    weight: '1 kg',
    category: 'Atta, Rice & Dal',
    bgGradient: ['#fff1f2', '#ffe4e6'],
    packColor: ['#9f1239', '#881337'],
    accentColor: '#f59e0b',
    icon: '🌾',
    shape: 'pouch',
    productDetail: 'High Calcium Whole Finger Millet Grains'
  },

  // 10. Dairy, Snacks & Household
  {
    file: 'amul-mozzarella.svg',
    brand: 'Amul',
    name: 'Mozzarella Pizza Cheese Block',
    weight: '200 g',
    category: 'Dairy, Bread & Eggs',
    bgGradient: ['#fefce8', '#fef08a'],
    packColor: ['#16a34a', '#15803d'],
    accentColor: '#dc2626',
    icon: '🧀',
    shape: 'box',
    productDetail: 'High-Stretch Natural Mozzarella Block'
  },
  {
    file: 'haldirams-bhelpuri.svg',
    brand: "Haldiram's",
    name: 'Bhelpuri Ready Mix Namkeen',
    weight: '150 g',
    category: 'Chips, Namkeen & Snacks',
    bgGradient: ['#fff7ed', '#ffedd5'],
    packColor: ['#ea580c', '#c2410c'],
    accentColor: '#eab308',
    icon: '🥗',
    shape: 'pouch',
    productDetail: 'With Puffed Rice, Sev, Puris & Chutney'
  },
  {
    file: 'mccain-aloo-tikki.svg',
    brand: 'McCain',
    name: 'Crunchy Mazedar Aloo Tikki',
    weight: '400 g',
    category: 'Frozen & Ready-to-Eat',
    bgGradient: ['#fef2f2', '#fee2e2'],
    packColor: ['#dc2626', '#b91c1c'],
    accentColor: '#f59e0b',
    icon: '🥔',
    shape: 'pouch',
    productDetail: 'Spiced Indian Potato Cutlets Ready in 3 Mins'
  },
  {
    file: 'mccain-burger-patty.svg',
    brand: 'McCain',
    name: 'Veggie Burger Patty Pack',
    weight: '360 g',
    category: 'Frozen & Ready-to-Eat',
    bgGradient: ['#f0fdf4', '#dcfce7'],
    packColor: ['#16a34a', '#15803d'],
    accentColor: '#ea580c',
    icon: '🍔',
    shape: 'box',
    productDetail: 'Crisp Seasoned Veg Patty for Homemade Burgers'
  },
  {
    file: 'cheesy-corn-triangles.svg',
    brand: 'ITC Master Chef',
    name: 'Cheesy Corn Triangles',
    weight: '320 g',
    category: 'Frozen & Ready-to-Eat',
    bgGradient: ['#fffbeb', '#fef3c7'],
    packColor: ['#d97706', '#b45309'],
    accentColor: '#eab308',
    icon: '🧀',
    shape: 'box',
    productDetail: 'Crispy Snack Loaded with Gooey Cheese & Corn'
  },
  {
    file: 'cerelac-wheat-apple.svg',
    brand: 'Nestle',
    name: 'Cerelac Wheat Apple Cereal',
    weight: '300 g',
    category: 'Baby Care',
    bgGradient: ['#eff6ff', '#dbeafe'],
    packColor: ['#2563eb', '#1d4ed8'],
    accentColor: '#ef4444',
    icon: '🥣',
    shape: 'box',
    productDetail: 'Iron-Fortified Baby Cereal with Milk (From 6M)'
  },
  {
    file: 'nestle-munch.svg',
    brand: 'Nestle',
    name: 'Munch Crunchy Wafer Bar',
    weight: '35 g',
    category: 'Chocolates & Sweets',
    bgGradient: ['#eff6ff', '#bfdbfe'],
    packColor: ['#1d4ed8', '#1e40af'],
    accentColor: '#f59e0b',
    icon: '🍫',
    shape: 'pouch',
    productDetail: 'Crunch-O-Licious Chocolate Wafer Bar'
  },
  {
    file: 'cotton-diya-wicks.svg',
    brand: 'Mangaldeep',
    name: 'Pure Cotton Phool Batti Wicks',
    weight: '100 pcs',
    category: 'Pooja & Daily Essentials',
    bgGradient: ['#fffbeb', '#fef3c7'],
    packColor: ['#d97706', '#b45309'],
    accentColor: '#f59e0b',
    icon: '🪔',
    shape: 'box',
    productDetail: 'Hand-Rolled Flower Wicks for Mandir Pooja'
  },
  {
    file: 'surf-excel-matic-liquid.svg',
    brand: 'Surf Excel',
    name: 'Matic Liquid Detergent',
    weight: '1 L',
    category: 'Cleaning & Household',
    bgGradient: ['#eff6ff', '#dbeafe'],
    packColor: ['#2563eb', '#1e40af'],
    accentColor: '#ec4899',
    icon: '🧴',
    shape: 'bottle',
    productDetail: '100% Tough Stain Removal for Front Load'
  },
  {
    file: 'himalaya-neem-face-wash.svg',
    brand: 'Himalaya Herbals',
    name: 'Purifying Neem Face Wash',
    weight: '150 ml',
    category: 'Personal Care',
    bgGradient: ['#f0fdf4', '#dcfce7'],
    packColor: ['#16a34a', '#15803d'],
    accentColor: '#eab308',
    icon: '🌿',
    shape: 'bottle',
    productDetail: 'Soap-Free Herbal Formula with Neem & Turmeric'
  },
  {
    file: 'sebamed-baby-bar.svg',
    brand: 'Sebamed',
    name: 'Baby Cleansing Bar pH 5.5',
    weight: '100 g',
    category: 'Baby Care',
    bgGradient: ['#f0fdf4', '#dcfce7'],
    packColor: ['#0284c7', '#0369a1'],
    accentColor: '#16a34a',
    icon: '🧼',
    shape: 'box',
    productDetail: '100% Soap & Alkali Free for Sensitive Baby Skin'
  },
  {
    file: 'fresh-mosambi.svg',
    brand: 'Fresho',
    name: 'Nagpur Sweet Lime (Mosambi)',
    weight: '1 kg',
    category: 'Fruits & Vegetables',
    bgGradient: ['#fefce8', '#fef08a'],
    packColor: ['#84cc16', '#65a30d'],
    accentColor: '#eab308',
    icon: '🍋',
    shape: 'fresh_bowl',
    productDetail: 'Farm Fresh Sweet Juicy Citrus Mosambi'
  }
];

let generated = 0;
for (const p of PACKSHOTS) {
  const svg = createSvgPackshot(p);
  writeFileSync(resolve(OUT_DIR, p.file), svg, 'utf-8');
  generated++;
}

console.log(`✅ Successfully generated ${generated} beautiful authentic SVG packshots in public/products/!`);
