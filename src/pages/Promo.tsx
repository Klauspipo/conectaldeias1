import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Hash, Heart, PlayCircle, Crown, Shield, Globe, Users, ArrowRight, Zap, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FEATURES = [
  {
    title: "CONEXÃO ANCESTRAL",
    subtitle: "A primeira rede social exclusiva para povos indígenas.",
    icon: Globe,
    color: "text-urucum",
    bg: "bg-urucum/10",
    description: "Conectando aldeias de norte a sul em uma plataforma segura e autêntica."
  },
  {
    title: "ALDEIAS DIGITAIS",
    subtitle: "Comunidade estilo Discord para organização.",
    icon: Hash,
    color: "text-forest",
    bg: "bg-forest/10",
    description: "Crie eventos, marque rituais e organize assembleias no servidor oficial."
  },
  {
    title: "MOMENTOS & STORIES",
    subtitle: "A vida na aldeia em tempo real.",
    icon: Heart,
    color: "text-ochre",
    bg: "bg-ochre/10",
    description: "Feed e Stories com design premium para valorizar cada registro cultural."
  },
  {
    title: "REELS ORIGINÁRIOS",
    subtitle: "Vídeos curtos, impacto gigante.",
    icon: PlayCircle,
    color: "text-white",
    bg: "bg-white/10",
    description: "Mostre a beleza da sua cultura em vídeos rápidos e envolventes."
  },
  {
    title: "BENEFÍCIOS VIP",
    subtitle: "Apoie a rede e ganhe destaque.",
    icon: Crown,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    description: "Selo dourado, molduras exclusivas e suporte prioritário para membros VIP."
  }
];

export default function Promo() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setStep(prev => (prev + 1) % (FEATURES.length + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-zinc-950 z-[200] overflow-hidden flex flex-col items-center justify-center">
      {/* Background Cinematic Elements */}
      <div className="absolute inset-0 opacity-20">
         <div className="absolute top-1/4 -left-20 w-96 h-96 bg-urucum rounded-full blur-[128px] animate-pulse" />
         <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-forest rounded-full blur-[128px] animate-pulse delay-1000" />
      </div>

      <AnimatePresence mode="wait">
        {step < FEATURES.length ? (
          <motion.div 
            key={step}
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 1.1 }}
            transition={{ duration: 0.8, ease: "circOut" }}
            className="relative z-10 flex flex-col items-center text-center px-6 max-w-2xl"
          >
            <div className={`p-6 rounded-[2.5rem] ${FEATURES[step].bg} mb-8 shadow-2xl`}>
               {(() => {
                 const Icon = FEATURES[step].icon;
                 return <Icon className={`h-16 w-16 ${FEATURES[step].color}`} />;
               })()}
            </div>
            
            <h2 className="text-sm font-black text-zinc-500 uppercase tracking-[0.4em] mb-4">
               {FEATURES[step].title}
            </h2>
            
            <h1 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter mb-6">
               {FEATURES[step].subtitle}
            </h1>
            
            <p className="text-lg text-zinc-400 font-medium leading-relaxed">
               {FEATURES[step].description}
            </p>

            <div className="mt-12 flex gap-2">
               {FEATURES.map((_, i) => (
                 <div 
                  key={i} 
                  className={`h-1 rounded-full transition-all duration-500 ${i === step ? 'w-12 bg-urucum' : 'w-2 bg-zinc-800'}`} 
                 />
               ))}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="final"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 flex flex-col items-center text-center px-6"
          >
             <div className="h-24 w-24 bg-urucum rounded-3xl flex items-center justify-center mb-10 rotate-12 shadow-2xl shadow-urucum/40">
                <Globe className="h-12 w-12 text-white" />
             </div>
             
             <h1 className="text-5xl md:text-7xl font-black text-white italic tracking-tighter mb-4">
                CONECTA<span className="text-urucum">ALDEIAS</span>
             </h1>
             <p className="text-xl text-zinc-400 font-bold uppercase tracking-widest italic mb-12">
                A Revolução Originária Digital
             </p>

             <div className="flex flex-col md:flex-row gap-6">
                <button 
                  onClick={() => navigate('/')}
                  className="px-12 py-5 bg-white text-black font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-200 transition-all flex items-center gap-3 shadow-2xl shadow-white/10"
                >
                   Entrar na Rede <ArrowRight className="h-5 w-5" />
                </button>
                <a 
                  href="https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                  download="trailer_conectaldeias.mp4"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-12 py-5 bg-urucum hover:bg-red-700 text-white font-black uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-3 shadow-2xl shadow-urucum/20 cursor-pointer"
                >
                   Baixar Trailer 📺
                </a>
                <button 
                  onClick={() => setStep(0)}
                  className="px-12 py-5 bg-zinc-900 text-white font-black uppercase tracking-widest rounded-2xl border border-zinc-800 hover:bg-zinc-800 transition-all"
                >
                   Ver Novamente
                </button>
             </div>

             <div className="mt-16 flex items-center gap-8 opacity-40">
                <div className="flex items-center gap-2">
                   <Shield className="h-4 w-4" />
                   <span className="text-[10px] font-black uppercase tracking-widest">Seguro</span>
                </div>
                <div className="flex items-center gap-2">
                   <Users className="h-4 w-4" />
                   <span className="text-[10px] font-black uppercase tracking-widest">Original</span>
                </div>
                <div className="flex items-center gap-2">
                   <Zap className="h-4 w-4" />
                   <span className="text-[10px] font-black uppercase tracking-widest">Rápido</span>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Bar for the whole "trailer" */}
      <div className="absolute bottom-0 left-0 h-1.5 bg-urucum/20 w-full overflow-hidden">
         <motion.div 
           initial={{ scaleX: 0 }}
           animate={{ scaleX: 1 }}
           key={step}
           transition={{ duration: 5, ease: "linear" }}
           className="h-full bg-urucum origin-left"
         />
      </div>

      <button 
        onClick={() => navigate('/')}
        className="absolute top-8 right-8 text-zinc-600 hover:text-white transition-colors flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em]"
      >
         Pular <Sparkles className="h-4 w-4" />
      </button>
    </div>
  );
}
