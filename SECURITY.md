# MediCare – Security notes

This project is a **browser-only demo** (HTML + JavaScript + localStorage). Everything runs on the user's own machine, so
a person with access to the browser's developer tools can read or edit any data. The measures below make the demo safer and
show good practice, but they are **not a substitute for a server**.

## What is protected (v28)
| Area | Measure |
|---|---|
| Passwords | Salted PBKDF2-SHA-256 (120 000 iterations) for new/changed passwords; old SHA-256 hashes still verify. Policy: ≥ 8 chars, letters + numbers, no common passwords, must not contain the e-mail name. |
| Brute force | Per-e-mail lock after N wrong tries (default 5), doubling lock time (max 10 min); settings in Control Center → Security. |
| Sessions | Idle auto sign-out (default 30 min) and absolute session limit (default 12 h); logout clears auth keys only. |
| Roles | Page/action access enforced in `guard.js`; disabled accounts are signed out; Control Center is Admin/Owner only. |
| Stored XSS | `<` and `>` in saved text are converted to full-width look-alikes on write (`responsive.js`), CSV exports neutralise `=+-@` formulas. |
| Clickjacking | Pages refuse to render inside another site's frame. |
| CSP | `object-src 'none'; base-uri 'self'; form-action 'self'` on every page; `_headers` adds a stronger set for real hosting. |
| Backup restore | Files that contain password/role/account data trigger an explicit warning; Cancel restores everything except those keys. |
| Audit | Logins (success/failed), password changes, account/role/feature changes and refunds/write-offs/day-closing are logged. |
| Default accounts | Dashboard warns until the default passwords are changed. |

## What a demo cannot do
* Hide data from someone who opens DevTools; the default demo passwords are in the page source.
* Share lock-outs or logs between devices; no server-side rate limiting; no 2-factor login.

## Before real use
1. Move authentication, roles and data to a server (e.g. Node/Laravel/Django + PostgreSQL); hash with Argon2id/bcrypt there.
2. Serve over HTTPS only and send the headers from `_headers` (or your server config).
3. Remove the demo accounts and the demo code `demo`; add 2-factor login and per-user sessions with server-side expiry.
4. Validate and escape all input and output on the server; keep an immutable audit log.
5. Back up the database regularly, test restores, and restrict who can export patient/prescription data.
