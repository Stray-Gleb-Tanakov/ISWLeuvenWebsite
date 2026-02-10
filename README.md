# ISW Leuven Website

Terminal-themed info hub for the ISW Leuven student society.

---

## Structure

```
src/
├── data/
│   └── site-data.tsx      # ✏️ ALL CONTENT HERE (events, board, resources, commands)
│
├── pages/
│   ├── Index.tsx          # Homepage
│   ├── Events.tsx         # Upcoming activities
│   ├── About.tsx          # Mission + board members
│   └── Resources.tsx      # Study links & tools
│
├── components/
│   ├── PageLayout.tsx     # Shared page wrapper (scanlines, footer)
│   ├── TerminalHero.tsx   # ASCII art header + typing animation
│   ├── CommandGrid.tsx    # Navigation buttons grid
│   ├── TerminalButton.tsx # Styled terminal-style button
│   ├── Scanlines.tsx      # CRT overlay effect
│   └── Footer.tsx         # Site footer
│
└── index.css              # Theme colors + CRT effects
```

---

## Quick Edits

| What | Where |
|------|-------|
| Add event | `src/data/site-data.tsx` → `events` array |
| Add board member | `src/data/site-data.tsx` → `boardMembers` array |
| Add resource link | `src/data/site-data.tsx` → `resources` array |
| Change nav buttons | `src/data/site-data.tsx` → `commands` array |
| Change colors | `src/index.css` → `:root` variables |

---

## Tech

React + TypeScript + Tailwind CSS + Vite

---

## Run Locally

```sh
npm i
npm run dev
```
