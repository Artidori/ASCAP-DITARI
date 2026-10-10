import { useEffect, useState } from "react";
import "@/App.css";
import { Toaster } from "./components/ui/sonner";
import { LoginScreen } from "./components/LoginScreen";
import { Generator } from "./components/Generator";
import axios from "axios";
import { licApi, errMsg, API, deviceInfo } from "./lib/api";
import { toast } from "sonner";
import { Footer } from "./components/Footer";
import { WhatsAppButton } from "./components/WhatsAppButton";

function App() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const prove = new URLSearchParams(window.location.search).get("prove");
    if (prove) {
      window.history.replaceState({}, "", window.location.pathname);
      axios.post(`${API}/trial/start`, { token: prove, ...deviceInfo() })
        .then((r) => { localStorage.setItem("ascap_kodi", r.data.kodi); setUser(r.data); })
        .catch((e) => toast.error(errMsg(e))).finally(() => setReady(true));
      return;
    }
    if (!localStorage.getItem("ascap_kodi")) return setReady(true);
    licApi().get("/license/me").then((r) => setUser(r.data)).catch((e) => { localStorage.removeItem("ascap_kodi"); toast.error(errMsg(e)); }).finally(() => setReady(true));
  }, []);

  const logout = () => { localStorage.removeItem("ascap_kodi"); setUser(null); };

  return (
    <div className="App">
      <Toaster position="top-center" richColors />
      {ready && (user ? <Generator user={user} onLogout={logout} /> : <LoginScreen onLogin={setUser} />)}
      {ready && <Footer />}
      <WhatsAppButton />
    </div>
  );
}

export default App;
