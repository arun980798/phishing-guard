// content_script.js
// Runs on every webpage and collects phishing signals

(function () {
  // -----------------------------
  // 1️⃣ URL Analysis (Heuristics)
  // -----------------------------
  const url = window.location.href;
  const hostname = window.location.hostname;

  let suspiciousUrl = false;

  // Heuristic checks
  const suspiciousKeywords = [
    "login",
    "verify",
    "secure",
    "update",
    "confirm",
    "account",
    "wallet"
  ];

  // Long URL
  if (url.length > 75) suspiciousUrl = true;

  // IP address instead of domain
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) suspiciousUrl = true;

  // Suspicious characters
  if (url.includes("@") || hostname.split("-").length > 3) {
    suspiciousUrl = true;
  }

  // Keyword presence
  suspiciousKeywords.forEach(keyword => {
    if (url.toLowerCase().includes(keyword)) {
      suspiciousUrl = true;
    }
  });

  // Unicode / homograph detection
  if (/[^\x00-\x7F]/.test(hostname)) {
    suspiciousUrl = true;
  }

  // --------------------------------
  // 2️⃣ Login Form (DOM) Detection
  // --------------------------------
  const forms = document.getElementsByTagName("form");

  let hasPasswordForm = false;
  let formActionMismatch = false;

  for (let form of forms) {
    const passwordInput = form.querySelector("input[type='password']");
    if (passwordInput) {
      hasPasswordForm = true;

      const action = form.getAttribute("action");
      if (action && !action.includes(hostname)) {
        formActionMismatch = true;
      }
    }
  }

  // --------------------------------
  // 3️⃣ Redirect Detection
  // --------------------------------
  const redirectCount = performance.getEntriesByType("navigation")[0]?.redirectCount || 0;

  // --------------------------------
  // 4️⃣ Email-Origin Detection
  // --------------------------------
  let fromEmail = false;
  const referrer = document.referrer;

  if (
    referrer.includes("mail.google.com") ||
    referrer.includes("outlook.live.com")
  ) {
    fromEmail = true;
  }

  // --------------------------------
  // 5️⃣ Send Data to Background Script
  // --------------------------------
  chrome.runtime.sendMessage(
    {
      type: "ANALYSIS_RESULT",
      data: {
        url,
        hostname,
        suspiciousUrl,
        hasPasswordForm,
        formActionMismatch,
        redirectCount,
        fromEmail
      }
    },
    response => {
      // Optional: log response for debugging
      if (response) {
        console.log("Phishing Guard Result:", response);
      }
    }
  );
})();
