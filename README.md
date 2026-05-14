# OpenPortal

**The Open Source Enterprise Collaboration Platform**

A SharePoint Server / SharePoint Online alternative — modern, fully open-source, multi-tenant, with deep enterprise modules: Sites with web parts, Lists & Libraries with content types, Workday-grade HR, ATS, payroll, performance, learning, and 27 other modules covering every department of any organization.

## What sets it apart

| | OpenPortal |
|---|---|
| **Site building** | Modern pages with 80+ web parts, sections & columns, page versioning, themes, hub sites, audience targeting, multi-language translations, scheduled publishing, news digests |
| **Lists & Libraries** | 22 list templates, content types, 50+ column types, custom views (kanban, calendar, gantt, gallery, chart…), validation formulas, formatting JSON, check-out, versioning |
| **Permissions** | Role definitions, inheritance with break/restore, sharing links (anonymous/internal/external/embed/review), conditional access, DLP rules, retention policies, audit log |
| **Taxonomy** | Term Store, multi-language terms, managed metadata navigation, query rules, promoted results, search refiners |
| **HR** | Workday-grade: legal entities, locations, departments, cost centers, positions, job catalog, pay grades; employees with full personal data, addresses, dependents, payment methods, tax info; employment history, compensation plans, bonuses; benefit plans & enrollments; leave policies/balances/requests/holidays; timesheets/time entries; payroll runs/payslips; performance cycles, OKR goals, reviews, 360, calibration; learning courses & paths, enrollments, certifications, skills inventory; ATS with requisitions, jobs, candidates, applications, interviews, feedback, offers; onboarding/offboarding plans & tasks; succession plans; surveys; employee documents; disciplinary actions; grievances; headcount snapshots |
| **Plus** | CRM, Finance, Legal, Healthcare, Government, Real-Estate, Education, IT-Ops, Events, Support, Projects, and more — all multi-tenant, all enterprise-grade |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, TailwindCSS, TipTap |
| Backend | Hono, Node.js, Zod, Jose (JWT) |
| Database | PostgreSQL 16, Drizzle ORM |
| Cache | Redis 7 |
| Search | Meilisearch |
| Storage | MinIO (on-prem) / S3 (cloud) |
| Auth | Custom JWT + Keycloak (OIDC) |
| Monorepo | Turborepo, pnpm workspaces |

## Quick Start

```bash
git clone https://github.com/your-org/openportal.git
cd openportal
cp .env.example .env.local
pnpm install
pnpm docker:dev      # PostgreSQL, Redis, Meilisearch, MinIO, Mailpit
pnpm db:push         # Apply schema
pnpm dev             # Start frontend + backend
```

- **Frontend:** http://localhost:3000
- **API:** http://localhost:4000
- **API Docs:** http://localhost:4000/api/docs/ui

## Architecture

```
openportal/
├── apps/
│   ├── web/                   Next.js frontend
│   │   └── app/(portal)/      Sites, pages, HR, etc.
│   └── api/                   Hono backend
│       └── src/modules/       28+ modules
├── packages/
│   ├── db/src/schema/         Drizzle schemas (sites, lists, pages,
│   │                          permissions, taxonomy, hr, hr_talent, …)
│   ├── shared/                TypeScript types
│   └── ui/                    Shared UI components
└── docker/
```

## Deep modules

### SharePoint-grade Sites
- **Site Collections** with quotas, sharing capability, sensitivity labels, geo-location
- **Sites** with templates (21 templates from intranet portal to extranet), themes (full palette), hub associations, regional settings, features per-site, audit log
- **Modern Pages** with sections, columns, layouts, web parts, page versions, news promotion, scheduled publishing, translations, audience targeting, SEO, page analytics
- **80+ Web Parts**: text, rich text, hero, banner, carousel, tabs, accordion, image gallery, video, embed, code snippet, KPI, chart, gauge, kanban, gantt, timeline, people, org chart, list view, document library, calendar, news, quick links, search, social share, AI summary, AI chat, and more

