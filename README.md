# token-band

A Claude Code mod that shows, above the prompt, the context tokens left, rate-limit usage (5h / 7d) and session cost.

```
██████░░░░░░░░░░░░░░ 140k left of 200k (70%)  ·  5h 12%  ·  7d 4%  ·  $0.42
```

## Install

At the prompt of a Claude Code terminal session:

```
/plugin install token-band --marketplace JangGiWon/token-band
```

Answer `y` to add the marketplace, then pick the user scope so it loads in every session.

From a shell:

```
claude plugin install token-band --marketplace JangGiWon/token-band
```
