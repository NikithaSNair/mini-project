// content.js
// Team NoPhish - Phishing Detection Extension
// Main detection and UI logic

console.log('NoPhish content script loaded!');

// Detect if we're on Google search page
const isGoogleSearchPage = window.location.href.includes('google.com/search');

if (isGoogleSearchPage) {
  console.log('Google search page detected - will inject indicators');
  initializeSearchPageMonitoring();
} else {
  console.log('Regular website detected - will scan for threats');
  initializeWebsiteScanning();
}

// ============================================
// GOOGLE SEARCH - INJECT INDICATORS
// Nikitha's responsibility
// ============================================

function initializeSearchPageMonitoring() {
  const observer = new MutationObserver(() => {
    const searchResults = document.querySelectorAll('div.g');
    if (searchResults.length > 0) {
      console.log(`Found ${searchResults.length} search results`);
      injectIndicatorsIntoSearchResults();
      observer.disconnect();
    }
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
  setTimeout(() => injectIndicatorsIntoSearchResults(), 1000);
}

function injectIndicatorsIntoSearchResults() {
  const searchResults = document.querySelectorAll('div.g');
  console.log(`Processing ${searchResults.length} search results...`);
  
  searchResults.forEach((result, index) => {
    if (result.querySelector('.nophish-indicator')) return;
    
    const linkElement = result.querySelector('a[href]');
    if (!linkElement) return;
    
    const url = linkElement.href;
    if (url.includes('google.com') || url.startsWith('#')) return;
    
    const titleElement = result.querySelector('h3');
    if (!titleElement) return;
    
    console.log(`Analyzing URL ${index + 1}: ${url}`);
    
    try {
      const analysis = analyzeURL(url);
      const indicator = createIndicatorElement(analysis);
      
      titleElement.style.display = 'inline-flex';
      titleElement.style.alignItems = 'center';
      titleElement.insertBefore(indicator, titleElement.firstChild);
      
      console.log(`✓ Indicator: ${analysis.risk} (${analysis.score})`);
    } catch (error) {
      console.error(`Error:`, error);
    }
  });
}

function createIndicatorElement(analysis) {
  const container = document.createElement('span');
  container.style.display = 'inline-flex';
  container.style.alignItems = 'center';
  container.style.marginRight = '8px';
  
  const dot = document.createElement('span');
  dot.className = 'nophish-indicator';
  
  let tooltipText;
  if (analysis.risk === 'safe') {
    tooltipText = `✓ Safe - Score: ${analysis.score}/100`;
    dot.classList.add('nophish-safe');
  } else if (analysis.risk === 'suspicious') {
    tooltipText = `⚠ Suspicious - Score: ${analysis.score}/100`;
    dot.classList.add('nophish-suspicious');
  } else {
    tooltipText = `✗ Dangerous - Score: ${analysis.score}/100`;
    dot.classList.add('nophish-danger');
  }
  
  dot.setAttribute('title', tooltipText);
  dot.style.cursor = 'help';
  container.appendChild(dot);
  return container;
}

// ============================================
// WEBSITE SCANNING
// Nikitha's responsibility
// ============================================

function initializeWebsiteScanning() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scanCurrentWebsite);
  } else {
    scanCurrentWebsite();
  }
}

