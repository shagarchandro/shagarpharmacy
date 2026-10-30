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

## v31 — Payment system (demo, no real gateway)
- POS (`pos-extra.js`): Mobile → provider (bKash/Nagad/Rocket/Upay) + required TrxID; Card → required slip/approval no.; reference saved on the sale and printed on the invoice. Never stores card numbers.
- Shop checkout (`store-more.js`): Cash on delivery, Card on delivery, bKash/Nagad/Rocket (demo) with required TrxID; saved on the order.
- Ops Orders (`admin-v29.js`): per-method totals with unpaid amounts, pay-reference tag, "Paid" checkbox per order, CSV includes Pay ref / Paid.
- Fix: `sales.html` no longer shows an empty product list when `pharmacy_medicines` is an empty array.

## v32 — Control Center (admin panel) upgrade
- 💳 Payments tab (`center-more.js`): turn each online method (COD, Card on delivery, bKash, Nagad, Rocket) and POS method (Card, Mobile) on/off, set wallet numbers shown at checkout, choose whether TrxID/slip numbers are mandatory.
- 📊 Insights tab: all-time and 14-day revenue, 14-day bar chart, payment mix, top 5 products, unpaid online orders, CSV export of all sales.

## v33 — Admin Dashboard + Ops Panel
- Admin Dashboard (`dash-admin.js`, admin role only): online-shop snapshot, system health (last backup, storage, default passwords), recent sign-ins and changes, shortcuts into Control Center tabs.
- Ops Panel (`admin-v29.js`): Dashboard "Needs attention" list with jump buttons and 14-day revenue bars; Orders "Confirm all pending" bulk action.

## v34 — Split payment + fixes
- POS: new "Split" payment (cash part + wallet part with TrxID); sale stores `parts`, invoice prints both amounts, Daily Closing counts the cash part toward expected cash and the wallet part under mobile.
- Fix: the Chart.js offline fallback in `guard.js` no longer throws "Cannot set properties of undefined (setting 'data')" on Reports when the CDN is unreachable (charts still need Chart.js online to draw).

## v35 — Due bills, real POS customers, product reviews
- POS: customer list now comes from Customers (`pharmacy_customers`) when it has records; shows the customer's existing due. New "Due (বাকি)" payment adds the bill to that customer's due and the customer ledger (needs a saved customer, confirmation prompt).
- Dashboard payment mix now splits Split-payment sales into their cash/wallet parts.
- Shop product page: star ratings and reviews (stored on this device only; text is escaped).

## v36 — Customer self-service
- Shop Orders: customers can cancel their own Pending / Prescription-Review orders (stock is restored, Ops gets a notification).
- Order-success page: "Print receipt" button.

## v37 — Ops Panel list tools
- `admin-v36.js`: Products, Inventory, Orders, Customers, Suppliers, Purchases, Returns, Expenses, Alerts and Users lists with 6+ rows get a search box with row count, click-to-sort headers and a CSV export of the visible rows.

## v38 — Control Center: Maintenance tab
- 🛠 Maintenance (`center-more.js`): health check (duplicate barcodes, expired-but-in-stock, missing price, negative stock, selling below cost, shop products without price), configuration export/import (branding, rules, roles, security, shop settings and coupons — not sales, customers or passwords), and a storage-usage table with one-click clear for safe caches (recently viewed, reviews, saved-for-later, held bills, POS draft, login log, lockouts).

## v39 — Online Shop
- Catalog quick filters (In stock / No prescription / On offer, remembered for the session), Best sellers strip (from real orders), and the hero/offer text now shows the live first coupon from Control Center instead of a fixed SAVE10.

## v40 — Online Shop product & wishlist pages
- Product page: quantity box, Buy now (straight to checkout), Share (native share / copy link), and "Notify me when back in stock" for sold-out items (sends a notification to the Ops panel).
- Wishlist: "Add all to cart" (skips unavailable items) and Clear.

## v41 — Shop: Help, Contact, Ask pharmacist, Orders
- Help: searchable FAQ (10 answers; delivery fees, free-delivery and minimum-order text come from the live shop settings).
- Contact: call/address/hours cards (from Ops settings), topic selector, character counter, reference number, recent-message list.
- Ask pharmacist: emergency notice, topic + medicine picker, reference number, recent questions, profile prefill.
- Orders: guest "Track an order" (order number + mobile, no login).

## v42 — Ops Notifications inbox
- Ops → Notifications (`admin-v42.js`): filter chips (All / Unread / Questions / Orders with counts), per-message "Mark read", and written replies to customer questions and contact messages (Owner/Pharmacist). The reply appears to the customer in the shop under "Your recent messages" (Ask pharmacist / Contact).

## v43 — Delivery zones
- Control Center → 🚚 Delivery: add/remove delivery zones with a fee and optional delivery-time text (max 20). With zones defined, checkout shows them instead of Dhaka/outside-Dhaka and uses the zone fee (free-delivery rule still applies); the order records the zone.
- Checkout now has a live order summary (subtotal, discount, delivery, total, ETA) that updates when the zone changes.

## v44 — Smarter alerts (Ops Panel)
- Ops → Alerts (`admin-v44.js`): severity levels (Critical / Warning / Info) with filter chips, more checks (sold-out products, Rx waiting 2h+, orders Pending 12h+, wallet payments unchecked 24h+, unanswered customer questions, back-in-stock requests), "Open →" jump buttons (respecting role access), 24-hour Snooze/Unsnooze, and a live count on the Alerts tab button and the page title.

## v45 — POS Sales
- Top-seller chips (last 30 days) for one-tap adding; quantity in the cart is an editable box (stock-checked); "Today" panel lists the day's bills with totals and **Reprint** for any bill.

## v46 — Admin controls the customer shop
- Control Center → 🛍 Customer shop (`center-more.js`) and shop layer `store-control.js`: open/closed + banner, minimum order, free-delivery threshold, home headline/sub-line, footer note, 11 section switches (offers, featured, best sellers, recently viewed, quick filters, reviews, delivery note, guest tracking, trust/testimonials, wishlist, Ask pharmacist), per-product Visible / Featured / Discount %.
- The shop refreshes itself when the admin saves in another tab (storage event); hidden products disappear from the catalog, product page, wishlist and block checkout if still in a cart.
- Online-only: hiding a product does not stop it being sold at the POS.

## v47 — Online shop design + footer
- `assets/css/shop-design.css` + `assets/js/store-design.js`: new hero (call-to-action buttons, trust chips), icon offer cards, scrollable category chips, card-style filter bar, redesigned product cards (hover lift, full-width Add to cart row), softer trust section, compact non-sticky header on phones.
- New multi-column footer: brand blurb + admin footer note, quick links (respects hidden sections), contact (tap-to-call, address, hours), delivery fees/free-delivery/minimum order and the enabled payment methods, bottom bar with privacy/terms and back-to-top — all from the live shop settings, English or Bengali.

## v48 — Control Center: Checkup, Coupons, Audit explorer
- **🩺 Checkup** (`center-more.js`): health score + issues found in the live config (shop closed, no phone/address, payments off, products hidden/priced 0/out of stock, expired coupons, default passwords, stale backup) with a one-click jump to the right tab.
- **🎟 Coupons**: add with percent, minimum order, max-discount cap, expiry date and usage limit; pause/resume/delete; status (Live / Paused / Expired / Used up) and usage count.
- `assets/js/store-coupons.js` enforces those rules in the customer shop (Apply, totals cap, re-check at checkout) and stores `order.coupon` on each order; cancelled orders don't count toward the limit.
- **📜 Audit explorer**: search, filter by person, CSV export of the admin audit trail.

## v49 — Backup & Restore (`backup.html` + `assets/js/backup-more.js`)
- Choose exactly which datasets to back up; "⚡ quick backup" takes everything except passwords/roles/accounts (🔒 items are off by default).
- Backup files now carry a checksum (v8 format). Restore first shows a **preview** (file date, checksum ✅/⚠, each dataset: in file vs now) and only restores the ticked items; corrupt entries are disabled. Old v7 files still open (no checksum).
- Every restore and every "delete all" first saves a restore point; **↩️ Undo** returns to it.
- Backup-age badge (✅ ≤2 days, 🟡 ≤7, ⛔ older) and a browser-storage meter.
- Pharmacists still get export only; non-admin users still see the access-denied card.

## v50 — Reports: real business summary (`reports.html` + `assets/js/reports-real.js`)
- New tab **📈 Business summary** built only from real data: POS sales (Completed only; voids excluded) + online orders (cancelled/returned excluded). Period (today/7/30/month/all/custom) and source (POS/Online/both) filters.
- Revenue, real **gross profit** (item purchase price from Medicines / shop product cost; sales without a cost are listed as excluded), expenses from the Ops cashbook, net, discounts; daily trend, top products, payment mix (split payments counted per method), top customers, cashiers, busy hours.
- Working **CSV export** (sales lines) and Print. The old "Export" buttons in the other tabs were stubs that only showed a toast — they now download CSV too.
- Hardened the sales/inventory tables against records with missing numbers.

