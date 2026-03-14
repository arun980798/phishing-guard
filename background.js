// background.js
// Central risk scoring & decision logic




//main logic of the extension if popup ho na ho ye kam karta rahega 

let blacklist = [];
let analysisCache = new Map(); // Store analysis results per tab

// Load blacklist when extension starts
fetch(chrome.runtime.getURL("rules/blacklist.json"))
  .then(response => response.json())
  .then(data => {
    blacklist = data.domains || [];
  })
  .catch(err => {
    console.error("Failed to load blacklist:", err);
  });

/**
 * Calculate final phishing risk score
 */
async function calculateRiskScore(data) {
  let score = 0;

  // Check whitelist first
  const { whitelist = [] } = await chrome.storage.local.get({ whitelist: [] });
  if (whitelist.includes(data.hostname)) {
    return 0; // Whitelisted domains get 0 score
  }

  // URL heuristics
  if (data.suspiciousUrl) score += 25;

  // Fake login form detected
  if (data.hasPasswordForm && data.formActionMismatch) score += 30;

  // Redirect behavior
  if (data.redirectCount > 2) score += 15;

  // Email-origin page (Gmail / Outlook)
  if (data.fromEmail) score += 10;

  // Blacklist check
  if (blacklist.includes(data.hostname)) score += 40;

  // Cap score at 100
  return Math.min(score, 100);
}

/**
 * Decide page status based on score
 */
function getVerdict(score) {
  if (score >= 61) return "phishing";
  if (score >= 31) return "suspicious";
  return "safe";
}

// Listen for messages from content_script.js and popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "ANALYSIS_RESULT") {
    // Full analysis from content script
    calculateRiskScore(message.data).then(score => {
      const verdict = getVerdict(score);
      
      const result = {
        score,
        verdict,
        domain: message.data.hostname
      };

      // Cache result for popup
      if (sender.tab?.id) {
        analysisCache.set(sender.tab.id, result);
      }

      sendResponse(result);

      // If phishing → redirect to warning page with domain info
      if (verdict === "phishing" && sender.tab?.id) {
        const warningUrl = chrome.runtime.getURL("warning.html") + 
                          "?domain=" + encodeURIComponent(message.data.hostname);
        chrome.tabs.update(sender.tab.id, {
          url: warningUrl
        });
      }
    });

    return true; // Required for async response
  }

  if (message.type === "GET_TAB_RESULT") {
    // Popup requesting cached result
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (tabs[0]?.id && analysisCache.has(tabs[0].id)) {
        sendResponse(analysisCache.get(tabs[0].id));
      } else {
        // No cached result available
        sendResponse(null);
      }
    });
    return true;
  }

  if (message.type === "URL_ANALYSIS") {
    // URL-only analysis (for pages that failed to load or popup-initiated)
    const data = {
      hostname: message.data.hostname,
      suspiciousUrl: message.data.suspiciousUrl,
      hasPasswordForm: false,
      formActionMismatch: false,
      redirectCount: 0,
      fromEmail: false
    };

    calculateRiskScore(data).then(score => {
      const verdict = getVerdict(score);
      
      const result = {
        score,
        verdict,
        domain: data.hostname
      };

      // Cache result if from a tab
      if (sender.tab?.id) {
        analysisCache.set(sender.tab.id, result);
      }

      sendResponse(result);
    });

    return true;
  }
});

// Clean up cache when tabs are closed
chrome.tabs.onRemoved.addListener(tabId => {
  analysisCache.delete(tabId);
});

// Monitor tab updates to clear cache when URL changes
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    // URL changed, clear old cache
    analysisCache.delete(tabId);
  }
});