import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, AtSign, User as UserIcon, Check, Loader2 } from 'lucide-react';
import { doc, setDoc, getDoc, serverTimestamp, query, collection, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

export default function ProfileSetup() {
  const { user, refreshProfile } = useAuth();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const checkUsername = async (name: string) => {
    const q = query(collection(db, 'users'), where('username', '==', name.toLowerCase()));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    setError('');

    const trimmedUsername = username.trim().toLowerCase();
    
    if (trimmedUsername.length < 3) {
      setError('O nome de usuário deve ter pelo menos 3 caracteres.');
      setLoading(false);
      return;
    }

    try {
      const isAvailable = await checkUsername(trimmedUsername);
      if (!isAvailable) {
        setError('Este nome de usuário já está em uso.');
        setLoading(false);
        return;
      }

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email || '',
        username: trimmedUsername,
        displayName: displayName || user.displayName || trimmedUsername,
        bio: bio || '',
        photoURL: user.photoURL || '',
        followersCount: 0,
        followingCount: 0,
        createdAt: serverTimestamp(),
      });

      await refreshProfile();
    } catch (err) {
      setError('Erro ao salvar perfil. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md space-y-8 rounded-3xl border border-zinc-800 bg-zinc-900/50 p-8 shadow-2xl backdrop-blur-xl"
        id="setup-container"
      >
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">Complete seu perfil</h2>
          <p className="mt-2 text-zinc-400">Como as pessoas te encontrarão no CONECTALDEIAS?</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center">
            <div className="relative group cursor-pointer">
              <div className="h-24 w-24 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center overflow-hidden">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <UserIcon className="h-10 w-10 text-zinc-600" />
                )}
              </div>
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                <Camera className="text-white h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5 flex items-center gap-1.5">
                <AtSign className="h-3.5 w-3.5" /> Nome de usuário
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                placeholder="ex: joao_silva"
                className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5 flex items-center gap-1.5">
                <UserIcon className="h-3.5 w-3.5" /> Nome exibido
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Seu nome real"
                className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                Biografia
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Conte algo sobre você..."
                className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none h-24"
              />
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={loading}
            className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-indigo-600 px-6 py-4 font-semibold text-white transition-all hover:bg-indigo-500 disabled:opacity-50"
            id="finish-setup-button"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Check className="h-5 w-5" />
                Concluir Registro
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
