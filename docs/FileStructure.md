# Project File Structure & Development Guidelines

This document outlines the directory structure and architectural patterns used in OpenCircle. All future features and code additions should strictly adhere to these guidelines to ensure codebase consistency and maintainability.

---

## 📁 Directory Structure Overview

```text
src/
├── app/                  # Next.js App Router (pages, layouts and route-specific UI)
│   ├── _components/      # Global application components used across routes
│   ├── events/           # Route: /events
│   ├── projects/         # Route: /projects
│   │   └── _components/  # Co-located components exclusive to /projects
│   ├── rules/            # Route: /rules
│   ├── layout.tsx        # Root application layout
│   └── page.tsx          # Root homepage route
├── components/           # Shared global components & UI primitives
│   └── ui/               # Reusable UI component primitives (e.g., shadcn/ui)
├── hooks/                # Custom React hooks
├── lib/                  # Helper utilities, ranking engines, & core business logic
└── styles/               # Global CSS files and styling utilities
```

---

## 📐 Core Architectural Rules & Guidelines

### 1. Route Co-location (`src/app/<route>/_components/`)
* **Rule**: Place components that belong *exclusively* to a specific page or feature within a private `_components` folder under that route directory (e.g., `src/app/projects/_components/projects-feed.tsx`).
* **Why**: Prevents clutter in global directories and ensures Next.js does not treat component files as public routes (using the `_` prefix).

### 2. Shared & Primitive Components (`src/components/`)
* **Rule**: Place app-wide layout components (e.g., `app-header.tsx`, `app-sidebar.tsx`) directly in `src/components/`. Place generic, re-usable UI primitives (buttons, dialogs, inputs) inside `src/components/ui/`.
* **Why**: Keeps reusable design system tokens separate from feature-specific page code.

### 3. Business Logic & Utilities (`src/lib/`)
* **Rule**: Keep UI components pure. Move non-UI business logic, data calculations, API helpers, and formatters into `src/lib/` (e.g., `rankings.ts`, `utils.ts`).
* **Why**: Promotes reusability across components, server actions, and API handlers, and makes unit testing easier.

### 4. File Naming Conventions
* **Rule**: Use **`kebab-case`** for all filenames (e.g., `projects-feed.tsx`, `theme-provider.tsx`, `rankings.ts`).
* **Why**: Ensures uniform naming across cross-platform environments (Windows, macOS, Linux).

### 5. Clean Import Paths (`@/...`)
* **Rule**: Always use the defined path alias `@/` mapped to the `src/` directory (e.g., `import { cn } from "@/lib/utils"` or `import { ProjectsFeed } from "@/app/projects/_components/projects-feed"`).
* **Why**: Avoids deep relative imports (`../../../`) and keeps import statements clean and maintainable.
