"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Perceptron,
  activationFunctions,
} from "@/lib/neural-network/Perceptron";
import { NeuralNetwork } from "@/lib/neural-network/NeuralNetwork";

const INITIAL_PERCEPTRON_INPUTS = [0, 0] as number[];
const INITIAL_NETWORK_INPUTS = [0.5, 0.8] as number[];
const INITIAL_HIDDEN_LAYER_SIZE = 3;
const INITIAL_ACTIVATION = "sigmoid";

const OR_TRAINING_DATA: [number[], number][] = [
  [[0, 0], 0],
  [[0, 1], 1],
  [[1, 0], 1],
  [[1, 1], 1],
];

const activationOptions = [
  { value: "sigmoid", label: "Sigmoid" },
  { value: "relu", label: "ReLU" },
  { value: "tanh", label: "Tanh" },
];

function formatVector(values: number[]) {
  return `[${values.map((value) => value.toFixed(3)).join(", ")}]`;
}

export default function NeuralNetworkPage() {
  const [perceptronInputs, setPerceptronInputs] = useState<number[]>(
    INITIAL_PERCEPTRON_INPUTS,
  );
  const [networkInputs, setNetworkInputs] = useState<number[]>(
    INITIAL_NETWORK_INPUTS,
  );
  const [hiddenLayerSize, setHiddenLayerSize] = useState<number>(
    INITIAL_HIDDEN_LAYER_SIZE,
  );
  const [activationFunction, setActivationFunction] =
    useState<string>(INITIAL_ACTIVATION);

  const trainedPerceptron = useMemo(() => {
    const perceptron = new Perceptron(2, activationFunctions.step);
    perceptron.trainBatch(OR_TRAINING_DATA, 100, 0.1);
    return perceptron;
  }, []);

  const perceptronWeights = useMemo(
    () => trainedPerceptron.getWeights(),
    [trainedPerceptron],
  );
  const perceptronBias = useMemo(
    () => trainedPerceptron.getBias(),
    [trainedPerceptron],
  );
  const perceptronOutput = useMemo(
    () => trainedPerceptron.forward(perceptronInputs),
    [perceptronInputs, trainedPerceptron],
  );

  const activationLabel = useMemo(() => {
    return (
      activationOptions.find((option) => option.value === activationFunction)
        ?.label ?? activationFunction
    );
  }, [activationFunction]);

  const network = useMemo(() => {
    const activationFn =
      activationFunction === "relu"
        ? activationFunctions.relu
        : activationFunction === "tanh"
          ? activationFunctions.tanh
          : activationFunctions.sigmoid;

    return new NeuralNetwork(2, [
      { size: hiddenLayerSize, activation: activationFn },
      { size: 1, activation: activationFunctions.sigmoid },
    ]);
  }, [activationFunction, hiddenLayerSize]);

  const networkArchitecture = useMemo(
    () => `2-${hiddenLayerSize}-1`,
    [hiddenLayerSize],
  );

  const networkOutput = useMemo(
    () => network.forward(networkInputs),
    [network, networkInputs],
  );

  const handlePerceptronInputChange = (index: number, value: string) => {
    const nextInputs = [...perceptronInputs];
    nextInputs[index] = Number(value);
    setPerceptronInputs(nextInputs);
  };

  const handleNetworkInputChange = (index: number, value: string) => {
    const nextInputs = [...networkInputs];
    const parsed = Number(value);
    nextInputs[index] = Number.isNaN(parsed)
      ? 0
      : Math.min(1, Math.max(0, parsed));
    setNetworkInputs(nextInputs);
  };

  const handleHiddenLayerSizeChange = (value: string) => {
    const parsed = Number(value);
    const next = Number.isNaN(parsed) ? 1 : Math.max(1, parsed);
    setHiddenLayerSize(next);
  };

  const handleActivationChange = (value: string) => {
    setActivationFunction(value);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12">
        <header className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div>
              <h1 className="text-3xl font-semibold">
                Neural Network Playground
              </h1>
              <p className="text-sm text-muted-foreground">
                Perceptron a vícevrstvá síť v TypeScriptu.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Perceptron</Badge>
            <Badge variant="secondary">Feedforward</Badge>
            <Badge variant="secondary">TypeScript</Badge>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Perceptron Demo (OR)</CardTitle>
              <p className="text-sm text-muted-foreground">
                Jednovrstvý perceptron natrénovaný na logickou operaci OR.
              </p>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs uppercase text-muted-foreground">
                  Trénované parametry
                </p>
                <div className="mt-2 space-y-1 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-muted-foreground">Weights</span>
                    <span className="font-mono">
                      {perceptronWeights.length
                        ? formatVector(perceptronWeights)
                        : "[loading...]"}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-muted-foreground">Bias</span>
                    <span className="font-mono">
                      {perceptronBias.toFixed(3)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="perceptron-input-1">Input 1</Label>
                  <select
                    id="perceptron-input-1"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={perceptronInputs[0]}
                    onChange={(event) =>
                      handlePerceptronInputChange(0, event.target.value)
                    }
                  >
                    <option value="0">0</option>
                    <option value="1">1</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="perceptron-input-2">Input 2</Label>
                  <select
                    id="perceptron-input-2"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={perceptronInputs[1]}
                    onChange={(event) =>
                      handlePerceptronInputChange(1, event.target.value)
                    }
                  >
                    <option value="0">0</option>
                    <option value="1">1</option>
                  </select>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-sm text-muted-foreground">Výstup</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-semibold">
                    {perceptronOutput ?? "–"}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {perceptronInputs[0]} OR {perceptronInputs[1]}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Neural Network Demo</CardTitle>
              <p className="text-sm text-muted-foreground">
                Jednoduchá dopředná síť se skrytou vrstvou.
              </p>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="network-input-1">Input 1 (0-1)</Label>
                  <Input
                    id="network-input-1"
                    type="number"
                    step="0.01"
                    min={0}
                    max={1}
                    value={networkInputs[0]}
                    onChange={(event) =>
                      handleNetworkInputChange(0, event.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="network-input-2">Input 2 (0-1)</Label>
                  <Input
                    id="network-input-2"
                    type="number"
                    step="0.01"
                    min={0}
                    max={1}
                    value={networkInputs[1]}
                    onChange={(event) =>
                      handleNetworkInputChange(1, event.target.value)
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="hidden-layer">Skrytá vrstva</Label>
                  <Input
                    id="hidden-layer"
                    type="number"
                    min={1}
                    max={12}
                    value={hiddenLayerSize}
                    onChange={(event) =>
                      handleHiddenLayerSizeChange(event.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="activation">Aktivační funkce</Label>
                  <select
                    id="activation"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={activationFunction}
                    onChange={(event) =>
                      handleActivationChange(event.target.value)
                    }
                  >
                    {activationOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs uppercase text-muted-foreground">
                  Architektura
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="font-mono text-lg">
                    {networkArchitecture || "2-?-1"}
                  </span>
                  <Badge variant="outline">{activationLabel}</Badge>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-sm text-muted-foreground">Výstup sítě</p>
                <div className="mt-2 text-2xl font-semibold">
                  {networkOutput ? formatVector(networkOutput) : "–"}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Dopředný průchod bez tréninku, váhy jsou náhodné.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
