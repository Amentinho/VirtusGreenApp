// CO2 comparison data for different ranges (g/100g)
const CO2_COMPARISONS = [
  { min: 0, max: 10, examples: [
    "Sending 50-500 emails with attachments",
    "Charging your phone 1-10 times fully",
    "Boiling a kettle 0.5-5 times",
    "The CO2 from manufacturing the calories you'd burn cycling 2-10 km"
  ]},
  { min: 10, max: 25, examples: [
    "Watching Netflix for 1-2.5 hours",
    "Making 500-1,250 Google searches",
    "The production of 5-12 pages of a typical paperback book",
    "Manufacturing 2-5 standard plastic shopping bags"
  ]},
  { min: 25, max: 50, examples: [
    "Taking a 5-minute hot shower",
    "The delivery motorcycle trip for 1-2 km",
    "About 0.3-0.6% of making one pair of jeans",
    "Printing and delivering 3-6 newspapers"
  ]},
  { min: 50, max: 100, examples: [
    "Manufacturing 1-2 cotton t-shirts (just the fabric)",
    "Using a hairdryer for 20-40 minutes",
    "Brewing, packaging and transporting 1-2 bottles of beer",
    "Manufacturing 5-10 medium cardboard boxes"
  ]},
  { min: 100, max: 200, examples: [
    "Making 10-20 cups of coffee with an espresso machine",
    "One cold water washing cycle",
    "Manufacturing 1-2 glass bottles",
    "Baking 2-4 loaves of bread in a home oven"
  ]},
  { min: 200, max: 350, examples: [
    "Manufacturing about half a cotton t-shirt",
    "About 1.5-2.5% of producing one pair of running shoes",
    "Producing, bottling and transporting 1-1.5 bottles of wine",
    "About 0.3-0.5% of manufacturing a new smartphone"
  ]},
  { min: 350, max: 500, examples: [
    "Running a tumble dryer for one full cycle",
    "Manufacturing 30-40 aluminum drink cans",
    "Heating an average home for 2-3 hours in winter",
    "Using a laptop continuously for 14-20 hours"
  ]},
  { min: 500, max: 750, examples: [
    "Producing and shipping 1-1.5 hardcover books",
    "About 5-7% of producing a wool sweater",
    "The energy used by a cinema for one moviegoer",
    "Manufacturing and freezing 5-7 liters of ice cream"
  ]},
  { min: 750, max: 1000, examples: [
    "Manufacturing one complete cotton t-shirt",
    "The total energy use of a hair salon per customer",
    "About 1-1.3% of manufacturing a mattress",
    "Running a fridge-freezer for 4-5 days"
  ]},
  { min: 1000, max: 1500, examples: [
    "About 1-1.5% of manufacturing a new laptop",
    "The kitchen energy + ingredients for 1-2 restaurant meals",
    "About 7-10% of producing a pair of leather shoes",
    "About 8-12% of one night in an average hotel"
  ]},
  { min: 1500, max: 2000, examples: [
    "About 1.5-2% of producing one pair of jeans (full lifecycle)",
    "Manufacturing a small wooden chair",
    "Energy use of a gym for one person for one month",
    "Manufacturing 15-20 vinyl records"
  ]},
  { min: 2000, max: 3000, examples: [
    "About 15-22% of producing one pair of running shoes",
    "Manufacturing one set of cotton bed sheets",
    "30-45 loads of laundry in a washing machine",
    "The energy footprint of one person working in an office for 2-3 days"
  ]},
  { min: 3000, max: 4000, examples: [
    "About 20-27% of producing a winter parka",
    "Manufacturing a toaster or electric kettle",
    "The total energy for one person to watch 20-25 movies in theaters",
    "Would need to plant 1-2 tree seedlings to offset over their lifetime"
  ]},
  { min: 4000, max: 5000, examples: [
    "About 6-7% of manufacturing a new smartphone",
    "Manufacturing one complete wool sweater",
    "About one night in an average hotel (energy + services)",
    "Manufacturing a small wooden table"
  ]},
  { min: 5000, max: 6500, examples: [
    "About 25-33% of producing a leather jacket",
    "About 10-13% of manufacturing a tablet device",
    "The full impact of 3-5 restaurant meals (including everything)",
    "Manufacturing a set of dumbbells"
  ]},
  { min: 6500, max: 8000, examples: [
    "About 6-7% of one pair of jeans (from cotton field to store)",
    "About half a pair of running shoes (full production)",
    "About 5-7% of manufacturing a new laptop",
    "A medium-sized wooden bookshelf"
  ]},
  { min: 8000, max: 10000, examples: [
    "About 50-65% of producing a down winter jacket",
    "Manufacturing one leather handbag",
    "About 3-4% of manufacturing a 50\" LED TV",
    "Manufacturing 1-1.5 square meters of synthetic carpet"
  ]},
  { min: 10000, max: Infinity, examples: [
    "Manufacturing one complete office chair",
    "About 8-10% of manufacturing a 50\" LED TV",
    "Manufacturing 2-3 square meters of synthetic carpet",
    "About 80-100% of producing a down winter jacket"
  ]}
];

// Simple hash function to create deterministic index from string
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// Helper function to get CO2 comparison based on value (deterministic)
export function getCO2Comparison(co2Value: number, productId?: string): string {
  const range = CO2_COMPARISONS.find(r => co2Value >= r.min && co2Value < r.max);
  if (!range) return "No comparison available";
  
  // Use product ID and CO2 value to create deterministic index
  const seed = productId ? `${productId}-${Math.round(co2Value)}` : String(Math.round(co2Value));
  const index = simpleHash(seed) % range.examples.length;
  
  return range.examples[index];
}
