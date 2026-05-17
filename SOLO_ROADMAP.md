# OpenPortal Solo — Roadmap & Progress Tracker

**Strategie**: Wedge "Solo + Beauty" — solo entrepreneurs (saloane, frizerii, cofetării, consultanți, PFA).
**Target piață**: ~250k SRL + 500k PFA în RO + extindere internațională.
**Target ARR Y1**: 2k–5k clienți × €25/lună = €600k–1.5M ARR.
**Timeline**: 16 săptămâni (4 luni) până la launch comercial.

**Cum citim acest fișier**:
- `[ ]` = de făcut
- `[x]` = finalizat
- `[~]` = în lucru
- `[-]` = amânat / decizie viitoare

**Fundament deja existent** (nu retragem):
- [x] 173 tabele Drizzle în Postgres
- [x] ~80 endpoints Hono pe `apps/api`
- [x] Skeleton Next.js 15 pe `apps/web`
- [x] Auth + tenant + admin seed funcțional
- [x] TypeScript zero erori cross-package

---

## Faza 0 — Foundation Upgrades (Săpt 1–2)

### 0.1 i18n
- [ ] Instalează `next-intl` în `apps/web`
- [ ] Structură `/messages/ro.json` + `/messages/en.json`
- [ ] Wrapper provider în root layout
- [ ] Switcher RO/EN în header
- [ ] Translate UI existent (sidebar, dashboard, auth pages)

### 0.2 PostgreSQL RLS
- [ ] Audit funcție `current_tenant_id()` în Postgres
- [ ] Enable RLS pe tabelele core (users, sites, lists, documents, etc.)
- [ ] Policy `tenant_isolation` per tabel
- [ ] Setare `SET LOCAL app.tenant_id = '...'` în middleware Hono
- [ ] Test integration: cross-tenant leak attempt → blocked
- [ ] Documentează în `packages/db/README.md`

### 0.3 tRPC + TanStack Query
- [ ] Adaugă `@trpc/server`, `@trpc/client`, `@trpc/react-query`, `@tanstack/react-query` în `apps/web`
- [ ] Setup `trpc` package partajat în `packages/trpc`
- [ ] Migrează un endpoint pilot (de ex. `sites.list`) la tRPC
- [ ] Provider QueryClient în `apps/web` root
- [ ] Validare schema cu Zod end-to-end
- [ ] Decide: tRPC ca standard pentru module noi (Solo wedge), Hono REST rămâne pentru module enterprise existente

### 0.4 Dev tooling
- [ ] Adaugă Playwright pentru E2E
- [ ] Setup Vitest pentru unit tests în `packages/db`
- [ ] CI workflow `.github/workflows/ci.yml` (typecheck + lint + test)
- [ ] Pre-commit hook cu `lint-staged`

---

## Faza 1 — Data Model Solo (Săpt 2–3)

### 1.1 Schema Booking
- [x] `booking_resources` (staff, rooms, equipment)
- [x] `booking_services` (servicii cu durată, preț, descriere)
- [x] `booking_availability` (orar săptămânal + excepții)
- [x] `booking_appointments` (programări cu status: pending/confirmed/done/cancelled/no_show)
- [x] `booking_blocked_slots` (pauze, concedii)
- [x] `booking_customers` (clienții finali, separați de users)
- [x] Indexes pe (tenant_id, resource_id, start_at) + (tenant_id, customer_id)
- [x] Migrare aplicată cu `drizzle-kit push` (DB are acum 198 tabele)

### 1.2 Schema Invoicing + e-Factura
- [x] `billing_invoice_series` (NIR-uri, serii numerotare)
- [x] `billing_invoices` (header: customer, due_date, total, vat, status)
- [x] `billing_invoice_lines` (item, qty, unit_price, vat_rate)
- [x] `billing_payments` (cash, card, transfer, parțial)
- [x] `efactura_submissions` (status ANAF, XML, response)
- [x] Indexes pe (tenant_id, status) + (tenant_id, customer_id, issue_date)

### 1.3 Schema POS + Stocks
- [x] `products` (cod, nume, preț, stoc, categorie)
- [x] `product_categories`
- [x] `pos_transactions` (cash register, casier, total)
- [x] `pos_transaction_lines` (produse vândute)
- [x] `stock_movements` (in/out, motiv, ref doc)
- [x] Indexes pentru raportare zilnică/lunară

### 1.4 Schema AI Chat Widget
- [x] `chat_widgets` (config per site: culori, mesaj welcome, knowledge base)
- [x] `chat_widget_conversations` (session, customer, channel)
- [x] `chat_widget_messages` (role, content, tokens)
- [x] `chat_knowledge_sources` (docs / FAQ pentru context AI)
- [x] Indexes pe (tenant_id, widget_id, created_at)

### 1.5 Schema Site Builder
- [x] `web_sites` (subdomain, custom_domain, theme_id, status)
- [x] `web_pages` (slug, content_json, seo, published_at)
- [x] `web_themes` (predefined + custom)
- [x] `web_templates` (cele 40 template-uri)
- [x] `web_assets` (imagini, fonturi, video uploads)

---

## Faza 2 — Site Builder Engine (Săpt 3–6)

### 2.0 Site Builder API (Hono routes)
- [x] CRUD `/api/v1/site-builder/themes` (system + per-tenant)
- [x] List/Get `/api/v1/site-builder/templates` (read-only catalog cu filter category/featured)
- [x] CRUD `/api/v1/site-builder/sites` (cu subdomain unicity check global)
- [x] Auto-scaffold pages din template la create site
- [x] POST `/api/v1/site-builder/sites/:id/publish` + `/unpublish`
- [x] CRUD `/api/v1/site-builder/pages` (cu home page enforcement single)
- [x] POST `/api/v1/site-builder/pages/:id/publish` (cu snapshot blocks/title)
- [x] CRUD `/api/v1/site-builder/assets` (media library cu folder + tags)
- [x] Template install_count auto-bump

