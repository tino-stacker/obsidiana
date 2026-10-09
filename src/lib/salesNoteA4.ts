/**
 * Nota de Venta A4 — Obsidiana Joyería
 *
 * Genera un documento HTML 100% autocontenido (CSS incrustado, colores HEX,
 * sin dependencias de Tailwind) con tamaño exacto A4. Así, al usar
 * "Guardar como PDF" desde el diálogo de impresión, el PDF conserva
 * fielmente el diseño, con texto vectorial nítido.
 */

// ✏️ Datos de la marca (edítalos aquí y se actualizan en todas las notas)
export const BRAND_INFO = {
  name: 'OBSIDIANA',
  tagline: 'Joyería en Plata 925 · 950',
  instagram: '@obsidiana.joyeria',
  phone: '987 654 321',
  city: 'Lima, Perú',
  logoPath: '/assets/Icono/icono-blanco.jpeg',
};

export interface SalesNoteItem {
  name: string;
  sku?: string;
  material?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface SalesNoteData {
  noteNumber: string;
  date: string;
  trackingCode?: string;
  customer: {
    name: string;
    doc?: string;
    phone?: string;
    email?: string;
    address?: string;
    reference?: string;
    district?: string;
    province?: string;
  };
  deliveryLabel: string;
  items: SalesNoteItem[];
  subtotal: number;
  shippingFee: number;
  discount?: number;
  total: number;
  adelanto?: number;
  saldo?: number;
  paymentMethod?: string;
  notes?: string;
}

const money = (n: number | undefined) =>
  `S/ ${(Number(n) || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const esc = (v: unknown) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const orDash = (v?: string) => (v && String(v).trim() ? esc(v) : '<span class="muted">—</span>');

export function buildSalesNoteFileName(noteNumber: string, customerName?: string) {
  const clean = (s: string) =>
    s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9-_ ]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  const parts = ['Nota-de-Venta', clean(noteNumber || '')];
  if (customerName) parts.push(clean(customerName).slice(0, 30));
  return parts.filter(Boolean).join('_');
}

export function buildSalesNoteHtml(data: SalesNoteData): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const logoUrl = `${origin}${BRAND_INFO.logoPath}`;
  const discount = Number(data.discount) || 0;
  const adelanto = Number(data.adelanto) || 0;
  const saldo = data.saldo !== undefined ? Math.max(0, Number(data.saldo)) : Math.max(0, data.total - adelanto);
  const isPaid = saldo <= 0.001;
  const title = buildSalesNoteFileName(data.noteNumber, data.customer.name);
  const location = [data.customer.district, data.customer.province].filter((x) => x && x.trim()).join(' · ');

  const rows = data.items
    .map(
      (it, i) => `
      <tr>
        <td class="c-idx">${String(i + 1).padStart(2, '0')}</td>
        <td class="c-desc">
          <div class="item-name">${esc(it.name)}</div>
          <div class="item-meta">${[it.material, it.sku ? `SKU ${it.sku}` : ''].filter(Boolean).map(esc).join(' · ')}</div>
        </td>
        <td class="c-num">${it.quantity}</td>
        <td class="c-num">${money(it.unitPrice)}</td>
        <td class="c-num strong">${money(it.total)}</td>
      </tr>`
    )
    .join('');

  const totalUnits = data.items.reduce((a, b) => a + (Number(b.quantity) || 0), 0);

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
<style>
  @page { size: A4 portrait; margin: 0; }
  :root {
    --ink: #161716;
    --ink-2: #2A2724;
    --taupe: #61564A;
    --sand: #A59B8F;
    --cream: #E4DFD7;
    --paper: #F8F7F5;
    --line: #E7E2DA;
    --text: #2B2926;
    --muted: #8C847A;
    --ok: #2F7D5B;
    --warn: #A86A1C;
  }
  * { box-sizing: border-box; margin: 0; padding: 0;
      -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  html, body { background: #D9D4CC; }
  body { font-family: 'Inter', 'Segoe UI', Roboto, Arial, sans-serif; color: var(--text); font-size: 10pt; line-height: 1.45; }
  .sheet {
    width: 210mm; min-height: 296mm; margin: 10mm auto; background: #fff;
    display: flex; flex-direction: column; position: relative; overflow: hidden;
    box-shadow: 0 10px 40px rgba(22,23,22,.18);
  }
  @media print {
    html, body { background: #fff; }
    .sheet { margin: 0; box-shadow: none; }
  }

  /* Marca de agua */
  .watermark {
    position: absolute; top: 46%; left: 50%; transform: translate(-50%, -50%) rotate(-24deg);
    font-family: 'Cormorant Garamond', Georgia, serif; font-size: 120pt; font-weight: 600;
    letter-spacing: 18pt; color: rgba(165,155,143,.06); pointer-events: none; white-space: nowrap; z-index: 0;
  }

  /* Header */
  .header {
    background: linear-gradient(135deg, #161716 0%, #24211E 60%, #2E2A26 100%);
    color: var(--cream); padding: 11mm 14mm 9mm; display: flex; justify-content: space-between; align-items: center;
    position: relative; z-index: 1;
  }
  .brand { display: flex; align-items: center; gap: 5mm; }
  .logo { width: 20mm; height: 20mm; border-radius: 50%; object-fit: cover; border: 1.2pt solid var(--sand); background: #fff; }
  .brand-name { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 30pt; font-weight: 600; letter-spacing: 7pt; line-height: 1; }
  .brand-tag { font-size: 7.5pt; letter-spacing: 3.2pt; text-transform: uppercase; color: var(--sand); margin-top: 2.2mm; }
  .doc-box { text-align: right; }
  .doc-label { font-size: 8pt; letter-spacing: 4pt; text-transform: uppercase; color: var(--sand); font-weight: 600; }
  .doc-title { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 21pt; font-weight: 600; letter-spacing: 1.5pt; margin-top: 1mm; }
  .doc-number { display: inline-block; margin-top: 2.5mm; background: var(--cream); color: var(--ink); font-weight: 800;
    font-size: 10.5pt; letter-spacing: 1pt; padding: 1.6mm 4mm; border-radius: 1.2mm; font-variant-numeric: tabular-nums; }
  .accent { height: 1.6mm; background: linear-gradient(90deg, #61564A, #A59B8F 35%, #E4DFD7 50%, #A59B8F 65%, #61564A); }

  .content { padding: 9mm 14mm 0; flex: 1; position: relative; z-index: 1; }

  /* Meta strip */
  .meta { display: grid; grid-template-columns: repeat(4, 1fr); border: 0.8pt solid var(--line); border-radius: 2mm; overflow: hidden; margin-bottom: 7mm; }
  .meta div { padding: 3mm 4mm; background: var(--paper); border-right: 0.8pt solid var(--line); }
  .meta div:last-child { border-right: none; }
  .k { font-size: 6.8pt; letter-spacing: 1.6pt; text-transform: uppercase; color: var(--muted); font-weight: 700; }
  .v { font-size: 9.5pt; font-weight: 600; color: var(--ink); margin-top: .8mm; word-break: break-word; }
  .mono { font-variant-numeric: tabular-nums; letter-spacing: .4pt; }

  /* Cards */
  .cards { display: grid; grid-template-columns: 1fr 1fr; gap: 5mm; margin-bottom: 7mm; }
  .card { border: 0.8pt solid var(--line); border-radius: 2mm; overflow: hidden; }
  .card-h { background: var(--ink); color: var(--cream); font-size: 7.5pt; letter-spacing: 2.6pt; text-transform: uppercase; font-weight: 700; padding: 2.4mm 4mm; display: flex; align-items: center; gap: 2mm; }
  .card-h .dot { width: 1.6mm; height: 1.6mm; border-radius: 50%; background: var(--sand); }
  .card-b { padding: 3.5mm 4mm; }
  .row { display: grid; grid-template-columns: 24mm 1fr; gap: 2mm; padding: 1.3mm 0; border-bottom: 0.6pt dashed var(--line); }
  .row:last-child { border-bottom: none; }
  .row .k { padding-top: .6mm; }
  .row .v { margin-top: 0; font-weight: 500; font-size: 9.3pt; }
  .muted { color: #B5ADA3; font-weight: 400; }

  /* Table */
  .section-title { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 2.5mm; }
  .section-title h3 { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 15pt; font-weight: 600; color: var(--ink); letter-spacing: .5pt; }
  .section-title span { font-size: 8pt; color: var(--muted); }
  table { width: 100%; border-collapse: separate; border-spacing: 0; border: 0.8pt solid var(--line); border-radius: 2mm; overflow: hidden; }
  thead { display: table-header-group; }
  thead th { background: var(--cream); color: var(--ink); font-size: 7.2pt; letter-spacing: 1.8pt; text-transform: uppercase; font-weight: 800; padding: 2.8mm 3mm; text-align: left; border-bottom: 0.8pt solid var(--sand); }
  thead th.c-num { text-align: right; }
  tbody td { padding: 3mm; border-bottom: 0.6pt solid var(--line); vertical-align: middle; font-size: 9.3pt; }
  tbody tr:nth-child(even) td { background: #FBFAF8; }
  tbody tr:last-child td { border-bottom: none; }
  tr { page-break-inside: avoid; break-inside: avoid; }
  .c-idx { width: 11mm; color: var(--sand); font-weight: 700; font-variant-numeric: tabular-nums; }
  .c-num { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
  th.c-idx { color: var(--ink); }
  .strong { font-weight: 700; color: var(--ink); }
  .item-name { font-weight: 600; color: var(--ink); }
  .item-meta { font-size: 7.5pt; color: var(--muted); margin-top: .5mm; }

  /* Summary */
  .summary { display: grid; grid-template-columns: 1fr 72mm; gap: 6mm; margin-top: 6mm; page-break-inside: avoid; break-inside: avoid; }
  .pay { border: 0.8pt solid var(--line); border-radius: 2mm; padding: 4mm; background: var(--paper); }
  .pay-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm 5mm; margin-top: 2.5mm; }
  .badge { display: inline-flex; align-items: center; gap: 1.5mm; font-size: 7.5pt; font-weight: 800; letter-spacing: 1.6pt; text-transform: uppercase; padding: 1.3mm 3mm; border-radius: 10mm; }
  .badge.ok { background: #E3F1EA; color: var(--ok); border: 0.6pt solid #B9DCCB; }
  .badge.warn { background: #FBEFDD; color: var(--warn); border: 0.6pt solid #EED3A8; }
  .notes { margin-top: 3.5mm; padding-top: 3mm; border-top: 0.6pt dashed var(--line); font-size: 8.5pt; color: var(--text); }

  .totals { border: 0.8pt solid var(--line); border-radius: 2mm; overflow: hidden; }
  .t-row { display: flex; justify-content: space-between; padding: 2.4mm 4mm; font-size: 9.3pt; border-bottom: 0.6pt solid var(--line); font-variant-numeric: tabular-nums; }
  .t-row .lbl { color: var(--muted); font-weight: 500; }
  .t-row .val { font-weight: 600; color: var(--ink); }
  .t-row.free .val { color: var(--ok); }
  .t-row.disc .val { color: #B23B3B; }
  .t-total { background: var(--ink); color: var(--cream); padding: 4mm; display: flex; justify-content: space-between; align-items: center; }
  .t-total .lbl { font-size: 8pt; letter-spacing: 3pt; text-transform: uppercase; font-weight: 700; color: var(--sand); }
  .t-total .val { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 22pt; font-weight: 700; letter-spacing: .5pt; font-variant-numeric: tabular-nums; }
  .t-balance { display: flex; justify-content: space-between; padding: 2.6mm 4mm; font-size: 9pt; font-weight: 700; background: #FBEFDD; color: var(--warn); font-variant-numeric: tabular-nums; }
  .t-balance.ok { background: #E3F1EA; color: var(--ok); }

  /* Guarantee */
  .guarantee { margin-top: 7mm; display: grid; grid-template-columns: 1.25fr 1fr; gap: 5mm; page-break-inside: avoid; break-inside: avoid; }
  .g-box { border: 0.8pt solid var(--sand); border-radius: 2mm; padding: 4mm; position: relative; }
  .g-box h4 { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 13pt; font-weight: 600; color: var(--ink); margin-bottom: 1.2mm; }
  .g-box p, .g-box li { font-size: 8pt; color: var(--text); }
  .g-box ul { padding-left: 4mm; }
  .g-box li { margin: .6mm 0; }
  .seal { position: absolute; top: -3.5mm; right: 4mm; background: var(--ink); color: var(--cream); font-size: 6.5pt; letter-spacing: 1.8pt; font-weight: 800; padding: 1.2mm 2.6mm; border-radius: 1mm; text-transform: uppercase; }
  .sign { margin-top: 9mm; display: grid; grid-template-columns: 1fr 1fr; gap: 14mm; page-break-inside: avoid; break-inside: avoid; }
  .sign div { border-top: 0.8pt solid var(--sand); padding-top: 1.6mm; text-align: center; font-size: 7.5pt; color: var(--muted); letter-spacing: 1.4pt; text-transform: uppercase; }

  /* Footer */
  .footer { margin-top: 8mm; position: relative; z-index: 1; }
  .thanks { text-align: center; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 17pt; font-weight: 600; color: var(--ink); letter-spacing: 3pt; padding: 3mm 0 2mm; }
  .thanks small { display: block; font-family: 'Inter', Arial, sans-serif; font-size: 7.5pt; letter-spacing: 1pt; color: var(--muted); font-weight: 500; margin-top: .8mm; }
  .contact { background: var(--ink); color: var(--cream); display: flex; justify-content: space-around; align-items: center; padding: 3.6mm 14mm; font-size: 8.5pt; letter-spacing: .6pt; }
  .contact span { display: inline-flex; align-items: center; gap: 2mm; }
  .contact svg { width: 3.6mm; height: 3.6mm; stroke: var(--sand); fill: none; stroke-width: 2; }
  .strip { background: var(--taupe); color: var(--cream); text-align: center; font-size: 6.8pt; letter-spacing: 3pt; text-transform: uppercase; padding: 1.8mm; font-weight: 600; }
</style>
</head>
<body>
  <div class="sheet">
    <div class="watermark">OBSIDIANA</div>

    <header class="header">
      <div class="brand">
        <img class="logo" src="${esc(logoUrl)}" alt="Obsidiana" onerror="this.style.display='none'" />
        <div>
          <div class="brand-name">${esc(BRAND_INFO.name)}</div>
          <div class="brand-tag">${esc(BRAND_INFO.tagline)}</div>
        </div>
      </div>
      <div class="doc-box">
        <div class="doc-label">Documento</div>
        <div class="doc-title">Nota de Venta</div>
        <div class="doc-number">N° ${esc(data.noteNumber)}</div>
      </div>
    </header>
    <div class="accent"></div>

    <main class="content">
      <section class="meta">
        <div><div class="k">Fecha de emisión</div><div class="v">${esc(data.date)}</div></div>
        <div><div class="k">Código de seguimiento</div><div class="v mono">${orDash(data.trackingCode)}</div></div>
        <div><div class="k">Modalidad</div><div class="v">${orDash(data.deliveryLabel)}</div></div>
        <div><div class="k">Método de pago</div><div class="v">${orDash(data.paymentMethod)}</div></div>
      </section>

      <section class="cards">
        <div class="card">
          <div class="card-h"><span class="dot"></span>Datos del cliente</div>
          <div class="card-b">
            <div class="row"><div class="k">Nombre</div><div class="v"><b>${orDash(data.customer.name)}</b></div></div>
            <div class="row"><div class="k">DNI / RUC</div><div class="v mono">${orDash(data.customer.doc)}</div></div>
            <div class="row"><div class="k">Teléfono</div><div class="v mono">${orDash(data.customer.phone)}</div></div>
            <div class="row"><div class="k">Correo</div><div class="v">${orDash(data.customer.email)}</div></div>
          </div>
        </div>
        <div class="card">
          <div class="card-h"><span class="dot"></span>Datos de entrega</div>
          <div class="card-b">
            <div class="row"><div class="k">Dirección</div><div class="v">${orDash(data.customer.address)}</div></div>
            <div class="row"><div class="k">Ubicación</div><div class="v">${orDash(location)}</div></div>
            <div class="row"><div class="k">Referencia</div><div class="v">${orDash(data.customer.reference)}</div></div>
            <div class="row"><div class="k">Envío</div><div class="v">${data.shippingFee > 0 ? money(data.shippingFee) : '<b style="color:#2F7D5B">Gratis</b>'}</div></div>
          </div>
        </div>
      </section>

      <div class="section-title">
        <h3>Detalle de la compra</h3>
        <span>${data.items.length} ${data.items.length === 1 ? 'producto' : 'productos'} · ${totalUnits} ${totalUnits === 1 ? 'unidad' : 'unidades'}</span>
      </div>
      <table>
        <thead>
          <tr>
            <th class="c-idx">#</th>
            <th>Descripción</th>
            <th class="c-num">Cant.</th>
            <th class="c-num">P. Unitario</th>
            <th class="c-num">Importe</th>
          </tr>
        </thead>
        <tbody>${rows || '<tr><td colspan="5" style="text-align:center;color:#8C847A">Sin productos</td></tr>'}</tbody>
      </table>

      <section class="summary">
        <div class="pay">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div class="k">Estado del pago</div>
            <span class="badge ${isPaid ? 'ok' : 'warn'}">${isPaid ? '✓ Pagado' : '● Saldo pendiente'}</span>
          </div>
          <div class="pay-grid">
            <div><div class="k">Método</div><div class="v">${orDash(data.paymentMethod)}</div></div>
            <div><div class="k">Adelanto recibido</div><div class="v mono">${money(adelanto)}</div></div>
            <div><div class="k">Saldo por cobrar</div><div class="v mono">${money(saldo)}</div></div>
            <div><div class="k">Entrega</div><div class="v">${orDash(data.deliveryLabel)}</div></div>
          </div>
          ${data.notes && data.notes.trim() ? `<div class="notes"><div class="k" style="margin-bottom:1mm">Observaciones</div>${esc(data.notes)}</div>` : ''}
        </div>

        <div class="totals">
          <div class="t-row"><span class="lbl">Subtotal</span><span class="val">${money(data.subtotal)}</span></div>
          <div class="t-row ${data.shippingFee > 0 ? '' : 'free'}"><span class="lbl">Envío</span><span class="val">${data.shippingFee > 0 ? money(data.shippingFee) : 'Gratis'}</span></div>
          ${discount > 0 ? `<div class="t-row disc"><span class="lbl">Descuento</span><span class="val">− ${money(discount)}</span></div>` : ''}
          <div class="t-total"><span class="lbl">Total</span><span class="val">${money(data.total)}</span></div>
          <div class="t-balance ${isPaid ? 'ok' : ''}"><span>${isPaid ? 'Cancelado' : 'Saldo pendiente'}</span><span>${money(saldo)}</span></div>
        </div>
      </section>

      <section class="guarantee">
        <div class="g-box">
          <span class="seal">Certificado</span>
          <h4>Garantía de autenticidad</h4>
          <p>Certificamos que las piezas detalladas en esta nota están elaboradas en plata de ley 925 / 950 genuina.
          Cada joya incluye estuche de regalo y certificado de autenticidad Obsidiana.</p>
        </div>
        <div class="g-box">
          <h4>Cuida tu joya</h4>
          <ul>
            <li>Evita el contacto con perfumes, cremas y cloro.</li>
            <li>Guárdala en su estuche, lejos de la humedad.</li>
            <li>Límpiala con un paño suave y seco.</li>
          </ul>
        </div>
      </section>

      <section class="sign">
        <div>Obsidiana Joyería</div>
        <div>Conformidad del cliente</div>
      </section>
    </main>

    <footer class="footer">
      <div class="thanks">¡Gracias por tu compra!<small>Conserva este documento como constancia de tu compra.</small></div>
      <div class="contact">
        <span><svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6"/></svg>${esc(BRAND_INFO.instagram)}</span>
        <span><svg viewBox="0 0 24 24"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>${esc(BRAND_INFO.phone)}</span>
        <span><svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>${esc(BRAND_INFO.city)}</span>
      </div>
      <div class="strip">Plata 925 / 950 · Auténtica · Garantizada</div>
    </footer>
  </div>
</body>
</html>`;
}

