import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';

function getPrice(mrp, discount) {
  if (!discount || discount === 0) return mrp;
  return Number((mrp * (1 - discount / 100)).toFixed(2));
}

// Category image map
const CAT_IMG = {
  'Fruits & Vegetables': 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=500&q=80',
  'Dairy, Bread & Eggs': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=500&q=80',
  'Cold Drinks & Juices': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=500&q=80',
  'Chips, Namkeen & Snacks': 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=500&q=80',
  'Chocolates & Sweets': 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=500&q=80',
  'Biscuits & Bakery': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=500&q=80',
  'Atta, Rice & Dal': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=500&q=80',
  'Oil, Ghee & Masala': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=500&q=80',
  'Instant Food & Breakfast': 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=500&q=80',
  'Tea & Coffee': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=500&q=80',
  'Personal Care': 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=500&q=80',
  'Cleaning & Household': 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=500&q=80',
  'Baby Care': 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=500&q=80',
  'Frozen & Ready-to-Eat': 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=500&q=80',
  'Pooja & Daily Essentials': 'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&w=500&q=80',
};

// Initial 25 products from PDF for Shop 1
const SHOP_01_PDF_25 = [
  { name: 'Aashirvaad Atta', cat: 'Atta, Rice & Dal', pack: '5 kg', mrp: 250, off: 0, stock: 20, brand: 'Aashirvaad', unit: 'kg', desc: 'Superior MP wheat whole grain chakki atta.' },
  { name: 'India Gate Basmati Rice', cat: 'Atta, Rice & Dal', pack: '1 kg', mrp: 145, off: 5, stock: 18, brand: 'India Gate', unit: 'kg', desc: 'Aged long-grain aromatic basmati rice for daily feast.' },
  { name: 'Kolam Rice', cat: 'Atta, Rice & Dal', pack: '5 kg', mrp: 310, off: 0, stock: 12, brand: 'Wada Kolam', unit: 'kg', desc: 'Silky smooth texture medium-grain daily rice.' },
  { name: 'Tata Sampann Toor Dal', cat: 'Atta, Rice & Dal', pack: '1 kg', mrp: 175, off: 5, stock: 15, brand: 'Tata Sampann', unit: 'kg', desc: 'Unpolished protein-rich high quality toor dal.' },
  { name: 'Moong Dal', cat: 'Atta, Rice & Dal', pack: '1 kg', mrp: 135, off: 0, stock: 16, brand: 'Tata Sampann', unit: 'kg', desc: 'Nutritious yellow moong dal, easy to digest.' },
  { name: 'Fortune Sunflower Oil', cat: 'Oil, Ghee & Masala', pack: '1 L', mrp: 145, off: 5, stock: 22, brand: 'Fortune', unit: 'litre', desc: 'Light and healthy refined sunflower cooking oil.' },
  { name: 'Amul Ghee', cat: 'Oil, Ghee & Masala', pack: '500 ml', mrp: 315, off: 0, stock: 10, brand: 'Amul', unit: 'ml', desc: 'Pure desi cow milk ghee with traditional aroma.' },
  { name: 'Amul Taaza Milk', cat: 'Dairy, Bread & Eggs', pack: '1 L', mrp: 58, off: 0, stock: 30, brand: 'Amul', unit: 'litre', desc: 'Homogenised toned milk, rich in calcium and protein.' },
  { name: 'Amul Butter', cat: 'Dairy, Bread & Eggs', pack: '100 g', mrp: 60, off: 0, stock: 20, brand: 'Amul', unit: 'g', desc: 'Pasteurised salted creamy butter.' },
  { name: 'Amul Cheese Slices', cat: 'Dairy, Bread & Eggs', pack: '200 g', mrp: 145, off: 5, stock: 12, brand: 'Amul', unit: 'g', desc: 'Processed cheddar cheese slices (Pack of 10).' },
  { name: 'Thums Up', cat: 'Cold Drinks & Juices', pack: '750 ml', mrp: 40, off: 10, stock: 24, brand: 'Thums Up', unit: 'ml', desc: 'Strong fizzy carbonated cola with spicy punch.' },
  { name: 'Coca-Cola', cat: 'Cold Drinks & Juices', pack: '750 ml', mrp: 40, off: 5, stock: 24, brand: 'Coca-Cola', unit: 'ml', desc: 'Classic refreshing carbonated cola beverage.' },
  { name: 'Sprite', cat: 'Cold Drinks & Juices', pack: '750 ml', mrp: 40, off: 0, stock: 18, brand: 'Sprite', unit: 'ml', desc: 'Crisp lemon-lime flavoured clear soft drink.' },
  { name: 'Lay\'s Classic Salted', cat: 'Chips, Namkeen & Snacks', pack: '52 g', mrp: 20, off: 10, stock: 40, brand: 'Lay\'s', unit: 'g', desc: 'Thin crispy potato chips seasoned with fine salt.' },
  { name: 'Kurkure Masala Munch', cat: 'Chips, Namkeen & Snacks', pack: '75 g', mrp: 20, off: 5, stock: 35, brand: 'Kurkure', unit: 'g', desc: 'Crunchy spicy puffed corn curls with Indian spices.' },
  { name: 'Bingo Mad Angles', cat: 'Chips, Namkeen & Snacks', pack: '72 g', mrp: 20, off: 0, stock: 25, brand: 'Bingo', unit: 'g', desc: 'Achaari masti triangle corn chips.' },
  { name: 'Haldiram Aloo Bhujia', cat: 'Chips, Namkeen & Snacks', pack: '200 g', mrp: 55, off: 5, stock: 15, brand: 'Haldiram\'s', unit: 'g', desc: 'Crispy mint and spice flavoured potato sev namkeen.' },
  { name: 'Parle-G', cat: 'Biscuits & Bakery', pack: '800 g', mrp: 50, off: 0, stock: 20, brand: 'Parle', unit: 'g', desc: 'Original glucose biscuits loved by generations.' },
  { name: 'Britannia Good Day', cat: 'Biscuits & Bakery', pack: '200 g', mrp: 40, off: 10, stock: 22, brand: 'Britannia', unit: 'g', desc: 'Rich cashew and butter cookies with smiling crust.' },
  { name: 'Oreo Original', cat: 'Biscuits & Bakery', pack: '120 g', mrp: 30, off: 0, stock: 18, brand: 'Cadbury', unit: 'g', desc: 'Rich chocolate cookie sandwich with smooth vanilla cream.' },
  { name: 'Maggi 2-Minute Noodles', cat: 'Instant Food & Breakfast', pack: '4 pack', mrp: 56, off: 5, stock: 30, brand: 'Maggi', unit: 'pack', desc: 'Iconic masala instant noodles made with authentic spices.' },
  { name: 'Yippee Noodles', cat: 'Instant Food & Breakfast', pack: '4 pack', mrp: 60, off: 0, stock: 18, brand: 'Sunfeast', unit: 'pack', desc: 'Non-sticky round instant noodles with veggies.' },
  { name: 'Surf Excel Easy Wash', cat: 'Cleaning & Household', pack: '1 kg', mrp: 125, off: 5, stock: 10, brand: 'Surf Excel', unit: 'kg', desc: 'Super clean washing powder with stain removal power.' },
  { name: 'Vim Dishwash Bar', cat: 'Cleaning & Household', pack: '300 g', mrp: 30, off: 0, stock: 25, brand: 'Vim', unit: 'g', desc: 'Lemon power dishwash bar for grease-free utensils.' },
  { name: 'Colgate Strong Teeth', cat: 'Personal Care', pack: '150 g', mrp: 95, off: 5, stock: 14, brand: 'Colgate', unit: 'g', desc: 'Amino shakti formula toothpaste for cavity protection.' },
];

