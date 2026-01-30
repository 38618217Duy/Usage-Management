---
description: Convert PPTX to LLM-ready Markdown with AI image extraction
---

# Convert PPTX Workflow

> **Goal**: Convert PowerPoint presentation to complete LLM-ready Markdown documentation.
> **Process**: Extract → Convert → AI Image Analysis → Merge → Final Output

## Prerequisites

Ensure Python dependencies installed:
```bash
pip install python-pptx Pillow
```

## Workflow Steps

### Step 1: Input Collection

**ACTIONS**:
1. Ask user for:
   - **PPTX file path**: Path to the .pptx file
   - **Output directory**: Where to save output (default: same folder as input)

**OUTPUT**:
```markdown
## Input Confirmed
- **File**: [path/to/presentation.pptx]
- **Output**: [path/to/output/]
```

---

### Step 2: Run Conversion Script

**ACTIONS**:
1. Locate skill script at `.jai1/skills/pptx-to-markdown/scripts/convert.py`
2. Run conversion:

```bash
python .jai1/skills/pptx-to-markdown/scripts/convert.py "<input.pptx>" "<output_dir>"
```

3. Verify output:
   - Check `<output_dir>/<filename>.md` exists
   - Check `<output_dir>/images/` folder for extracted images

**OUTPUT**:
```markdown
## Conversion Complete
- **Markdown**: [output_dir]/[filename].md
- **Images**: [N] images extracted to [output_dir]/images/
```

---

### Step 3: Review Extracted Images

**ACTIONS**:
1. List all images in `<output_dir>/images/`
2. For each image, categorize:

| Type | Description | Action |
|------|-------------|--------|
| **Diagram** | Flowchart, architecture, process | Extract structure + labels |
| **Chart** | Bar, pie, line chart | Extract data + title |
| **Screenshot** | UI, code, terminal | Extract visible text |
| **Photo** | Decorative, people | Skip or brief description |
| **Text Image** | Slide with text as image | OCR extract all text |

3. Report to user:

```markdown
## Images to Process

| # | File | Type | Priority |
|---|------|------|----------|
| 1 | slide_01_img_01.png | Diagram | High |
| 2 | slide_02_img_01.png | Chart | High |
| 3 | slide_03_img_01.jpg | Photo | Low (skip) |

Proceed with AI extraction? (Y/N)
```

---

### Step 4: AI Image Extraction

**ACTIONS**:
1. For each prioritized image, use vision capability to analyze
2. Generate extraction prompt based on type:

**For Diagrams**:
```
Analyze this diagram image. Extract:
1. Title/heading if visible
2. All text labels and annotations
3. Structure/flow (nodes, connections, hierarchy)
4. Key relationships or processes shown

Output as structured Markdown.
```

**For Charts**:
```
Analyze this chart image. Extract:
1. Chart title
2. Axis labels (X, Y)
3. Legend items
4. Data values or approximate percentages
5. Key insights or trends

Output as Markdown with data table if applicable.
```

**For Screenshots/Text**:
```
Extract all visible text from this image.
Preserve formatting, hierarchy, and structure.
Output as Markdown.
```

3. Save extracted content to `<output_dir>/images/[filename].extracted.md`

**OUTPUT**:
```markdown
## Image Extraction Complete

| Image | Extracted Content |
|-------|-------------------|
| slide_01_img_01.png | [Summary of extraction] |
| slide_02_img_01.png | [Summary of extraction] |
```

---

### Step 5: Merge to Final Output

**ACTIONS**:
1. Read main Markdown file `<output_dir>/<filename>.md`
2. For each image reference `![...](images/slide_XX_img_YY.ext)`:
   - Check if `images/slide_XX_img_YY.extracted.md` exists
   - If yes, insert extracted content after image reference
3. Create final output:

**Format**:
```markdown
## Slide N: Title

Content from slide...

![slide_N_img_01.png](images/slide_N_img_01.png)

<details>
<summary>Image Content: slide_N_img_01.png</summary>

[Extracted content from image]

</details>

---
```

4. Save as `<output_dir>/<filename>-final.md`

**OUTPUT**:
```markdown
## Final Output Created

**File**: [output_dir]/[filename]-final.md

### Summary
- Total slides: [N]
- Images processed: [M]
- Images skipped: [K]
```

---

### Step 6: Completion Report

```markdown
## ✅ PPTX Conversion Complete

**Input**: [path/to/presentation.pptx]

### Output Files
| File | Description |
|------|-------------|
| `[filename].md` | Raw extracted Markdown |
| `[filename]-final.md` | Final with image content |
| `images/` | Extracted images |
| `images/*.extracted.md` | Image extraction results |

### Statistics
- **Slides**: [N]
- **Images extracted**: [M]
- **Images with AI content**: [K]

### Next Steps
1. Review `[filename]-final.md` for accuracy
2. Edit as needed for your documentation
3. Delete `images/` folder if not needed
```

---

## Quality Checklist

- [ ] PPTX file path confirmed
- [ ] Output directory confirmed
- [ ] Conversion script executed successfully
- [ ] Images categorized and prioritized
- [ ] High-priority images extracted with AI
- [ ] Content merged into final Markdown
- [ ] Final output reviewed and delivered
