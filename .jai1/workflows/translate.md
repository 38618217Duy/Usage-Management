---
description: Professional translation between Vietnamese, Japanese, and English for software development contexts
---

# Translate Workflow

Professional translation service optimized for software development, technical documentation, and product content.

## 🎯 Purpose

This workflow provides high-quality translation with:
- Smart handling of technical terminology
- Context-aware number and currency formatting
- Preservation of code blocks and markdown
- Special rules for Vietnamese, Japanese, and English

## 🌐 Supported Languages

| Code | Language | Special Features |
|------|----------|------------------|
| `vi` | Vietnamese | Converts `k`→`1.000`, `man`→`10.000`, proper number formatting |
| `ja` | Japanese | Handles `万` (man), proper formality levels, kanji numbers |
| `en` | English | American English default, technical term preservation |

## 📋 When to Use

Use this workflow to translate:
- Technical documentation
- README files and guides
- UI/UX text and labels
- API documentation
- Product descriptions
- Business communications
- Error messages and notifications

## 🔄 Workflow Steps

### Step 1: Identify Translation Input

**Ask user for input in one of these ways:**

1. **Direct text**: User pastes text to translate
2. **File path**: User provides path to file
3. **Multiple files**: User provides directory or file pattern

Example prompts:
```
What would you like to translate?

1. Paste text directly
2. Provide file path (e.g., README.md)
3. Translate entire folder (e.g., docs/*.md)
4. Translate from conversation above
```

### Step 2: Determine Languages

**Ask for target language:**
```
Translate to:
1. Vietnamese (vi)
2. Japanese (ja)  
3. English (en)
```

**Auto-detect source language** unless user specifies:
- Tool will detect automatically
- User can override: "from Japanese to Vietnamese"

**Ask for context (optional but recommended):**
```
What type of content is this?

1. Technical documentation
2. UI/Product text
3. Business communication
4. API documentation
5. Marketing content
6. Other: [specify]
```

### Step 3: Extract Content

**If file path provided:**
```bash
# Check file exists
if [ ! -f "path/to/file.md" ]; then
  echo "❌ File not found: path/to/file.md"
  exit 1
fi

# Read file content
cat path/to/file.md
```

**If multiple files:**
```bash
# List files to translate
find docs -name "*.md" -type f

# Confirm with user
echo "Found 5 files. Translate all? (y/n)"
```

**If direct text:**
- Use provided text as-is
- Preserve line breaks and formatting

### Step 4: Call MCP Tool

Use the `translate` MCP tool:

```javascript
{
  "tool": "translate",
  "input": {
    "text": "Lương tôi là 50 man Yên mỗi tháng",
    "target_language": "en",
    "source_language": "auto",
    "context": "salary discussion"
  }
}
```

The tool returns JSON:
```json
{
  "translated_text": "My monthly salary is 500,000 Yen",
  "source_language": "vi",
  "target_language": "en",
  "notes": "Converted 'man' (万) from 50 man = 500,000 Yen"
}
```

### Step 5: Present Results

Display translation with clear formatting:

```
✅ Translation Complete!

📝 Details:
- Source: Vietnamese (vi)
- Target: English (en)
- Context: Salary discussion
- Length: 156 characters

🔄 Translated Text:
---
[Display the translated content]
---

💡 Translation Notes:
- Converted 'man' (万) from 50 man = 500,000 Yen
- Preserved technical term: API
- Maintained markdown formatting
```

### Step 6: Offer Next Actions

Ask user what to do next:

```
What would you like to do?

1. Copy to clipboard
2. Save to file (overwrite original)
3. Save to new file with language suffix
4. Translate another text
5. Done
```

**Option 1: Copy to clipboard**
- Display: "✅ Translation ready to paste!"

**Option 2: Overwrite original**
```bash
# Backup original first
cp path/to/file.md path/to/file.md.bak

# Write translated content
cat > path/to/file.md << 'EOF'
[Translated content]
EOF
```
- Confirm: "✅ File updated (backup: file.md.bak)"

**Option 3: Save with language suffix**
```bash
# If translating README.md to Japanese
cat > README.ja.md << 'EOF'
[Translated content]
EOF
```
- Confirm: "✅ Saved to: README.ja.md"