### SharePoint-grade Lists & Libraries
- **22 list templates** (generic list, document/picture/asset/form/wiki libraries, calendar, tasks, contacts, links, announcements, discussions, issues, events, KPI, reports, surveys…)
- **Content Types** with inheritance, default values, document templates, workflow & retention bindings
- **50+ column types** including managed metadata, calculated, geolocation, image, file attachment, person, lookup, multi-choice, rating, signature
- **Views**: standard, datasheet, calendar, gantt, kanban board, timeline, gallery, tiles, map, chart, pivot, tree
- Validation formulas, conditional formatting, indexing, totals, grouping, audience targeting

### Workday-grade HR
- **Organization**: legal entities (with banking, CAEN, payroll), locations, departments (hierarchical), cost centers, job families, job profiles, pay grades, positions
- **Employees**: full personal data (legal name, demographics, government IDs, work permits, contacts), addresses (multiple types), emergency contacts, dependents, payment methods (multi-split), tax info (incl. RO-specific)
- **Lifecycle**: hire / rehire / promotion / transfer / leave / termination — full employment history with effective-dating
- **Compensation**: base salary, frequencies, bonus targets, equity (options/RSU/ESPP), allowances (car/housing/meal/transport/phone/custom), compa-ratio, range penetration
- **Benefits**: health/dental/vision/life/AD&D/LTD/STD/retirement/FSA/HSA/commuter/education/wellness with eligibility rules, costs, beneficiaries, dependent coverage
- **Leaves**: 19 leave types, accrual policies (annual grant / monthly accrual / hourly / anniversary), carry-over, paid/unpaid, balances tracking, multi-step approval workflow, half-day support, holidays
- **Time & Attendance**: work schedules, timesheets, time entries with clock-in/out (location, IP), regular / overtime / double-time / holiday hours
- **Payroll**: payroll runs (regular/off-cycle/bonus/correction), payslips with full earnings/deduction breakdown, employer cost, YTD accumulators, bank-transfer details
- **Performance**: cycles (annual/biannual/quarterly/project/probation), goal-setting/self-review/manager-review/calibration/conversation phases; OKR objectives & key results with parent linkage; review templates with sections, ratings, competency scoring; 360 feedback; calibration sessions; 9-box positioning
- **Learning & Development**: courses (self-paced/instructor-led/virtual/blended/certification) with modules (video, quiz, assignment, SCORM, xAPI), learning paths, enrollments with progress tracking, certifications (internal & external) with expiration, skills inventory & employee skills with endorsements
- **ATS / Recruitment**: job requisitions with approval chain, public job postings (LinkedIn/Indeed/career site), candidate database with parsed resumes & GDPR consent, applications with screening questions & knock-outs, multi-round interviews with structured feedback, offers with approval chain & e-signature
- **Onboarding/Offboarding**: reusable plans with categorized tasks (paperwork/IT/training/compliance/equipment/access), task assignment by role
- **Succession & Career Planning**: succession plans for critical positions, ranked successors with readiness levels and development plans
- **Surveys & Engagement**: engagement / pulse / eNPS / exit / onboarding / manager / custom surveys, anonymous responses, demographic slicing
- **Compliance**: training requirements matrix (apply by worker type / department / job profile / framework like GDPR/ISO27001/SOX/HIPAA), recurrence, mandatory training tracking
- **Documents**: employee files (contract / addendum / payslip / performance / certificate / ID / medical / immigration / training / equipment / policy / signed forms) with confidentiality, signature requirement, expiration tracking
- **HR Operations**: disciplinary actions (verbal/written/final warning, suspension, demotion, PIP, termination), grievances (case number, severity, parties, witnesses, status), exit interviews, headcount snapshots

## License

AGPL-3.0 — see [LICENSE](LICENSE) for details.

---

Built with care to be the open-source replacement for SharePoint Server, SharePoint Online, Workday, and SAP SuccessFactors — combined.
