import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const downloadDir = path.join(ROOT_DIR, 'download');
const cursorDownloadDir = path.join(ROOT_DIR, 'download', 'cursor');
const windsurfDownloadDir = path.join(ROOT_DIR, 'download', 'windsurf');

async function migrateDownloads() {
  console.log('Starting download folder migration...');
  console.log('Download dir:', downloadDir);
  console.log('Cursor download dir:', cursorDownloadDir);
  console.log('Windsurf download dir:', windsurfDownloadDir);

  try {
    await fs.mkdir(cursorDownloadDir, { recursive: true });
    await fs.mkdir(windsurfDownloadDir, { recursive: true });
    console.log('Created cursor and windsurf subdirectories');

    const files = await fs.readdir(downloadDir);
    const csvFiles = files.filter(file => file.endsWith('.csv'));
    
    console.log(`Found ${csvFiles.length} CSV files to migrate`);

    let movedCount = 0;
    for (const file of csvFiles) {
      const sourcePath = path.join(downloadDir, file);
      const destPath = path.join(cursorDownloadDir, file);
      
      const stat = await fs.stat(sourcePath);
      if (stat.isFile()) {
        await fs.rename(sourcePath, destPath);
        console.log(`Moved: ${file} -> cursor/${file}`);
        movedCount++;
      }
    }

    console.log(`\nMigration complete!`);
    console.log(`- Moved ${movedCount} CSV files to download/cursor/`);
    console.log(`- Created download/windsurf/ for future Windsurf exports`);

  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

migrateDownloads();
