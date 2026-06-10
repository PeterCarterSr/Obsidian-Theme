# Arcadia Theme for Obsidian

Arcadia turns Obsidian into a calm, book-like writing environment. It ships **34 color schemes** (16 dark, 18 light), OneNote-style paper and sticky notes, 50+ file type icons, 21 alternate checkboxes, and deep customization through the Style Settings plugin. It is free and always will be.

![Arcadia Theme Preview](screenshots/hero-dark.png)

---

## Table of Contents

- [Features](#features)
- [Getting Started](#getting-started)
- [Installation](#installation)
- [Color Schemes](#color-schemes)
- [Style Settings Configuration](#style-settings-configuration)
- [Feature Guide](#feature-guide)
- [Accessibility](#accessibility)
- [Plugin Compatibility](#plugin-compatibility)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)
- [More from Arcadia Studio](#more-from-arcadia-studio)
- [Support This Theme](#support-this-theme)
- [License](#license)
- [Changelog](#changelog)

---

## Features

- **34 color schemes**: 16 dark and 18 light, including newspaper, encyclopedia, publishing, and genealogy-inspired collections
- **14 content fonts and 6 code fonts**, selectable in Style Settings
- **50+ file type icons** with per-type colors in the file explorer
- **21 alternate checkboxes** for task states (`- [!]`, `- [?]`, `- [*]`, and more)
- **Paper styles**: lined, grid, dot, graph, legal pad, Cornell, music staff, plus page tints
- **Sticky note callouts** in 8 colors with pushpin, folded corner, and flat variations
- **Custom callouts**: timeline, profile, definition, pro/con, recipe, kanban, stats, and more
- **Polished media embedding**: shadows, rounded corners, styled audio and video players
- **Cards view** for Dataview tables, rainbow folders, tag color pills
- **Code block enhancements**: language badges, optional line numbers, Dracula/Nord/GitHub syntax themes
- **Accessibility**: OpenDyslexic mode, high contrast mode, reduced motion support

---

## Getting Started

1. **Install the theme** (see [Installation](#installation) below)
2. **Install the Style Settings plugin** (Settings > Community plugins > Browse > "Style Settings")
3. **Pick a color scheme**: Settings > Style Settings > Arcadia Color Schemes
4. **Choose your fonts**: Settings > Style Settings > Arcadia Typography
5. **Explore features**: alternate checkboxes, paper styles, sticky notes, and custom callouts

Without Style Settings, Arcadia uses sensible defaults (Granite dark, Marble light). With it, you unlock 50+ customization options.

---

## Installation

### From Community Themes (Recommended)

1. Open Obsidian **Settings**
2. Go to **Appearance** > **Themes**
3. Click **Manage** and search for **"Arcadia"**
4. Click **Install and use**

### Manual Installation

1. Download `theme.css` and `manifest.json` from this repository
2. In your vault, navigate to `.obsidian/themes/`
3. Create a folder called `Arcadia`
4. Place both files inside the `Arcadia` folder
5. In Obsidian: **Settings** > **Appearance** > **Themes** > select **"Arcadia"**

### Requirements

- **Obsidian** 0.16.0 or higher
- **[Style Settings plugin](https://github.com/mgmeyers/obsidian-style-settings)** (optional, strongly recommended for customization)

---

## Color Schemes

### Dark Themes (16)

| Theme | Description | Best For |
|-------|-------------|----------|
| **Granite** (Default) | Neutral dark gray | General use |
| **Stone** | Cool slate tones | Minimalist preference |
| **Olive** | Warm earthy greens | Nature lovers |
| **Flint** | Cool professional blue-gray | Focused work |
| **Navy** | Deep ocean blues | Late night writing |
| **Ember** | Warm firelight oranges | Cozy reading |
| **Twilight** | Purple dusk tones | Creative work |
| **Forest** | Deep woodland greens | Calm focus |
| **Crimson** | Elegant wine reds | Dramatic appearance |
| **Slate** | Modern cool gray | Clean aesthetic |
| **Amber** | Golden warmth | Nostalgic feel |
| **Parchment** | Aged document sepia | Genealogy, archival work |
| **Heritage** | Leather and gold tones | Family records, formal study |
| **Sepia** | Vintage photograph | Classic, warm nostalgia |
| **Registry** | Iron gall ink blue | Parish records, court documents |
| **Rootwood** | Walnut and earth tones | Natural, family tree research |

### Light Themes (18)

| Theme | Description | Best For |
|-------|-------------|----------|
| **Marble** (Default) | Clean white | Daytime use |
| **Sage** | Soft green tint | Gentle on eyes |
| **Pearl** | Cool ivory | Elegant writing |
| **Cloud** | Soft blue | Calm atmosphere |
| **Dawn** | Warm peach | Morning sessions |
| **Lavender** | Purple tint | Creative mood |
| **Mint** | Fresh green | Energizing |
| **Rose** | Soft pink | Gentle aesthetic |
| **Silver** | Cool gray | Professional |
| **Cream** | Golden white | Warm comfort |
| **NY Times** | Classic newspaper | Long-form reading |
| **Wikipedia** | Encyclopedia style | Research and reference |
| **Crownwell** | Classic publishing | Academic writing, theology |
| **Parchment** | Aged paper cream | Genealogy, archival reading |
| **Heritage** | Ivory with burgundy | Family history, formal documents |
| **Sepia** | Vintage warm tones | Old photograph aesthetic |
| **Registry** | Blue-gray ledger | Parish registers, court ledgers |
| **Rootwood** | Earthy birch white | Natural, family tree research |

### How to Change Color Scheme

1. Open **Settings** > **Style Settings**
2. Expand **Arcadia Color Schemes**
3. Choose **Dark Theme Flavor** or **Light Theme Flavor** from the dropdowns

---

## Style Settings Configuration

After installing the Style Settings plugin, you will find these sections under Settings > Style Settings:

### Arcadia Color Schemes
- **Dark Theme Flavor**: 16 dark schemes
- **Light Theme Flavor**: 18 light schemes

### Arcadia Theme Settings
- **Accent color override**: Indigo, Emerald, Rose, or Teal (replaces the scheme's built-in accent)

### Arcadia Typography
- **Font Size Scale**: Small, Normal, Large, Extra Large
- **Line Height**: Compact, Normal, Relaxed, Loose
- **Reading Width**: Narrow, Normal, Wide, Full
- **Content Font**: Vollkorn, Georgia, Merriweather, Crimson Pro, Lora, Literata, EB Garamond, Libre Caslon Text, Cormorant Garamond, Source Serif 4, Inter, Roboto, Open Sans, System Sans-Serif
- **Code Font**: JetBrains Mono, Fira Code, Source Code Pro, Cascadia Code, IBM Plex Mono, Consolas/Courier

Font choices apply when the font is installed on your system; otherwise a fallback stack (Georgia, system serif, system sans, or monospace) is used. The theme does not download fonts.

### Arcadia Editor
- **Active Line Highlighting**: Off, Subtle, Moderate, Strong
- **Focus Mode**: dim inactive paragraphs
- **Show Line Numbers**

### Arcadia Links & Tags
- **Link Style**: Underlined, No Underline, Underline on Hover, Dotted
- **Tag Style**: Pill, Hashtag, Badge
- **Highlight Color**: Yellow, Blue, Green, Pink, Orange

### Arcadia Lists & Checkboxes
- **Checkbox Style**: Square, Circle, Rounded Square
- **List Bullet Style**: Default, Arrows, Diamonds, Stars
- **Indentation Guides** toggle

### Arcadia Tables
- **Table Style**: Default, Striped Rows, Borderless, Compact
- **Sticky Table Headers** toggle

### Arcadia Workspace
- **Tab Style**: Default, Rounded, Squared, Minimal

### Arcadia Accessibility
- **High Contrast Mode**, **Reduce Motion**, **Dyslexia-Friendly Mode**

### Arcadia Advanced Features
Rainbow folders, Cards view, image grid, code line numbers, syntax themes (Dracula, Nord, GitHub), animated graph connections, stacked tabs, bordered embeds, and media options (polished borders, large controls, waveform, no shadows, extra rounding).

### Arcadia Paper & Notes
Paper style toggles (lined, grid, dot, Cornell) and sticky note options (pushpin, folded corner, flat, handwriting font).

---

## Feature Guide

### File Icons

Colored icons appear automatically next to files in the file explorer, covering 50+ extensions:

| Category | Extensions |
|----------|------------|
| Documents | `.md`, `.txt`, `.rtf`, `.pdf` |
| Microsoft Office | `.doc`, `.docx`, `.xls`, `.xlsx`, `.ppt`, `.pptx` |
| Images | `.png`, `.jpg`, `.jpeg`, `.gif`, `.bmp`, `.webp`, `.svg` |
| Audio | `.mp3`, `.wav`, `.ogg` |
| Video | `.mp4`, `.mkv`, `.avi` |
| Code | `.js`, `.ts`, `.py`, `.java`, `.html`, `.css`, `.json`, `.xml`, `.yaml` |
| Archives | `.zip`, `.rar`, `.7z`, `.tar`, `.gz` |
| Ebooks | `.epub`, `.mobi`, `.azw` |
| Fonts | `.ttf`, `.otf`, `.woff`, `.woff2` |

### Alternate Checkboxes

Type a special character inside the brackets:

| Syntax | Result | Use Case |
|--------|--------|----------|
| `- [x]` | Green checkmark | Completed task |
| `- [-]` | Red strikethrough | Canceled task |
| `- [>]` | Blue arrow right | Forwarded/Deferred |
| `- [<]` | Purple calendar | Scheduled |
| `- [?]` | Blue question mark | Question to answer |
| `- [!]` | Red exclamation | Important/Urgent |
| `- [*]` | Gold star | Starred/Favorite |
| `- ["]` | Cyan quote marks | Quote or citation |
| `- [l]` | Orange pin | Location |
| `- [i]` | Blue info circle | Information |
| `- [b]` | Pink bookmark | Bookmark |
| `- [S]` | Green dollar | Savings/Money |
| `- [p]` | Green thumbs up | Pro/Positive |
| `- [c]` | Red thumbs down | Con/Negative |
| `- [/]` | Orange half-fill | In Progress |
| `- [u]` | Red up arrow | High Priority |
| `- [d]` | Blue down arrow | Low Priority |
| `- [w]` | Gold trophy | Win/Achievement |
| `- [k]` | Yellow key | Key point |
| `- [f]` | Orange flame | Urgent/Hot |
| `- [I]` | Yellow lightbulb | Idea |

### Custom Callouts

Extended callout types beyond Obsidian's defaults: `timeline`, `profile`, `aside`, `definition`, `pro`, `con`, `goal`, `bookmark`, `question`, `answer`, `recipe`, `kanban`, `paraphrase`, `stats`.

```markdown
> [!timeline] Project History
> **2024-01** - Project started
> **2024-06** - Version 1.0

> [!pro] Advantages
> - Fast performance
```

### Sticky Notes

OneNote-style sticky note callouts in 8 colors: yellow, pink, blue, green, purple, orange, gray, teal.

```markdown
> [!sticky-yellow] Remember
> Meeting at 3pm.
```

Style variations (enable in Style Settings): Pushpin, Folded Corner, Flat, Handwriting font. Add `-sm` or `-small` for compact stickies, `-wide` for full width.

### Paper Styles

Transform the editor into a notebook page. Enable via Style Settings toggles (lined, grid, dot, Cornell) or per-note with `cssclasses` in frontmatter:

| cssclass | Style |
|----------|-------|
| `paper-lined` | College ruled with red margin |
| `paper-grid` | Square graph paper (`-sm`/`-lg` variants) |
| `paper-dot` | Bullet journal dot grid |
| `paper-graph` | Engineering graph paper |
| `paper-legal` | Yellow legal pad |
| `paper-cornell` | Cornell note-taking layout |
| `paper-music` | Musical staff lines |
| `paper-iso` | Isometric grid |

Page tints: `paper-cream`, `paper-blue`, `paper-green`, `paper-pink`, `paper-yellow`, `paper-lavender` (adjusted automatically in dark mode).

### Media Embedding

Polished images, video, and audio with shadows, rounded corners, and hover effects. Size and layout via per-note `cssclasses`:

```markdown
img-small / img-medium / img-large / img-full   (max width presets)
img-center, img-circle, img-rounded, img-border, img-shadow
img-float-left, img-float-right, img-grid, img-banner
img-invert   (invert diagrams in dark mode)
```

### Code Blocks

Language badges on fenced code blocks, optional line numbers, styled copy button, and three syntax themes (Dracula, Nord, GitHub) toggled in Style Settings > Arcadia Advanced Features.

### Cards View

Display Dataview TABLE results as a grid of cards. Enable in Style Settings > Arcadia Advanced Features, or per note with `cssclasses: cards`. Options: `cards-cover`, `cards-cols-1` through `cards-cols-6`, `cards-align-bottom`.

### Rainbow Folders

Color-code folders in the file explorer with a 10-color cycle. Subfolders use muted variants. Enable in Style Settings > Arcadia Advanced Features.

### Tag Colors

Tags display as colored pills. Common tag names (`#todo`, `#done`, `#urgent`, `#project`, `#meeting`, and others) are automatically color-coded by pattern.

---

## Accessibility

- High contrast ratios across all 34 color schemes (documented per scheme in `theme.css`)
- **OpenDyslexic font** option (Settings > Style Settings > Arcadia Accessibility); requires the [OpenDyslexic font](https://opendyslexic.org) installed on your system
- **Reduced motion**: respects the system `prefers-reduced-motion` preference, plus a manual toggle
- **High contrast mode** toggle

---

## Plugin Compatibility

| Plugin | Compatibility |
|--------|---------------|
| **Style Settings** | Full integration (required for customization) |
| **Dataview** | Styled tables, lists, and cards view |
| **Tasks** | Checkbox styling |
| **Kanban** | Board styling |
| **Calendar** | Date styling |
| **Excalidraw** | Canvas integration |
| **Templater** | Compatible |
| **Periodic Notes** | Compatible |
| **Advanced Tables** | Table styling applies |
| **Outliner** | List styling applies |
| **Obsidian Git** | Compatible |

---

## Troubleshooting

### Theme not loading
- Verify both `theme.css` and `manifest.json` are in `.obsidian/themes/Arcadia/`
- Restart Obsidian after manual installation
- Check that no other theme is selected (Settings > Appearance > Themes)

### Style Settings options not appearing
- Install and enable the Style Settings plugin
- Check Settings > Style Settings for the Arcadia sections
- If options are missing, switch themes and switch back

### Fonts not displaying as selected
- Arcadia does not download fonts (Obsidian developer policies prohibit remote assets in themes); a font choice applies when that font is installed on your system
- If a chosen font is not installed, the fallback stack (Georgia, system serif, or system sans) is used
- Most content and code fonts are free downloads from [Google Fonts](https://fonts.google.com); OpenDyslexic is available at [opendyslexic.org](https://opendyslexic.org)

### Paper styles not showing
- Enable a paper toggle in Style Settings > Arcadia Paper & Notes, or
- Add `cssclasses: paper-lined` (or another style) to the note's frontmatter

### Conflicts with snippets
- CSS snippets load after the theme and can override it; disable snippets temporarily to test

---

## FAQ

**Is Arcadia free?**
Yes. Arcadia is free under the MIT license. You can use, modify, and redistribute it.

**Does Arcadia work on mobile?**
Yes. Most features work on mobile. Hover effects are disabled on touch screens, and some paper styles render best on larger screens.

**Do I need Style Settings?**
No, but it is strongly recommended. Without it you get the Granite (dark) and Marble (light) defaults; with it you unlock all 34 schemes and 50+ options.

**Can I create my own color scheme?**
Yes, by editing `theme.css`. Each scheme defines about 20 CSS custom properties in RGB triplet format; copy an existing scheme block as a starting point.

**How do I report a bug or request a feature?**
Open an issue on [GitHub](https://github.com/Arcadia-Studio/obsidian-arcadia-theme/issues) using the Bug Report or Feature Request template. Include your Obsidian version, OS, and steps to reproduce.

---

## More from Arcadia Studio

Arcadia is the free centerpiece of the Arcadia Studio suite for Obsidian. If you like the theme, these plugins pair well with it:

- **[Arcadia Toolbar](https://github.com/Arcadia-Studio)**: word-processor-style ribbon toolbar with tabs for formatting, insertion, and navigation
- **[Arcadia Projects](https://github.com/Arcadia-Studio)**: table and Kanban project views over your vault notes, with filtering and sorting
- **[Arcadia Connect](https://github.com/Arcadia-Studio)**: personal CRM with @-mention contacts, interaction logs, and a deal pipeline
- **[Arcadia Publisher](https://github.com/Arcadia-Studio)**: publish notes as HTML, PDF, and ePub with customizable themes and templates
- **[Arcadia Hub](https://github.com/Arcadia-Studio)**: GitHub integration for browsing issues, pull requests, and repos from your notes

Browse the full catalog at [arcadia-studio.lemonsqueezy.com](https://arcadia-studio.lemonsqueezy.com) or visit the [Arcadia Studio GitHub organization](https://github.com/Arcadia-Studio).

---

## Support This Theme

If Arcadia is useful in your daily work, you can support development here:

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-support-yellow?style=flat-square&logo=buy-me-a-coffee)](https://buymeacoffee.com/drcarterd)

---

## Credits

**Author:** Peter J. Carter
**Website:** [theologyinfocus.org](https://theologyinfocus.org)

## License

**MIT License**: free to use, modify, and distribute. See [LICENSE](LICENSE).

---

## Changelog

### Version 2.1.1 (Current)
- Removed remote font loading (the Google Fonts and jsDelivr `@import` lines) to comply with Obsidian developer policies; all font options now resolve from locally installed fonts with safe fallback stacks
- Fixed a malformed CSS comment that closed early and caused the entire base variable block to be discarded by the CSS parser
- Light mode completeness: palette, status, and surface colors are now defined for all light schemes (close buttons, quick switcher hotkeys, and error states were previously unreadable or unstyled in light mode)
- Mapped the Arcadia palette onto official Obsidian CSS variables (`--background-primary`, `--text-normal`, `--text-accent`, `--interactive-accent`, `--text-selection`, scrollbar variables) so core UI and plugins follow the active scheme
- Theme fonts now load through Obsidian's theme font variables, so fonts chosen in Settings > Appearance take precedence
- Updated live preview selectors to current CodeMirror 6 classes (code blocks, blockquotes, tables); removed stale CM5 selectors that no longer matched
- Removed vertical margins on editor lines that could misplace the cursor in live preview
- Removed a layout rule that constrained the first editor pane to a fixed 280px width
- Removed a folder collapse animation hack that clipped folders longer than 5000px
- Fixed unreadable text while renaming files in dark mode, and top-level folder labels rendering at 8px
- Performance: media transitions limited to transform and box-shadow; hover lift effects disabled on small screens
- Bordered Embeds toggle in Style Settings now works; removed two settings that had no effect (font family override, border radius)
- Accent hover color now follows the scheme accent instead of a fixed teal
- Added Caveat to the sticky note handwriting font stack (used when the font is installed on your system)

### Version 2.1.0
- 34 color schemes (16 dark + 18 light)
- 5 genealogy-inspired schemes (Parchment, Heritage, Sepia, Registry, Rootwood)
- Font loading consolidated to 2 HTTP requests
- 4 additional fonts (EB Garamond, Libre Caslon Text, Cormorant Garamond, Source Serif 4)
- 50+ file type icons, 21 alternate checkbox types
- OneNote-style media embedding, paper styles, sticky notes
- Code syntax themes (Dracula, Nord, GitHub)
- Rainbow folders, cards view, tag color pills
- Full Style Settings integration

### Version 2.0.0
- Initial community release with 23 color schemes
- Core feature set established
