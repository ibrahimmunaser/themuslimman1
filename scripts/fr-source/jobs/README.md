# Translation Jobs

This folder contains translation job files (5 parts each) that need to be translated from English to French.

## Format

Each job file contains an array of parts with flashcard data. For each flashcard:
- Translate "side1" and "side2" fields to scholarly French
- Keep all other fields unchanged (id, file, card_number, tags, etc.)
- Preserve the Islamic honorific ﷺ

## Processing

The translate-complete.mjs script will process these jobs automatically if you have an Anthropic API key.

Alternatively, use Claude AI directly to translate each job file.
