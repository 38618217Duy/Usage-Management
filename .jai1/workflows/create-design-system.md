As a Senior UI/UX Designer, I will create a Design System based on user requirements.

## ⚠️ CRITICAL RULES

1. ✅ **One-time clarification** - Ask maximum 1 round of questions, then proceed
2. ✅ **Smart inference** - If user skips, make best predictions based on context
3. ✅ **Two options + recommendation** - Always provide 2 design directions with 1 recommended
4. ✅ **Continuous execution** - Complete all phases without stopping

---

## 🎯 INPUT

User provides (partial/complete): Business type, Target audience, Brand personality, Color preferences, References

---

## 🔄 WORKFLOW PHASES

### Phase 1: Information Gathering

**RULE**: Ask ONCE only. If user skips → infer best answers.

**Step 1.1: Analyze Input**
```
Parse user input to identify:
- ✓ Business type: [detected/missing]
- ✓ Target audience: [detected/missing]
- ✓ Brand personality: [detected/missing]
- ✓ Color preferences: [detected/missing]
- ✓ References: [detected/missing]
```

**Step 1.2: Smart Questions (IF critical info missing)**
```markdown
## 🤔 Quick questions to create a suitable Design System:

1. **Business Type**: [E-commerce/SaaS/Agency/Blog/Portfolio]
2. **Target Audience**: Age [18-25/25-35/35-50/50+], Style [Modern/Traditional/Luxury]
3. **Personality** (choose 2-3): Professional / Creative / Friendly / Premium / Energetic / Minimal
4. **Colors**: [Specific colors or "let me suggest"]
5. **References**: [URLs or brand names]

💡 *Answer briefly or skip - I will suggest automatically!*
```

**Step 1.3: Inference Rules** (if user doesn't answer)
- Business unknown → Modern service/product company
- Audience unknown → 25-45 age range, professional
- Personality unknown → Professional + Approachable
- Colors unknown → Generate based on industry standards

**NEXT**: AUTO-CONTINUE to Phase 2

---

### Phase 2: Design System Options

**RULE**: Create 2 distinct directions. One MUST be recommended.

**Option Template** (create for both Option A & B):
```markdown
## 🎨 Option [A/B]: [Theme Name]

### Concept
[2-3 sentences - design direction và why it fits]

### Color Palette
| Type | Hex | Usage |
|------|-----|-------|
| Primary | #hex | Buttons, links, key elements |
| Primary Light | #hex | Hover states, light backgrounds |
| Primary Dark | #hex | Active states, text emphasis |
| Secondary | #hex | Supporting elements |
| Accent | #hex | CTAs, highlights |
| Background | #hex | Page background |
| Surface | #hex | Cards, modals |
| Text Primary | #hex | Headings, body |
| Text Secondary | #hex | Captions, muted |
| Border | #hex | Dividers, inputs |

### Typography
- **Heading Font**: [Font Name] - [Why this font fits]
- **Body Font**: [Font Name] - [Why this font fits]

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| Display | 48-72px | Bold | 1.1 |
| H1 | 36-48px | Bold | 1.2 |
| H2 | 28-36px | Semibold | 1.25 |
| H3 | 24-28px | Semibold | 1.3 |
| Body | 16px | Regular | 1.6 |
| Small | 14px | Regular | 1.5 |

### Visual Style
- **Border Radius**: [sharp 0/subtle 4px/rounded 8px/pill 9999px]
- **Shadows**: [none/subtle/moderate/dramatic]
- **Imagery**: [photography/illustration/abstract]
- **Animations**: [none/subtle/moderate/playful]

### Mood: [3-4 emotional keywords]
### Best For: [When to use this option]
```

**Recommendation**:
```markdown
## ⭐ Recommendation: Option [A/B]

**Why This Option?**
1. [Reason tied to user requirements]
2. [Reason tied to business goals]
3. [Reason tied to target audience]

**Trade-offs**: Pros: [...] | Cons: [...]
**When to Choose Other**: [Brief explanation]
```

**NEXT**: AUTO-CONTINUE to Phase 3

---

### Phase 3: Final Design System

**RULE**: Create complete system based on selection (or recommendation if no response).

```markdown
# Design System: [Project/Brand Name]
> Requirements: [Summary] | Option: [A/B] | Date: [date]

## 1. Brand Foundation
- **Traits**: [3 main characteristics]
- **Voice**: [How the brand communicates]
- **Audience**: [Demographics + Psychographics + Needs]

## 2. Color System
```css
/* Primary Scale */
--primary-50: #[lightest];
--primary-100: #hex;
--primary-200: #hex;
--primary-300: #hex;
--primary-400: #hex;
--primary-500: #[main];
--primary-600: #hex;
--primary-700: #hex;
--primary-800: #hex;
--primary-900: #[darkest];

/* Secondary & Accent */
--secondary-500: #hex;
--accent: #hex;

/* Semantic */
--success: #22c55e;
--warning: #f59e0b;
--error: #ef4444;
--info: #3b82f6;

/* Backgrounds */
--bg-primary: #hex;
--bg-secondary: #hex;
--bg-tertiary: #hex;

/* Text */
--text-primary: #hex;
--text-secondary: #hex;
--text-muted: #hex;

/* Borders */
--border-light: #hex;
--border-default: #hex;
```

### Color Usage
| Element | Token | Notes |
|---------|-------|-------|
| Primary Button | primary-500 | Main actions |
| Secondary Button | secondary-500 | Supporting |
| Links | primary-600 | Underline on hover |
| Headings | text-primary | All headings |
| Body | text-secondary | Paragraphs |

## 3. Typography
```css
--font-heading: '[Font]', sans-serif;
--font-body: '[Font]', sans-serif;
```

| Element | Size | Weight | Line Height | Letter Spacing |
|---------|------|--------|-------------|----------------|
| Display | 60px | bold | 1.1 | -0.02em |
| H1 | 48px | bold | 1.2 | -0.01em |
| H2 | 36px | semibold | 1.25 | 0 |
| H3 | 30px | semibold | 1.3 | 0 |
| H4 | 24px | medium | 1.35 | 0 |
| Body Large | 18px | normal | 1.6 | 0 |
| Body | 16px | normal | 1.6 | 0 |
| Small | 14px | normal | 1.5 | 0 |
| Caption | 12px | normal | 1.4 | 0.02em |

## 4. Spacing (Base: 4px)
```
1=4px, 2=8px, 3=12px, 4=16px, 5=20px, 6=24px, 8=32px, 10=40px, 12=48px, 16=64px, 20=80px, 24=96px
```
- **Components**: 16-24px padding
- **Sections**: 64-96px vertical
- **Grid gap**: 24-32px

## 5. Layout
- **Breakpoints**: sm(640), md(768), lg(1024), xl(1280), 2xl(1536)
- **Container**: max-w-7xl (1280px), px-4 sm:px-6 lg:px-8
- **Grid**: 12-column desktop, 4-column mobile, gutter 24px

## 6. Components

### Radius & Shadows
```css
--radius-sm: 2px; --radius-md: 6px; --radius-lg: 8px; --radius-xl: 12px; --radius-full: 9999px;
--shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
--shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1);
--shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1);
--shadow-xl: 0 20px 25px -5px rgba(0,0,0,0.1);
--transition: 200ms ease;
```

### Buttons
| Variant | Background | Text | Border | Hover |
|---------|------------|------|--------|-------|
| Primary | primary-500 | white | none | primary-600 |
| Secondary | secondary-500 | white | none | secondary-600 |
| Outline | transparent | primary-500 | primary-500 | primary-50 bg |
| Ghost | transparent | text-primary | none | bg-secondary |

### Inputs
- Border: 1px solid border-default, radius-md
- Focus: primary-500 ring 2px
- Error: error border color
- Disabled: bg-secondary, 50% opacity

## 7. Icons & Images
- **Icons**: Lucide/Heroicons, stroke 1.5-2px, sizes: 16/20/24/32px
- **Photos**: [Mood], [Color treatment], [Subjects]
- **Illustrations**: [Style], [Color usage]

## 8. TailwindCSS Config
```javascript
tailwind.config = {
  theme: {
    extend: {
      colors: {
        primary: { 50:'#hex', 100:'#hex', ..., 500:'#hex', ..., 900:'#hex' },
        secondary: { 500:'#hex' },
        accent: '#hex'
      },
      fontFamily: {
        heading: ['[Font]', 'sans-serif'],
        body: ['[Font]', 'sans-serif']
      }
    }
  }
}
```
```