**Option 4: Translate another**
- Return to Step 1

## 🔍 Special Features

### 1. Vietnamese Number Formatting

**Input Variants:**
- `50k` → `50.000`
- `5tr` → `5.000.000`
- `50 man` → `500.000` (in Japanese context)
- `30 man Yên` → `3.000.000 Yên` or `300.000 円`

**Output Format:**
- Use period (`.`) as thousands separator
- Examples: `50.000`, `1.500.000`

### 2. Japanese Number Formatting

**Input Kanji Numbers:**
- `1万` → `10,000` (to English) or `10.000` (to Vietnamese)
- `100万` → `1,000,000` (to English)
- `5千` → `5,000`

**Output to Japanese:**
- Numbers \u003e 10,000: Use kanji `万`
- Currency: `5万ドル`, `100万円`

### 3. Currency Handling

| From | To | Example |
|------|-----|---------|
| `$50` | Vietnamese | `50 USD` or `50 đô la` |
| `¥5000` | Vietnamese | `5.000 Yên` |
| `₫500.000` | English | `500,000 VND` |
| `$50,000` | Japanese | `5万ドル` |

### 4. Technical Term Preservation

**Always preserved:**
- API, REST, GraphQL, HTTP, JSON, XML
- React, Vue, Angular, Next.js, Node.js
- Database, frontend, backend, DevOps
- Git, Docker, Kubernetes

**Context-dependent:**
- "Token" in auth context → Keep as "token"
- "Token" in blockchain → May translate
- Framework names → Always keep original

### 5. Code Block Preservation

```markdown
Input:
```javascript
const API_URL = "https://api.example.com";
```

Output (all languages):
```javascript
const API_URL = "https://api.example.com";
```
```

Code blocks remain unchanged, only surrounding text is translated.

## 📊 Example Usage Scenarios

### Scenario 1: Translate README to Japanese

**User:** `/translate`

**Agent:**
```
What would you like to translate?
1. Paste text directly
2. Provide file path
...
```

**User:** `README.md`

**Agent:**
```
Translate to:
1. Vietnamese (vi)
2. Japanese (ja)
3. English (en)
```

**User:** `2` (Japanese)

**Agent:**
```
✅ Translation Complete!

📝 Details:
- Source: English (en)
- Target: Japanese (ja)
- File: README.md
- Length: 2,458 characters

🔄 Translated Content:
[Shows first 500 chars preview]
...

What would you like to do?
1. Copy to clipboard
2. Save to file (overwrite)
3. Save to new file (README.ja.md)
...
```

**User:** `3`

**Agent:**
```
✅ Saved to: README.ja.md

File structure:
├── README.md (English - original)
└── README.ja.md (Japanese - new)
```

### Scenario 2: Translate Salary Discussion

**User:** `/translate "Lương tháng của tôi là 30 man, bonus 50k mỗi quý" to English`

**Agent:**
```
✅ Translation Complete!

📝 Details:
- Source: Vietnamese (vi)
- Target: English (en)
- Context: Salary discussion

🔄 Translated Text:
"My monthly salary is 300,000 Yen, with a 50,000 bonus each quarter"

💡 Translation Notes:
- Converted "30 man" to "300,000 Yen" (30万円 = 300,000 Yen)
- Converted "50k" to "50,000" (standard number format)
- Detected Japanese currency context from "man" unit
```

### Scenario 3: Batch Translate Documentation

**User:** `/translate docs/*.md to Vietnamese`

**Agent:**
```
📁 Found 8 markdown files:

1. docs/getting-started.md
2. docs/api-reference.md
3. docs/deployment.md
4. docs/architecture.md
5. docs/contributing.md
6. docs/faq.md
7. docs/troubleshooting.md
8. docs/changelog.md

Translate all to Vietnamese? (y/n)
```

**User:** `y`

