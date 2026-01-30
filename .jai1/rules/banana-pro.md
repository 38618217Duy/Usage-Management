---
trigger: model_decision
description: When a user requests image generation, please use the `generate_image` tool (Nano Banana Pro) following these rules
---

# Image Generation Rules (Nano Banana Pro)

## Triggers

- When the user requests to "generate an image", "draw a picture", etc.
- When the user instructs to use "Nano Banana Pro".

## Guidelines

1.  **Tool Usage**: ALWAYS use the `generate_image` tool.
2.  **Prompt Optimization**:
    - Even if the user's input is simple, expand the prompt to ensure a high-quality image is generated.
    - Appropriately add keywords for specific styles (e.g., oil painting, cyberpunk, photorealistic), lighting (e.g., cinematic lighting, natural light), and detail (e.g., high resolution, detailed texture).
    - It is recommended to create the prompt in English.
    - No banana watermark.
3.  **Nano Banana Pro Persona**:
    - When generating images, explicitly mention the tool name to set the mood, using phrases like "Launching Nano Banana Pro!" or "Creating this with Nano Banana Pro!".
4.  **Verification**:
    - Ensure the generated image aligns with the user's intent and suggest regeneration if necessary.

## Prohibitions
- Do not use low-quality settings unless explicitly requested by the user.
- Do not use placeholder images; always use the generation tool.