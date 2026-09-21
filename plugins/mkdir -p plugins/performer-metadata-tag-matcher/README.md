# Performer Metadata Tag Matcher

Matches performer metadata with existing Stash tag names and aliases.

## Features

- Batch processing
- Matching by tag name
- Matching by tag alias
- Case-insensitive matching
- Preserves existing performer tags
- Does not delete tags
- Does not create tags
- Preview mode
- Reports unmatched metadata values
- Reports duplicate aliases
- Supports country, ethnicity, eye color, hair color and gender

## Matching example

Performer metadata:

- Country: Italy
- Eye color: Green

Existing tags:

- Italia
  - Alias: Italy
- Occhi verdi
  - Alias: Green

Tags added to the performer:

- Italia
- Occhi verdi

## Important behavior

The plugin only adds existing tags.

It never:

- creates a new tag;
- removes an existing tag;
- replaces an existing tag;
- infers metadata from images.

## Duplicate aliases

If the same name or alias belongs to multiple tags, the plugin uses the first
matching tag and writes a warning to the Stash log.

Remove duplicate aliases before running the apply task.

## Installation

Add the following source in Stash:

https://TUO-USERNAME.github.io/stash-performer-metadata-tag-matcher/main/index.yml

Then open:

Settings > Plugins > Available Plugins

## First run

Always run:

Preview metadata tag matches

before executing:

Match all standard metadata

## License

AGPL-3.0
