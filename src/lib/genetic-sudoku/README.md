# Genetic Sudoku Example

This folder contains a concrete Sudoku solver that uses the generic genetic algorithm engine from `src/lib/genetic-core`.

## Structure

- `solver.ts` wires the genetic engine to Sudoku-specific operators.
- `population.ts`, `fitness.ts`, `validator.ts` implement Sudoku logic.
- `utils.ts` contains helpers (formatting/parsing).

## UI

The React UI lives at `src/app/genetic-sudoku/page.tsx` and uses shadcn components.
