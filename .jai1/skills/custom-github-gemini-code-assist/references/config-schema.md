# Config.yaml Schema Reference

Full JSON Schema specification for `.gemini/config.yaml`.

## Schema Definition

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "RepoConfig",
  "description": "Configuration for Gemini Code Assist on a repository. All fields are optional and have default values.",
  "type": "object",
  "properties": {
    "have_fun": {
      "type": "boolean",
      "description": "Enables fun features such as a poem in the initial pull request summary. Default: false."
    },
    "ignore_patterns": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "A list of glob patterns for files and directories that Gemini Code Assist should ignore. Files matching any pattern in this list will be skipped during interactions. Default: []."
    },
    "memory_config": {
      "type": "object",
      "description": "Configuration for persistent memory, which is used to improve responses.",
      "properties": {
        "disabled": {
          "type": "boolean",
          "description": "Whether to disable persistent memory for this specific repository, if persistent memory has been enabled for multiple repositories. Default: false."
        }
      }
    },
    "code_review": {
      "type": "object",
      "description": "Configuration for code reviews. All fields are optional and have default values.",
      "properties": {
        "disable": {
          "type": "boolean",
          "description": "Disables Gemini from acting on pull requests. Default: false."
        },
        "comment_severity_threshold": {
          "type": "string",
          "enum": ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
          "description": "The minimum severity of review comments to consider. Default: MEDIUM."
        },
        "max_review_comments": {
          "type": "integer",
          "format": "int64",
          "description": "The maximum number of review comments to consider. Use -1 for unlimited. Default: -1."
        },
        "pull_request_opened": {
          "type": "object",
          "description": "Configuration for pull request opened events. All fields are optional and have default values.",
          "properties": {
            "help": {
              "type": "boolean",
              "description": "Posts a help message on pull request open. Default: false."
            },
            "summary": {
              "type": "boolean",
              "description": "Posts a pull request summary on the pull request open. Default: true."
            },
            "code_review": {
              "type": "boolean",
              "description": "Posts a code review on pull request open. Default: true."
            },
            "include_drafts": {
              "type": "boolean",
              "description": "Enables agent functionality on draft pull requests. Default: true."
            }
          }
        }
      }
    }
  }
}
```

## Property Details

### `have_fun`

- **Type:** boolean
- **Default:** false
- **Description:** When enabled, Gemini will include fun elements like poems in pull request summaries.

### `ignore_patterns`

- **Type:** array of strings (glob patterns)
- **Default:** []
- **Description:** Files and directories matching these patterns will be skipped during code reviews and other interactions.

**Common Patterns:**

| Pattern | Description |
|---------|-------------|
| `*.min.js` | Minified JavaScript files |
| `*.min.css` | Minified CSS files |
| `dist/**` | Distribution/build output |
| `node_modules/**` | NPM dependencies |
| `vendor/**` | Vendored dependencies |
| `*.lock` | Lock files (package-lock.json, yarn.lock) |
| `*.generated.*` | Generated files |
| `**/*.test.ts` | Test files |
| `coverage/**` | Coverage reports |

### `memory_config`

Configuration for Gemini's persistent memory feature.

#### `memory_config.disabled`

- **Type:** boolean
- **Default:** false
- **Description:** Disable persistent memory for this repository. Useful if you have memory enabled for multiple repositories but want to exclude specific ones.

### `code_review`

Configuration options for automated code reviews.

#### `code_review.disable`

- **Type:** boolean
- **Default:** false
- **Description:** Completely disable Gemini's code review functionality on pull requests.

#### `code_review.comment_severity_threshold`

- **Type:** string (enum)
- **Values:** LOW, MEDIUM, HIGH, CRITICAL
- **Default:** MEDIUM
- **Description:** Minimum severity level for review comments to be displayed.

| Level | Description |
|-------|-------------|
| LOW | All comments including minor suggestions |
| MEDIUM | Moderate importance and above |
| HIGH | High importance issues only |
| CRITICAL | Only critical/blocking issues |

#### `code_review.max_review_comments`

- **Type:** integer
- **Default:** -1 (unlimited)
- **Description:** Maximum number of review comments per pull request. Use -1 for no limit.

#### `code_review.pull_request_opened`

Settings for when a pull request is first opened.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `help` | boolean | false | Post a help message explaining how to interact with Gemini |
| `summary` | boolean | true | Post an AI-generated summary of the changes |
| `code_review` | boolean | true | Automatically perform code review |
| `include_drafts` | boolean | true | Also review draft pull requests |

## Example Configurations

### Minimal Configuration

```yaml
# Use all defaults
code_review:
  comment_severity_threshold: MEDIUM
```

### Strict Code Review

```yaml
code_review:
  comment_severity_threshold: LOW
  max_review_comments: -1
  pull_request_opened:
    help: true
    summary: true
    code_review: true
    include_drafts: true
```

### Relaxed/Production

```yaml
code_review:
  comment_severity_threshold: HIGH
  max_review_comments: 10
  pull_request_opened:
    summary: true
    code_review: true
    include_drafts: false

ignore_patterns:
  - "dist/**"
  - "*.min.*"
  - "coverage/**"
```

### Disable Code Review (Keep Summary Only)

```yaml
code_review:
  disable: false
  pull_request_opened:
    summary: true
    code_review: false
```
