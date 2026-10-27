import sampleDataset from './sample_dataset.json';

export const CATEGORIES = [
  { value: 'entertainment', label: 'Entertainment', icon: 'Film', description: 'Movies, streaming, events' },
  { value: 'food_dining', label: 'Food & Dining', icon: 'Utensils', description: 'Restaurants, cafes, delivery' },
  { value: 'gas_transport', label: 'Gas & Transportation', icon: 'Fuel', description: 'Gas stations, fuel, transit' },
  { value: 'grocery_net', label: 'Online Grocery', icon: 'ShoppingBag', description: 'Online grocery orders' },
  { value: 'grocery_pos', label: 'In-Store Grocery POS', icon: 'Store', description: 'Physical supermarket checkout' },
  { value: 'health_fitness', label: 'Health & Fitness', icon: 'Activity', description: 'Gyms, spas, wellness' },
  { value: 'home', label: 'Home & Living', icon: 'Home', description: 'Furniture, hardware, repairs' },
  { value: 'kids_pets', label: 'Kids & Pets', icon: 'Smile', description: 'Pet supplies, toys, baby care' },
  { value: 'misc_net', label: 'Miscellaneous Online', icon: 'Globe', description: 'E-commerce web transactions' },
  { value: 'misc_pos', label: 'Miscellaneous In-Store', icon: 'CreditCard', description: 'Physical retail points of sale' },
  { value: 'personal_care', label: 'Personal Care', icon: 'Sparkles', description: 'Salons, cosmetics, care' },
  { value: 'shopping_net', label: 'Online Shopping', icon: 'Laptop', description: 'Digital goods and e-commerce' },
  { value: 'shopping_pos', label: 'In-Store Shopping', icon: 'ShoppingBag', description: 'Clothing, department stores' },
  { value: 'travel', label: 'Travel & Lodging', icon: 'Plane', description: 'Flights, hotels, car rentals' }
];

export const PRESETS = [
  {
    id: 'fraud_night_travel',
    title: 'High-Value Midnight Travel Anomaly',
    tag: 'FRAUDULENT PATTERN',
    riskType: 'high',
    description: '$894.25 travel booking at 02:45 AM, 1,480 km away from cardholder home address',
    data: {
      trans_date_trans_time: '2020-06-21 02:45:19',
      cc_num: '3560725013359375',
      merchant: "fraud_Hamill-D'Amore",
      category: 'travel',
      amt: 894.25,
      first: 'Brooke',
      last: 'Smith',
      gender: 'F',
      street: '63542 Luna Brook Apt. 012',
      city: 'Notrees',
      state: 'TX',
      zip: '79759',
      lat: 31.8599,
      long: -102.7413,
      city_pop: 23,
      job: 'Cytogeneticist',
      dob: '1969-09-15',
      trans_num: '16bf2e46c54369a8eab2214649506425',
      unix_time: 1371852399,
      merch_lat: 41.8781,
      merch_long: -87.6298
    }
  },
  {
    id: 'legit_coffee_grocery',
    title: 'Standard Neighborhood Grocery POS',
    tag: 'LEGITIMATE PATTERN',
    riskType: 'low',
    description: '$24.80 supermarket transaction during business hours, 2.4 km from cardholder',
    data: {
      trans_date_trans_time: '2020-06-21 12:14:25',
      cc_num: '2291163933867244',
      merchant: 'fraud_Kirlin and Sons',
      category: 'grocery_pos',
      amt: 24.80,
      first: 'Jeff',
      last: 'Elliott',
      gender: 'M',
      street: '351 Darlene Green',
      city: 'Columbia',
      state: 'SC',
      zip: '29209',
      lat: 33.9659,
      long: -80.9355,
      city_pop: 333497,
      job: 'Mechanical engineer',
      dob: '1968-03-19',
      trans_num: '2da90c7d74bd46a0caf3777415b3ebd3',
      unix_time: 1371816865,
      merch_lat: 33.986391,
      merch_long: -80.960714
    }
  },
  {
    id: 'fraud_online_shopping',
    title: 'Suspicious High-Value Electronics (Online)',
    tag: 'FRAUDULENT PATTERN',
    riskType: 'high',
    description: '$1,249.50 e-commerce order under high-risk merchant category from a small rural account',
    data: {
      trans_date_trans_time: '2020-06-21 23:18:42',
      cc_num: '4173829018471203',
      merchant: 'fraud_Swaniawski, Nitzsche and Welch',
      category: 'shopping_net',
      amt: 1249.50,
      first: 'Ashley',
      last: 'Lopez',
      gender: 'F',
      street: '9333 Valentine Point',
      city: 'Bellmore',
      state: 'NY',
      zip: '11710',
      lat: 40.6729,
      long: -73.5365,
      city_pop: 34496,
      job: 'Librarian, public',
      dob: '1970-10-21',
      trans_num: 'c81755dbbbea9d5c77f094348a7579be',
      unix_time: 1371816893,
      merch_lat: 47.6062,
      merch_long: -122.3321
    }
  },
  {
    id: 'medium_gas_jump',
    title: 'Rapid Location Jump (Gas Station)',
    tag: 'REVIEW RECOMMENDED',
    riskType: 'medium',
    description: '$78.15 fill-up 350 km from primary residence; unusual frequency',
    data: {
      trans_date_trans_time: '2020-06-21 16:45:10',
      cc_num: '3526826139003047',
      merchant: 'fraud_Johnston-Casper',
      category: 'gas_transport',
      amt: 78.15,
      first: 'Nathan',
      last: 'Massey',
      gender: 'M',
      street: '5783 Evan Roads Apt. 465',
      city: 'Falmouth',
      state: 'MI',
      zip: '49632',
      lat: 44.2529,
      long: -85.0170,
      city_pop: 1126,
      job: 'Furniture designer',
      dob: '1955-07-06',
      trans_num: '57ff021bd3f328f8738bb535c302a31b',
      unix_time: 1371816917,
      merch_lat: 41.8781,
      merch_long: -87.6298
    }
  }
];