// Initial 25 products from PDF for Shop 2
const SHOP_02_PDF_25 = [
  { name: 'Fortune Chakki Fresh Atta', cat: 'Atta, Rice & Dal', pack: '5 kg', mrp: 235, off: 5, stock: 16, brand: 'Fortune', unit: 'kg', desc: 'Freshly milled 100% whole wheat chakki atta.' },
  { name: 'Daawat Rozana Gold Rice', cat: 'Atta, Rice & Dal', pack: '5 kg', mrp: 345, off: 0, stock: 10, brand: 'Daawat', unit: 'kg', desc: 'Premium daily basmati rice with slender grains.' },
  { name: 'Sona Masoori Rice', cat: 'Atta, Rice & Dal', pack: '1 kg', mrp: 78, off: 0, stock: 20, brand: 'Daawat', unit: 'kg', desc: 'Lightweight aromatic daily south Indian rice.' },
  { name: 'Tata Sampann Chana Dal', cat: 'Atta, Rice & Dal', pack: '1 kg', mrp: 110, off: 5, stock: 14, brand: 'Tata Sampann', unit: 'kg', desc: 'Unpolished protein rich split desi bengal gram.' },
  { name: 'Masoor Dal', cat: 'Atta, Rice & Dal', pack: '1 kg', mrp: 115, off: 0, stock: 18, brand: 'Tata Sampann', unit: 'kg', desc: 'Clean sorted red lentils (dhuli masoor).' },
  { name: 'Saffola Gold Oil', cat: 'Oil, Ghee & Masala', pack: '1 L', mrp: 165, off: 5, stock: 12, brand: 'Saffola', unit: 'litre', desc: 'Pro-heart multisource blended healthy edible oil.' },
  { name: 'Patanjali Cow Ghee', cat: 'Oil, Ghee & Masala', pack: '500 ml', mrp: 290, off: 0, stock: 8, brand: 'Patanjali', unit: 'ml', desc: 'Pure golden cow milk clarified butter.' },
  { name: 'Amul Gold Milk', cat: 'Dairy, Bread & Eggs', pack: '500 ml', mrp: 35, off: 0, stock: 25, brand: 'Amul', unit: 'ml', desc: 'Full cream pasteurised homogenised rich milk.' },
  { name: 'Mother Dairy Curd', cat: 'Dairy, Bread & Eggs', pack: '400 g', mrp: 40, off: 0, stock: 15, brand: 'Mother Dairy', unit: 'g', desc: 'Thick creamy natural dahi made from toned milk.' },
  { name: 'Amul Paneer', cat: 'Dairy, Bread & Eggs', pack: '200 g', mrp: 90, off: 5, stock: 12, brand: 'Amul', unit: 'g', desc: 'Fresh soft and creamy malai paneer block.' },
  { name: 'Pepsi', cat: 'Cold Drinks & Juices', pack: '750 ml', mrp: 40, off: 10, stock: 20, brand: 'Pepsi', unit: 'ml', desc: 'Refreshing bold fizzy carbonated cola.' },
  { name: 'Fanta', cat: 'Cold Drinks & Juices', pack: '750 ml', mrp: 40, off: 5, stock: 18, brand: 'Fanta', unit: 'ml', desc: 'Vibrant orangey fizzy soda beverage.' },
  { name: 'Maaza Mango Drink', cat: 'Cold Drinks & Juices', pack: '600 ml', mrp: 40, off: 0, stock: 22, brand: 'Maaza', unit: 'ml', desc: 'Real Alphonso mango pulp juicy treat.' },
  { name: 'Lay\'s Magic Masala', cat: 'Chips, Namkeen & Snacks', pack: '52 g', mrp: 20, off: 10, stock: 35, brand: 'Lay\'s', unit: 'g', desc: 'Spicy Indian tomato and chili wavy potato chips.' },
  { name: 'Uncle Chipps Spicy Treat', cat: 'Chips, Namkeen & Snacks', pack: '55 g', mrp: 20, off: 5, stock: 30, brand: 'Uncle Chipps', unit: 'g', desc: 'Traditional desi spiced rippled potato chips.' },
  { name: 'Pringles Original', cat: 'Chips, Namkeen & Snacks', pack: '107 g', mrp: 99, off: 0, stock: 10, brand: 'Pringles', unit: 'g', desc: 'Signature stackable salted potato crisps can.' },
  { name: 'Haldiram Moong Dal', cat: 'Chips, Namkeen & Snacks', pack: '200 g', mrp: 55, off: 5, stock: 14, brand: 'Haldiram\'s', unit: 'g', desc: 'Salted crunchy roasted yellow split lentils.' },
  { name: 'Britannia Marie Gold', cat: 'Biscuits & Bakery', pack: '250 g', mrp: 35, off: 0, stock: 20, brand: 'Britannia', unit: 'g', desc: 'Light and crisp tea-time essential wheat biscuits.' },
  { name: 'Sunfeast Dark Fantasy', cat: 'Biscuits & Bakery', pack: '300 g', mrp: 90, off: 5, stock: 12, brand: 'Sunfeast', unit: 'g', desc: 'Crispy chocolate cookie with molten choco crème filling.' },
  { name: 'Hide & Seek', cat: 'Biscuits & Bakery', pack: '120 g', mrp: 35, off: 0, stock: 16, brand: 'Parle', unit: 'g', desc: 'Crunchy chocolate chip cookies.' },
  { name: 'Maggi Masala Noodles', cat: 'Instant Food & Breakfast', pack: '4 pack', mrp: 56, off: 5, stock: 25, brand: 'Maggi', unit: 'pack', desc: 'Delicious quick noodles with aromatic tastemaker.' },
  { name: 'Knorr Tomato Soup', cat: 'Instant Food & Breakfast', pack: 'sachet pack', mrp: 55, off: 0, stock: 10, brand: 'Knorr', unit: 'pack', desc: 'Creamy sweet and tangy thick tomato soup.' },
  { name: 'Rin Detergent Powder', cat: 'Cleaning & Household', pack: '1 kg', mrp: 105, off: 5, stock: 12, brand: 'Rin', unit: 'kg', desc: 'Bright clean detergent with deep yellow stain buster.' },
  { name: 'Harpic Power Plus', cat: 'Cleaning & Household', pack: '500 ml', mrp: 105, off: 0, stock: 10, brand: 'Harpic', unit: 'ml', desc: 'Disinfectant toilet bowl liquid cleaner.' },
  { name: 'Dove Beauty Bathing Bar', cat: 'Personal Care', pack: '100 g', mrp: 60, off: 5, stock: 15, brand: 'Dove', unit: 'g', desc: 'Gentle moisture care bar with 1/4th hydrating cream.' },
];

