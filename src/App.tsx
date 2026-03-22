import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ShoppingCart, Menu, X, Instagram, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CartProvider, useCart } from './context/CartContext';
import Home from './pages/Home';
import Shop from './pages/Shop';
import Admin from './pages/Admin';
import CartModal from './components/CartModal';
import WhatsAppButton from './components/WhatsAppButton';

const Header = () => {
  const { itemCount } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 glass h-20 px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-display text-3xl font-black italic tracking-tighter text-primary neon-text">YONK</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link to="/" className="font-display font-bold uppercase tracking-widest hover:text-primary transition-colors">Inicio</Link>
          <Link to="/ropa" className="font-display font-bold uppercase tracking-widest hover:text-primary transition-colors">Ropa</Link>
          <Link to="/accesorios" className="font-display font-bold uppercase tracking-widest hover:text-primary transition-colors">Accesorios</Link>
        </nav>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 hover:text-primary transition-colors"
          >
            <ShoppingCart size={24} />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-secondary text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-[0_0_10px_rgba(255,89,227,0.8)]">
                {itemCount}
              </span>
            )}
          </button>
          <button 
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-background pt-24 px-6 flex flex-col gap-8 md:hidden"
          >
            <Link to="/" onClick={() => setIsMenuOpen(false)} className="text-4xl font-display font-black uppercase italic">Inicio</Link>
            <Link to="/ropa" onClick={() => setIsMenuOpen(false)} className="text-4xl font-display font-black uppercase italic">Ropa</Link>
            <Link to="/accesorios" onClick={() => setIsMenuOpen(false)} className="text-4xl font-display font-black uppercase italic">Accesorios</Link>
            <div className="mt-auto pb-12 flex gap-6">
              <a href="https://www.instagram.com/yonk.arg/" target="_blank" rel="noreferrer"><Instagram size={32} /></a>
              <a href="https://wa.me/5493777572230" target="_blank" rel="noreferrer"><Phone size={32} /></a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};

const Footer = () => (
  <footer className="bg-surface-container mt-20 py-12 px-6 border-t border-white/5">
    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
      <div>
        <span className="font-display text-4xl font-black italic text-primary mb-6 block">YONK</span>
        <p className="text-white/40 max-w-xs">Streetwear, Y2K & Sk8 Culture. La ropa que define tu spot.</p>
      </div>
      <div>
        <h4 className="mb-6">Categorías</h4>
        <ul className="space-y-4 text-white/60">
          <li><Link to="/ropa" className="hover:text-primary transition-colors">Ropa</Link></li>
          <li><Link to="/accesorios" className="hover:text-primary transition-colors">Accesorios</Link></li>
          <li><Link to="/ropa?cat=Baggy" className="hover:text-primary transition-colors">Baggy Pants</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="mb-6">Contacto</h4>
        <div className="flex gap-6">
          <a href="https://www.instagram.com/yonk.arg/" target="_blank" rel="noreferrer" className="hover:text-secondary transition-colors"><Instagram size={24} /></a>
          <a href="https://wa.me/5493777572230" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors"><Phone size={24} /></a>
        </div>
      </div>
    </div>
    <div className="max-w-7xl mx-auto mt-12 pt-12 border-t border-white/5 text-center text-white/20 text-xs uppercase tracking-widest flex flex-col gap-2">
      <p>© 2026 YONK. Digital Underground.</p>
      <p>
        Creado por <a href="https://www.instagram.com/puntoaltotecno" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">@puntoaltotecno</a> - Goya, Corrientes. Argentina.
      </p>
    </div>
  </footer>
);

export default function App() {
  return (
    <CartProvider>
      <Router>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1 pt-20">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/ropa" element={<Shop category="ropa" />} />
              <Route path="/accesorios" element={<Shop category="accesorios" />} />
              <Route path="/yonk-panel-privado" element={<Admin />} />
            </Routes>
          </main>
          <Footer />
          <WhatsAppButton />
        </div>
      </Router>
    </CartProvider>
  );
}
