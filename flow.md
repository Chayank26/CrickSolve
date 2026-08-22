# System Workflow & Execution Order - CrickSolve 🏏

This document traces the complete execution flow, entry points, component hierarchy, and function call sequences of the CrickSolve application.

---

## Current Status: Phase 1 (Project Initialization & Architecture Setup)

### 1. Code Entry Point
- **Root Layout (`src/app/layout.tsx`)**:
  - Serves as the top-level HTML document wrapper.
  - Loads global styles (`src/app/globals.css`), metadata (Title, Description, Viewport), and font configurations.
- **Main Page (`src/app/page.tsx`)**:
  - Main route handler rendered at `/`.
  - Serves as the container for the CrickSolve game application interface.

---

### 2. Execution Order
1. **HTTP Request to `/`**:
   - Next.js server resolves `src/app/layout.tsx`.
   - `layout.tsx` wraps the document in `<html>` and `<body>` tags and injects global CSS variables and Tailwind directives.
2. **Page Component Rendering (`src/app/page.tsx`)**:
   - Renders initial server shell and delegates interactive sub-components to Client Components (`"use client"` directive).
3. **Client Initialization**:
   - React hydrates client-side components.
   - Initial state stores and hooks evaluate local browser context.

---

### 3. Function Call Graph (Phase 1 Baseline)
```
[HTTP Request: GET /]
       │
       ▼
src/app/layout.tsx (RootLayout)
       │
       ├──> Injects Metadata (title, description)
       ├──> Injects src/app/globals.css
       │
       ▼
src/app/page.tsx (Home Page)
       │
       └──> Renders Main UI Shell
```
