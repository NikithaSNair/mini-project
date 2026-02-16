const suspiciousWords = [

    "login",
    "verify",
    "verification",
    "account",
    "update",
    "secure",
    "security",
    "bank",
    "signin",
    "confirm",
    "password",
    "credential",
    "wallet",
    "payment",
    "alert",
    "support",
    "service",
    "unlock",
    "recover",
    "reset"

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

export { calculateRisk, getRiskLevel };

