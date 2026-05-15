# Observability Plus Stop-And-Ask

Use this file only when `signals.observabilityPlusBlocker` is set. Do not silently continue into scanner-only mode unless the user chooses that path.

## Why It Matters

This skill ranks recommendations from measured route behavior. The high-value gates need per-route metrics:

| Gate | Required signal |
|---|---|
| `slow_route` | Function duration and invocation count by route |
| `uncached_route` | Cache result and request count by route |
| `cold_start` | Function start type by route |
| `route_errors` | Function status by route |
| `isr_overrevalidation` | ISR reads and writes by route |
| `middleware_heavy` | Middleware invocations and duration |
| `cwv_poor` | Core Web Vitals by route |
| `platform_bot_protection` | Fast Data Transfer by bot category |

Scanner-only mode can still catch traffic-independent code issues, but it cannot rank the hottest routes or prove cost impact.

## User Template

Render this template first, then wait for the user's choice. Replace only `<detail>`.

```md
**Observability Plus is required for the full audit.**

<detail>

This skill ranks recommendations by per-route metrics: 95th percentile latency, cache hit rate, error rate, cold-start rate, and ISR reads/writes. Without those metrics, I can run scanner-only mode: useful for static code issues, but not enough for a ranked cost and performance audit.

Pricing can change, so check the current Observability Plus pricing before enabling it: https://vercel.com/docs/observability/observability-plus

Choose one:
1. Enable Observability Plus, then re-run for the full audit.
2. Continue in scanner-only mode for a limited audit.
```

## Blocker Copy

| Blocker | Detail |
|---|---|
| `payment_required` | `Detected: Observability Plus is recognized on this team but is not usable for these metric queries.` |
| `no_oplus_probe` | `Detected: this team does not expose the per-route Observability Plus metrics this skill needs.` |
| `not_linked` | `Detected: this app directory is not linked to a Vercel project.` |
| `forbidden` | `Detected: the Vercel CLI is authenticated to a team that cannot read this project.` |
| `project_not_found` | `Detected: the project ID is not visible to the authenticated team.` |
| `all_failed_other` | `Detected: every per-route metric query failed. Error code: <code>.` |

For `not_linked`, do not use the Observability Plus template. Link the app directory first:

```bash
vercel link --yes --project <project-name-or-id> --cwd <app-dir>
```

Add `--team <team-id-or-slug>` when the team is known. If the user supplied both app path and project name, run the link command instead of asking them what to do.

For `forbidden` and `project_not_found`, ask the user to run `vercel switch <team>` or verify the project ID before presenting an Observability Plus upgrade choice.

For `no_traffic`, do not use this template. Tell the user the project has no meaningful traffic in the 14-day window, then ask whether to run scanner-only mode now or come back after traffic accumulates.

## Scanner-Only Mode

If the user picks scanner-only mode:

1. Run code scanners.
2. Launch only traffic-independent findings.
3. Render a clear data gap: per-route metric gates were skipped because Observability Plus data was unavailable.

Do not imply the scanner-only report is a complete optimization audit.
