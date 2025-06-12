// Define the available categories
const AVAILABLE_CATEGORIES = [
  'Arts, Crafts & Sewing',
  'Automotive',
  'Books',
  'Electronics',
  'Health & Household',
  'Home & Kitchen',
  'Industrial & Scientific',
  'Miscellaneous',
  'Outdoor & Tactical Gear',
  'Sports & Outdoors',
  'Tools & Home Improvement'
];

// Function to categorize a product using keyword matching
export function categorizeProduct(title: string, description: string): string {
  const text = (title + ' ' + description).toLowerCase();
  
  // Define keyword patterns for each category
  const categoryKeywords: Record<string, string[]> = {
    'Arts, Crafts & Sewing': [
      'craft', 'sewing', 'art', 'paint', 'brush', 'canvas', 'thread', 'needle', 
      'embroidery', 'scrapbook', 'glue', 'scissors', 'fabric', 'yarn', 'knit',
      'crochet', 'drawing', 'sketch', 'marker', 'colored pencil', 'creative'
    ],
    'Automotive': [
      'car', 'auto', 'vehicle', 'truck', 'motorcycle', 'tire', 'engine', 'brake',
      'oil', 'filter', 'battery', 'headlight', 'windshield', 'dashboard',
      'steering', 'transmission', 'exhaust', 'automotive', 'garage'
    ],
    'Books': [
      'book', 'novel', 'reading', 'paperback', 'hardcover', 'kindle', 'ebook',
      'author', 'story', 'fiction', 'non-fiction', 'textbook', 'manual',
      'guide book', 'literature', 'magazine', 'journal'
    ],
    'Electronics': [
      'electronic', 'phone', 'computer', 'laptop', 'tablet', 'camera', 'tv',
      'speaker', 'headphone', 'charger', 'cable', 'usb', 'bluetooth', 'wifi',
      'battery', 'power bank', 'gaming', 'console', 'smart', 'digital',
      'device', 'gadget', 'tech', 'wireless', 'bluetooth'
    ],
    'Health & Household': [
      'health', 'medicine', 'vitamin', 'supplement', 'first aid', 'bandage',
      'thermometer', 'personal care', 'hygiene', 'soap', 'shampoo', 'toothbrush',
      'cleaning', 'detergent', 'disinfectant', 'tissue', 'toilet paper',
      'household', 'laundry', 'vacuum', 'mop', 'wellness', 'fitness'
    ],
    'Home & Kitchen': [
      'kitchen', 'cooking', 'cook', 'baking', 'recipe', 'pot', 'pan', 'knife',
      'cutting board', 'mixer', 'blender', 'microwave', 'oven', 'refrigerator',
      'dishware', 'plate', 'bowl', 'cup', 'utensil', 'spoon', 'fork',
      'home', 'furniture', 'decor', 'lamp', 'pillow', 'curtain', 'rug',
      'storage', 'organization', 'cabinet', 'shelf', 'dining', 'bedroom',
      'living room', 'appliance', 'food', 'meal', 'kitchen gadget'
    ],
    'Industrial & Scientific': [
      'industrial', 'scientific', 'laboratory', 'research', 'testing', 'measurement',
      'instrument', 'chemical', 'safety', 'protective', 'equipment', 'machinery',
      'technical', 'professional', 'commercial', 'manufacturing', 'precision'
    ],
    'Outdoor & Tactical Gear': [
      'outdoor', 'camping', 'hiking', 'backpack', 'tent', 'sleeping bag',
      'tactical', 'military', 'survival', 'emergency', 'flashlight', 'lantern',
      'compass', 'map', 'knife', 'multitool', 'rope', 'paracord', 'hunting',
      'fishing', 'adventure', 'expedition', 'weather', 'waterproof', 'gear'
    ],
    'Sports & Outdoors': [
      'sport', 'exercise', 'fitness', 'gym', 'workout', 'running', 'cycling',
      'swimming', 'basketball', 'football', 'soccer', 'tennis', 'golf',
      'baseball', 'volleyball', 'outdoor', 'recreation', 'activity',
      'equipment', 'athletic', 'training', 'muscle', 'cardio'
    ],
    'Tools & Home Improvement': [
      'tool', 'drill', 'hammer', 'screwdriver', 'wrench', 'saw', 'nail',
      'screw', 'bolt', 'hardware', 'repair', 'fix', 'build', 'construction',
      'improvement', 'renovation', 'maintenance', 'workshop', 'garage',
      'diy', 'project', 'building', 'plumbing', 'electrical', 'painting'
    ]
  };

  let bestCategory = 'Miscellaneous';
  let maxScore = 0;

  // Score each category based on keyword matches
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    let score = 0;
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        score += 1;
        // Give extra weight to matches in the title
        if (title.toLowerCase().includes(keyword)) {
          score += 2;
        }
      }
    }
    
    if (score > maxScore) {
      maxScore = score;
      bestCategory = category;
    }
  }

  return bestCategory;
}

export { AVAILABLE_CATEGORIES }; 