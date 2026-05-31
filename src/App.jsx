import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { auth, provider, db } from "./firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function LocationMarker() {
  const [position, setPosition] = useState(null);
  const map = useMap();
  useEffect(() => {
    map.locate({ setView: true, maxZoom: 15 });
    map.on("locationfound", (e) => setPosition(e.latlng));
  }, [map]);
  return position ? (
    <Marker position={position}><Popup>📍 Estás aquí</Popup></Marker>
  ) : null;
}

function LoginScreen({ onLogin, error, loading }) {
  return (
    <div style={styles.loginContainer}>
      <div style={styles.gridOverlay} />
      <div style={styles.loginCard}>
        <div style={styles.radarIcon}>
          <svg viewBox="0 0 80 80" width="80" height="80">
            <circle cx="40" cy="40" r="36" fill="none" stroke="#00e5ff" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.4" />
            <circle cx="40" cy="40" r="24" fill="none" stroke="#00e5ff" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6" />
            <circle cx="40" cy="40" r="12" fill="none" stroke="#00e5ff" strokeWidth="2" />
            <circle cx="40" cy="40" r="4" fill="#00e5ff" />
            <line x1="40" y1="40" x2="40" y2="4" stroke="#00e5ff" strokeWidth="2"
              style={{ transformOrigin: "40px 40px", animation: "spin 3s linear infinite" }} />
          </svg>
        </div>
        <h1 style={styles.title}>RADAR<br /><span style={styles.titleAccent}>URBANO</span></h1>
        <p style={styles.subtitle}>Información de transporte en tiempo real</p>
        {error && (
          <div style={styles.errorBox}>
            <span>⚠️ </span>
            <span style={styles.errorText}>{error}</span>
          </div>
        )}
        <button style={{...styles.googleButton, opacity: loading ? 0.7 : 1}} onClick={onLogin} disabled={loading}>
          <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: 10 }}>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {loading ? "Conectando..." : "Continuar con Google"}
        </button>
        <p style={styles.disclaimer}>Al continuar, aceptas nuestros términos de servicio</p>
      </div>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #050a10; }
      `}</style>
    </div>
  );
}

function MapScreen({ user, onLogout, controles }) {
  return (
    <div style={styles.mapContainer}>
      <div style={styles.topBar}>
        <div style={styles.appName}>◉ RADAR URBANO</div>
        <div style={styles.userInfo}>
          {user.photoURL && <img src={user.photoURL} alt="avatar" style={styles.avatar} />}
          <button style={styles.logoutBtn} onClick={onLogout}>Salir</button>
        </div>
      </div>
  <MapContainer center={[-33.45, -70.65]} zoom={13} style={{ height: "100%", width: "100%" }} zoomControl={false}>
  <TileLayer
    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  />

  <LocationMarker />

  {controles.map((control) => (
    <Marker
      key={control.id}
      position={[control.lat, control.lng]}
    >
      <Popup>
        <strong>{control.nombre}</strong>
        <br />
        {control.descripcion}
      </Popup>
    </Marker>
  ))}
</MapContainer>

    </div>
  );
}   
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState(null);
const [controles, setControles] = useState([]);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);
 
useEffect(() => {
  const unsubscribe = onSnapshot(
    collection(db, "controles"),
    (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setControles(data);
      console.log("📡 Controles:", data);
    },
    (error) => {
      console.error("Firestore:", error);
    }
  );

  return () => unsubscribe();
}, []);  const handleLogin = async () => {
    setError(null);
    setLoginLoading(true);
    try {
      // signInWithPopup funciona de forma confiable en Android Chrome y desktop
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("❌ Error login:", err.code);
      if (err.code === "auth/popup-blocked") {
        setError("El navegador bloqueó la ventana. Permite las ventanas emergentes para este sitio e intenta de nuevo.");
      } else if (err.code === "auth/unauthorized-domain") {
        setError("Dominio no autorizado. Agrégalo en Firebase Console → Authentication → Authorized domains.");
      } else if (err.code !== "auth/popup-closed-by-user") {
        setError(`Error: ${err.message}`);
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => signOut(auth);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner} />
        <p style={styles.loadingText}>Iniciando Radar Urbano…</p>
        <style>{`@keyframes rotate { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
      </div>
    );
  }

  return user
  ? (
      <MapScreen
        user={user}
        onLogout={handleLogout}
        controles={controles}
      />
    )
  : (
      <LoginScreen
        onLogin={handleLogin}
        error={error}
        loading={loginLoading}
      />
    );
}

const styles = {
  loadingContainer: { display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100vh", background:"#050a10", gap:16 },
  loadingSpinner: { width:40, height:40, border:"3px solid rgba(0,229,255,0.2)", borderTop:"3px solid #00e5ff", borderRadius:"50%", animation:"rotate 0.8s linear infinite" },
  loadingText: { color:"#00e5ff", fontFamily:"monospace", fontSize:14, letterSpacing:2, opacity:0.7 },
  loginContainer: { display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:"linear-gradient(135deg,#050a10 0%,#0a1628 50%,#050a10 100%)", padding:20, position:"relative", overflow:"hidden", fontFamily:"sans-serif" },
  gridOverlay: { position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(0,229,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,255,0.03) 1px,transparent 1px)", backgroundSize:"40px 40px", pointerEvents:"none" },
  loginCard: { display:"flex", flexDirection:"column", alignItems:"center", gap:16, maxWidth:380, width:"100%", padding:"40px 32px", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(0,229,255,0.15)", borderRadius:20, backdropFilter:"blur(20px)", position:"relative", zIndex:1 },
  radarIcon: { marginBottom:8 },
  title: { color:"#ffffff", fontSize:36, fontWeight:700, letterSpacing:6, textAlign:"center", lineHeight:1.1 },
  titleAccent: { color:"#00e5ff" },
  subtitle: { color:"rgba(255,255,255,0.45)", fontSize:13, textAlign:"center", letterSpacing:1 },
  errorBox: { display:"flex", gap:8, background:"rgba(255,59,48,0.1)", border:"1px solid rgba(255,59,48,0.3)", borderRadius:10, padding:"12px 14px", width:"100%" },
  errorText: { color:"#ff6b6b", fontSize:12, lineHeight:1.5 },
  googleButton: { display:"flex", alignItems:"center", justifyContent:"center", width:"100%", padding:"14px 20px", background:"#ffffff", color:"#1a1a2e", border:"none", borderRadius:12, fontSize:15, fontWeight:600, cursor:"pointer", marginTop:8 },
  disclaimer: { color:"rgba(255,255,255,0.2)", fontSize:11, textAlign:"center" },
  mapContainer: { position:"fixed", inset:0, display:"flex", flexDirection:"column" },
  topBar: { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 16px", background:"rgba(5,10,16,0.92)", borderBottom:"1px solid rgba(0,229,255,0.15)", backdropFilter:"blur(10px)", zIndex:1000, flexShrink:0 },
  appName: { color:"#00e5ff", fontWeight:700, fontSize:16, letterSpacing:3 },
  userInfo: { display:"flex", alignItems:"center", gap:10 },
  avatar: { width:30, height:30, borderRadius:"50%", border:"2px solid rgba(0,229,255,0.4)" },
  logoutBtn: { background:"rgba(0,229,255,0.1)", color:"#00e5ff", border:"1px solid rgba(0,229,255,0.3)", borderRadius:8, padding:"5px 12px", fontSize:12, cursor:"pointer" },
};       
