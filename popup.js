/* ============================================
   NIKITHA'S FILE - Popup Logic
   Handles popup interface interactions
   ============================================ */

console.log('NoPhish popup loaded');

// Load statistics when popup opens
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Popup opened, initializing...');
  
  try {
    await loadStatistics();
    await analyzeCurrentPage();
    setupEventListeners();
    console.log('✓ Popup initialized successfully');
  } catch (error) {
    console.error('Error during initialization:', error);
  }
});

/**
 * Load and display extension statistics
 */
async function loadStatistics() {
  try {
    console.log('Loading statistics...');
    
    // Get statistics from background script
    const response = await chrome.runtime.sendMessage({ action: 'getStats' });
    
    if (response && !response.error) {
      // Animate the numbers
      animateNumber('totalScans', response.totalScans || 0);
      animateNumber('threatsBlocked', response.threatsDetected || 0);
      
      console.log('✓ Statistics loaded:', response);
    } else {
      console.error('Error in stats response:', response);
      document.getElementById('totalScans').textContent = '0';
      document.getElementById('threatsBlocked').textContent = '0';
    }
  } catch (error) {
    console.error('Error loading statistics:', error);
    document.getElementById('totalScans').textContent = '0';
    document.getElementById('threatsBlocked').textContent = '0';
  }
}

/**
 * Animate number counting up
 */
function animateNumber(elementId, targetNumber) {
  const element = document.getElementById(elementId);
  const duration = 1000; // 1 second
  const steps = 20;
  const increment = targetNumber / steps;
  let current = 0;
  let step = 0;
  
  const timer = setInterval(() => {
    step++;
    current += increment;
    
    if (step >= steps) {
      element.textContent = targetNumber;
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(current);
    }
  }, duration / steps);
}

/**
 * Analyze the current active tab
 */
async function analyzeCurrentPage() {
  try {
    console.log('Analyzing current page...');
    
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || !tab.url) {
      showPageResult('Unable to analyze this page', 'neutral');
      console.log('No valid tab found');
      return;
    }
    
    console.log('Current tab URL:', tab.url);
    
    // Skip chrome:// and extension pages
    if (tab.url.startsWith('chrome://') || 
        tab.url.startsWith('chrome-extension://') ||
        tab.url.startsWith('edge://')) {
      showPageResult('System page - no analysis needed', 'neutral');
      console.log('System page detected, skipping analysis');
      return;
    }
    
    // Skip new tab pages
    if (tab.url === 'about:blank' || tab.url.includes('newtab')) {
      showPageResult('New tab - no content to analyze', 'neutral');
      return;
    }
    
    // Analyze URL using our heuristic function
    const analysis = analyzeURL(tab.url);
    console.log('Analysis result:', analysis);
    
    // Display result
    showPageResult(analysis);
    
  } catch (error) {
    console.error('Error analyzing current page:', error);
    showPageResult('Error analyzing page', 'neutral');
  }
}

/**
 * Display page analysis result with enhanced UI
 */
function showPageResult(analysis) {
  const container = document.getElementById('currentPageAnalysis');
  
  if (typeof analysis === 'string') {
    // Simple message
    container.innerHTML = `<p class="loading">${analysis}</p>`;
    return;
  }
  
  // Full analysis result
  let icon, statusText, statusClass, statusEmoji;
  
  if (analysis.risk === 'safe') {
    icon = '✅';
    statusText = 'Safe';
    statusClass = 'safe';
    statusEmoji = '🟢';
  } else if (analysis.risk === 'suspicious') {
    icon = '⚠️';
    statusText = 'Suspicious';
    statusClass = 'suspicious';
    statusEmoji = '🟡';
  } else {
    icon = '🚨';
    statusText = 'Dangerous';
    statusClass = 'danger';
    statusEmoji = '🔴';
  }
  
  // Create result with animation
  container.innerHTML = `
    <div class="page-result" style="animation: fadeIn 0.5s ease;">
      <div class="page-result-icon">${icon}</div>
      <div class="page-result-info">
        <div class="page-result-status ${statusClass}">
          ${statusEmoji} ${statusText}
        </div>
        <div class="page-result-score">Risk Score: ${analysis.score}/100</div>
      </div>
    </div>
  `;
  
  console.log('✓ Page result displayed:', statusText, analysis.score);
}

/**
 * Simple URL analysis function (copied from content.js)
 */
