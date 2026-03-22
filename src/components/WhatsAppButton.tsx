import React from 'react';
import { Phone } from 'lucide-react';

const WhatsAppButton: React.FC = () => {
  return (
    <a
      href="https://wa.me/5493777572230?text=Hola!%20Quiero%20hacer%20una%20consulta."
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-8 right-8 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-[0_0_30px_rgba(37,211,102,0.4)] hover:scale-110 transition-transform active:scale-90"
      aria-label="Consultá por WhatsApp"
    >
      <Phone size={28} />
    </a>
  );
};

export default WhatsAppButton;
