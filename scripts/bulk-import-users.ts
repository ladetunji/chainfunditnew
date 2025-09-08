#!/usr/bin/env tsx

import { db } from '../lib/db';
import { users } from '../lib/schema';
import { eq } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

interface UserData {
  email: string;
  fullName: string;
  avatar?: string;
  phone?: string;
  isVerified?: boolean;
}

function parseCSV(content: string): any[] {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    const row: any = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    rows.push(row);
  }

  return rows;
}

async function bulkImportUsers() {
  console.log('👥 Bulk Importing Users from CSV...\n');

  try {
    // Check if CSV file exists
    const csvPath = path.join(process.cwd(), 'users-data.csv');
    
    if (!fs.existsSync(csvPath)) {
      console.log('❌ CSV file not found!');
      console.log('📋 Please create a file named "users-data.csv" in the project root with the following columns:');
      console.log('   • email (required)');
      console.log('   • fullName (required)');
      console.log('   • avatar (optional)');
      console.log('   • phone (optional)');
      console.log('   • isVerified (optional, true/false)');
      console.log('\n💡 Example CSV format:');
      console.log('email,fullName,avatar,phone,isVerified');
      console.log('"admin@example.com","Admin User","https://example.com/avatar.jpg","+1234567890","true"');
      console.log('"creator@example.com","Campaign Creator","","+0987654321","false"');
      return;
    }

    // Read CSV file
    console.log('📖 Reading CSV file...');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const jsonData = parseCSV(csvContent);

    if (jsonData.length === 0) {
      console.log('❌ No data found in CSV file');
      return;
    }

    console.log(`📋 Found ${jsonData.length} rows of data`);

    // Validate and process each row
    const validUsers: UserData[] = [];
    const errors: string[] = [];

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      const rowNum = i + 2; // +2 because CSV is 1-indexed and we skip header

      try {
        // Validate required fields
        if (!row.email) {
          errors.push(`Row ${rowNum}: Missing email`);
          continue;
        }
        if (!row.fullName) {
          errors.push(`Row ${rowNum}: Missing fullName`);
          continue;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(row.email)) {
          errors.push(`Row ${rowNum}: Invalid email format`);
          continue;
        }

        const userData: UserData = {
          email: row.email.trim().toLowerCase(),
          fullName: row.fullName.trim(),
          avatar: row.avatar?.trim() || undefined,
          phone: row.phone?.trim() || undefined,
          isVerified: row.isVerified ? row.isVerified.toLowerCase() === 'true' : false,
        };

        validUsers.push(userData);
      } catch (error) {
        errors.push(`Row ${rowNum}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Show validation results
    if (errors.length > 0) {
      console.log('\n❌ Validation Errors:');
      errors.forEach(error => console.log(`   ${error}`));
      console.log(`\n📊 ${validUsers.length} valid users found`);
      
      if (validUsers.length === 0) {
        console.log('❌ No valid users to import');
        return;
      }
    }

    // Check for existing users
    console.log('\n🔍 Checking for existing users...');
    const existingEmails = new Set<string>();
    
    for (const userData of validUsers) {
      const existingUser = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.email, userData.email))
        .limit(1);
      
      if (existingUser.length > 0) {
        existingEmails.add(userData.email);
        console.log(`   ⚠️  User already exists: ${userData.email}`);
      }
    }

    // Filter out existing users
    const newUsers = validUsers.filter(user => !existingEmails.has(user.email));
    
    if (newUsers.length === 0) {
      console.log('✅ All users already exist in the database');
      return;
    }

    console.log(`\n📥 Importing ${newUsers.length} new users...`);
    const importedUsers = [];
    const importErrors = [];

    for (const userData of newUsers) {
      try {
        const newUser = await db.insert(users).values({
          email: userData.email,
          fullName: userData.fullName,
          avatar: userData.avatar || null,
          phone: userData.phone || null,
          isVerified: userData.isVerified || false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }).returning();

        importedUsers.push(newUser[0]);
        console.log(`   ✅ Imported: ${userData.fullName} (${userData.email})`);
      } catch (error) {
        const errorMsg = `Failed to import "${userData.fullName}": ${error instanceof Error ? error.message : 'Unknown error'}`;
        importErrors.push(errorMsg);
        console.log(`   ❌ ${errorMsg}`);
      }
    }

    // Summary
    console.log('\n🎉 User Import Complete!');
    console.log(`📊 Summary:`);
    console.log(`   • Total rows processed: ${jsonData.length}`);
    console.log(`   • Valid users: ${validUsers.length}`);
    console.log(`   • Already existed: ${existingEmails.size}`);
    console.log(`   • Successfully imported: ${importedUsers.length}`);
    console.log(`   • Errors: ${errors.length + importErrors.length}`);

    if (importedUsers.length > 0) {
      console.log('\n✅ Successfully imported users:');
      importedUsers.forEach(user => {
        console.log(`   • ${user.fullName} (${user.email})`);
      });
    }

    if (importErrors.length > 0) {
      console.log('\n❌ Import errors:');
      importErrors.forEach(error => console.log(`   ${error}`));
    }

    console.log('\n💡 You can now run the campaign import script!');

  } catch (error) {
    console.error('❌ Bulk import failed:', error);
  } finally {
    process.exit(0);
  }
}

// Run the script
bulkImportUsers();
