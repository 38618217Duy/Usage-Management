---
name: gen-tech-visual
description: Generates professional, flat-design technical infographics using the generate_image tool. Use this skill when the user asks to create infographics, visualize architectures, or generate system diagrams.
---

# Gen Tech Visual

## Overview

This skill guides the creation of professional, enterprise-grade **technical visualizations**. It bridges the gap between strict "Architecture Diagrams" (UML/C4) and "Infographics" (Marketing visuals). It produces clean, flat-design diagrams suitable for documentation, presentations, and technical overviews across **ANY project**.

Use this skill for:
-   **System Architectures**: High-level component views.
-   **Data Flows**: How data moves between services.
-   **Process Explanations**: Visualizing workflows (e.g., Auth, Payment).
-   **Concepts**: Explaining abstract technical concepts.

## Workflow

1.  **Analyze Request**: Identify if the user needs a structural view (Architecture) or a conceptual view (Infographic).
2.  **Map Layout**:
    -   *Central Hub*: Good for ecosystems / platforms.
    -   *Flowchart (Left-to-Right)*: Good for processes / pipelines.
    -   *Layered Stack*: Good for full-stack architectures.
3.  **Construct Prompt**: Use the strict prompt template below.
4.  **Generate**: Call `generate_image`.

## Prompt Engineering Guide

To ensure high-quality results, use the **Style Dataset** below.

### 1. Style Selection (Style Dataset)

Select one of the following styles based on user request. **Enforce "Corporate Flat" if no specific style is requested.**

#### A. Corporate Flat (DEFAULT)
*Best for: Documentation, Formal Presentations, General Overviews*
> **Style keywords**: "A customized, flat-design professional technical diagram. Style: Minimalist corporate vector art, solid matte colors (universal navy, slate gray, clean white), no glowing neon gradients, high readability. Professional, enterprise-grade diagram."
> **Negative constraints**: "No neon, no gradients, no 3D effects, no realistic shadows, no complex textures, no abstract swirls."

#### B. Modern Tech (Dark)
*Best for: SaaS Products, AI/ML concepts, Modern Web Stacks*
> **Style keywords**: "A high-tech, modern dark mode infographic. Style: Deep dark background (obsidian/midnight), subtle neon accents (cyan, violet, electric blue), glowing distinct edges, modern sans-serif typography. Futuristic but clean interface aesthetic."
> **Negative constraints**: "No cartoonish effects, no messy glows, no grunge textures, no low contrast text."

#### C. Architectural Sketch
*Best for: Whiteboarding, Initial Concepts, System Drafts*
> **Style keywords**: "A clean technical whiteboard sketch or blueprint. Style: Precise line art, mono-weight lines, white or graph paper background, architectural draft aesthetic (blue or black ink). Hand-drawn feel but perfectly straight and organized."
> **Negative constraints**: "No solid fills, no photographs, no 3D rendering, no messy scribbles."

#### D. Isometric Infrastructure
*Best for: Cloud Architecture, Server Stacks, Physical/Network Layouts*
> **Style keywords**: "A professional 3D isometric vector illustration. Style: Axonometric projection, clean distinct blocks, soft distinct shadows, cloud infrastructure aesthetic. Sharp edges, pastel and solid corporate colors."
> **Negative constraints**: "No perspective distortion, no hyper-realism, no blurry elements."

### 2. Layout Description
Describe the visual structure clearly. **Do not leave layout to chance.**
- **For Ecosystems**: "Central node [Main System] connecting to X surrounding modules..."
- **For Flows**: "Left-to-right flow starting at [User] -> [Frontend] -> [Backend]..."
- **For Layers**: "Vertical stack with top layer [Client], middle [Service], bottom [Database]..."

### 4. Language & Content
- If the user requests Vietnamese content, include specific label instructions in the prompt (e.g., "Bottom icons labeled in Vietnamese: 'Tự động hóa', 'Đồng nhất'...").
- Keep text in the image minimal and high-level (Titles, short lists).

## Example Template

**User Request**: "Create an infographic for the authentication system."

**Tool Prompt**:
```
A detailed, clean, professional flat-design infographic for 'Authentication System' on a white background. 
Style: Minimalist corporate vector art, solid matte colors (navy blue, slate grey, white), no neon or gradients. 
Layout: Central node 'Auth Service' connecting to 4 modules: 
1. 'Login' card (Inputs: Email, Password). 
2. 'Oauth' card (Logos: Google, GitHub). 
3. 'Database' card (Icon: Server). 
4. 'Token' card (Label: JWT). 
Professional, high readability.
```
