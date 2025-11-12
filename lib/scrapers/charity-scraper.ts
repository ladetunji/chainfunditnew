import * as cheerio from 'cheerio';
import { db } from '@/lib/db';
import { charities, type NewCharity } from '@/lib/schema/charities';
import { eq } from 'drizzle-orm';

// Base interface for scraped charity data
export interface ScrapedCharityData {
  name: string;
  description?: string;
  mission?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  registrationNumber?: string;
  category?: string;
  focusAreas?: string[];
  logo?: string;
  sourceUrl: string;
}

// Abstract base class for charity scrapers
export abstract class CharityDirectoryScraper {
  abstract name: string;
  abstract baseUrl: string;

  /**
   * Fetch HTML content from a URL
   */
  protected async fetchPage(url: string): Promise<string> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.text();
    } catch (error) {
      console.error(`Error fetching ${url}:`, error);
      throw error;
    }
  }

  /**
   * Parse charity data from HTML - to be implemented by subclasses
   */
  abstract parseCharityData($: cheerio.CheerioAPI, url: string): ScrapedCharityData[];

  /**
   * Get list of URLs to scrape - to be implemented by subclasses
   */
  abstract getUrlsToScrape(): Promise<string[]>;

  /**
   * Scrape charities from this directory
   */
  async scrape(): Promise<ScrapedCharityData[]> {
    const urls = await this.getUrlsToScrape();
    const allCharities: ScrapedCharityData[] = [];

    for (const url of urls) {
      try {
        const html = await this.fetchPage(url);
        const $ = cheerio.load(html);
        const charities = this.parseCharityData($, url);
        allCharities.push(...charities);
        
        // Be respectful - add delay between requests
        await this.delay(1000 + Math.random() * 1000);
      } catch (error) {
        console.error(`Error scraping ${url}:`, error);
      }
    }

    return allCharities;
  }

  /**
   * Delay helper
   */
  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate slug from name
   */
  protected generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Save scraped data to database
   */
  async saveToDatabase(charitiesData: ScrapedCharityData[]): Promise<void> {
    for (const charityData of charitiesData) {
      try {
        const slug = this.generateSlug(charityData.name);
        
        // Check if charity already exists
        const existing = await db.query.charities.findFirst({
          where: eq(charities.slug, slug)
        });

        const charityRecord: NewCharity = {
          name: charityData.name,
          slug,
          description: charityData.description,
          mission: charityData.mission,
          email: charityData.email,
          phone: charityData.phone,
          website: charityData.website,
          address: charityData.address,
          city: charityData.city,
          state: charityData.state,
          country: charityData.country,
          postalCode: charityData.postalCode,
          registrationNumber: charityData.registrationNumber,
          category: charityData.category,
          focusAreas: charityData.focusAreas,
          logo: charityData.logo,
          sourceUrl: charityData.sourceUrl,
          scrapedAt: new Date(),
          isVerified: false, // Manual verification required
        };

        if (existing) {
          // Update existing charity
          await db.update(charities)
            .set({
              ...charityRecord,
              updatedAt: new Date(),
            })
            .where(eq(charities.id, existing.id));
          
        } else {
          // Insert new charity
          await db.insert(charities).values(charityRecord);
        }
      } catch (error) {
        console.error(`Error saving charity ${charityData.name}:`, error);
      }
    }
  }
}

// Example scraper for CharityNavigator.org
export class CharityNavigatorScraper extends CharityDirectoryScraper {
  name = 'Charity Navigator';
  baseUrl = 'https://www.charitynavigator.org';

  async getUrlsToScrape(): Promise<string[]> {
    // Example: scrape top rated charities
    // You would need to implement pagination and category browsing
    return [
      `${this.baseUrl}/index.cfm?bay=search.results&cgid=1&cuid=43`, // Arts category
      `${this.baseUrl}/index.cfm?bay=search.results&cgid=2&cuid=43`, // Education
      // Add more categories as needed
    ];
  }

