// content.js
// This is Nikitha's primary working file!
// Runs on Google search pages and all websites
// Responsible for: indicator injection, warning popups, DOM scanning

console.log('NoPhish content script loaded!');

// ============================================
// PART 1: DETECT IF WE'RE ON GOOGLE SEARCH
// ============================================

const isGoogleSearchPage = window.location.href.includes('google.com/search');

if (isGoogleSearchPage) {
  console.log('Google search page detected - will inject indicators');
  initializeSearchPageMonitoring();
} else {
  console.log('Regular website detected - will scan for threats');
  initializeWebsiteScanning();
}

// ============================================
// PART 2: GOOGLE SEARCH PAGE - INJECT INDICATORS
// (This is YOUR primary task, Nikitha!)
// ============================================

function initializeSearchPageMonitoring() {
  // Wait for search results to load
  const observer = new MutationObserver(() => {
    const searchResults = document.querySelectorAll('div.g');
    if (searchResults.length > 0) {
      console.log(`Found ${searchResults.length} search results`);
      injectIndicatorsIntoSearchResults();
      observer.disconnect();
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Also try immediately in case results are already loaded
  setTimeout(() => {
    injectIndicatorsIntoSearchResults();
  }, 1000);
}

/**
 * NIKITHA'S MAIN FUNCTION: Inject colored indicators beside search results
 * This function finds all Google search results and adds colored dots
 */
function injectIndicatorsIntoSearchResults() {
  // Google search results are in <div class="g"> elements
  const searchResults = document.querySelectorAll('div.g');
  
  console.log(`Processing ${searchResults.length} search results...`);
  
  searchResults.forEach((result, index) => {
    // Check if we already added an indicator
    if (result.querySelector('.nophish-indicator')) {
      return; // Skip if already processed
    }
    
    // Find the link element (the actual URL)
    const linkElement = result.querySelector('a[href]');
    if (!linkElement) return;
    
    const url = linkElement.href;
    
    // Find the title element to inject indicator beside it
    const titleElement = result.querySelector('h3');
    if (!titleElement) return;
    
    console.log(`Analyzing URL ${index + 1}: ${url}`);
    
    // Analyze the URL using heuristic analysis
    const analysis = analyzeURLForIndicator(url);
    
    // Create the indicator element
    const indicator = createIndicatorElement(analysis);
    
    // Inject the indicator beside the title
    titleElement.style.display = 'inline-flex';
    titleElement.style.alignItems = 'center';
    titleElement.insertBefore(indicator, titleElement.firstChild);
    
    console.log(`Indicator injected for ${url}: ${analysis.risk}`);
  });
}

/**
 * Analyzes URL and returns risk assessment
 * Uses heuristic.js functions
 */
function analyzeURLForIndicator(url) {
  // Call the heuristic analysis function
  const heuristicResult = analyzeURL(url);
  
  // For now, we'll use just heuristic score
  // Later, Aditya will integrate ML model here
  
  return {
    risk: heuristicResult.risk,
    score: heuristicResult.score,
    features: heuristicResult.features
  };
}

/**
 * Creates the visual indicator element (green/yellow/red dot)
 * @param {object} analysis - Analysis result with risk level
 * @returns {HTMLElement} - The indicator element
 */
function createIndicatorElement(analysis) {
  const container = document.createElement('span');
  container.style.display = 'inline-flex';
  container.style.alignItems = 'center';
  container.style.marginRight = '8px';
  
  // Create the colored dot
  const dot = document.createElement('span');
  dot.className = 'nophish-indicator';
  
  // Set color based on risk level
  if (analysis.risk === 'safe') {
    dot.classList.add('nophish-safe');
    dot.title = '✓ Safe - Score: ' + analysis.score;
  } else if (analysis.risk === 'suspicious') {
    dot.classList.add('nophish-suspicious');
    dot.title = '⚠ Suspicious - Score: ' + analysis.score;
  } else {
    dot.classList.add('nophish-danger');
    dot.title = '✗ Dangerous - Score: ' + analysis.score;
  }
  
  container.appendChild(dot);
  return container;
}

// ============================================
// PART 3: REGULAR WEBSITES - SCAN FOR THREATS
// (This is YOUR second task, Nikitha!)
// ============================================

function initializeWebsiteScanning() {
  // Wait for page to fully load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scanCurrentWebsite);
  } else {
    scanCurrentWebsite();
  }
}

/**
 * Scans the current website for threats
 * Combines URL analysis and DOM threat detection
 */
function scanCurrentWebsite() {
  console.log('Scanning website:', window.location.href);
  
  // Step 1: Analyze the URL
  const urlAnalysis = analyzeURL(window.location.href);
  console.log('URL Analysis:', urlAnalysis);
  
  // Step 2: Scan DOM for threats (Aparna's function)
  const domThreats = analyzeDOMThreats();
  console.log('DOM Threats:', domThreats);
  
  // Step 3: Combine scores
  const combinedScore = (urlAnalysis.score + domThreats.threatScore) / 2;
  
  // Step 4: Determine if we should show warning
  let shouldWarn = false;
  let warningLevel = 'low';
  
  if (combinedScore > 60 || domThreats.threatLevel === 'high') {
    shouldWarn = true;
    warningLevel = 'high';
  } else if (combinedScore > 40 || domThreats.threatLevel === 'medium') {
    shouldWarn = true;
    warningLevel = 'medium';
  }
  
  // Step 5: Show warning popup if needed
  if (shouldWarn) {
    showWarningPopup({
      url: window.location.href,
      urlScore: urlAnalysis.score,
      domScore: domThreats.threatScore,
      combinedScore: combinedScore,
      threats: domThreats.threats,
      warningLevel: warningLevel
    });
  }
}

/**
 * NIKITHA'S MAIN FUNCTION: Show warning popup overlay
 * This creates and displays the warning popup when a threat is detected
 */
function showWarningPopup(threatData) {
  // Check if popup already exists
  if (document.querySelector('.nophish-warning-overlay')) {
    return; // Don't show multiple popups
  }
  
  console.log('Showing warning popup for:', threatData);
  
  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'nophish-warning-overlay';
  
  // Create warning box
  const warningBox = document.createElement('div');
  warningBox.className = 'nophish-warning-box';
  
  // Warning icon
  const icon = document.createElement('div');
  icon.className = 'nophish-warning-icon';
  icon.textContent = '⚠️';
  
  // Warning title
  const title = document.createElement('div');
  title.className = 'nophish-warning-title';
  title.textContent = threatData.warningLevel === 'high' 
    ? '🚨 DANGER: Phishing Site Detected!'
    : '⚠️ WARNING: Suspicious Website';
  
  // Warning message
  const message = document.createElement('div');
  message.className = 'nophish-warning-message';
  message.textContent = threatData.warningLevel === 'high'
    ? 'This website has been identified as potentially malicious. Your personal information may be at risk.'
    : 'This website shows suspicious characteristics. Proceed with caution.';
  
  // Details section
  const details = document.createElement('div');
  details.className = 'nophish-warning-details';
  details.innerHTML = `
    <p><strong>URL:</strong> ${threatData.url}</p>
    <p><strong>Risk Score:</strong> ${Math.round(threatData.combinedScore)}/100</p>
    <p><strong>URL Analysis Score:</strong> ${threatData.urlScore}/100</p>
    <p><strong>DOM Threat Score:</strong> ${threatData.domScore}/100</p>
    <p><strong>Threats Found:</strong></p>
    <ul style="margin: 5px 0; padding-left: 20px;">
      ${threatData.threats.map(t => `<li>${t.message}</li>`).join('')}
    </ul>
  `;
  
  // Buttons
  const buttons = document.createElement('div');
  buttons.className = 'nophish-warning-buttons';
  
  const goBackBtn = document.createElement('button');
  goBackBtn.className = 'nophish-btn nophish-btn-danger';
  goBackBtn.textContent = '← Go Back (Recommended)';
  goBackBtn.onclick = () => {
    window.history.back();
  };
  
  const proceedBtn = document.createElement('button');
  proceedBtn.className = 'nophish-btn nophish-btn-secondary';
  proceedBtn.textContent = 'Proceed Anyway (Not Recommended)';
  proceedBtn.onclick = () => {
    overlay.remove();
  };
  
  buttons.appendChild(goBackBtn);
  buttons.appendChild(proceedBtn);
  
  // Assemble everything
  warningBox.appendChild(icon);
  warningBox.appendChild(title);
  warningBox.appendChild(message);
  warningBox.appendChild(details);
  warningBox.appendChild(buttons);
  
  overlay.appendChild(warningBox);
  
  // Add to page
  document.body.appendChild(overlay);
  
  // Report threat to background script
  chrome.runtime.sendMessage({
    action: 'reportThreat',
    url: threatData.url,
    threatData: threatData
  });
}

// ============================================
// HELPER FUNCTIONS - ANJUM'S HEURISTIC CODE (integrated from her push)
// ============================================

/**
 * ANJUM'S FUNCTION: Analyzes URL for phishing indicators
 * This uses heuristic rules to detect suspicious URLs
 */
function analyzeURL(url) {
  let score = 0;
  let features = {};
  
  try {
    const urlObj = new URL(url);
    
    // Feature 1: URL length check
    features.urlLength = url.length;
    if (url.length > 75) {
      score += 10;
      features.longURL = true;
    }
    
    // Feature 2: IP address check (phishing sites often use IPs)
    const ipPattern = /^https?:\/\/(\d{1,3}\.){3}\d{1,3}/;
    if (ipPattern.test(url)) {
      score += 30;
      features.hasIP = true;
    }
    
    // Feature 3: @ symbol check (hides real domain)
    if (url.includes('@')) {
      score += 20;
      features.hasAtSymbol = true;
    }
    
    // Feature 4: Suspicious keywords check
    const suspiciousKeywords = [
      'verify', 'account', 'update', 'confirm', 'login', 
      'bank', 'secure', 'suspended', 'locked', 'unusual',
      'paypal', 'amazon', 'apple', 'microsoft', 'netflix'
    ];
    
    let keywordCount = 0;
    suspiciousKeywords.forEach(keyword => {
      if (url.toLowerCase().includes(keyword)) {
        keywordCount++;
      }
    });
    
    if (keywordCount > 0) {
      score += keywordCount * 5;
      features.suspiciousKeywords = keywordCount;
    }
    
    // Feature 5: Excessive subdomains check
    const subdomains = urlObj.hostname.split('.');
    if (subdomains.length > 3) {
      score += 15;
      features.excessiveSubdomains = true;
    }
    
    // Feature 6: HTTPS check (legitimate sites use HTTPS)
    if (urlObj.protocol !== 'https:') {
      score += 20;
      features.noHTTPS = true;
    }
    
    // Feature 7: Dash/underscore check
    const hostname = urlObj.hostname;
    const dashCount = (hostname.match(/-/g) || []).length;
    const underscoreCount = (hostname.match(/_/g) || []).length;
    if (dashCount > 3 || underscoreCount > 2) {
      score += 10;
      features.excessiveSeparators = true;
    }
    
    // Cap score at 100
    score = Math.min(score, 100);
    
    // Determine risk level
    let risk;
    if (score < 30) risk = 'safe';
    else if (score < 60) risk = 'suspicious';
    else risk = 'danger';
    
    return { score, features, risk };
    
  } catch (error) {
    console.error('Error analyzing URL:', error);
    return { score: 50, features: { malformedURL: true }, risk: 'suspicious' };
  }
}

// ============================================
// YOUR FUNCTION (NIKITHA): DOM Threat Detection
// ============================================

/**
 * NIKITHA'S FUNCTION: Scans the page DOM for suspicious elements
 * This is part of your responsibility - detecting threats in the page structure
 */
function analyzeDOMThreats() {
  const threats = [];
  let threatScore = 0;
  
  // Check 1: Password fields (medium threat)
  const passwordFields = document.querySelectorAll('input[type="password"]');
  if (passwordFields.length > 0) {
    threats.push({
      type: 'password_field',
      count: passwordFields.length,
      severity: 'medium',
      message: `${passwordFields.length} password field(s) detected`
    });
    threatScore += 20;
  }
  
  // Check 2: Hidden forms (high threat - could be stealing data)
  const hiddenForms = document.querySelectorAll('form[style*="display: none"], form[style*="display:none"], form[hidden]');
  if (hiddenForms.length > 0) {
    threats.push({
      type: 'hidden_form',
      count: hiddenForms.length,
      severity: 'high',
      message: `${hiddenForms.length} hidden form(s) - possible data theft`
    });
    threatScore += 35;
  }
  
  // Check 3: Forms submitting to external domains
  const forms = document.querySelectorAll('form[action]');
  let externalForms = 0;
  const currentDomain = window.location.hostname;
  
  forms.forEach(form => {
    const action = form.getAttribute('action');
    if (action && action.startsWith('http') && !action.includes(currentDomain)) {
      externalForms++;
    }
  });
  
  if (externalForms > 0) {
    threats.push({
      type: 'external_form_submit',
      count: externalForms,
      severity: 'high',
      message: `${externalForms} form(s) submitting to external sites`
    });
    threatScore += 40;
  }
  
  // Check 4: Multiple iframes (possible clickjacking)
  const iframes = document.querySelectorAll('iframe');
  if (iframes.length > 3) {
    threats.push({
      type: 'multiple_iframes',
      count: iframes.length,
      severity: 'medium',
      message: `${iframes.length} iframes - possible clickjacking`
    });
    threatScore += 15;
  }
  
  // Check 5: External scripts from suspicious domains
  const scripts = document.querySelectorAll('script[src]');
  let suspiciousScripts = 0;
  scripts.forEach(script => {
    const src = script.getAttribute('src');
    // Check for scripts from unusual TLDs or suspicious patterns
    if (src && (src.includes('.ru') || src.includes('.cn') || src.includes('unknown') || src.includes('.tk'))) {
      suspiciousScripts++;
    }
  });
  
  if (suspiciousScripts > 0) {
    threats.push({
      type: 'suspicious_scripts',
      count: suspiciousScripts,
      severity: 'high',
      message: `${suspiciousScripts} script(s) from suspicious domains`
    });
    threatScore += 30;
  }
  
  // Cap threat score at 100
  threatScore = Math.min(threatScore, 100);
  
  return {
    threats: threats,
    threatScore: threatScore,
    threatLevel: threatScore > 60 ? 'high' : (threatScore > 30 ? 'medium' : 'low')
  };
}

console.log('NoPhish content script initialized!');