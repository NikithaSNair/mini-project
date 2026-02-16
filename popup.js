// popup.js
// Handles the popup interface logic

console.log('NoPhish popup loaded');

// Load statistics when popup opens
document.addEventListener('DOMContentLoaded', async () => {
  await loadStatistics();
  await analyzeCurrentPage();
  setupEventListeners();
});

/**
 * Load and display extension statistics
 */
async function loadStatistics() {
  try {
    // Get statistics from background script
    const response = await chrome.runtime.sendMessage({ action: 'getStats' });
    
    if (response && !response.error) {
      // Update the display
      document.getElementById('totalScans').textContent = response.totalScans || 0;
      document.getElementById('threatsBlocked').textContent = response.threatsDetected || 0;
    }
  } catch (error) {
    console.error('Error loading statistics:', error);
    document.getElementById('totalScans').textContent = '0';
    document.getElementById('threatsBlocked').textContent = '0';
  }
}

/**
 * Analyze the current active tab
 */
async function analyzeCurrentPage() {
  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || !tab.url) {
      showPageResult('Unable to analyze this page', 'neutral');
      return;
    }
    
    // Skip chrome:// and extension pages
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      showPageResult('System page - no analysis needed', 'neutral');
      return;
    }
    
    // Analyze URL using our heuristic function
    const analysis = analyzeURL(tab.url);
    
    // Display result
    showPageResult(analysis);
    
  } catch (error) {
    console.error('Error analyzing current page:', error);
    showPageResult('Error analyzing page', 'neutral');
  }
}

/**
 * Display page analysis result
 */
function showPageResult(analysis) {
  const container = document.getElementById('currentPageAnalysis');
  
  if (typeof analysis === 'string') {
    // Simple message
    container.innerHTML = `<p class="loading">${analysis}</p>`;
    return;
  }
  
  // Full analysis result
  let icon, statusText, statusClass;
  
  if (analysis.risk === 'safe') {
    icon = '✅';
    statusText = 'Safe';
    statusClass = 'safe';
  } else if (analysis.risk === 'suspicious') {
    icon = '⚠️';
    statusText = 'Suspicious';
    statusClass = 'suspicious';
  } else {
    icon = '🚨';
    statusText = 'Dangerous';
    statusClass = 'danger';
  }
  
  container.innerHTML = `
    <div class="page-result">
      <div class="page-result-icon">${icon}</div>
      <div class="page-result-info">
        <div class="page-result-status ${statusClass}">${statusText}</div>
        <div class="page-result-score">Risk Score: ${analysis.score}/100</div>
      </div>
    </div>
  `;
}

/**
 * Simple URL analysis function (copied from content.js)
 */
function analyzeURL(url) {
  let score = 0;
  let features = {};
  
  try {
    const urlObj = new URL(url);
    
    // URL length
    if (url.length > 75) {
      score += 10;
    }
    
    // IP address
    const ipPattern = /^https?:\/\/(\d{1,3}\.){3}\d{1,3}/;
    if (ipPattern.test(url)) {
      score += 30;
    }
    
    // @ symbol
    if (url.includes('@')) {
      score += 20;
    }
    
    // Suspicious keywords
    const keywords = ['verify', 'account', 'update', 'confirm', 'login', 'bank', 'secure'];
    let keywordCount = 0;
    keywords.forEach(k => {
      if (url.toLowerCase().includes(k)) keywordCount++;
    });
    score += keywordCount * 5;
    
    // Subdomains
    const subdomains = urlObj.hostname.split('.');
    if (subdomains.length > 3) {
      score += 15;
    }
    
    // HTTPS
    if (urlObj.protocol !== 'https:') {
      score += 20;
    }
    
    score = Math.min(score, 100);
    
    let risk;
    if (score < 30) risk = 'safe';
    else if (score < 60) risk = 'suspicious';
    else risk = 'danger';
    
    return { score, risk };
    
  } catch (error) {
    return { score: 50, risk: 'suspicious' };
  }
}

/**
 * Setup event listeners for buttons
 */
function setupEventListeners() {
  // Scan button
  document.getElementById('scanButton').addEventListener('click', async () => {
    const button = document.getElementById('scanButton');
    const originalText = button.innerHTML;
    
    // Show loading state
    button.innerHTML = '⏳ Scanning...';
    button.disabled = true;
    
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab && tab.url) {
      // Inject content script to scan the page
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
        
        // Re-analyze after a moment
        setTimeout(async () => {
          await analyzeCurrentPage();
          button.innerHTML = originalText;
          button.disabled = false;
        }, 1000);
        
      } catch (error) {
        console.error('Error scanning:', error);
        button.innerHTML = '❌ Scan Failed';
        setTimeout(() => {
          button.innerHTML = originalText;
          button.disabled = false;
        }, 2000);
      }
    }
  });
  
  // Report button
  document.getElementById('reportButton').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab && tab.url) {
      const confirmed = confirm(`Report this site as phishing?\n\n${tab.url}`);
      
      if (confirmed) {
        // Send report to background
        chrome.runtime.sendMessage({
          action: 'reportThreat',
          url: tab.url,
          threatData: {
            reportedBy: 'user',
            timestamp: Date.now()
          }
        });
        
        alert('Thank you! This site has been reported.');
      }
    }
  });
}

console.log('Popup script initialized');