---
id: cdn-cache-auth-safety
title: CDN cache auth safety
status: active
candidateKinds: ["uncached_route", "cache_header_gap"]
frameworks: ["*"]
priority: 100
citations: ["https://vercel.com/docs/caching/cdn-cache", "https://vercel.com/docs/caching/cache-control-headers", "https://vercel.com/docs/project-configuration"]
maxBriefChars: 900
---

## Investigation Brief
Treat edge caching as a safety question first. The route must be a public, cacheable GET path before a CDN-cache recommendation is allowed.

## Evidence To Check
Use `methodDistribution`, `cacheBreakdown`, and response headers. Confirm whether the route reads cookies, sessions, authorization, draft state, or user-specific data before suggesting `s-maxage`.

## Do Not Recommend When
Do not cache mutations, dashboards, account data, request-personalized responses, or routes whose value changes per viewer. Do not mix `private` with shared-cache directives.

## Verification
The recommendation must name the observed GET share, current cache result mix, and the exact file line that sets or omits the cache header.
