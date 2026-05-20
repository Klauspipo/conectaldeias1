import { motion } from 'motion/react';
import { LogIn, Instagram, MessageCircle, Hash } from 'lucide-react';
import { signInWithPopup, googleProvider, auth } from '../lib/firebase';

export default function LandingPage() {
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-jenipapo bg-indigenous-pattern px-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md space-y-10"
        id="landing-container"
      >
        <div className="relative mx-auto h-24 w-24">
          <div className="absolute inset-0 animate-pulse rounded-3xl bg-urucum/20 blur-2xl"></div>
          <div className="relative flex h-full w-full items-center justify-center rounded-3xl bg-zinc-900/50 border border-urucum/30 shadow-2xl shadow-urucum/20 backdrop-blur-sm">
            <Hash className="h-10 w-10 text-urucum" />
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-5xl font-black tracking-tighter text-white sm:text-6xl italic" id="title">
            CONECTALDEIAS
          </h1>
          <p className="text-zinc-500 font-medium uppercase tracking-[0.2em] text-sm">
            Indígenas: um povo guerreiro e lutador
          </p>
        </div>

        <div className="grid grid-cols-3 gap-6 py-4 opacity-60">
          <div className="flex flex-col items-center space-y-2">
            <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800">
               <Instagram className="h-5 w-5 text-white" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Momentos</span>
          </div>
          <div className="flex flex-col items-center space-y-2">
            <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800">
               <MessageCircle className="h-5 w-5 text-white" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Conexão</span>
          </div>
          <div className="flex flex-col items-center space-y-2">
            <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800">
               <Hash className="h-5 w-5 text-white" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Aldeias</span>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogin}
          className="group relative flex w-full items-center justify-center gap-3 rounded-2xl bg-urucum px-6 py-5 font-black text-white transition-all shadow-xl shadow-urucum/20 hover:bg-red-700 uppercase tracking-widest text-xs"
          id="login-button"
        >
          <LogIn className="h-5 w-5" />
          Acessar Plataforma
        </motion.button>

        <p className="text-xs text-zinc-600">
          Ao entrar, você concorda com nossos Termos de Serviço e Política de Privacidade.
        </p>
      </motion.div>
    </div>
  );
}
