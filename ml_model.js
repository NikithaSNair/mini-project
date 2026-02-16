// ml_model.js
// This file simulates ML model prediction for phishing detection
// Aparna's primary responsibility

/**
 * Simulates ML model prediction based on URL features
 * In a real implementation, this would use a trained model (TensorFlow.js, ONNX, etc.)
 * @param {object} features - Feature object from heuristic.js
 * @returns {object} - { prediction: string, confidence: number, mlScore: number }
 */
function predictPhishing(features) {
  // This simulates a trained ML model's decision-making process
  // In reality, you would load a pre-trained model and run inference
  
  let mlScore = 0;
  let confidence = 0;
  
  // Weighted scoring based on features (simulating ML model weights)
  if (features.url_length) {
    if (features.url_length > 100) mlScore += 25;
    else if (features.url_length > 75) mlScore += 15;
    else if (features.url_length > 50) mlScore += 5;
  }
  
  if (features.has_ip) mlScore += 35;
  if (features.has_at_symbol) mlScore += 30;
  if (features.has_double_slash) mlScore += 20;
  
  if (features.subdomain_count) {
    mlScore += features.subdomain_count * 8;
  }
  
  if (!features.is_https) mlScore += 25;
  
  if (features.digit_count > 10) mlScore += 15;
  if (features.special_char_count > 15) mlScore += 10;
  
  // Cap at 100
  mlScore = Math.min(mlScore, 100);
  
  // Calculate confidence (higher score = higher confidence in phishing)
  if (mlScore > 70) {
    confidence = 0.85 + (Math.random() * 0.15); // 85-100%
  } else if (mlScore > 40) {
    confidence = 0.65 + (Math.random() * 0.20); // 65-85%
  } else {
    confidence = 0.50 + (Math.random() * 0.15); // 50-65%
  }
  
  // Determine prediction
  let prediction;
  if (mlScore < 35) {
    prediction = 'safe';
  } else if (mlScore < 65) {
    prediction = 'suspicious';
  } else {
    prediction = 'danger';
  }
  
  return {
    prediction: prediction,
    confidence: Math.round(confidence * 100),
    mlScore: mlScore
  };
}

/**
 * Combines heuristic and ML scores for final decision
 * @param {number} heuristicScore - Score from heuristic analysis
 * @param {number} mlScore - Score from ML prediction
 * @returns {object} - { finalScore: number, risk: string, method: string }
 */
function combineScores(heuristicScore, mlScore) {
  // Weighted average: 40% heuristic, 60% ML (ML typically more accurate)
  const finalScore = Math.round((heuristicScore * 0.4) + (mlScore * 0.6));
  
  let risk;
  if (finalScore < 30) {
    risk = 'safe';
  } else if (finalScore < 60) {
    risk = 'suspicious';
  } else {
    risk = 'danger';
  }
  
  return {
    finalScore: finalScore,
    risk: risk,
    method: 'combined' // Using both heuristic and ML
  };
}

/**
 * Analyzes DOM for suspicious elements (password fields, hidden forms, etc.)
 * Aparna's responsibility for DOM threat detection
 * @returns {object} - { threats: array, threatScore: number }
 */
function analyzeDOMThreats() {
  const threats = [];
  let threatScore = 0;
  
  // Check for password fields
  const passwordFields = document.querySelectorAll('input[type="password"]');
  if (passwordFields.length > 0) {
    threats.push({
      type: 'password_field',
      count: passwordFields.length,
      severity: 'medium',
      message: `Found ${passwordFields.length} password field(s)`
    });
    threatScore += 20;
  }
  
  // Check for hidden forms
  const hiddenForms = document.querySelectorAll('form[style*="display: none"], form[style*="display:none"]');
  if (hiddenForms.length > 0) {
    threats.push({
      type: 'hidden_form',
      count: hiddenForms.length,
      severity: 'high',
      message: `Found ${hiddenForms.length} hidden form(s) - possible data theft`
    });
    threatScore += 35;
  }
  
  // Check for external scripts from suspicious domains
  const scripts = document.querySelectorAll('script[src]');
  let suspiciousScripts = 0;
  scripts.forEach(script => {
    const src = script.getAttribute('src');
    if (src && (src.includes('.ru') || src.includes('.cn') || src.includes('unknown'))) {
      suspiciousScripts++;
    }
  });
  
  if (suspiciousScripts > 0) {
    threats.push({
      type: 'external_script',
      count: suspiciousScripts,
      severity: 'high',
      message: `Found ${suspiciousScripts} script(s) from suspicious domains`
    });
    threatScore += 30;
  }
  
  // Check for iframes (used for clickjacking)
  const iframes = document.querySelectorAll('iframe');
  if (iframes.length > 3) {
    threats.push({
      type: 'multiple_iframes',
      count: iframes.length,
      severity: 'medium',
      message: `Found ${iframes.length} iframes - possible clickjacking`
    });
    threatScore += 15;
  }
  
  // Check for forms that submit to external domains
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
      message: `Found ${externalForms} form(s) submitting to external sites`
    });
    threatScore += 40;
  }
  
  // Check for suspicious meta redirects
  const metaRefresh = document.querySelector('meta[http-equiv="refresh"]');
  if (metaRefresh) {
    threats.push({
      type: 'meta_redirect',
      severity: 'medium',
      message: 'Auto-redirect detected - possible phishing'
    });
    threatScore += 25;
  }
  
  // Cap threat score at 100
  threatScore = Math.min(threatScore, 100);
  
  return {
    threats: threats,
    threatScore: threatScore,
    threatLevel: threatScore > 60 ? 'high' : (threatScore > 30 ? 'medium' : 'low')
  };
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { predictPhishing, combineScores, analyzeDOMThreats };
}
