const fs = require('fs');
const csv = require('csv-parser');
const { RandomForestClassifier } = require('ml-random-forest');

const X_train = [];
const Y_train = [];

// ==========================================
// 1. FEATURE EXTRACTION (The Math)
// ==========================================
function extractFeatures(url) {
    const lowerUrl = String(url).toLowerCase();
    const length = lowerUrl.length;
    const numDots = (lowerUrl.match(/\./g) || []).length;
    const numHyphens = (lowerUrl.match(/-/g) || []).length;
    const numSlashes = (lowerUrl.match(/\//g) || []).length;
    const hasIp = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/.test(lowerUrl) ? 1 : 0;
    const isHttps = lowerUrl.startsWith('https') ? 1 : 0;
    
    const badWords = ['login', 'verify', 'update', 'secure', 'account', 'auth', 'billing', 'refund'];
    const hasBadWord = badWords.some(word => lowerUrl.includes(word)) ? 1 : 0;
    
    return [length, numDots, numHyphens, numSlashes, hasIp, isHttps, hasBadWord];
}

console.log("⏳ Reading massive dataset from dataset.csv...");

// ==========================================
// 2. READ THE CSV FILE
// ==========================================
fs.createReadStream('dataset.csv')
  .pipe(csv())
  .on('data', (row) => {
      // Datasets use different column names. We check for the most common ones.
      const url = row.url || row.URL || row.domain || row.Domain;
      const labelStr = row.label || row.Label || row.status || row.type || row.Result;

      if (url && labelStr !== undefined) {
          const features = extractFeatures(url);
          
          // Convert the label to 0 (Safe) or 1 (Phishing)
          let label = 0;
          const str = String(labelStr).toLowerCase();
          if (str === 'bad' || str === '1' || str === 'phishing' || str === 'malicious') {
              label = 1;
          }
          
          X_train.push(features);
          Y_train.push(label);
      }
  })
  .on('end', () => {
      console.log(`✅ Successfully loaded ${X_train.length} URLs from the dataset!`);
      
      if (X_train.length === 0) {
          console.log("❌ ERROR: Could not find any URLs. Check your CSV column names.");
          return;
      }

      // ==========================================
      // 3. TRAIN THE MASSIVE MODEL
      // ==========================================
      console.log("⏳ Training Random Forest (This might take a minute for large datasets)...");
      
      const rf = new RandomForestClassifier({
          seed: 42,
          maxFeatures: 3,
          replacement: false,
          nEstimators: 100 // 100 Trees
      });

      rf.train(X_train, Y_train);

      // Save the massive brain to disk
      const modelJson = rf.toJSON();
      fs.writeFileSync('pretrained_model.json', JSON.stringify(modelJson));

      console.log("🎉 MASSIVE Model successfully trained and saved to 'pretrained_model.json'!");
      console.log("👉 You can now run 'node server.js' to use your new super-smart AI.");
  });