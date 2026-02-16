import * as tf from '@tensorflow/tfjs';

let model = null;


// -------------------------------
// LOAD MODEL
// -------------------------------
export async function loadModel() {
    try {
        const modelPath = chrome.runtime.getURL('model/model.json');
        model = await tf.loadLayersModel(modelPath);
        console.log("Model loaded successfully.");
    } catch (error) {
        console.error("Error loading model:", error);
    }
}


// -------------------------------
// REAL ML PREDICTION
// -------------------------------
export function predict(features) {

    if (!model) {
        console.warn("Model not loaded. Using simulated prediction.");
        return simulatedPredict(features);
    }

    const inputTensor = tf.tensor2d([[
        features.passwordFields,
        features.scripts,
        features.hiddenForms
    ]]);

    const predictionTensor = model.predict(inputTensor);

    const prediction = predictionTensor.dataSync()[0];

    // Clean memory
    inputTensor.dispose();
    predictionTensor.dispose();

    return prediction; // probability (0–1)
}


// -------------------------------
// SIMULATED ML (Fallback)
// -------------------------------
export function simulatedPredict(features) {

    let score =
        features.passwordFields * 2 +
        features.scripts * 0.5 +
        features.hiddenForms * 3;

    return 1 / (1 + Math.exp(-score));
}


// -------------------------------
// FINAL SCORE COMBINATION
// -------------------------------
export function finalScore(heuristicScore, mlProbability) {

    const mlScore = mlProbability * 100;

    return (0.5 * heuristicScore) +
           (0.5 * mlScore);
}


// -------------------------------
// CLASSIFICATION
// -------------------------------
export function classify(score) {

    if (score < 40) return "Safe";
    if (score < 70) return "Suspicious";
    return "Dangerous";
}
