import { calculateRisk, getRiskLevel } from './heuristic.js';


const testUrls = [

    "https://google.com",

    "http://192.168.1.1/login",

    "https://paypal-secure-login.com",

    "https://example.com",

    "http://verify-account-bank.com"

];

testUrls.forEach(url => {

    const score = calculateRisk(url);

    const level = getRiskLevel(score);

    console.log("\nURL:", url);

    console.log("Score:", score);

    console.log("Risk Level:", level);

});
