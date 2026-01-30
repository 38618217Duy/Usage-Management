---
name: pptx-to-markdown
description: Convert PowerPoint (PPTX) files to LLM-ready Markdown format with image extraction. Use when user needs to convert presentations to text for AI processing, documentation, or content extraction. Triggers on "convert pptx", "pptx to markdown", "extract presentation", "presentation to text".
---

# PPTX to Markdown Converter

Convert PowerPoint presentations to structured Markdown with image references.

## Prerequisites

```bash
pip install python-pptx Pillow
```

## Usage

### Single File

```bash
python scripts/convert.py <input.pptx> [output_dir]
```

### Batch Convert

```bash
python scripts/convert.py <folder_with_pptx_files> [output_dir]
```

## Output Structure

```
output/
├── presentation.md      # Markdown with all slides
└── images/
    ├── slide_01_img_01.png
    ├── slide_02_img_01.jpg
    └── ...
```

## Markdown Format

```markdown
# Presentation Name

*Extracted from: file.pptx*
*Total slides: N*

---

## Slide 1: Title

- Bullet point 1
- Bullet point 2

| Col 1 | Col 2 |
|-------|-------|
| Data  | Data  |

![slide_01_img_01.png](images/slide_01_img_01.png)

> **Speaker Notes:**
> Additional context here...

---
```

## Features

- Extract text preserving slide structure
- Maintain bullet hierarchy
- Convert tables to Markdown tables
- Export images with references
- Include speaker notes
- Batch convert support

## Image Processing Workflow

After conversion, images need AI extraction:

1. Run conversion script
2. Review `images/` folder
3. Use vision AI to extract text/diagrams from images
4. Merge extracted content into final Markdown

See workflow `/convert-pptx` for complete process.
