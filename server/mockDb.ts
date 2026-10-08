import {
  INITIAL_PRODUCTS,
  INITIAL_PROVINCES,
  INITIAL_DISTRICTS,
  INITIAL_ZONES,
  INITIAL_ORDERS,
  INITIAL_STOCK_MOVEMENTS,
  INITIAL_EMAIL_LOGS,
} from '../src/data/mockData';
import { Product, Province, District, Zone, Order, StockMovement, EmailLog } from '../src/types';

export class MockDatabase {
  public products: Product[] = [...INITIAL_PRODUCTS];
  public provinces: Province[] = [...INITIAL_PROVINCES];
  public districts: District[] = [...INITIAL_DISTRICTS];
  public zones: Zone[] = [...INITIAL_ZONES];
  public orders: Order[] = [...INITIAL_ORDERS];
  public stockMovements: StockMovement[] = [...INITIAL_STOCK_MOVEMENTS];
  public emailLogs: EmailLog[] = [...INITIAL_EMAIL_LOGS];

  public reset() {
    this.products = [...INITIAL_PRODUCTS];
    this.provinces = [...INITIAL_PROVINCES];
    this.districts = [...INITIAL_DISTRICTS];
    this.zones = [...INITIAL_ZONES];
    this.orders = [...INITIAL_ORDERS];
    this.stockMovements = [...INITIAL_STOCK_MOVEMENTS];
    this.emailLogs = [...INITIAL_EMAIL_LOGS];
  }

  public generateTrackingCode(): string {
    const num = Math.floor(10000 + Math.random() * 90000);
    return `TRK-${num}`;
  }

  public generateOrderNumber(): string {
    const num = this.orders.length + 93;
    return `PED-2026-${num.toString().padStart(4, '0')}`;
  }
}

export const mockDb = new MockDatabase();
