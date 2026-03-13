// popup.js
// Displays phishing result for current tab

document.addEventListener("DOMContentLoaded", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const tab = tabs[0];
    if (!tab || !tab.url) {
      document.getElementById("verdict").textContent = "No active tab";
      return;
    }

    // Skip chrome:// and extension pages
    if (tab.url.startsWith("chrome://") || tab.url.startsWith("chrome-extension://")) {
      document.getElementById("verdict").textContent = "N/A";
      document.getElementById("domain").textContent = "System page";
      document.getElementById("score").textContent = "-";
      document.getElementById("whitelistBtn").disabled = true;
      return;
    }

    let hostname;
    try {
      hostname = new URL(tab.url).hostname;
    } catch (e) {
      document.getElementById("verdict").textContent = "Invalid URL";
      document.getElementById("domain").textContent = tab.url;
      document.getElementById("score").textContent = "-";
      return;
    }

    document.getElementById("domain").textContent = hostname;

    // First, try to get cached result
    chrome.runtime.sendMessage(
      { type: "GET_TAB_RESULT" },
      response => {
        if (response) {
          // We have cached results
          displayResult(response);
        } else {
          // No cached results, perform URL-based analysis
          performUrlAnalysis(hostname, tab.url);
        }
      }
    );
  });

  // Whitelist button
  document.getElementById("whitelistBtn").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      const tab = tabs[0];
      if (!tab || !tab.url) return;

      let domain;
      try {
        domain = new URL(tab.url).hostname;
      } catch (e) {
        alert("Cannot whitelist invalid URL");
        return;
      }

      chrome.storage.local.get({ whitelist: [] }, data => {
        const whitelist = data.whitelist;
        if (!whitelist.includes(domain)) {
          whitelist.push(domain);
        }

        chrome.storage.local.set({ whitelist }, () => {
          alert(`${domain} added to whitelist. Reload the page to see changes.`);
          // Trigger re-analysis
          performUrlAnalysis(domain, tab.url);
        });
      });
    });
  });
});

function displayResult(response) {
  const verdictEl = document.getElementById("verdict");
  const scoreEl = document.getElementById("score");

  scoreEl.textContent = response.score;
  verdictEl.textContent =
    response.verdict.charAt(0).toUpperCase() +
    response.verdict.slice(1);
  verdictEl.className = "status " + response.verdict;
}

function performUrlAnalysis(hostname, url) {
  // Perform basic URL analysis even if page didn't load
  const suspiciousKeywords = [
    "login", "verify", "secure", "update", "confirm", "account", "wallet"
  ];

  let suspiciousUrl = false;

  // Long URL check
  if (url.length > 75) suspiciousUrl = true;

  // IP address check
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) suspiciousUrl = true;

  // Suspicious characters
  if (url.includes("@") || hostname.split("-").length > 3) {
    suspiciousUrl = true;
  }

  // Keyword check
  suspiciousKeywords.forEach(keyword => {
    if (url.toLowerCase().includes(keyword)) {
      suspiciousUrl = true;
    }
  });

  // Unicode/homograph check
  if (/[^\x00-\x7F]/.test(hostname)) {
    suspiciousUrl = true;
  }

  // Send to background for analysis
  chrome.runtime.sendMessage(
    {
      type: "URL_ANALYSIS",
      data: {
        url: url,
        hostname: hostname,
        suspiciousUrl: suspiciousUrl
      }
    },
    response => {
      if (response) {
        displayResult(response);
      } else {
        document.getElementById("verdict").textContent = "Unable to analyze";
        document.getElementById("score").textContent = "-";
      }
    }
  );
}