# MediCare Pharmacy Management System (demo)
Vanilla HTML/CSS/JS storefront + admin panel for a fictional Bangladesh pharmacy. No build step.

## Run
Open this folder in VS Code → right-click `index.html` → **Open with Live Server** (or `python3 -m http.server`).
Admin: `/admin/login.html`, pick a role, demo code `demo` (not real security).

## Structure
`index.html` (storefront SPA: shop, cart, checkout, orders, wishlist, help) · `admin/` (login + panel) · `assets/js/core.js` (storage, seed data, i18n, FEFO stock) · `store.js` · `admin.js` · `assets/css/styles.css`.

## Implemented
Search/filter/sort/pagination, product details, Rx flagging + pharmacist-review gate, cart with stock validation and coupon `SAVE10`, checkout with BD phone validation, order tracking/cancel/return request, wishlist, dark mode, EN/বাংলা (core labels), ৳ and Asia/Dhaka dates.
Admin: role-based tabs, KPIs, product add/price edit/delete, batch inventory with FEFO + expiry blocking + write-off + receiving, POS with receipt/suspend/resume, order statuses, reports + CSV (formula-safe), JSON export/import (validated, preview) and reset.

## Data
Everything is in LocalStorage key `mc_db` (schema v1). Reset: Admin → Data → Reset.

## Added in v2
Purchase orders with receive-to-stock (stock counts only after receiving) and purchase returns, order returns/refunds with optional restock, suppliers with balances and payments, customers with loyalty points, expenses and cashbook with shift closing, delivery queue, settings, coupons, activity log.

## Added in v3
Alerts tab (low stock, near expiry, expired, Rx reviews, return requests), full report set with daily/weekly/monthly periods and CSV export per table, product edit (name, reorder level, Rx flag), generated placeholder product images (no external files), more Bangla labels. Fixed a bug where the admin panel failed to load because of a duplicate `V` identifier.

## Added in v4
Per-feature entry pages (`products.html`, `cart.html`, `checkout.html`, `orders.html`, `wishlist.html`, `faq.html`, `privacy.html`, `terms.html`, `contact.html`, `admin/pos.html`, `admin/inventory.html`, etc.) that open the matching view of the single-page app; user management (Owner only, no passwords, login picks a demo user); in-app notifications (new orders, return requests); product image upload (resized to a small JPEG stored in LocalStorage); broader Bangla translation of labels, buttons, tables and messages.

## Added in v5
Home page category chips, offers strip, testimonials (fictional) and footer; real product detail page (`#/product/ID`); contact form (saved as an in-app notification); order-success page; per-product discount % (shown with strike-through, used in cart, orders and POS); manual stock adjustment with reasons (damaged stock is logged as an expense); 7-day sales chart on the dashboard; printable order invoices; skip-to-content links.

## Added in v6
Customer: saved details (checkout is prefilled), loyalty points, "Order again" (respects current stock), mandatory reason for return requests, pharmacy note shown on rejected prescriptions.
Admin: Prescription review queue (approve, or reject with a reason that restocks the order and tells the customer), full product edit dialog (all fields, SKU/barcode uniqueness, discount limits), order search and status filter, reorder suggestions that create purchase orders (no duplicate open PO), POS quick-add buttons, admin audit trail in Settings.

## Limitations (honest)
Demo only; not secure for real pharmacy use. The storefront and admin are single-page apps; the extra .html files are redirects into them. Prescription review relies on the doctor details the customer types; prescription images/documents are deliberately not stored. Notifications are in-app only: no SMS/email. Some selects (status, payment) stay English so stored values stay consistent. Product data and free text are not translated. No payment, SMS, shipping or barcode-hardware integration. Real use needs a backend, database, auth, audit trail and protected prescription handling.