export const MODEL_METADATA = {
  name: "FraudShield-XGBoost-v2",
  framework: "XGBoost + LightGBM Hybrid",
  dataset: "Credit Card Fraud Dataset (fraudTest.csv)",
  trainedRows: 1296675,
  testRows: 555719,
  metrics: {
    accuracy: 99.86,
    roc_auc: 0.9962,
    precision: 95.4,
    recall: 89.2,
    f1_score: 92.2
  },
  featureImportances: [
    { name: "Transaction Amount (amt)", importance: 34, description: "Raw dollar value and deviation from cardholder historical median" },
    { name: "Distance (Cardholder to Merchant)", importance: 26, description: "Haversine calculated distance in km between geographic coordinates" },
    { name: "Category Risk Weight", importance: 17, description: "Historical fraud incidence by merchant category (shopping_net, misc_net, travel)" },
    { name: "Transaction Hour of Day", importance: 11, description: "Transactions occurring between 22:00 and 04:00 carry elevated risk factor" },
    { name: "City Population", importance: 6, description: "Discrepancy between small rural origin and large metropolitan processing center" },
    { name: "Cardholder Age (Derived)", importance: 4, description: "Calculated from DOB to transaction date" },
    { name: "Day of Week", importance: 2, description: "Weekend vs weekday behavioral distribution" }
  ]
};

export const FEATURE_REGISTRY = [
  { name: 'trans_date_trans_time', type: 'DateTime', sample: '2020-06-21 12:14:25', desc: 'Timestamp of transaction; used to extract hour, day, month, and day-of-week' },
  { name: 'cc_num', type: 'Numeric / Hash', sample: '2291163933867244', desc: 'Credit card number; used for customer profile aggregation & velocity tracking' },
  { name: 'merchant', type: 'String', sample: 'fraud_Kirlin and Sons', desc: 'Merchant establishment name' },
  { name: 'category', type: 'Categorical (14)', sample: 'personal_care', desc: 'Transaction merchant classification code equivalent' },
  { name: 'amt', type: 'Float ($)', sample: '29.84', desc: 'Dollar amount of the purchase' },
  { name: 'first, last', type: 'String', sample: 'Joanne Williams', desc: 'Cardholder full legal name' },
  { name: 'gender', type: 'Categorical (M/F)', sample: 'F', desc: 'Cardholder gender' },
  { name: 'street, city, state, zip', type: 'Address', sample: 'Altonah, UT, 84002', desc: 'Cardholder verified billing location' },
  { name: 'lat, long', type: 'Coordinates', sample: '40.3207, -110.4360', desc: 'Cardholder home GPS coordinates' },
  { name: 'city_pop', type: 'Integer', sample: '302', desc: 'Population of the cardholder residential municipality' },
  { name: 'job', type: 'String', sample: 'Sales professional, IT', desc: 'Cardholder declared occupation' },
  { name: 'dob', type: 'Date', sample: '1990-01-17', desc: 'Cardholder date of birth (used to compute age)' },
  { name: 'trans_num', type: 'UUID / Hash', sample: '324cc204407e99f5...', desc: 'Unique tracking transaction identifier' },
  { name: 'unix_time', type: 'Timestamp', sample: '1371816873', desc: 'POSIX epoch time in seconds' },
  { name: 'merch_lat, merch_long', type: 'Coordinates', sample: '39.4505, -109.9604', desc: 'Merchant point of sale GPS coordinates' },
  { name: 'is_fraud', type: 'Target (0/1)', sample: '0 or 1', desc: 'Ground truth label: 1 = Fraud, 0 = Legitimate' }
];

export { sampleDataset };
