import { useRef } from "react";
import { toast } from "sonner";
import { Camera, X } from "lucide-react";
import { resizeImage } from "../lib/api";

export const PhotoUpload = ({ images, setImages }) => {
  const ref = useRef();
  const add = async (e) => {
    const files = Array.from(e.target.files || []).filter((f) => /image\/(jpeg|png|webp)/.test(f.type));
    if (files.length < (e.target.files || []).length) toast.error("Lejohen vetëm foto JPG, PNG ose WEBP.");
    const out = await Promise.all(files.map((f) => resizeImage(f)));
    setImages([...images, ...out].slice(0, 6));
    e.target.value = "";
  };
  return (
    <div>
      <span className="lbl">Fotot e librit (deri në 6 faqe)</span>
      <div className="flex flex-wrap gap-3">
        {images.map((src, i) => (
          <div key={i} className="relative w-24 h-28 rounded-lg overflow-hidden border border-ink/15 group" data-testid={`photo-preview-${i}`}>
            <img src={src} alt={`Faqja ${i + 1}`} className="w-full h-full object-cover" />
            <span className="absolute bottom-1 left-1 text-[10px] bg-ink text-paper px-1.5 rounded">{i + 1}</span>
            <button type="button" onClick={() => setImages(images.filter((_, j) => j !== i))} className="absolute top-1 right-1 bg-paper/90 rounded-full p-0.5 opacity-80 hover:opacity-100" data-testid={`photo-remove-${i}`}><X size={12} /></button>
          </div>
        ))}
        {images.length < 6 && (
          <button type="button" onClick={() => ref.current.click()} className="w-24 h-28 rounded-lg border-2 border-dashed border-ink/25 hover:border-accent hover:bg-accent/5 flex flex-col items-center justify-center gap-1 text-xs text-muted transition-colors" data-testid="photo-add-btn">
            <Camera size={20} /> Shto foto
          </button>
        )}
      </div>
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={add} data-testid="photo-input" />
    </div>
  );
};