// Additional 75 products for Shop 1
const SHOP_01_NEW_75 = [
  // 1. Fruits & Vegetables (7 items)
  { name: 'Fresh Hybrid Tomato', cat: 'Fruits & Vegetables', pack: '1 kg', mrp: 40, off: 10, stock: 25, brand: 'Farm Fresh', unit: 'kg', desc: 'Juicy firm red hybrid tomatoes for daily cooking.' },
  { name: 'Fresh Red Onion', cat: 'Fruits & Vegetables', pack: '1 kg', mrp: 35, off: 0, stock: 30, brand: 'Farm Fresh', unit: 'kg', desc: 'Crisp, pungent red onions directly from Nashik farms.' },
  { name: 'Fresh Potato (Jyoti)', cat: 'Fruits & Vegetables', pack: '1 kg', mrp: 28, off: 0, stock: 40, brand: 'Farm Fresh', unit: 'kg', desc: 'Versatile smooth skin medium sized cooking potatoes.' },
  { name: 'Fresh Ginger (Adrak)', cat: 'Fruits & Vegetables', pack: '250 g', mrp: 35, off: 0, stock: 15, brand: 'Farm Fresh', unit: 'g', desc: 'Fresh spicy aromatic ginger root for tea and curries.' },
  { name: 'Green Chilli (Hari Mirch)', cat: 'Fruits & Vegetables', pack: '100 g', mrp: 15, off: 0, stock: 20, brand: 'Farm Fresh', unit: 'g', desc: 'Spicy fresh hot green chillies.' },
  { name: 'Robusta Banana', cat: 'Fruits & Vegetables', pack: '6 pcs', mrp: 45, off: 5, stock: 18, brand: 'Farm Fresh', unit: 'piece', desc: 'Sweet, energy-dense wholesome fresh bananas.' },
  { name: 'Royal Gala Apple', cat: 'Fruits & Vegetables', pack: '4 pcs', mrp: 160, off: 15, stock: 12, brand: 'Farm Fresh', unit: 'piece', desc: 'Crisp sweet imported red gala apples pack.' },

  // 2. Dairy, Bread & Eggs (5 items)
  { name: 'Harvest Gold White Bread', cat: 'Dairy, Bread & Eggs', pack: '400 g', mrp: 45, off: 0, stock: 25, brand: 'Harvest Gold', unit: 'g', desc: 'Soft and freshly baked classic sandwich bread.' },
  { name: 'English Oven Brown Bread', cat: 'Dairy, Bread & Eggs', pack: '400 g', mrp: 55, off: 5, stock: 18, brand: 'English Oven', unit: 'g', desc: '100% whole wheat nutrient-rich soft brown bread.' },
  { name: 'Farm Fresh White Eggs', cat: 'Dairy, Bread & Eggs', pack: '6 pcs', mrp: 54, off: 0, stock: 30, brand: 'Eggoz', unit: 'pack', desc: 'Protein-packed farm fresh vegetarian feed white eggs.' },
  { name: 'Amul Masti Dahi', cat: 'Dairy, Bread & Eggs', pack: '400 g', mrp: 35, off: 0, stock: 20, brand: 'Amul', unit: 'g', desc: 'Pasteurised thick smooth creamy traditional curd.' },
  { name: 'Amul Fresh Cream', cat: 'Dairy, Bread & Eggs', pack: '250 ml', mrp: 70, off: 5, stock: 14, brand: 'Amul', unit: 'ml', desc: 'Rich low fat sterilised fresh cream for desserts and gravies.' },

  // 3. Cold Drinks & Juices (5 items)
  { name: 'Limca Lemon Drink', cat: 'Cold Drinks & Juices', pack: '750 ml', mrp: 40, off: 10, stock: 20, brand: 'Limca', unit: 'ml', desc: 'Zesty sparkling lime and lemony refreshing cooler.' },
  { name: 'Frooti Mango Drink', cat: 'Cold Drinks & Juices', pack: '1 L', mrp: 70, off: 15, stock: 16, brand: 'Frooti', unit: 'litre', desc: 'Iconic sweet juicy mango drink made with real mangoes.' },
  { name: 'Real Fruit Power Mixed Fruit Juice', cat: 'Cold Drinks & Juices', pack: '1 L', mrp: 130, off: 20, stock: 14, brand: 'Real', unit: 'litre', desc: 'Rich blend of 9 fruits with no added preservatives.' },
  { name: 'Mountain Dew', cat: 'Cold Drinks & Juices', pack: '750 ml', mrp: 40, off: 5, stock: 22, brand: 'Mountain Dew', unit: 'ml', desc: 'High energy citrus charged soft beverage.' },
  { name: 'Bisleri Mineral Water', cat: 'Cold Drinks & Juices', pack: '1 L', mrp: 20, off: 0, stock: 50, brand: 'Bisleri', unit: 'litre', desc: 'Packaged drinking water with added essential minerals.' },

  // 4. Chips, Namkeen & Snacks (5 items)
  { name: 'Lay\'s American Style Cream & Onion', cat: 'Chips, Namkeen & Snacks', pack: '50 g', mrp: 20, off: 10, stock: 35, brand: 'Lay\'s', unit: 'g', desc: 'Flavourful sour cream and herb seasoned potato crisps.' },
  { name: 'Doritos Cheese Supreme', cat: 'Chips, Namkeen & Snacks', pack: '60 g', mrp: 30, off: 15, stock: 20, brand: 'Doritos', unit: 'g', desc: 'Crunchy triangular corn tortilla nachos.' },
  { name: 'Haldiram Khatta Meetha', cat: 'Chips, Namkeen & Snacks', pack: '200 g', mrp: 55, off: 5, stock: 18, brand: 'Haldiram\'s', unit: 'g', desc: 'Sweet and sour golden mixture of sev, peas and flaked rice.' },
  { name: 'Bikaji Bikaneri Bhujia', cat: 'Chips, Namkeen & Snacks', pack: '200 g', mrp: 60, off: 5, stock: 20, brand: 'Bikaji', unit: 'g', desc: 'Original crispy spicy moth dal Bikaneri sev.' },
  { name: 'Act II Golden Sizzle Butter Popcorn', cat: 'Chips, Namkeen & Snacks', pack: '70 g', mrp: 35, off: 0, stock: 25, brand: 'Act II', unit: 'g', desc: 'Instant hot ready to pop butter popcorn.' },

  // 5. Chocolates & Sweets (5 items)
  { name: 'Cadbury Dairy Milk Silk', cat: 'Chocolates & Sweets', pack: '60 g', mrp: 85, off: 10, stock: 25, brand: 'Cadbury', unit: 'g', desc: 'Irresistibly smooth and creamy chocolate melt.' },
  { name: 'Nestle KitKat 4 Finger', cat: 'Chocolates & Sweets', pack: '38 g', mrp: 30, off: 5, stock: 30, brand: 'Nestle', unit: 'g', desc: 'Crispy wafer fingers covered with milk chocolate.' },
  { name: 'Cadbury 5 Star', cat: 'Chocolates & Sweets', pack: '40 g', mrp: 20, off: 0, stock: 40, brand: 'Cadbury', unit: 'g', desc: 'Chewy caramel and nougat core covered in milk chocolate.' },
  { name: 'Snickers Peanut Chocolate Bar', cat: 'Chocolates & Sweets', pack: '45 g', mrp: 50, off: 15, stock: 20, brand: 'Snickers', unit: 'g', desc: 'Caramel, nougat and roasted peanuts hunger bar.' },
  { name: 'Ferrero Rocher Hazelnut Chocolates', cat: 'Chocolates & Sweets', pack: '4 pcs', mrp: 165, off: 10, stock: 12, brand: 'Ferrero Rocher', unit: 'box', desc: 'Crispy hazelnut and milk chocolate pralines.' },

  // 6. Biscuits & Bakery (5 items)
  { name: 'Britannia Bourbon', cat: 'Biscuits & Bakery', pack: '150 g', mrp: 35, off: 10, stock: 25, brand: 'Britannia', unit: 'g', desc: 'Chocolate cream sandwiched between crunchy sugar-dusted biscuits.' },
  { name: 'Parle Monaco Salted', cat: 'Biscuits & Bakery', pack: '200 g', mrp: 35, off: 5, stock: 28, brand: 'Parle', unit: 'g', desc: 'Crisp and savoury light salted snacking biscuits.' },
  { name: 'Parle Krackjack', cat: 'Biscuits & Bakery', pack: '200 g', mrp: 40, off: 0, stock: 22, brand: 'Parle', unit: 'g', desc: 'Iconic sweet and salty balance crackers.' },
  { name: 'Britannia Milk Bikis', cat: 'Biscuits & Bakery', pack: '180 g', mrp: 35, off: 5, stock: 20, brand: 'Britannia', unit: 'g', desc: 'Goodness of milk biscuits packed with calcium and vitamin D.' },
  { name: 'Britannia Treat Choco Chip Cake', cat: 'Biscuits & Bakery', pack: '120 g', mrp: 45, off: 10, stock: 16, brand: 'Britannia', unit: 'g', desc: 'Soft and spongy tea time cake with real choco chips.' },

  // 7. Atta, Rice & Dal (5 items)
  { name: 'Tata Sampann Chana Dal', cat: 'Atta, Rice & Dal', pack: '1 kg', mrp: 110, off: 5, stock: 18, brand: 'Tata Sampann', unit: 'kg', desc: 'Split bengal gram with high dietary fiber and protein.' },
  { name: 'Rajma Chitra (Red Kidney Beans)', cat: 'Atta, Rice & Dal', pack: '1 kg', mrp: 160, off: 10, stock: 15, brand: 'Tata Sampann', unit: 'kg', desc: 'Soft-cooking Himalayan chitra rajma for authentic curry.' },
  { name: 'Kabuli Chana (White Chickpeas)', cat: 'Atta, Rice & Dal', pack: '1 kg', mrp: 165, off: 5, stock: 14, brand: 'Tata Sampann', unit: 'kg', desc: 'Premium jumbo sized chickpeas for chhole bhature.' },
  { name: 'Tata Sampann Besan', cat: 'Atta, Rice & Dal', pack: '500 g', mrp: 65, off: 0, stock: 20, brand: 'Tata Sampann', unit: 'g', desc: '100% chana dal flour with natural aroma.' },
  { name: 'Roasted Poha (Thick Flakes)', cat: 'Atta, Rice & Dal', pack: '500 g', mrp: 45, off: 0, stock: 25, brand: 'Fortune', unit: 'g', desc: 'Clean thick rice flakes for nutritious breakfast poha.' },

  // 8. Oil, Ghee & Masala (6 items)
  { name: 'Fortune Mustard Oil (Kachi Ghani)', cat: 'Oil, Ghee & Masala', pack: '1 L', mrp: 155, off: 10, stock: 20, brand: 'Fortune', unit: 'litre', desc: 'Cold pressed strong pungency pure mustard cooking oil.' },
  { name: 'Tata Salt Vacuum Evaporated', cat: 'Oil, Ghee & Masala', pack: '1 kg', mrp: 28, off: 0, stock: 50, brand: 'Tata Salt', unit: 'kg', desc: 'Desh ka namak, iodised vacuum evaporated table salt.' },
  { name: 'Everest Garam Masala', cat: 'Oil, Ghee & Masala', pack: '100 g', mrp: 85, off: 5, stock: 25, brand: 'Everest', unit: 'g', desc: 'Signature blend of 13 roasted spices for royal aroma.' },
  { name: 'MDH Deggi Mirch', cat: 'Oil, Ghee & Masala', pack: '100 g', mrp: 90, off: 5, stock: 20, brand: 'MDH', unit: 'g', desc: 'Natural rich red colour Indian Kashmiri chili powder.' },
  { name: 'Catch Turmeric Powder (Haldi)', cat: 'Oil, Ghee & Masala', pack: '200 g', mrp: 65, off: 0, stock: 24, brand: 'Catch', unit: 'g', desc: 'Pure high curcumin turmeric powder ground with cryogenic tech.' },
  { name: 'Catch Coriander Powder (Dhaniya)', cat: 'Oil, Ghee & Masala', pack: '200 g', mrp: 60, off: 0, stock: 20, brand: 'Catch', unit: 'g', desc: 'Aromatic green coriander powder for authentic Indian gravies.' },

  // 9. Instant Food & Breakfast (5 items)
  { name: 'Kellogg\'s Corn Flakes Original', cat: 'Instant Food & Breakfast', pack: '475 g', mrp: 215, off: 15, stock: 15, brand: 'Kellogg\'s', unit: 'g', desc: 'Crispy golden toasted corn flakes rich in iron and B-vitamins.' },
  { name: 'Quaker Rolled Oats', cat: 'Instant Food & Breakfast', pack: '1 kg', mrp: 195, off: 10, stock: 18, brand: 'Quaker', unit: 'kg', desc: '100% whole grain natural oats for active lifestyle heart health.' },
  { name: 'MTR Ready Upma Mix', cat: 'Instant Food & Breakfast', pack: '500 g', mrp: 110, off: 5, stock: 14, brand: 'MTR', unit: 'g', desc: 'Traditional South Indian semolina breakfast mix, ready in 3 minutes.' },
  { name: 'Ching\'s Secret Hakka Noodles', cat: 'Instant Food & Breakfast', pack: '150 g', mrp: 35, off: 0, stock: 25, brand: 'Ching\'s Secret', unit: 'g', desc: 'Non-sticky authentic Chinese style eggless hakka noodles.' },
  { name: 'Knorr Sweet Corn Veg Soup', cat: 'Instant Food & Breakfast', pack: '43 g', mrp: 45, off: 0, stock: 20, brand: 'Knorr', unit: 'pack', desc: 'Restaurant style warm and comforting sweet corn vegetable soup.' },

  // 10. Tea & Coffee (5 items)
  { name: 'Tata Tea Gold', cat: 'Tea & Coffee', pack: '500 g', mrp: 310, off: 10, stock: 20, brand: 'Tata Tea', unit: 'g', desc: 'Assam CTC tea with gently rolled long leaves for superior aroma.' },
  { name: 'Red Label Tea', cat: 'Tea & Coffee', pack: '500 g', mrp: 275, off: 5, stock: 22, brand: 'Brooke Bond', unit: 'g', desc: 'Swad apnepan ka - rich taste and healthy flavonoids.' },
  { name: 'Nescafe Classic Instant Coffee', cat: 'Tea & Coffee', pack: '100 g', mrp: 330, off: 15, stock: 16, brand: 'Nescafe', unit: 'g', desc: '100% pure roasted robusta coffee granules in glass jar.' },
  { name: 'Bru Instant Coffee', cat: 'Tea & Coffee', pack: '100 g', mrp: 210, off: 10, stock: 18, brand: 'Bru', unit: 'g', desc: 'Fine blend of 70% coffee and 30% chicory.' },
  { name: 'Wagh Bakri Premium Leaf Tea', cat: 'Tea & Coffee', pack: '500 g', mrp: 290, off: 5, stock: 15, brand: 'Wagh Bakri', unit: 'g', desc: 'Strong liquor and authentic Gujarati kadak chai.' },

  // 11. Personal Care (5 items)
  { name: 'Dettol Original Liquid Handwash', cat: 'Personal Care', pack: '200 ml', mrp: 99, off: 15, stock: 22, brand: 'Dettol', unit: 'ml', desc: 'Antibacterial liquid soap with pine fragrance for germ defence.' },
  { name: 'Dettol Bathing Soap (Pack of 3)', cat: 'Personal Care', pack: '375 g', mrp: 140, off: 10, stock: 18, brand: 'Dettol', unit: 'pack', desc: 'Trusted germ protection soap bars for healthy family.' },
  { name: 'Head & Shoulders Cool Menthol Shampoo', cat: 'Personal Care', pack: '180 ml', mrp: 180, off: 10, stock: 14, brand: 'Head & Shoulders', unit: 'ml', desc: 'Dandruff control anti-itch cooling menthol formula.' },
  { name: 'Clinic Plus Strong & Long Shampoo', cat: 'Personal Care', pack: '340 ml', mrp: 195, off: 5, stock: 16, brand: 'Clinic Plus', unit: 'ml', desc: 'Milk protein formula for healthy strong roots.' },
  { name: 'Nivea Soft Moisturizing Cream', cat: 'Personal Care', pack: '100 ml', mrp: 185, off: 15, stock: 12, brand: 'Nivea', unit: 'ml', desc: 'Light non-greasy daily moisturizer with jojoba oil and Vitamin E.' },

  // 12. Cleaning & Household (5 items)
  { name: 'Ariel Matic Front Load Detergent', cat: 'Cleaning & Household', pack: '1 kg', mrp: 260, off: 10, stock: 15, brand: 'Ariel', unit: 'kg', desc: 'Tough stain removal in 1 wash inside washing machine.' },
  { name: 'Lizol Disinfectant Floor Cleaner (Citrus)', cat: 'Cleaning & Household', pack: '500 ml', mrp: 110, off: 5, stock: 20, brand: 'Lizol', unit: 'ml', desc: 'Kills 99.9% germs, leaves long-lasting fresh citrus aroma.' },
  { name: 'Colin Glass and Surface Cleaner', cat: 'Cleaning & Household', pack: '500 ml', mrp: 105, off: 0, stock: 18, brand: 'Colin', unit: 'ml', desc: 'Shine boosters for streak-free mirrors and windows.' },
  { name: 'Pril Lime Dishwash Liquid Gel', cat: 'Cleaning & Household', pack: '425 ml', mrp: 120, off: 10, stock: 20, brand: 'Pril', unit: 'ml', desc: 'Active power molecules degrease oily cookware instantly.' },
  { name: 'Good Knight Gold Flash Liquid Mosquito Refill', cat: 'Cleaning & Household', pack: '45 ml', mrp: 85, off: 0, stock: 25, brand: 'Good Knight', unit: 'pack', desc: 'Dual mode mosquito repellant liquid vaporiser refill.' },

  // 13. Baby Care (4 items)
  { name: 'Pampers All Round Protection Diapers (M)', cat: 'Baby Care', pack: '34 pcs', mrp: 549, off: 15, stock: 10, brand: 'Pampers', unit: 'pack', desc: 'Ultra absorb magic gel anti-rash baby pant diapers.' },
  { name: 'Johnson\'s Baby No More Tears Shampoo', cat: 'Baby Care', pack: '200 ml', mrp: 195, off: 10, stock: 12, brand: 'Johnson\'s Baby', unit: 'ml', desc: 'Mild gentle cleansing shampoo safe for baby eyes.' },
  { name: 'Himalaya Baby Massage Oil', cat: 'Baby Care', pack: '200 ml', mrp: 175, off: 5, stock: 15, brand: 'Himalaya', unit: 'ml', desc: 'Enriched with olive oil and winter cherry for baby skin nourishment.' },
  { name: 'Nestle Cerelac Wheat Apple Baby Cereal', cat: 'Baby Care', pack: '300 g', mrp: 275, off: 0, stock: 14, brand: 'Nestle', unit: 'g', desc: 'Iron fortified complimentary food for babies from 6 months.' },

  // 14. Frozen & Ready-to-Eat (4 items)
  { name: 'McCain French Fries', cat: 'Frozen & Ready-to-Eat', pack: '420 g', mrp: 140, off: 15, stock: 12, brand: 'McCain', unit: 'g', desc: 'Crispy golden potato french fries, ready to fry or bake in 3 mins.' },
  { name: 'McCain Smiles Crispy Mashed Potato', cat: 'Frozen & Ready-to-Eat', pack: '375 g', mrp: 135, off: 10, stock: 14, brand: 'McCain', unit: 'g', desc: 'Fun smiling shaped seasoned potato snacks for kids.' },
  { name: 'Kawan Flaky Malabar Paratha', cat: 'Frozen & Ready-to-Eat', pack: '400 g', mrp: 120, off: 5, stock: 10, brand: 'Kawan', unit: 'g', desc: 'Multi-layered authentic flaky Kerala paratha (5 pcs).' },
  { name: 'ITC Master Chef Aloo Tikki', cat: 'Frozen & Ready-to-Eat', pack: '400 g', mrp: 125, off: 10, stock: 8, brand: 'ITC Master Chef', unit: 'g', desc: 'Desi spiced crispy street style aloo tikkis.' },

  // 15. Pooja & Daily Essentials (4 items)
  { name: 'Cycle Pure Agarbatti (Yagna)', cat: 'Pooja & Daily Essentials', pack: '100 sticks', mrp: 75, off: 0, stock: 25, brand: 'Cycle', unit: 'pack', desc: 'Natural herbal fragrant incense sticks for morning prayer.' },
  { name: 'Mangaldeep Sandal Dhoop Cones', cat: 'Pooja & Daily Essentials', pack: '20 pcs', mrp: 45, off: 0, stock: 20, brand: 'Mangaldeep', unit: 'pack', desc: 'Pure chandan soothing aroma dhoop cones with burner holder.' },
  { name: 'Bhimseni Pure Camphor (Karpur)', cat: 'Pooja & Daily Essentials', pack: '100 g', mrp: 120, off: 10, stock: 18, brand: 'CamPure', unit: 'g', desc: 'Organic 100% pure bhimseni kapoor for daily havan and aarti.' },
  { name: 'Cotton Pooja Phool Batti Wicks', cat: 'Pooja & Daily Essentials', pack: '100 pcs', mrp: 35, off: 0, stock: 30, brand: 'Pooja Diya', unit: 'pack', desc: 'Pure cotton round flower wicks for oil and ghee diyas.' },
];

