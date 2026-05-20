import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import ProfileSetup from './pages/ProfileSetup';
import Dashboard from './components/Dashboard';
import Feed from './pages/Feed';
import Messages from './pages/Messages';
import Profile from './pages/Profile';
import Discover from './pages/Discover';
import Reels from './pages/Reels';
import Promo from './pages/Promo';
import VipShop from './pages/VipShop';
import AdminTerminal from './pages/AdminTerminal';
import Marketplace from './pages/Marketplace';
import Villages from './pages/Villages';
import { ShieldAlert, ExternalLink, X } from 'lucide-react';

function AppRoutes() {
  const { user, profile, loading } = useAuth();

  if (loading) return null;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <LandingPage />} />
      
      <Route
        path="/"
        element={
          <ProtectedRoute>
            {profile ? <Dashboard /> : <ProfileSetup />}
          </ProtectedRoute>
        }
      >
        <Route index element={<Feed />} />
        <Route path="messages" element={<Messages />} />
        <Route path="profile" element={<Profile />} />
        <Route path="discover" element={<Discover />} />
        <Route path="reels" element={<Reels />} />
        <Route path="promo" element={<Promo />} />
        <Route path="marketplace" element={<Marketplace />} />
        <Route path="villages" element={<Villages />} />
        <Route path="vip" element={<VipShop />} />
        <Route path="admin" element={<AdminTerminal />} />
        <Route path="u/:username" element={<Profile />} />
      </Route>
    </Routes>
  );
}

function AppContent() {
  const { quotaExceeded } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-indigo-500/30 selection:text-indigo-200">
      {quotaExceeded && !dismissed && (
        <div className="bg-gradient-to-r from-blue-900 to-zinc-900 border-b border-blue-550 p-4 md:px-8 relative z-[200]">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center md:items-start md:gap-4 gap-3 pr-8">
            <ShieldAlert className="h-6 w-6 text-blue-400 shrink-0 md:mt-0.5 animate-bounce" />
            <div className="flex-1 text-center md:text-left text-xs md:text-sm text-zinc-100 leading-relaxed font-semibold">
              <span className="text-[10px] bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 font-extrabold uppercase px-2 py-0.5 rounded tracking-widest mr-2 inline-block">
                Quota Limite Excedido
              </span>
              <span>
                O banco de dados atingiu o limite gratuito diário de leitura da conta Spark do Firebase. 
                Os dados do app podem não carregar temporariamente ou apresentar instabilidade até que a cota do plano Spark seja resetada amanhã (UTC).
              </span>
              <div className="mt-2 text-[11px] text-zinc-400">
                Para verificar o seu plano Spark ou fazer o upgrade do seu banco de dados e evitar interrupções, clique no link abaixo:
                <a 
                  href="https://console.firebase.google.com/project/gen-lang-client-0539361691/firestore/databases/ai-studio-7583d90f-f7b8-49f6-bfa0-ffdef2d06932/data?openUpgradeDialog=true"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1.5 inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 hover:underline border-b border-blue-400/40 pb-0.5 group shrink-0 ml-1.5 font-bold uppercase tracking-wider text-[10px]"
                >
                  Ir para o Console do Firestore <ExternalLink className="h-3 w-3 inline transition-transform group-hover:translate-x-0.5" />
                </a>
              </div>
            </div>
            <button 
              onClick={() => setDismissed(true)}
              className="absolute top-4 right-4 text-zinc-450 hover:text-white p-1 rounded-full hover:bg-zinc-800/50 transition-all cursor-pointer"
              title="Fechar Aviso"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      <AppRoutes />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
