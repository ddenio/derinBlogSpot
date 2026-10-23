import { NextRequest } from "next/server";
import {
  MAX_BODY_BYTES,
  buildClientHeaders,
  buildUpstreamHeaders,
  getUpstreamUrl,
} from "@/lib/analytics/ingestProxy";
import { MINUTE, ipFromHeaders, rateLimit } from "@/lib/rateLimit";

// First-party proxy for PostHog (see lib/analytics/ingestProxy.ts). Public on
// purpose: logged-out visitors are tracked too (proxy.ts exempts /ingest from
// the login redirect).
export const dynamic = "force-dynamic";

const handle = async (req: NextRequest) => {
  const ip = ipFromHeaders(req.headers);

  if (!rateLimit(`ingest:ip:${ip}`, 300, MINUTE).ok)
    return new Response(null, { status: 429 });

  if (Number(req.headers.get("content-length") ?? 0) > MAX_BODY_BYTES)
    return new Response(null, { status: 413 });

  const body = req.method === "POST" ? await req.arrayBuffer() : undefined;

  if (body && body.byteLength > MAX_BODY_BYTES)
    return new Response(null, { status: 413 });

  try {
    const upstream = await fetch(
      getUpstreamUrl(req.nextUrl.pathname, req.nextUrl.search),
      {
        method: req.method,
        headers: buildUpstreamHeaders(req.headers, ip),
        body,
        redirect: "manual",
        signal: AbortSignal.timeout(10_000),
      },
    );

    return new Response(upstream.body, {
      status: upstream.status,
      headers: buildClientHeaders(upstream.headers),
    });
  } catch {
    // Analytics being down must never matter to visitors
    return new Response(null, { status: 502 });
  }
};

export const GET = handle;
export const POST = handle;