function scanCurrentWebsite() {
  console.log('Scanning:', window.location.href);
  
  const urlAnalysis = analyzeURL(window.location.href);
  console.log('URL Analysis:', urlAnalysis);
  
  const domThreats = analyzeDOMThreats();
  console.log('DOM Threats:', domThreats);
  
  const combinedScore = (urlAnalysis.score + domThreats.threatScore) / 2;
  
  let shouldWarn = false;
  let warningLevel = 'low';
  
  if (combinedScore > 60 || domThreats.threatLevel === 'high') {
    shouldWarn = true;
    warningLevel = 'high';
  } else if (combinedScore > 40 || domThreats.threatLevel === 'medium') {
    shouldWarn = true;
    warningLevel = 'medium';
  }
  
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

function showWarningPopup(threatData) {
  if (document.querySelector('.nophish-warning-overlay')) return;
  
  console.log('🚨 Showing warning popup');
  
  const overlay = document.createElement('div');
  overlay.className = 'nophish-warning-overlay';
  
  const warningBox = document.createElement('div');
  warningBox.className = 'nophish-warning-box';
  
  const icon = document.createElement('div');
  icon.className = 'nophish-warning-icon';
  icon.textContent = threatData.warningLevel === 'high' ? '🚨' : '⚠️';
  
  const title = document.createElement('div');
  title.className = 'nophish-warning-title';
  title.textContent = threatData.warningLevel === 'high' 
    ? '⛔ DANGER: Phishing Site Detected!'
    : '⚠️ WARNING: Suspicious Website';
  
  const message = document.createElement('div');
  message.className = 'nophish-warning-message';
  message.textContent = threatData.warningLevel === 'high'
    ? 'This website has been identified as potentially malicious. Your personal information may be at risk.'
    : 'This website shows suspicious characteristics. Proceed with caution.';
  
  const details = document.createElement('div');
  details.className = 'nophish-warning-details';
  
  const threatList = threatData.threats && threatData.threats.length > 0
    ? `<ul style="margin: 8px 0; padding-left: 20px;">
        ${threatData.threats.map(t => `<li>${t.message}</li>`).join('')}
       </ul>`
    : '<p>No specific threats detected, but risk score is elevated.</p>';
  
  details.innerHTML = `
    <p><strong>URL:</strong> ${threatData.url}</p>
    <p><strong>Risk Score:</strong> ${Math.round(threatData.combinedScore)}/100</p>
    <p><strong>URL Analysis:</strong> ${threatData.urlScore}/100</p>
    <p><strong>DOM Analysis:</strong> ${threatData.domScore}/100</p>
    <p><strong>Detected Issues:</strong></p>
    ${threatList}
  `;
  
  const buttons = document.createElement('div');
  buttons.className = 'nophish-warning-buttons';
  
  const goBackBtn = document.createElement('button');
  goBackBtn.className = 'nophish-btn nophish-btn-danger';
  goBackBtn.textContent = '← Go Back (Recommended)';
  goBackBtn.onclick = () => window.history.back();
  
  const proceedBtn = document.createElement('button');
  proceedBtn.className = 'nophish-btn nophish-btn-secondary';
  proceedBtn.textContent = 'Proceed Anyway';
  proceedBtn.onclick = () => {
    overlay.remove();
    chrome.runtime.sendMessage({
      action: 'reportThreat',
      url: threatData.url,
      threatData: threatData
    });
  };
  
  buttons.appendChild(goBackBtn);
  buttons.appendChild(proceedBtn);
  
  warningBox.appendChild(icon);
  warningBox.appendChild(title);
  warningBox.appendChild(message);
  warningBox.appendChild(details);
  warningBox.appendChild(buttons);
  overlay.appendChild(warningBox);
  document.body.appendChild(overlay);
  
  chrome.runtime.sendMessage({
    action: 'reportThreat',
    url: threatData.url,
    threatData: threatData
  }).catch(err => console.error('Report failed:', err));
}

// ============================================
// HEURISTIC ANALYSIS
// Anjum's responsibility
// ============================================

function analyzeURL(url) {
  let score = 0;
  let features = {};
  
  try {
    const urlObj = new URL(url);
    
    features.urlLength = url.length;
    if (url.length > 75) {
      score += 10;
      features.longURL = true;
    }
    
    const ipPattern = /^https?:\/\/(\d{1,3}\.){3}\d{1,3}/;
    if (ipPattern.test(url)) {
      score += 30;
      features.hasIP = true;
    }
    
    if (url.includes('@')) {
      score += 20;
      features.hasAtSymbol = true;
    }
    
    const suspiciousKeywords = [
      'verify', 'account', 'update', 'confirm', 'login', 
      'bank', 'secure', 'suspended', 'locked', 'unusual',
      'paypal', 'amazon', 'apple', 'microsoft', 'netflix'
    ];
    
    let keywordCount = 0;
    suspiciousKeywords.forEach(keyword => {
      if (url.toLowerCase().includes(keyword)) keywordCount++;
    });
    
    if (keywordCount > 0) {
      score += keywordCount * 5;
      features.suspiciousKeywords = keywordCount;
    }
    
    const subdomains = urlObj.hostname.split('.');
    if (subdomains.length > 3) {
      score += 15;
      features.excessiveSubdomains = true;
    }
    
    if (urlObj.protocol !== 'https:') {
      score += 20;
      features.noHTTPS = true;
    }
    
    const hostname = urlObj.hostname;
    const dashCount = (hostname.match(/-/g) || []).length;
    const underscoreCount = (hostname.match(/_/g) || []).length;
    if (dashCount > 3 || underscoreCount > 2) {
      score += 10;
      features.excessiveSeparators = true;
    }
    
    score = Math.min(score, 100);
    
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
// DOM THREAT DETECTION
// Nikitha + Aparna's responsibility
// ============================================

function analyzeDOMThreats() {
  const threats = [];
  let threatScore = 0;
  
  console.log('🔍 DOM threat analysis...');
  
  try {
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
    
    const scripts = document.querySelectorAll('script[src]');
    let suspiciousScripts = 0;
    const suspiciousTLDs = ['.ru', '.cn', '.tk', '.ml', '.ga', '.cf', '.gq'];
    
    scripts.forEach(script => {
      const src = script.getAttribute('src');
      if (src) {
        const isSuspicious = suspiciousTLDs.some(tld => src.includes(tld));
        if (isSuspicious) suspiciousScripts++;
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
    
  } catch (error) {
    console.error('DOM analysis error:', error);
  }
  
  threatScore = Math.min(threatScore, 100);
  const threatLevel = threatScore > 60 ? 'high' : (threatScore > 30 ? 'medium' : 'low');
  
  console.log(`✓ DOM analysis: Score ${threatScore}/100, Level: ${threatLevel}`);
  
  return { threats, threatScore, threatLevel };
}

console.log('NoPhish initialized!');