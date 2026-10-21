import { z } from "zod";

// Zod 4 normally probes `new Function("")` to enable a faster "JIT" parser.
// Under a strict Content Security Policy (no 'unsafe-eval') that probe is
// reported as a violation even though Zod catches it and falls back safely.
// Turning JIT off in the browser means we never trigger it, so the CSP can be
// enforced without 'unsafe-eval'. The server keeps the faster JIT parser.
//
// Zod reads this when each schema is created, so every schema file imports
// this module FIRST (before calling z.object(...)).
if (typeof window !== "undefined") {
  z.config({ jitless: true });
}
