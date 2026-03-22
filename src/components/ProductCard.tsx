import React from 'react';
import { ShoppingCart, Eye } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();

  return (
    <div className="card group relative overflow-hidden">
      <div className="aspect-[3/4] overflow-hidden bg-surface-bright relative">
        <img 
          src={product.images[0]} 
          alt={product.name} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
          <button 
            onClick={() => addToCart(product)}
            className="p-4 bg-primary text-black hover:bg-primary-container transition-colors"
          >
            <ShoppingCart size={24} />
          </button>
        </div>
        <div className="absolute top-4 left-4">
          <span className="tear-off text-[10px]">{product.subcategory}</span>
        </div>
      </div>
      
      <div className="p-6">
        <h3 className="text-lg mb-2 truncate">{product.name}</h3>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-display font-black italic text-primary neon-text">${product.price}</span>
          <button 
            onClick={() => addToCart(product)}
            className="text-[10px] font-display font-bold uppercase tracking-widest border-b border-primary text-primary hover:text-white hover:border-white transition-colors"
          >
            Añadir al carrito
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
