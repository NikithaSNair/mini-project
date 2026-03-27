// Score Fusion Algorithm & Warning System
let currentAnalysis = null;

async function getCombinedSafetyScore(urlStr) {
  const heuristicResult = window.NoPhishHeuristic.calculateRisk(urlStr);
  
  // If it's a trusted domain, skip ML and DOM penalties to avoid false positives
  const isTrusted = heuristicResult.reasons.includes('Trusted domain (Heuristic)');
  
  let mlResult = { penalty: 0, reasons: [] };
  let domResult = { penalty: 0, reasons: [] };
  
  if (!isTrusted) {
    mlResult = await window.NoPhishCloudAI.analyzeWithCloudAI(urlStr);
    domResult = window.NoPhishDOM.analyzeDOM();
  }

  // We no longer reduce DOM penalties based on URL safety. 
  // If the pre-navigation missed a clever phishing URL, the DOM analysis MUST stand on its own to catch it.
  
  const totalPenalty = heuristicResult.penalty + mlResult.penalty + domResult.penalty;
  const allReasons = [...heuristicResult.reasons, ...mlResult.reasons, ...domResult.reasons];

  // Safety Score: Max 99, 0 is worst
  let safetyScore = Math.min(99, Math.max(0, 100 - totalPenalty));

  let finalRisk = 'safe';
  if (safetyScore < 50) finalRisk = 'danger';
  else if (safetyScore < 80) finalRisk = 'warning';

  currentAnalysis = { score: safetyScore, risk: finalRisk, reasons: allReasons };
  return currentAnalysis;
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getAnalysis") {
    if (currentAnalysis) {
      sendResponse(currentAnalysis);
    } else {
      sendResponse({ status: "analyzing" });
    }
  }
});

// Search Result Indicators
async function injectSearchIndicators() {
  const searchResults = document.querySelectorAll('a[href^="http"]');
  
  for (const link of searchResults) {
    const h3 = link.querySelector('h3');
    if (!h3) continue;

    if (link.hasAttribute('data-nophish-checked')) continue;
    link.setAttribute('data-nophish-checked', 'true');

    // For search results, we only use Heuristic + ML (Pre-navigation)
    const heuristicResult = window.NoPhishHeuristic.calculateRisk(link.href);
    const isTrusted = heuristicResult.reasons.includes('Trusted domain (Heuristic)');
    
    let mlResult = { penalty: 0, reasons: [] };
    if (!isTrusted) {
      mlResult = await window.NoPhishCloudAI.analyzeWithCloudAI(link.href);
    }
    
    const penalty = heuristicResult.penalty + mlResult.penalty;
    let safetyScore = Math.min(99, Math.max(0, 100 - penalty));
    
    let risk = 'safe';
    if (safetyScore < 50) risk = 'danger';
    else if (safetyScore < 80) risk = 'warning';
    
    const dot = document.createElement('span');
    dot.className = `nophish-score-badge nophish-${risk}`;
    dot.title = `NoPhish Safety Score: ${safetyScore}/100\n${[...heuristicResult.reasons, ...mlResult.reasons].join(', ')}`;
    
    if (risk === 'danger') {
      dot.innerHTML = '🔴';
    } else if (risk === 'warning') {
      dot.innerHTML = '🟡';
    } else {
      dot.innerHTML = '🟢';
    }
    
    h3.parentNode.insertBefore(dot, h3);
  }
}

// Warning System
function showWarningOverlay(result) {
  if (document.getElementById('nophish-warning-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'nophish-warning-overlay';
  
  const modal = document.createElement('div');
  modal.className = 'nophish-warning-modal';
  
  const title = document.createElement('h1');
  title.textContent = 'Hold on! This site might not be safe.';
  
  const message = document.createElement('p');
  message.textContent = 'We noticed some unusual things about this website that could put your information at risk. It is usually best to close this page.';
  
  const details = document.createElement('div');
  details.className = 'nophish-details';
  details.innerHTML = `
    <div style="font-size: 24px; font-weight: bold; color: #ef4444; margin-bottom: 10px;">
      Safety Score: ${result.score}/100
    </div>
    <strong>Why are we seeing this?</strong>
    <ul>${result.reasons.map(r => `<li>${r}</li>`).join('')}</ul>
  `;
  
  const goBackButton = document.createElement('button');
  goBackButton.textContent = 'Take me back to safety';
  goBackButton.onclick = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = 'https://www.google.com';
    }
  };

  const proceedButton = document.createElement('button');
  proceedButton.textContent = 'I understand the risks, continue';
  proceedButton.className = 'nophish-proceed-btn';
  proceedButton.onclick = () => {
    overlay.remove();
  };
  
  modal.appendChild(title);
  modal.appendChild(message);
  modal.appendChild(details);
  modal.appendChild(goBackButton);
  modal.appendChild(proceedButton);
  overlay.appendChild(modal);
  
  document.body.appendChild(overlay);
}

async function init() {
  console.log('🛡️ NoPhish Extension is active on this page.');

  if (window.location.search.includes('test_nophish=danger')) {
    console.log('⚠️ NoPhish: Test mode activated via URL parameter.');
    currentAnalysis = { score: 15, risk: 'danger', reasons: ['Test mode activated via URL parameter', 'Simulated advanced detection'] };
    showWarningOverlay(currentAnalysis);
    return;
  }

  // Always analyze the current page so the popup has data
  const result = await getCombinedSafetyScore(window.location.href);
  
  if (result.score < 50) {
    console.log(`⚠️ NoPhish: Danger detected!`, result);
    showWarningOverlay(result);
  } else {
    console.log(`✅ NoPhish: Page is ${result.risk}. Safety Score: ${result.score}/100`);
  }

  // If it's a Google search page, also inject indicators into the search results
  if (window.location.hostname.includes('google.com') && window.location.pathname === '/search') {
    await injectSearchIndicators();
    const observer = new MutationObserver(() => injectSearchIndicators());
    observer.observe(document.body, { childList: true, subtree: true });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
