/**
 * Perceptron implementation in TypeScript.
 *
 * A perceptron is the simplest form of a neural network, consisting of:
 * - Input values
 * - Weights for each input
 * - A bias
 * - An activation function
 */

export type ActivationFunction = (x: number) => number;

// Common activation functions.
export const activationFunctions = {
  // Step function (binary output).
  step: (x: number): number => (x >= 0 ? 1 : 0),

  // Sigmoid function (smooth, differentiable).
  sigmoid: (x: number): number => 1 / (1 + Math.exp(-x)),

  // ReLU (Rectified Linear Unit).
  relu: (x: number): number => Math.max(0, x),

  // Tanh (hyperbolic tangent).
  tanh: (x: number): number => Math.tanh(x),
};

export class Perceptron {
  private weights: number[];
  private bias: number;
  private activation: ActivationFunction;

  /**
   * Create a new perceptron.
   * @param inputSize Number of input features
   * @param activation Activation function to use
   */
  constructor(
    inputSize: number,
    activation: ActivationFunction = activationFunctions.step,
  ) {
    // Initialize weights randomly between -1 and 1.
    this.weights = Array(inputSize)
      .fill(0)
      .map(() => Math.random() * 2 - 1);

    // Initialize bias randomly between -1 and 1.
    this.bias = Math.random() * 2 - 1;

    this.activation = activation;
  }

  /**
   * Forward pass - compute the output for given inputs.
   */
  forward(inputs: number[]): number {
    if (inputs.length !== this.weights.length) {
      throw new Error(
        `Expected ${this.weights.length} inputs, but got ${inputs.length}`,
      );
    }

    const weightedSum = inputs.reduce(
      (sum, input, i) => sum + input * this.weights[i],
      this.bias,
    );

    return this.activation(weightedSum);
  }

  /**
   * Train the perceptron with a single example.
   */
  train(inputs: number[], target: number, learningRate: number = 0.1): number {
    const prediction = this.forward(inputs);
    const error = target - prediction;

    this.weights = this.weights.map(
      (weight, i) => weight + learningRate * error * inputs[i],
    );
    this.bias = this.bias + learningRate * error;

    return error;
  }

  /**
   * Train the perceptron on multiple examples for a number of epochs.
   */
  trainBatch(
    trainingData: [number[], number][],
    epochs: number = 1000,
    learningRate: number = 0.1,
  ): number[] {
    const errors: number[] = [];

    for (let epoch = 0; epoch < epochs; epoch += 1) {
      let epochError = 0;

      for (const [inputs, target] of trainingData) {
        const error = this.train(inputs, target, learningRate);
        epochError += Math.abs(error);
      }

      errors.push(epochError / trainingData.length);
    }

    return errors;
  }

  getWeights(): number[] {
    return [...this.weights];
  }

  getBias(): number {
    return this.bias;
  }

  setWeights(weights: number[]): void {
    if (weights.length !== this.weights.length) {
      throw new Error(
        `Expected ${this.weights.length} weights, but got ${weights.length}`,
      );
    }
    this.weights = [...weights];
  }

  setBias(bias: number): void {
    this.bias = bias;
  }
}
