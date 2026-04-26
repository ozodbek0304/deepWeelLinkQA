const urlParams = new URLSearchParams(window.location.search);
const savedRef = urlParams.get("ref") || null;



const referral_link = window.location.href || null;


function getOSName(ua) {
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  if (/windows phone/i.test(ua)) return "windows_phone";
  if (/windows/i.test(ua)) return "windows";
  if (/macintosh|mac os x/i.test(ua)) return "macos";
  if (/linux/i.test(ua)) return "linux";
  return "unknown";
}

function getOSVersion(ua) {
  // Android
  let match = ua.match(/android\s([\d.]+)/i);
  if (match) return match[1];

  // iOS — "CPU iPhone OS 17_4_1 like" yoki "CPU OS 16_0 like"
  match = ua.match(/cpu(?:\s+iphone)?\s+os\s+([\d_]+)/i);
  if (match) return match[1].replace(/_/g, ".");

  // Windows Phone
  match = ua.match(/windows phone(?:\s+os)?\s+([\d.]+)/i);
  if (match) return match[1];

  // Windows NT
  match = ua.match(/windows nt\s([\d.]+)/i);
  if (match) {
    const ntMap = {
      "10.0": "10/11",
      "6.3": "8.1",
      "6.2": "8",
      "6.1": "7",
    };
    return ntMap[match[1]] || match[1];
  }

  // macOS
  match = ua.match(/mac os x\s([\d_]+)/i);
  if (match) return match[1].replace(/_/g, ".");

  return "Unknown";
}

console.log(getOSVersion(navigator.userAgent));

// =============================================
//  Qurilma ma'lumotlarini yig'ish
// =============================================

function getDeviceInfo() {
  const ua = navigator.userAgent;

  return {
    referral_link: referral_link || null,
    os_name: getOSName(ua),
    os_version: getOSVersion(ua),
    device_model: navigator.platform || "unknown",
    screen_width: String(window.screen.width),
    screen_height: String(window.screen.height),
    pixel_ratio: String(window.devicePixelRatio || 1),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    collected_at: new Date().toISOString(),
  };
}

// =============================================
//  Backendga yuborish
// =============================================

async function sendFingerprintToBackend(fingerprint) {
  try {
    await fetch("https://qa.deepwell.uz/api/v1/referrals/enter-device-info/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fingerprint),
    });
  } catch (e) {
    console.warn("Fingerprint yuborishda xato:", e);
  }
}

// =============================================
//  Asosiy funksiya
// =============================================

async function init() {
  const ua = navigator.userAgent.toLowerCase();
  const fingerprint = getDeviceInfo();

  // Qurilma ma'lumotlarini backendga yuborish
  await sendFingerprintToBackend(fingerprint);

  // ---- Android ----
  if (/android/.test(ua)) {
    const fallback =
      "https://play.google.com/store/apps/details?id=uz.deepen.mobile" +
      (savedRef ? `&referrer=${encodeURIComponent(savedRef)}` : "");

    if (savedRef) {
      // Deep link orqali ilovaga o'tish, muvaffaqiyatsiz bo'lsa Play Store'ga
      const intentUrl =
        `intent://deepenwell/referral?ref=${encodeURIComponent(savedRef)}` +
        `#Intent;scheme=deepenwell;package=uz.deepen.mobile;` +
        `S.browser_fallback_url=${encodeURIComponent(fallback)};end`;

      window.location.href = intentUrl;
    } else {
      window.location.href = fallback;
    }

    return;
  }

  // ---- iOS ----
  if (/iphone|ipad|ipod/.test(ua)) {
    window.location.href =
      "https://apps.apple.com/us/app/deepenwell/id6642689331";
  }

}

// Skriptni ishga tushirish
init();