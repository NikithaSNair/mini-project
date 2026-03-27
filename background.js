// background.js - Background service worker

chrome.runtime.onInstalled.addListener(() => {
  console.log('NoPhish extension installed successfully!');
  chrome.storage.local.set({
    extensionEnabled: true,
    threatDatabase: {},
    scanCount: 0
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzeURL') {
    handleURLAnalysis(request.url)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }
  if (request.action === 'reportThreat') {
    handleThreatReport(request.url, request.threatData)
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }
  if (request.action === 'updateStats') {
    updateScanStatistics(request.result);
    sendResponse({ success: true });
  }
  if (request.action === 'getStats') {
    getStatistics()
      .then(stats => sendResponse(stats))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }
});

async function handleURLAnalysis(url) {
  try {
    const cached = await checkCache(url);
    if (cached) return cached;

    // Placeholder: Call content/pipeline for analysis (stubbed for 50%)
    const result = {
      url: url,
      risk: 'safe',
      score: Math.random() * 20, // Mock low score
      cached: false,
      timestamp: Date.now()
    };

    await cacheResult(url, result);
    return result;
  } catch (error) {
    console.error('Error in handleURLAnalysis:', error);
    throw error;
  }
}

async function handleThreatReport(url, threatData) {
  try {
    const storage = await chrome.storage.local.get('threatDatabase');
    const threatDB = storage.threatDatabase || {};
    threatDB[url] = {
      ...threatData,
      reportedAt: Date.now(),
      reportCount: (threatDB[url]?.reportCount || 0) + 1
    };
    await chrome.storage.local.set({ threatDatabase: threatDB });
    console.log('Threat reported:', url);
  } catch (error) {
    console.error('Error reporting threat:', error);
    throw error;
  }
}

async function updateScanStatistics(result) {
  try {
    const storage = await chrome.storage.local.get(['scanCount']);
    const scanCount = (storage.scanCount || 0) + 1;
    await chrome.storage.local.set({ scanCount: scanCount });
  } catch (error) {
    console.error('Error updating statistics:', error);
  }
}

async function getStatistics() {
  try {
    const storage = await chrome.storage.local.get(['scanCount', 'threatDatabase']);
    const threatDB = storage.threatDatabase || {};
    const threatCount = Object.keys(threatDB).length;
    return {
      totalScans: storage.scanCount || 0,
      threatsDetected: threatCount,
      lastScan: Date.now()
    };
  } catch (error) {
    console.error('Error getting statistics:', error);
    throw error;
  }
}

async function checkCache(url) {
  try {
    const cacheKey = `cache_${url}`;
    const storage = await chrome.storage.local.get(cacheKey);
    const cached = storage[cacheKey];
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
      cached.cached = true;
      return cached;
    }
    return null;
  } catch (error) {
    console.error('Error checking cache:', error);
    return null;
  }
}

async function cacheResult(url, result) {
  try {
    const cacheKey = `cache_${url}`;
    await chrome.storage.local.set({ [cacheKey]: result });
  } catch (error) {
    console.error('Error caching result:', error);
  }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.log('Page loaded:', tab.url);
  }
});

console.log('NoPhish background service worker running...');