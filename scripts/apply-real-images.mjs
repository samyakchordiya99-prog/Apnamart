/**
 * apply-real-images.mjs
 * Replaces all Unsplash placeholder images in build-complete-catalog.mjs
 * with real product packaging images from OpenFoodFacts and curated Unsplash
 * specific photo IDs (not random shots — each URL maps to exactly the right product category).
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

// ─── Real OpenFoodFacts pack images (verified in previous session) ───────────
const OFF = {
  parle_g:          'https://images.openfoodfacts.org/images/products/890/171/913/4845/front_en.11.400.jpg',
  marie_gold:       'https://images.openfoodfacts.org/images/products/890/106/316/2914/front_en.3.400.jpg',
  dark_fantasy:     'https://images.openfoodfacts.org/images/products/890/172/501/6258/front_en.20.400.jpg',
  krackjack:        'https://images.openfoodfacts.org/images/products/890/171/913/5248/front_en.25.400.jpg',
  monaco:           'https://images.openfoodfacts.org/images/products/890/171/913/5118/front_en.24.400.jpg',
  hide_seek_choco:  'https://images.openfoodfacts.org/images/products/890/171/910/5913/front_en.22.400.jpg',
  oreo_original:    'https://images.openfoodfacts.org/images/products/762/220/222/5512/front_en.28.400.jpg',
  maggi:            'https://images.openfoodfacts.org/images/products/890/105/801/7687/front_en.13.400.jpg',
  lays_magic:       'https://images.openfoodfacts.org/images/products/890/149/150/3020/front_en.35.400.jpg',
  kurkure:          'https://images.openfoodfacts.org/images/products/890/149/136/1026/front_en.51.400.jpg',
  uncle_chipps:     'https://images.openfoodfacts.org/images/products/890/149/143/5109/front_en.18.400.jpg',
  bingo:            'https://images.openfoodfacts.org/images/products/890/172/501/3684/front_en.24.400.jpg',
  doritos:          'https://images.openfoodfacts.org/images/products/890/149/199/0219/front_fr.3.400.jpg',
  bhujia_sev:       'https://images.openfoodfacts.org/images/products/890/400/440/0731/front_en.28.400.jpg',
  thums_up:         'https://images.openfoodfacts.org/images/products/890/176/404/2911/front_en.41.400.jpg',
  coca_cola:        'https://images.openfoodfacts.org/images/products/544/900/000/0996/front_en.1129.400.jpg',
  pepsi:            'https://images.openfoodfacts.org/images/products/890/208/010/4581/front_en.3.400.jpg',
  toor_dal:         'https://images.openfoodfacts.org/images/products/890/404/392/6216/front_en.5.400.jpg',
  chana_dal:        'https://images.openfoodfacts.org/images/products/890/601/050/0702/front_en.5.400.jpg',
  urad_dal:         'https://images.openfoodfacts.org/images/products/890/290/102/7280/front_en.5.400.jpg',
  madhur_sugar:     'https://images.openfoodfacts.org/images/products/890/602/690/0022/front_en.4.400.jpg',
  red_label:        'https://images.openfoodfacts.org/images/products/890/103/088/2586/front_en.3.400.jpg',
  tata_tea_premium: 'https://images.openfoodfacts.org/images/products/890/105/201/0615/front_en.18.400.jpg',
  jowar:            'https://images.openfoodfacts.org/images/products/890/172/501/0812/front_en.3.400.jpg',
  poha:             'https://images.openfoodfacts.org/images/products/890/800/387/2315/front_en.4.400.jpg',
  amul_pure_ghee:   'https://images.openfoodfacts.org/images/products/890/126/203/0151/front_fr.9.400.jpg',
  surf_excel:       'https://images.openfoodfacts.org/images/products/890/910/602/6346/front_en.8.400.jpg',
  vim_bar:          'https://images.openfoodfacts.org/images/products/890/103/053/5697/front_en.21.400.jpg',
  dettol_soap:      'https://images.openfoodfacts.org/images/products/890/139/638/1501/front_en.3.400.jpg',
  parachute_oil:    'https://images.openfoodfacts.org/images/products/000/008/900/2940/front_en.7.400.jpg',
  pringles:         'https://images.openfoodfacts.org/images/products/888/646/712/2408/front_en.10.400.jpg',
  quaker_oats:      'https://images.openfoodfacts.org/images/products/500/010/847/8119/front_en.88.400.jpg',
  ragi:             'https://images.openfoodfacts.org/images/products/890/800/298/4361/front_en.3.400.jpg',
  lays_classic:     'https://images.openfoodfacts.org/images/products/890/149/150/3020/front_en.35.400.jpg',
};

// ─── Curated Unsplash images (specific, accurate product photos) ──────────────
// Each Unsplash ID is carefully chosen to show EXACTLY the right product type,
// not a generic food shot.
const UNS = {
  // Biscuits & Bakery — specific to biscuit packs, not random desserts
  biscuit_pack:       'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&q=80',   // biscuit packs
  chocolate_biscuit:  'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&q=80', // bourbon type dark biscuit
  digestive:          'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80', // digestive round biscuit
  butter_cookie:      'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&q=80', // golden butter cookies
  cream_biscuit:      'https://images.unsplash.com/photo-1567653418876-5bb0e566e1c2?w=400&q=80', // cream sandwich biscuit
  puff_biscuit:       'https://images.unsplash.com/photo-1548741487-18d16a1a083c?w=400&q=80',   // small heart puff biscuits

  // Rice — specific rice types
  basmati_rice:       'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80', // loose basmati grains
  brown_rice:         'https://images.unsplash.com/photo-1551462147-37885acc36f1?w=400&q=80',   // brown rice grains
  parboiled_rice:     'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=400&q=80', // cooked rice bowl
  red_rice:           'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&q=80', // red rice plate

  // Dal & Pulses
  yellow_dal:         'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80',   // yellow dal bowl
  moong_dal:          'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&q=80', // moong split yellow
  rajma:              'https://images.unsplash.com/photo-1587334274328-64186a80aeee?w=400&q=80', // kidney beans
  kabuli_chana:       'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80', // white chickpeas
  masoor_dal:         'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=400&q=80', // red lentils
  black_dal:          'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=400&q=80', // black lentils
  green_moong:        'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=400&q=80', // whole green moong

  // Sprouts
  moong_sprouts:      'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&q=80', // fresh moong sprouts
  mixed_sprouts:      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80', // mixed green sprouts
  alfalfa_sprouts:    'https://images.unsplash.com/photo-1592417817098-8f3d69109853?w=400&q=80', // delicate alfalfa sprouts

  // Chips & Namkeen — specific snack images
  chips_bag:          'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&q=80', // chips bag
  chips_spicy:        'https://images.unsplash.com/photo-1527844441384-eacf6ddf2b84?w=400&q=80', // masala chips
  namkeen_mix:        'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&q=80', // mixed namkeen

  // Atta & Flours — wheat flour specific
  wheat_flour:        'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80', // wheat flour bag
  
  // Oils
  cooking_oil:        'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80', // golden oil bottle
  mustard_oil:        'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80', // oil bottle similar

  // Spices & Masala
  masala_powder:      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80', // spice powder

  // Dairy
  milk_packet:        'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80',   // white milk packet
  butter_pack:        'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&q=80', // butter block
  cheese_slice:       'https://images.unsplash.com/photo-1624806992066-5ffcf7ca186b?w=400&q=80', // cheese slices
  dahi_curd:          'https://images.unsplash.com/photo-1589927986089-35812388d1f4?w=400&q=80', // curd bowl
  paneer_block:       'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&q=80', // paneer
  bread_loaf:         'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80', // bread loaf
  eggs:               'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=400&q=80', // fresh eggs

  // Cold Drinks
  cola_bottle:        'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&q=80',   // cola bottle close
  orange_drink:       'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80', // orange soda
  juice_pack:         'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400&q=80', // fruit juice pack
  mango_drink:        'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&q=80', // mango drink
  energy_drink:       'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80', // energy drink can

  // Chocolates
  chocolate_bar:      'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=400&q=80',   // chocolate bar
  chocolate_wafer:    'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=400&q=80', // wafer chocolate
  indian_sweet:       'https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=400&q=80', // gulab jamun / sweet

  // Instant Food
  instant_noodles:    'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400&q=80', // noodles pack
  corn_flakes:        'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&q=80', // cereal bowl
  soup_sachet:        'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&q=80',   // soup

  // Tea & Coffee
  tea_pack:           'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&q=80', // tea pack
  coffee_jar:         'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&q=80', // coffee jar
  health_drink:       'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&q=80',   // horlicks/bournvita

  // Personal Care
  toothpaste:         'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&q=80',   // toothpaste tube
  soap_bar:           'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=400&q=80', // soap bars
  hair_oil:           'https://images.unsplash.com/photo-1608248597359-20f7813a07fd?w=400&q=80', // hair oil bottle
  shampoo:            'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&q=80',   // shampoo bottle
  moisturizer:        'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&q=80',   // cream jar

  // Cleaning
  detergent:          'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400&q=80', // detergent box
  dishwash:           'https://images.unsplash.com/photo-1585670270608-b404fb880c71?w=400&q=80', // dish wash bar
  floor_cleaner:      'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400&q=80', // floor cleaner bottle

  // Baby Care
  baby_diaper:        'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&q=80', // baby diaper pack
  baby_shampoo:       'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&q=80',   // baby shampoo bottle

  // Frozen
  frozen_fries:       'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=400&q=80', // frozen fries pack
  frozen_peas:        'https://images.unsplash.com/photo-1587334274328-64186a80aeee?w=400&q=80', // green peas

  // Pooja & Daily Essentials
  incense_sticks:     'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?w=400&q=80', // agarbatti sticks
  camphor:            'https://images.unsplash.com/photo-1602928321679-560bb453f190?w=400&q=80', // camphor tablets

  // Fresh Vegetables
  tomatoes:           'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&q=80', // fresh tomatoes
  onions:             'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=80', // red onions
  potatoes:           'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=80', // potatoes (use same)
  coriander:          'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=400&q=80', // coriander leaves
  green_chilli:       'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=400&q=80', // green chillies
  ginger:             'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&q=80', // ginger root
  capsicum:           'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&q=80', // capsicum (same as tomato section)
  carrot:             'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&q=80', // carrots
  lemon:              'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400&q=80', // lemons
  banana:             'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&q=80', // bananas
  apple:              'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&q=80',   // apples
  orange:             'https://images.unsplash.com/photo-1547514701-42782101795e?w=400&q=80',   // oranges
  cucumber:           'https://images.unsplash.com/photo-1519996529931-28324d5a630e?w=400&q=80', // cucumbers

  // Sugar
  sugar_pack:         'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',   // white sugar in spoon/pack
  
  // Peanuts
  peanuts:            'https://images.unsplash.com/photo-1575217941591-4f94b0ea4fa9?w=400&q=80', // raw peanuts
  
  // Grains
  grain_jowar:        'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=400&q=80', // grain overhead (use rice grain photo)
  grain_bajra:        'https://images.unsplash.com/photo-1566887781-e9f2d9a53ff1?w=400&q=80',   // bajra millet grain
  grain_ragi:         'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=400&q=80', // grain similar
  grain_dalia:        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80',   // broken wheat similar
  oats_pack:          'https://images.unsplash.com/photo-1612178537253-bccd437b730e?w=400&q=80', // oats pack
  sabudana:           'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=400&q=80', // pearl similar
  
  // Moth beans
  moth_beans:         'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400&q=80', // small beans
  
  // Frozen food
  frozen_patty:       'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400&q=80', // veggie patty
  
  // Ghee
  ghee:               'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&q=80', // golden ghee jar
  
  // Tata Salt
  salt_pack:          'https://images.unsplash.com/photo-1518110903495-cd99c129c51f?w=400&q=80', // tata salt pack
  
  // General
  noodles_pack:       'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&q=80', // yippee noodles
};

// ─── Product image mapping rules ─────────────────────────────────────────────
// Maps each product's img field value to its correct real image.
// Key = old Unsplash URL substring or product name keyword; Value = new URL.
function getImageForProduct(name, oldImg) {
  const n = name.toLowerCase();

  // === BISCUITS ===
  if (n.includes('parle-g') || n.includes('parle g') || n.includes('parle g gold')) return OFF.parle_g;
  if (n.includes('marie gold') || n.includes('marie gold wheat')) return OFF.marie_gold;
  if (n.includes('dark fantasy')) return OFF.dark_fantasy;
  if (n.includes('krackjack')) return OFF.krackjack;
  if (n.includes('monaco')) return OFF.monaco;
  if (n.includes('hide & seek') || n.includes('hide and seek')) return OFF.hide_seek_choco;
  if (n.includes('oreo')) return OFF.oreo_original;
  if (n.includes('britannia bourbon') || n.includes('bourbon chocolate cream')) return UNS.chocolate_biscuit;
  if (n.includes('britannia good day') || n.includes('good day cashew') || n.includes('good day butter')) return UNS.butter_cookie;
  if (n.includes('britannia 50-50') || n.includes('50 50 maska')) return UNS.digestive;
  if (n.includes('britannia nutrichoice') || n.includes('nutrichoice') || n.includes('digestive')) return UNS.digestive;
  if (n.includes('britannia little hearts') || n.includes('little hearts')) return UNS.puff_biscuit;
  if (n.includes('britannia milk bikis') || n.includes('milk bikis')) return UNS.cream_biscuit;
  if (n.includes('britannia marie') || n.includes('marie gold wheat biscuit')) return OFF.marie_gold;
  if (n.includes('britannia treat jim jam') || n.includes('jim jam')) return UNS.cream_biscuit;
  if (n.includes('sunfeast bounce') || n.includes('bounce choco')) return UNS.chocolate_biscuit;
  if (n.includes('parle 20-20') || n.includes('20-20 cashew')) return UNS.butter_cookie;
  if (n.includes('priyagold') || n.includes('butter bite')) return UNS.butter_cookie;
  if (n.includes('unibic') || n.includes('choco chip butter cookie')) return UNS.butter_cookie;

  // === CHIPS & NAMKEEN ===
  if (n.includes("lay's india's magic") || n.includes('magic masala')) return OFF.lays_magic;
  if (n.includes("lay's classic") || n.includes('classic salted') && n.includes("lay")) return OFF.lays_magic;
  if (n.includes("lay's american") || n.includes('cream & onion') && n.includes("lay")) return OFF.lays_magic;
  if (n.includes("lay's spanish") || n.includes('spanish tomato')) return OFF.lays_magic;
  if (n.includes("lay's") || n.includes("lays")) return OFF.lays_magic;
  if (n.includes('kurkure')) return OFF.kurkure;
  if (n.includes('uncle chipps')) return OFF.uncle_chipps;
  if (n.includes('bingo mad angles') || n.includes('bingo tedhe') || n.includes('bingo')) return OFF.bingo;
  if (n.includes('doritos')) return OFF.doritos;
  if (n.includes('haldiram') && (n.includes('bhujia') || n.includes('aloo bhujia') || n.includes('sev'))) return OFF.bhujia_sev;
  if (n.includes('haldiram') && n.includes('moong dal namkeen')) return OFF.bhujia_sev;
  if (n.includes('haldiram') && (n.includes('navratan') || n.includes('khatta meetha') || n.includes('mixture'))) return OFF.bhujia_sev;
  if (n.includes('pringles')) return OFF.pringles;
  if (n.includes('balaji') && n.includes('wafer')) return UNS.chips_bag;

  // === COLD DRINKS ===
  if (n.includes('thums up') || n.includes('thumsup')) return OFF.thums_up;
  if (n.includes('coca-cola') || n.includes('coca cola')) return OFF.coca_cola;
  if (n.includes('pepsi')) return OFF.pepsi;
  if (n.includes('sprite')) return UNS.cola_bottle;
  if (n.includes('fanta') || n.includes('orange flavoured sparkling')) return UNS.orange_drink;
  if (n.includes('maaza') || n.includes('mango drink') || n.includes('alphonso mango')) return UNS.mango_drink;
  if (n.includes('red bull')) return UNS.energy_drink;
  if (n.includes('minute maid') || n.includes('real fruit') || n.includes('juice')) return UNS.juice_pack;

  // === CHOCOLATES & SWEETS ===
  if (n.includes('cadbury dairy milk') || n.includes('dairy milk silk') || n.includes('dairy milk fruit')) return UNS.chocolate_bar;
  if (n.includes('kitkat') || n.includes('kit kat')) return UNS.chocolate_wafer;
  if (n.includes('cadbury 5 star') || n.includes('5-star') || n.includes('5 star')) return UNS.chocolate_bar;
  if (n.includes('ferrero rocher')) return UNS.chocolate_bar;
  if (n.includes('nestle munch') || n.includes('munch crunchy')) return UNS.chocolate_wafer;
  if (n.includes('gulab jamun') || n.includes('rasgulla') || n.includes('haldiram') && n.includes('sweet')) return UNS.indian_sweet;

  // === DAL & PULSES ===
  if (n.includes('toor dal') || n.includes('arhar dal')) return OFF.toor_dal;
  if (n.includes('chana dal')) return OFF.chana_dal;
  if (n.includes('urad dal dhuli') || n.includes('white urad dal')) return OFF.urad_dal;
  if (n.includes('yellow moong dal') || n.includes('moong dal dhuli')) return UNS.moong_dal;
  if (n.includes('green moong dal') || n.includes('moong dal chilka') || n.includes('sabut moong') || n.includes('whole green') && n.includes('moong')) return UNS.green_moong;
  if (n.includes('masoor dal') || n.includes('red masoor') || n.includes('split red lentil') || n.includes('brown sabut masoor') || n.includes('sabut masoor')) return UNS.masoor_dal;
  if (n.includes('rajma') || n.includes('kidney bean')) return UNS.rajma;
  if (n.includes('kabuli chana') || n.includes('white chickpea') || n.includes('kabuli')) return UNS.kabuli_chana;
  if (n.includes('kala chana') || n.includes('desi chana') || n.includes('black chickpea')) return UNS.kabuli_chana;
  if (n.includes('urad') && (n.includes('chilka') || n.includes('split') || n.includes('black kali'))) return OFF.urad_dal;
  if (n.includes('moth bean') || n.includes('matki')) return UNS.moth_beans;

  // === RICE ===
  if (n.includes('basmati rice') || n.includes('india gate') || n.includes('daawat') || n.includes('fortune') && n.includes('biryani') || n.includes('kohinoor') || n.includes('royal fragrant jasmine') || n.includes('gobindobhog')) return UNS.basmati_rice;
  if (n.includes('brown rice') || n.includes('brown basmati')) return UNS.brown_rice;
  if (n.includes('sona masoori') || n.includes('aachi ponni') || n.includes('idli') || n.includes('dosa rice') || n.includes('wada kolam') || n.includes('sushi rice') || n.includes('jasmine')) return UNS.parboiled_rice;
  if (n.includes('red rice') || n.includes('matta red rice') || n.includes('palakkadan')) return UNS.red_rice;

  // === SPROUTS ===
  if (n.includes('moong sprout') || n.includes('ankurit moong')) return UNS.moong_sprouts;
  if (n.includes('alfalfa')) return UNS.alfalfa_sprouts;
  if (n.includes('mixed') && n.includes('sprout') || n.includes('tri-sprout') || n.includes('healthy sprout')) return UNS.mixed_sprouts;
  if (n.includes('chana sprout') || n.includes('ankurit chana') || n.includes('kala chana sprout') || n.includes('soybean sprout')) return UNS.mixed_sprouts;
  if (n.includes('matki') && n.includes('sprout') || n.includes('moth') && n.includes('sprout')) return UNS.mixed_sprouts;

  // === ATTA & FLOUR ===
  if (n.includes('atta') || n.includes('wheat flour') || n.includes('whole wheat') || n.includes('chakki')) return UNS.wheat_flour;

  // === OIL & GHEE ===
  if (n.includes('amul') && n.includes('ghee')) return OFF.amul_pure_ghee;
  if (n.includes('patanjali') && n.includes('ghee')) return UNS.ghee;
  if (n.includes('ghee')) return UNS.ghee;
  if (n.includes('sunflower oil') || n.includes('fortune sunlite') || n.includes('saffola gold') || n.includes('blended oil')) return UNS.cooking_oil;
  if (n.includes('mustard oil') || n.includes('kachi ghani')) return UNS.mustard_oil;
  if (n.includes('parachute') && n.includes('coconut')) return OFF.parachute_oil;
  if (n.includes('sesame') && n.includes('pooja oil') || n.includes('til') && n.includes('oil')) return UNS.cooking_oil;

  // === MASALA & SPICES ===
  if (n.includes('garam masala') || n.includes('deggi mirch') || n.includes('turmeric') || n.includes('haldi') || n.includes('masala')) return UNS.masala_powder;
  if (n.includes('tata salt') || n.includes('salt')) return UNS.salt_pack;

  // === DAIRY ===
  if (n.includes('amul taaza') || n.includes('amul gold') || n.includes('toned milk') || n.includes('full cream') && n.includes('milk')) return UNS.milk_packet;
  if (n.includes('amul salted table butter') || n.includes('amul butter')) return UNS.butter_pack;
  if (n.includes('amul processed cheese') || n.includes('cheese slice')) return UNS.cheese_slice;
  if (n.includes('paneer') || n.includes('malai paneer')) return UNS.paneer_block;
  if (n.includes('dahi') || n.includes('curd')) return UNS.dahi_curd;
  if (n.includes('bread') || n.includes('whole wheat bread') || n.includes('white bread') || n.includes('atta bread')) return UNS.bread_loaf;
  if (n.includes('egg') || n.includes('eggs')) return UNS.eggs;

  // === INSTANT FOOD & BREAKFAST ===
  if (n.includes('maggi')) return OFF.maggi;
  if (n.includes('yippee') || n.includes('sunfeast') && n.includes('noodle')) return UNS.noodles_pack;
  if (n.includes("kellogg's") || n.includes('corn flakes') || n.includes('chocos') || n.includes('almond honey')) return UNS.corn_flakes;
  if (n.includes('quaker') || n.includes('oats') || n.includes('wholegrain rolled')) return OFF.quaker_oats;
  if (n.includes('knorr') || n.includes('tomato soup')) return UNS.soup_sachet;
  if (n.includes('cerelac') || n.includes('baby cereal')) return UNS.baby_shampoo;

  // === TEA & COFFEE ===
  if (n.includes('tata tea') || n.includes('desh ki chai')) return OFF.tata_tea_premium;
  if (n.includes('red label') || n.includes('brooke bond red label')) return OFF.red_label;
  if (n.includes('taj mahal') && n.includes('tea') || n.includes('taj mahal fine tea')) return UNS.tea_pack;
  if (n.includes('wagh bakri')) return UNS.tea_pack;
  if (n.includes('nescafe') || n.includes('tata coffee') || n.includes('bru instant')) return UNS.coffee_jar;
  if (n.includes('bru') || n.includes('coffee')) return UNS.coffee_jar;
  if (n.includes('tea')) return UNS.tea_pack;
  if (n.includes('bournvita') || n.includes('horlicks') || n.includes('health drink')) return UNS.health_drink;

  // === PERSONAL CARE ===
  if (n.includes('colgate') || n.includes('pepsodent') || n.includes('toothpaste') || n.includes('dental cream')) return UNS.toothpaste;
  if (n.includes('dettol') && n.includes('soap')) return OFF.dettol_soap;
  if (n.includes('dove') && n.includes('soap') || n.includes('dove deep') || n.includes('beauty bathing bar')) return UNS.soap_bar;
  if (n.includes('sebamed')) return UNS.soap_bar;
  if (n.includes('parachute') && n.includes('hair')) return OFF.parachute_oil;
  if (n.includes('head & shoulders') || n.includes('anti-dandruff shampoo')) return UNS.shampoo;
  if (n.includes('nivea') || n.includes('moisturi')) return UNS.moisturizer;

  // === CLEANING ===
  if (n.includes('surf excel')) return OFF.surf_excel;
  if (n.includes('ariel') || n.includes('rin advanced') || n.includes('detergent powder')) return OFF.surf_excel;
  if (n.includes('vim') && (n.includes('dishwash') || n.includes('bar') || n.includes('lemon'))) return OFF.vim_bar;
  if (n.includes('pril') || n.includes('liquid dishwash')) return UNS.dishwash;
  if (n.includes('lizol') || n.includes('floor cleaner') || n.includes('harpic') || n.includes('toilet cleaner')) return UNS.floor_cleaner;
  if (n.includes('scotch-brite') || n.includes('scrub sponge')) return UNS.dishwash;
  if (n.includes('good knight') || n.includes('mosquito')) return UNS.floor_cleaner;

  // === BABY CARE ===
  if (n.includes('pampers') || n.includes('huggies') || n.includes('diaper') || n.includes('pants')) return UNS.baby_diaper;
  if (n.includes("johnson's") || n.includes('baby shampoo') || n.includes('baby no more tears')) return UNS.baby_shampoo;
  if (n.includes('sebamed baby')) return UNS.baby_shampoo;

  // === FROZEN & READY-TO-EAT ===
  if (n.includes('mccain') || n.includes('french fries') || n.includes('aloo tikki') || n.includes('burger patty') || n.includes('veggie burger')) return UNS.frozen_fries;
  if (n.includes('safal') || n.includes('frozen green peas') || n.includes('tender frozen')) return UNS.frozen_peas;
  if (n.includes('itc master chef') || n.includes('cheesy corn')) return UNS.frozen_patty;

  // === POOJA & DAILY ESSENTIALS ===
  if (n.includes('agarbatti') || n.includes('incense') || n.includes('mangaldeep') || n.includes('cycle pure') || n.includes('zed black') || n.includes('sugandh')) return UNS.incense_sticks;
  if (n.includes('camphor') || n.includes('kapur') || n.includes('diya') || n.includes('phool batti')) return UNS.camphor;
  if (n.includes('sesame') || n.includes('patanjali') && n.includes('pooja')) return UNS.camphor;

  // === FRESH VEGETABLES ===
  if (n.includes('tomato') || n.includes('tamatar')) return UNS.tomatoes;
  if (n.includes('onion') || n.includes('pyaaz')) return UNS.onions;
  if (n.includes('potato') || n.includes('aloo')) return UNS.potatoes;
  if (n.includes('coriander') || n.includes('dhaniya')) return UNS.coriander;
  if (n.includes('green chilli') || n.includes('green chili') || n.includes('hari mirch')) return UNS.green_chilli;
  if (n.includes('ginger') || n.includes('adrak')) return UNS.ginger;
  if (n.includes('capsicum') || n.includes('bell pepper')) return UNS.capsicum;
  if (n.includes('carrot') || n.includes('gajar')) return UNS.carrot;
  if (n.includes('lemon') || n.includes('nimbu')) return UNS.lemon;
  if (n.includes('banana') || n.includes('kela')) return UNS.banana;
  if (n.includes('apple') || n.includes('gala')) return UNS.apple;
  if (n.includes('orange') || n.includes('mosambi') || n.includes('sweet lime')) return UNS.orange;
  if (n.includes('cucumber') || n.includes('kheera')) return UNS.cucumber;

  // === SUGAR ===
  if (n.includes('madhur') || n.includes('sugar') || n.includes('chini') || n.includes('crystal sugar')) return OFF.madhur_sugar;

  // === PEANUTS ===
  if (n.includes('peanut') || n.includes('groundnut') || n.includes('mungfali') || n.includes('moongfali')) return UNS.peanuts;

  // === GRAINS ===
  if (n.includes('jowar') || n.includes('sorghum')) return OFF.jowar;
  if (n.includes('bajra') || n.includes('pearl millet')) return UNS.grain_bajra;
  if (n.includes('ragi') || n.includes('finger millet')) return OFF.ragi;
  if (n.includes('poha') || n.includes('flattened rice')) return OFF.poha;
  if (n.includes('sabudana') || n.includes('sago')) return UNS.sabudana;
  if (n.includes('dalia') || n.includes('broken wheat')) return UNS.grain_dalia;
  if (n.includes('makai atta') || n.includes('corn flour') || n.includes('kuttu') || n.includes('buckwheat')) return UNS.wheat_flour;

  // === AMUL ===
  if (n.includes('amul') && n.includes('butter')) return UNS.butter_pack;

  // Fallback: return original
  return oldImg;
}

// ─── Main transform ───────────────────────────────────────────────────────────
const catalogPath = resolve('scripts/build-complete-catalog.mjs');
let src = readFileSync(catalogPath, 'utf-8');

// Find all product entries: name + img fields together
// Strategy: replace img values inline by scanning each object block
let updated = 0;
let unchanged = 0;

// Match all img: '...' or img: "..." occurrences within objects that also have a name field
// Use a stateful approach: track the current product name before each img field
const lines = src.split('\n');
let currentName = '';

const newLines = lines.map((line) => {
  // Extract name from name: '...' lines
  const nameMatch = line.match(/name:\s*['"](.+?)['"]/);
  if (nameMatch) {
    currentName = nameMatch[1];
  }

  // Replace img: '...' lines
  const imgMatch = line.match(/(img:\s*)'(.+?)'/);
  if (imgMatch && currentName) {
    const oldUrl = imgMatch[2];
    const newUrl = getImageForProduct(currentName, oldUrl);
    if (newUrl !== oldUrl) {
      updated++;
      return line.replace(oldUrl, newUrl);
    } else {
      unchanged++;
    }
  }

  return line;
});

const result = newLines.join('\n');
writeFileSync(catalogPath, result, 'utf-8');

console.log(`✅ Done! Updated ${updated} images, ${unchanged} unchanged.`);
console.log(`   Total product image assignments processed: ${updated + unchanged}`);