/** Espera a que fuentes e imágenes del documento estén listas (máx. ~2.5 s). */
function waitForAssets(doc: Document): Promise<void> {
  const imgs = Array.from(doc.images).map((img) =>
    img.complete ? Promise.resolve() : new Promise<void>((r) => { img.onload = () => r(); img.onerror = () => r(); })
  );
  const fonts = (doc as any).fonts?.ready ? (doc as any).fonts.ready.catch(() => undefined) : Promise.resolve();
  const timeout = new Promise<void>((r) => setTimeout(r, 2500));
  return Promise.race([Promise.all([...imgs, fonts]).then(() => undefined), timeout]);
}

/**
 * Abre el diálogo de impresión con la nota A4 lista.
 * Elige "Guardar como PDF" como destino para descargarla.
 */
export async function printSalesNoteA4(data: SalesNoteData) {
  const html = buildSalesNoteHtml(data);
  const fileName = buildSalesNoteFileName(data.noteNumber, data.customer.name);

  document.querySelectorAll('iframe[data-sales-note="true"]').forEach((f) => f.remove());

  const iframe = document.createElement('iframe');
  iframe.setAttribute('data-sales-note', 'true');
  iframe.setAttribute('aria-hidden', 'true');
  Object.assign(iframe.style, {
    position: 'fixed', right: '0', bottom: '0', width: '210mm', height: '297mm',
    border: '0', opacity: '0', pointerEvents: 'none', zIndex: '-1',
  } as CSSStyleDeclaration);
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc || !iframe.contentWindow) {
    // Fallback: nueva pestaña
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 1200); }
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  await waitForAssets(doc);

  // El nombre del PDF sugerido toma el título del documento
  const prevTitle = document.title;
  document.title = fileName;
  const restore = () => { document.title = prevTitle; };

  try {
    iframe.contentWindow.focus();
    iframe.contentWindow.addEventListener('afterprint', restore, { once: true });
    iframe.contentWindow.print();
  } catch {
    restore();
  }

  setTimeout(restore, 4000);
  setTimeout(() => iframe.remove(), 60000);
}
