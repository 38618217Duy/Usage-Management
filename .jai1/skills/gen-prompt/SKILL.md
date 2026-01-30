---
name: gen-prompt
description: Expert prompt engineering and optimization for LLMs and AI systems. Use when designing, creating, optimizing, or reviewing prompts for AI models. Covers structured prompt design, system prompts, agent prompts, few-shot examples, chain-of-thought, and prompt anti-patterns. Triggers on requests like "create prompt for X", "improve this prompt", "design system prompt", "optimize prompt", "gen-prompt", "prompt engineering".
---

# Gen-Prompt: Prompt Engineering Skill

Expert guidance for designing effective prompts that maximize AI model performance.

## Core Principles

### 1. Structured Prompts

Organize prompts into clear modules using consistent separators:

```
<system>
Role and context definition
</system>

<instructions>
Step-by-step guidance
</instructions>

<constraints>
Boundaries and limitations
</constraints>

<output_format>
Expected response structure
</output_format>

<examples>
Few-shot demonstrations
</examples>
```

**Separator Options:**
- XML tags: `<section>`, `</section>` (recommended for complex prompts)
- Markdown headers: `## Section Name`
- Simple markers: `###`, `---`, `===`

### 2. Clarity Over Brevity

| ❌ Avoid | ✅ Prefer |
|----------|----------|
| "Be helpful" | "Provide step-by-step solutions with explanations" |
| "Don't be verbose" | "Limit responses to 3 sentences" |
| "Handle edge cases" | "If input is empty, return error message 'No input provided'" |

### 3. Instructions Over Constraints

**Positive framing is more effective than negative:**

| ❌ Constraint | ✅ Instruction |
|---------------|----------------|
| "Don't use jargon" | "Use simple, everyday language" |
| "Don't be creative" | "Respond only with verified facts" |
| "Avoid long explanations" | "Keep each explanation under 50 words" |

### 4. Specific Goals

Replace vague goals with measurable outcomes:

```markdown
❌ Vague: "Write good code"
✅ Specific: "Write TypeScript code that:
   - Uses strict type checking
   - Includes JSDoc comments for public APIs
   - Follows camelCase naming convention
   - Has error handling for async operations"
```

## Real-World Examples

See [references/examples.md](references/examples.md) for detailed real-world prompt examples with analysis showing these principles in action.

## Prompt Templates

### System Prompt Template

```markdown
# Role
You are [specific role] with expertise in [domain].

# Context
[Relevant background information the model needs]

# Primary Objective
[Clear statement of what to accomplish]

# Guidelines
1. [First guideline]
2. [Second guideline]
3. [Third guideline]

# Output Requirements
- Format: [JSON/Markdown/Plain text]
- Length: [Specific length requirement]
- Tone: [Professional/Casual/Technical]

# Examples
[Include 2-3 representative examples]
```

### Task Prompt Template

```markdown
# Task
[Clear description of what needs to be done]

# Input
[The data or content to process]

# Expected Output
[Description of desired result with format]

# Constraints
- [Constraint 1]
- [Constraint 2]
```

### Agent Prompt Template

```markdown
# Agent Identity
You are [agent name], a [role description].

# Capabilities
- [Capability 1]
- [Capability 2]
- [Tool/Action descriptions]

# Decision Framework
When faced with [situation type]:
1. First, [action 1]
2. Then, [action 2]
3. Finally, [action 3]

# Communication Style
[Voice, tone, and communication preferences]

# Boundaries
[What the agent should and should not do]
```

## Advanced Techniques

### Few-Shot Examples

**Best Practices:**
- Start with 3-6 examples for complex tasks
- Cover diverse scenarios (positive, negative, edge cases)
- Match the exact format you want in output
- For classification: balance all categories

```markdown
## Examples

### Example 1: [Category A]
Input: [sample input]
Output: [expected output]

### Example 2: [Category B]  
Input: [sample input]
Output: [expected output]

### Example 3: [Edge Case]
Input: [edge case input]
Output: [handling output]
```

### Chain-of-Thought (CoT)

Use for reasoning tasks:

```markdown
# Instructions
Solve the problem step by step:
1. Identify the key information
2. Determine the approach
3. Execute each step showing your work
4. Verify the result
5. Provide the final answer

# Example
Problem: [example problem]
Step 1: [identify key info]
Step 2: [determine approach]
Step 3: [execute]
Step 4: [verify]
Final Answer: [result]
```

### Attention Anchoring

**Position important content strategically:**

```markdown
> [!IMPORTANT]
> Critical instruction at the beginning

[Main content...]

> [!NOTE]
> Key reminder at the end
```

**Use emphasis markers:**
- `**Important:**` for critical points
- `> [!WARNING]` for cautions
- `CRITICAL:` or `ESSENTIAL:` for must-follow rules

### Context Window Management

For long conversations:
- Summarize key points periodically
- Restate constraints before complex tasks
- Use structured headers for easy reference

```markdown
# Reminder: Key Constraints
- Maximum 200 words per response
- Always cite sources
- Use formal academic tone
```

## Anti-Patterns to Avoid

| Anti-Pattern | Problem | Solution |
|--------------|---------|----------|
| Vague instructions | Inconsistent outputs | Be specific and measurable |
| Information overload | Buried key points | Prioritize, use structure |
| Implicit assumptions | Misinterpretation | State assumptions explicitly |
| Conflicting instructions | Model confusion | Review for consistency |
| No examples | Format guessing | Include 2-3 clear examples |
| Negative-only framing | Less effective guidance | Use positive instructions |

## Prompt Optimization Workflow

### Step 1: Define Success Criteria

```markdown
# Success Metrics
- Accuracy: [How to measure correctness]
- Format compliance: [Expected structure]
- Completeness: [Required elements]
- Quality: [Qualitative requirements]
```

### Step 2: Test Systematically

1. Create diverse test inputs (normal, edge cases, adversarial)
2. Run each input through the prompt
3. Score against success criteria
4. Document failures and patterns

### Step 3: Iterate

```markdown
# Iteration Log

## Version 1
- Prompt: [original prompt]
- Issue: [observed problem]
- Hypothesis: [why it failed]

## Version 2
- Change: [what was modified]
- Result: [improvement or not]
- Learning: [insight gained]
```

### Step 4: A/B Test Variations

When optimizing:
- Change one element at a time
- Test on the same input set
- Measure against same criteria
- Document what works and what doesn't

## Model-Specific Tips

### For Reasoning Tasks
- Use CoT prompting
- Ask for step-by-step explanation
- Request verification of final answer

### For Creative Tasks
- Provide style examples
- Specify tone and voice
- Set constraints on format/length

### For Code Generation
- Specify language and version
- Include error handling requirements
- Request comments and documentation

### For Classification
- Provide balanced examples per category
- Define categories explicitly
- Include "uncertain" handling

## Quick Reference Checklist

Before deploying a prompt, verify:

- [ ] Clear role/identity defined
- [ ] Specific, measurable goal stated
- [ ] Instructions use positive framing
- [ ] 2-3 representative examples included
- [ ] Output format explicitly specified
- [ ] Edge cases addressed
- [ ] No conflicting instructions
- [ ] Important points emphasized (start/end)
- [ ] Tested with diverse inputs
- [ ] Documented for iteration
