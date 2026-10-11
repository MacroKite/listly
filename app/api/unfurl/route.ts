import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { NextResponse, type NextRequest } from "next/server";
import { normaliseUrl } from "@/lib/format";
import { parse } from "@/lib/unfurl";

const MAX_BYTES = 1_500_000;
const TIMEOUT_MS = 6000;
const MAX_REDIRECTS = 4;

/** True for loopback, link-local, private and other non-public ranges. */
function isPrivateAddress(ip: string): boolean {
  if (isIP(ip) === 6) {
    const v = ip.toLowerCase();
    if (v.startsWith("::ffff:")) return isPrivateAddress(v.slice(7));
    return v === "::1" || v === "::" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80");
  }
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19))
  );
}

async function assertPublic(url: URL) {
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("scheme");
  if (url.port && !["80", "443"].includes(url.port)) throw new Error("port");
  const addrs = await lookup(url.hostname, { all: true });
  if (!addrs.length || addrs.some((a) => isPrivateAddress(a.address))) throw new Error("private");
}

/** Fetches HTML, following redirects by hand so each hop is re-checked. */
async function fetchHtml(start: string): Promise<{ html: string; finalUrl: string }> {
  let url = new URL(start);
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublic(url);
    const res = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; ListlyBot/1.0; +https://listly.co)",
        accept: "text/html,application/xhtml+xml",
      },
    });
    const loc = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && loc) {
      url = new URL(loc, url);
      continue;
    }
    if (!res.ok) throw new Error(`status ${res.status}`);
    if (!(res.headers.get("content-type") ?? "").includes("html")) throw new Error("not html");

    // Read at most MAX_BYTES; <head> metadata is near the top.
    const reader = res.body!.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (size < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      size += value.length;
    }
    void reader.cancel();
    return { html: new TextDecoder().decode(Buffer.concat(chunks)), finalUrl: url.toString() };
  }
  throw new Error("too many redirects");
}

export async function GET(request: NextRequest) {
  const url = normaliseUrl(request.nextUrl.searchParams.get("url") ?? "");
  if (!url) {
    return NextResponse.json({ error: "That link didn’t open — check it starts with https://" }, { status: 400 });
  }
  try {
    const { html, finalUrl } = await fetchHtml(url);
    return NextResponse.json(parse(html, finalUrl), {
      headers: { "cache-control": "private, max-age=300" },
    });
  } catch {
    // The listing flow still lets the creator continue with empty fields.
    return NextResponse.json(
      { error: "We couldn’t read that page. You can still continue and fill in the details yourself." },
      { status: 422 },
    );
  }
}
