# AI Translation System Prompt Configuration

## Overview

i18n Ally now supports custom AI translation prompts through markdown files in your project. This allows you to define project-specific translation guidelines that AI engines (like OpenAI) will follow.

## How It Works

1. **Default Behavior**: By default, i18n Ally looks for a file named `i18n-translation-instruction.md` in your workspace root
2. **Custom Path**: You can specify a different file path in your VSCode settings
3. **Fallback**: If no file is found, a default prompt is used

## Configuration

### Using Default Location

Simply create a file named `i18n-translation-instruction.md` in your workspace root:

```markdown
# Translation Instructions

You are a professional translator. Please follow these guidelines:
1. Preserve all placeholders and variables
2. Maintain consistent terminology
3. Keep translations concise
```

### Using Custom Path

In your `.vscode/settings.json`:

```json
{
  "i18n-ally.translate.aiSystemPromptFile": "docs/translation-guide.md"
}
```

## Prompt File Format

The extension reads the first non-header content from your markdown file. Everything between the first content and the next header (or end of file) is used as the system prompt.

```markdown
# My Translation Guide

This text will be used as the system prompt.
Multiple lines are supported.
The prompt continues until the next header or end of file.

## This header marks the end of the prompt
Anything below this header is ignored.
```

## Example Template

An example template is provided at `examples/i18n-translation-instruction.md.example` which includes:
- General translation guidelines
- Placeholder preservation rules
- Language-specific instructions
- Example translations

## Benefits

- **Project-Specific Guidelines**: Each project can have its own translation rules
- **Version Control**: Track translation guidelines alongside your code
- **Team Consistency**: Ensure all team members use the same translation approach
- **Easy Updates**: Modify translation behavior without changing extension settings