// Additional 75 products for Shop 2
const SHOP_02_NEW_75 = [
  // 1. Fruits & Vegetables (7 items)
  { name: 'Fresh Green Capsicum (Shimla Mirch)', cat: 'Fruits & Vegetables', pack: '500 g', mrp: 45, off: 10, stock: 18, brand: 'Farm Fresh', unit: 'g', desc: 'Crunchy sweet green bell peppers for pizza and stir-fries.' },
  { name: 'Fresh Garlic (Lahsun)', cat: 'Fruits & Vegetables', pack: '250 g', mrp: 60, off: 5, stock: 15, brand: 'Farm Fresh', unit: 'g', desc: 'Dry white garlic cloves with intense pungent flavour.' },
  { name: 'Desi Cucumber (Kheera)', cat: 'Fruits & Vegetables', pack: '500 g', mrp: 30, off: 0, stock: 20, brand: 'Farm Fresh', unit: 'g', desc: 'Crispy hydrating fresh salad cucumbers.' },
  { name: 'Fresh Cauliflower (Gobhi)', cat: 'Fruits & Vegetables', pack: '1 pc', mrp: 40, off: 0, stock: 16, brand: 'Farm Fresh', unit: 'piece', desc: 'Tight white head farm fresh cauliflower.' },
  { name: 'Juicy Yellow Lemon (Nimbu)', cat: 'Fruits & Vegetables', pack: '4 pcs', mrp: 25, off: 0, stock: 30, brand: 'Farm Fresh', unit: 'piece', desc: 'Fresh sour thin-skinned juicy lemons.' },
  { name: 'Nagpur Fresh Oranges', cat: 'Fruits & Vegetables', pack: '1 kg', mrp: 95, off: 10, stock: 14, brand: 'Farm Fresh', unit: 'kg', desc: 'Sweet and tangy vitamin C rich citrus oranges.' },
  { name: 'Fresh Green Apple', cat: 'Fruits & Vegetables', pack: '4 pcs', mrp: 180, off: 15, stock: 10, brand: 'Farm Fresh', unit: 'piece', desc: 'Crisp tart imported granny smith green apples.' },

  // 2. Dairy, Bread & Eggs (5 items)
  { name: 'Harvest Gold 100% Atta Bread', cat: 'Dairy, Bread & Eggs', pack: '450 g', mrp: 55, off: 5, stock: 20, brand: 'Harvest Gold', unit: 'g', desc: 'Wholesome brown bread made completely with whole wheat atta.' },
  { name: 'Nutriden Organic Farm Brown Eggs', cat: 'Dairy, Bread & Eggs', pack: '6 pcs', mrp: 75, off: 10, stock: 16, brand: 'Nutriden', unit: 'pack', desc: 'Grain fed brown shell protein rich farm eggs.' },
  { name: 'Mother Dairy Cow Milk (Pouch)', cat: 'Dairy, Bread & Eggs', pack: '500 ml', mrp: 28, off: 0, stock: 35, brand: 'Mother Dairy', unit: 'ml', desc: 'Naturally sweet pure cow milk with healthy beta carotene.' },
  { name: 'Amul Malai Paneer Cubes (Frozen)', cat: 'Dairy, Bread & Eggs', pack: '200 g', mrp: 95, off: 5, stock: 14, brand: 'Amul', unit: 'g', desc: 'Ready to cook soft diced cottage cheese cubes.' },
  { name: 'Epigamia Greek Yogurt (Blueberry)', cat: 'Dairy, Bread & Eggs', pack: '90 g', mrp: 50, off: 0, stock: 18, brand: 'Epigamia', unit: 'g', desc: 'High protein smooth Greek yogurt infused with real blueberries.' },

  // 3. Cold Drinks & Juices (5 items)
  { name: 'Diet Coke Sugar Free', cat: 'Cold Drinks & Juices', pack: '300 ml', mrp: 40, off: 5, stock: 20, brand: 'Coca-Cola', unit: 'ml', desc: 'Zero calorie classic crisp cola taste in sleek can.' },
  { name: 'Tropicana 100% Orange Juice', cat: 'Cold Drinks & Juices', pack: '1 L', mrp: 145, off: 20, stock: 12, brand: 'Tropicana', unit: 'litre', desc: 'No added sugar pure squeezed Florida orange juice.' },
  { name: 'Appy Fizz Sparkling Apple Juice', cat: 'Cold Drinks & Juices', pack: '600 ml', mrp: 38, off: 10, stock: 25, brand: 'Parle Agro', unit: 'ml', desc: 'Bubbly sweet fizzy apple drink with punchy kick.' },
  { name: 'Red Bull Energy Drink', cat: 'Cold Drinks & Juices', pack: '250 ml', mrp: 125, off: 10, stock: 15, brand: 'Red Bull', unit: 'ml', desc: 'Vitalises body and mind with caffeine, taurine and B-vitamins.' },
  { name: 'Kinley Club Soda Extra Punch', cat: 'Cold Drinks & Juices', pack: '750 ml', mrp: 20, off: 0, stock: 30, brand: 'Kinley', unit: 'ml', desc: 'Crisp effervescent carbonated water mixer.' },

  // 4. Chips, Namkeen & Snacks (5 items)
  { name: 'Kurkure Solid Masti Twisteez', cat: 'Chips, Namkeen & Snacks', pack: '85 g', mrp: 20, off: 5, stock: 28, brand: 'Kurkure', unit: 'g', desc: 'Teekha meetha spicy spiral crunchy snacks.' },
  { name: 'Lay\'s India\'s Magic Masala Big Pack', cat: 'Chips, Namkeen & Snacks', pack: '115 g', mrp: 50, off: 15, stock: 20, brand: 'Lay\'s', unit: 'g', desc: 'Share pack of mouthwatering spicy Indian ripples.' },
  { name: 'Haldiram Navrattan Mixture', cat: 'Chips, Namkeen & Snacks', pack: '200 g', mrp: 55, off: 5, stock: 18, brand: 'Haldiram\'s', unit: 'g', desc: 'Crunchy blend of nine savory pulses and spicy sev.' },
  { name: 'Pringles Sour Cream & Onion', cat: 'Chips, Namkeen & Snacks', pack: '107 g', mrp: 105, off: 5, stock: 12, brand: 'Pringles', unit: 'g', desc: 'Delectable savoury cream and herb stackable crisps.' },
  { name: 'Haldiram Salted Roasted Peanuts', cat: 'Chips, Namkeen & Snacks', pack: '150 g', mrp: 40, off: 0, stock: 25, brand: 'Haldiram\'s', unit: 'g', desc: 'Crunchy golden salted moongphali snack.' },

  // 5. Chocolates & Sweets (5 items)
  { name: 'Cadbury Dairy Milk Fruit & Nut', cat: 'Chocolates & Sweets', pack: '80 g', mrp: 95, off: 10, stock: 22, brand: 'Cadbury', unit: 'g', desc: 'Rich milk chocolate with whole raisins and crunchy almonds.' },
  { name: 'Cadbury Bournville 50% Dark', cat: 'Chocolates & Sweets', pack: '80 g', mrp: 110, off: 15, stock: 16, brand: 'Cadbury', unit: 'g', desc: 'Rich intense dark chocolate with cocoa butter.' },
  { name: 'Nestle Munch Crunchy Wafer Bar', cat: 'Chocolates & Sweets', pack: '32 g', mrp: 20, off: 0, stock: 40, brand: 'Nestle', unit: 'g', desc: 'Super crisp wafer layer coated in smooth chocolate.' },
  { name: 'Amul Dark Chocolate (55% Cocoa)', cat: 'Chocolates & Sweets', pack: '150 g', mrp: 110, off: 10, stock: 14, brand: 'Amul', unit: 'g', desc: 'Exquisite bitter-sweet rich Indian dark chocolate bar.' },
  { name: 'Kinder Joy Chocolate Egg', cat: 'Chocolates & Sweets', pack: '20 g', mrp: 50, off: 0, stock: 30, brand: 'Kinder', unit: 'piece', desc: 'Crispy wafer balls in cocoa cream with surprise toy.' },

  // 6. Biscuits & Bakery (5 items)
  { name: 'Britannia NutriChoice Digestive', cat: 'Biscuits & Bakery', pack: '250 g', mrp: 65, off: 10, stock: 22, brand: 'Britannia', unit: 'g', desc: 'High fiber whole wheat digestive biscuits with zero trans fat.' },
  { name: 'Sunfeast Bounce Choco Creme', cat: 'Biscuits & Bakery', pack: '100 g', mrp: 20, off: 0, stock: 35, brand: 'Sunfeast', unit: 'g', desc: 'Crunchy chocolate biscuits filled with chocolate cream.' },
  { name: 'Parle Hide & Seek Caffe Mocha', cat: 'Biscuits & Bakery', pack: '120 g', mrp: 40, off: 5, stock: 18, brand: 'Parle', unit: 'g', desc: 'Dark coffee infused rich chocolate chip cookies.' },
  { name: 'Britannia Little Hearts', cat: 'Biscuits & Bakery', pack: '75 g', mrp: 25, off: 0, stock: 30, brand: 'Britannia', unit: 'g', desc: 'Sweet and crispy sugar glazed golden heart biscuits.' },
  { name: 'Cadbury Chocobakes Choc Layered Cake', cat: 'Biscuits & Bakery', pack: '126 g', mrp: 60, off: 10, stock: 15, brand: 'Cadbury', unit: 'g', desc: 'Soft chocolate sponge layered with rich Cadbury cream.' },

  // 7. Atta, Rice & Dal (5 items)
  { name: 'Aashirvaad Select Sharbati Atta', cat: 'Atta, Rice & Dal', pack: '5 kg', mrp: 315, off: 10, stock: 15, brand: 'Aashirvaad', unit: 'kg', desc: '100% Sharbati wheat grains from Sehore for rotis.' },
  { name: 'Tata Sampann Moong Dal Chilka', cat: 'Atta, Rice & Dal', pack: '1 kg', mrp: 145, off: 5, stock: 16, brand: 'Tata Sampann', unit: 'kg', desc: 'Split green gram with skin for healthy khichdi and dal.' },
  { name: 'Tata Sampann Urad Dal White (Dhuli)', cat: 'Atta, Rice & Dal', pack: '1 kg', mrp: 170, off: 5, stock: 14, brand: 'Tata Sampann', unit: 'kg', desc: 'Clean unpolished split black gram for idli and dosa batter.' },
  { name: 'Fortune Biryani Special Basmati Rice', cat: 'Atta, Rice & Dal', pack: '1 kg', mrp: 185, off: 15, stock: 16, brand: 'Fortune', unit: 'kg', desc: 'Extra long grain fluffy basmati for royal dum biryani.' },
  { name: 'Rajdhani Sooji / Rawa', cat: 'Atta, Rice & Dal', pack: '500 g', mrp: 38, off: 0, stock: 24, brand: 'Rajdhani', unit: 'g', desc: 'Clean granular semolina for crispy halwa, upma and dosas.' },

  // 8. Oil, Ghee & Masala (6 items)
  { name: 'Dhara Kachi Ghani Mustard Oil', cat: 'Oil, Ghee & Masala', pack: '1 L', mrp: 150, off: 5, stock: 20, brand: 'Dhara', unit: 'litre', desc: 'Traditional cold pressed mustard oil for authentic flavour.' },
  { name: 'Gemini Pure Refined Sunflower Oil', cat: 'Oil, Ghee & Masala', pack: '1 L', mrp: 140, off: 5, stock: 18, brand: 'Gemini', unit: 'litre', desc: 'Fortified with Vitamin A & D for heart-healthy cooking.' },
  { name: 'Catch Red Chilli Powder (Lal Mirch)', cat: 'Oil, Ghee & Masala', pack: '200 g', mrp: 85, off: 0, stock: 20, brand: 'Catch', unit: 'g', desc: 'Fiery hot ground red pepper powder.' },
  { name: 'MDH Chana Masala', cat: 'Oil, Ghee & Masala', pack: '100 g', mrp: 88, off: 5, stock: 25, brand: 'MDH', unit: 'g', desc: 'Signature Amritsari chhole seasoning spice blend.' },
  { name: 'Everest Meat / Chicken Masala', cat: 'Oil, Ghee & Masala', pack: '100 g', mrp: 92, off: 5, stock: 18, brand: 'Everest', unit: 'g', desc: 'Fragrant aromatic roasted masala for curry dishes.' },
  { name: 'Catch Black Pepper Sprinkler (Kali Mirch)', cat: 'Oil, Ghee & Masala', pack: '100 g', mrp: 99, off: 10, stock: 15, brand: 'Catch', unit: 'g', desc: 'Coarsely ground Malabar black pepper in tabletop sprinkler.' },

  // 9. Instant Food & Breakfast (5 items)
  { name: 'Maggi 2-Minute Special Masala Noodles', cat: 'Instant Food & Breakfast', pack: '70 g', mrp: 18, off: 0, stock: 35, brand: 'Maggi', unit: 'g', desc: 'Crafted with 20 spices and herbs for special taste.' },
  { name: 'Top Ramen Curry Noodles (Flat Noodles)', cat: 'Instant Food & Breakfast', pack: '280 g', mrp: 55, off: 5, stock: 20, brand: 'Nissin', unit: 'g', desc: 'Saucy curry noodles with unique saucy broth.' },
  { name: 'Kellogg\'s Chocos Moons & Stars', cat: 'Instant Food & Breakfast', pack: '375 g', mrp: 190, off: 10, stock: 16, brand: 'Kellogg\'s', unit: 'g', desc: 'Chocolaty crunchy cereal shapes with goodness of whole wheat.' },
  { name: 'Saffola Masala Oats (Classic Masala)', cat: 'Instant Food & Breakfast', pack: '500 g', mrp: 185, off: 15, stock: 18, brand: 'Saffola', unit: 'g', desc: 'Warm comforting savoury oats with veggies and desi spices.' },
  { name: 'Knorr Chinese Sweet Corn Chicken Soup', cat: 'Instant Food & Breakfast', pack: '42 g', mrp: 50, off: 0, stock: 15, brand: 'Knorr', unit: 'pack', desc: 'Tangy peppery chicken broth with sweet corn kernels.' },

  // 10. Tea & Coffee (5 items)
  { name: 'Brooke Bond Taj Mahal Tea', cat: 'Tea & Coffee', pack: '500 g', mrp: 380, off: 15, stock: 14, brand: 'Brooke Bond', unit: 'g', desc: 'Finest handpicked orange pekoe tea leaves for connoisseurs.' },
  { name: 'Tata Tea Premium Desh Ki Chai', cat: 'Tea & Coffee', pack: '500 g', mrp: 260, off: 5, stock: 25, brand: 'Tata Tea', unit: 'g', desc: 'Unique blend of badi patti and choti patti.' },
  { name: 'Continental Xtra Coffee', cat: 'Tea & Coffee', pack: '100 g', mrp: 195, off: 10, stock: 16, brand: 'Continental', unit: 'g', desc: 'Strong aromatic south Indian coffee chicory blend.' },
  { name: 'Girnar Instant Masala Chai Premix', cat: 'Tea & Coffee', pack: '10 sachets', mrp: 150, off: 5, stock: 20, brand: 'Girnar', unit: 'pack', desc: 'Just add hot water - infused with ginger, cardamom, clove.' },
  { name: 'Lipton Pure Green Tea (Bags)', cat: 'Tea & Coffee', pack: '25 bags', mrp: 160, off: 15, stock: 18, brand: 'Lipton', unit: 'box', desc: 'Refreshing zero calorie soothing green tea with antioxidants.' },

  // 11. Personal Care (5 items)
  { name: 'Lifebuoy Total Germ Protection Soap (4-Pack)', cat: 'Personal Care', pack: '4x125 g', mrp: 135, off: 10, stock: 20, brand: 'Lifebuoy', unit: 'pack', desc: 'Silver shield formula for 100% stronger germ defence.' },
  { name: 'Pantene Pro-V Hairfall Control Shampoo', cat: 'Personal Care', pack: '180 ml', mrp: 170, off: 10, stock: 15, brand: 'Pantene', unit: 'ml', desc: 'Pro-vitamin nutrient rich formula reduces hair fall.' },
  { name: 'Pepsodent 2-in-1 Germicheck Toothpaste', cat: 'Personal Care', pack: '150 g', mrp: 85, off: 5, stock: 22, brand: 'Pepsodent', unit: 'g', desc: 'Anti-germ formula fights bacteria for 12 hours.' },
  { name: 'Gillette Classic Shaving Foam', cat: 'Personal Care', pack: '200 ml', mrp: 180, off: 15, stock: 14, brand: 'Gillette', unit: 'ml', desc: 'Extra thick rich creamy lather for smooth comfortable glide.' },
  { name: 'Vaseline Total Moisture Body Lotion', cat: 'Personal Care', pack: '200 ml', mrp: 195, off: 15, stock: 16, brand: 'Vaseline', unit: 'ml', desc: 'Pure oat extract with micro-droplets of Vaseline jelly.' },

  // 12. Cleaning & Household (5 items)
  { name: 'Tide Plus Double Power Detergent', cat: 'Cleaning & Household', pack: '1 kg', mrp: 115, off: 5, stock: 25, brand: 'Tide', unit: 'kg', desc: 'Jasmine and rose fragrance with extra bright wash power.' },
  { name: 'Vim Dishwash Gel Bottle (Lemon)', cat: 'Cleaning & Household', pack: '500 ml', mrp: 125, off: 10, stock: 20, brand: 'Vim', unit: 'ml', desc: 'One spoon cleans an entire sink of oily greasy utensils.' },
  { name: 'Domex Disinfectant Bleach Toilet Cleaner', cat: 'Cleaning & Household', pack: '500 ml', mrp: 99, off: 5, stock: 18, brand: 'Domex', unit: 'ml', desc: 'Ultra thick bleach eliminates stains and toilet germs.' },
  { name: 'Odonil Bathroom Air Freshener Block (Lavender)', cat: 'Cleaning & Household', pack: '50 g', mrp: 55, off: 0, stock: 30, brand: 'Odonil', unit: 'g', desc: 'Special odour neutralising formula keeps bathroom fresh for 30 days.' },
  { name: 'Scotch-Brite Heavy Duty Sponge Scrub', cat: 'Cleaning & Household', pack: '3 pcs', mrp: 75, off: 0, stock: 24, brand: 'Scotch-Brite', unit: 'pack', desc: 'Non-scratch thick green scouring pad with yellow cellulose sponge.' },

  // 13. Baby Care (4 items)
  { name: 'MamyPoko Pants Standard Diapers (L)', cat: 'Baby Care', pack: '30 pcs', mrp: 499, off: 15, stock: 12, brand: 'MamyPoko', unit: 'pack', desc: 'All night criss-cross absorbent sheet prevents leakage.' },
  { name: 'Himalaya Gentle Baby Soap', cat: 'Baby Care', pack: '75 g', mrp: 55, off: 0, stock: 25, brand: 'Himalaya', unit: 'g', desc: 'Infused with olive oil and almond oil for delicate newborn skin.' },
  { name: 'Johnson\'s Baby Powder with Natural Cornstarch', cat: 'Baby Care', pack: '200 g', mrp: 175, off: 10, stock: 15, brand: 'Johnson\'s Baby', unit: 'g', desc: 'Absorbs moisture gently to keep baby skin dry and comfortable.' },
  { name: 'Pampers Fresh Clean Baby Wipes', cat: 'Baby Care', pack: '72 wipes', mrp: 160, off: 10, stock: 18, brand: 'Pampers', unit: 'pack', desc: 'Alcohol-free gentle water based wipes for soft baby skin.' },

  // 14. Frozen & Ready-to-Eat (4 items)
  { name: 'McCain Veggie Burger Patty', cat: 'Frozen & Ready-to-Eat', pack: '360 g', mrp: 155, off: 10, stock: 10, brand: 'McCain', unit: 'g', desc: 'Crispy vegetable patties (6 pcs) with peas and carrots.' },
  { name: 'Amul Frozen Green Peas (Matar)', cat: 'Frozen & Ready-to-Eat', pack: '500 g', mrp: 90, off: 5, stock: 20, brand: 'Amul', unit: 'g', desc: 'Individual quick frozen fresh tender green sweet peas.' },
  { name: 'Sumeru Malabar Flaky Paratha', cat: 'Frozen & Ready-to-Eat', pack: '400 g', mrp: 110, off: 5, stock: 12, brand: 'Sumeru', unit: 'g', desc: 'Authentic handmade flaky south Indian flatbread.' },
  { name: 'Godrej Yummiez Chicken Nuggets', cat: 'Frozen & Ready-to-Eat', pack: '250 g', mrp: 165, off: 15, stock: 8, brand: 'Godrej Yummiez', unit: 'g', desc: 'Juicy golden crumb coated tender chicken bites.' },

  // 15. Pooja & Daily Essentials (4 items)
  { name: 'Mangaldeep Rose Agarbatti', cat: 'Pooja & Daily Essentials', pack: '80 sticks', mrp: 65, off: 0, stock: 22, brand: 'Mangaldeep', unit: 'pack', desc: 'Devotional soothing fresh rose petals aroma.' },
  { name: 'Cycle Sandalum Incense Sticks', cat: 'Pooja & Daily Essentials', pack: '100 sticks', mrp: 85, off: 5, stock: 20, brand: 'Cycle', unit: 'pack', desc: 'Pure Mysore sandalwood oil scented agarbatti.' },
  { name: 'Pooja Til Oil for Diya (Sesame)', cat: 'Pooja & Daily Essentials', pack: '500 ml', mrp: 115, off: 0, stock: 15, brand: 'Om Pooja', unit: 'ml', desc: 'Pure auspicious gingelly sesame oil for temple and home lamps.' },
  { name: 'Brass Diya Traditional Akhand Deep', cat: 'Pooja & Daily Essentials', pack: '1 pc', mrp: 145, off: 10, stock: 12, brand: 'Om Craft', unit: 'piece', desc: 'Handcrafted solid brass oil diya with glass chimney.' },
];