### 2.1 Page Builder Core
- [x] Pagină `/site-builder` (listă site-uri cu status badge, publish/unpublish/delete)
- [x] Modal "Site nou" cu picker template + temă + business info
- [x] Pagină `/site-builder/[id]` (split: setări site stânga, listă pagini dreapta)
- [x] CRUD pagini (titlu, slug, home flag) cu publish + delete inline
- [x] Item nav lateral "Site Builder"
- [x] Structură JSON pentru pagini (block list cu type + data per block)
- [x] **Bibliotecă blocks** (11): Hero, FeaturesGrid, ServicesPreview, ServicesList, TextImage, Testimonials, CtaBanner, ContactInfo, ContactForm, BookingWidget, Team
- [x] Editor `/site-builder/[id]/pages/[pageId]/edit` cu split layout (listă blocuri stânga, editor formular dreapta)
- [x] Block palette modal cu 11 tipuri (icon + descriere)
- [x] Per-block forms cu field types: text, textarea, url, image (cu preview), select, boolean, color, number, list, cta
- [x] Reorder cu ↑/↓ buttons (drag-drop de adăugat în viitor cu @dnd-kit)
- [x] List fields cu add/remove items (features, testimoniale, team members)
- [x] Save draft + Publish buttons cu dirty state indicator
- [x] Editare SEO title + description + slug + page title în același editor
- [x] Link "Editează" pe fiecare pagină din site detail
- [ ] Live preview side-by-side (momentan link "Preview" separat în tab nou)
- [ ] Mobile/Tablet/Desktop preview toggle
- [ ] Undo/Redo

### 2.2 Theme System
- [x] Variables CSS pentru culori (primary, secondary, accent, background, surface, text + 4 stări)
- [x] Tipografie (heading + body fonts, baseFontSize, headingScale, lineHeight)
- [x] Spacing scale + border radius scale (cu default-uri în schema)
- [x] **10 teme predefinite seed-uite în DB**: Beauty Modern, Beauty Vintage, Salon Lux, Barbershop Bold, Spa Wellness, Cafe Cozy, Restaurant Elegant, Medical Trust, Fitness Energy, Professional Clean
- [x] Theme picker în UI (la creare site, alegi din dropdown)

