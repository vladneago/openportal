import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politică de confidențialitate",
  description: "Cum colectează și folosește OpenPortal datele personale.",
};

export default function PrivacyPage() {
  return (
    <>
      <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: "0 0 8px" }}>Politică de confidențialitate</h1>
      <p style={{ color: "#64748B", fontSize: "0.85rem", marginBottom: 32 }}>
        Ultima actualizare: 16 mai 2026
      </p>

      <p>
        OpenPortal SRL ("noi") respectă confidențialitatea ta și se angajează să protejeze datele
        personale conform GDPR (Regulamentul UE 2016/679).
      </p>

      <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginTop: 32, marginBottom: 12 }}>1. Datele pe care le colectăm</h2>
      <ul>
        <li><strong>Date de cont:</strong> nume, email, telefon, parolă criptată</li>
        <li><strong>Date business:</strong> nume firmă, CUI, adresă, configurări platformă</li>
        <li><strong>Date de utilizare:</strong> log-uri, IP, browser, paginile vizitate</li>
        <li><strong>Date de plată:</strong> procesate de Stripe — noi NU stocăm carduri</li>
      </ul>

      <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginTop: 32, marginBottom: 12 }}>2. Scopul prelucrării</h2>
      <ul>
        <li>Operarea Serviciului (cont, autentificare, funcționalități)</li>
        <li>Facturare și conformitate contabilă</li>
        <li>Suport tehnic și comunicare</li>
        <li>Îmbunătățiri produs (analytics agregat, fără identificare)</li>
        <li>Conformitate legală (ANAF, GDPR, ANSPDCP)</li>
      </ul>

      <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginTop: 32, marginBottom: 12 }}>3. Cu cine partajăm datele</h2>
      <p>Datele tale sunt accesibile doar pentru:</p>
      <ul>
        <li><strong>Furnizori esențiali:</strong> găzduire (Hetzner/AWS, UE), procesare plăți (Stripe), email (Mailgun)</li>
        <li><strong>Autorități:</strong> doar la cerere legală formală (instanță, ANAF, poliție)</li>
      </ul>
      <p>Nu vindem și nu închiriem datele tale niciunei terțe părți.</p>

      <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginTop: 32, marginBottom: 12 }}>4. Localizarea datelor</h2>
      <p>
        Toate datele sunt stocate în centre de date din Uniunea Europeană (Germania / Olanda).
      </p>

      <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginTop: 32, marginBottom: 12 }}>5. Perioada de stocare</h2>
      <ul>
        <li>Date de cont activ: pe durata abonamentului</li>
        <li>Date contabile (facturi): 10 ani conform legii române</li>
        <li>Date de cont închis: șterse complet după 30 zile</li>
        <li>Log-uri tehnice: 90 zile</li>
      </ul>

      <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginTop: 32, marginBottom: 12 }}>6. Drepturile tale</h2>
      <p>Conform GDPR, ai următoarele drepturi:</p>
      <ul>
        <li>Acces la datele tale</li>
        <li>Rectificare</li>
        <li>Ștergere ("dreptul de a fi uitat")</li>
        <li>Portabilitate (export CSV/JSON)</li>
        <li>Opoziție la prelucrare</li>
        <li>Reclamație la ANSPDCP</li>
      </ul>
      <p>
        Trimite-ne o cerere la <a href="mailto:privacy@openportal.app">privacy@openportal.app</a> și
        răspundem în 30 zile.
      </p>

      <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginTop: 32, marginBottom: 12 }}>7. Cookies</h2>
      <p>
        Folosim cookies esențiale (sesiune, autentificare) și analytics privacy-first (Plausible/Umami,
        fără cookies de tracking). Vezi banner-ul GDPR la prima vizită.
      </p>

      <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginTop: 32, marginBottom: 12 }}>8. Contact DPO</h2>
      <p>
        Responsabil cu protecția datelor: <a href="mailto:dpo@openportal.app">dpo@openportal.app</a>.
      </p>
    </>
  );
}
