# Architecture Decision Records

An ADR is written only when a decision **reverses** something in the design spec, or adds a
lasting constraint. Ordinary iteration — content, wording, spacing, timings, a new service, a
swapped photo — is just a spec edit. No ceremony.

The spec answers *what is true now*. ADRs answer *why it stopped being what it was*. Git
history holds the fine-grained diff.

Filename: `NNNN-short-kebab-title.md`, numbered sequentially from `0001`.

## Template

```markdown
# NNNN — <title>

**Date:** YYYY-MM-DD
**Status:** Accepted
**Supersedes:** <spec section, e.g. "§3.3 and decision D6">

## Context

What changed in the world that made the previous decision wrong?

## Decision

What we are doing instead.

## Consequences

What this costs, and what now becomes possible or impossible.
```

After writing an ADR, edit the spec so it describes the new reality, and link back here.
