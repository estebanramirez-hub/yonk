import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { Filter, SlidersHorizontal, X, Loader2 } from 'lucide-react';
import { db } from '../firebase';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';

interface ShopProps {
  category: 'ropa' | 'accesorios';
}

const Shop: React.FC<ShopProps> = ({ category }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const subcategories = category === 'ropa' 
    ? ['Baggy', 'Jorts', 'Remeras', 'Hoodies', 'Pantalones']
    : ['Gorras', 'Cintos', 'Medias', 'Otros'];

  const activeSubcat = searchParams.get('sub');

  useEffect(() => {
    setLoading(true);
    let q = query(
      collection(db, 'productos'), 
      where('category', '==', category),
      orderBy('createdAt', 'desc')
    );

    if (activeSubcat) {
      q = query(q, where('subcategory', '==', activeSubcat));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(fetched);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching products:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [category, activeSubcat]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row gap-12">
        {/* Sidebar Filters */}
        <aside className="hidden md:block w-64 space-y-12">
          <div>
            <h2 className="text-4xl mb-8 italic">{category}</h2>
            <div className="space-y-4">
              <button 
                onClick={() => setSearchParams({})}
                className={`block w-full text-left font-display font-bold uppercase tracking-widest transition-colors ${!activeSubcat ? 'text-primary neon-text' : 'text-white/40 hover:text-white'}`}
              >
                Todos
              </button>
              {subcategories.map(sub => (
                <button 
                  key={sub}
                  onClick={() => setSearchParams({ sub })}
                  className={`block w-full text-left font-display font-bold uppercase tracking-widest transition-colors ${activeSubcat === sub ? 'text-primary neon-text' : 'text-white/40 hover:text-white'}`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Mobile Filter Toggle */}
        <div className="md:hidden flex items-center justify-between mb-8">
          <h2 className="text-4xl italic">{category}</h2>
          <button 
            onClick={() => setIsFilterOpen(true)}
            className="flex items-center gap-2 btn btn-secondary py-2 px-4 text-xs"
          >
            <Filter size={16} /> Filtros
          </button>
        </div>

        {/* Product Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="aspect-[3/4] bg-surface-container animate-pulse" />
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="h-96 flex flex-col items-center justify-center text-center opacity-20">
              <SlidersHorizontal size={64} className="mb-4" />
              <p className="font-display font-bold uppercase tracking-widest">No se encontraron productos</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Modal */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-[100] bg-background p-6 flex flex-col">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-4xl italic">Filtros</h2>
            <button onClick={() => setIsFilterOpen(false)}><X size={32} /></button>
          </div>
          <div className="space-y-8">
            <button 
              onClick={() => { setSearchParams({}); setIsFilterOpen(false); }}
              className={`block w-full text-left text-2xl font-display font-black uppercase italic ${!activeSubcat ? 'text-primary' : 'text-white/40'}`}
            >
              Todos
            </button>
            {subcategories.map(sub => (
              <button 
                key={sub}
                onClick={() => { setSearchParams({ sub }); setIsFilterOpen(false); }}
                className={`block w-full text-left text-2xl font-display font-black uppercase italic ${activeSubcat === sub ? 'text-primary' : 'text-white/40'}`}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Shop;
