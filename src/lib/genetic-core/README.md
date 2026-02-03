# Genetic Core

Reusable TypeScript implementation of a genetic algorithm. This is the shared engine used by examples in this repository.

## API

- `GeneticAlgorithm<T>` in `core.ts`
- Config + operator types in `types.ts`

## Usage

```ts
import { GeneticAlgorithm } from "@/lib/genetic-core";
```

See the Sudoku example in `src/lib/genetic-sudoku` and the UI at `/genetic-sudoku`.
