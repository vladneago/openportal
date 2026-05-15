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
- [ ] Structură JSON pentru pagini (sections > columns > blocks) — block schema definit, editor de adăugat
- [ ] Bibliotecă blocks: Hero, Text, Image, Gallery, Services, Pricing, Contact, Map, Booking CTA, Testimonials, FAQ, Footer
- [ ] Editor drag-and-drop (use `@dnd-kit`)
- [ ] Live preview side-by-side
- [ ] Mobile/Tablet/Desktop preview toggle
- [ ] Undo/Redo
- [ ] Save draft + Publish flow (publish endpoint deja funcțional — UI publishing buton există)

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
- [ ] Endpoint serving static pages public pe subdomain.openportal.app (necesită middleware Next.js pentru host-based routing)
- [ ] Custom domain: instrucțiuni DNS + verificare automată
- [ ] SSL automat (Let's Encrypt sau Cloudflare)
- [ ] Redirect rules (www → root, http → https)

### 2.4 SEO + Analytics
- [ ] Meta tags per pagină (title, description, OG image)
- [ ] Sitemap.xml auto-generat
- [ ] Robots.txt config
- [ ] Schema.org JSON-LD pentru LocalBusiness
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
- [x] Pagină `/booking/availability` (editor orar săptămânal cu grid 7 zile, preset-uri rapide L-V, multi-interval per zi pentru pauze)
- [ ] Pagină `/booking/calendar` (vizualizare zilnică/săptămânală/lunară)
- [ ] Drag-to-reschedule appointments
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
- [ ] Embed widget JS pentru site-uri externe (separat de pagina full)

### 3.3 Notifications
- [x] Email confirmation la booking (admin + public widget)
- [x] Email cancellation la status change
- [x] Templates HTML responsive cu branding RO (Romanian formatare dată/oră)
- [x] SMTP setup via Mailpit (port 1025) — Mailpit UI la localhost:8025
- [x] Best-effort delivery (fire-and-forget, nu blochează booking flow)
- [x] Respectă `emailConsent` din customer record (GDPR)
- [x] Marchează `confirmationSentAt` la trimitere
- [ ] SMS confirmation (integrare Twilio sau Vonage)
- [ ] Reminder 24h + 2h înainte (cron job sau Inngest)
- [ ] Cancel/Reschedule link cu magic token în email

### 3.4 Customer self-service
- [ ] Magic link în confirmare pentru self-reschedule
- [ ] Mini-portal customer (istoric programări, anulare)

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
- [ ] Preview PDF înainte de save
- [ ] Storno + corecții

### 4.2 ANAF e-Factura
- [ ] OAuth ANAF (token + refresh)
- [ ] Generare UBL 2.1 XML conform CIUS-RO
- [ ] Submit la SPV
- [ ] Polling status (acceptat/respins)
- [ ] Download factură semnată

### 4.3 Plăți + Recouvrement
- [ ] Track plăți (manual + Stripe link)
- [ ] Aging report (overdue)
- [ ] Email reminder pentru facturi neplătite
- [ ] Export Excel/CSV pentru contabil

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
- [x] Buton copy embed code (`<script src="...?id=cw_..." async>`)
- [ ] Floating bubble + chat window client-side (widget.js — runtime separat)
- [ ] Mobile responsive (când e creat widget.js)

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
- [ ] Function calling: book appointment, get price list, escalate to human

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

### 8.1 40 Industry Templates
- [ ] Salon de înfrumusețare (3 variante)
- [ ] Frizerie/Barbershop (3 variante)
- [ ] Cofetărie/Patiserie (2 variante)
- [ ] Restaurant/Bistro (3 variante)
- [ ] Consultant asigurări (2 variante)
- [ ] Cabinet medical (3 variante)
- [ ] Stomatolog
- [ ] Avocat / Notar (2 variante)
- [ ] Contabil
- [ ] Psiholog / Coach
- [ ] Personal trainer / Sala fitness
- [ ] Studio yoga / pilates
- [ ] Florărie
- [ ] Atelier auto
- [ ] Curățătorie chimică
- [ ] Pet shop / Veterinar
- [ ] Fotograf
- [ ] DJ / Evenimente
- [ ] Tatuaj / Piercing
- [ ] Hotel mic / Pensiune
- [ ] Cazare turistică / Airbnb host
- [ ] Total: 40 template-uri responsive

### 8.2 AI Site Generator
- [ ] Wizard: "Spune-mi despre business-ul tău" (industry, locatie, USP)
- [ ] Generare automată texte (Claude)
- [ ] Generare imagini placeholder (DALL-E sau Stable Diffusion sau biblioteca curată de stock)
- [ ] Site complet în <60 secunde
- [ ] Editare post-generare

---

## Faza 9 — Launch Prep (Săpt 15–16)

### 9.1 Stripe Connect + Billing
- [ ] Onboarding Stripe per tenant
- [ ] Plan Solo €25/lună
- [ ] Plan Solo Pro €50/lună
- [ ] Trial 14 zile
- [ ] Cancel anytime
- [ ] Failed payment retry + dunning

### 9.2 Onboarding Flow
- [ ] Signup → choose industry → AI generates site → preview → publish
- [ ] Empty states cu CTA-uri clare
- [ ] Tutorial interactiv (Shepherd.js sau Intro.js)
- [ ] Video tour 2 min

### 9.3 Marketing Site
- [ ] Landing page `openportal.app`
- [ ] Pagini per industrie (`/saloane`, `/frizerii`, `/cofetarii`)
- [ ] Pricing page
- [ ] Blog (10 articole SEO de start)
- [ ] Comparison vs Wix/Squarespace/Booksy

### 9.4 Beta Program
- [ ] Recrutare 10 beta clienți
- [ ] Discount lifetime 50% pentru feedback
- [ ] Telegram/Slack group privat
- [ ] Weekly feedback calls
- [ ] Bug bash session

### 9.5 Compliance & Polish
- [ ] GDPR cookie banner + politica de confidențialitate
- [ ] ToS + Acceptable Use Policy
- [ ] DPA template pentru clienți
- [ ] Status page (uptime.openportal.app)
- [ ] Help center (Mintlify sau propriu)

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
