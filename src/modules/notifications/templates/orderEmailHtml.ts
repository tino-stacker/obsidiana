/**
 * Generador de plantilla HTML para Nota de Venta (diseño premium Obsidiana Joyería)
 */
export function buildOrderEmailHtml(orderData: any): string {
  const now = new Date();
  const fecha = now.toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' });

  const items = (orderData.items || []).map((item: any) => `
    <tr>
      <td style="padding:14px 12px;border-bottom:1px solid #f0ede9;font-size:14px;color:#181716;">${item.quantity}x</td>
      <td style="padding:14px 12px;border-bottom:1px solid #f0ede9;font-size:14px;color:#181716;">${item.productName}</td>
      <td style="padding:14px 12px;border-bottom:1px solid #f0ede9;font-size:14px;color:#181716;text-align:right;white-space:nowrap;">S/ ${(Number(item.unitPrice) * Number(item.quantity)).toFixed(2)}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
  <html lang="es">
  <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"></head>
  <body style="margin:0;padding:0;background:#f4f1ee;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ee;padding:40px 0;">
      <tr><td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- HEADER -->
          <tr>
            <td style="background:#181716;padding:36px 40px;text-align:center;">
              <p style="margin:0;font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#A59B8F;">Obsidiana</p>
              <p style="margin:6px 0 0;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#5a5248;">Plata &amp; Joyería</p>
            </td>
          </tr>

          <!-- TÍTULO -->
          <tr>
            <td style="background:#ffffff;padding:32px 40px 24px;border-left:1px solid #e8e3de;border-right:1px solid #e8e3de;">
              <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#A59B8F;">NOTA DE VENTA</p>
              <h1 style="margin:8px 0 4px;font-size:28px;font-weight:300;color:#181716;letter-spacing:-0.5px;">¡Gracias por tu compra!</h1>
              <p style="margin:0;font-size:13px;color:#A59B8F;">${fecha} · Pedido <strong style="color:#61564A;">#${orderData.orderNumber}</strong></p>
            </td>
          </tr>

          <!-- INFO CLIENTE -->
          <tr>
            <td style="background:#faf8f6;padding:20px 40px;border-left:1px solid #e8e3de;border-right:1px solid #e8e3de;border-top:1px solid #ede9e4;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:50%;padding-right:12px;">
                    <p style="margin:0 0 2px;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#A59B8F;">Cliente</p>
                    <p style="margin:0;font-size:14px;color:#181716;font-weight:600;">${orderData.customer?.name || ''}</p>
                    <p style="margin:2px 0 0;font-size:12px;color:#A59B8F;">${orderData.customer?.email || ''}</p>
                  </td>
                  <td style="width:50%;padding-left:12px;">
                    <p style="margin:0 0 2px;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#A59B8F;">Envío a</p>
                    <p style="margin:0;font-size:14px;color:#181716;">${orderData.customer?.address || ''}</p>
                    <p style="margin:2px 0 0;font-size:12px;color:#A59B8F;">${orderData.customer?.district || ''}, ${orderData.customer?.province || ''}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- PRODUCTOS -->
          <tr>
            <td style="background:#ffffff;padding:0 40px;border-left:1px solid #e8e3de;border-right:1px solid #e8e3de;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <thead>
                  <tr style="border-bottom:2px solid #181716;">
                    <th style="padding:16px 12px;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#A59B8F;text-align:left;">Cant</th>
                    <th style="padding:16px 12px;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#A59B8F;text-align:left;">Producto</th>
                    <th style="padding:16px 12px;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#A59B8F;text-align:right;">Importe</th>
                  </tr>
                </thead>
                <tbody>${items}</tbody>
              </table>
            </td>
          </tr>

          <!-- TOTALES -->
          <tr>
            <td style="background:#ffffff;padding:0 40px 28px;border-left:1px solid #e8e3de;border-right:1px solid #e8e3de;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-top:1px solid #ede9e4;padding:12px 12px 4px;text-align:right;">
                    <span style="font-size:12px;color:#A59B8F;">Subtotal:</span>
                    <span style="font-size:13px;color:#181716;margin-left:16px;">S/ ${Number(orderData.subtotal).toFixed(2)}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:4px 12px;text-align:right;">
                    <span style="font-size:12px;color:#A59B8F;">Envío:</span>
                    <span style="font-size:13px;color:#181716;margin-left:16px;">S/ ${Number(orderData.shippingFee).toFixed(2)}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 12px 0;text-align:right;border-top:2px solid #181716;">
                    <span style="font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#181716;">Total:</span>
                    <span style="font-size:18px;font-weight:700;color:#181716;margin-left:16px;">S/ ${Number(orderData.total).toFixed(2)}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- TRACKING BOX -->
          <tr>
            <td style="background:#181716;padding:28px 40px;text-align:center;">
              <p style="margin:0 0 6px;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#A59B8F;">Código de Seguimiento</p>
              <p style="margin:0 0 12px;font-size:24px;font-weight:300;letter-spacing:4px;color:#f4f1ee;font-family:monospace;">${orderData.trackingCode}</p>
              <p style="margin:0;font-size:11px;color:#70665c;">Usa este código para consultar el estado en tiempo real en nuestra tienda.</p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding:24px 40px;text-align:center;">
              <p style="margin:0 0 4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#A59B8F;">Obsidiana · Joyería en Plata 950</p>
              <p style="margin:0;font-size:11px;color:#c0b8b0;">Lima, Perú · Si tienes consultas responde a este correo</p>
            </td>
          </tr>

        </table>
      </td></tr>
    </table>
  </body>
  </html>`;
}
