import { Order, OrderStatus, EmailLog } from '../../src/types';
import { mockDb } from '../mockDb';
import { sendEmail } from './mailer';

const STATUS_ORDER: OrderStatus[] = ["pendiente", "en_preparacion", "en_ruta", "entregado", "cancelado"];

export function advanceTimelineToStatus(order: Order, upToStatus: OrderStatus) {
  const targetIndex = STATUS_ORDER.indexOf(upToStatus);
  order.timeline.forEach((s) => {
    const sIdx = STATUS_ORDER.indexOf(s.status as OrderStatus);
    if (targetIndex >= 0 && sIdx >= 0 && sIdx <= targetIndex && s.status !== "cancelado") {
      s.completed = true;
      if (!s.timestamp) s.timestamp = new Date().toISOString();
    }
  });
}

export function autoProcessOrders() {
  const now = Date.now();
  const MIN = 60 * 1000;
  const processed: Array<{ orderNumber: string; from: OrderStatus; to: OrderStatus; action: string }> = [];

  mockDb.orders.forEach((order) => {
    if (order.status === "cancelado" || order.status === "entregado") return;

    const ageMin = (now - new Date(order.createdAt).getTime()) / MIN;
    const isLimaExpress =
      (order.customer.zone || "").toLowerCase().includes("express") ||
      (order.customer.province || "").toLowerCase() === "lima";

    let target: OrderStatus | null = null;
    let actionDesc = "";

    if (order.status === "pendiente" && ageMin >= 15) {
      target = "en_preparacion";
      actionDesc = "Tiempo de preparación alcanzado (15 min)";
    } else if (order.status === "en_preparacion" && ageMin >= 60) {
      target = "en_ruta";
      actionDesc = "Empaque y despacho completado (60 min)";
    } else if (order.status === "en_ruta" && ageMin >= (isLimaExpress ? 360 : 1440)) {
      target = "entregado";
      actionDesc = isLimaExpress
        ? "Entrega express Lima confirmada (6 horas)"
        : "Ventana de entrega interprovincial cumplida (24 horas)";
    }

    if (target) {
      const from = order.status;
      order.status = target;
      order.updatedAt = new Date().toISOString();
      if (target === "entregado") {
        order.estimatedDelivery = "Completado";
      }
      advanceTimelineToStatus(order, target);

      processed.push({ orderNumber: order.orderNumber, from, to: target, action: actionDesc });

      let subject = `Actualización de tu pedido ${order.orderNumber}`;
      let templateType: EmailLog["templateType"] = "order_dispatched";
      if (target === "en_ruta") {
        subject = `🚚 Tu pedido ${order.orderNumber} está en camino - Tracking: ${order.trackingCode}`;
        templateType = "out_for_delivery";
      } else if (target === "entregado") {
        subject = `🎉 ¡Tu pedido ${order.orderNumber} ha sido entregado con éxito!`;
        templateType = "delivered";
      } else if (target === "en_preparacion") {
        subject = `📦 Tu pedido ${order.orderNumber} está en preparación`;
        templateType = "order_dispatched";
      }

      const autoEmailLog: EmailLog = {
        id: `email-auto-${Date.now()}-${order.id}`,
        orderId: order.id,
        trackingCode: order.trackingCode,
        recipientEmail: order.customer.email,
        recipientName: order.customer.name,
        subject,
        templateType,
        sentAt: new Date().toISOString(),
        status: "sent",
        bodyHtml: `
          <div style="font-family: Arial, sans-serif; padding: 24px; color: #1e293b; background: #f8fafc; border-radius: 8px;">
            <h2 style="color: #181716; margin-top: 0;">Hola <strong>${order.customer.name}</strong>,</h2>
            <p>Tu pedido <strong>${order.orderNumber}</strong> fue procesado automáticamente por nuestro sistema logístico.</p>
            <div style="background: #ffffff; padding: 16px; border: 1px solid #e2e8f0; border-radius: 6px; margin: 16px 0;">
              <p><strong>Nuevo estado:</strong> <span style="background:#E4DFD7;color:#181716;padding:4px 10px;border-radius:4px;font-weight:bold;">${target.toUpperCase().replace("_"," ")}</span></p>
              <p><strong>Código de seguimiento:</strong> <span style="font-size:16px;color:#61564A;font-weight:bold;">${order.trackingCode}</span></p>
              <p><strong>Razón automática:</strong> ${actionDesc}</p>
            </div>
            <p style="font-size:12px;color:#64748b;">Notificación automática · Obsidiana Joyería Perú</p>
          </div>
        `,
      };
      mockDb.emailLogs.unshift(autoEmailLog);
      sendEmail(autoEmailLog);
    }
  });

  return {
    message: `Proceso automático completado. ${processed.length} pedido(s) avanzaron de estado.`,
    processed,
    emailLogs: mockDb.emailLogs,
    orders: mockDb.orders,
  };
}