  parseCharityData($: cheerio.CheerioAPI, url: string): ScrapedCharityData[] {
    const charities: ScrapedCharityData[] = [];

    // This is a placeholder - actual selectors depend on website structure
    $('.charity-card').each((_, element) => {
      const $el = $(element);
      
      const charity: ScrapedCharityData = {
        name: $el.find('.charity-name').text().trim(),
        description: $el.find('.charity-description').text().trim(),
        website: $el.find('.charity-website').attr('href'),
        category: $el.find('.charity-category').text().trim(),
        sourceUrl: url,
      };

      if (charity.name) {
        charities.push(charity);
      }
    });

    return charities;
  }
}

// Example scraper for GuideStar/Candid
export class GuideStarScraper extends CharityDirectoryScraper {
  name = 'GuideStar';
  baseUrl = 'https://www.guidestar.org';

  async getUrlsToScrape(): Promise<string[]> {
    // Implement URL generation for GuideStar
    return [];
  }

  parseCharityData($: cheerio.CheerioAPI, url: string): ScrapedCharityData[] {
    const charities: ScrapedCharityData[] = [];
    // Implement parsing logic for GuideStar
    return charities;
  }
}

// Generic scraper that can be configured
export class GenericCharityScraper extends CharityDirectoryScraper {
  name: string;
  baseUrl: string;
  private urls: string[];
  private selectors: {
    container: string;
    name: string;
    description?: string;
    email?: string;
    phone?: string;
    website?: string;
    category?: string;
  };

  constructor(config: {
    name: string;
    baseUrl: string;
    urls: string[];
    selectors: {
      container: string;
      name: string;
      description?: string;
      email?: string;
      phone?: string;
      website?: string;
      category?: string;
    };
  }) {
    super();
    this.name = config.name;
    this.baseUrl = config.baseUrl;
    this.urls = config.urls;
    this.selectors = config.selectors;
  }

  async getUrlsToScrape(): Promise<string[]> {
    return this.urls;
  }

  parseCharityData($: cheerio.CheerioAPI, url: string): ScrapedCharityData[] {
    const charities: ScrapedCharityData[] = [];

    $(this.selectors.container).each((_, element) => {
      const $el = $(element);
      
      const charity: ScrapedCharityData = {
        name: $el.find(this.selectors.name).text().trim(),
        description: this.selectors.description 
          ? $el.find(this.selectors.description).text().trim() 
          : undefined,
        email: this.selectors.email 
          ? $el.find(this.selectors.email).text().trim() 
          : undefined,
        phone: this.selectors.phone 
          ? $el.find(this.selectors.phone).text().trim() 
          : undefined,
        website: this.selectors.website 
          ? $el.find(this.selectors.website).attr('href') 
          : undefined,
        category: this.selectors.category 
          ? $el.find(this.selectors.category).text().trim() 
          : undefined,
        sourceUrl: url,
      };

      if (charity.name) {
        charities.push(charity);
      }
    });

    return charities;
  }
}

// Factory to run all scrapers
export class CharityScraperFactory {
  private scrapers: CharityDirectoryScraper[] = [];

  addScraper(scraper: CharityDirectoryScraper) {
    this.scrapers.push(scraper);
  }

  async runAll(): Promise<ScrapedCharityData[]> {
    const allCharities: ScrapedCharityData[] = [];

    for (const scraper of this.scrapers) {
      try {
        const charities = await scraper.scrape();
        allCharities.push(...charities);
      } catch (error) {
        console.error(`Error running ${scraper.name} scraper:`, error);
      }
    }

    return allCharities;
  }

  async scrapeAndSave(): Promise<void> {
    const charities = await this.runAll();
    
    if (charities.length > 0) {
      
      // Use first scraper's save method (they all use the same database)
      if (this.scrapers.length > 0) {
        await this.scrapers[0].saveToDatabase(charities);
      }
    } else {
    }
  }
}

// Export a convenience function to run scrapers
export async function scrapeCharities(scrapers?: CharityDirectoryScraper[]) {
  const factory = new CharityScraperFactory();

  if (scrapers && scrapers.length > 0) {
    scrapers.forEach(scraper => factory.addScraper(scraper));
  } else {
    // Default scrapers
    factory.addScraper(new CharityNavigatorScraper());
    // Add more default scrapers as needed
  }

  await factory.scrapeAndSave();
}

