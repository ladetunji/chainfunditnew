const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { donations, users, campaigns } = require('../lib/schema');

// Database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const sql = postgres(connectionString);
const db = drizzle(sql);

async function seedDonations() {
  try {
    
    // Check if we have users and campaigns
    const usersList = await db.select().from(users).limit(5);
    const campaignsList = await db.select().from(campaigns).limit(3);
    
    if (usersList.length === 0) {
      return;
    }
    
    if (campaignsList.length === 0) {
      return;
    }
    
    // Create test donations
    const testDonations = [];
    const currencies = ['USD', 'NGN', 'GBP'];
    const statuses = ['completed', 'pending', 'failed'];
    const paymentMethods = ['stripe', 'paystack'];

    for (let i = 0; i < 20; i++) {
      const randomUser = usersList[Math.floor(Math.random() * usersList.length)];
      const randomCampaign = campaignsList[Math.floor(Math.random() * campaignsList.length)];
      const randomCurrency = currencies[Math.floor(Math.random() * currencies.length)];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      const randomPaymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

      testDonations.push({
        campaignId: randomCampaign.id,
        donorId: randomUser.id,
        amount: (Math.random() * 1000 + 10).toFixed(2),
        currency: randomCurrency,
        paymentStatus: randomStatus,
        paymentMethod: randomPaymentMethod,
        isAnonymous: Math.random() > 0.7,
        message: Math.random() > 0.5 ? `Test donation message ${i + 1}` : null,
      });
    }

    // Insert test donations
    const insertedDonations = await db.insert(donations).values(testDonations).returning();
    

    insertedDonations.slice(0, 3).forEach((donation, index) => {
    });
    
  } catch (error) {
    console.error('❌ Error seeding donations:', error);
  } finally {
    await sql.end();
  }
}

seedDonations();
