import {
  ActivationFunction,
  Perceptron,
  activationFunctions,
} from "./Perceptron";

/**
 * Layer configuration for the neural network.
 */
export interface LayerConfig {
  size: number;
  activation: ActivationFunction;
}

/**
 * A simple feedforward neural network built from perceptrons.
 */
export class NeuralNetwork {
  private layers: Perceptron[][];
  private layerSizes: number[];

  /**
   * Create a new neural network.
   * @param inputSize Number of input features
   * @param layerConfigs Array of layer configurations (size and activation)
   */
  constructor(inputSize: number, layerConfigs: LayerConfig[]) {
    this.layerSizes = [inputSize, ...layerConfigs.map((config) => config.size)];
    this.layers = [];

    for (let i = 0; i < layerConfigs.length; i += 1) {
      const layerConfig = layerConfigs[i];
      const prevLayerSize = this.layerSizes[i];
      const currentLayerSize = layerConfig.size;

      const layer: Perceptron[] = [];
      for (let j = 0; j < currentLayerSize; j += 1) {
        layer.push(new Perceptron(prevLayerSize, layerConfig.activation));
      }

      this.layers.push(layer);
    }
  }

  /**
   * Forward pass through the network.
   */
  forward(inputs: number[]): number[] {
    if (inputs.length !== this.layerSizes[0]) {
      throw new Error(
        `Expected ${this.layerSizes[0]} inputs, but got ${inputs.length}`,
      );
    }

    let currentOutputs = inputs;

    for (const layer of this.layers) {
      const nextOutputs: number[] = [];

      for (const perceptron of layer) {
        nextOutputs.push(perceptron.forward(currentOutputs));
      }

      currentOutputs = nextOutputs;
    }

    return currentOutputs;
  }

  /**
   * Train the network using a simplified loop (no backpropagation).
   */
  train(
    trainingData: [number[], number[]][],
    epochs: number = 1000,
    _learningRate: number = 0.1,
  ): number[] {
    const errors: number[] = [];

    for (let epoch = 0; epoch < epochs; epoch += 1) {
      let totalError = 0;

      for (const [inputs, targets] of trainingData) {
        const outputs = this.forward(inputs);

        const error =
          outputs.reduce(
            (sum, output, i) => sum + Math.pow(targets[i] - output, 2),
            0,
          ) / outputs.length;

        totalError += error;
      }

      errors.push(totalError / trainingData.length);
    }

    return errors;
  }

  getArchitecture(): string {
    return this.layerSizes.join("-");
  }
}

/**
 * Helper function to create a simple neural network for classification.
 */
export function createClassifier(
  inputSize: number,
  hiddenLayerSizes: number[] = [4],
  outputSize: number = 1,
): NeuralNetwork {
  const layerConfigs: LayerConfig[] = [
    ...hiddenLayerSizes.map((size) => ({
      size,
      activation: activationFunctions.relu,
    })),
    {
      size: outputSize,
      activation: activationFunctions.sigmoid,
    },
  ];

  return new NeuralNetwork(inputSize, layerConfigs);
}
