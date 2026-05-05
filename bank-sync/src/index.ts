import { createScraper, CompanyTypes, ScraperOptions } from 'israeli-bank-scrapers';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import cron from 'node-cron';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface BankConfig {
  companyId: CompanyTypes;
  credentials: Record<string, string>;
  isActive: boolean;
}

const banks: BankConfig[] = [
  {
    companyId: CompanyTypes.hapoalim,
    credentials: {
      userCode: process.env.HAPOALIM_USER_CODE || '',
      password: process.env.HAPOALIM_PASSWORD || '',
    },
    isActive: !!process.env.HAPOALIM_USER_CODE,
  },
  {
    companyId: CompanyTypes.leumi,
    credentials: {
      username: process.env.LEUMI_USERNAME || '',
      password: process.env.LEUMI_PASSWORD || '',
    },
    isActive: !!process.env.LEUMI_USERNAME,
  },
  {
    companyId: CompanyTypes.discount,
    credentials: {
      id: process.env.DISCOUNT_ID || '',
      password: process.env.DISCOUNT_PASSWORD || '',
      num: process.env.DISCOUNT_NUM || '',
    },
    isActive: !!process.env.DISCOUNT_ID,
  }
];

async function syncBankTransactions() {
  console.log(`[${new Date().toISOString()}] Starting bank synchronization...`);

  // Pull last 30 days of data by default
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  for (const bank of banks) {
    if (!bank.isActive) {
      console.log(`Skipping ${bank.companyId} - Missing credentials.`);
      continue;
    }

    console.log(`Initializing scraper for ${bank.companyId}...`);
    
    try {
      const options: ScraperOptions = {
        companyId: bank.companyId,
        startDate,
        combineInstallments: false,
        showBrowser: false, // Set to true if you need to debug or handle OTPs
      };

      const scraper = createScraper(options);
      console.log(`Attempting login for ${bank.companyId}...`);
      
      const scrapeResult = await scraper.scrape(bank.credentials as any);

      if (scrapeResult.success) {
        console.log(`Successfully scraped ${bank.companyId}. Found ${scrapeResult.accounts?.length || 0} accounts.`);
        
        let totalTransactions = 0;
        const transactionsToInsert = [];

        if (scrapeResult.accounts) {
          for (const account of scrapeResult.accounts) {
            console.log(`Account ${account.accountNumber}: ${account.txns.length} transactions found.`);
            
            for (const txn of account.txns) {
              totalTransactions++;
              
              // We create a unique hash or use reference number to avoid duplicates in Supabase
              // We'll use a combination of date, amount, description and account as a pseudo-ID if reference is missing
              const uniqueId = txn.referenceNumber || `${account.accountNumber}-${txn.date}-${txn.amount}-${txn.description}`;
              
              transactionsToInsert.push({
                external_id: uniqueId,
                account_number: account.accountNumber,
                bank_name: bank.companyId,
                date: new Date(txn.date).toISOString(),
                amount: txn.amount,
                description: txn.description,
                status: txn.status,
                type: txn.type || 'normal',
                memo: txn.memo || null,
                created_at: new Date().toISOString()
              });
            }
          }
        }

        if (transactionsToInsert.length > 0) {
          console.log(`Saving ${transactionsToInsert.length} transactions to Supabase...`);
          
          // Upsert to avoid duplicates (assuming external_id is a unique key in Supabase)
          const { error } = await supabase
            .from('bank_transactions') // Make sure this table exists!
            .upsert(transactionsToInsert, { onConflict: 'external_id' });

          if (error) {
            console.error(`Failed to save transactions for ${bank.companyId} to Supabase:`, error);
          } else {
            console.log(`Successfully saved transactions for ${bank.companyId}.`);
          }
        }
      } else {
        console.error(`Failed to scrape ${bank.companyId}. Error type: ${scrapeResult.errorType}`, scrapeResult.errorMessage);
      }
    } catch (error) {
      console.error(`Unexpected error while scraping ${bank.companyId}:`, error);
    }
  }

  console.log(`[${new Date().toISOString()}] Bank synchronization completed.`);
}

// Check if running directly or via cron
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--run-now')) {
    syncBankTransactions().then(() => process.exit(0));
  } else {
    // Schedule to run every day at 06:00 AM
    console.log("Starting bank-sync scheduler. Will run daily at 06:00 AM.");
    cron.schedule('0 6 * * *', () => {
      syncBankTransactions();
    });
  }
}

export { syncBankTransactions };
