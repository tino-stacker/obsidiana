import { Router } from 'express';
import { mockDb } from '../mockDb';
import { sendEmail } from '../services/mailer';
import { autoProcessOrders } from '../services/logistics';
import { Product, District, Zone, Order, StockMovement, EmailLog, OrderStatus } from '../../src/types';

export const apiRouter = Router();

// Health Check
apiRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Bootstrap initial state for frontend
apiRouter.get('/bootstrap', (_req, res) => {
  res.json({
    products: mockDb.products,
    provinces: mockDb.provinces,
    districts: mockDb.districts,
    zones: mockDb.zones,
    orders: mockDb.orders,
    stockMovements: mockDb.stockMovements,
    emailLogs: mockDb.emailLogs,
  });
});

// Track Order by Code
apiRouter.get('/tracking/:code', (req, res) => {
  const code = req.params.code.trim().toUpperCase();
  const order = mockDb.orders.find(
    (o) => o.trackingCode.toUpperCase() === code || o.orderNumber.toUpperCase() === code
  );

  if (!order) {
    return res.status(404).json({ error: 'Pedido o código de seguimiento no encontrado.' });
  }

  res.json(order);
});

// Auto-process orders
apiRouter.post('/orders/auto-process', (_req, res) => {
  const result = autoProcessOrders();
  res.json(result);
});

// Create Order (local store fallback)
apiRouter.post('/orders', (req, res) => {
  try {
    const { customer, items, shippingFee, paymentMethod } = req.body;

    if (!customer || !items || !items.length) {
      return res.status(400).json({ error: 'Datos de cliente e ítems son requeridos.' });
    }

    // Check stock availability
    for (const item of items) {
      const prod = mockDb.products.find((p) => p.id === item.productId);
      if (!prod) {
        return res.status(400).json({ error: `Producto no encontrado: ${item.productName}` });
      }
      if (prod.stock < item.quantity) {
        return res.status(400).json({
          error: `Stock insuficiente para ${prod.name}. Stock actual: ${prod.stock}, Solicitado: ${item.quantity}`,
        });
      }
    }

    // Deduct stock and record movements
    items.forEach((item: any) => {
      const prod = mockDb.products.find((p) => p.id === item.productId);
      if (prod) {
        prod.stock -= item.quantity;
        prod.updatedAt = new Date().toISOString();

        mockDb.stockMovements.unshift({
          id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          productId: prod.id,
          productName: prod.name,
          type: 'out',
          quantity: item.quantity,
          reason: `Venta realizada - Pedido ${mockDb.generateOrderNumber()}`,
          timestamp: new Date().toISOString(),
          performedBy: 'Sistema de Pedidos',
        });
      }
    });

    const orderNumber = mockDb.generateOrderNumber();
    const trackingCode = mockDb.generateTrackingCode();
    const subtotal = items.reduce((acc: number, item: any) => acc + item.unitPrice * item.quantity, 0);
    const total = subtotal + Number(shippingFee);

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber,
      trackingCode,
      customer,
      items,
      subtotal,
      shippingFee: Number(shippingFee),
      total,
      paymentMethod,
      status: 'pendiente',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      estimatedDelivery: '2 a 5 días hábiles',
      timeline: [
        {
          id: `step-1-${Date.now()}`,
          status: 'pendiente',
          title: 'Pedido Recibido',
          description: 'Hemos recibido tu pedido y el pago ha sido confirmado.',
          location: 'Sistema Logístico',
          timestamp: new Date().toISOString(),
          completed: true,
        },
        {
          id: `step-2-${Date.now()}`,
          status: 'en_preparacion',
          title: 'En Preparación',
          description: 'Tu pedido está siendo empaquetado cuidadosamente.',
          location: 'Almacén Central',
          timestamp: '',
          completed: false,
        },
        {
          id: `step-3-${Date.now()}`,
          status: 'en_ruta',
          title: 'En Ruta de Entrega',
          description: 'El paquete fue entregado al courier y está en camino.',
          location: 'Centro de Distribución',
          timestamp: '',
          completed: false,
        },
        {
          id: `step-4-${Date.now()}`,
          status: 'entregado',
          title: 'Entregado en Dirección',
          description: `Confirmación de entrega en ${customer.address}`,
          location: customer.address,
          timestamp: '',
          completed: false,
        },
      ],
      courier: {
        driverName: 'Courier Asignado por Zona',
        driverPhone: '+51 900 000 000',
        vehicle: 'Unidad Móvil Logística',
        licensePlate: 'ENV-2026',
      },
    };

    mockDb.orders.unshift(newOrder);
    res.status(201).json({ order: newOrder, products: mockDb.products });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al crear el pedido' });
  }
});

