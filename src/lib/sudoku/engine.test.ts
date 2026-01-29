import {
  applyMove,
  autoSolveSingles,
  boardToString,
  getAllowedDigits,
  getAllowedMask,
  isSolved,
  makeRandomPuzzle,
  normalizeClues,
  seededRng,
  stringToBoard,
} from "./engine";

const solvedString =
  "534678912672195348198342567859761423426853791713924856961537284287419635345286179";

describe("sudoku engine", () => {
  it("parses and serializes boards", () => {
    const board = stringToBoard(` ${solvedString} `);

    expect(board).toHaveLength(81);
    expect(boardToString(board)).toBe(solvedString);
  });

  it("throws on invalid board strings", () => {
    expect(() => stringToBoard("0")).toThrow(
      "Board string must be 81 digits (0-9).",
    );
    expect(() => stringToBoard("x".repeat(81))).toThrow(
      "Board string must be 81 digits (0-9).",
    );
  });

  it("throws on invalid board lengths", () => {
    expect(() => boardToString([1, 2, 3])).toThrow("Board must have 81 cells.");
  });

  it("serializes zeros as 0", () => {
    const board = stringToBoard(solvedString);
    board[0] = 0;

    expect(boardToString(board).startsWith("0")).toBe(true);
  });

  it("computes allowed masks and digits", () => {
    const board = stringToBoard(solvedString);
    board[0] = 0;

    const mask = getAllowedMask(board, 0);
    expect(mask).toBe(1 << 4);
    expect(getAllowedDigits(board, 0)).toEqual([5]);
    expect(getAllowedMask(board, 1)).toBe(0);
    expect(getAllowedDigits(board, 1)).toEqual([]);
  });

  it("returns all digits for an empty board cell", () => {
    const board = Array(81).fill(0);

    expect(getAllowedDigits(board, 40)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it("detects solved boards", () => {
    const board = stringToBoard(solvedString);
    const withZero = board.slice();
    withZero[10] = 0;

    expect(isSolved(board)).toBe(true);
    expect(isSolved(withZero)).toBe(false);

    const duplicate = board.slice();
    duplicate[0] = duplicate[1];
    expect(isSolved(duplicate)).toBe(false);

    const colDuplicate = board.slice();
    [colDuplicate[0], colDuplicate[1]] = [colDuplicate[1], colDuplicate[0]];
    expect(isSolved(colDuplicate)).toBe(false);
  });

  it("auto-solves single candidates", () => {
    const board = stringToBoard(solvedString);
    board[0] = 0;

    const next = autoSolveSingles(board);
    expect(next[0]).toBe(5);
  });

  it("leaves boards unchanged when no singles exist", () => {
    const board = Array(81).fill(0);

    const next = autoSolveSingles(board);
    expect(next).toEqual(board);
  });

  it("normalizes clue counts", () => {
    expect(normalizeClues(Number.NaN)).toBe(30);
    expect(normalizeClues(10)).toBe(21);
    expect(normalizeClues(120)).toBe(81);
    expect(normalizeClues(42.8)).toBe(42);
  });

  it("creates deterministic puzzles with a seeded rng", () => {
    const rng = seededRng(123);
    const puzzle = makeRandomPuzzle(30, rng);

    expect(puzzle.board).toHaveLength(81);
    expect(puzzle.locked).toHaveLength(81);
    puzzle.board.forEach((value, index) => {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(9);
      expect(puzzle.locked[index]).toBe(value !== 0);
    });
  });

  it("applies moves only to unlocked cells", () => {
    const board = stringToBoard(solvedString);
    const locked = Array(81).fill(false);
    locked[0] = true;

    const same = applyMove(board, locked, 0, 9);
    expect(same).toBe(board);

    const next = applyMove(board, locked, 1, 9);
    expect(next).not.toBe(board);
    expect(next[1]).toBe(9);
    expect(board[1]).toBe(3);
  });
});
