// heuristic.js

const suspiciousWords = [
    "login", "verify", "verification", "account", "update", "secure",
    "security", "bank", "signin", "confirm", "password", "credential",
    "wallet", "payment", "alert", "support", "service", "unlock",
    "recover", "reset", "click", "here", "free", "offer", "win", "prize", "bonus",
    "urgent", "immediately", "limited", "exclusive", "deal", "discount",
    "cheap", "bargain", "save", "guarantee", "risk-free", "trial","money-back", "pay"
];

export function calculateRisk(url) {
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

export function getRiskLevel(score) {
    if (score >= 50)
        return "Dangerous";
    else if (score >= 20)
        return "Suspicious";
    else
        return "Safe";
}

export function heuristic(url) {
    console.log("Heuristic called for URL:", url);

    const score = calculateRisk(url);      // calls calculateRisk function
    const risk = getRiskLevel(score);      // gets risk level

    return { score, risk };                // return as object
}