// Helper to format 100 products for a shop
function compileShopProducts(shopId, shopName, rawList) {
  const now = Date.now();
  return rawList.map((p, idx) => {
    const num = String(idx + 1).padStart(3, '0');
    const productId = `${shopId}_P${num}`;
    const mrp = p.mrp;
    const discountPercent = p.off || 0;
    const sellingPrice = getPrice(mrp, discountPercent);
    const stockQuantity = p.stock !== undefined ? p.stock : 15;
    const isAvailable = stockQuantity > 0;
    const imageUrl = CAT_IMG[p.cat] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=500&q=80';

    return {
      id: productId,
      productId,
      shopId,
      shopName,
      vendorId: shopId === 'SHOP_01' ? 'demo-vendor-1' : 'demo-vendor-2',
      name: p.name,
      productName: p.name,
      category: p.cat,
      brand: p.brand || 'Generic',
      description: p.desc || `${p.name} - high quality ${p.cat} item.`,
      quantityOrPack: p.pack,
      mrp,
      discountPercent,
      sellingPrice,
      price: sellingPrice,
      stockQuantity,
      stock: stockQuantity,
      availableStock: stockQuantity,
      unit: p.unit || 'piece',
      imageUrl,
      isAvailable,
      isDemoData: true,
      availabilityStatus: isAvailable ? 'in_stock' : 'out_of_stock',
      createdAt: 1700000000000 + idx * 60000,
      updatedAt: now,
    };
  });
}

