import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Acord de prelucrare a datelor (DPA)",
  description: "Data Processing Agreement între OpenPortal și clienții săi.",
};

export default function DpaPage() {
  return (
    <>
      <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: "0 0 8px" }}>Acord de prelucrare a datelor (DPA)</h1>
      <p style={{ color: "#64748B", fontSize: "0.85rem", marginBottom: 32 }}>
        Ultima actualizare: 16 mai 2026
      </p>

      <p>
        Acest Data Processing Agreement ("DPA") se aplică între OpenPortal SRL ("Procesator") și
        Clientul ("Operator"), conform art. 28 GDPR. Devine parte integrantă a Termenilor și Condițiilor.
      </p>

      <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginTop: 32, marginBottom: 12 }}>1. Definiții</h2>
      <ul>
        <li><strong>Operator de date:</strong> Clientul OpenPortal (tu)</li>
        <li><strong>Procesator de date:</strong> OpenPortal SRL</li>
        <li><strong>Date personale:</strong> date despre clienții finali ai Operatorului (clienții salonului tău, pacienți, etc.)</li>
      </ul>

      <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginTop: 32, marginBottom: 12 }}>2. Obiectul prelucrării</h2>
      <p>
        Procesatorul prelucrează datele personale în numele Operatorului, exclusiv pentru a oferi
        funcționalitățile Serviciului (programări, facturare, comunicare cu clienții).
      </p>

      <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginTop: 32, marginBottom: 12 }}>3. Obligațiile Procesatorului</h2>
      <p>OpenPortal se angajează să:</p>
      <ul>
        <li>Prelucreze datele doar conform instrucțiunilor Operatorului</li>
        <li>Asigure confidențialitatea (acces strict bazat pe rol)</li>
        <li>Implementeze măsuri tehnice și organizatorice adecvate: criptare în tranzit (TLS), criptare la rest, izolare multi-tenant (PostgreSQL RLS), backup zilnic</li>
        <li>Notifice Operatorul despre orice incident de securitate în max 24h</li>
        <li>Ștergă sau returneze datele la încheierea Acordului</li>
      </ul>

      <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginTop: 32, marginBottom: 12 }}>4. Sub-procesatori</h2>
      <p>OpenPortal folosește următorii sub-procesatori:</p>
      <ul>
        <li><strong>Hetzner Online GmbH</strong> (Germania) — găzduire</li>
        <li><strong>Stripe Inc.</strong> (Irlanda) — procesare plăți</li>
        <li><strong>Anthropic PBC</strong> (UE / SUA cu SCCs) — chat AI</li>
        <li><strong>Mailgun</strong> (UE) — livrare emailuri</li>
      </ul>
      <p>
        Vei fi notificat cu min 30 zile înainte de adăugarea/schimbarea oricărui sub-procesator. Ai
        dreptul să te opui rezonabil.
      </p>

      <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginTop: 32, marginBottom: 12 }}>5. Drepturile persoanelor vizate</h2>
      <p>
        Procesatorul oferă asistență tehnică Operatorului pentru a-și îndeplini obligațiile legale față
        de persoanele vizate (export date, ștergere, rectificare).
      </p>

      <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginTop: 32, marginBottom: 12 }}>6. Audit</h2>
      <p>
        Operatorul are dreptul să auditeze conformitatea Procesatorului o dată pe an, cu notificare de 30 zile.
        Pentru audit-uri standard, Procesatorul pune la dispoziție rapoarte SOC 2 sau echivalent.
      </p>

      <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginTop: 32, marginBottom: 12 }}>7. Transferuri internaționale</h2>
      <p>
        Datele rămân în UE. Pentru sub-procesatori non-UE (Anthropic), se aplică Clauzele Contractuale
        Standard ale UE (SCCs).
      </p>

      <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginTop: 32, marginBottom: 12 }}>8. Durata și încetare</h2>
      <p>
        Acest DPA este valid pe toată durata Acordului principal de Servicii. La încetare, datele sunt
        șterse complet în 30 zile sau returnate Operatorului în format CSV/JSON.
      </p>

      <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginTop: 32, marginBottom: 12 }}>9. Solicitări DPA semnate</h2>
      <p>
        Pentru o versiune semnată electronic, scrie-ne la{" "}
        <a href="mailto:dpa@openportal.app">dpa@openportal.app</a> cu numele firmei și CUI-ul.
      </p>
    </>
  );
}
