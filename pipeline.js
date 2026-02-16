// ----------------------------
// Step 1: Placeholder Functions
// ----------------------------

// Placeholder for Anjum's heuristic function
const suspiciousWords = [
    "login", "verify", "verification", "account", "update", "secure",
    "security", "bank", "signin", "confirm", "password", "credential",
    "wallet", "payment", "alert", "support", "service", "unlock",
    "recover", "reset"
];

function calculateRisk(url) {
    let score = 0;

    if (url.length > 75)
        score += 10;

    if (url.includes("@"))
        score += 20;

    const ipPattern = /(\d{1,3}\.){3}\d{1,3}/;

    if (ipPattern.test(url))
        score += 30;

    suspiciousWords.forEach(word => {
        if (url.toLowerCase().includes(word))
            score += 15;
    });

    return score;
}

function getRiskLevel(score) {
    if (score >= 50)
        return "Dangerous";
    else if (score >= 20)
        return "Suspicious";
    else
        return "Safe";
}

function heuristic(url) {
    console.log("Heuristic called for URL:", url);

    const score = calculateRisk(url);      // calls Anjum's function
    const risk = getRiskLevel(score);      // gets risk level

    return { score, risk };                // return as object
}

// Placeholder for Aparna's ML prediction function
function mlPredict(url) {
    console.log("ML Predict called for URL:", url);
    return 0; // temporary score
}

// Placeholder for Nikita's display function
function displayIndicators(scores) {
    console.log("Display Indicators called with scores:", scores);
    // Eventually, this will inject green/yellow/red dots
}

// Function to simulate URL extraction and pipeline
function testPipeline(url) {
    console.log("Pipeline started for URL:", url);

    const heuristicResult = heuristic(url);  // {score, risk}
    const mlResult = mlPredict(url);         // {score, risk}

    const combinedScores = {
        heuristic: heuristicResult,
        ml: mlResult
    };

    displayIndicators(combinedScores);
}
// Example test runs - this will trigger your pipeline for these URLs
testPipeline("https://example.com");
testPipeline("https://secure-login.bank.com/update");
testPipeline("http://192.168.0.1/verify");
