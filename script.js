const urlParams = new URLSearchParams(window.location.search);
const savedRef = urlParams.get("ref") || localStorage.getItem("ref_code") || null;

if (savedRef) {
  localStorage.setItem("ref_code", savedRef);
}


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

  // iOS
  match = ua.match(/os\s([\d_]+)/i);
  if (match) return match[1].replace(/_/g, ".");

  // Windows
  match = ua.match(/windows nt\s([\d.]+)/i);
  if (match) return match[1];

  // macOS
  match = ua.match(/mac os x\s([\d_]+)/i);
  if (match) return match[1].replace(/_/g, ".");

  return "Unknown";
}

// =============================================
//  Qurilma ma'lumotlarini yig'ish
// =============================================

function getDeviceInfo() {
  const ua = navigator.userAgent;

  return {
    ref_code: savedRef || null,
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
    const appStoreUrl = "https://apps.apple.com/us/app/deepenwell/id6642689331";

    if (savedRef) {
      const openedAt = Date.now();

      // Agar ilova ochilsa va foydalanuvchi qaytib kelsa — App Store'ga yo'naltirish
      document.addEventListener("visibilitychange", () => {
        if (
          document.visibilityState === "visible" &&
          Date.now() - openedAt > 1500
        ) {
          window.location.href = appStoreUrl;
        }
      });

      // Custom URL scheme orqali ilovani ochishga urinish
      window.location.href = `deepenwell://referral?ref=${encodeURIComponent(savedRef)}`;

      // Agar 2.5 soniyada ilova ochilmasa — App Store'ga o'tish
      setTimeout(() => {
        if (document.visibilityState !== "hidden") {
          window.location.href = appStoreUrl;
        }
      }, 2500);
    } else {
      window.location.href = appStoreUrl;
    }

    return;
  }

  // ---- Boshqa qurilmalar (Desktop va h.k.) ----
  // Ixtiyoriy: Desktop uchun fallback sahifani ko'rsatish yoki boshqa URL
  console.info("Bu qurilma Android yoki iOS emas. Yo'naltirish amalga oshirilmadi.");
}

// Skriptni ishga tushirish
init();