## v51 — Daily closing + cart/checkout/contact entry pages
- `closing.html` (+ `assets/js/closing-v51.js`): full cash-drawer reconciliation — opening cash (auto = previous closing's counted − deposit), + cash sales (net of refunds), + customer dues collected in cash, − cash expenses from the Ops cashbook, − manual cash-out entries, = expected cash. Denomination counter (৳1000…৳1) fills the counted cash. A difference of ৳1+ requires a reason note. Bank/owner deposit field. Re-closing a day is confirmed and counted as a revision. Day navigation (◀ ▶, today), closed/open badge, cashier table, discounts/dues/voids tiles, last-30-day over/short summary, click a history row to open that day, CSV export, print header. Days now use Dhaka time (previously UTC date).
- `cart.html`, `checkout.html`, `contact.html`: branded redirect pages (dark-mode aware) showing live cart count / shop phone, then forwarding to the shop. Checkout with an empty cart goes to the cart instead.

## v52 — Reports: remaining demo parts made real (`assets/js/reports-fix.js`)
- Sales tab: voided invoices excluded; "N items" shows the real quantity (was `[object Object] items`); Top product computed from sale lines (was hard-coded Paracetamol); 12-month trend aligned to its month labels.
- Financial tab: year list is now the current year and 4 before (was 2022–2024); real **Profit & Loss**, **Cash flow** and a simplified **Balance sheet**; revenue/expense/profit charts use real monthly numbers for the selected year (was fixed arrays and "expenses = 65% of revenue"). Supplier payments are treated as stock purchases (inside COGS), not operating expense.
- Customer tab: outstanding dues come from Customers. Expiry tab: "Mark for Discount" really sets a % discount on the matching online-shop product.

## v53–v57 — Medicines, Purchases, Suppliers, Prescriptions, Customers
- **Medicines** (`medicines-extra.js`): validated CSV import with preview (new vs update by name+batch, bad rows listed), CSV export + template, bulk % price change by category, stock adjustment with a reason (logged in `pharmacy_stock_log`, CSV), one-click undo of the last import/bulk price change.
- **Purchases** (`purchases-extra.js`): supplier payables aging (0–30 / 31–60 / 60+ days), pay a supplier across their oldest invoices first (FIFO; also recorded in the Ops cashbook as a supplier payment), purchases CSV.
- **Suppliers** (`supplier-sync.js`, `suppliers-extra.js`): fixed a data-model clash — Purchases and Suppliers used different field names (name/contact vs companyName/contactPerson) for the same list and each hid the other's records. Both spellings are now kept, and totals are recomputed from real purchases. Payables overview: credit-limit use, overdue vs payment terms, call / WhatsApp reminder, CSV.
- **Prescriptions** (`prescriptions-extra.js`): "Needs attention" panel (expiring ≤7 days, expired & not fully dispensed), real WhatsApp/SMS reminders (the old button only showed a fake "Reminder sent"), expired prescriptions need a confirmed pharmacist override before going to POS, demo-OCR notice.
- **Customers** (`customers-extra.js`): real SMS/WhatsApp messages (the old SMS button was a fake toast), date of birth is now saved (the field was ignored), join date no longer resets on edit, follow-up panel (dues, birthdays in 14 days, inactive 60+ days from real POS sales) with CSV.

## v58 — Smart reorder (`reorder.html` + `assets/js/reorder-v58.js`)
- Suggested quantity from real POS sales velocity (voids excluded): enough for N days of stock (default 14, looked back 30 days), at least twice the minimum; "days left" per item; urgent tag (stock 0 or < 7 days).
- Supplier comes from the last purchase of that medicine (or one you choose — remembered in `pharmacy_med_supplier`); unit cost from the last purchase price.
- Select rows, edit quantities, filter by supplier / urgent / search; CSV of the selection; **purchase orders grouped by supplier** with print, copy text and a prefilled WhatsApp message to the supplier's saved number.

## v59 — Refunds & write-offs
- **Refunds** (`refunds.html`): the refund now deducts the item's fair share of the invoice discount (before, a discounted sale was refunded at full item price); choose how the money goes back — cash / original method (bKash, card) / credit adjustment; a warning appears for invoices older than 30 days; dates use Dhaka time.
- **Daily closing**: only *cash* refunds reduce the drawer's expected cash (refunds returned to bKash/card no longer cause a false shortage).
- **Write-off** (`writeoff-extra.js`): partial / manual write-off with quantity and reason (damaged, lost, supplier return, other) next to the existing expired-stock write-off; same history & CSV.
- **Reports → Financial**: write-off losses now count as an operating expense ("Stock write-offs").

## v60 — Admin login system ও login pages আপডেট
- `admin/login.html` নতুন ডিজাইন: Ops user কার্ড, পাসওয়ার্ড/কোড দেখানোর বোতাম, শেষ লগইনের সময়, নোটিশ/ফ্ল্যাশ ব্যানার।
- `assets/js/ops-login.js`: ভুল কোডে লক-আউট (ক্রমবর্ধমান সময়), লগইন লগ, ব্যক্তিগত Ops PIN সাপোর্ট (না থাকলে ডেমো কোড `demo`)।
- `assets/js/ops-session.js`: idle ও সর্বোচ্চ সেশন টাইমআউট, ১ মিনিট আগে সতর্কবার।
- `assets/js/login-v60.js`: staff login-এ Admin role-এর জন্য দ্বিতীয় ধাপ Admin PIN।
- Control Center → 🔑 Sign-in ট্যাব: Admin PIN সেট, প্রতি Ops user-এর PIN, সাম্প্রতিক লগইন তালিকা + CSV।
- সীমাবদ্ধতা: ডেমো-স্তরের নিরাপত্তা; PIN হ্যাশ (PBKDF2) হলেও এই ব্রাউজারের localStorage-এ থাকে।

## v61 — Rx Register ও Team Board আপডেট
- `register.html` + `assets/js/register-extra.js`: দ্রুত ফিল্টার (আজ/৭ দিন/এই মাস/সব/⚠️ Rx ref ছাড়া), KPI (বিক্রি, গ্রাহক, ইউনিট), শীর্ষ ৫ ওষুধ, verifier অনুযায়ী সারাংশ, Rx ref নেই এমন সারি লাল হাইলাইট; CSV এখন নির্বাচিত ফিল্টার মানে।
- `team.html` + `assets/js/team-extra.js`: সারাংশ বার (অপঠিত, জরুরি, খোলা কাজ, দেরি, আজ সম্পন্ন), নোটিশ সার্চ + অপঠিত/জরুরি ফিল্টার, "সব পড়েছি", কাজের ফিল্টার (দেরি/আজ)।
- টেস্ট: `t.py`-এর Ops লগইন স্টেপ নতুন কার্ড-লগইনে মানানো হয়েছে।

## v62 — Smart Alerts (Warning সিস্টেম)
- `assets/js/alerts-v62.js` (dashboard): আসল ডেটা থেকে সতর্কতা কেন্দ্র — মেয়াদোত্তীর্ণ / ৩০·৬০·৯০ দিনের মধ্যে মেয়াদ, স্টক শেষ/কম (প্রস্তাবিত অর্ডার সহ), গ্রাহক ও সরবরাহকারীর বাকি, গতকালের ক্লোজিং বাকি, Rx ref ছাড়া বিক্রি, অপেক্ষমাণ প্রেসক্রিপশন, ব্যাকআপ পুরনো/নেই, অনলাইন অর্ডার।
- তিন স্তর (🔴 জরুরি / 🟠 সতর্ক / 🔵 তথ্য), ফিল্টার চিপ, প্রতিটি সতর্কতায় সংশ্লিষ্ট পেজে বোতাম, 💤 ২৪ ঘণ্টা snooze ও ফেরানো।
- নকল বেল-নোটিফিকেশন ও ব্যাজ বদলে আসল সতর্কতা; Low-stock ও Expiry কার্ড নতুন রঙিন ডিজাইনে; "Order Now/Take Action" এখন নকল টোস্টের বদলে Reorder/Medicines পেজে নেয়।

## v63 — সুন্দর Popup/Dialog (alert · confirm · prompt)
- `assets/js/dialogs.js` সব পেজে (root ও admin/) যোগ: নেটিভ browser popup-এর বদলে আধুনিক মোডাল — লাইট/ডার্ক থিম, মোবাইলে নিচ থেকে ওঠা bottom-sheet, Enter/Esc/Tab, ব্যাকড্রপ ক্লিকে বাতিল, ঝুঁকিপূর্ণ কাজে (মুছুন/রিসেট/void) লাল সতর্কতা বোতাম।
- `prompt`: সংখ্যার ক্ষেত্রে number ইনপুট; পরিশোধ/ফেরতের টাকায় "সম্পূর্ণ / অর্ধেক" দ্রুত বোতাম (যেমন Supplier Pay)।
- `alert`: সফল ✅ / সতর্ক ⚠️ / তথ্য ℹ️ আইকনসহ, একাধিক হলে সারিবদ্ধভাবে।
- কৌশল: confirm/prompt সিঙ্ক্রোনাস তাই উত্তর পেয়ে মূল ক্লিক/সাবমিট ইভেন্ট replay করা হয়; ইভেন্ট ধরা না গেলে নেটিভ পপআপে ফেরে। Promise API: `MCD.alert/confirm/prompt`।
- অটোমেশন (webdriver) ব্রাউজারে নেটিভ থাকে (পুরনো টেস্ট অক্ষত); জোর করতে `window.__MCD_FORCE=true`।

## v64 — POS হোল্ড-বিল বাছাই ও শিফট ক্লোজ মোডাল
- `dialogs.js`: নতুন `MCD.choose` (তালিকা থেকে বাছাই) এবং prompt-এ লাইভ হিন্ট (`live`), `chips:false` অপশন।
- POS "▶ Resume held": নম্বর টাইপের বদলে কার্ডের তালিকা (সময়, আইটেম, নাম, মোট টাকা); কার্ট ভরা থাকলে আলাদা নিশ্চিতকরণ।
- "🧾 Close my shift": প্রত্যাশিত নগদ আগে থেকে বসানো, টাইপ করতে করতে লাইভ "কম/বেশি/মিলেছে" দেখায়।
- পুরনো নেটিভ prompt পথ (অটোমেশন ব্রাউজারে) অক্ষত।

## v65 — POS "📜 Sales history"
- `assets/js/sales-history.js` (sales.html): বিক্রির ইতিহাস প্যানেল — সার্চ (ইনভয়েস/গ্রাহক/ওষুধ/ক্যাশিয়ার/Rx), আজ/গতকাল/৭ দিন/সব, পেমেন্ট ফিল্টার, সারাংশ (সংখ্যা ও মোট)।
- 🖨 রিসিট পুনর্মুদ্রণ, ↩ রিফান্ড পেজে লিংক, 🗑 Void (শুধু Admin/Pharmacist): কারণ বাধ্যতামূলক, স্টক ফেরত, রেকর্ড `Voided` হিসেবে থাকে (কারণ/কে/কখন), audit log-এ লেখা। Staff শুধু নিজের বিক্রি দেখে।

## v66 — Void এক নিয়মে (সব জায়গায়)
- Control Center → Sales: Void এখন POS-এর মতোই: সুন্দর মোডালে কারণ, স্টক ফেরত, রেকর্ড মুছে না ফেলে `Voided` + কারণ/কে/কখন, audit log। তালিকায় "VOID — কারণ" দেখায়।
- Void হওয়া বিক্রি বাদ পড়ে: Dashboard, Reports, POS কার্ড/শিফট, Control Center ওভারভিউ ও analytics, Refunds সার্চ, POS payment-sync।

## v67 — Void-এ গ্রাহকের বাকি ফেরত
- `assets/js/void-core.js`: একক `mcVoid(sale, reason, by)` — স্টক ফেরত, `Voided` চিহ্ন (কারণ/কে/কখন), audit, দ্বিতীয়বার void ঠেকানো। POS Sales history ও Control Center দুটোই এটি ব্যবহার করে (আগের ডুপ্লিকেট কোড বাদ)।
- বাকি (due) বিক্রি void করলে গ্রাহকের বাকি কমে (বিক্রির মোট বা বর্তমান বাকির যেটি কম) এবং `pharmacy_customer_ledger`-এ `void` এন্ট্রি পড়ে। গ্রাহক আগেই কিছু শোধ করলে বার্তায় জানায় বাকিটা ফেরত দিতে হবে।

## v68 — Ops Panel (admin/) নতুন ইন্টারফেস
- `assets/js/admin-ui-v68.js` + `assets/css/admin-ui-v68.css`: ডেস্কটপে (≥960px) বাম পাশে গ্রুপ-করা সাইডবার (Overview/Sell/Stock/People/Money & data), আইকন, সক্রিয় ট্যাব হাইলাইট, লাল ব্যাজ (Alerts/Orders/Rx/Notes সংখ্যা), "Collapse" দিয়ে আইকন-মোড (মনে রাখে)।
- হেডার: ১৯টি ট্যাবের ভিড় হটিয়ে শুধু ব্র্যান্ড + 🔍 Jump (Ctrl K) + ইউজার চিপ + টুলস। মোবাইলে ট্যাব এক লাইনে স্ক্রল, ডুপ্লিকেট "Owner" বাদ।
- প্রতিটি পেজে আইকনসহ পেজ হেডার ও আজকের তারিখ (ঢাকা, বাংলায়)।
- ড্যাশবোর্ড KPI কার্ডে আইকন, রঙ (সতর্ক/বিপদ) ও ক্লিক করলে সংশ্লিষ্ট ট্যাবে যাওয়া; খালি Low stock-এ "✅" বার্তা।

## v69 — আসল সার্ভার + ডাটাবেস (Node.js + SQLite, নিজের কম্পিউটারে)
**চালানোর নিয়ম:** [Node.js](https://nodejs.org) (LTS, ভার্সন ২২.৫ বা নতুন) ইনস্টল করে এই ফোল্ডারে `npm start` (Windows-এ `START-WINDOWS.bat` ডাবল-ক্লিক; Mac/Linux-এ `./start.sh`) → ব্রাউজারে `http://localhost:3000`। কোনো `npm install` লাগে না (বাইরের প্যাকেজ নেই)। পোর্ট বদলাতে `PORT=3100`, ডেটার ফোল্ডার বদলাতে `PMS_DATA=/path`।
- **ডেটা এখন সার্ভারের ডাটাবেসে** (`data/pharmacy.db`, SQLite): ওষুধ, বিক্রি, কাস্টমার, সাপ্লায়ার, অর্ডার, স্টক, ইউজার সবই। ব্রাউজারের localStorage শুধু ক্যাশ। এক কম্পিউটার/ফোন থেকে লিখলে অন্যটায় লাইভ আসে (নীল "🔄 নতুন ডেটা" বার ট্যাপ করে রিফ্রেশ)।
- **আসল লগইন:** পাসওয়ার্ড সার্ভারে scrypt হ্যাশ; সেশন HttpOnly কুকিতে (JS পড়তে পারে না); ভুল পাসওয়ার্ডে সার্ভার-সাইড লক-আউট; Admin PIN সার্ভারে যাচাই; লিখতে CSRF-সুরক্ষা; Role অনুযায়ী কোন ডেটা কে বদলাতে পারবে সার্ভারই ঠিক করে।
- **ডিফল্ট অ্যাকাউন্ট** (প্রথম লগইনে পাসওয়ার্ড বদলানো বাধ্যতামূলক): `admin@medicare.com / admin123`, `pharmacist@medicare.com / pharm123`, `staff@medicare.com / staff123`; Ops Panel-এ ৫ জন (পাসওয়ার্ড `demo`)। শুধু পরীক্ষার জন্য `PMS_NO_FORCE_CHANGE=1`।
- **🛡 সার্ভার প্যানেল** (নিচে-ডানে বাটন): আমার পাসওয়ার্ড/Admin PIN; (Admin/Owner) ইউজার যোগ-বন্ধ-পাসওয়ার্ড রিসেট; ব্যাকআপ (প্রতিদিন নিজে থেকে, শেষ ১৪টি) / JSON এক্সপোর্ট-ইম্পোর্ট / সব রিসেট (আগে সেফটি ব্যাকআপ); অডিট লগ।
- **গ্রাহকের অর্ডার সার্ভারে যাচাই:** দাম, স্টক (মেয়াদ-উত্তীর্ণ বাদ, FEFO), কুপন, ডেলিভারি ফি, Rx নিয়ম, wallet TrxID — ব্রাউজার যা-ই পাঠাক, সার্ভার নিজে হিসাব করে; ভুয়া দাম কাজ করে না। অর্ডার নম্বর সার্ভার দেয়, দুজনের একই নম্বর হয় না। গ্রাহক বাতিল করলে স্টক ফেরত। অর্ডার ট্র্যাকিং নম্বর+ফোন মিললে।
- **একসাথে একাধিক ডিভাইস:** প্রতিটি ডেটার ভার্সন আছে; একই সময়ে দুজন বদলালে 3-way merge (আইডি ধরে তালিকা মেলানো, স্টক/বাকির সংখ্যা যোগ-বিয়োগ করে)। একই ঘরে দুজন ভিন্ন মান দিলে শেষ-সেভকারী জেতে।
- **পুরনো ডেমো-ডেটা:** Admin প্রথমবার লগইন করলে ব্রাউজারে আগের ডেটা থাকলে "সার্ভারে তুলবেন?" জিজ্ঞেস করে।
- **সার্ভার ছাড়া** (শুধু ফাইল খুললে/স্ট্যাটিক হোস্টে) সবকিছু আগের মতো ডেমো মোডে চলে — কিছু ভাঙেনি।
- নতুন ফাইল: `server/` (db, auth, shop, server), `assets/js/server-sync.js` (সব পেজের প্রথম স্ক্রিপ্ট), `login-server.js`, `users-server.js`; `ops-login.js`-এ সার্ভার শাখা।
- **সীমাবদ্ধতা (সৎভাবে):** শুধু আপনার নেটওয়ার্কের জন্য — HTTPS নেই (LAN-এ অন্য ডিভাইস থেকে খুলতে `HOST=0.0.0.0`, তখন ডেটা/পাসওয়ার্ড সাধারণ HTTP-তে যায়; ইন্টারনেটে খুলতে হলে HTTPS রিভার্স-প্রক্সি লাগবে)। পেমেন্ট (bKash/Nagad) ও SMS/ইমেইল এখনো ডেমো — আসল গেটওয়ের API কী লাগবে। ডেটা এখনো একটি JSON-ব্লব/তালিকা হিসেবে রাখা (বড় দোকানে লাখ লাখ রেকর্ডে ধীর হতে পারে)। ইউজার-তালিকা বাদে পুরনো Control Center → Accounts/Sign-in ট্যাব সার্ভার মোডে নিষ্ক্রিয় (নোটিশ দেখায়)।

## v70 — সেশন, ব্যাকআপ রিস্টোর, HTTPS/LAN
- 🛡 সার্ভার প্যানেল → **🔐 সেশন**: কোন কোন ডিভাইসে লগইন আছে (নাম, ডিভাইস/ব্রাউজার, IP, শেষ সক্রিয়), একটি বা "আমার অন্য সব ডিভাইস" থেকে লগআউট। Admin/Owner সবার সেশন দেখে ও বের করতে পারে।
- **ব্যাকআপ রিস্টোর**: তালিকার প্রতিটি ব্যাকআপে "রিস্টোর" — আগে সেফটি ব্যাকআপ, তারপর ডেটা ফিরে আসে, সব ডিভাইসে লাইভ আপডেট যায়। (ইউজার/পাসওয়ার্ড রিস্টোরে বদলায় না।)
- **HTTPS (ঐচ্ছিক):** `PMS_CERT=cert.pem PMS_KEY=key.pem npm start` — তখন কুকিতে `Secure` যুক্ত হয়। নিজে সার্টিফিকেট বানাতে: `openssl req -x509 -newkey rsa:2048 -nodes -keyout key.pem -out cert.pem -days 365 -subj /CN=localhost`। (ব্রাউজার সতর্কতা দেখাবে — নিজের সই, ঠিক আছে।)
- **LAN-এ ফোন থেকে খোলা:** `HOST=0.0.0.0 npm start` — স্টার্টআপে অন্য ডিভাইসের জন্য ঠিকানা (যেমন `http://192.168.x.x:3000`) ছাপে; HTTPS ছাড়া চালালে সতর্কতা দেয়।
- সীমাবদ্ধতা: shift-close টেস্ট (v64) আজকের তারিখে ফেল করছে — v69 ছাড়া কপিতেও একই; কারণ এখনো খোঁজা হয়নি।

## v71 — Control Center: 🖥 Server ট্যাব
- নতুন `assets/js/center-server.js` (শুধু সার্ভার মোডে, Admin/Owner): **🖥 Server** ট্যাব — চালু থাকার সময়, Node ভার্সন, ঠিকানা, ডাটাবেস আকার, সক্রিয় ইউজার/সেশন/লাইভ ব্রাউজার, ব্যাকআপ সংখ্যা ও শেষ সময়।
- **নিরাপত্তা চেকলিস্ট** (✔/⚠ + কী করবেন): ব্যাকআপ ৪৮ ঘণ্টার মধ্যে? পাসওয়ার্ড বদল বাকি অ্যাকাউন্ট? PIN-হীন Admin? নেটওয়ার্কে খোলা কিন্তু HTTPS নেই? ডাটাবেস খুব বড়?
- কোন ডেটা কতটা জায়গা নিচ্ছে (ভার্সন, শেষ কে বদলেছে), এখন কারা লগইন আছে, সব ইউজারের তালিকা (শেষ লগইন, PIN)।
- পুরনো **Accounts / Sign-in** ট্যাব সার্ভার মোডে সার্ভার প্যানেলের দিকে দেখায়; Sign-in ট্যাবে সার্ভারের লগইন-রেকর্ড (IP সহ) দেখা যায়।
- নতুন সার্ভার API: `GET /api/status` (শুধু Admin/Owner)।

## v72 — Control Center: নতুন Overview, Ctrl+K, 🧳 Config
- `assets/js/center-v72.js`: **Overview** নতুন — আজকের POS বিক্রি/বিল, আজকের ও অপেক্ষমাণ অনলাইন অর্ডার, প্রেসক্রিপশন, কম/শেষ স্টক, মেয়াদ-শেষ/৩০ দিনে-শেষ, গ্রাহকের মোট বাকি; গত ৭ দিনের বিক্রির চার্ট (ঢাকার তারিখ); সেরা ৫ ওষুধ (৩০ দিন); "নজর দিন" তালিকা (জরুরি/দেখুন)। Void হওয়া বিক্রি বাদ।
- **Ctrl+K** (বা "🔎 খুঁজুন") — যেকোনো ট্যাবে টাইপ করে ঝটপট যাওয়া (↑↓ Enter Esc)।
- **🧳 Config** ট্যাব: শুধু সেটিং (ব্র্যান্ডিং, রুলস, রোল, থিম, কুপন, শপ-সেটিং, শপ-সিঙ্ক তালিকা) JSON এক্সপোর্ট/ইম্পোর্ট — ওষুধ/বিক্রি/গ্রাহক/পাসওয়ার্ড/PIN থাকে না; ইম্পোর্টে নিশ্চিতকরণ ও audit লগ; বিদ্যমান PIN অক্ষত।

## v73 — Ops Panel লাইভ অর্ডার + গ্রাহকের স্ট্যাটাস বার্তা
- `assets/js/ops-live.js`: গ্রাহক অর্ডার দিলে Ops Panel-এ **রিলোড ছাড়াই** 🔔 শব্দ + "নতুন অর্ডার INV-… (৳…)" বার্তা + ট্যাব-টাইটেলে সংখ্যা, আর Dashboard/Orders/Rx/Alerts/Returns/Notes তালিকা নিজে রিফ্রেশ। টাইপ করার সময় বা পপআপ খোলা থাকলে রিফ্রেশ অপেক্ষা করে। সার্ভার মোডে অন্য ডিভাইস থেকে, ডেমো মোডে একই ব্রাউজারের অন্য ট্যাব থেকে কাজ করে।
- অনলাইন শপ: গ্রাহকের শপ-পেজ খোলা থাকলে Ops অর্ডারের স্ট্যাটাস বদলালেই "📦 আপনার অর্ডার INV-… এখন: Confirmed" বার্তা আসে (সার্ভার মোডে)।
- সীমা: শব্দ ব্রাউজার-নীতির কারণে পেজে একবার ক্লিক/টাচ করার পর বাজে।

## v74 — Team Board · Daily Closing · Reorder List
- **Team Board** (`team-daily.js`): 🔁 **দৈনিক চেকলিস্ট** — প্রতিদিন (ঢাকার তারিখ) নতুন করে শুরু; কে কখন টিক দিল দেখায়; শুধু নিজের টিক সরানো যায় (Admin/Pharmacist সবারটা); শেষ ৭ দিনের পূর্ণতার বার; Admin/Pharmacist "✏️ তালিকা বদলান" (`;` দিয়ে আলাদা, সর্বোচ্চ ১৫টি)। ডেটা `pharmacy_team_daily`।
- **Daily Closing** (`closing-v74.js`): ⚠ গত ১৪ দিনে বিক্রি হয়েছে কিন্তু ক্লোজিং হয়নি এমন দিনের সতর্কতা (বাটনে চাপলে সেই দিন খোলে); 📅 এই মাসের সারাংশ (ক্লোজ করা দিন, নিট বিক্রি, গড়/দিন, মোট ঘাটতি/উদ্বৃত্ত, সেরা দিন); ১৪ দিনের রঙিন বার (🟩 মিলেছে, 🟥 পার্থক্য, 🟧 ক্লোজ হয়নি, বারে ট্যাপ করলে সেই দিন)।
- **Reorder List** (`reorder-v74.js`): সাপ্লায়ার-অর্ডার কার্ডে **✔ অর্ডার দেওয়া হয়েছে** → "📬 পথে আছে" তালিকা; তালিকার ওষুধের পাশে "📬 পথে N" ব্যাজ ও লুকানোর টিক (ডিফল্ট চালু) যাতে একই ওষুধ দু'বার অর্ডার না হয়; "📥 পেয়েছি"/"✖ বাতিল"। ডেটা `pharmacy_reorder_log`। (পেয়েছি দিলে Purchases-এ এন্ট্রি নিজে হয় না — মাল ঢোকাতে Purchases ব্যবহার করুন।)

## v75 — Ops Panel: 🛵 রাইডার অ্যাসাইন + COD হিসাব
- `assets/js/ops-delivery.js` (Delivery ট্যাব): Owner "⚙ রাইডার তালিকা" থেকে রাইডার যোগ/বাদ (`pharmacy_riders`); অর্ডারে রাইডার বসানো (এক-এক করে বা সব অ্যাসাইন-না-হওয়া একসাথে); ফিল্টার চিপ (সব / অ্যাসাইন হয়নি / রাইডার)।
- রাইডার-কার্ড: পথে/প্যাকড অর্ডার, আজকের ডেলিভারি, আদায় বাকি (COD), রাইডারের কাছে জমা-না-দেওয়া ক্যাশ; Owner "💰 জমা নিলাম" দিলে সেটেল (`codSettledAt/By`)।
- "Delivered + ৳… আদায়" বাটন: COD অর্ডারে ডেলিভারির সাথে ক্যাশ আদায় ধরা হয় (`codCollected`, `paid`)। Delivery Staff-এর নাম রাইডার-তালিকার সাথে মিললে ডিফল্টে শুধু নিজের অর্ডার দেখে ও পরিবর্তন করতে পারে।

## v76 — দিনের রিপোর্ট শেয়ার + শপে রাইডার
- **Daily Closing** (`closing-share.js`): "📤 রিপোর্ট শেয়ার" — নির্বাচিত তারিখের সারাংশ (POS বিক্রি ও পেমেন্ট মেথড, অনলাইন অর্ডার, বেশি বিক্রির ৩টি, ক্যাশ মিলান/ঘাটতি/নোট বা "ক্লোজিং হয়নি", কম স্টক, গ্রাহকের বাকি) টেক্সটে; WhatsApp-এ পাঠানো বা কপি।
- **অনলাইন শপ**: অর্ডার Packed/Shipped হলে গ্রাহকের "My orders" ও ট্র্যাকিংয়ে "🛵 Rider: নাম" দেখায় (v75-এ রাইডার বসালে)।

## v77 — ঢাকার তারিখ ঠিক (UTC বাগ)
- **বাগ:** "আজকের তারিখ" `toISOString()` (UTC) থেকে নেওয়া হতো — ঢাকায় রাত ১২টা থেকে ভোর ৬টার মধ্যে বিক্রি/রিপোর্ট/শিফট/ক্লোজিং আগের দিনের তারিখে জমা হতো; ওষুধের মেয়াদ-চেকও ৬ ঘণ্টা পিছিয়ে ছিল।
- **ঠিক:** POS (বিক্রি, প্রেসক্রিপশন ফিল), Dashboard, Reports (আজ ফিল্টার), Customers, Suppliers, Purchases, Prescriptions, Write-off, Backup, Medicines, Shop sync, Control Center, Ops core/admin ও সার্ভারের শপ-অর্ডার (ব্যাচ মেয়াদ) — মোট ৩১+ জায়গায় ঢাকার (UTC+6) তারিখ।
- পুরনো রেকর্ড বদলায়নি: আগে রাতে করা বিক্রি আগের দিনের তারিখেই থাকবে।
- এতে পুরনো shift-close টেস্টের ফেলও ঠিক হয়েছে।

## v78 — Customers: 💊 Refill রিমাইন্ডার
- Customers → 📣 Follow-ups-এ নতুন **💊 Refill** ট্যাব: একই গ্রাহক একই ওষুধ ২+ বার (আলাদা দিনে) কিনলে গড় ব্যবধান (৭–১২০ দিন) ধরে পরের কেনার সময় হিসাব হয়; যাদের সময় ৫ দিনের মধ্যে আসছে বা ৩০ দিন পর্যন্ত পেরিয়েছে তাদের তালিকা ("প্রতি ~30 দিনে · আজই / N দিন দেরি / N দিন পরে")।
- 💬 WhatsApp / ✉ SMS-এ ওষুধের নামসহ বাংলা রিমাইন্ডার বার্তা তৈরি হয়; CSV-তেও যোগ হয়েছে।
- সীমা: গ্রাহক POS-এ নির্বাচিত না থাকলে (নাম মিললে ধরা হয়) হিসাব ব্যর্থ হতে পারে; ডোজ/দিনের সংখ্যা জানা নেই, শুধু কেনার ইতিহাস থেকে অনুমান।

## v79 — Home page, Login page, Navbar/Sidebar
- **Home (`home-v79.js`)**: scroll progress bar, scroll-spy nav, ☀/🌙 theme button (remembered), back-to-top, status strip (real server / demo, Dhaka time, online/offline), medicine search in the hero (`/` focuses it), 📦 order tracking (order no + phone; server mode checks on the server), 🎁 live offers from active coupons, 📍 contact card (from Settings → Store settings; phone/address now also saved into the public shop settings), two new FAQs. In server mode the demo-password table is hidden.
- **Login (`login-v79.js`)**: server mode no longer pre-fills demo credentials; role summary under the role picker; Dhaka greeting + clock; server/demo/offline chip; "already signed in" banner; last successful login on this device; Forgot-password no longer fakes "link sent" (honest steps + copyable message for the Admin); autocomplete attributes; after login you return to the page that sent you (`mc_next` saved by `guard.js`).
- **Navbar/Sidebar (`navbar-v79.js`, all staff pages)**: clock, ＋ Quick menu, fullscreen, ⌨ shortcut help (`?`, `g` then d/s/m/c/p/u/x/r/t/l/o/b/h), richer user menu on the dashboard, slim top bar on other pages, sidebar menu filter, scroll position kept, red count badges (low stock, pending Rx, online orders, customer dues, backup overdue).
- Fixed in passing: shop footer uses the saved address/phone.
- Limits: tracking in demo mode only finds orders made in the same browser; the demo contact number is a placeholder until set in Settings; badges refresh on storage events / every minute.

## v80 — Settings
- **Alerts & Session** (was the fake Email/SMS/WhatsApp tab): choose which alert groups you see (stock, expiry, dues, ops), the expiry warning window (30/60/90 days) and an **idle auto-logout** (5–60 min, 1-minute warning, works across tabs; server mode also ends the server session). Stored per user in `pharmacy_prefs_v80`; applied by `alerts-v62.js` and the sidebar badges.
- **Store & Invoice (Admin)**: opening/closing time + weekly off day, saved to settings and the public shop settings → Home shows "এখন খোলা/বন্ধ", Shop footer shows the hours.
- **Data & Tools**: browser storage meter (top 5 keys), settings Export/Import JSON (whitelisted keys only, no passwords/PINs), snooze reset.
- Limits: no real SMS/email is sent anywhere; storage meter is an estimate against ~5 MB; alert-preference changes apply to the bell after a page refresh.

## v81 — Light / Dark / Auto theme (one system)
- New `assets/js/theme-mode.js` (loaded first on every real page). Mode (`mc_theme_mode`: light | dark | auto) is per device/browser and changes all open pages/tabs at once. Auto follows the device and reacts live when the OS switches.
- Before there were four separate mechanisms (dashboard-only toggle, an invert-filter "beta" in Settings, `prefers-color-scheme` only on some pages, `mc_theme` in shop/ops). All now use `MCTheme`; old choices are migrated once. Existing `@media (prefers-color-scheme)` rules obey the chosen mode (Light stays light on a dark device and vice-versa).
- Buttons: dashboard 🌙/☀/🖥 button, Home nav, slim bar on staff pages, shop/ops toolbar, Settings → My Preferences → 🎨 Theme (select). Pages with no toggle get a small floating button (bottom-left).
- Bootstrap staff pages got a proper dark skin (cards, modals, tables, inputs, dropdowns, navbar); the old invert filter is gone.
- Limits: charts keep their own colours; third-party CDN CSS can't be rewritten (only same-origin styles follow the mode); the preference is not synced between devices on purpose.

## v82 — Dashboard
- **Real numbers.** The old dashboard generated random demo sales on every load when no sale existed, estimated "monthly profit" as 30 %, used random trend percentages and random medicine names in Top-selling / Recent Orders. `dash-v82.js` recomputes everything from `pharmacy_sales` (POS) and shop orders: today vs yesterday, last 7 days vs previous 7, month profit vs last month (profit uses each medicine's `purchasePrice`; shows "খরচ জানা N%" when some items have no cost).
- **New widgets**: 🎯 daily/monthly goal with progress and month-end projection (`pharmacy_goal`, Admin/Pharmacist can edit); 📅 today summary (invoices, avg bill, units, profit, top item, busiest hour, payment mix); ✅ "what to do today" list with links (expired/low stock, pending Rx, online orders, dues, missing closing, old backup — honours Settings → Alerts); 📈 SVG sales chart 7 days / 30 days / 12 months (no CDN needed); 🏆 real Top selling (30 days); 🧾 Recent orders (POS + online, with source badge); Bangla time-based greeting.
- **Buttons**: 🔄 refresh, 📤 share today's summary (WhatsApp / copy), ⚙ customise (show/hide sections per user, `pharmacy_dashprefs`). Auto-updates on new sale, storage/live-sync events and every minute.
- Staff role sees only their own sales (matched by cashier name) and no profit/dues/goal editing.
- Limits: refunds are not subtracted yet; online orders appear in Recent Orders but are not part of the KPI totals; cashier matching for staff uses the display name.

## v83 — Customer Management ও POS Billing আপডেট
- **POS (`assets/js/pos-v83.js`)**: গ্রাহক কার্ড (বাকি, ক্রেডিট লিমিট, টিয়ার/পয়েন্ট), `＋ নতুন গ্রাহক` দ্রুত যোগ (ডুপ্লিকেট ফোন আটকায়), আংশিক বাকি (এখন কত দিচ্ছেন), ক্রেডিট লিমিট চেক, `💰 বাকি আদায়`, `🔁 আগের অর্ডার`, বিক্রি গ্রাহকের সাথে লিংক (due, payments, ledger, purchases), ইনভয়েসে WhatsApp রসিদ বোতাম।
- **Customers (`assets/js/cust-v83.js`)**: সেগমেন্ট চিপ (বাকি / ভালো / ৬০+ দিন আসেননি / নতুন / লিমিটের কাছে), কার্ডে শেষ ক্রয়-ভিজিট-টিয়ার, প্রোফাইলে POS খরচ/গড় বিল/প্রিয় ওষুধ/সাম্প্রতিক বিল, ফোন ভ্যালিডেশন + ডুপ্লিকেট চেক, CSV ইমপোর্ট + টেমপ্লেট।
- সীমাবদ্ধতা: পয়েন্ট হিসাব করা হয় (জমা/রিডিম নয়); টিয়ার ফিক্সড (Silver ৫০০০, Gold ২০০০০, Platinum ৫০০০০); CSV সর্বোচ্চ 2 MB; আসল SMS/পেমেন্ট গেটওয়ে নেই।

## v84 — Dark / Light / Auto মোডের টেক্সট-দৃশ্যমানতা ফিক্স
- নতুন `assets/js/theme-fix.js` (theme-mode.js-এর পরে ২৫টি পেজে লোড হয়): ডার্কে সাদা/হালকা ব্যাকগ্রাউন্ডের বক্স (POS product card, Pharmacist worklist, insights কার্ড, Ops panel কার্ড ইত্যাদি) স্বয়ংক্রিয়ভাবে গাঢ় হয়; যেখানে টেক্সট ও ব্যাকগ্রাউন্ডের কনট্রাস্ট কম সেখানে পড়ার মতো রঙ বসে (লাইট মোডেও)।
- থিম বদলালে (Light/Dark/Auto, OS বদলালে, অন্য ট্যাবে বদলালে) ও নতুন অংশ (modal, ডাইনামিক কার্ড) এলে নিজে আবার পরীক্ষা করে।
- `backup.html`-এ স্টাইলশিট লিংক ছিল না (সাদা লেখা সাদা জমিনে) — `assets/css/styles.css` যোগ করা হয়েছে।
- বন্ধ করতে: `localStorage.mc_theme_fix = 'off'`।
- সীমাবদ্ধতা: রঙিন ব্যাজ/বাটন/গ্র্যাডিয়েন্টের উপর সাদা লেখা ইচ্ছাকৃতভাবে বদলানো হয় না; ১০০% নিশ্চিত করা সম্ভব নয় — নতুন কোনো জায়গায় সমস্যা দেখলে জানান।

## v85 — Control Center: গ্রুপ-নেভ, লাইভ স্ট্যাটাস, মনোযোগ কার্ড
- নতুন `assets/js/center-v85.js` (admin-center.html-এ): ২০টি ট্যাব ৫টি গ্রুপে — 🏠 হোম, 🏪 দোকান ও শপ, 👥 মানুষ ও নিরাপত্তা, 📊 রিপোর্ট ও লগ, 🧰 টুলস ও ডেটা। গ্রুপ বদলালে সেই গ্রুপের শেষ দেখা ট্যাব খোলে; **Alt+১–৫** শর্টকাট; মোবাইলে স্ক্রল। পুরনো ট্যাব/#hash/Ctrl+K আগের মতোই।
- উপরে লাইভ স্ট্যাটাস স্ট্রিপ: 🟢/🔴 শপ খোলা-বন্ধ (এক ক্লিকে, বন্ধ করতে নিশ্চিতকরণ, audit লগ), 💾 ব্যাকআপ কতদিন আগে, 🧾 আজকের বিক্রি, 📦 অপেক্ষমাণ অর্ডার (→ Ops Panel), 🔐 Admin PIN ON/OFF, 🖥/💻 মোড। ৩০ সেকেন্ডে ও প্রতিটি ট্যাব-বদলে রিফ্রেশ।
- Overview-র ওপরে "🩺 মনোযোগ দরকার" কার্ড: Checkup স্কোর + প্রথম ৩টি সমস্যা + Fix বোতাম।
- **বাগ ফিক্স:** Checkup সবসময় "No backup taken" বলত (ব্যাকআপ-সময় ISO স্ট্রিং ছিল, সংখ্যা ধরা হচ্ছিল) — এখন ঠিক।
- সীমাবদ্ধতা: শপ-টগল শুধু এই ব্রাউজার/সার্ভারের সেটিং বদলায় (সার্ভার মোডে সিঙ্কের মাধ্যমে); ট্যাবের ইংরেজি লেবেল অপরিবর্তিত।

## v86 — Purchase · Supplier · Prescription Management
- **নিরাপত্তা ফিক্স:** prescriptions.html, purchases.html, suppliers.html-এ নাম/ওষুধ/ডায়াগনোসিস/ঠিকানা ইত্যাদি সরাসরি HTML-এ বসত (stored XSS); এখন escape করা হয়। `onclick`-এ ওষুধ/সাপ্লায়ারের নামে `'` থাকলে বাটন ভেঙে যেত — ঠিক।
- **বাগ ফিক্স:** Supplier এডিট করলে status ('inactive' → 'active') ও joinDate রিসেট হয়ে যেত — এখন অক্ষুণ্ণ থাকে।
- **Purchases (`assets/js/pur-v86.js`):** শেষ/সবচেয়ে কম দাম + দাম ≥১০% বাড়লে সতর্কতা; মেয়াদোত্তীর্ণ ব্যাচ ব্লক, ৯০ দিনের মধ্যে হলে নিশ্চিতকরণ; 📉 কম স্টক থেকে অটো তালিকা; ক্রেডিট লিমিট ছাড়ালে নিশ্চিতকরণ; সেভের পর ওষুধের কেনা-দাম/lastPurchase/মেয়াদ হালনাগাদ ও `dueDate` (payment terms); তালিকায় চিপ (বাকি/ওভারডিউ/এই মাস) + সারাংশ + ⏰ ব্যাজ; 🗑 ভুল কেনা বাতিল (স্টক ও সাপ্লায়ার-বাকি ফেরত, আর্কাইভ `pharmacy_purchases_cancelled`, রিটার্ন থাকলে বা স্টক বিক্রি হয়ে গেলে ব্লক); `purchases.html?supplier=ID` ডিপ-লিংক।
- **Suppliers (`assets/js/sup-v86.js`):** চিপ (বাকি/ওভারডিউ/লিমিটের কাছে/নিষ্ক্রিয়/৯০+ দিন কেনা হয়নি); কার্ডে শেষ কেনা/অর্ডার/ওভারডিউ + 📈 প্রোফাইল, 🛒 কেনা, ⏸/▶ সক্রিয়-নিষ্ক্রিয়; প্রোফাইলে KPI, সরবরাহ করা ওষুধ ও দাম-তুলনা, সাম্প্রতিক কেনা, WhatsApp বাকি-মিলানো; 💰 দাম তুলনা; ফোন যাচাই ও ডুপ্লিকেট (ফোন/নাম) প্রতিরোধ; বাকি/ইতিহাস থাকলে মুছতে সতর্কতা।
- **Prescriptions (`assets/js/rx-v86.js`):** চিপ (অপেক্ষমাণ/আংশিক/সম্পন্ন/মেয়াদ ≤৩ দিন/মেয়াদোত্তীর্ণ/আজকের); কার্ডে স্টক-প্রাপ্যতা ও আনুমানিক বিল; বিস্তারিতে ওষুধ-ভিত্তিক স্টক/দাম/বিকল্প (একই generic), রোগীর আগের প্রেসক্রিপশন, 🖨 স্লিপ প্রিন্ট; সেভে যাচাই (বৈধ-তারিখ ≥ তারিখ, ফোন, ভবিষ্যৎ তারিখ, ডুপ্লিকেট সতর্কতা, অনন্য RX নম্বর)।
- **সীমাবদ্ধতা:** ওষুধের নাম মেলানো আনুমানিক (নাম/generic); আনুমানিক বিল প্রতি ওষুধ ১ ইউনিট ধরে; দাম-তুলনা শুধু আপনার নিজের কেনার ইতিহাস থেকে; আসল SMS/অনলাইন সাপ্লায়ার-অর্ডার নেই।

## v87 — Reports & Analytics · Online Shop · Ops Panel
- **Reports (`assets/js/rep-v87.js`):** নতুন ট্যাব "🆚 তুলনা ও বিশ্লেষণ" — আগের সমান সময়ের সাথে তুলনা (বিক্রি/বিল/গড় বিল/আনুমানিক লাভ/POS/অনলাইন/ছাড়) ▲▼%; পণ্য-ভিত্তিক বিক্রি-ইউনিট-মার্জিন-বদল (সর্ট, ১০%-এর নিচে মার্জিন সতর্কতা); সপ্তাহের বার-ভিত্তিক বিক্রি; Void হওয়া বিক্রি; 💤 ডেড স্টক (৩০/৬০/৯০+ দিন বিক্রি-হীন, কেনা-দামে আটকে থাকা টাকা); CSV।
- **Online Shop (`assets/js/store-v87.js`):** চেকআউটে পছন্দের ডেলিভারি-সময় + নোট (অর্ডারে `slot`/`note`); অর্ডার সফল পেজে 💬 WhatsApp-এ ফার্মেসিকে বিবরণ পাঠানো (শপের ফোন সেটিং থাকলে); 🔁 রিফিল রিমাইন্ডার (১৫/৩০/৬০ দিন) — সময় হলে শপ-হোমে ব্যানার ও এক ক্লিকে কার্টে (শুধু এই ব্রাউজারে, SMS/পুশ নয়)।
- **Ops Panel (`assets/js/ops-v87.js`):** Orders — খোঁজা, স্ট্যাটাস-চিপ (সংখ্যাসহ), ⏱ অপেক্ষার সময় ও ⚠ দেরি (৩০ মিনিটের বেশি Pending), 💬 WhatsApp, ডেলিভারি-সময়/নোট দেখানো, সব অর্ডার CSV; Customers — খোঁজা, সেগমেন্ট (নতুন/নিয়মিত/শীর্ষ/৬০+ দিন আসেননি), শেষ অর্ডার, গড় অর্ডার, CSV; Reports — আগের সময়ের সাথে তুলনা + শীর্ষ ১০ পণ্য; Dashboard — "🔥 এখনই দরকার" (দেরির অর্ডার, Rx রিভিউ, রাইডার ছাড়া, COD হিসাব বাকি; যে রোলের যে ট্যাব আছে শুধু সেটাই দেখায়)।
- সীমাবদ্ধতা: ডেড-স্টক/তুলনা শুধু এই সফটওয়্যারের বিক্রি থেকে; রিফিল রিমাইন্ডার ব্রাউজার-লোকাল; WhatsApp শুধু লিংক খোলে (আসল মেসেজ পাঠায় না); Ops Delivery স্লিপে slot এখনও ছাপা হয় না (Orders তালিকায় দেখা যায়)।

## v88 — Team Board, Daily Closing, Reorder List
- **Team Board** (`team-v88.js`): "📝 অটো হ্যান্ডওভার" লাইভ সংখ্যা (বিক্রি, কম স্টক, এক্সপায়ার, অনলাইন অর্ডার, Rx, আনক্লোজড দিন, বাকি) দিয়ে নোট ভরে; "💡 সিস্টেমের সাজেশন" থেকে এক ক্লিকে কাজ যোগ; "✔ সব নোটিশ পড়েছি".
- **Daily Closing** (`closing-v88.js`): ডিজিটাল পেমেন্ট সেটেলমেন্ট (প্রত্যাশিত বনাম পাওয়া, `pharmacy_closing_digital`), গতকাল/গত সপ্তাহের তুলনা, টপ ৫ প্রোডাক্ট, ব্যস্ত ঘণ্টা।
- **Reorder** (`reorder-v88.js` + `pur-v86.js`): ক্যাটাগরি ফিল্টার, এক্সপায়ার-কাছে ফ্ল্যাগ, "🛒 Purchase বানান" → `purchases.html?draft=1` এ আইটেমসহ ফর্ম খোলে (`mc_po_draft`).

## v89 — Refunds, Write-off, Rx Register
- **Refunds** (`refunds-v89.js`): আজ/মাস KPI ও রিফান্ড-হার (৫%+ হলে সতর্কতা), সাম্প্রতিক ৮ ইনভয়েস কুইক-পিক, কারণ-চিপ, ফিল্টারযোগ্য ইতিহাস (তারিখ/মেথড/খোঁজ) + মেথড/কারণ/আইটেম সারাংশ ও ফিল্টার-CSV।
- **Write-off** (`writeoff-v89.js`): ৩০/৬০/৯০ দিনের মেয়াদ-ঝুঁকি (টাকায়), কারণ অনুযায়ী মাসিক ক্ষতি, ৬ মাসের ট্রেন্ড, ফিল্টারযোগ্য ইতিহাস, ২৪ ঘণ্টার মধ্যে "↩ বাতিল" (স্টক ফেরত, শুধু Admin, audit লগ)।
- **Rx Register** (`register-v89.js`): Rx নম্বর প্রেসক্রিপশন-তালিকার সাথে মিলিয়ে ব্যাজ (✔ নিবন্ধিত / ⚠ অজানা / ⏰ মেয়াদোত্তীর্ণ Rx / 🔁 বারবার), Rx ref ছাড়া সারিতে "＋ Rx যোগ", প্রিন্টে স্বাক্ষর-লাইন।

## v90 — Backup, Settings
- **Backup** (`backup-v90.js`): 🔐 AES-256-GCM (PBKDF2 250k) পাসওয়ার্ড-সুরক্ষিত `.mcbak` ব্যাকআপ ও রিস্টোর (ডিক্রিপ্ট করে আগের প্রিভিউ/undo ফ্লো-তে যায়), 🔍 ফাইল বনাম বর্তমান ডেটা তুলনা, 📑 টেবিল-ভিত্তিক CSV, 📜 ব্যাকআপ লগ (`pharmacy_backup_log`), ⏰ রিমাইন্ডার (`pharmacy_backup_cfg`).
- **Settings** (`settings-v90.js`, Dashboard): পাসওয়ার্ড শক্তি-মিটার + দেখান/লুকান, সাম্প্রতিক লগইন ও ব্যর্থ-চেষ্টা সতর্কতা, বাংলাদেশি ফোন ভ্যালিডেশন, Backup ট্যাবে বয়স + রিমাইন্ডার (দেরি হলে দিনে একবার টোস্ট), ব্যক্তিগত সেটিং রিসেট।

## v91 — Operations (admin) Login, Home
- **Ops Login** (`ops-login-v91.js`): কীবোর্ডে ১–৯/↑↓ দিয়ে ইউজার বাছাই (কোড-ঘরে অটো ফোকাস), Caps Lock সতর্কতা, লাইভ ঢাকা-ঘড়ি + অনলাইন/অফলাইন + ডেমো/সার্ভার মোড, ৬+ ইউজার হলে খোঁজা, ব্যর্থ চেষ্টার (২৪ ঘণ্টা) সতর্কতা, "কোড/PIN ভুলে গেছেন?" সাহায্য, ডবল-সাবমিট ঠেকানো।
- **Home** (`home-v91.js`): "আপনি কে?" রোল-ফাইন্ডার, আজকের স্বাস্থ্য-টিপ (দিনভিত্তিক), জরুরি নম্বর (৯৯৯, ১৬২৬৩), FAQ খোঁজা, নেভে Operations লিংক।
- **Fix** (`theme-fix.js`): `color-mix()`/`color(srgb …)` ব্যাকগ্রাউন্ড ভুল পার্স হয়ে লাইট মোডে হেডারের "MediCare Pharmacy" ফ্যাকাশে হয়ে যেত — ঠিক করা হয়েছে (সব পেজের স্টিকি হেডারে প্রযোজ্য)।

## v92 — Operations Panel, Online Shop
- **Ops** (`ops-v92.js`): Products KPI + ফিল্টার-চিপ (Rx/OTC/কম স্টক/স্টক শেষ/কম মার্জিন) + মার্জিন %; POS-এ খোঁজা-ফলাফল তালিকা (নাম/জেনেরিক/SKU/বারকোড), লাইভ মোট/ফেরত-টাকা, দ্রুত ক্যাশ-বাটন, Rx সতর্কতা, Ctrl+Enter/F2; Expenses ক্যাটাগরি-চিপ ও মাসিক সারাংশ.
- **Shop** (`store-v92.js`): ক্যাটালগ ফিল্টার-চিপ, প্রোডাক্ট পেজে বিকল্প/সাশ্রয়ী ওষুধ ও "মাত্র N টি", কার্টে আনুমানিক ডেলিভারি-সময় (ফ্রি-ডেলিভারি বার আগে থেকেই ছিল)।

## v93 — Operations Panel → Settings (Owner)
- `ops-v93.js`: 🏪 শপ খোলা/বন্ধ কুইক-টগল, 🧾 POS ও রিসিপ্ট (VAT %, রিসিপ্ট-নোট, ডিফল্ট লো-স্টক, অটো-সাইন-আউট, Rx-enforce — যাচাইসহ), ↩ "আগের অবস্থায় ফিরুন", ⬇/⬆ সেটিংস JSON (মান যাচাই করে), 🕘 সেটিংস-পরিবর্তনের ইতিহাস (খোঁজা + CSV)। পুরনো ফর্মগুলো নিচে "বেসিক" অংশে অক্ষত।
- v92 সংশোধন: ফ্রি-ডেলিভারি বার/সেটিং ডুপ্লিকেট ছিল (Control Center `freeMin` ও store-more.js-এ আগে থেকেই আছে) — v92 থেকে সরানো হয়েছে।

## v94 — Dashboard Settings (৭টি ট্যাব)
- **Profile:** ভূমিকা-ব্যাজ + আগের লগইন, পদবি ও রেজিস্ট্রেশন নং (`pharmacy_profile`).
- **Store & Invoice:** ড্রাগ-লাইসেন্স নং ও BIN (যাচাইসহ) → POS ইনভয়েস ও Rx-স্লিপে ছাপা হয় + লাইভ প্রিভিউ।
- **My Preferences:** বড় টাচ-এলাকা, হাই-কনট্রাস্ট (`prefs.js` সব পেজে প্রযোজ্য), কীবোর্ড-শর্টকাট তালিকা।
- **Security:** 🔒 স্ক্রিন-লক PIN (`lock-v94.js`, Ctrl+L, ৫ ভুলে লগআউট), পাসওয়ার্ড দেখান, ব্যর্থ-লগইন সতর্কতা।
- **Alerts & Session:** অলস থাকলে স্ক্রিন-লক (১/২/৫/১০ মিনিট)।
- **Backup:** লাইভ বয়স/সাইজ/সাম্প্রতিক ব্যাকআপ-লগ।
- **Data & Tools:** ডেটা-ইন্টেগ্রিটি চেক (+CSV) ও লগ ছাঁটাই।
- সংশোধন: v90-এর ডুপ্লিকেট (লগইন-তালিকা, পাসওয়ার্ড-মিটার) সরানো হয়েছে — prefs.js-এ আগে থেকেই আছে।

## v95 — Navbar
- নতুন `assets/js/nav-v95.js` (navbar-v79 এর পরে লোড)। ১৫টি স্টাফ পেজে।
- যে ৭ পেজে আগে টপ-বার ছিল না (Team, Closing, Reorder, Backup, Refunds, Write-off, Rx Register) সেখানে এখন বার + "← ড্যাশবোর্ড" + শর্টকাট (`?`, `g` + অক্ষর) + অলস-লগআউট।
- সব বারে: 🔒 লক বাটন (v94 PIN), "আজ ৳… · N বিল" চিপ (বাতিল বিল বাদ; Settings-এ টাকার তথ্য লুকানো থাকলে/বিক্রির অনুমতি না থাকলে দেখায় না), অফলাইন সতর্কতা, Quick মেনুতে সাম্প্রতিক পেজ।
- Dashboard সার্চ: ওষুধ (নাম/জেনেরিক/বারকোড/ব্যাচ), কাস্টমার, বিক্রি, সাপ্লায়ার, Rx, পেজ; ↑↓ Enter Esc; সাম্প্রতিক সার্চ; নামে `<` থাকলে আর HTML ভাঙে না।
- `navbar-v79.js`: টপ-বার এখন `<main>`-এও বসে।

## v96 — Invoice
- নতুন `assets/js/invoice-v96.js` (`sales.html` ও `dashboard.html`)।
- **বাগ ঠিক:** একাধিক আইটেমে সব ঘর একটাই সারিতে আসত — এখন প্রতি আইটেম আলাদা সারি + ক্রমিক নং।
- ইনভয়েসে: আইটেমের নিচে ব্যাচ/মেয়াদ, ক্যাশিয়ার, "আপনি সাশ্রয় করেছেন", কথায় মোট টাকা (লাখ/কোটি), ফেরত-নীতি লাইন।
- **রিপ্রিন্ট:** মূল বিলের পেমেন্ট/বাকি/ক্যাশিয়ার দেখায়, "🔁 কপি" চিহ্ন; বাতিল বিলে "VOID"।
- **প্রিন্ট:** ইন্টারনেট ছাড়াও চলে (আগে CDN লাগত); A4 / A5 / 80mm; PDF-এর নাম ইনভয়েস নং; 📋 টেক্সট কপি।
- **Settings → Store & Invoice:** ডিফল্ট কাগজ, ব্যাচ/মেয়াদ, কথায় টাকা, ফেরত-নীতি (`pharmacy_settings`: invPaper, invBatch, invWords, returnPolicy)।

## v97 — POS Billing
- নতুন `assets/js/pos-v97.js` (`sales.html`, `invoice-v96.js` এর পরে)।
- **পণ্য গ্রিড:** ফিল্টার বার (সব · Rx · কম স্টক · মেয়াদ ≤৬০ দিন · স্টক শেষ), ক্যাটাগরি, সর্ট (নাম/দাম/স্টক), "N / M টি পণ্য"; কার্ডে জেনেরিক নাম ও ⏳ মেয়াদ-ব্যাজ।
- **🔁 বিকল্প:** স্টক শেষ পণ্যে একই জেনেরিকের স্টকে-থাকা, মেয়াদ-ঠিক পণ্য (সস্তা আগে); ক্লিকে কার্টে যোগ।
- ৩০ দিনের মধ্যে মেয়াদ শেষ হবে এমন ওষুধ কার্টে তুললে সতর্কতা।
- **↩ ফেরত আনুন** (Ctrl+Z): ভুলে আইটেম/পুরো কার্ট মুছলে। ৳৫০০+ কার্ট খালি করলে `pharmacy_audit`-এ লেখা হয়।
- **📝 বিলের নোট:** বিক্রির সাথে সেভ (`note`) + ইনভয়েস ও রিপ্রিন্টে ছাপা।
- শর্টকাট: F6 কাস্টমার, F8 ক্যাশ, Delete শেষ আইটেম বাদ, Ctrl+Z ফেরত।

## v98 — Dashboard Settings (৭টি ট্যাব, দ্বিতীয় দফা)
- নতুন `assets/js/settings-v98.js` (`dashboard.html`, settings-v94/invoice-v96 এর পরে)।
- **Profile:** সম্পূর্ণতার মিটার (কী বাকি আছে দেখায়)।
- **Store & Invoice (Admin):** দোকানের লোগো আপলোড (≤260×100-এ ছোট হয়ে `pharmacy_settings.logo`-এ সেভ) → ইনভয়েসের মাথায় ছাপা (`invoice-v96.js` এ সংযোগ)।
- **My Preferences:** Quick মেনুতে ৪টি পছন্দের পেজ 📌 পিন (`pharmacy_pins`; `nav-v95.js` এ সংযোগ)।
- **Security:** পাসওয়ার্ড কতদিন আগে বদলানো (`pharmacy_pwat`) + Admin-এর নীতি (`pwMaxDays`: ৩০/৬০/৯০/১৮০ দিন) ও রিমাইন্ডার।
- **Alerts & Session:** ট্যাব ছেড়ে ৩০ সেকেন্ডের বেশি থাকলে স্ক্রিন-লক (`lock-v94.js`-এ `MCLock.hide`); লগইনের পর আজকের সারাংশ ব্যানার (My Preferences-এর লুকানো সতর্কতা মানে)।
- **Backup (Admin):** লগআউটের সময় অটো ব্যাকআপ ডাউনলোড (শেষ ব্যাকআপ ১২ ঘণ্টার বেশি পুরনো হলে) + এনক্রিপ্টেড ব্যাকআপ পেজের লিংক।
- **Data & Tools (Admin):** অডিট লগ ভিউয়ার — খোঁজা + CSV (ফর্মুলা-ইনজেকশন সুরক্ষিত)।

## v99 — Online Shop
- নতুন `assets/js/store-v99.js` (`shop.html`, store-v92 এর পরে) ও `assets/js/ops-v99.js` (`admin/index.html`, ops-v93 এর পরে)।
- **📍 ঠিকানা-বই** (`mc_addrs`, সর্বোচ্চ ৫): চেকআউটে বেছে নিলে নাম/ফোন/ঠিকানা/এলাকা ভরে যায়; "এই ঠিকানা সংরক্ষণ করুন" + লেবেল; 🗑 দিয়ে মুছে ফেলা।
- **📷 প্রেসক্রিপশনের ছবি** (Rx অর্ডারে, ঐচ্ছিক): ছোট করে (≤১১০০px, ≈≤৩২০KB) `mc_rximg`-এ সেভ (সর্বশেষ ১৫টি); Ops → Orders-এ "📷 Rx ছবি" বাটনে বড় করে দেখা যায়।
- **🔎 সার্চ সাজেশন** (নাম/জেনেরিক/প্রস্তুতকারক) + সাম্প্রতিক সার্চ (`mc_recent_q`), ↑↓ Enter Esc।
- **⚖ তুলনা:** ক্যাটালগে ২–৩টি ওষুধ পাশাপাশি (জেনেরিক, প্রস্তুতকারক, দাম, স্টক, Rx/OTC, নিকটতম ব্যাচের মেয়াদ)।
- **⬇ উইশলিস্টে দাম কমার ব্যাজ** (`mc_wlp`)।
- প্রোডাক্ট পেজে নিকটতম ব্যাচের মেয়াদ + "💬 এই ওষুধ নিয়ে ফার্মাসিস্টকে জিজ্ঞাসা" (Ask-এ ওষুধের নাম বসে); অর্ডার তালিকায় 💬 WhatsApp (শপের ফোন সেট থাকলে)।
