import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartModal: React.FC<CartModalProps> = ({ isOpen, onClose }) => {
  const { cart, removeFromCart, updateQuantity, total, clearCart } = useCart();

  const handleCheckout = () => {
    const detail = cart.map(item => `- ${item.name} (x${item.quantity}) - $${item.price * item.quantity}`).join('%0A');
    const message = `Hola, quiero hacer el siguiente pedido:%0A%0A${detail}%0A%0ATotal: $${total}%0A%0AMi nombre: %0AMedio de pago: `;
    window.open(`https://wa.me/5493777572230?text=${message}`, '_blank');
    clearCart();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed top-0 right-0 z-[70] h-full w-full max-w-md bg-surface-container shadow-[-20px_0_50px_rgba(0,0,0,0.5)] flex flex-col"
          >
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-2xl font-display font-black italic text-primary">Tu Carrito</h2>
              <button onClick={onClose} className="p-2 hover:text-primary transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                  <ShoppingBag size={64} className="mb-4" />
                  <p className="font-display font-bold uppercase tracking-widest">El carrito está vacío</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex gap-4 bg-surface-bright p-4 border border-white/5">
                    <img src={item.images[0]} alt={item.name} className="w-20 h-20 object-cover" />
                    <div className="flex-1">
                      <h4 className="text-sm font-display font-bold uppercase mb-1">{item.name}</h4>
                      <p className="text-primary font-bold mb-3">${item.price}</p>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-background px-2 py-1">
                          <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:text-primary"><Minus size={14} /></button>
                          <span className="w-8 text-center font-bold">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:text-primary"><Plus size={14} /></button>
                        </div>
                        <button onClick={() => removeFromCart(item.id)} className="text-white/20 hover:text-secondary transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 bg-surface-bright border-t border-white/5 space-y-4">
                <div className="flex items-center justify-between text-xl font-display font-black uppercase italic">
                  <span>Total</span>
                  <span className="text-primary neon-text">${total}</span>
                </div>
                <button 
                  onClick={handleCheckout}
                  className="btn btn-primary w-full flex items-center justify-center gap-3"
                >
                  Enviar pedido por WhatsApp
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartModal;
