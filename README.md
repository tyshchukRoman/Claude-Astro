# Vibecoded Website Starterkit

Context files that teach Claude Code how to build modern Astro websites. Use these with the [Vibecoding Websites Guide](https://albertbozesan.com/vibecoding-websites).

## Quick Start

1. Create a new Astro project:

   ```bash
   npm create astro@latest my-site
   cd my-site
   ```

2. Copy the starterkit files into your project root:

   ```
   GUIDE-CC.md
   CLAUDE.md
   DESIGN.md
   scripts/wp-to-astro.js
   user-website-content/
   ```

3. Edit `DESIGN.md` — replace the placeholder colors and font choices with your own brand values.

4. Put your content (text, images, logos) in `user-website-content/`.

5. Open Claude Code and start building:

   ```
   Read GUIDE-CC.md and DESIGN.md. Build me a portfolio site using the content in user-website-content/.
   ```

## What's Included

| File | Purpose |
|------|---------|
| `GUIDE-CC.md` | Teaches Claude Code about Astro architecture, modern design patterns, SEO, performance, and deployment |
| `CLAUDE.md` | Project-level instructions for Claude Code (follow design system, clean up unused code) |
| `DESIGN.md` | Design system template — colors, typography, spacing, animations, component patterns |
| `user-website-content/` | Drop your text, images, and fonts here before starting |
| `scripts/wp-to-astro.js` | WordPress migration script for sites with 50+ posts |

## WordPress Migration

**Small sites (< 50 posts):** Place your WordPress export XML in `user-website-content/` and ask Claude Code to parse it directly.

**Large sites (50+ posts):** Use the included script:

```bash
node scripts/wp-to-astro.js user-website-content/wordpress-export.xml
```

See `GUIDE-CC.md` for full migration details.

## Customization

These files are starting points. Adjust them as your site evolves:

- **DESIGN.md** — Update colors, fonts, and spacing as your brand develops
- **CLAUDE.md** — Add project-specific rules (e.g., "This site uses French as the primary language")
- **GUIDE-CC.md** — Generally leave as-is unless you need to change architectural decisions