**NEXT**: AUTO-CONTINUE to Phase 4

---

### Phase 4: Implementation Prompt & Delivery

**Objectives**
1. Standardize implementation prompt based on final Design System
2. Ensure recipient has Tailwind examples to apply immediately
3. Automatically save prompt as Markdown file for handover/logging

**Step 4.1: Prepare Data**
- Get information from Phase 3: project type, audience, personality, palette, typography, radius, shadow, spacing, components, breakpoints.
- Review emotional keywords & important characteristics to include in prompt introduction.

**Step 4.2: Tạo Implementation Prompt**
```markdown
# 📋 Design Implementation Prompt

## Project
**Type**: [Type] | **Audience**: [Desc] | **Personality**: [Keywords]

## Design System
- **Primary**: #hex | **Secondary**: #hex | **Accent**: #hex
- **Background**: #hex | **Text**: #hex
- **Headings**: [Font] (Google Fonts) | **Body**: [Font]
- **Radius**: [value] | **Shadows**: [style]

## Implementation Rules
1. **Colors**: Primary=main actions, Secondary=supporting, Accent=CTAs/highlights
2. **Typography**: Headings=bold/tight line-height, Body=regular/relaxed
3. **Spacing**: 4px base, Sections=py-16 md:py-24, Components=p-4 to p-6
4. **Components**: Cards=rounded-xl shadow-md, Buttons=rounded-lg px-6 py-3
5. **Responsive**: Mobile-first, Breakpoints: sm/md/lg/xl

## TailwindCSS Reference
```html
<!-- Buttons -->
<button class="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">Primary</button>
<button class="border border-primary-500 text-primary-500 hover:bg-primary-50 px-6 py-3 rounded-lg font-medium transition-colors">Outline</button>

<!-- Card -->
<div class="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">Content</div>

<!-- Section -->
<section class="py-16 md:py-24 lg:py-32 px-4 sm:px-6 lg:px-8">
  <div class="max-w-7xl mx-auto">Content</div>
</section>

<!-- Input -->
<input class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
```
```

**Step 4.3: Auto-save Markdown**
- Immediately after creating prompt, save as `.md` file for easy sharing/storage.
- File naming convention: `deliverables/implementation-prompt-[project-slug]-[yyyymmdd].md` (create directory if doesn't exist).
- File content = entire Markdown block from Step 4.2.
- Can use sample command (adjust according to project):
  ```bash
  cat <<'MD' > deliverables/implementation-prompt-aurora-saas-20241203.md
  [PASTE PROMPT HERE]
  MD
  ```

---

## ✅ Quality Checklist
- [ ] Two distinct options provided
- [ ] Clear recommendation with reasoning
- [ ] Complete color system (full scale + semantic)
- [ ] Typography with sizes, weights, line-heights
- [ ] Spacing system defined
- [ ] Component styles (buttons, inputs, cards)
- [ ] TailwindCSS config included
- [ ] Implementation prompt is actionable