// Send Order Created Email
apiRouter.post('/emails/order-created', (req, res) => {
  try {
    const { orderData } = req.body;
    if (!orderData || !orderData.customer) {
      return res.status(400).json({ error: 'Faltan datos del pedido' });
    }

    const emailNotification: EmailLog = {
      id: `email-${Date.now()}`,
      orderId: orderData.id || `ord-${Date.now()}`,
      trackingCode: orderData.trackingCode,
      recipientEmail: orderData.customer.email,
      recipientName: orderData.customer.name,
      subject: `¡Confirmación de Pedido ${orderData.orderNumber}! Código de Tracking: ${orderData.trackingCode}`,
      templateType: 'order_created',
      sentAt: new Date().toISOString(),
      status: 'sent',
      bodyHtml: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FDFCFB; color: #181716; padding: 40px 20px; border: 1px solid #E4DFD7;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="font-size: 24px; font-weight: 300; letter-spacing: 4px; text-transform: uppercase; margin: 0;">Obsidiana</h1>
            <p style="font-size: 10px; letter-spacing: 2px; color: #A59B8F; text-transform: uppercase; margin-top: 5px;">Plata & Joyería</p>
          </div>
          
          <div style="border-top: 1px solid #E4DFD7; border-bottom: 1px solid #E4DFD7; padding: 20px 0; margin-bottom: 30px;">
            <h2 style="font-size: 16px; font-weight: bold; text-align: center; margin-top: 0;">NOTA DE VENTA ELECTRÓNICA</h2>
            <p style="font-size: 14px; text-align: center; color: #61564A; margin-bottom: 0;">Pedido #${orderData.orderNumber}</p>
          </div>

          <p style="font-size: 14px; margin-bottom: 8px;"><strong>Cliente:</strong> ${orderData.customer.name}</p>
          <p style="font-size: 14px; margin-bottom: 8px;"><strong>Documento:</strong> ${orderData.customer.document || 'N/A'}</p>
          <p style="font-size: 14px; margin-bottom: 8px;"><strong>Dirección de Entrega:</strong> ${orderData.customer.address}</p>
          
          <table style="width: 100%; margin-top: 40px; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="border-bottom: 1px solid #181716; text-align: left;">
                <th style="padding: 10px 0; font-weight: bold;">Cant</th>
                <th style="padding: 10px 0; font-weight: bold;">Descripción</th>
                <th style="padding: 10px 0; text-align: right; font-weight: bold;">Importe</th>
              </tr>
            </thead>
            <tbody>
              ${(orderData.items || []).map((item: any) => `
              <tr style="border-bottom: 1px dashed #E4DFD7;">
                <td style="padding: 15px 0;">${item.quantity}</td>
                <td style="padding: 15px 0;">${item.productName}</td>
                <td style="padding: 15px 0; text-align: right;">S/ ${(Number(item.unitPrice) * Number(item.quantity)).toFixed(2)}</td>
              </tr>
              `).join('')}
            </tbody>
          </table>

          <div style="margin-top: 20px; text-align: right; font-size: 14px; color: #61564A;">
            <p style="margin: 5px 0;">Subtotal: S/ ${Number(orderData.subtotal).toFixed(2)}</p>
            <p style="margin: 5px 0;">Envío: S/ ${Number(orderData.shippingFee).toFixed(2)}</p>
            <p style="font-size: 18px; font-weight: bold; color: #181716; margin-top: 15px;">Total: S/ ${Number(orderData.total).toFixed(2)}</p>
          </div>

          <div style="background-color: #181716; color: #FDFCFB; padding: 24px; border-radius: 4px; text-align: center; margin-top: 50px;">
            <p style="margin: 0; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: #A59B8F;">Tu Código de Seguimiento</p>
            <p style="margin: 10px 0 0 0; font-size: 22px; font-weight: bold; letter-spacing: 2px;">${orderData.trackingCode}</p>
          </div>
          
          <p style="text-align: center; font-size: 12px; color: #A59B8F; margin-top: 40px; line-height: 1.6;">
            Gracias por tu compra.<br>Si tienes alguna consulta sobre tu pedido, puedes responder directamente a este correo.
          </p>
        </div>
      `,
    };

    mockDb.emailLogs.unshift(emailNotification);
    sendEmail(emailNotification);

    res.status(200).json({ success: true, email: emailNotification });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error enviando correo' });
  }
});

// Update Order Status
apiRouter.put('/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, note, courier, orderData } = req.body as { status: OrderStatus; note?: string; courier?: any; orderData?: any };

  let order = mockDb.orders.find((o) => o.id === id);
  if (!order) {
    if (orderData) {
      order = { ...orderData, status, updatedAt: new Date().toISOString() };
    } else {
      return res.status(404).json({ error: 'Pedido no encontrado.' });
    }
  }

  order.status = status;
  order.updatedAt = new Date().toISOString();

  if (courier) {
    order.courier = { ...order.courier, ...courier };
  }

  // Update timeline steps
  if (status === 'en_preparacion') {
    const step = order.timeline.find((s) => s.status === 'en_preparacion');
    if (step) {
      step.completed = true;
      step.timestamp = new Date().toISOString();
      if (note) step.description = note;
    }
  } else if (status === 'en_ruta') {
    order.timeline.forEach((s) => {
      if (s.status === 'pendiente' || s.status === 'en_preparacion' || s.status === 'en_ruta') {
        s.completed = true;
        if (!s.timestamp) s.timestamp = new Date().toISOString();
      }
    });
  } else if (status === 'entregado') {
    order.timeline.forEach((s) => {
      s.completed = true;
      if (!s.timestamp) s.timestamp = new Date().toISOString();
    });
  }

  let emailSubject = `Actualización de tu pedido ${order.orderNumber}`;
  let emailTemplateType: EmailLog['templateType'] = 'order_dispatched';

  if (status === 'en_ruta') {
    emailSubject = `🚚 Tu pedido ${order.orderNumber} está en camino - Tracking: ${order.trackingCode}`;
    emailTemplateType = 'out_for_delivery';
  } else if (status === 'entregado') {
    emailSubject = `🎉 ¡Tu pedido ${order.orderNumber} ha sido entregado con éxito!`;
    emailTemplateType = 'delivered';
  }

  const emailLog: EmailLog = {
    id: `email-${Date.now()}`,
    orderId: order.id,
    trackingCode: order.trackingCode,
    recipientEmail: order.customer.email,
    recipientName: order.customer.name,
    subject: emailSubject,
    templateType: emailTemplateType,
    sentAt: new Date().toISOString(),
    status: 'sent',
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; padding: 20px; background: #f8fafc; color: #1e293b;">
        <h2 style="color: #2563eb;">Estado de Envío Actualizado</h2>
        <p>Hola <strong>${order.customer.name}</strong>, el estado de tu pedido <strong>${order.orderNumber}</strong> ha cambiado a: <span style="background: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 4px; font-weight: bold;">${status.toUpperCase()}</span>.</p>
        <p>${note || 'Tu paquete está siendo procesado con máxima prioridad.'}</p>
        <hr style="border:0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p>Código de seguimiento: <strong>${order.trackingCode}</strong></p>
      </div>
    `,
  };

  mockDb.emailLogs.unshift(emailLog);
  sendEmail(emailLog);

  res.json({ order, email: emailLog });
});

// Product Inventory Management
apiRouter.post('/products', (req, res) => {
  const { name, sku, category, price, stock, minStock, location } = req.body;
  if (!name || !price) {
    return res.status(400).json({ error: 'Nombre y precio son obligatorios.' });
  }

  const newProd: Product = {
    id: `prod-${Date.now()}`,
    sku: sku || `SKU-${Math.floor(100 + Math.random() * 900)}`,
    name,
    category: category || 'General',
    price: Number(price),
    stock: Number(stock || 0),
    minStock: Number(minStock || 5),
    location: location || 'Almacén Principal',
    updatedAt: new Date().toISOString(),
  };

  mockDb.products.unshift(newProd);

  if (newProd.stock > 0) {
    mockDb.stockMovements.unshift({
      id: `mov-${Date.now()}`,
      productId: newProd.id,
      productName: newProd.name,
      type: 'in',
      quantity: newProd.stock,
      reason: 'Creación de producto con stock inicial',
      timestamp: new Date().toISOString(),
      performedBy: 'Administrador de Inventario',
    });
  }

  res.status(201).json(newProd);
});

// Stock Adjustment Endpoint
apiRouter.post('/products/:id/adjust-stock', (req, res) => {
  const { id } = req.params;
  const { quantity, type, reason, performedBy } = req.body;

  const prod = mockDb.products.find((p) => p.id === id);
  if (!prod) {
    return res.status(404).json({ error: 'Producto no encontrado.' });
  }

  const qty = Number(quantity);
  if (isNaN(qty) || qty <= 0) {
    return res.status(400).json({ error: 'Ingresa una cantidad válida mayor a 0.' });
  }

  if (type === 'in') {
    prod.stock += qty;
  } else if (type === 'out') {
    if (prod.stock < qty) {
      return res.status(400).json({ error: 'No se puede retirar más del stock disponible.' });
    }
    prod.stock -= qty;
  } else if (type === 'adjustment') {
    prod.stock = qty;
  }

  prod.updatedAt = new Date().toISOString();

  const movement: StockMovement = {
    id: `mov-${Date.now()}`,
    productId: prod.id,
    productName: prod.name,
    type: type || 'adjustment',
    quantity: qty,
    reason: reason || 'Ajuste manual de stock',
    timestamp: new Date().toISOString(),
    performedBy: performedBy || 'Administrador',
  };

  mockDb.stockMovements.unshift(movement);

  if (prod.stock <= prod.minStock) {
    const skipAlertExistente = mockDb.stockMovements.some(
      (m) => m.productId === prod.id && m.reason.includes('ALERTA STOCK CRÍTICO')
    );
    if (!skipAlertExistente) {
      mockDb.stockMovements.unshift({
        id: `mov-alert-${Date.now()}`,
        productId: prod.id,
        productName: prod.name,
        type: 'alert',
        quantity: 0,
        reason: `ALERTA STOCK CRÍTICO - ${prod.name} alcanzó su mínimo (${prod.stock}/${prod.minStock} un.). Se requiere reposición.`,
        timestamp: new Date().toISOString(),
        performedBy: 'Sistema Automático',
      });
    }
  }

  res.json({ product: prod, movement });
});

// Zones Management
apiRouter.post('/zones', (req, res) => {
  const { name, provinceId, shippingFee, estimatedDays, courierAssigned } = req.body;

  if (!name || !provinceId) {
    return res.status(400).json({ error: 'Nombre de zona y provincia son obligatorios.' });
  }

  const newZone: Zone = {
    id: `zone-${Date.now()}`,
    name,
    provinceId,
    shippingFee: Number(shippingFee || 15),
    estimatedDays: estimatedDays || '24 - 48 hrs',
    courierAssigned: courierAssigned || 'Courier Local',
    status: 'active',
  };

  mockDb.zones.unshift(newZone);
  res.status(201).json(newZone);
});

// Districts Management
apiRouter.post('/districts', (req, res) => {
  const { name, provinceId, zoneId } = req.body;
  if (!name || !provinceId || !zoneId) {
    return res.status(400).json({ error: 'Faltan datos obligatorios.' });
  }

  const newDist: District = {
    id: `dist-${Date.now()}`,
    name,
    provinceId,
    zoneId,
  };

  mockDb.districts.push(newDist);
  res.status(201).json(newDist);
});

// Test Email Send
apiRouter.post('/emails/test-send', (req, res) => {
  const { recipientEmail, recipientName, subject, bodyHtml, orderId, trackingCode } = req.body;

  if (!recipientEmail || !subject) {
    return res.status(400).json({ error: 'Email de destino y asunto son obligatorios.' });
  }

  const emailLog: EmailLog = {
    id: `email-${Date.now()}`,
    orderId: orderId || 'N/A',
    trackingCode: trackingCode || 'SYS-NOTIF',
    recipientEmail,
    recipientName: recipientName || 'Cliente',
    subject,
    templateType: 'order_created',
    sentAt: new Date().toISOString(),
    status: 'sent',
    bodyHtml: bodyHtml || `<p>Notificación enviada a ${recipientName || recipientEmail}</p>`,
  };

  mockDb.emailLogs.unshift(emailLog);
  sendEmail(emailLog);
  res.json({ success: true, email: emailLog });
});

// Reset Data
apiRouter.post('/reset-data', (_req, res) => {
  mockDb.reset();
  res.json({
    message: 'Datos reiniciados con éxito',
    products: mockDb.products,
    orders: mockDb.orders,
    zones: mockDb.zones,
  });
});
