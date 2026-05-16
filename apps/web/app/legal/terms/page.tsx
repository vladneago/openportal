import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termeni și condiții",
  description: "Termenii de utilizare ai platformei OpenPortal.",
};

export default function TermsPage() {
  return (
    <>
      <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: "0 0 8px" }}>Termeni și condiții</h1>
      <p style={{ color: "#64748B", fontSize: "0.85rem", marginBottom: 32 }}>
        Ultima actualizare: 16 mai 2026
      </p>

      <p>
        Acești Termeni și Condiții ("Termenii") guvernează utilizarea platformei OpenPortal ("Serviciul"),
        oferită de OpenPortal SRL ("noi", "compania"). Prin crearea unui cont și utilizarea Serviciului
        accepți acești Termeni.
      </p>

      <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginTop: 32, marginBottom: 12 }}>1. Cont</h2>
      <p>
        Pentru a folosi Serviciul ai nevoie de un cont valid. Te angajezi să furnizezi date corecte la
        înregistrare și să le ții actualizate. Ești responsabil pentru păstrarea în siguranță a parolei.
      </p>

      <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginTop: 32, marginBottom: 12 }}>2. Abonament și plată</h2>
      <p>
        Abonamentele sunt lunare, plătibile în avans. Perioada de trial este de 14 zile, fără card. Poți
        anula oricând din panoul de control; abonamentul rămâne activ până la finalul perioadei deja
        plătite. Nu există rambursări parțiale.
      </p>

      <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginTop: 32, marginBottom: 12 }}>3. Conținutul tău</h2>
      <p>
        Tu păstrezi proprietatea asupra tuturor datelor și conținutului încărcat pe Serviciu (clienți,
        facturi, programări, conținut site). Acorzi OpenPortal o licență limitată, doar pentru operarea
        Serviciului. Datele tale nu sunt vândute terților.
      </p>

      <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginTop: 32, marginBottom: 12 }}>4. Utilizare acceptabilă</h2>
      <p>Te angajezi să nu folosești Serviciul pentru:</p>
      <ul>
        <li>Activități ilegale sau care încalcă drepturile altora</li>
        <li>Trimitere de spam sau conținut malițios</li>
        <li>Stocare de conținut interzis prin lege (drepturi de autor, materiale ilegale)</li>
        <li>Tentative de a accesa neautorizat sistemele OpenPortal sau alte conturi</li>
      </ul>

      <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginTop: 32, marginBottom: 12 }}>5. Disponibilitate</h2>
      <p>
        Ne străduim pentru un uptime de 99.9%, dar nu putem garanta funcționare neîntreruptă. Întreținerea
        planificată va fi anunțată în avans pe status.openportal.app.
      </p>

      <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginTop: 32, marginBottom: 12 }}>6. Limită de responsabilitate</h2>
      <p>
        Serviciul este oferit "așa cum este". OpenPortal nu garantează potrivirea pentru un scop specific.
        Responsabilitatea noastră maximă pentru orice prejudiciu este limitată la suma plătită în ultimele
        12 luni.
      </p>

      <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginTop: 32, marginBottom: 12 }}>7. Modificarea Termenilor</h2>
      <p>
        Putem actualiza acești Termeni. Vei fi notificat pe email cu cel puțin 30 zile înainte de
        intrarea în vigoare a modificărilor importante.
      </p>

      <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginTop: 32, marginBottom: 12 }}>8. Lege aplicabilă</h2>
      <p>
        Acești Termeni sunt guvernați de legea română. Pentru orice dispută, instanța competentă este
        cea de la sediul OpenPortal SRL.
      </p>

      <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginTop: 32, marginBottom: 12 }}>9. Contact</h2>
      <p>
        Întrebări despre acești Termeni? Scrie-ne la <a href="mailto:legal@openportal.app">legal@openportal.app</a>.
      </p>
    </>
  );
}
