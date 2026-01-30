As a Senior UI/UX Designer and Frontend Developer, I will redesign and modernize a website based on the provided URL.

## ⚠️ CRITICAL RULES

1. ✅ **Extract all content from URL** - Read and understand current website fully
2. ✅ **Analyze business context** - Understand industry, target audience, goals
3. ✅ **Modern design principles** - Apply current UI/UX best practices
4. ✅ **Continuous execution** - Complete all phases without stopping
5. ✅ **Single HTML output** - Create one responsive HTML file with TailwindCSS

---

## 🎯 INPUT

**Required**: Website URL from user

---

## 🔄 WORKFLOW PHASES

### Phase 1: Content Extraction & Analysis

**EXECUTION RULE**: Extract ALL content and analyze current design. DO NOT stop for user input.

**Step 1.1: Read Website Content**
```
1. Use read_url_content tool to fetch the URL
2. Extract ALL text content (headings, paragraphs, CTAs, navigation)
3. Identify all sections and their purposes
4. Note current color scheme, fonts, layout patterns
5. List all images/icons descriptions and their purposes
```

**Step 1.2: Business Analysis**
```
1. Identify business type/industry
2. Determine target audience (demographics, psychographics)
3. Extract value proposition and key messages
4. List main products/services
5. Identify competitive positioning
6. Note brand personality (professional, playful, luxury, etc.)
```

**Step 1.3: Current Design Audit**
```
Evaluate current design (1-5 scale):
- Visual hierarchy: [score]
- Color harmony: [score]
- Typography: [score]
- Spacing/whitespace: [score]
- Mobile responsiveness: [score]
- User experience: [score]
- Modern aesthetics: [score]

Issues identified:
- [List specific problems]
```

**OUTPUT**: Content inventory, business analysis, design audit report
**NEXT**: AUTO-CONTINUE to Phase 2

---

### Phase 2: Design System Proposal

**EXECUTION RULE**: Create comprehensive design system based on analysis. AUTO-CONTINUE.

**Step 2.1: Color Palette Design**
```markdown
## Color Palette

### Primary Colors
- **Primary**: #[hex] - [Usage: buttons, links, key elements]
- **Primary Light**: #[hex] - [Usage: hover states, backgrounds]
- **Primary Dark**: #[hex] - [Usage: active states, text]

### Secondary Colors
- **Secondary**: #[hex] - [Usage: accents, highlights]
- **Accent**: #[hex] - [Usage: CTAs, important elements]

### Neutral Colors
- **Background**: #[hex] - [Main background]
- **Surface**: #[hex] - [Cards, elevated elements]
- **Text Primary**: #[hex] - [Headings, body text]
- **Text Secondary**: #[hex] - [Captions, muted text]
- **Border**: #[hex] - [Dividers, borders]

### Semantic Colors
- **Success**: #[hex]
- **Warning**: #[hex]
- **Error**: #[hex]
- **Info**: #[hex]

### Rationale
[Explain why these colors fit the brand and business]
```

**Step 2.2: Typography System**
```markdown
## Typography

### Font Families
- **Headings**: [Font Name] - [Why this font]
- **Body**: [Font Name] - [Why this font]
- **Accent/Display**: [Font Name] (optional)

### Type Scale (TailwindCSS classes)
- Display: text-5xl md:text-6xl lg:text-7xl (font-bold)
- H1: text-4xl md:text-5xl (font-bold)
- H2: text-3xl md:text-4xl (font-semibold)
- H3: text-2xl md:text-3xl (font-semibold)
- H4: text-xl md:text-2xl (font-medium)
- Body Large: text-lg (font-normal)
- Body: text-base (font-normal)
- Small: text-sm (font-normal)
- Caption: text-xs (font-normal)

### Line Heights
- Headings: leading-tight (1.25)
- Body: leading-relaxed (1.625)
```

**Step 2.3: Spacing & Layout**
```markdown
## Spacing System

### Base Unit: 4px (TailwindCSS default)
- xs: 4px (p-1, m-1)
- sm: 8px (p-2, m-2)
- md: 16px (p-4, m-4)
- lg: 24px (p-6, m-6)
- xl: 32px (p-8, m-8)
- 2xl: 48px (p-12, m-12)
- 3xl: 64px (p-16, m-16)

### Container
- Max width: max-w-7xl (1280px)
- Padding: px-4 sm:px-6 lg:px-8

### Section Spacing
- Between sections: py-16 md:py-24 lg:py-32
- Content gaps: gap-8 md:gap-12

### Grid System
- Desktop: 12-column grid
- Tablet: 8-column grid
- Mobile: 4-column grid
```

**Step 2.4: Component Patterns**
```markdown
## UI Components

### Buttons
- Primary: [TailwindCSS classes]
- Secondary: [TailwindCSS classes]
- Ghost: [TailwindCSS classes]
- Sizes: sm, md, lg

### Cards
- Standard: [rounded corners, shadow, padding]
- Elevated: [stronger shadow, hover effects]
- Interactive: [hover/active states]

### Navigation
- Desktop: [horizontal nav pattern]
- Mobile: [hamburger/slide-out pattern]
- Sticky behavior: [yes/no]

### Forms
- Input style: [border, focus states]
- Labels: [position, styling]
- Validation: [error/success states]

### Effects
- Border radius: rounded-lg or rounded-xl
- Shadows: shadow-sm, shadow-md, shadow-lg
- Transitions: transition-all duration-300
- Hover effects: [scale, opacity, color shifts]
```

