"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Chart, ChartConfiguration } from "chart.js/auto";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SudokuSolver } from "@/lib/genetic-sudoku/solver";
import { formatBoard, stringToBoard } from "@/lib/genetic-sudoku/utils";
import { SudokuBoard } from "@/lib/genetic-sudoku/types";

const emptyBoard: SudokuBoard = Array.from({ length: 9 }, () =>
  Array.from({ length: 9 }, () => 0),
);

const defaultConfig = {
  populationSize: 100,
  mutationRate: 1,
  generationLimit: 1000,
  elitismCount: 3,
};

function cloneBoard(board: SudokuBoard): SudokuBoard {
  return board.map((row) => row.slice());
}

function boardToDigits(board: SudokuBoard): string {
  return board
    .flat()
    .map((cell) => String(cell))
    .join("");
}

export default function GeneticSudokuPage() {
  const solver = useMemo(() => new SudokuSolver(), []);
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<Chart | null>(null);

  const [config, setConfig] = useState(defaultConfig);
  const [currentBoard, setCurrentBoard] = useState<SudokuBoard>(emptyBoard);
  const [lastLoadedBoard, setLastLoadedBoard] =
    useState<SudokuBoard>(emptyBoard);
  const [solving, setSolving] = useState(false);
  const [status, setStatus] = useState("Not started");
  const [fitness, setFitness] = useState<string>("Not computed yet");
  const [generations, setGenerations] = useState("Generations: 0");
  const [inputBoard, setInputBoard] = useState("");
  const [solution, setSolution] = useState(formatBoard(emptyBoard));
  const [solved, setSolved] = useState(false);

  useEffect(() => {
    if (!chartRef.current || chartInstance.current) return;

    const chartConfig: ChartConfiguration = {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            label: "Max Fitness",
            data: [],
            borderColor: "#3b82f6",
            tension: 0.1,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        animation: false,
        scales: {
          y: {
            type: "logarithmic",
            min: 0.01,
            max: 1,
            reverse: true,
            title: {
              display: true,
              text: "Fitness (inverted log scale)",
            },
            ticks: {
              callback: (value) => (1 - Number(value)).toFixed(2),
            },
          },
          x: {
            title: {
              display: true,
              text: "Generation",
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
        },
      },
    };

    chartInstance.current = new Chart(chartRef.current, chartConfig);

    return () => {
      chartInstance.current?.destroy();
      chartInstance.current = null;
    };
  }, []);

  const resetChart = () => {
    const chart = chartInstance.current;
    if (!chart) return;
    chart.data.labels = [];
    chart.data.datasets[0].data = [];
    chart.update();
  };

  const updateChart = (generation: number, bestFitness: number) => {
    const chart = chartInstance.current;
    if (!chart) return;

    if (generation % 100 === 0) {
      chart.data.labels?.push(generation.toString());
      chart.data.datasets[0].data.push(1 - Math.max(0.01, bestFitness));
      chart.update();
    }
  };

  const handleSolve = async () => {
    setSolving(true);
    setSolved(false);
    setStatus("Solving...");
    setFitness("...");
    setGenerations("Generations: ...");
    setSolution("Calculating...");
    resetChart();

    try {
      solver.updateConfig(config);
      const result = await solver.solve(currentBoard, updateChart);
      setSolution(formatBoard(result.board));
      setFitness(result.fitness.toFixed(2));
      setGenerations(`Generations: ${result.generations}`);
      setStatus(result.solved ? "SOLVED!" : "Not solved");
      setSolved(result.solved);
    } catch (error) {
      alert(error instanceof Error ? error.message : "An error occurred");
      setStatus("Not solved");
    } finally {
      setSolving(false);
    }
  };

  const handleReset = () => {
    const nextBoard = cloneBoard(lastLoadedBoard);
    setCurrentBoard(nextBoard);
    setSolution(formatBoard(nextBoard));
    setFitness("0.00");
    setGenerations("Generations: 0");
    setStatus("Not solved");
    setSolved(false);
    resetChart();
  };

  const handleClear = () => {
    setCurrentBoard(emptyBoard);
    setLastLoadedBoard(emptyBoard);
    setSolution(formatBoard(emptyBoard));
    setFitness("0.00");
    setGenerations("Generations: 0");
    setStatus("Not solved");
    setSolved(false);
    setInputBoard("");
    resetChart();
  };

  const handleCopy = async () => {
    const digits = solution
      .split("\n")
      .map((line) => line.replace(/[^0-9.]/g, ""))
      .join("")
      .replace(/\./g, "0");

    await navigator.clipboard.writeText(digits);
  };

  const handleLoad = () => {
    if (!inputBoard.trim()) return;
    try {
      const board = stringToBoard(inputBoard.trim());
      const boardText = formatBoard(board);
      setCurrentBoard(board);
      setLastLoadedBoard(cloneBoard(board));
      setSolution(boardText);
      setFitness("0.00");
      setGenerations("Generations: 0");
      setStatus("Not solved");
      setSolved(false);
      resetChart();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Invalid input");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-10 pl-16 pr-6 pt-14 text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div>
          <h1 className="text-3xl font-semibold">
            Genetic Algorithm Sudoku Solver
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Experiment with genetic algorithm parameters and watch the solver
            evolve a Sudoku solution.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="populationSize">Population Size</Label>
                <Input
                  id="populationSize"
                  type="number"
                  min={10}
                  max={1000}
                  step={10}
                  value={config.populationSize}
                  disabled={solving}
                  onChange={(event) =>
                    setConfig((prev) => ({
                      ...prev,
                      populationSize: Number(event.target.value),
                    }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="mutationRate">Mutation Rate</Label>
                <Input
                  id="mutationRate"
                  type="number"
                  min={0.001}
                  max={0.1}
                  step={0.001}
                  value={config.mutationRate}
                  disabled={solving}
                  onChange={(event) =>
                    setConfig((prev) => ({
                      ...prev,
                      mutationRate: Number(event.target.value),
                    }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="generationLimit">Generation Limit</Label>
                <Input
                  id="generationLimit"
                  type="number"
                  min={100}
                  max={10000}
                  step={100}
                  value={config.generationLimit}
                  disabled={solving}
                  onChange={(event) =>
                    setConfig((prev) => ({
                      ...prev,
                      generationLimit: Number(event.target.value),
                    }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="elitismCount">Elitism Count</Label>
                <Input
                  id="elitismCount"
                  type="number"
                  min={1}
                  max={100}
                  step={1}
                  value={config.elitismCount}
                  disabled={solving}
                  onChange={(event) =>
                    setConfig((prev) => ({
                      ...prev,
                      elitismCount: Number(event.target.value),
                    }))
                  }
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <Button onClick={handleSolve} disabled={solving}>
                  {solving ? "Solving…" : "Solve"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleReset}
                  disabled={solving}
                >
                  Reset
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleClear}
                  disabled={solving}
                >
                  Clear
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCopy}
                  disabled={solving}
                >
                  Copy Board
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex items-center gap-2">
                <Badge variant={solved ? "default" : "secondary"}>
                  {status}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {generations}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                Fitness: {fitness}
              </div>
              <pre className="rounded-lg border border-border bg-card p-4 text-sm">
                {solution}
              </pre>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Load Board</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Textarea
              placeholder="Paste 81 digits (0 for empty cells)"
              value={inputBoard}
              disabled={solving}
              onChange={(event) => setInputBoard(event.target.value)}
              rows={3}
            />
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleLoad} disabled={solving}>
                Load Board
              </Button>
              <span className="text-xs text-muted-foreground">
                Current board: {boardToDigits(currentBoard)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fitness Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[320px]">
              <canvas ref={chartRef} className="h-full w-full" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Architecture</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              This page is built on two layers to keep the project clear and
              reusable:
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong className="text-foreground">Genetic Core</strong> — a
                clean, reusable TypeScript implementation of genetic algorithms.
              </li>
              <li>
                <strong className="text-foreground">Sudoku Example</strong> — a
                concrete demo that wires the core into a Sudoku solver.
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