const shop1Raw = [...SHOP_01_PDF_25, ...SHOP_01_NEW_75];
const shop2Raw = [...SHOP_02_PDF_25, ...SHOP_02_NEW_75];

console.log(`Shop 1 total raw count: ${shop1Raw.length}`);
console.log(`Shop 2 total raw count: ${shop2Raw.length}`);

const shop1Compiled = compileShopProducts('SHOP_01', 'Apna Kirana', shop1Raw);
const shop2Compiled = compileShopProducts('SHOP_02', 'Shri Krishna Kirana', shop2Raw);

// Verify exact 100 counts
if (shop1Compiled.length !== 100 || shop2Compiled.length !== 100) {
  console.error(`Error: Counts not 100! Shop 1: ${shop1Compiled.length}, Shop 2: ${shop2Compiled.length}`);
  process.exit(1);
}

// Verify no duplicate IDs
const allIds = new Set();
for (const p of [...shop1Compiled, ...shop2Compiled]) {
  if (allIds.has(p.productId)) {
    console.error(`Duplicate ID found: ${p.productId}`);
    process.exit(1);
  }
  allIds.add(p.productId);
}

console.log(`Verified: Total ${allIds.size} unique products created.`);

// Generate the TypeScript file src/data/productData.ts
const tsContent = `// Auto-generated 200 Blinkit-Style Quick Commerce Product Dataset
// 100 products for SHOP_01 (Apna Kirana) + 100 products for SHOP_02 (Shri Krishna Kirana)
import type { Product } from '../types';

export const SHOP_01_PRODUCTS: Product[] = ${JSON.stringify(shop1Compiled, null, 2)};

export const SHOP_02_PRODUCTS: Product[] = ${JSON.stringify(shop2Compiled, null, 2)};

export const ALL_DEMO_PRODUCTS: Product[] = [
  ...SHOP_01_PRODUCTS,
  ...SHOP_02_PRODUCTS,
];

export function getDemoProductsForShop(shopId: string): Product[] {
  if (shopId === 'SHOP_01' || shopId === 'apnabazaar-kirana-1') {
    return SHOP_01_PRODUCTS;
  }
  if (shopId === 'SHOP_02' || shopId === 'apnabazaar-kirana-2') {
    return SHOP_02_PRODUCTS;
  }
  return [];
}
`;

const outputPath = resolve('src/data/productData.ts');
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, tsContent, 'utf8');
console.log(`Successfully wrote 200 products to ${outputPath}`);
