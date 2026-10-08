/**
 * OBS-STORE · Unified Services Hub (Re-exports for backward compatibility)
 * Los servicios de dominio ahora se organizan modularmente en:
 * - src/modules/products/services/productsService.ts
 * - src/modules/clients/services/clientsService.ts
 * - src/modules/orders/services/ordersService.ts
 * - src/modules/shipping/services/shippingService.ts
 */

export * from '../modules/products/services/productsService';
export * from '../modules/clients/services/clientsService';
export * from '../modules/orders/services/ordersService';
export { shippingService as configService } from '../modules/shipping/services/shippingService';