**OUTPUT**: Complete design system documentation
**NEXT**: AUTO-CONTINUE to Phase 3

---

### Phase 3: Layout & Wireframe Design

**EXECUTION RULE**: Design page structure and component arrangement. AUTO-CONTINUE.

**Step 3.1: Page Structure**
```markdown
## Page Layout

### Header/Navigation
- Logo position: [left/center]
- Nav items: [list from content extraction]
- CTA button: [text and purpose]
- Mobile behavior: [hamburger menu details]

### Hero Section
- Layout: [full-width/contained, image position]
- Content: [headline, subheadline, CTA]
- Visual: [background image/gradient/illustration]

### Main Sections
For each section identified:
1. **[Section Name]**
   - Purpose: [what this section achieves]
   - Layout: [grid type, columns]
   - Components: [cards, lists, images, etc.]
   - Animation: [scroll reveals, hover effects]

### Footer
- Columns: [number and content]
- Links: [grouped by category]
- Social: [icons and placement]
- Legal: [copyright, privacy, terms]
```

**Step 3.2: Responsive Strategy**
```markdown
## Breakpoints & Responsive Design

### TailwindCSS Breakpoints
- sm: 640px (large phones)
- md: 768px (tablets)
- lg: 1024px (laptops)
- xl: 1280px (desktops)
- 2xl: 1536px (large screens)

### Layout Changes
- Navigation: [mobile vs desktop behavior]
- Grid: [column changes per breakpoint]
- Typography: [size scaling]
- Spacing: [adjustments]
- Images: [sizing, cropping]
- Hide/Show: [elements that change visibility]
```

**OUTPUT**: Complete layout specification
**NEXT**: AUTO-CONTINUE to Phase 4

---

### Phase 4: HTML + TailwindCSS Implementation

**EXECUTION RULE**: Create single, complete HTML file with all styling. This is the final deliverable.

**File**: `redesign-[website-name].html`

**Structure**:
```html
<!DOCTYPE html>
<html lang="vi" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>[Website Title] - Redesign</title>
    
    <!-- TailwindCSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=[Font1]&family=[Font2]&display=swap" rel="stylesheet">
    
    <!-- Lucide Icons -->
    <script src="https://unpkg.com/lucide@latest"></script>
    
    <!-- Custom Tailwind Config -->
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: { /* color scale */ },
                        secondary: { /* color scale */ },
                    },
                    fontFamily: {
                        heading: ['[Font1]', 'sans-serif'],
                        body: ['[Font2]', 'sans-serif'],
                    },
                }
            }
        }
    </script>
    
    <!-- Custom Styles -->
    <style>
        /* Custom animations and utilities */
    </style>
</head>
<body class="font-body antialiased">
    <!-- Navigation -->
    <!-- Hero Section -->
    <!-- Main Content Sections -->
    <!-- Footer -->
    
    <!-- Scripts -->
    <script>
        lucide.createIcons();
        // Mobile menu toggle
        // Smooth scroll
        // Any interactive elements
    </script>
</body>
</html>
```

**Implementation Rules**:
1. ✅ All original content MUST be preserved
2. ✅ Mobile-first responsive design
3. ✅ Use semantic HTML5 elements
4. ✅ Include hover/focus states for all interactive elements
5. ✅ Add subtle animations (fade-in, slide-up on scroll)
6. ✅ Ensure accessibility (alt text, aria labels, keyboard nav)
7. ✅ Include working mobile navigation
8. ✅ Use placeholder images with Unsplash or placeholder.com
9. ✅ All links and buttons must have proper styling

**OUTPUT**: Complete HTML file saved to project directory
**NEXT**: AUTO-CONTINUE to Phase 5

---

### Phase 5: Design Summary & Recommendations

**EXECUTION RULE**: Provide final summary and future recommendations.

**Output Format**:
```markdown
# Redesign Complete: [Website Name]

## 📊 Before vs After

| Aspect | Before | After |
|--------|--------|-------|
| Visual Score | [1-5] | [1-5] |
| Modern Score | [1-5] | [1-5] |
| UX Score | [1-5] | [1-5] |
| Mobile Score | [1-5] | [1-5] |

## 🎨 Design Decisions

### Color Strategy
[Why these colors were chosen]

### Typography Choices
[Why these fonts work for the brand]

### Layout Improvements
[What was changed and why]

## 📁 Deliverables

1. `redesign-[name].html` - Complete responsive design
2. Design system documentation (in this conversation)

## 🚀 Next Steps Recommendations

1. **Immediate**: [suggestions]
2. **Short-term**: [suggestions]
3. **Long-term**: [suggestions]

## 💡 Additional Features to Consider

- [Feature 1]
- [Feature 2]
- [Feature 3]
```

---

## ✅ Quality Checklist

Before completing, verify:
- [ ] All original content preserved
- [ ] Responsive on all breakpoints
- [ ] Modern, clean aesthetic
- [ ] Consistent design system applied
- [ ] Interactive states for all elements
- [ ] Mobile navigation works
- [ ] Semantic HTML structure
- [ ] Fast-loading (minimal dependencies)
- [ ] Accessibility basics covered
