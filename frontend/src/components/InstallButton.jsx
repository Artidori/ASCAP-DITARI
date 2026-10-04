import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Smartphone } from "lucide-react";

const isStandalone = () => window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

export const InstallButton = () => {
  const [prompt, setPrompt] = useState(null);
  useEffect(() => {
    const h = (e) => { e.preventDefault(); setPrompt(e); };
    window.addEventListener("beforeinstallprompt", h);
    return () => window.removeEventListener("beforeinstallprompt", h);
  }, []);
  if (isStandalone() || (!prompt && !isIOS())) return null;
  const install = async () => {
    if (prompt) { prompt.prompt(); await prompt.userChoice; setPrompt(null); }
    else toast.info("Në iPhone: shtypni butonin Share (katrori me shigjetë) dhe zgjidhni \"Add to Home Screen\".", { duration: 8000 });
  };
  return <button onClick={install} className="btn-ghost" data-testid="install-app-btn"><Smartphone size={16} /> Instalo</button>;
};
