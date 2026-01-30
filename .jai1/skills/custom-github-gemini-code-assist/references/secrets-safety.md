# Secrets & Configuration Safety

> ⚠️ **CRITICAL**: This document covers detection of accidentally committed secrets and suspicious configuration files.

## Common Secret Patterns to Detect

### API Keys & Tokens

| Pattern | Example | Risk Level |
|---------|---------|------------|
| AWS Access Key | `AKIA[0-9A-Z]{16}` | 🔴 CRITICAL |
| AWS Secret Key | `[A-Za-z0-9/+=]{40}` | 🔴 CRITICAL |
| GitHub Token | `ghp_[A-Za-z0-9]{36}` | 🔴 CRITICAL |
| GitHub OAuth | `gho_[A-Za-z0-9]{36}` | 🔴 CRITICAL |
| Stripe Secret | `sk_live_[A-Za-z0-9]{24,}` | 🔴 CRITICAL |
| Stripe Publishable | `pk_live_[A-Za-z0-9]{24,}` | 🟡 HIGH |
| Slack Token | `xox[baprs]-[A-Za-z0-9-]+` | 🔴 CRITICAL |
| Discord Token | `[MN][A-Za-z\d]{23,}\.[\w-]{6}\.[\w-]{27}` | 🔴 CRITICAL |
| Google API Key | `AIza[0-9A-Za-z-_]{35}` | 🔴 CRITICAL |
| Firebase | `AAAA[A-Za-z0-9_-]{7}:[A-Za-z0-9_-]{140}` | 🔴 CRITICAL |
| SendGrid | `SG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}` | 🔴 CRITICAL |
| Twilio | `SK[a-z0-9]{32}` | 🔴 CRITICAL |
| OpenAI | `sk-[A-Za-z0-9]{48}` | 🔴 CRITICAL |
| Anthropic | `sk-ant-[A-Za-z0-9-_]{95}` | 🔴 CRITICAL |

### Database Credentials

```
# ❌ CRITICAL: Database connection strings with credentials
DATABASE_URL=mysql://root:password123@localhost:3306/mydb
MONGODB_URI=mongodb://admin:secret@cluster.mongodb.net/db
REDIS_URL=redis://:mypassword@redis.example.com:6379

# ✅ Safe: Using environment variables (not committed)
DATABASE_URL=${DB_URL}
```

### Private Keys & Certificates

```
# ❌ CRITICAL: Private keys committed to repository
-----BEGIN RSA PRIVATE KEY-----
-----BEGIN OPENSSH PRIVATE KEY-----
-----BEGIN EC PRIVATE KEY-----
-----BEGIN PGP PRIVATE KEY BLOCK-----
-----BEGIN CERTIFICATE-----
```

### Password Patterns

```
# ❌ CRITICAL: Hardcoded passwords
password = "secret123"
PASSWORD=MyP@ssw0rd
DB_PASSWORD=admin123
ADMIN_PASSWORD=password

# ❌ CRITICAL: Common variable names with values
secret = "actual-secret-value"
api_key = "real-api-key"
auth_token = "bearer-token-here"
```

---

## Suspicious Config File Patterns

### Files That Should NEVER Contain Secrets

| File Pattern | Should Contain | Red Flags |
|--------------|----------------|-----------|
| `.env` | Variable names only in `.env.example` | Actual values |
| `config/*.php` | `env('KEY')` calls | Hardcoded strings |
| `*.config.js/ts` | `process.env.KEY` | Hardcoded credentials |
| `docker-compose.yml` | `${VAR}` or `.env` reference | Inline passwords |
| `application.yml` | `${VAR}` placeholders | Hardcoded values |
| `appsettings.json` | Empty/placeholder values | Real credentials |

### PHP/Laravel Config Red Flags

```php
// ❌ CRITICAL: Hardcoded in config files
// config/database.php
return [
    'mysql' => [
        'host' => 'production-db.example.com',
        'username' => 'admin',
        'password' => 'super-secret-password', // RED FLAG!
    ],
];

// ✅ Safe: Using environment variables
return [
    'mysql' => [
        'host' => env('DB_HOST', '127.0.0.1'),
        'username' => env('DB_USERNAME', 'root'),
        'password' => env('DB_PASSWORD', ''),
    ],
];
```

