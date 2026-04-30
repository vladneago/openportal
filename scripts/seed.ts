/**
 * OpenPortal — Seed Script v2
 * Creates demo organization with sample data across all modules.
 *
 * Usage: cd packages/db && npx tsx ../../scripts/seed.ts
 */

import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://openportal:openportal_dev@localhost:5432/openportal";
const sql = postgres(DATABASE_URL);

async function seed() {
  console.log("\n🌱 Seeding OpenPortal demo data...\n");

  // ─── Tenant ───
  const [tenant] = await sql`
    INSERT INTO tenants (name, slug, plan, settings)
    VALUES ('Acme Corporation', 'acme', 'business', ${JSON.stringify({
      maxUsers: 100, maxSites: 50, maxStorage: 536870912000,
      enabledModules: ["documents", "tables", "pages", "forms", "workflows", "chat", "calendar", "education", "hr", "projects", "support", "crm", "finance"],
    })}::jsonb)
    ON CONFLICT (slug) DO UPDATE SET name = 'Acme Corporation'
    RETURNING id
  `;
  const tenantId = tenant.id;
  console.log("✓ Tenant: Acme Corporation");

  // ─── Users ───
  // Password: Admin1234 (bcrypt hash)
  const passwordHash = "$2b$10$rQEY4z5Qdtjl3JGhPmXkBeXxPk0AZQE3kXBqDV.Rz8TvY5z.JkFi2";

  const [admin] = await sql`
    INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, display_name, role)
    VALUES (${tenantId}, 'admin@acme.ro', ${passwordHash}, 'Alexandru', 'Ionescu', 'Alexandru Ionescu', 'owner')
    ON CONFLICT (email) DO UPDATE SET first_name = 'Alexandru'
    RETURNING id
  `;

  const [maria] = await sql`
    INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, display_name, role)
    VALUES (${tenantId}, 'maria@acme.ro', ${passwordHash}, 'Maria', 'Popescu', 'Maria Popescu', 'admin')
    ON CONFLICT (email) DO UPDATE SET first_name = 'Maria'
    RETURNING id
  `;

  const [andrei] = await sql`
    INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, display_name, role)
    VALUES (${tenantId}, 'andrei@acme.ro', ${passwordHash}, 'Andrei', 'Constantin', 'Andrei Constantin', 'member')
    ON CONFLICT (email) DO UPDATE SET first_name = 'Andrei'
    RETURNING id
  `;
  console.log("✓ Users: 3 (admin@acme.ro / Admin1234)");

  // ─── Sites ───
  const siteData = [
    { title: "Intranet Acme", slug: "intranet", type: "communication", desc: "Portalul principal al companiei" },
    { title: "Echipa IT", slug: "echipa-it", type: "team", desc: "Documentație tehnică și runbooks" },
    { title: "Proiect Phoenix", slug: "proiect-phoenix", type: "project", desc: "Transformare digitală 2025" },
    { title: "Resurse Umane", slug: "resurse-umane", type: "team", desc: "Politici și proceduri HR" },
  ];

  const siteIds: string[] = [];
  for (const site of siteData) {
    const [s] = await sql`
      INSERT INTO sites (tenant_id, title, slug, type, description, status, created_by)
      VALUES (${tenantId}, ${site.title}, ${site.slug}, ${site.type}, ${site.desc}, 'active', ${admin.id})
      ON CONFLICT (tenant_id, slug) DO UPDATE SET title = ${site.title}
      RETURNING id
    `;
    siteIds.push(s.id);

    // Add admin as site member
    await sql`
      INSERT INTO site_members (site_id, user_id, site_role)
      VALUES (${s.id}, ${admin.id}, 'owner')
      ON CONFLICT DO NOTHING
    `;
  }
  console.log("✓ Sites: 4");

  // ─── Audit logs ───
  for (const site of siteData) {
    await sql`
      INSERT INTO audit_logs (tenant_id, user_id, action, resource_type, details)
      VALUES (${tenantId}, ${admin.id}, 'create', 'site', ${JSON.stringify({ title: site.title })}::jsonb)
    `;
  }
  console.log("✓ Audit logs: 4");

  console.log("\n✅ Seed complete! Login: admin@acme.ro / Admin1234\n");

  await sql.end();
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
