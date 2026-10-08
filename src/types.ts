export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  minStock: number;
  location: string;
  updatedAt: string;
  imageUrl?: string;
  hoverImageUrl?: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'in' | 'out' | 'adjustment' | 'alert';
  quantity: number;
  reason: string;
  timestamp: string;
  performedBy: string;
}

export interface Province {
  id: string;
  name: string;
  code: string;
}

export interface District {
  id: string;
  provinceId: string;
  name: string;
  zoneId: string;
}

export interface Zone {
  id: string;
  name: string;
  provinceId: string;
  shippingFee: number;
  estimatedDays: string;
  courierAssigned: string;
  status: 'active' | 'inactive';
}

export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export type OrderStatus = 'pendiente' | 'en_preparacion' | 'en_ruta' | 'entregado' | 'cancelado';

export interface TrackingStep {
  id: string;
  status: OrderStatus | string;
  title: string;
  description: string;
  location: string;
  timestamp: string;
  completed: boolean;
}

export interface CourierInfo {
  driverName?: string;
  driverPhone?: string;
  vehicle?: string;
  licensePlate?: string;
}

export interface OrderCustomer {
  name: string;
  email: string;
  phone: string;
  address: string;
  province: string;
  district: string;
  zone?: string;
  notes?: string;
  document?: string;
  documentNumber?: string;
  docNumber?: string;
  reference?: string;
  coords?: { lat: number; lng: number };
}

export interface Customer extends OrderCustomer {
  id?: string;
  totalOrders?: number;
  totalSpent?: number;
  lastOrderDate?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  trackingCode: string;
  numero_pedido?: string;
  codigo_tracking?: string;
  cliente_nombre?: string;
  cliente_email?: string;
  customer: OrderCustomer;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  adelanto?: number;
  saldo?: number;
  descuento?: number;
  tipoEntrega?: string;
  agenciaEnvio?: string;
  sedeShalom?: string;
  numeroNota?: string;
  status: OrderStatus;
  estado?: OrderStatus;
  createdAt: string;
  updatedAt: string;
  estimatedDelivery: string;
  paymentMethod: string;
  timeline: TrackingStep[];
  courier?: CourierInfo;
}

export interface EmailLog {
  id: string;
  orderId: string;
  trackingCode: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  templateType: 'order_created' | 'order_dispatched' | 'out_for_delivery' | 'delivered' | 'low_stock_alert';
  sentAt: string;
  status: 'sent' | 'pending' | 'failed';
  bodyHtml: string;
}

export interface EmailTemplate {
  id: string;
  type: EmailLog['templateType'];
  title: string;
  subject: string;
  content: string;
}

export interface SystemStats {
  totalOrders: number;
  totalSales: number;
  pendingDeliveries: number;
  lowStockProducts: number;
  deliveredRate: number;
}
