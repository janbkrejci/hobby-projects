export type Board = number[];
export type Rng = () => number;

const SIZE = 9;
const BOX = 3;
const ALL = 0b111111111; // 1..9

export function createPuzzle(clues = 30, rng: Rng = Math.random): Board {
  const puzzle = create(clues, rng);
  return stringToBoard(puzzle);
}

export function stringToBoard(value: string): Board {
  const digits = value.trim();
  if (digits.length !== 81 || /[^0-9]/.test(digits)) {
    throw new Error("Board string must be 81 digits (0-9).");
  }
  return digits.split("").map((c) => (c === "0" ? 0 : Number(c)));
}

export function boardToString(board: Board): string {
  if (board.length !== 81) {
    throw new Error("Board must have 81 cells.");
  }
  return board.map((n) => (n === 0 ? "0" : String(n))).join("");
}

export function getAllowedMask(board: Board, index: number): number {
  if (board[index] !== 0) {
    return 0;
  }
  const row = Math.floor(index / SIZE);
  const col = index % SIZE;
  const boxRow = Math.floor(row / BOX) * BOX;
  const boxCol = Math.floor(col / BOX) * BOX;

  let used = 0;
  for (let i = 0; i < SIZE; i += 1) {
    const rowVal = board[row * SIZE + i];
    const colVal = board[i * SIZE + col];
    if (rowVal) used |= d2b(rowVal);
    if (colVal) used |= d2b(colVal);
  }
  for (let r = boxRow; r < boxRow + BOX; r += 1) {
    for (let c = boxCol; c < boxCol + BOX; c += 1) {
      const v = board[r * SIZE + c];
      if (v) used |= d2b(v);
    }
  }
  return ALL ^ used;
}

export function isSolved(board: Board): boolean {
  for (let i = 0; i < SIZE; i += 1) {
    if (!isUnitSolved(row(board, i))) return false;
    if (!isUnitSolved(col(board, i))) return false;
    if (!isUnitSolved(box(board, i))) return false;
  }
  return true;
}

export function autoSolveSingles(board: Board): Board {
  const next = board.slice();
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < 81; i += 1) {
      if (next[i] !== 0) continue;
      const mask = getAllowedMask(next, i);
      if (popCount(mask) === 1) {
        next[i] = b2d(mask);
        changed = true;
      }
    }
  }
  return next;
}

export function getAllowedDigits(board: Board, index: number): number[] {
  const mask = getAllowedMask(board, index);
  return b2ds(mask);
}

function row(board: Board, r: number): number[] {
  return board.slice(r * SIZE, r * SIZE + SIZE);
}

function col(board: Board, c: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < SIZE; i += 1) {
    out.push(board[i * SIZE + c]);
  }
  return out;
}

function box(board: Board, b: number): number[] {
  const boxRow = Math.floor(b / BOX) * BOX;
  const boxCol = (b % BOX) * BOX;
  const out: number[] = [];
  for (let r = boxRow; r < boxRow + BOX; r += 1) {
    for (let c = boxCol; c < boxCol + BOX; c += 1) {
      out.push(board[r * SIZE + c]);
    }
  }
  return out;
}

function isUnitSolved(values: number[]): boolean {
  if (values.some((v) => v === 0)) return false;
  return new Set(values).size === SIZE;
}

function popCount(mask: number): number {
  let count = 0;
  let n = mask;
  while (n) {
    n &= n - 1;
    count += 1;
  }
  return count;
}

function d2b(digit: number): number {
  return 1 << (digit - 1);
}

function b2d(byte: number): number {
  let i = 1;
  let v = byte;
  while (v > 1) {
    v >>= 1;
    i += 1;
  }
  return i;
}

function b2ds(byte: number): number[] {
  const digits: number[] = [];
  let i = 1;
  let v = byte;
  while (v) {
    if (v & 1) digits.push(i);
    v >>= 1;
    i += 1;
  }
  return digits;
}

