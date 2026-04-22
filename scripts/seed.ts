import postgres from "postgres";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

const sql = postgres("postgresql://openportal:openportal_dev@localhost:5432/openportal");

async function seed() {
  console.log("Seeding...");
  try {
    // Curata tot
    await sql`DELETE FROM site_members WHERE true`;
    await sql`DELETE FROM sites WHERE true`;
    await sql`DELETE FROM sessions WHERE true`;
    await sql`DELETE FROM invitations WHERE true`;
    await sql`DELETE FROM group_members WHERE true`;
    await sql`DELETE FROM groups WHERE true`;
    await sql`DELETE FROM audit_logs WHERE true`;
    await sql`DELETE FROM users WHERE true`;
    await sql`DELETE FROM tenants WHERE true`;
    console.log("Cleaned.");

    // Tenant
    const tenantId = randomUUID();
    const modules = JSON.stringify(["video", "chat", "calendar"]);
    await sql`
      INSERT INTO tenants (id, name, slug, plan, primary_color, enabled_modules, max_users, max_storage_bytes, max_sites, is_active)
      VALUES (${tenantId}, 'Acme Corporation SRL', 'acme', 'business', '#2563EB', ${modules}::jsonb, '100', '536870912000', '50', true)
    `;
    console.log("Tenant created.");

    // Users
    const ownerId = randomUUID();
    const adminId = randomUUID();
    const memberId = randomUUID();

    const ownerHash = await bcrypt.hash("Admin1234", 12);
    const adminHash = await bcrypt.hash("Admin1234", 12);
    const memberHash = await bcrypt.hash("Admin1234", 12);

    await sql`
      INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, display_name, job_title, department, role, status, email_verified, timezone, locale)
      VALUES (${ownerId}, ${tenantId}, 'admin@acme.ro', ${ownerHash}, 'Alexandru', 'Ionescu', 'Alexandru Ionescu', 'Administrator', 'IT', 'owner', 'active', true, 'Europe/Bucharest', 'ro')
    `;
    console.log("  User: admin@acme.ro (owner)");

    await sql`
      INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, display_name, job_title, department, role, status, email_verified, timezone, locale)
      VALUES (${adminId}, ${tenantId}, 'maria@acme.ro', ${adminHash}, 'Maria', 'Popescu', 'Maria Popescu', 'HR Manager', 'Resurse Umane', 'admin', 'active', true, 'Europe/Bucharest', 'ro')
    `;
    console.log("  User: maria@acme.ro (admin)");

    await sql`
      INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, display_name, job_title, department, role, status, email_verified, timezone, locale)
      VALUES (${memberId}, ${tenantId}, 'andrei@acme.ro', ${memberHash}, 'Andrei', 'Constantin', 'Andrei Constantin', 'Developer Senior', 'IT', 'member', 'active', true, 'Europe/Bucharest', 'ro')
    `;
    console.log("  User: andrei@acme.ro (member)");

    // Sites
    const sites = [
      { title: "Intranet Acme", slug: "intranet", desc: "Portalul principal al companiei.", type: "communication" },
      { title: "Echipa IT", slug: "it", desc: "Documentatie tehnica si runbooks.", type: "team" },
      { title: "Proiect Phoenix", slug: "phoenix", desc: "Transformare digitala 2025.", type: "project" },
      { title: "Resurse Umane", slug: "hr", desc: "Politici si proceduri HR.", type: "team" },
    ];

    for (const site of sites) {
      const siteId = randomUUID();
      const membershipsId = randomUUID();
      const nav = JSON.stringify([
        { id: "home", label: "Acasa", url: "/sites/" + site.slug },
        { id: "docs", label: "Documente", url: "/sites/" + site.slug + "/documents" },
      ]);

      await sql`
        INSERT INTO sites (id, tenant_id, title, slug, description, type, status, is_public, created_by, navigation)
        VALUES (${siteId}, ${tenantId}, ${site.title}, ${site.slug}, ${site.desc}, ${site.type}, 'active', false, ${ownerId}, ${nav}::jsonb)
      `;

      await sql`
        INSERT INTO site_members (id, site_id, user_id, site_role, added_by)
        VALUES (${membershipsId}, ${siteId}, ${ownerId}, 'owner', ${ownerId})
      `;

      console.log("  Site: " + site.title);
    }

    console.log("\n=== SEED COMPLET ===");
    console.log("URL: http://localhost:3000");
    console.log("Parola pentru toti: Admin1234");
    console.log("  Owner:  admin@acme.ro");
    console.log("  Admin:  maria@acme.ro");
    console.log("  Member: andrei@acme.ro");
    console.log("Site-uri: Intranet, IT, Phoenix, HR");

  } catch (e) {
    console.error("Seed failed:", e);
    throw e;
  } finally {
    await sql.end();
  }
}

seed();