function analyzeURL(url) {
  let score = 0;
  let features = {};
  
  try {
    const urlObj = new URL(url);
    
    // URL length check
    if (url.length > 75) {
      score += 10;
      features.longURL = true;
    }
    
    // IP address check
    const ipPattern = /^https?:\/\/(\d{1,3}\.){3}\d{1,3}/;
    if (ipPattern.test(url)) {
      score += 30;
      features.hasIP = true;
    }
    
    // @ symbol check
    if (url.includes('@')) {
      score += 20;
      features.hasAtSymbol = true;
    }
    
    // Suspicious keywords
    const keywords = [
      'verify', 'account', 'update', 'confirm', 'login', 
      'bank', 'secure', 'suspended', 'locked', 'unusual',
      'paypal', 'amazon', 'apple', 'microsoft'
    ];
    
    let keywordCount = 0;
    keywords.forEach(k => {
      if (url.toLowerCase().includes(k)) keywordCount++;
    });
    score += keywordCount * 5;
    features.suspiciousKeywords = keywordCount;
    
    // Subdomains check
    const subdomains = urlObj.hostname.split('.');
    if (subdomains.length > 3) {
      score += 15;
      features.excessiveSubdomains = true;
    }
    
    // HTTPS check
    if (urlObj.protocol !== 'https:') {
      score += 20;
      features.noHTTPS = true;
    }
    
    // Cap at 100
    score = Math.min(score, 100);
    
    // Determine risk level
    let risk;
    if (score < 30) risk = 'safe';
    else if (score < 60) risk = 'suspicious';
    else risk = 'danger';
    
    return { score, risk, features };
    
  } catch (error) {
    console.error('Error in analyzeURL:', error);
    return { score: 50, risk: 'suspicious', features: {} };
  }
}

/**
 * Setup event listeners for buttons
 */
function setupEventListeners() {
  console.log('Setting up event listeners...');
  
  // Scan button
  const scanButton = document.getElementById('scanButton');
  if (!scanButton) {
    console.error('Scan button not found!');
    return;
  }
  
  scanButton.addEventListener('click', async () => {
    console.log('Scan button clicked');
    
    const originalText = scanButton.innerHTML;
    
    // Show loading state
    scanButton.innerHTML = '⏳ Scanning...';
    scanButton.disabled = true;
    
    try {
      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab && tab.url) {
        console.log('Injecting content script into tab:', tab.id);
        
        // Inject content script to scan the page
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
        
        // Show success feedback
        scanButton.innerHTML = '✓ Scan Complete!';
        
        // Re-analyze after a moment
        setTimeout(async () => {
          await analyzeCurrentPage();
          scanButton.innerHTML = originalText;
          scanButton.disabled = false;
        }, 1500);
        
        console.log('✓ Scan completed successfully');
        
      } else {
        throw new Error('No valid tab found');
      }
      
    } catch (error) {
      console.error('Error during scan:', error);
      scanButton.innerHTML = '❌ Scan Failed';
      
      setTimeout(() => {
        scanButton.innerHTML = originalText;
        scanButton.disabled = false;
      }, 2000);
    }
  });
  
  // Report button
  const reportButton = document.getElementById('reportButton');
  if (!reportButton) {
    console.error('Report button not found!');
    return;
  }
  
  reportButton.addEventListener('click', async () => {
    console.log('Report button clicked');
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab && tab.url) {
      // Skip system pages
      if (tab.url.startsWith('chrome://') || 
          tab.url.startsWith('chrome-extension://') ||
          tab.url.startsWith('edge://')) {
        alert('Cannot report system pages');
        return;
      }
      
      const confirmed = confirm(
        `⚠️ Report this site as phishing?\n\n` +
        `URL: ${tab.url}\n\n` +
        `This will help improve NoPhish detection.`
      );
      
      if (confirmed) {
        console.log('User confirmed report for:', tab.url);
        
        // Send report to background
        chrome.runtime.sendMessage({
          action: 'reportThreat',
          url: tab.url,
          threatData: {
            reportedBy: 'user',
            timestamp: Date.now(),
            manualReport: true
          }
        }).then(() => {
          alert('✓ Thank you! This site has been reported.');
          console.log('✓ Report submitted successfully');
        }).catch(error => {
          console.error('Error submitting report:', error);
          alert('❌ Failed to submit report. Please try again.');
        });
      }
    } else {
      alert('No valid page to report');
    }
  });
  
  console.log('✓ Event listeners set up successfully');
}

console.log('Popup script initialized successfully');