function shuffle<T>(array: T[], rng: Rng): T[] {
  let currentIndex = array.length;
  while (currentIndex !== 0) {
    const randomIndex = Math.floor(rng() * currentIndex);
    currentIndex -= 1;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
}

function shuffledIndices(rng: Rng): number[] {
  return shuffle(
    Array.from({ length: 81 }, (_, i) => i),
    rng,
  );
}

function i2rc(index: number): { row: number; col: number } {
  return { row: Math.floor(index / 9), col: index % 9 };
}

function rc2i(row: number, col: number): number {
  return row * 9 + col;
}

function b2s(values: number[]): string {
  return values.map((b) => (b === 0 ? "0" : String(b2d(b)))).join("");
}

function getMoves(board: number[], index: number): number {
  const { row, col } = i2rc(index);
  const r1 = 3 * Math.floor(row / 3);
  const c1 = 3 * Math.floor(col / 3);
  let moves = 0;
  for (let r = r1, i = 0; r < r1 + 3; r += 1) {
    for (let c = c1; c < c1 + 3; c += 1, i += 1) {
      moves |= board[rc2i(r, c)] | board[rc2i(row, i)] | board[rc2i(i, col)];
    }
  }
  return moves ^ 511;
}

function unique(allowed: number[], index: number, value: number): boolean {
  const { row, col } = i2rc(index);
  const r1 = 3 * Math.floor(row / 3);
  const c1 = 3 * Math.floor(col / 3);
  let ir = 9 * row;
  let ic = col;
  let uniqRow = true;
  let uniqCol = true;
  let uniqSquare = true;
  for (let r = r1; r < r1 + 3; r += 1) {
    for (let c = c1; c < c1 + 3; c += 1, ++ir, ic += 9) {
      if (uniqSquare) {
        const i = rc2i(r, c);
        if (i !== index && allowed[i] & value) uniqSquare = false;
      }
      if (uniqRow) {
        if (ir !== index && allowed[ir] & value) uniqRow = false;
      }
      if (uniqCol) {
        if (ic !== index && allowed[ic] & value) uniqCol = false;
      }
      if (!(uniqSquare || uniqRow || uniqCol)) return false;
    }
  }
  return true;
}

function analyze(board: number[], rng: Rng) {
  const allowed = board.map((x, i) => (x ? 0 : getMoves(board, i)));
  let bestIndex: number | undefined;
  let bestLen = 100;
  for (const i of shuffledIndices(rng)) {
    if (!board[i]) {
      let moves = allowed[i];
      let len = 0;
      for (let m = 1; moves; m <<= 1) {
        if (moves & m) {
          len += 1;
          if (unique(allowed, i, m)) {
            allowed[i] = m;
            len = 1;
            break;
          }
          moves ^= m;
        }
      }
      if (len < bestLen) {
        bestLen = len;
        bestIndex = i;
        if (!bestLen) break;
      }
    }
  }
  return {
    index: bestIndex,
    moves: bestIndex === undefined ? 0 : allowed[bestIndex],
    allowed,
  };
}

function solve(
  board: number[],
  solutions: Set<string>,
  limit = 1,
  rng: Rng,
): boolean {
  const { index, moves } = analyze(board, rng);
  if (index === undefined) {
    solutions.add(b2s(board));
    return true;
  }
  for (let m = 1, mv = moves; mv; m <<= 1) {
    if (mv & m) {
      board[index] = m;
      if (solve(board, solutions, limit, rng)) {
        if (solutions.size >= limit) return true;
      }
      mv ^= m;
    }
  }
  board[index] = 0;
  return false;
}

function create(clues = 50, rng: Rng = Math.random): string {
  let done = false;
  let board: number[] = [];
  let solutions = new Set<string>();

  while (!done) {
    board = Array(81).fill(0);
    solve(board, solutions, 1, rng);
    const indices = shuffledIndices(rng);
    let remaining = 81;

    while (remaining > clues && indices.length) {
      solutions = new Set();
      const cell = indices.pop()!;
      const oldVal = board[cell];
      board[cell] = 0;
      solve(Array.from(board), solutions, 2, rng);
      if (solutions.size === 1) {
        remaining -= 1;
      } else {
        board[cell] = oldVal;
      }
    }

    done = remaining === clues;
  }

  return b2s(board);
}

export function normalizeClues(value: number): number {
  if (Number.isNaN(value)) return 30;
  if (value < 21) return 21;
  if (value > 81) return 81;
  return Math.floor(value);
}

export function makeRandomPuzzle(
  clues = 30,
  rng: Rng = Math.random,
): { board: Board; locked: boolean[] } {
  const normalized = normalizeClues(clues);
  const puzzle = createPuzzle(normalized, rng);
  const locked = puzzle.map((n) => n !== 0);
  return { board: puzzle, locked };
}

export function seededRng(seed: number): Rng {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function applyMove(
  board: Board,
  locked: boolean[],
  index: number,
  value: number,
): Board {
  if (locked[index]) return board;
  const next = board.slice();
  next[index] = value;
  return next;
}
