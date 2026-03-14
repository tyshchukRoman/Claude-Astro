# Project Instructions

## Before Making Changes

1. Read existing code before modifying
2. Check for existing utilities/hooks that handle the use case
3. Follow existing patterns in the codebase
4. Remove any code that becomes unused after changes
5. **Always follow DESIGN.md** — All UI changes must adhere to the design system in DESIGN.md

## Project Context

This is a personal WordPress expert portfolio site built with Astro (static).

- **Node**: requires Node 22+ (`nvm use 22`)
- **Dev server**: `npm run dev`
- **Build**: `npm run build`
- **Font**: Montserrat (Google Fonts)
- **Accent color**: `#00e5a0` (terminal green)
- **Design vibe**: dark hacker/terminal aesthetic
- **Content source**: `user-website-content/text/text.txt`
- **Profile photo**: `public/images/roman.jpg`
- **Contact form**: Formspree — owner must replace `YOUR_FORM_ID` in `src/components/Contact.astro`
- **Site URL**: update `site` in `astro.config.mjs` before deploying

## Task Management

- **Remove completed tasks from markdown files** — After completing a task documented in DESIGN.md, TODO.md, or similar files, remove it from the document to keep the list current and actionable.
