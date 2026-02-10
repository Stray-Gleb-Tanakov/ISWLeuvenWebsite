# ISW Leuven — Design System

A retro CRT terminal aesthetic built with Tailwind CSS and custom CSS tokens.

---

## File Structure

```
src/
├── index.css            # Design tokens (colors, glows) + base styles
└── styles/
    ├── README.md        # ← You are here
    └── terminal.css     # All CRT visual effects & component styles
```

---

## Color Tokens (HSL)

All colors are defined as HSL values in `index.css` under `:root`.  
Use them via Tailwind classes — **never hardcode colors in components**.

| Token                  | Tailwind Class             | Purpose                          |
|------------------------|----------------------------|----------------------------------|
| `--background`         | `bg-background`            | Page background (near-black)     |
| `--foreground`         | `text-foreground`          | Default text (phosphor green)    |
| `--primary`            | `bg-primary`, `text-primary` | Main green (#00FF00)           |
| `--primary-foreground` | `text-primary-foreground`  | Text on primary bg (dark)        |
| `--secondary`          | `bg-secondary`             | Muted green surface              |
| `--secondary-foreground` | `text-secondary-foreground` | Text on secondary             |
| `--muted`              | `bg-muted`                 | Subtle background                |
| `--muted-foreground`   | `text-muted-foreground`    | Dimmed/inactive text             |
| `--accent`             | `bg-accent`                | Slightly darker green highlight  |
| `--accent-foreground`  | `text-accent-foreground`   | Text on accent bg                |
| `--destructive`        | `bg-destructive`           | Error/danger red                 |
| `--border`             | `border-border`            | Border color (dim green)         |
| `--input`              | `bg-input`                 | Form input background            |
| `--ring`               | `ring-ring`                | Focus ring color                 |

---

## Custom Glow Tokens

These power the CRT phosphor glow effects:

| Token                  | Used by         | Description                              |
|------------------------|-----------------|------------------------------------------|
| `--terminal-glow`      | `.border-glow`  | Multi-layer box shadow for borders       |
| `--terminal-text-glow` | `.text-glow`    | Text shadow for glowing text             |
| `--scanline-opacity`   | `.scanlines`    | Opacity of CRT scanline overlay          |
| `--crt-curve`          | (reserved)      | CRT screen curvature (for future use)    |

---

## CSS Utility Classes (terminal.css)

| Class           | Effect                                           |
|-----------------|--------------------------------------------------|
| `.scanlines`    | Full-screen CRT scanline overlay                 |
| `.crt-flicker`  | Subtle opacity flicker animation                 |
| `.text-glow`    | Green phosphor text glow                         |
| `.border-glow`  | Green phosphor box glow                          |
| `.cursor-blink` | Blinking terminal block cursor                   |
| `.typing-text`  | Typewriter text reveal animation                 |
| `.terminal-btn` | Button with `>` prefix on hover + glow           |
| `.scroll-pulse` | Pulsing glow for scroll indicators               |
| `.ascii-art`    | Responsive monospace ASCII banner                |

---

## Tailwind Utility Classes (index.css)

| Class                 | Effect                                    |
|-----------------------|-------------------------------------------|
| `.container-terminal` | Centered container, max-w-5xl with padding |

---

## Usage Examples

> **Note:** These are JSX snippets — paste them inside the `return()` of any React component.  
> All styles work globally since `terminal.css` is imported via `index.css`.

```tsx
{/* Glowing heading */}
<h1 className="text-primary text-glow">Hello Terminal</h1>

{/* Glowing card */}
<div className="bg-card border border-primary border-glow p-4">
  Content here
</div>

{/* Dimmed helper text */}
<span className="text-muted-foreground">$ prompt</span>

{/* Terminal button (see TerminalButton.tsx) */}
<button className="terminal-btn bg-secondary border border-primary">
  Run command
</button>
```

---

## Rules

1. **Always use semantic tokens** — no `text-green-500` or `bg-black`
2. **All colors must be HSL** — defined in `:root` in `index.css`
3. **Add new tokens to both** `:root` and `.dark` blocks
4. **Font is JetBrains Mono** everywhere — set in `body` base styles
5. **Border radius is 0px** — sharp corners match the terminal look
