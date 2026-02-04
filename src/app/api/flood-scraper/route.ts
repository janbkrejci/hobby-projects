const TARGET_URL = "https://hydro.chmi.cz/hppsoldv/hpps_prfdata.php?seq=307024";

export async function GET() {
  try {
    const response = await fetch(TARGET_URL, {
      cache: "no-store",
      headers: {
        "User-Agent": "flood-scraper",
        Accept: "text/html",
      },
    });

    if (!response.ok) {
      return new Response("Upstream error", { status: 502 });
    }

    const html = await response.text();
    return new Response(html, {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  } catch {
    return new Response("Upstream error", { status: 502 });
  }
}
