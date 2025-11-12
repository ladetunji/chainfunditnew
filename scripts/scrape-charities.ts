#!/usr/bin/env tsx

import { CharityScraperFactory, GenericCharityScraper } from '@/lib/scrapers/charity-scraper';

/**
 * Script to scrape charity directories
 * Usage: npm run scrape-charities
 */

async function main() {
  const factory = new CharityScraperFactory();
  
  factory.addScraper(new GenericCharityScraper({
    name: 'Sample Charity Directory',
    baseUrl: 'https://example-charity-directory.org',
    urls: [
      'https://example-charity-directory.org/charities/page/1',
    ],
    selectors: {
      container: '.charity-item',
      name: '.charity-name',
      description: '.charity-description',
      website: 'a.website',
      category: '.category',
    }
  }));

  try {
    await factory.scrapeAndSave();
  } catch (error) {
    console.error('\n❌ Error during scraping:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);

