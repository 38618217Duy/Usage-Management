import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');

export const config = {
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
  },

  paths: {
    root: ROOT_DIR,
    profiles: path.join(ROOT_DIR, 'profiles'),
    download: path.join(ROOT_DIR, 'download'),
    logs: path.join(ROOT_DIR, 'logs'),
    accountsFile: path.join(ROOT_DIR, 'accounts.json'),
  },

  cursor: {
    baseUrl: 'https://cursor.com',
    dashboardUrl: 'https://cursor.com/dashboard',
    usageUrl: 'https://cursor.com/dashboard?tab=usage',
    loginUrl: 'https://cursor.com/login',
  },

  browser: {
    headless: false,
    timeout: 60000,
    navigationTimeout: 60000,
    downloadTimeout: 30000,
    pageLoadTimeout: 45000,
  },

  cdp: {
    endpoint: 'http://localhost:9222',
    defaultPort: 9222,
  },

  selectors: {
    usage: {
      dateRangeDropdown: '[data-testid="date-range-dropdown"], .date-range-selector, button:has-text("Last")',
      last30Days: '[data-testid="last-30-days"], button:has-text("30 days"), [data-value="30"]',
      exportButton: 'button:has-text("Export CSV"), [data-testid="export-csv"], button:has-text("Export"), a:has-text("Export CSV")',
    },
    login: {
      loginForm: 'form[action*="login"], form[method="post"], .login-form',
      emailInput: 'input[type="email"], input[name="email"]',
    },
  },
};

export default config;