### JavaScript/TypeScript Config Red Flags

```typescript
// ❌ CRITICAL: Hardcoded in config files
// config/database.ts
export default {
  host: 'production-db.example.com',
  password: 'super-secret-password', // RED FLAG!
};

// ✅ Safe: Using environment variables
export default {
  host: process.env.DB_HOST,
  password: process.env.DB_PASSWORD,
};
```

### Docker Compose Red Flags

```yaml
# ❌ CRITICAL: Hardcoded secrets
services:
  db:
    environment:
      MYSQL_ROOT_PASSWORD: super-secret-password  # RED FLAG!
      MYSQL_PASSWORD: my-password-123

# ✅ Safe: Using .env file
services:
  db:
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
```

### Flutter/Dart Config Red Flags

```dart
// ❌ CRITICAL: Hardcoded in Dart files
class ApiConfig {
  static const apiKey = 'sk-live-xxx123';  // RED FLAG!
  static const dbPassword = 'secret123';
}

// ✅ Safe: Using build-time injection
class ApiConfig {
  static const apiKey = String.fromEnvironment('API_KEY');
}
```

---

## Files That Should Be Reviewed Carefully

### High-Risk File Patterns

When these files are modified, **always check for secrets**:

```
# Configuration files
*.env*
*.config.*
**/config/**
**/settings/**
*.ini
*.cfg
*.conf

# Docker/CI files
docker-compose*.yml
Dockerfile*
.github/workflows/**
.gitlab-ci.yml
Jenkinsfile

# Application configs
appsettings*.json
application*.yml
web.config
.npmrc
.pypirc

# Mobile configs
google-services.json
GoogleService-Info.plist
```

### Files That Should NEVER Be Committed

```
# These should be in .gitignore
.env
.env.local
.env.production
*.pem
*.key
*.p12
*.pfx
id_rsa
id_ed25519
credentials.json
serviceAccountKey.json
```

---

## Warning Signs in Pull Requests

### 🔴 CRITICAL - Block Immediately

1. **New .env file checked in** with actual values
2. **Private key files** added to repository
3. **Database connection strings** with passwords
4. **API keys** that match known patterns (AWS, Stripe, etc.)
5. **google-services.json** or **GoogleService-Info.plist** committed

### 🟡 HIGH - Investigate

1. **Config files changed** - check for hardcoded values
2. **.gitignore modified** to remove sensitive patterns
3. **New environment variables** that look like secrets
4. **Base64 encoded strings** (may hide credentials)
5. **URLs with credentials** in path or query string

### Detection Examples

```
# ❌ CRITICAL: URL with embedded credentials
https://user:password@database.example.com/db

# ❌ CRITICAL: Base64 encoded (may hide secrets)
Authorization: Basic dXNlcjpwYXNzd29yZDEyMw==

# ❌ HIGH: Suspicious variable assignment
const secret = "aGVsbG8gd29ybGQ=";  // Base64
const key = "0x4a6f686e446f65";     // Hex encoded
```

---

## Remediation Steps

### If Secrets Are Found in PR

1. **Do NOT merge the PR**
2. Ask developer to:
   - Remove the secret from the code
   - Rotate/regenerate the exposed credential immediately
   - Add the file to `.gitignore` if needed
   - Use environment variables instead

### If Secrets Were Already Committed

1. **Rotate the secret immediately** - assume it's compromised
2. Remove from Git history using `git filter-branch` or BFG Repo-Cleaner
3. Force push to all branches
4. Notify affected team members
5. Check for unauthorized access/usage

---

## Recommended .gitignore Additions

```gitignore
# Environment files
.env
.env.*
!.env.example

# Keys and certificates
*.pem
*.key
*.p12
*.pfx
*.crt

# SSH keys
id_rsa*
id_ed25519*
id_dsa*

# Cloud provider credentials
credentials.json
serviceAccountKey.json
google-services.json
GoogleService-Info.plist

# IDE secrets
.idea/**/dataSources.xml
.vscode/*.json
!.vscode/settings.json
!.vscode/extensions.json

# Local config overrides
*.local
*.local.*
```
