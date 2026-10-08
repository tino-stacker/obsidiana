import React from 'react';
import { PublicStorefront } from '../modules/storefront/PublicStorefront';
import { Product } from '../types';

export interface PublicCatalogProps {
  products: Product[];
}

/**
 * PublicCatalog delegates to the new modular, luxury PublicStorefront
 * which features the hero banner combining top models, lookbook, and interactive shop.
 */
export const PublicCatalog: React.FC<PublicCatalogProps> = ({ products }) => {
  return <PublicStorefront products={products} />;
};

export default PublicCatalog;
