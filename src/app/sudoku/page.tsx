"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  Board,
  applyMove,
  autoSolveSingles,
  boardToString,
  getAllowedDigits,
  isSolved,
  makeRandomPuzzle,
  normalizeClues,
  seededRng,
  stringToBoard,
} from "@/lib/sudoku/engine";

const HELP_ITEMS = [
  ["Space", "Auto solve cells with single hint"],
  ["Backspace", "Undo last move"],
  ["C", "Copy board to clipboard"],
  ["G", "Generate new puzzle"],
  ["H", "Toggle pencil marks (hints)"],
  ["L", "Load board from string of 81 digits"],
  ["S", "Show current board as string"],
  ["R", "Reset board to last loaded state"],
  ["Enter/Return", "Show/hide this help"],
  ["Arrow keys", "Move selection around"],
  ["Escape or 0", "Clear selected cell"],
  ["Numpad 0-9", "Set value of selected cell"],
  ["1-9", "Set value of selected cell"],
];

type Step = {
  index: number;
  prev: number;
  next: number;
};

function indexToRowCol(index: number) {
  return { row: Math.floor(index / 9), col: index % 9 };
}

export default function SudokuPage() {
  const initial = useMemo(() => makeRandomPuzzle(30, seededRng(1337)), []);
  const [board, setBoard] = useState<Board>(initial.board);
  const [locked, setLocked] = useState<boolean[]>(initial.locked);
  const [selection, setSelection] = useState(0);
  const [showHints, setShowHints] = useState(false);
  const [, setSteps] = useState<Step[]>([]);
  const [loadedBoard, setLoadedBoard] = useState(boardToString(initial.board));
  const [showHelp, setShowHelp] = useState(true);
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [generateValue, setGenerateValue] = useState("30");
  const [loadOpen, setLoadOpen] = useState(false);
  const [loadValue, setLoadValue] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showBoardOpen, setShowBoardOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  const solved = useMemo(() => isSolved(board), [board]);
  const boardString = useMemo(() => boardToString(board), [board]);
  const isComplete = useMemo(
    () => board.every((value) => value !== 0),
    [board],
  );
  const conflictSet = useMemo(() => {
    const conflicts = new Set<number>();
    const addConflicts = (indices: number[]) => {
      const buckets = new Map<number, number[]>();
      indices.forEach((idx) => {
        const value = board[idx];
        if (!value) return;
        const group = buckets.get(value) ?? [];
        group.push(idx);
        buckets.set(value, group);
      });
      buckets.forEach((group) => {
        if (group.length > 1) {
          group.forEach((idx) => conflicts.add(idx));
        }
      });
    };
    for (let r = 0; r < 9; r += 1) {
      addConflicts(Array.from({ length: 9 }, (_, c) => r * 9 + c));
    }
    for (let c = 0; c < 9; c += 1) {
      addConflicts(Array.from({ length: 9 }, (_, r) => r * 9 + c));
    }
    for (let br = 0; br < 3; br += 1) {
      for (let bc = 0; bc < 3; bc += 1) {
        const indices: number[] = [];
        for (let r = 0; r < 3; r += 1) {
          for (let c = 0; c < 3; c += 1) {
            indices.push((br * 3 + r) * 9 + (bc * 3 + c));
          }
        }
        addConflicts(indices);
      }
    }
    return conflicts;
  }, [board]);
  const hasConflicts = conflictSet.size > 0;

  // initial puzzle is deterministic to avoid hydration mismatches

  const setValue = useCallback(
    (index: number, value: number) => {
      if (locked[index]) return;
      setBoard((prev) => {
        const prevVal = prev[index];
        if (prevVal === value) return prev;
        const next = applyMove(prev, locked, index, value);
        setSteps((current) => [
          ...current,
          { index, prev: prevVal, next: value },
        ]);
        return next;
      });
    },
    [locked],
  );

  const undoMove = useCallback(() => {
    setSteps((current) => {
      if (current.length === 0) return current;
      const last = current[current.length - 1];
      setBoard((prev) => {
        const next = prev.slice();
        next[last.index] = last.prev;
        return next;
      });
      setSelection(last.index);
      return current.slice(0, -1);
    });
  }, []);

  const autoSolve = useCallback(() => {
    const solvedBoard = autoSolveSingles(board);
    if (solvedBoard.join("") === board.join("")) return;
    const diffSteps: Step[] = [];
    solvedBoard.forEach((value, index) => {
      if (value !== board[index] && !locked[index]) {
        diffSteps.push({ index, prev: board[index], next: value });
      }
    });
    setBoard(solvedBoard);
    if (diffSteps.length > 0) {
      setSteps((current) => [...current, ...diffSteps]);
    }
  }, [board, locked]);

  const resetBoard = useCallback((stringBoard: string) => {
    const nextBoard = stringToBoard(stringBoard);
    setBoard(nextBoard);
    setLocked(nextBoard.map((value) => value !== 0));
    setSteps([]);
    setSelection(0);
  }, []);

  const handleGenerate = useCallback(() => {
    setGenerateOpen(true);
  }, []);

  const confirmGenerate = useCallback(() => {
    const clues = normalizeClues(Number(generateValue));
    const puzzle = makeRandomPuzzle(clues);
    setBoard(puzzle.board);
    setLocked(puzzle.locked);
    setLoadedBoard(boardToString(puzzle.board));
    setSteps([]);
    setSelection(0);
    setGenerateOpen(false);
  }, [generateValue]);

  const handleLoad = useCallback(() => {
    setLoadError(null);
    setLoadValue("");
    setLoadOpen(true);
  }, []);

  const confirmLoad = useCallback(() => {
    try {
      resetBoard(loadValue.trim());
      setLoadedBoard(loadValue.trim());
      setLoadOpen(false);
      setLoadError(null);
    } catch {
      setLoadError("Invalid board string. Please enter 81 digits (0-9).");
    }
  }, [loadValue, resetBoard]);

  const handleShowString = useCallback(() => {
    setShowBoardOpen(true);
  }, []);

  const handleCopyBoard = useCallback(
    async (value?: string) => {
      const text = value ?? boardString;
      if (navigator?.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          if (copyTimeoutRef.current) {
            clearTimeout(copyTimeoutRef.current);
          }
          copyTimeoutRef.current = setTimeout(() => {
            setCopied(false);
            copyTimeoutRef.current = null;
          }, 1500);
          return;
        } catch {
          // fall through
        }
      }
      setShowBoardOpen(true);
    },
    [boardString],
  );

  const handleResetLoaded = useCallback(() => {
    setResetOpen(true);
  }, []);

  const confirmReset = useCallback(() => {
    resetBoard(loadedBoard);
    setResetOpen(false);
  }, [loadedBoard, resetBoard]);

  const moveSelection = useCallback((dr: number, dc: number) => {
    setSelection((prev) => {
      const { row, col } = indexToRowCol(prev);
      const nextRow = row + dr;
      const nextCol = col + dc;
      if (nextRow < 0 || nextRow > 8 || nextCol < 0 || nextCol > 8) {
        return prev;
      }
      return nextRow * 9 + nextCol;
    });
  }, []);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;
      if (generateOpen || loadOpen || showBoardOpen || resetOpen) return;

      if (event.code === "Escape" && showHelp) {
        event.preventDefault();
        setShowHelp(false);
        return;
      }
      if (event.code === "Space") {
        event.preventDefault();
        autoSolve();
        return;
      }
      if (event.code === "Backspace") {
        event.preventDefault();
        undoMove();
        return;
      }
      if (event.code === "KeyG") {
        event.preventDefault();
        handleGenerate();
        return;
      }
      if (event.code === "KeyH") {
        event.preventDefault();
        setShowHints((value) => !value);
        return;
      }
      if (event.code === "KeyC" && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        handleCopyBoard();
        return;
      }
      if (event.code === "KeyL") {
        event.preventDefault();
        handleLoad();
        return;
      }
      if (event.code === "KeyS") {
        event.preventDefault();
        handleShowString();
        return;
      }
      if (event.code === "KeyR" && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        handleResetLoaded();
        return;
      }
      if (event.code === "Enter") {
        event.preventDefault();
        setShowHelp((value) => !value);
        return;
      }
      if (event.code === "ArrowUp") {
        event.preventDefault();
        moveSelection(-1, 0);
        return;
      }
      if (event.code === "ArrowDown") {
        event.preventDefault();
        moveSelection(1, 0);
        return;
      }
      if (event.code === "ArrowLeft") {
        event.preventDefault();
        moveSelection(0, -1);
        return;
      }
      if (event.code === "ArrowRight") {
        event.preventDefault();
        moveSelection(0, 1);
        return;
      }
      if (event.code === "Escape") {
        event.preventDefault();
        setValue(selection, 0);
        return;
      }

      if (event.code.startsWith("Digit")) {
        event.preventDefault();
        const digit = Number(event.code.slice(5));
        if (digit === 0) {
          setValue(selection, 0);
        } else if (digit >= 1 && digit <= 9) {
          setValue(selection, digit);
        }
        return;
      }
      if (event.code.startsWith("Numpad")) {
        event.preventDefault();
        const digit = Number(event.code.slice(6));
        if (Number.isNaN(digit)) return;
        if (digit === 0) {
          setValue(selection, 0);
        } else if (digit >= 1 && digit <= 9) {
          setValue(selection, digit);
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    autoSolve,
    handleGenerate,
    handleLoad,
    handleResetLoaded,
    handleShowString,
    moveSelection,
    selection,
    generateOpen,
    loadOpen,
    showBoardOpen,
    resetOpen,
    showHelp,
    setValue,
    undoMove,
  ]);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const { row: selectedRow, col: selectedCol } = indexToRowCol(selection);
  const boardStatusClass = solved
    ? "bg-emerald-50 dark:bg-emerald-950/40"
    : isComplete && hasConflicts
      ? "bg-red-50 dark:bg-red-950/40"
      : "bg-background";
  const boardSurfaceClass = solved
    ? "bg-emerald-100 dark:bg-emerald-900/40"
    : isComplete && hasConflicts
      ? "bg-red-100 dark:bg-red-900/40"
      : "bg-card";

  const controlButtonClass =
    "flex min-h-11 w-full min-w-0 items-center justify-between gap-2 rounded-md border border-border bg-background px-3 py-2 text-left text-sm text-foreground shadow-sm transition hover:bg-muted";
  const keyHintClass =
    "rounded-md border border-border bg-card px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground";

  return (
    <div
      className={cn("min-h-screen w-full text-foreground", boardStatusClass)}
    >
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-8 sm:px-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold">Sudoku</h1>
          <p className="text-sm text-muted-foreground">
            Press Return to toggle help. Focus the grid and use your keyboard.
          </p>
        </header>

        <div className="flex flex-col gap-6 lg:flex-row">
          <section className="flex w-full items-center justify-center">
            <div
              className={cn(
                "grid grid-cols-9 gap-0 border border-border shadow-sm",
                boardSurfaceClass,
              )}
              role="grid"
              aria-label="Sudoku board"
            >
              {board.map((value, index) => {
                const { row, col } = indexToRowCol(index);
                const isSelected = index === selection;
                const inSameRow = row === selectedRow;
                const inSameCol = col === selectedCol;
                const inSameBox =
                  Math.floor(row / 3) === Math.floor(selectedRow / 3) &&
                  Math.floor(col / 3) === Math.floor(selectedCol / 3);
                const isHighlighted =
                  !isComplete && (inSameRow || inSameCol || inSameBox);
                const isLocked = locked[index];
                const isError = conflictSet.has(index);
                const hints = showHints ? getAllowedDigits(board, index) : [];

                const borderClasses = [
                  row % 3 === 0 ? "border-t-2" : "border-t",
                  col % 3 === 0 ? "border-l-2" : "border-l",
                  row === 8 ? "border-b-2" : "border-b",
                  col === 8 ? "border-r-2" : "border-r",
                ];

                return (
                  <button
                    key={index}
                    type="button"
                    role="gridcell"
                    aria-selected={isSelected}
                    onClick={() => setSelection(index)}
                    className={cn(
                      "relative flex h-10 w-10 items-center justify-center text-lg",
                      "sm:h-12 sm:w-12 sm:text-xl",
                      "md:h-14 md:w-14 md:text-2xl",
                      "border-zinc-300 transition-colors dark:border-zinc-700",
                      borderClasses,
                      isHighlighted && "bg-emerald-50 dark:bg-emerald-900/30",
                      isSelected && "bg-amber-200 dark:bg-amber-600/40",
                      isError && "bg-rose-200 dark:bg-rose-700/40",
                      isError &&
                        isSelected &&
                        "bg-rose-300 dark:bg-rose-600/50",
                      isLocked && "font-semibold text-foreground",
                      !isLocked && value === 0 && "text-muted-foreground",
                    )}
                  >
                    {value !== 0 ? (
                      value
                    ) : (
                      <div
                        className={cn(
                          "grid h-full w-full grid-cols-3 grid-rows-3 text-[0.5rem] leading-none",
                          "sm:text-[0.6rem] md:text-[0.65rem]",
                          showHints
                            ? "text-muted-foreground"
                            : "text-transparent",
                        )}
                      >
                        {Array.from({ length: 9 }, (_, n) => {
                          const digit = n + 1;
                          return (
                            <span
                              key={digit}
                              className="flex items-center justify-center"
                            >
                              {hints.includes(digit) ? digit : ""}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          <aside
            className={cn(
              "flex flex-col gap-4 rounded-lg border border-border bg-card p-4 shadow-sm",
              solved
                ? "bg-emerald-100/70 dark:bg-emerald-900/20"
                : isComplete && hasConflicts
                  ? "bg-rose-100/70 dark:bg-rose-900/20"
                  : "bg-card",
            )}
          >
            <h2 className="text-lg font-semibold">Controls</h2>
            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
              <span>Hints</span>
              <span className="text-foreground">
                {showHints ? "On" : "Off"}
              </span>
              <span>Status</span>
              <span className="text-foreground">
                {solved
                  ? "Solved"
                  : isComplete
                    ? hasConflicts
                      ? "Complete with errors"
                      : "Complete"
                    : "In progress"}
              </span>
              <span>Errors</span>
              <span className="text-foreground">
                {hasConflicts ? "Yes" : "No"}
              </span>
              <span>Selection</span>
              <span className="text-foreground">{selection + 1}</span>
            </div>
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <button
                type="button"
                className={controlButtonClass}
                onClick={handleGenerate}
              >
                <span className="min-w-0 truncate whitespace-nowrap">
                  Generate puzzle
                </span>
                <kbd className={keyHintClass}>G</kbd>
              </button>
              <button
                type="button"
                className={controlButtonClass}
                onClick={autoSolve}
              >
                <span className="min-w-0 truncate whitespace-nowrap">
                  Auto-solve singles
                </span>
                <kbd className={keyHintClass}>Space</kbd>
              </button>
              <button
                type="button"
                className={controlButtonClass}
                onClick={() => setShowHints((value) => !value)}
              >
                <span className="min-w-0 truncate whitespace-nowrap">
                  Toggle hints
                </span>
                <kbd className={keyHintClass}>H</kbd>
              </button>
              <button
                type="button"
                className={controlButtonClass}
                onClick={() => handleCopyBoard()}
              >
                <span className="min-w-0 truncate whitespace-nowrap">
                  {copied ? "Copied!" : "Copy board"}
                </span>
                <kbd className={keyHintClass}>C</kbd>
              </button>
              <button
                type="button"
                className={controlButtonClass}
                onClick={handleShowString}
              >
                <span className="min-w-0 truncate whitespace-nowrap">
                  Show board
                </span>
                <kbd className={keyHintClass}>S</kbd>
              </button>
              <button
                type="button"
                className={controlButtonClass}
                onClick={handleLoad}
              >
                <span className="min-w-0 truncate whitespace-nowrap">
                  Load board
                </span>
                <kbd className={keyHintClass}>L</kbd>
              </button>
              <button
                type="button"
                className={controlButtonClass}
                onClick={handleResetLoaded}
              >
                <span className="min-w-0 truncate whitespace-nowrap">
                  Reset board
                </span>
                <kbd className={keyHintClass}>R</kbd>
              </button>
            </div>
          </aside>
        </div>
      </div>

      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              confirmGenerate();
            }}
          >
            <DialogHeader>
              <DialogTitle>Generate puzzle</DialogTitle>
              <DialogDescription>
                Choose how many clues to reveal (21-81).
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 grid gap-2">
              <label
                className="text-sm font-medium text-foreground"
                htmlFor="clues"
              >
                Clues
              </label>
              <input
                id="clues"
                type="number"
                min={21}
                max={81}
                value={generateValue}
                onChange={(event) => setGenerateValue(event.target.value)}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground/40"
              />
              <p className="text-xs text-muted-foreground">
                Easiest: 47+ | Easy: 36-46 | Medium: 32-35 | Hard: 28-31 |
                Extremely hard: 21-27
              </p>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <button
                  type="button"
                  className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted"
                >
                  Cancel
                </button>
              </DialogClose>
              <button
                type="submit"
                className="rounded-md bg-foreground px-4 py-2 text-sm text-background hover:bg-foreground/90"
              >
                Generate
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={loadOpen} onOpenChange={setLoadOpen}>
        <DialogContent>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              confirmLoad();
            }}
          >
            <DialogHeader>
              <DialogTitle>Load board</DialogTitle>
              <DialogDescription>
                Paste a string of 81 digits. Use 0 for empty cells.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 grid gap-2">
              <label
                className="text-sm font-medium text-foreground"
                htmlFor="board-input"
              >
                Board string
              </label>
              <textarea
                id="board-input"
                rows={4}
                value={loadValue}
                onChange={(event) => {
                  setLoadValue(event.target.value);
                  if (loadError) setLoadError(null);
                }}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground/40"
                placeholder="81 digits, e.g. 530070000..."
              />
              {loadError && (
                <p className="text-xs text-rose-600 dark:text-rose-400">
                  {loadError}
                </p>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <button
                  type="button"
                  className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted"
                >
                  Cancel
                </button>
              </DialogClose>
              <button
                type="submit"
                className="rounded-md bg-foreground px-4 py-2 text-sm text-background hover:bg-foreground/90"
              >
                Load
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showBoardOpen} onOpenChange={setShowBoardOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Board string</DialogTitle>
            <DialogDescription>
              Copy or share the current board.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 grid gap-2">
            <label
              className="text-sm font-medium text-foreground"
              htmlFor="board-string"
            >
              Current board
            </label>
            <textarea
              id="board-string"
              rows={4}
              value={boardString}
              readOnly
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none"
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <button
                type="button"
                className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted"
              >
                Close
              </button>
            </DialogClose>
            <button
              type="button"
              className="rounded-md bg-foreground px-4 py-2 text-sm text-background hover:bg-foreground/90"
              onClick={() => handleCopyBoard(boardString)}
            >
              {copied ? "Copied!" : "Copy to clipboard"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              confirmReset();
            }}
          >
            <DialogHeader>
              <DialogTitle>Reset board</DialogTitle>
              <DialogDescription>
                This will restore the last loaded puzzle.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <button
                  type="button"
                  className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted"
                >
                  Cancel
                </button>
              </DialogClose>
              <button
                type="submit"
                className="rounded-md bg-foreground px-4 py-2 text-sm text-background hover:bg-foreground/90"
                autoFocus
              >
                Reset
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-6 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-xl border border-border bg-card p-6 text-foreground shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Sudoku</h2>
              <button
                type="button"
                className="rounded-md border border-border px-3 py-1 text-sm hover:bg-muted"
                onClick={() => setShowHelp(false)}
              >
                Close
              </button>
            </div>
            <div className="grid gap-2 text-sm text-muted-foreground">
              {HELP_ITEMS.map(([key, description]) => (
                <div key={key} className="grid grid-cols-[140px_1fr] gap-4">
                  <span className="font-medium text-foreground">{key}</span>
                  <span>{description}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Press Return to toggle this overlay anytime.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