### 2.3 Publish & DNS
- [x] Schema cu subdomain + customDomain + customDomainStatus
- [x] Public API endpoints (`/api/v1/public/site-builder/...`) — by-host, by-id, page, pages, services, resources
- [x] Block renderer system (11 blocks: hero, featuresGrid, servicesPreview, servicesList, textImage, testimonials, ctaBanner, contactInfo, contactForm, bookingWidget, team)
- [x] Theme CSS variables injectate prin `<SiteThemeStyle>`
- [x] Preview route `/preview/[siteId]/[[...slug]]` care randează ciornele + buton "Preview" în site detail
- [x] Public route `/s/[subdomain]/[[...slug]]` pentru site-uri publicate (status="published") — funcționează imediat fără DNS
- [x] Resolve site via `/api/v1/public/site-builder/sites/by-host` (acceptă atât subdomain.openportal.app cât și custom domain)
- [x] Sticky header, footer dedicat cu social links + business name, GDPR cookie banner client component cu persistență localStorage
- [x] SEO complete via `generateMetadata` (title/description/og:image/favicon din site config + page seoTitle override)
- [x] Admin link "Vezi public ↗" pe pagina detail când e publicat, listing-ul afișează external icon doar pentru publicate
- [ ] Host-based routing prin Next.js middleware (când DNS-ul subdomain.openportal.app există)
- [ ] Custom domain: instrucțiuni DNS + verificare automată
- [ ] SSL automat (Let's Encrypt sau Cloudflare)
- [ ] Redirect rules (www → root, http → https)

### 2.4 SEO + Analytics
- [x] Meta tags per pagină (title, description, OG image) — via `generateMetadata` în public page
- [x] Sitemap.xml auto-generat (`/s/[subdomain]/sitemap.xml`) cu lastmod + priority per pagină publicată
- [x] Robots.txt per site (`/s/[subdomain]/robots.txt`) cu link la sitemap și disallow `/api/`
- [x] Schema.org JSON-LD pentru LocalBusiness (component `<LocalBusinessJsonLd>`) — include address, telephone, openingHoursSpecification, sameAs (social), makesOffer (servicii)
- [x] Canonical URL switching între `subdomain.openportal.app` și `/s/[subdomain]` din `headers()`
- [ ] Integrare Plausible/Umami (privacy-first)

---

## Faza 3 — Booking & Calendar (Săpt 6–8)

### 3.0 Booking API (Hono routes)
- [x] CRUD `/api/v1/booking/resources` (staff/rooms/equipment)
- [x] CRUD `/api/v1/booking/services` (servicii cu durată/preț/buffer)
- [x] CRUD `/api/v1/booking/availability` (orar săptămânal per resursă)
- [x] CRUD `/api/v1/booking/blocked-slots` (vacanțe, pauze)
- [x] CRUD `/api/v1/booking/customers` (search + paginare)
- [x] CRUD `/api/v1/booking/appointments` (cu conflict detection)
- [x] GET `/api/v1/booking/slots` (sloturi disponibile pentru widget public)
- [x] Conflict detection: existing appointments + blocked slots + status filter
- [x] Booking code generator unic
- [x] Customer stats auto-increment la create

### 3.1 Admin UI
- [x] Pagină `/booking` (listă programări cu filter scope: azi/mâine/săptămână/lună + status)
- [x] Stats cards (total, confirmate, în așteptare, încasări estimate)
- [x] Modal "Programare nouă" (customer + serviciu + resursă + dată + oră)
- [x] Quick actions (Confirmă / Finalizează / Anulează / Șterge) din listă
- [x] Pagină `/booking/services` (CRUD cu durată/buffer/preț/TVA)
- [x] Pagină `/booking/resources` (CRUD staff/rooms/equipment cu culoare + capacitate)
- [x] Pagină `/booking/customers` (CRUD cu search debounce + consents GDPR)
- [x] Pagină `/booking/customers/[id]` profil detaliat: KPI-uri lifetime (vizite, total cheltuit, frecvență, no-show rate), servicii preferate (top 5 cu count + revenue), istoric programări (50 ultimele), istoric facturi, note interne editabile, consents inline, alert restanță invoiced
- [x] API `GET /booking/customers/:id/profile` cu join services + resources + invoices și calcul stats live (avg days between visits, lifetime value, completed vs no-show ratio)
- [x] Pagină `/booking/availability` (editor orar săptămânal cu grid 7 zile, preset-uri rapide L-V, multi-interval per zi pentru pauze)
- [x] Pagină `/booking/calendar` (vedere săptămână + zi cu grid orar 07-22, programări ca blocuri colorate, click → modal cu acțiuni status)
- [x] Resource filter în calendar + navigare prev/today/next
- [x] Modal detail cu state machine complet (pending→confirmed→checked_in→in_progress→completed, sau cancelled/no_show)
- [ ] Drag-to-reschedule appointments (în viitor)
- [x] Item nav lateral "Programări"

### 3.2 Booking Widget (public)
- [x] Public API endpoints (`/api/v1/public/booking/...`): slots, appointments, lookup
- [x] Pagină publică `/book/[siteId]` cu flow 4 pași: serviciu → dată/oră → detalii → confirmare
- [x] Integrat în Site Builder prin block `bookingWidget` (link spre /book/...)
- [x] Validare disponibilitate real-time (slots se reîncarcă la schimbare data/staff)
- [x] Buffer time între programări (din service.bufferBeforeMinutes + bufferAfterMinutes)
- [x] Min advance booking hours enforcement (din service.minAdvanceBookingHours)
- [x] Auto-find or create customer (după telefon, fallback email)
- [x] Booking code unic generat (8 caractere) afișat la confirmare
- [x] GDPR consents (SMS/email/marketing) în formular client
- [x] Theme-aware UI (folosește culorile din tema site-ului)
- [x] Embed widget JS pentru site-uri externe (`/embed/booking.js?site=...`) — floating FAB + iframe modal cu /book/[siteId]
- [x] Customizable cu `data-color`, `data-position`, `data-label`
- [x] Auto-fallback no-script: snippet în site detail cu buton "Copiază"
- [x] CORS Access-Control-Allow-Origin: * + Cache-Control 5min

### 3.4 Reviews (post-appointment ratings + public moderation)
- [x] Schema `booking_reviews` (token unic, rating 1-5, comment, status workflow: pending → submitted → published/hidden/spam, ownerReply pentru răspuns admin, snapshot pe customer/service/resource pentru integritate la delete)
- [x] Worker `/internal/reviews/request/tick` care găsește appointments completed >24h fără review row, creează `pending` cu token random 24-byte URL-safe, trimite email cerere recenzie
- [x] Email template branded (header colorat, CTA "Lasă o recenzie ★★★★★", link valabil 30 zile)
- [x] Public route `/api/v1/public/reviews/by-token/:token` (GET preview + POST submit idempotent, fără auth — token e auth-ul)
- [x] Public page `/r/[token]` cu 5-star hover-rating + textarea comment + brand color de la tenant + thank-you state
- [x] Admin route `/api/v1/booking/reviews` (list cu filter status/minRating, summary cu avg + distribution, PATCH pentru moderation acțiuni)
- [x] Admin page `/booking/reviews` cu summary card (avg rating mare, distribuție pe stele cu bar charts, count submitted/published/pending) + filtere status + acțiuni inline (publică / retrage / recomandă / spam / răspunde)
- [x] Public list `/api/v1/public/reviews?tenantId=...` pentru site builder block (featured-first, newest-first, doar published cu showOnPublicSite=true)
- [x] **Site-builder block `reviewsList`** consumă live reviews din `bookingReviews` cu fallback la `fallbackItems` static (template ship-with-content). Aggregate score badge afișat când există >=1 review real. Featured reviews au border primary + label „★ Recomandat". Render include owner reply într-un subbox cu border-top.
- [x] Endpoint `/public/site-builder/sites/:id/reviews?limit=&minRating=` care rezolvă tenantId din site + filtre live (published + showOnPublicSite + minRating). Fetch paralel la page-render alături de services/nav.
- [x] Editor palette `block-schema.ts`: nouă definiție `reviewsList` cu fields title/subtitle/limit/minRating + fallbackItems list cu help text explicând auto-fallback comportament.
- [x] **17 template-uri convertite** din `testimonials` static → `reviewsList` cu autorii originali ca fallback. Pe măsură ce vin recenzii reale, fallback-ul se evaporează automat — zero acțiune din partea tenantului.
- [x] Tab "Recenzii" adăugat la nav-ul booking în toate 6 paginile (consistency)
- [x] Cron script `scripts/reviews-cron.mjs` (suggested 10 AM daily) + status endpoint cu counts per state

### 3.5 Marketing campaigns (retention flywheel)
- [x] Schema `marketing_campaigns` (status workflow draft→scheduled→sending→sent/paused/failed, targeting types, denormalized stats) + `marketing_recipients` (per-customer log cu status, message_id, error, unsubscribe tracking)
- [x] Rendering markdown→HTML simplu (#/##/bullets/links/bold/italic/hr) cu substituție variabile `{firstName}` `{businessName}` `{bookingLink}` `{unsubscribeLink}` `{currentYear}`
- [x] Email template branded (header color, unsubscribe footer, preview text hidden span)
- [x] CRUD complete `/api/v1/marketing/campaigns` (list, detail, create draft, edit while !sent, delete while !sent)
- [x] `POST /:id/preview` randează cu vars de mostră (Maria Popescu) — folosit pentru live preview în iframe
- [x] `POST /:id/audience` calculează cine primește (total, eligible, withoutEmail, withoutConsent, sample primii 5)
- [x] `POST /:id/send-now` rezolvă audience, asertează quota plan, insert recipients (queued/skipped), procesează inline 50 + lasă restul pentru worker drain
- [x] 6 audience types: all_with_consent | segment_recent (X days) | segment_dormant (Y days no visit) | segment_top_spenders (top N) | segment_tag | manual (customerIds array)
- [x] Worker `/internal/marketing/{scheduled,drain}/tick` cu WORKER_TOKEN auth — scheduled promotes due campaigns + expands audience, drain procesează batch per campaign in-flight
- [x] Cron `scripts/marketing-cron.mjs` (suggested every 2-3 min)
- [x] Plan limit `marketingEmailsPerMonth` (Solo: 1000, Solo Pro: 20000) cu `assertEmailQuota(tenantId, additional)` care permite cap-check pre-send
- [x] `getEmailQuotaThisMonth()` count peste recipients status='sent' din luna calendaristică — surfaced în `/api/v1/billing/platform/usage` + bar pe `/settings/abonament`
- [x] UI `/marketing` (list cu summary cards drafts/scheduled/sent/sentThisMonth + filtru status) + nav item nou
- [x] UI `/marketing/new` cu 4 șabloane preset (Aniversare/Comeback/Newsletter/Promo) + selector audiență + editor markdown
- [x] UI `/marketing/[id]` cu split-view: editor (când nu e sent) + audiență live + preview iframe srcDoc, butoane Send Now + Edit + audience confirm dialog

### 3.6 Automated marketing triggers (always-on retention)
- [x] Schema extension: `marketing_campaigns.{is_automation, automation_type enum, automation_params jsonb, automation_active, last_automation_run_at}` + nou enum `marketing_automation_type` (birthday/comeback/post_visit/new_customer)
- [x] Tabel nou `marketing_automation_runs` cu unique index (campaignId × customerId × triggerKey) — dedup idempotent (ex. `birthday:2026`, `comeback:2026-05-17`, `post_visit:<appointmentId>`)
- [x] Coloană nouă `booking_customers.date_of_birth` (date, nullable) — folosită de trigger-ul birthday
- [x] Worker tick nou `POST /api/v1/internal/marketing/automations/tick` — scanează zilnic automatizările active, calculează candidați per trigger, inserează recipient + run row, apoi drain inline
- [x] 4 trigger-uri: **birthday** (m/d match azi, key=year), **comeback** (lastVisitAt în fereastra zile-N±windowDays, key=YYYY-MM-DD), **post_visit** (appointments completed acum N zile, key=appointmentId), **new_customer** (prima vizită acum N zile, key=customerId)
- [x] Quota check înainte de enqueue — dacă tenant nu mai are emailuri în plan, automatizarea sare cohorta zilei și loghează quotaSkipped
- [x] Cron script extended — `marketing-cron.mjs` apelează acum `/scheduled/tick → /automations/tick → /drain/tick`
- [x] PATCH / DELETE relaxat pentru automation campaigns (sit la status='sending' permanent, dar `isAutomation=true` le face editabile/șterse)
- [x] UI `/marketing/new` — selector Tip campanie (Manuală vs Automată), 4 șabloane noi automate (Aniversare/Comeback/Mulțumesc/Bun venit), formular condițional cu daysSinceLastVisit/daysAfterVisit/daysAfterFirstVisit
- [x] UI `/marketing/[id]` — buton Pune-pe-pauză/Activează, badge automation type, banner cu explicație, panel statistici (în loc de audience preview) pentru automatizări
- [x] UI `/marketing` list — badge ● Activ / ○ Pe pauză + tip declanșator, KPI nou „Automatizări active"
- [x] UI `/booking/customers` — input `Data nașterii` în modalul de creare/editare client (legat de trigger-ul birthday)

### 3.3 Notifications
- [x] Email confirmation la booking (admin + public widget)
- [x] Email cancellation la status change
- [x] Templates HTML responsive cu branding RO (Romanian formatare dată/oră)
- [x] SMTP setup via Mailpit (port 1025) — Mailpit UI la localhost:8025
- [x] Best-effort delivery (fire-and-forget, nu blochează booking flow)
- [x] Respectă `emailConsent` din customer record (GDPR)
- [x] Marchează `confirmationSentAt` la trimitere
- [ ] SMS confirmation (integrare Twilio sau Vonage)
- [x] Reminder 24h + 2h înainte — endpoint `/api/v1/internal/booking/reminders/tick` + script `scripts/booking-cron.mjs` (cron 5–10 min) + template email dual-variant (24h "mâine la…" / 2h "peste 2 ore")
- [x] Tracking duplicare: `reminder_24h_sent_at` / `reminder_2h_sent_at` în DB
- [x] Auto-mark `no_show`: endpoint `/api/v1/internal/booking/no-show/tick` (grace period configurabil, default 30 min după `end_at`)
- [x] Auth worker prin `WORKER_TOKEN` env (X-Worker-Token header) — dev mode open
- [ ] Cancel/Reschedule link cu magic token în email

### 3.4 Customer self-service
- [x] Pagină publică `/b/[code]` cu lookup + detalii programare
- [x] Cancel endpoint public `POST /api/v1/public/booking/cancel`
- [x] UI cancel cu confirmation dialog + motiv opțional
- [x] Min cancellation window: 2h înainte (configurabil)
- [x] Trigger email notification de anulare automat
- [x] Link în email-ul de confirmare către `/b/[code]`
- [x] Self-reschedule: endpoint `POST /api/v1/public/booking/reschedule` + slot picker `GET /api/v1/public/booking/reschedule-slots?code=...&date=...`
- [x] UI reschedule pe `/b/[code]` cu date picker + grid de slots disponibile (folosește același service+resource, exclude appointment-ul curent din conflict check)
- [x] Auto-reset `reminder_24h_sent_at` + `reminder_2h_sent_at` la reschedule (clientul primește reminderele pentru noul timp)
- [x] Min reschedule window: 2h înainte (același ca cancel)
- [x] Trigger re-confirmation email automat după reschedule
- [ ] Istoric programări per customer (lookup multiple by phone/email)

---

## Faza 4 — Invoicing + e-Factura (Săpt 8–10)

### 4.0 Billing API (Hono routes)
- [x] CRUD `/api/v1/billing/series` (cu enforcement single-default per tenant)
- [x] CRUD `/api/v1/billing/invoices` (cu calcul linii: subtotal, TVA, discount, total)
- [x] Allocate next document number atomic (SELECT FOR UPDATE pe series)
- [x] Auto-snapshot customer + tenant pe header factură
- [x] Status workflow (draft → issued → sent → paid + cancelled)
- [x] POST `/api/v1/billing/payments` (cu update automat status factură)
- [x] DELETE payment reverse (recalculează amount_due + status)
- [x] POST `/api/v1/billing/efactura/queue` (semnal pentru worker ANAF)
- [x] Drafts deletable, finalized invoices must be cancelled

### 4.1 Invoice UI
- [x] Pagină `/billing` (listă facturi cu filter status, badges ANAF, quick "Emite" + "→ ANAF")
- [x] Modal "Factură nouă" cu linii dinamice (add/remove)
- [x] Calcul live subtotal/TVA/total în formular
- [x] TVA selector (19% standard, 9% medical, 5%, 0%)
- [x] Pick from existing customer + manual override
- [x] Pagină `/billing/series` (CRUD serii cu numerotare, prefix/sufix, reset policy)
- [x] Item nav lateral "Facturi"
- [x] Preview PDF (`GET /billing/invoices/:id/print` server-rendered HTML cu print CSS A4 + Save-as-PDF nativ browser)
- [x] Storno + corecții (`POST /billing/invoices/:id/storno` creează credit_note cu linii negate + linkează relatedInvoiceId, marchează originalul ca void)
- [x] Auto-provision serie credit_note dacă tenant n-are una (cod „STO", prefix STO, pad 4, reset yearly)
- [x] UI: buton „PDF" pe orice factură + buton „Stornează" pe facturile emise/trimise/plătite cu prompt motiv

### 4.2 ANAF e-Factura
- [x] Schema `tenant_anaf_credentials` (OAuth tokens + issuer fiscal identity) + migrate aplicat
- [x] OAuth ANAF (authorize URL + token exchange + auto-refresh la expirare)
- [x] Generare UBL 2.1 XML conform CIUS-RO (Invoice + CreditNote, multi-rate TVA, county codes RO-XX)
- [x] Submit la SPV (POST /upload?standard=UBL&cif=...) cu Bearer token
- [x] Polling status (GET /stareMesaj?id_incarcare=...) cu state mapping (processing/accepted/rejected)
- [x] Download factură semnată (GET /descarcare?id=...) — base64 wrap
- [x] Worker endpoints `/api/v1/internal/efactura/{submit,poll}/tick` cu WORKER_TOKEN auth
- [x] Cron script `scripts/efactura-cron.mjs` (3 minute interval suggested)
- [x] Settings UI `/settings/anaf` (date fiscale + status conexiune + connect/disconnect)
- [x] Dev fallback stub (fără ANAF_CLIENT_ID): auto-accept + fake uploadId pentru testare locală
- [x] OAuth callback `/api/v1/billing/anaf/oauth/callback` unauthenticated (state-encoded tenantId)
- [x] Preview XML endpoint (GET /preview-xml/:invoiceId) pentru debug + verificare CIUS-RO

### 4.3 Plăți + Recouvrement
- [x] Track plăți manuale (cash, transfer, card, Stripe) — completat în 4.0
- [x] Aging report cu buckets (curent, 1–30, 31–60, 61–90, 90+) la `GET /billing/aging`
- [x] Auto-marker overdue: cron flips `status='overdue'` când due_date < azi și amount_due > 0
- [x] Email reminder pentru facturi neplătite (cadență: 1 zi după scadență, apoi săptămânal, cap 5 reminder-uri/factură)
- [x] Schema: `billing_invoices.last_reminder_sent_at` + `reminder_count` pentru tracking cadență
- [x] Template `renderInvoiceReminder` cu tonuri (soft/polite/firm) bazat pe daysOverdue + IBAN block
- [x] Worker endpoints `/internal/billing/{mark-overdue,reminders}/tick` cu WORKER_TOKEN
- [x] Cron script `scripts/billing-cron.mjs` (suggested 9 AM daily)
- [x] Export CSV `GET /billing/export.csv?from=…&to=…` cu BOM UTF-8 pentru Excel/LibreOffice
- [x] Pagina `/billing/reports` cu tabel aging colaps/expand pe bucket + export form

### 4.4 Integrare Stripe
- [ ] Cont Stripe Connect per tenant
- [ ] Link de plată unic per factură
- [ ] Webhook payment.succeeded → mark paid

---

## Faza 5 — Email Server MVP (Săpt 10–12)

### 5.1 Stalwart Setup
- [ ] Deploy Stalwart Mail Server (Docker)
- [ ] Config multi-tenant cu domain virtual
- [ ] DKIM/SPF/DMARC auto pe domain custom
- [ ] Antispam (Rspamd integrat)

### 5.2 Provisioning
- [ ] UI `/email/accounts` (creare mailbox-uri)
- [ ] Aliase + redirecturi
- [ ] Quotă storage per cont
- [ ] Password reset flow

### 5.3 Webmail UI
- [ ] Inbox (list + read pane)
- [ ] Compose cu rich editor
- [ ] Folders (Inbox, Sent, Drafts, Trash, Spam, Archive)
- [ ] Search full-text
- [ ] Attachments (upload la storage S3-compatible)

### 5.4 Mobile/IMAP
- [ ] IMAP/SMTP credentials pentru clienti existenți (Outlook, Apple Mail)
- [ ] Documentație setup

---

## Faza 6 — AI Chat Widget (Săpt 12–13)

### 6.0 Chat Widget API (Hono routes)
- [x] CRUD `/api/v1/chat-widget/widgets` (config: colors, AI model, tools, hours, domains)
- [x] POST `/api/v1/chat-widget/widgets/:id/regenerate-key` (security rotation)
- [x] GET `/api/v1/chat-widget/conversations` (admin inbox cu filter status/widget)
- [x] PATCH `/api/v1/chat-widget/conversations/:id` (assign, status, tags, sentiment)
- [x] POST `/api/v1/chat-widget/conversations/:id/messages` (admin takeover de la AI)
- [x] CRUD `/api/v1/chat-widget/knowledge` (sources: manual/url/pdf/faq pentru RAG context)
- [x] PUBLIC GET `/api/v1/chat-widget/public/widget?key=cw_...` (config pentru embed)
- [x] PUBLIC POST `/public/conversations` (start/resume session)
- [x] PUBLIC POST `/public/conversations/:id/messages` (visitor → message)
- [x] PUBLIC GET `/public/conversations/:id/messages?since=...` (long-poll fără WS în MVP)

### 6.1 Widget Embeddable
- [x] Pagină `/chat-widget` (cards widgets cu stats conv/messages + buton "Cod embed")
- [x] Modal "Widget nou" (site asociat, culori, poziție, industrie AI, agent name, greeting)
- [x] Buton copy embed code (`<script src="...?id=cw_..." async>`) — corectat URL la `/embed/chat.js`
- [x] **Floating bubble + chat window** (`/embed/chat.js` loader generator + iframe popover 380×600 docked, lazy-mounted iframe la primul click, postMessage close-from-iframe)
- [x] Greeting bubble dismissibilă (apare după 1.2s, dispare la deschidere chat, persistat în sessionStorage)
- [x] Iframe chat UI la `/embed/chat/[publicKey]` cu session resume (sessionStorage), polling 2.5s pentru mesaje AI noi, optimistic insert, typing indicator cu 3 dots pulsate
- [x] Mobile responsive: bubble + window se transformă în fullscreen pe ≤480px

### 6.2 AI Backend
- [x] Schema completă cu config AI (model, temperature, tools, industry)
- [x] PUBLIC API endpoints (start session, send message, poll messages)
- [x] System prompts per industrie (26 industrii, salvate în `chat-ai.ts`)
- [x] Context din `chat_knowledge_sources` (sha256 hash + status workflow)
- [x] **Integrare efectivă Claude API** (`@anthropic-ai/sdk` 0.32.1)
- [x] Fire-and-forget AI reply trigger după fiecare mesaj user
- [x] Prompt caching cu `cache_control: ephemeral` pe blocul static (industry+tenant+services+knowledge) — reduce cost ~90% după primul mesaj
- [x] Default model: `claude-haiku-4-5-20251001` (rapid + ieftin pentru chat widget)
- [x] Token tracking per conversation + per widget
- [x] Skip AI dacă status = `human_handling` (takeover funcționează)
- [x] Auto-skip dacă `ANTHROPIC_API_KEY` lipsește (graceful degradation)
- [x] **Function calling cu 3 tools** (`find_available_slots`, `book_appointment`, `escalate_to_human`) — agentic loop multi-turn (cap 3 iterații) cu tool_use + tool_result blocks
- [x] Tool `find_available_slots`: fuzzy-match service by name, scan resource availability + appointments + blocked slots peste 7-30 zile cu slot increment 15min + bufferBefore/After + minAdvanceBookingHours; max 10 slots returnate
- [x] Tool `book_appointment`: validează slot încă liber, găsește/creează customer by phone/email, creează appointment cu channel=`ai_chat`, leagă customer la conversation, trimite email confirmare async
- [x] Tool `escalate_to_human`: flip conversation status la `human_handling` așa apare în inbox admin și AI nu mai răspunde automat
- [x] Schema: nou canal `ai_chat` în booking_channel enum pentru analytics (programări din chat AI vs widget/admin/phone)

### 6.3 Admin Inbox
- [x] Pagină `/chat-widget/conversations` (split inbox: lista stânga + thread dreapta)
- [x] Filter widget + status
- [x] Live takeover prin "Trimite ca agent" (status flip auto la human_handling)
- [x] Acțiuni status (Rezolvă / Spam) per conversație
- [ ] Tagging multi-select + customer assignment UI (API există)
- [ ] Export conversații

### 6.4 Knowledge Base UI
- [x] Pagină `/chat-widget/knowledge` (listă surse cu badge tip + status indexare)
- [x] CRUD surse: manual/url/pdf/docx/markdown/csv/faq/service_catalog/product_catalog
- [x] Editor FAQ inline (textarea cu format Q:/A:)
- [x] Tag-uri + asociere per widget (sau global pentru toate)
- [x] Status auto reset la "pending" la editare conținut
- [ ] Upload efectiv fișiere (PDF/DOCX parser) — UI există, runtime de adăugat
- [ ] Re-index automat la modificare (worker)
- [x] Item nav lateral "Chat Widget"

---

## Faza 7 — POS + Stocks (Săpt 13–14)

### 7.0 POS API (Hono routes)
- [x] CRUD `/api/v1/pos/categories` (categorii produse)
- [x] CRUD `/api/v1/pos/products` (cu search, lowStock filter, category)
- [x] CRUD `/api/v1/pos/stock-movements` (purchase/sale/return/adjustment/loss/count)
- [x] CRUD `/api/v1/pos/transactions` (POS sale cu line totals + payment)
- [x] Stoc decrementat automat la `completed` + `stock_movements` audit
- [x] POST `/api/v1/pos/transactions/:id/refund` (full + partial, restoreStock optional)
- [x] GET `/api/v1/pos/reports/daily` (Z-Report: gross, VAT, discount, refunds, by payment method)
- [x] Atomic stock updates via SELECT FOR UPDATE
- [x] Auto status `out_of_stock` când stock_quantity ≤ 0

### 7.1 POS UI
- [x] Pagină `/pos` (terminal touch-friendly: grid produse + coș lateral)
- [x] Filter categorii + search SKU/nume/barcode
- [x] Cart: add/remove, +/- quantity, subtotal/TVA/total live
- [x] Plată cash/card/transfer/voucher + suma primită + rest auto
- [x] Pagină `/pos/products` (CRUD produse cu search, lowStock filter, categorii inline)
- [x] Modal "Categorie nouă" în pagina produse
- [x] Pagină `/pos/reports` (Z-Report zilnic: vânzări, TVA, storno, defalcare per metoda plată)
- [x] Item nav lateral "POS / Magazin"
- [ ] Print bon (browser print API + future printer integration)
- [ ] Inventariere fizică / scanare barcode

### 7.2 Stocks
- [ ] Receptie marfă (NIR)
- [ ] Transfer între gestiuni
- [ ] Inventariere
- [ ] Alerte stoc minim
- [ ] Rapoarte mișcări

---

## Faza 8 — Templates + AI Generator (Săpt 14–15)

### 8.1 40 Industry Templates (20/40 done — 50%)
- [x] Salon de înfrumusețare — `beauty-modern-salon` (5 pagini)
- [x] Frizerie/Barbershop — `barbershop-classic` (4 pagini)
- [x] SPA & Wellness — `spa-wellness-retreat` (4 pagini)
- [x] Cofetărie/Patiserie — `cofetarie-artizanala` (3 pagini)
- [x] Consultant/Avocat/Contabil — `consultant-profesional` (5 pagini)
- [x] Cabinet medical — `medical-clinic-trust` (5 pagini, cu echipa)
- [x] Stomatolog — `dental-care-modern` (4 pagini)
- [x] Personal trainer / Fitness — `fitness-personal-trainer` (5 pagini)
- [x] Fotograf / Studio foto — `photographer-portfolio` (5 pagini, cu portofoliu)
- [x] Florărie — `florist-boutique` (4 pagini)
- [x] Studio yoga / pilates — `yoga-studio-zen` (5 pagini, cu instructori)
- [x] Restaurant / Bistro — `restaurant-bistro` (4 pagini)
- [x] Avocat / Notar — `lawyer-classic` (5 pagini, cu domenii practică)
- [x] Contabil / Expert contabil — `accountant-precise` (4 pagini)
- [x] Psiholog / Coach / Terapeut — `psychology-coach` (5 pagini, cu abordare)
- [x] Veterinar / Pet shop — `veterinary-care` (4 pagini)
- [x] Atelier auto / Service — `auto-service` (4 pagini)
- [x] Hotel / Pensiune / B&B — `hotel-boutique` (5 pagini, cu împrejurimi)
- [x] Cursuri / Training / Educație — `education-courses` (5 pagini, cu echipa traineri)
- [x] Tatuaj / Piercing — `tattoo-studio` (5 pagini, cu portofoliu)
- [x] Onboarding presets: 21 industrii total (16 anterioare + veterinary, automotive, hotel_bnb, education, tattoo_studio)
- [ ] Salon înfrumusețare — variantă vintage + lux (2 mai)
- [ ] Frizerie — variantă modern + retro (2 mai)
- [ ] Cofetărie — variantă modern (1 mai)
- [ ] Restaurant — variante fine-dining + fast-casual (2 mai)
- [ ] Consultant asigurări (variantă dedicată)
- [ ] Cabinet medical — variantă pediatrie + ginecologie
- [ ] Avocat / Notar — variantă boutique
- [ ] Contabil — variantă firme mari
- [ ] Curățătorie chimică
- [ ] DJ / Evenimente
- [ ] Cazare turistică / Airbnb host (variantă self-checkin)
- [ ] Real estate / agenții imobiliare
- [ ] Cafenea (variantă dedicată față de bakery)
- [ ] Coach personal / lifestyle (variantă față de psiholog)
- [ ] Salon manichiură (variantă față de beauty)
- [ ] Atelier de cusut / croitorie
- [ ] Servicii de menaj / curățenie

### 8.2 AI Site Generator
- [x] Wizard form `/site-builder/[id]/generate` cu inputuri: business name, industry (21 opțiuni), one-line description, USP, oraș, ton (5 variante: warm/modern/lux/casual/professional)
- [x] Generare automată texte cu Claude (`apps/api/src/lib/ai-site-generator.ts`) — prompt structurat care întoarce JSON cu hero/features/about/servicesPreview/reviewsFallback/faq/ctaBanner/seo
- [x] Industry hints per cele 21 verticale (style + vocabular per domeniu) + tone hints
- [x] Strict JSON schema validation + coercion la stub content când Claude returnează malformat
- [x] Stub mode când lipsește `ANTHROPIC_API_KEY` — folosește template generic pentru testare locală
- [x] Block factory `contentToBlocks()` mapează output JSON la blocks site-builder existente (hero + featuresGrid + textImage + servicesPreview + reviewsList + featuresGrid pentru FAQ + ctaBanner)
- [x] Două endpoints: `POST /site-builder/ai-generate` (preview only, returnează JSON + blocks) și `POST /site-builder/ai-generate/apply` (rescrie blocks pe pagina home + SEO title/description)
- [x] Preview UI cu cards live (HERO, CARACTERISTICI, DESPRE, RECENZII, FAQ, CTA, SEO) + butoane „Regenerează" și „Aplică pe pagina principală" cu confirmation
- [ ] Generare imagini placeholder (DALL-E sau Stable Diffusion sau biblioteca curată de stock)
- [x] Site complet în <60 secunde — Claude Haiku 4.5 răspunde tipic în 5-15s
- [x] Editare post-generare prin editorul de blocks existent
- [x] Wire în onboarding flow: pe ecranul „done" apare un CTA evidențiat (amber) „✨ Personalizează cu AI" care duce direct la generator cu numele/orașul pre-completate

---

## Faza 9 — Launch Prep (Săpt 15–16)

### 9.1 Stripe Connect + Billing
- [x] Schema `tenant_subscriptions` (planSlug, stripeCustomerId, stripeSubscriptionId, status, trial/period dates, monthlyAmount) + index unic per tenant
- [x] Schema `stripe_webhook_events` cu idempotency pe stripeEventId pentru replay-safety
- [x] PLANS constants în code: Solo €25/lună (€240/an) cu max 3 resurse + 500 chat AI + 100 e-Factura; Solo Pro €50/lună (€480/an) cu nelimitat
- [x] Stripe SDK 17.x instalat + helper `getStripe()` + flag `stripeEnabled` cu fallback graceful când STRIPE_SECRET_KEY lipsește
- [x] GET `/api/v1/billing/platform/subscription` — status + plan limits + trial countdown
- [x] GET `/api/v1/billing/platform/plans` — catalog planuri pentru UI
- [x] POST `/api/v1/billing/platform/checkout` — Stripe Checkout session cu trial_period_days, client_reference_id=tenantId, metadata pentru webhook routing
- [x] POST `/api/v1/billing/platform/portal` — Stripe Customer Portal pentru self-service (update card, cancel, view invoices)
- [x] POST `/api/v1/internal/stripe/webhook` — semnătură verificată cu STRIPE_WEBHOOK_SECRET, handlers pentru checkout.completed, customer.subscription.created/updated/deleted, invoice.payment_succeeded/failed
- [x] Idempotent webhook processing via stripe_webhook_events table cu unique constraint
- [x] Plan Solo €25/lună
- [x] Plan Solo Pro €50/lună
- [x] Trial 14 zile (implicit via tenant.createdAt + 14d când nu există subscription)
- [x] Cancel anytime (via Portal Stripe)
- [x] Failed payment retry + dunning (handled de Stripe Smart Retries; webhook marchează past_due)
- [x] Pagina `/settings/abonament` cu plan curent, status colorat, trial countdown, lista planuri cu toggle lunar/anual, butoane upgrade/portal
- [x] Dev mode: checkout local stub când STRIPE_SECRET_KEY lipsește (simulează upgrade activ în DB pentru testing)
- [x] **Plan enforcement live** — helper `getTenantPlan()` care citește tenant_subscriptions sau cade pe implicit trial Solo 14 zile din tenant.createdAt
- [x] `assertCanCreateResource()` wired în POST `/booking/resources` (Solo max 3, Solo Pro nelimitat)
- [x] `assertCanCreateProduct()` wired în POST `/pos/products` (Solo max 100, Solo Pro nelimitat)
- [x] `assertFeature("hasCustomDomain")` wired în POST/PATCH `/site-builder/sites` (custom domain doar Solo Pro)
- [x] `assertChatAiQuota()` wired în `generateAIReply()` (Solo 500/lună, Solo Pro 5000/lună; count via chat_widget_messages role=assistant + monthStart)
- [x] Errors 402 Payment Required cu code PLAN_LIMIT_* + details `{ used, limit, upgradeTo }` pentru UI handling
- [x] GET `/api/v1/billing/platform/usage` returns aggregated usage report (resources, products, chatAi, sitesPublished)
- [x] UI: usage breakdown bars în `/settings/abonament` cu color-coded thresholds (verde<80%, galben 80-99%, roșu ≥100%, gri nelimitat)
- [ ] Onboarding Stripe per tenant — așteptăm activarea contului Stripe Connect Romania

### 9.2 Onboarding Flow
- [x] Pagină `/onboarding` cu wizard 6 pași (industry → business → services → staff → program → site)
- [x] 8 preset-uri industrie cu sugestii servicii + program săptămânal + temă + template (Beauty, Barbershop, SPA, Consulting, Medical, Fitness, Bakery, General)
- [x] Auto-creare: resources + services + availability rules per zi + serie facturare + site cu template
- [x] First-run check pe dashboard: redirect către `/onboarding` dacă tenant n-are resources/services
- [x] Skip button cu localStorage dismissed flag
- [x] Confirmation screen cu link-uri către booking, site public, dashboard
- [ ] Video tour 2 min
- [ ] Tutorial interactiv (Shepherd.js sau Intro.js)

### 9.3 Marketing Site
- [x] Landing page `/` cu hero + target businesses chip-cloud + 6 feature cards + 3-step "how it works" + 2 pricing plans + 6-Q FAQ + final CTA + footer
- [x] Auth-aware header CTA (`<AuthAwareHeaderCTA>` client component) — logged-in users văd "Mergi la dashboard →", anonim văd "Conectează-te / Începe gratuit"
- [x] Pagini Legal: `/legal/terms` (Termeni și condiții), `/legal/privacy` (Politică de confidențialitate cu GDPR), `/legal/dpa` (Data Processing Agreement)
- [x] Layout dedicat `/legal/*` cu header simplu + back link
- [x] Copy Romanian targeted la solo entrepreneurs (saloane, frizerii, cofetării, consultanți)
- [x] **20 pagini per industrie SEO-targeted**: `/saloane`, `/frizerii`, `/spa-wellness`, `/yoga`, `/cabinete-medicale`, `/stomatologi`, `/fitness`, `/fotografie`, `/consultanti`, `/cofetarii`, `/florarii`, `/restaurante`, `/avocati`, `/contabili`, `/psihologi`, `/veterinari`, `/atelier-auto`, `/hoteluri`, `/cursuri`, `/tatuaje` — fiecare cu pain-points + features + testimonial + FAQ specific industriei. **Parity 1:1 cu templates (20↔20)**.
- [x] Component template `<IndustryLandingPage>` + data registry în `components/marketing/industry-data.ts` — un singur fișier de menținut pentru toate landing-urile, fiecare nouă industrie = 1 entry + 1 route file de 10 linii
- [x] Accent color per industrie (pink saloane, amber frizerii, green spa, sky medical, cyan dental, orange fitness, purple foto, blue consultanți, amber cofetării, pink florării)
- [x] Link-uri cross-referenced între main landing și industrii (target-business chip cloud cu 10 link-uri active)
- [x] Footer cu coloană dedicată Soluții (10 industrii listate) pe toate landing-urile
- [x] Root `/sitemap.xml` (cu toate cele 10 industrii) + `/robots.txt` cu Disallow pentru rute auth
- [ ] Blog (10 articole SEO de start)
- [x] Pagină standalone preț `/preturi` cu tabel comparativ Solo vs Solo Pro (32 funcționalități grupate pe 7 categorii), discount anual, FAQ specific facturare
- [x] Pagini comparison `/vs/booksy` și `/vs/wix` cu tabel side-by-side (24 funcționalități), why-switch grid, migration FAQ
- [x] Component `<ComparisonPage>` reuzabil + `comparison-data.ts` registry — adăugat un competitor nou = 1 entry + 1 route file de 10 linii
- [x] Sitemap.xml extins automat cu /preturi + COMPARISON_SLUGS
- [x] Footer cross-link: /preturi, /vs/booksy, /vs/wix pe toate landing-urile

### 9.4 Beta Program
- [ ] Recrutare 10 beta clienți
- [ ] Discount lifetime 50% pentru feedback
- [ ] Telegram/Slack group privat
- [ ] Weekly feedback calls
- [ ] Bug bash session

### 9.5 Compliance & Polish
- [x] GDPR cookie banner pe public sites (`<CookieBanner>` cu persistență localStorage)
- [x] Politica de confidențialitate completă cu rights GDPR, data localization UE, retention period
- [x] ToS în `/legal/terms` (cont, plată, conținut, AUP, disponibilitate, limită răspundere)
- [x] DPA template în `/legal/dpa` (sub-procesatori listați, audit clause, SCCs pentru non-UE)
- [x] Status page `/status` — 8 componente (API, Web, DB, Email, Chat AI, Storage, ANAF, Stripe) cu indicator real-time + uptime 30 zile + istoric incidente + abonare email notificări
- [x] Help center `/ajutor` — 8 categorii (Primii pași, Site builder, Programări, Facturare, POS, Chat AI, Cont, GDPR), 42 articole, jump-link chips, contact box
- [x] Cross-link footer: Status + Ajutor pe toate landing-urile

### 9.6 Launch
- [ ] Soft launch beta (Săpt 16, ziua 1)
- [ ] Public launch (Săpt 16, ziua 7)
- [ ] Anunț LinkedIn / Facebook Groups RO
- [ ] Product Hunt launch (EN audience)

---

## Decizii blocante (de luat)

- [ ] **Domeniu final**: `openportal.app` / `openportal.io` / alt nume?
- [ ] **Stripe Connect Romania**: cont activabil?
- [ ] **Email server domain**: `mail.openportal.app` sau direct custom per client?
- [ ] **Open source license**: AGPL v3 / BSL / proprietary?
- [ ] **Branding**: logo + nume final + culori
- [ ] **Hosting prod**: Hetzner / Railway / Vercel + Supabase?
- [ ] **Primii 10 beta clienți**: cine sunt, când îi contactăm?

---

## Notă de tracking

După fiecare sesiune, ultimul item bifat = unde am rămas.
Pentru reluare, prima task = următorul `[ ]` din lista de mai sus.
