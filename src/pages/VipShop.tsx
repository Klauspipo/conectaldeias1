import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Crown, Check, ShieldCheck, Zap, Star, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

const VIP_PLANS = [
  {
    id: 'warrior',
    name: 'Guerreiro VIP',
    price: '9.90',
    period: 'mês',
    features: [
      'Selo de verificação VIP',
      'Posts com destaque urucum',
      'Stories sem limite de tempo',
      'Suporte prioritário'
    ],
    color: 'from-urucum to-red-600',
    icon: Zap
  },
  {
    id: 'chief',
    name: 'Caminho do Cacique',
    price: '19.90',
    period: 'mês',
    features: [
      'Tudo do plano anterior',
      'Badge de Fundador',
      'Personalização de tema',
      'Anúncios removidos da feira'
    ],
    color: 'from-ochre to-amber-600',
    icon: Crown,
    popular: true
  }
];

export default function VipShop() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (planId: string) => {
    if (!user) return;
    setLoading(planId);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await updateDoc(doc(db, 'users', user.uid), {
        vipStatus: {
          isVip: true,
          plan: planId,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        },
        isVerified: true,
        updatedAt: serverTimestamp()
      });
      
      await refreshProfile();
      alert('Parabéns! Você agora é um membro VIP do ConectAldeias.');
      navigate('/profile');
    } catch (err) {
      console.error(err);
      alert('Erro ao processar assinatura.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex-1 px-4 py-8 md:px-8 bg-zinc-950 min-h-screen">
      <header className="mb-12">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold uppercase tracking-widest">Voltar</span>
        </button>

        <div className="flex items-center gap-3 text-urucum mb-2">
          <Crown className="h-8 w-8" />
          <span className="text-xs font-black uppercase tracking-[0.4em]">Plano de Fidelidade</span>
        </div>
        <h1 className="text-5xl font-black tracking-tighter text-white italic">CLÃ VIP</h1>
        <p className="text-zinc-500 mt-2 max-w-lg">Fortaleça nossa rede e ganhe recursos exclusivos para sua jornada no ConectAldeias.</p>
      </header>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl">
        {VIP_PLANS.map((plan) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "relative flex flex-col p-8 rounded-[2.5rem] bg-zinc-900 border transition-all hover:border-white/20",
              plan.popular ? "border-ochre/30 bg-gradient-to-b from-zinc-900 to-ochre/5 shadow-2xl shadow-ochre/10" : "border-zinc-800"
            )}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-ochre text-white text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-lg">
                Mais Escolhido
              </div>
            )}

            <div className={cn(
              "h-14 w-14 rounded-2xl flex items-center justify-center mb-8 bg-gradient-to-br shadow-lg",
              plan.color
            )}>
              <plan.icon className="h-8 w-8 text-white" />
            </div>

            <h3 className="text-2xl font-black text-white italic mb-2">{plan.name}</h3>
            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-3xl font-black text-white">R$ {plan.price}</span>
              <span className="text-zinc-500 text-sm font-medium">/{plan.period}</span>
            </div>

            <ul className="space-y-4 mb-10 flex-1">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-zinc-400 text-sm font-medium">
                  <div className="h-5 w-5 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe(plan.id)}
              disabled={loading !== null || profile?.vipStatus?.plan === plan.id}
              className={cn(
                "w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 disabled:opacity-50",
                plan.popular 
                  ? "bg-ochre text-white shadow-xl shadow-ochre/20 hover:bg-amber-600" 
                  : "bg-white text-zinc-950 hover:bg-zinc-100"
              )}
            >
              {loading === plan.id ? (
                <Loader2 className="h-5 w-5 animate-spin mx-auto" />
              ) : profile?.vipStatus?.plan === plan.id ? (
                'Plano Atual'
              ) : (
                'Unir-se ao Clã'
              )}
            </button>
          </motion.div>
        ))}
      </div>

      <div className="mt-16 p-8 rounded-[2rem] bg-zinc-900/50 border border-zinc-800 flex flex-col md:flex-row items-center gap-8">
        <div className="h-16 w-16 rounded-full bg-jenkins p-1 shrink-0">
          <div className="h-full w-full rounded-full bg-zinc-900 flex items-center justify-center">
            <ShieldCheck className="h-8 w-8 text-forest" />
          </div>
        </div>
        <div>
          <h4 className="text-white font-black italic">Segurança & Tradição</h4>
          <p className="text-zinc-500 text-sm mt-1">Sua contribuição ajuda a manter a plataforma livre e segura para todos os povos indígenas.</p>
        </div>
      </div>
    </div>
  );
}