## Added in v7 (integration + fixes)
- `shop.html` is the customer storefront again (the old SPA `index.html` had been overwritten by the landing page, which broke every redirect page). All entry pages (`products.html`, `cart.html`, …) now open the right shop view.
- `index.html` is the marketing landing page with a "choose your portal" section.
- **Fixed data loss:** every login/logout used to call `localStorage.clear()`, wiping medicines, customers, sales and the shop database. A shared `assets/js/guard.js` now clears only auth keys.
- `guard.js` also enforces role access on the staff pages (Pharmacist/Staff can't open purchases/suppliers/reports as configured; Staff is read-only on medicines/customers), hides blocked menu links, and stubs gsap/Chart/AOS so pages still work if a CDN fails.
- `admin/login.html` redesigned (role hint, links to other portals); mobile CSS polish.
- **Logins: see `LOGIN-GUIDE.html`.** Three entrances: customer shop (`shop.html`), management dashboard (`login.html`: admin/pharmacist/staff), operations panel (`admin/login.html`, code `demo`).

## Added in v8
- `backup.html`: export / restore / wipe ALL browser data (legacy `pharmacy_*` keys and shop/ops `mc_*` keys) as one JSON file; restricted to Admin (dashboard login) or Owner (ops panel). Validated before import.
- Sidebar shortcuts in the dashboard: Online Shop, Ops Panel, Backup; "Backup" link in the Ops Panel bar; "Login guide" link in the shop footer.
- Known gap: the management dashboard (`pharmacy_*`) and the shop/ops panel (`mc_db`) still keep separate data sets.

## Added in v9 (Dashboard, Medicines, Customers, POS Sales, Purchases, Suppliers)
- **POS sales are now saved** (`pharmacy_sales`, with items, discount, tax, payment). Before, a sale only reduced stock, so Dashboard/Reports never saw real sales. Sale totals now use the real discount/tax (the invoice previously derived them wrongly from the total).
- **Expired medicines cannot be sold** in POS.
- **Currency is ৳ (taka)** everywhere on these pages (was $).
- `assets/js/enhance.js`: live summary strip on each page — Medicines (expired, expiring in 60 days, low stock, stock value), Customers (outstanding due, over credit limit, POS sales this month), POS (today's sales, invoices, average), Purchases (total, payable, unpaid), Suppliers (payable, over limit), Dashboard (today's POS sales, expired, low stock, dues). CSV export for medicines, sales and purchases; print for dashboard/medicines. Tables always scroll on phones.
- Demo medicine expiry dates moved to 2027 (they had expired in 2025); dead `via.placeholder.com` images replaced by a local icon.
- Dashboard falls back to random demo sales only until the first real POS sale is made.

## Added in v10 (Online Shop, Ops Panel, Backup, Settings)
- **Dashboard Settings are now real** (`assets/js/settings-extra.js`): profile saved, password change with validation (stored as SHA-256 in `pharmacy_creds`, honoured by `login.html`), notification preferences, new *Store & Invoice* tab (pharmacy name/phone/address/email, VAT %, low-stock default — used by POS invoices and VAT), real backup download and restore link, honest 2FA note (needs a server).
- **Ops Panel → Settings:** shop profile & rules — open/closed switch, announcement banner, shop phone/address/hours, free-delivery threshold, minimum order. Ops **Data** tab shows backup status and quick export.
- **Online Shop** (`assets/js/store-extra.js`): shows the announcement and a closed banner, blocks orders when closed or below the minimum, free delivery with "add ৳X more" hint, footer uses the shop details.
- **Backup page:** friendly names and record counts per dataset, last-backup time with a 7-day warning (also on the dashboard strip).

## Added in v11 (Pharmacist)
- **Rx medicines:** new "Rx required" flag on medicines (badge on cards). In POS only Pharmacist/Admin can sell Rx items (a prescription ref is asked and stored on the sale and invoice); Staff are blocked.
- **Prescription → POS hand-off now works** (it was never read before): "Fill" adds the matching in-stock, unexpired medicines to the cart and selects the patient; after payment the prescription becomes filled/partial with `dispensedBy`.
- **Pharmacist panels** (`enhance.js`): Dashboard (Rx waiting, past validity, dispensed today, worklist), Medicines (needs-attention list: expired, expiring ≤60 days, low stock, with batch/rack + CSV), Prescriptions (pending/partial/past-validity/filled today + CSV), Reports (expiry & stock report, Rx dispensing log CSV), POS (Rx sales today).
- Built-in demo data is now saved once on first visit so Dashboard, POS and Reports always agree.
- **Settings** are available to every role for own profile/password (Store & Invoice tab stays Admin-only).
- **Shop:** "Ask pharmacist" page (name, mobile, medicine, question) → Ops Panel Notifications.
- **Ops Panel (Pharmacist):** richer prescription queue (items, address, call button), optional counselling note shown to the customer, reviewed-by history, pending counts on tabs.
- **Backup:** Pharmacist (dashboard or Ops) can download a backup but not restore or wipe.

## Added in v12 (Staff)
- **Staff Dashboard:** only what a counter staff member needs — my sales today, my invoices, low stock, expired (do not sell), prescriptions waiting, held bills; no supplier payables, stock cost value or backup link.
- **POS:** *Hold bill* / *Resume held* (up to 10), *Close my shift* (counts cash, difference, saved in `pharmacy_shifts`, printable), staff discount limit 10% (enforced again at payment), Rx badge on product cards (staff cannot sell Rx items), every sale records the cashier.
- **Medicines (view only):** quick lookup by name/generic showing rack, stock, price, Rx/expired flags; no stock-cost value.
- **Prescriptions (view only):** banner + fill/mark-filled buttons hidden for staff.
- **Settings:** staff manage their own profile/password only (no Backup tab, no Store tab). **Backup page:** not available to staff/cashier.
- **Online Shop:** a staff bar with shortcuts (Dashboard, POS, Medicines / Ops Panel) when someone is logged in. **Ops Panel (Cashier / Delivery):** open-order and delivery counts on tabs.
- Dashboard demo medicines no longer start expired.

## v13 — Admin Control Center (`admin-center.html`)
Admin (legacy admin or Ops Owner) can control and customise: **Branding** (name, tagline, colours, logo — applied on every page), **Rules** (tax, receipt note, low-stock default, Rx enforcement, shop free-delivery/min order/notice, coupons), **Roles** (per-page None/View/Edit/Full, staff discount cap, Rx permission, custom roles, Ops tab access per role), **Accounts** (create/disable/reset-password users; disable default accounts), **Shop sync** (Medicines → online shop, orders reduce stock once, cancelled orders restore it), **Sales & audit** (void sale restores stock, shifts, audit log) and **Data** (clear/reset datasets).
Custom accounts are stored in `pharmacy_accounts`. Browser-only demo: data is per browser, not real security.

## v14 — Rx Dispensing Register (`register.html`)
Admin/Pharmacist only (hidden for Staff). Lists Rx-medicine sales with Rx number, verifier, cashier; date/search filters, CSV export, print; flags sales without an Rx reference. Sidebar link "Rx Register" on the dashboard.

## v15 — New Home & polished Login
- `index.html` rewritten: self-contained (no CDN needed), responsive, dark-mode aware, brand/colour follow the Control Center theme; portals, features, role/login table with copy buttons, FAQ.
- `login.html`: click a demo row to auto-fill, Caps-Lock hint, remembers last role/email (never the password), animated background, dark mode, Home button. `admin/login.html` gets the same entrance polish.

## v16 — Expiry Write-off (`writeoff.html`)
Admin/Pharmacist only. Lists expired (or expiring within N days) stock, writes items off one by one or all at once (stock → 0), records loss at purchase price in `pharmacy_writeoffs` with CSV export and audit entry. Sidebar link "Write-off".

## v17 — Responsive & accessibility layer
`assets/js/responsive.js` (loaded on every page): auto-wraps bare tables for horizontal scroll, 40px touch targets, 16px inputs on phones (no iOS zoom), full-width modals, safe-area padding, focus rings, reduced-motion support, print styles. Fixed Ops login overflow at 360px. Fixed `admin/index.html` which had been emptied in v13–v16 (restored with theme/sync/responsive).

## v18 — Sales Returns & Refunds (`refunds.html`)
Admin/Pharmacist only. Find an invoice, enter returned quantities (capped at what's left), stock is restored, refund logged in `pharmacy_refunds` (CSV export, audit entry); fully returned invoices become "Refunded". Refund is at item price (discount/tax share not recalculated). Sidebar link "Refunds".

## v19 — Faster panels for Admin / Pharmacist / Staff (`assets/js/panel.js`)
Dashboard greeting + role-specific quick-action tiles; command palette (Ctrl/Cmd+K, "/" or the 🔍 button) to jump to any allowed page; mobile bottom bar (Home · POS · Medicines · Customers · More). Only shows what the role may use; guard.js still enforces access.

## v20 — Daily Closing (`closing.html`) & Reorder List (`reorder.html`)
Admin/Pharmacist. Closing: per-day sales by payment method, refunds, net sales, expected vs counted cash, saved in `pharmacy_closings` (print-friendly, audit entry). Reorder: low-stock medicines with suggested order qty (target = N × minimum), supplier filter, estimated cost, CSV/print. Sidebar + Ctrl+K entries added.

## v21 — Login system upgrade
Attempt limit (5 wrong tries → 30 s lock, doubling up to 10 min, per email) with live countdown; login activity log (`pharmacy_loginlog`); dashboard shows last login + failed attempts; idle auto sign-out (default 30 min, set in Control Center → Rules, 0 = off) with 1-minute warning; Home nav switches to "Dashboard" when signed in. Browser-only protection (demo).

## v22 — Dashboard insights (`assets/js/dash-extra.js`)
Under the quick actions, each role sees: 7-day sales bar chart (Staff: only their own sales), "needs attention" list with links (expired, low stock, expiring in 30 days, pending Rx, dues/refunds for Admin & Pharmacist), top sellers (30 days) and payment mix. Pure inline SVG (works offline), dark-mode aware, updates after each POS sale.

## v23 — Profile pictures (`assets/js/avatar.js`)
Admin, Pharmacist, Staff (and custom accounts) can upload a profile photo in Settings → Profile (JPG/PNG/WebP ≤ 5 MB, auto square-crop to 256 px). Stored per email in `pharmacy_avatars` (included in Backup). Shown in the sidebar, top bar and dashboard greeting; without a photo a coloured initials avatar is drawn locally (no internet needed).

## v24 — Smarter Settings (`assets/js/prefs.js`)
Settings gets a **My Preferences** tab (per user): text size, compact layout, dark mode (beta), reduced animation, start page after login, show/hide dashboard quick actions and insights, reset to defaults. **Security** tab gains a password-strength meter, "my recent sign-ins" list, clear history and sign-out of this device. Preferences are stored per email in `pharmacy_prefs` (included in Backup).

## v25 — Team Board (`team.html`)
For all signed-in roles. Admin/Pharmacist post notices (normal/urgent, pin) and assign tasks (to everyone, a role, with due date). Staff post shift-handover notes, acknowledge notices ("পড়েছি" with read counts) and tick off their tasks. Dashboard shows unread notices and open tasks. Data: `pharmacy_team`. Sidebar + Ctrl+K entry.

## v26 — Operations Panel upgrade (`assets/js/admin-more.js`)
Team Board tab for every Ops role (notices with read-receipts, shift-handover notes, tasks by role with due dates; shares data with the staff Team Board), Ctrl+K / "/" quick-jump palette, mobile bottom bar, and "Print delivery slips" for Packed/Shipped orders in Delivery.

## v27 — Control Center: Features & Security tabs
**Features:** switch Team Board, Refunds, Expiry write-off, Rx register, Daily closing and Reorder list on/off; hidden ones vanish from sidebar, Ctrl+K and quick actions, and their pages show "disabled by Admin" (data is kept).
**Security:** set wrong-password limit (3–10) and first lock time, idle auto sign-out, an optional message on the login page; unlock everyone; login activity table (failed-only filter, CSV export, clear).

## v28 — Security hardening (see SECURITY.md)
Salted PBKDF2 password hashes + password policy (also for custom accounts changing their own password), absolute session limit, default-password warnings, stored-XSS guard on all saved text, clickjacking guard, CSP meta on every page + `_headers` for real hosting, safer backup restore (security keys need explicit confirmation), password-change audit, Control Center → Security: session length.

## v29 — Storefront + Ops Panel
- Shop (`assets/js/store-more.js`): recently viewed strip, delivery ETA on product page, order tracking timeline + one-click Reorder on Orders, free-delivery progress bar in cart, sticky mobile cart bar, back-to-top button.
- Ops Panel (`assets/js/admin-v29.js`): "Today" strip on Dashboard (revenue, POS sales, online orders, awaiting action); status counts and CSV export on Orders.

## v30 — POS Sales + Shopping Cart
- POS (`assets/js/pos-extra.js`, loaded by `sales.html`): hold/resume bills (F4), unsaved-cart autosave/restore, quick-cash buttons with live change/short display, cart unit summary, shortcuts F2 (search) / F9 (pay).
- Shop cart (`assets/js/store-more.js`): +/− steppers, per-unit price and low-stock note, Save for later list, Clear cart, savings line, Rx notice, "You may also need" suggestions.
