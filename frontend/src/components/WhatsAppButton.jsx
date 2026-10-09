import { MessageCircle } from "lucide-react";

const TEKSTI = encodeURIComponent("Përshëndetje! Kam nevojë për ndihmë me licencën e ASCAP Ditari (licencë e re / pajisje e re).");

export const WhatsAppButton = () => (
  <a href={`https://wa.me/355695258165?text=${TEKSTI}`} target="_blank" rel="noreferrer"
    className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-[#25D366] text-white px-4 py-3 text-sm font-semibold shadow-lg hover:scale-105 transition-transform"
    data-testid="whatsapp-btn">
    <MessageCircle size={18} /> <span className="hidden sm:inline">Na shkruani në WhatsApp</span>
  </a>
);
