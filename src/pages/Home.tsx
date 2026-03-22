import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, Shield, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';

const Home: React.FC = () => {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const q = query(collection(db, 'productos'), orderBy('createdAt', 'desc'), limit(4));
        const snapshot = await getDocs(q);
        const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setFeatured(products);
      } catch (error) {
        console.error('Error fetching featured products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  return (
    <div className="space-y-32">
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=2070" 
            alt="Hero" 
            className="w-full h-full object-cover opacity-40 grayscale"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>

        <div className="relative z-10 text-center px-6">
          <motion.h1 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="graffiti-title mb-6"
          >
            YONK
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-2xl font-display font-bold uppercase tracking-[0.3em] text-white/60 mb-12"
          >
            Digital Underground Streetwear
          </motion.p>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col md:flex-row gap-6 justify-center"
          >
            <Link to="/ropa" className="btn btn-primary text-xl px-12">Explorar Ropa</Link>
            <Link to="/accesorios" className="btn btn-secondary text-xl px-12">Accesorios</Link>
          </motion.div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="tear-off mb-4 inline-block">Nuevos Drops</span>
            <h2 className="text-5xl md:text-7xl">Lo más reciente</h2>
          </div>
          <Link to="/ropa" className="hidden md:flex items-center gap-2 text-primary hover:text-white transition-colors font-display font-bold uppercase tracking-widest">
            Ver todo <ArrowRight size={20} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="aspect-[3/4] bg-surface-container animate-pulse" />
            ))}
          </div>
        ) : featured.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featured.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-center text-white/20 py-20 font-display font-bold uppercase tracking-widest">No hay productos destacados aún.</p>
        )}
      </section>

      {/* Features */}
      <section className="bg-surface-container py-24 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 bg-primary/10 text-primary flex items-center justify-center rounded-full shadow-[0_0_20px_rgba(221,255,175,0.2)]">
              <Zap size={40} />
            </div>
            <h3 className="text-2xl">Drop Rápido</h3>
            <p className="text-white/40">Lanzamientos exclusivos cada semana. No te duermas.</p>
          </div>
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 bg-secondary/10 text-secondary flex items-center justify-center rounded-full shadow-[0_0_20px_rgba(255,89,227,0.2)]">
              <Shield size={40} />
            </div>
            <h3 className="text-2xl">Calidad Sk8</h3>
            <p className="text-white/40">Ropa diseñada para aguantar el spot y el asfalto.</p>
          </div>
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 bg-white/10 text-white flex items-center justify-center rounded-full shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              <Truck size={40} />
            </div>
            <h3 className="text-2xl">Envío Seguro</h3>
            <p className="text-white/40">Llegamos a todo el país. Seguimiento en tiempo real.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
