// content_script.js
// Runs on every webpage and collects phishing signals

//funcion run automatic every time wihout calling
(function () {
  const url = window.location.href; //taking url
  const hostname = window.location.hostname; // taking host name

  let suspiciousUrl = false; //suspicious condition

  // check keyword in url
  const suspiciousKeywords = [
    "login",
    "verify",
    "secure",
    "update",
    "confirm",
    "account",
    "wallet",
  ];

  // check length of url
  if (url.length > 75) suspiciousUrl = true;

  // is url use ip or not
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) suspiciousUrl = true;

  // url  have spacel charactor or not
  if (url.includes("@") || hostname.split("-").length > 3) {
    suspiciousUrl = true;
  }

  // check keyword present in url or not
  suspiciousKeywords.forEach((keyword) => {
    if (url.toLowerCase().includes(keyword)) {
      suspiciousUrl = true;
    }
  });

  // is url have typo like instagram inSTagram
  if (/[^\x00-\x7F]/.test(hostname)) {
    suspiciousUrl = true;
  }

  //form  check
  const forms = document.getElementsByTagName("form");

  let hasPasswordForm = false;
  let formActionMismatch = false;

  //check form have password type or not
  for (let form of forms) {
    const passwordInput = form.querySelector("input[type='password']");
    if (passwordInput) {
      hasPasswordForm = true; //need to upgrade the logic

      //check where data go is the same to host name or not
      const action = form.getAttribute("action");
      if (action && !action.includes(hostname)) {
        formActionMismatch = true;
      }
    }
  }

 
  // count how many time page redirect before come 
  const redirectCount =
    performance.getEntriesByType("navigation")[0]?.redirectCount || 0;
  //   Bahut si malicious ya phishing websites multiple redirects use karti hain taaki:
  // Original malicious URL hide ho jaye
  // User ko confuse kiya ja sake
  // Security scanners ko bypass kiya ja sake




  // right now dont know the ue but want to improve this part code 
  let fromEmail = false;
  const referrer = document.referrer;

  if (
    referrer.includes("mail.google.com") ||
    referrer.includes("outlook.live.com")
  ) {
    fromEmail = true;
  }//Ye code check karta hai ki user Gmail ya Outlook email se link click karke site par aaya hai ya nahi.




  // 5️⃣ Send Data to Background Script
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
        fromEmail,
      },
    },
    (response) => {
      // Optional: log response for debugging
      if (response) {
        console.log("Phishing Guard Result:", response);
      }
    },
  );
})();












// 1. The "URL Deep Dive" (Most Reliable)
// Look for Look-alikes: Scammers change one letter to fool your eyes (e.g., micros0ft.com instead of microsoft.com or paypa1.com instead of paypal.com).

// Check the Domain Position: In a real URL, the brand name is right before the .com or .org.

// Real: apple.com/support

// Fake: apple-support.security-check.com (The real domain here is security-check.com, not Apple).

// The Padlock Lie: A "padlock" icon or https:// only means the connection is encrypted; it does not mean the site is safe. Most phishing sites now use HTTPS to look "official."

// 2. Psychological Red Flags
// Artificial Urgency: If the site uses countdown timers or phrases like "Your account will be deleted in 2 hours," it’s likely a scam designed to stop you from thinking clearly.

// Too Good to Be True: "Free" giveaways, massive crypto returns, or "unclaimed government refunds" are classic lures.

// Mismatched Content: If you clicked a link for a "Bank Login" but the page asks for your Social Security number or your mother's maiden name immediately, leave the site.

// 3. Visual & Technical Glitches
// Broken Links: Try clicking on the "About Us," "Terms of Service," or "Contact" links at the bottom. Phishing sites often leave these broken or redirect them back to the home page.

// Low-Quality Branding: Look for blurry logos, weird fonts, or "stretched" images. Real companies spend millions on design; scammers use quick templates.

// Browser Warnings: Never ignore a "Deceptive site ahead" or "Your connection is not private" red screen from Chrome or Firefox.

// 4. Proactive Verification Tools
// If you are still unsure, don't enter any data. Use these free "Checkers" to scan the URL:

// Google Transparency Report: Paste the URL to see if Google has flagged it.

// VirusTotal: Scans the site against over 70 antivirus databases.

// Whois Lookup: Check how old the domain is. If a "Bank" website was registered only 3 days ago, it is 100% a scam.









