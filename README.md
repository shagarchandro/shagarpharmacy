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
