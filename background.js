// background.js
// Background service worker that runs continuously
// Handles communication between different parts of the extension

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('NoPhish extension installed successfully!');
  
  // Initialize storage with default settings
  chrome.storage.local.set({
    extensionEnabled: true,
    threatDatabase: {},
    scanCount: 0
  });
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  
  // Handle URL analysis request
  if (request.action === 'analyzeURL') {
    handleURLAnalysis(request.url)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ error: error.message }));
    return true; // Keep channel open for async response
  }
  
  // Handle threat report
  if (request.action === 'reportThreat') {
    handleThreatReport(request.url, request.threatData)
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }
  
  // Handle scan statistics update
  if (request.action === 'updateStats') {
    updateScanStatistics(request.result);
    sendResponse({ success: true });
  }
  
  // Handle get statistics request
  if (request.action === 'getStats') {
    getStatistics()
      .then(stats => sendResponse(stats))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }
});

/**
 * Handles URL analysis by coordinating heuristic and ML detection
 * @param {string} url - URL to analyze
 * @returns {Promise<object>} - Analysis result
 */
async function handleURLAnalysis(url) {
  try {
    // Check if URL was recently analyzed (cache)
    const cached = await checkCache(url);
    if (cached) {
      return cached;
    }
    
    // In a real implementation, this would:
    // 1. Call heuristic analysis
    // 2. Call ML model prediction
    // 3. Combine results
    // 4. Cache the result
    
    // For now, return a placeholder
    const result = {
      url: url,
      risk: 'safe',
      score: 0,
      cached: false,
      timestamp: Date.now()
    };
    
    // Cache the result
    await cacheResult(url, result);
    
    return result;
  } catch (error) {
    console.error('Error in handleURLAnalysis:', error);
    throw error;
  }
}

/**
 * Handles threat reporting and updates threat database
 * @param {string} url - Threatening URL
 * @param {object} threatData - Threat details
 */
async function handleThreatReport(url, threatData) {
  try {
    const storage = await chrome.storage.local.get('threatDatabase');
    const threatDB = storage.threatDatabase || {};
    
    // Add or update threat entry
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

/**
 * Updates scan statistics
 * @param {object} result - Scan result
 */
async function updateScanStatistics(result) {
  try {
    const storage = await chrome.storage.local.get(['scanCount', 'threatDatabase']);
    const scanCount = (storage.scanCount || 0) + 1;
    
    await chrome.storage.local.set({ scanCount: scanCount });
  } catch (error) {
    console.error('Error updating statistics:', error);
  }
}

/**
 * Gets extension statistics
 * @returns {Promise<object>} - Statistics object
 */
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
    return { error: error.message };
  }
}

/**
 * Checks if URL analysis is cached
 * @param {string} url - URL to check
 * @returns {Promise<object|null>} - Cached result or null
 */
async function checkCache(url) {
  try {
    const cacheKey = `cache_${url}`;
    const storage = await chrome.storage.local.get(cacheKey);
    const cached = storage[cacheKey];
    
    if (cached) {
      // Check if cache is still valid (5 minutes)
      const age = Date.now() - cached.timestamp;
      if (age < 5 * 60 * 1000) {
        cached.cached = true;
        return cached;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error checking cache:', error);
    return null;
  }
}

/**
 * Caches URL analysis result
 * @param {string} url - URL analyzed
 * @param {object} result - Analysis result
 */
async function cacheResult(url, result) {
  try {
    const cacheKey = `cache_${url}`;
    await chrome.storage.local.set({ [cacheKey]: result });
  } catch (error) {
    console.error('Error caching result:', error);
  }
}

// Listen for tab updates to potentially scan new pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.log('Page loaded:', tab.url);
    // Could trigger automatic scan here
  }
});

console.log('NoPhish background service worker running...');