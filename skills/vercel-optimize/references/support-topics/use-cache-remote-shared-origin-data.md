---
id: use-cache-remote-shared-origin-data
title: Remote cache for shared origin data
status: active
candidateKinds: ["external_api_slow"]
frameworks: ["next@>=16.0.0"]
priority: 87
citations: ["https://vercel.com/docs/caching/runtime-cache", "https://nextjs.org/docs/app/api-reference/directives/use-cache-remote"]
maxBriefChars: 950
---

## Investigation Brief
For Next 16 external API candidates, check whether slow shared origin data belongs in a remote cache. Default `'use cache'` is a no-op on Vercel cross-request (only in-request memo + RDC). Use `'use cache: remote'` or `generateStaticParams`.

## Evidence To Check
Hostname p75, caller routes, call count, bytes. Verify data is shared and tolerates the freshness window. Confirm `'use cache: remote'`, not default.

## Do Not Recommend When
Skip per-user, mutation, secret, or freshness-critical data. Skip when upstream is fast or rarely called. Avoid sub-ms reads (Edge Config) — overhead exceeds source latency.

## Verification
Name hostname, shared data, freshness window, exact boundary. State `'use cache: remote'` vs default — load-bearing on Vercel.
