import React from 'react';
import { motion } from 'motion/react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Home, Search, MessageSquare, User, LogOut, Hash, Compass, PlusSquare, Crown, ShieldAlert, ShoppingBag, PlayCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { signOut, auth } from '../lib/firebase';
import { cn } from '../lib/utils';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const navItems = [
    { icon: Home, label: 'Feed', path: '/' },
    { icon: PlayCircle, label: 'Reels', path: '/reels' },
    { icon: Compass, label: 'Descobrir', path: '/discover' },
    { icon: MessageSquare, label: 'Mensagens', path: '/messages' },
    { icon: User, label: 'Perfil', path: '/profile' },
  ];

  if (profile?.isAdmin) {
    navItems.push({ icon: ShieldAlert, label: 'Admin Panel', path: '/admin' });
  }

  return (
    <div className="flex h-screen overflow-hidden bg-jenipapo">
      {/* Desktop Sidebar (Discord/Instagram Hybrid) */}
      <aside className="hidden w-20 flex-col items-center border-r border-urucum/20 bg-indigenous-pattern py-6 md:flex lg:w-64 lg:items-stretch lg:px-4">
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/villages')}
          className="mb-8 flex items-center gap-3 px-3 lg:px-2 hover:opacity-80 transition-opacity"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-urucum text-white shadow-lg shadow-urucum/20">
            <Hash className="h-6 w-6" />
          </div>
          <span className="hidden text-xl font-black tracking-tighter text-white lg:block italic">CONECTALDEIAS</span>
        </motion.button>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-xl px-3 py-3 transition-all",
                  isActive 
                    ? "bg-urucum/10 text-urucum font-bold" 
                    : "text-zinc-500 hover:bg-urucum/5 hover:text-zinc-200"
                )
              }
            >
              <motion.div
                className="flex items-center gap-3 w-full"
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.95 }}
              >
                <item.icon className="h-6 w-6" />
                <span className="hidden font-medium lg:block">{item.label}</span>
              </motion.div>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto space-y-2 pt-6">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-zinc-500 transition-all hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-6 w-6" />
            <span className="hidden font-medium lg:block">Sair</span>
          </button>
          
          <div className="flex items-center gap-3 border-t border-zinc-900 pt-4 px-1 lg:px-2">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-zinc-800 bg-zinc-900">
              {profile?.photoURL ? (
                <img src={profile.photoURL} alt={profile.username} className="h-full w-full object-cover" />
              ) : (
                <User className="h-6 w-6 m-auto mt-1.5 text-zinc-700" />
              )}
            </div>
            <div className="hidden min-w-0 lg:block">
              <p className="truncate text-sm font-semibold text-white">{profile?.displayName}</p>
              <p className="truncate text-xs text-zinc-500">@{profile?.username}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="relative flex-1 flex flex-col h-full bg-jenipapo overflow-y-auto">
        <div className="h-full w-full max-w-4xl mx-auto py-4">
           <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation (Instagram Style) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-urucum/20 bg-jenipapo/90 px-4 backdrop-blur-xl md:hidden">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center space-y-1 transition-all",
                isActive ? "text-urucum scale-110" : "text-zinc-600"
              )
            }
          >
            <motion.div
              whileTap={{ scale: 0.8 }}
              className="p-2"
            >
              <item.icon className="h-6 w-6" />
            </motion.div>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
