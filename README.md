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
