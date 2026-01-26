# Repository Guidelines

## Project Structure & Module Organization
- `src/app/` contains the Next.js App Router entry points (`layout.tsx`, `page.tsx`) and global styles in `globals.css`.
- `src/components/` holds shared React components. UI primitives live in `src/components/ui/` (shadcn-style).
- `public/` stores static assets served from the web root (e.g., `/next.svg`).
- Configuration lives at the repo root (`next.config.ts`, `eslint.config.mjs`, `tsconfig.json`, `postcss.config.mjs`).

## Build, Test, and Development Commands
- `npm run dev`: start the Next.js dev server at `http://localhost:3000`.
- `npm run build`: create the production build.
- `npm run start`: run the production server after a build.
- `npm run lint`: run ESLint using `eslint-config-next`.

## Coding Style & Naming Conventions
- TypeScript + React with the Next.js App Router (`.tsx` in `src/app` and `src/components`).
- Indentation is 2 spaces; keep JSX formatted and readable (see `src/app/page.tsx`).
- Tailwind CSS is used for styling; global styles live in `src/app/globals.css`.
- Path aliases are configured in `tsconfig.json` (e.g., `@/components`, `@/lib`).

## Testing Guidelines
- Vitest is the test runner with `jsdom` for DOM-based component tests.
- Run tests with `npm run test`; place tests alongside components (e.g., `Button.test.tsx`).

## Commit & Pull Request Guidelines
- No commit message convention is established (this repo has no git history yet).
- Use clear, imperative subjects (e.g., “Add pricing card layout”) and keep commits focused.
- PRs should include: a concise description, rationale for changes, and screenshots for UI changes. Link related issues if applicable.

## Configuration Tips
- Shadcn UI settings are defined in `components.json`; update it if you change component paths, base colors, or icon library.
