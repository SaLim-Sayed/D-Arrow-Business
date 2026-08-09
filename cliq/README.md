# Zoho Cliq — setup and automation

Implementation assets for [docs/Zoho-Cliq-Implementation-Plan.md](../docs/Zoho-Cliq-Implementation-Plan.md).

| Path | Plan phase |
| --- | --- |
| `provision-channels.mjs` | Phase 2 — Channel Setup |
| `bots/status.deluge` | Phase 8 — Status Bot |
| `bots/standup.deluge`, `bots/standup-form.deluge` | Phase 8 — Standup Bot |
| `../scripts/notify-cliq.mjs` | Phase 7 — deployment notifications |
| `../docs/Zoho-Cliq-Communication-Guidelines.md` | Phase 3 — Communication Rules |

---

## Phase 1 — Organization setup

Console work, no scripting:

1. Create the **D-Arrow Business** organization in Zoho Cliq.
2. Add a second admin account. A single admin is a single point of failure —
   losing access to that account locks the org.
3. Add people. User groups and the manager/member split from §5 and §21 of the
   plan are worth configuring only once there are people to put in them.

## Phase 2 — Channels

```bash
node cliq/provision-channels.mjs --set minimal     # preview the starter set
node cliq/provision-channels.mjs                   # preview the full plan structure
node cliq/provision-channels.mjs --set minimal --apply
```

Dry run is the default. `--apply` creates real channels in the live org.

Requires `CLIQ_OAUTH_TOKEN` with the `ZohoCliq.Channels.CREATE` scope. If the org
is on a non-`.com` data centre, set `CLIQ_API_BASE` (for example
`https://cliq.zoho.sa`) or every call will 401 against the wrong host.

The script is re-runnable: channels that already exist are reported and skipped
rather than failing the run.

`#finance` and `#hr` are created private. Create them that way from the start —
making a channel private after messages exist means auditing the history, not
flipping a setting.

## Phase 8 — Bots

These are **Deluge**, Zoho's own language. They run inside Cliq and need no
server, which is why they are `.deluge` files rather than something this repo
executes. They cannot be tested from here — paste and test in Cliq.

**Status Bot**
1. Cliq → **Bots & Tools** → **Commands** → new command `/status`.
2. Paste `bots/status.deluge`.
3. Set `APP_URL` to the real production URL before enabling — the placeholder is
   a guess and will report the app as unreachable if wrong.

**Standup Bot**
1. **Functions** → new function named `standup_submit`, paste `bots/standup-form.deluge`.
2. **Commands** → new command `/standup`, paste `bots/standup.deluge`.
3. Run `/standup` in a channel to confirm the form opens and posts back.

Create the function before the command — the command references it by name.

## Phase 9 — Security

Before adding anyone beyond the admins:

- Restrict `#announcements` posting to admins and managers.
- Confirm `#finance`, `#hr`, and `#management-private` are private and correctly
  membered.
- Disable external/guest access unless a specific contractor needs it, then scope
  them to named channels only.
- Review which bots can post where. A bot with org-wide posting rights is a
  credential worth protecting accordingly.
- Never store tokens in channel messages. `CLIQ_OAUTH_TOKEN` and the webhook URLs
  belong in GitHub repository secrets and your local `.env`, both untracked.

---

## Not implemented

GitHub, Jira, and Sentry integrations (Phases 4–6) and the Ticket and Help bots
are deliberately not built. Jira and Sentry are not adopted in this project, and
the Ticket Bot exists only to create Jira issues. Build these when the
underlying tool is actually in use.
