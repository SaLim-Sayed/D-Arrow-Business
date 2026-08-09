# D-Arrow Business — Communication Guidelines

Phase 3 deliverable of [Zoho-Cliq-Implementation-Plan.md](./Zoho-Cliq-Implementation-Plan.md).

These are the rules for how D-Arrow Business uses Zoho Cliq. They are written to
be readable by someone on their first day.

---

## 1. Which channel

| If you are discussing | Post in |
| --- | --- |
| Anything company-wide and informal | `#general` |
| An official announcement | `#announcements` |
| Architecture, technical decisions, code | `#development` |
| Infrastructure, deploys, production problems | `#devops` |
| Invoices, payments, financial operations | `#finance` (private) |
| Employees, policies, hiring | `#hr` (private) |

Channels named in the plan but not yet created — `#frontend`, `#backend`,
`#mobile`, `#qa`, per-project channels — are created when the team or project
they serve actually exists. Splitting a channel before there is traffic to split
produces empty rooms, which teaches people the tool is dead.

**Rule of thumb:** post in the broadest channel that is still correct. It is
easier to split a busy channel later than to revive silent ones.

---

## 2. Announcements

`#announcements` is for things every person needs to read: policy changes,
launches, outages affecting customers, organisational news.

- Posting is restricted. If you are not sure you have permission, you do not.
- No replies in-channel — discussion goes to `#general` or a thread.
- If it does not need to reach everyone, it is not an announcement.

---

## 3. Threads

Reply in a thread when your message is *about* a specific earlier message.
Post in the channel when your message starts something new.

This one habit is the difference between a channel that can be caught up on in
two minutes and one that cannot be read at all.

---

## 4. Direct messages

Use a DM for one-to-one questions, personal topics, and anything genuinely
sensitive.

Do not use DMs for decisions. If a DM produces a decision that affects other
people's work, restate it in the relevant channel. Decisions that live only in
a DM are invisible to everyone who needs them and are lost when someone leaves.

---

## 5. Mentions

- `@person` — you need that specific person to act.
- `@channel` / `@all` — genuinely everyone needs to stop what they are doing.

Reserve the broadcast mentions for production incidents and time-critical
announcements. Every unnecessary one makes the next real one easier to ignore.

---

## 6. Files

Cliq is for sharing files in the flow of conversation, not for storing them.

| Kind | Belongs in |
| --- | --- |
| Documents | Zoho WorkDrive |
| Images, video | Cloudinary |
| Source code | GitHub |
| Large technical files | Cloud storage |

Never paste credentials, API keys, or access tokens into any channel — including
private ones. Chat history is searchable, exportable, and retained. Use the
secret store the service provides.

---

## 7. Notifications

Automated messages are filtered by priority so the urgent ones stay legible.

**High — notifies immediately**
Production outage, deployment failure, security issue, payment failure.

**Medium — normal channel notification**
Pull request opened or merged, successful deployment.

**Low — never sent**
Individual commits, minor warnings, routine non-critical events.

If a class of automated message is being ignored by everyone, it is noise.
Turn it off rather than training people to skim past it.

---

## 8. Response expectations

| Channel | Expectation |
| --- | --- |
| `#alerts`, `#deployments` failures | Immediate during working hours |
| Direct mention | Same working day |
| Channel post, no mention | No obligation |

Cliq is not a synchronous medium by default. Nobody is expected to be reading
it continuously, and nobody should assume a message has been seen because it
was sent.