**Agent:**
```
🔄 Translating files...

✅ 1/8 getting-started.md → getting-started.vi.md
✅ 2/8 api-reference.md → api-reference.vi.md
✅ 3/8 deployment.md → deployment.vi.md
✅ 4/8 architecture.md → architecture.vi.md
✅ 5/8 contributing.md → contributing.vi.md
✅ 6/8 faq.md → faq.vi.md
✅ 7/8 troubleshooting.md → troubleshooting.vi.md
✅ 8/8 changelog.md → changelog.vi.md

✅ Translation Complete!

📊 Summary:
- Files translated: 8
- Total characters: 45,230
- Average quality: High
- Technical terms preserved: 127

All Vietnamese versions saved with .vi.md suffix.
```

## 🔧 Advanced Options

### Custom Context

Provide detailed context for better translation:

```
/translate --context "API error messages for mobile app users"
```

This helps the tool:
- Choose appropriate formality
- Preserve technical accuracy
- Use mobile-friendly language

### Preserve Specific Terms

Specify terms to never translate:

```
/translate --preserve "React,TypeScript,Zustand,shadcn"
```

### Formality Level (Japanese)

```
/translate --formality casual    # です/ます form (default)
/translate --formality formal    # でございます form
/translate --formality technical # Technical documentation style
```

### Dialect Selection

```
/translate --dialect north    # Northern Vietnamese
/translate --dialect south    # Southern Vietnamese (default)
/translate --dialect us       # US English (default)
/translate --dialect uk       # UK English
```

## 🚨 Error Handling

### If MCP Tool Fails
```
❌ Error: Could not connect to Translation service

Please check:
1. MCP server is running
2. JAI1_ACCESS_KEY is configured
3. Network connection is available

Or try a simpler text first.
```

### If Language Not Supported
```
⚠️  Language "zh" is not supported yet.

Currently supported:
- Vietnamese (vi)
- Japanese (ja)
- English (en)

More languages coming soon!
```

### If File is Too Large
```
⚠️  File size: 2.5MB (limit: 1MB)

Options:
1. Split file into smaller sections
2. Translate specific sections only
3. Use batch mode for directory

Which would you prefer?
```

## 💡 Tips for Best Results

1. **Provide context**: Always specify content type for better accuracy
2. **Check technical terms**: Review preserved terms to ensure correctness
3. **Iterative refinement**: Translate in chunks for long documents
4. **Maintain glossary**: Keep a project glossary for consistency
5. **Review numbers**: Double-check currency and number conversions

## 🔗 Integration with Other Workflows

### With `/gen-feature-doc`
```bash
# Generate docs in English
/gen-feature-doc "User Authentication"

# Then translate to Japanese
/translate docs/features/auth.md --target ja
```

### With `/commit-it`
```bash
# Translate commit message
/translate "feat: thêm tính năng xác thực người dùng" --target en

# Result: "feat: add user authentication feature"
# Use in commit
```

### With `/review-local-changes`
```bash
# Review in English
/review-local-changes

# Translate review to Vietnamese for team
/translate [review output] --target vi
```

## 📚 Common Translation Patterns

### Software Documentation
```
EN: "Click the button to submit"
VI: "Nhấn vào nút để gửi"
JA: "ボタンをクリックして送信してください"
```

### Error Messages
```
EN: "Invalid email format"
VI: "Định dạng email không hợp lệ"
JA: "メールアドレスの形式が無効です"
```

### UI Labels
```
EN: "Save Changes"
VI: "Lưu thay đổi"
JA: "変更を保存"
```

### API Responses
```
EN: "Request successful"
VI: "Yêu cầu thành công"
JA: "リクエストが成功しました"
```

## 🎯 Quality Assurance

After translation, the workflow can optionally:

1. **Validate formatting**: Check markdown/HTML remains valid
2. **Check length**: Warn if translation is 2x+ longer (might indicate issue)
3. **Verify links**: Ensure all URLs still work
4. **Test code blocks**: Verify code blocks unchanged
5. **Spot check**: Show 3 random sentences for manual review

Example validation output:
```
🔍 Quality Check:

✅ Markdown formatting: Valid
✅ Links verified: 12/12 working
✅ Code blocks: Unchanged (5 blocks)
✅ Length ratio: 1.15x (normal)
⚠️  Unusually long sentence detected (line 45)

Overall quality: High
```
