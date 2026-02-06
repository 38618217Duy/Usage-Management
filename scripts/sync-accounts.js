#!/usr/bin/env node
/**
 * Script đồng bộ email accounts từ Cursor dashboard
 * 
 * Sử dụng:
 *   node scripts/sync-accounts.js              # Kiểm tra và cập nhật tất cả accounts
 *   node scripts/sync-accounts.js --dry-run    # Chỉ kiểm tra, không cập nhật
 *   node scripts/sync-accounts.js --id <id>    # Đồng bộ một account cụ thể
 * 
 * Có thể chạy định kỳ với Task Scheduler (Windows) hoặc cron (Linux/Mac)
 */

import { AccountSyncService } from '../src/services/account-sync.service.js';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const idIndex = args.indexOf('--id');
const accountId = idIndex !== -1 ? args[idIndex + 1] : null;

async function main() {
  console.log('='.repeat(60));
  console.log('Account Email Sync Tool');
  console.log('='.repeat(60));
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes will be made)' : 'LIVE (will update accounts.json)'}`);
  console.log(`Time: ${new Date().toISOString()}`);
  console.log('='.repeat(60));
  console.log('');

  try {
    if (accountId) {
      // Sync single account
      console.log(`Syncing account: ${accountId}`);
      console.log('-'.repeat(40));
      
      const result = await AccountSyncService.syncAccount(accountId, { dryRun });
      
      if (result.error === 'ACCOUNT_NOT_FOUND') {
        console.error(`❌ Account not found: ${accountId}`);
        process.exit(1);
      }

      console.log(`Current email: ${result.currentEmail}`);
      console.log(`Actual email:  ${result.actualEmail || 'N/A'}`);
      
      if (result.error) {
        console.log(`Status: ❌ Error - ${result.error}`);
      } else if (result.updated) {
        console.log(`Status: ✅ Updated`);
      } else if (result.needsUpdate) {
        console.log(`Status: ⚠️ Needs update (dry run)`);
      } else {
        console.log(`Status: ✅ In sync`);
      }
    } else {
      // Sync all accounts
      console.log('Syncing all accounts...');
      console.log('-'.repeat(40));
      
      const result = await AccountSyncService.syncAllAccounts({ dryRun });
      
      console.log('');
      console.log('Results:');
      console.log('-'.repeat(40));
      
      for (const r of result.results) {
        const status = r.error 
          ? `❌ ${r.error}` 
          : r.updated 
            ? '✅ Updated' 
            : r.needsUpdate 
              ? '⚠️ Needs update' 
              : '✅ In sync';
        
        console.log(`${r.currentEmail}`);
        if (r.actualEmail && r.actualEmail !== r.currentEmail.toLowerCase()) {
          console.log(`  → ${r.actualEmail}`);
        }
        console.log(`  Status: ${status}`);
        console.log('');
      }

      console.log('='.repeat(60));
      console.log('Summary:');
      console.log(`  Total accounts:  ${result.total}`);
      console.log(`  Checked:         ${result.checked}`);
      console.log(`  Updated:         ${result.updated}`);
      console.log(`  Errors:          ${result.errors}`);
      console.log('='.repeat(60));
    }

    console.log('');
    console.log('Done!');
    process.exit(0);
  } catch (err) {
    console.error('Fatal error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

main();
