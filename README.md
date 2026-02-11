# GitHub Repo Bootstrapper

Interactive React + TypeScript app for designing a repository bootstrap plan, previewing generated project structure, and exporting the final configuration.

## Requirements

- Node.js 20+
- npm 10+

## Quick Start

```bash
npm install
npm run dev
```

The development server runs on `http://localhost:3000`.

## Available Scripts

- `npm run dev`: start the local Vite dev server
- `npm run typecheck`: run TypeScript checks (`tsc --noEmit`)
- `npm run test`: run unit tests with Vitest
- `npm run test:watch`: run Vitest in watch mode
- `npm run build`: produce a production bundle
- `npm run preview`: preview the production build locally
- `npm run check`: run typecheck, tests, and build in sequence

## Architecture Notes

- State is managed with Zustand (`store.ts`).
- Default config and config merge logic are centralised in `lib/plan-config.ts`.
- Simulation step generation is centralised in `lib/simulation.ts`.
- Heavy UI sections are lazy-loaded in `App.tsx` to reduce initial payload.

## Testing Focus

Unit tests currently validate:

- deep merge behaviour for config updates and presets
- simulation step generation based on selected options

Test files:

- `lib/plan-config.test.ts`
- `lib/simulation.test.ts`
