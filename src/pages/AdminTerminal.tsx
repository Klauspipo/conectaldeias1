import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Shield, Users, FileText, Trash2, BadgeCheck, Crown, ShieldAlert, Search, ArrowRight, Activity, Flag, Check, PlayCircle } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, getDocs, limit, getDoc, setDoc, serverTimestamp, where, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { Navigate, useNavigate } from 'react-router-dom';

interface UserProfile {
  uid: string;
  username: string;
  displayName: string;
  isAdmin: boolean;
  isVerified: boolean;
  photoURL?: string;
  vipStatus?: {
    isVip: boolean;
    expiresAt: string;
  };
}

interface Post {
  id: string;
  caption: string;
  imageUrl: string;
  authorId: string;
  author?: any;
}

interface Report {
  id: string;
  reporterId: string;
  reporterName: string;
  reportedId: string;
  messageId?: string;
  chatId?: string;
  postId?: string;
  content: string;
  reason: string;
  status: 'pending' | 'resolved';
  type: 'message' | 'post';
  createdAt: any;
}

export default function AdminTerminal() {
  const { profile, loading: authLoading, triggerQuotaExceeded } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'users' | 'posts' | 'reports'>('users');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  if (authLoading) return null;
  if (!profile?.isAdmin) return <Navigate to="/" />;

  useEffect(() => {
    setLoading(true);
    if (activeTab === 'users') {
      const q = query(collection(db, 'users'), limit(50));
      const unsub = onSnapshot(q, (snap) => {
        setUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() }) as UserProfile));
        setLoading(false);
      }, (err) => {
        console.error('Admin users snapshot listener error:', err);
        triggerQuotaExceeded();
        setLoading(false);
      });
      return unsub;
    } else if (activeTab === 'posts') {
      const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(50));
      const unsub = onSnapshot(q, (snap) => {
        setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Post));
        setLoading(false);
      }, (err) => {
        console.error('Admin posts snapshot listener error:', err);
        triggerQuotaExceeded();
        setLoading(false);
      });
      return unsub;
    } else {
      const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(50));
      const unsub = onSnapshot(q, (snap) => {
        setReports(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Report));
        setLoading(false);
      }, (err) => {
        console.error('Admin reports snapshot listener error:', err);
        triggerQuotaExceeded();
        setLoading(false);
      });
      return unsub;
    }
  }, [activeTab]);

  const handleToggleAdmin = async (user: UserProfile) => {
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        isAdmin: !user.isAdmin
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleVerify = async (user: UserProfile) => {
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        isVerified: !user.isVerified
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este post?')) return;
    try {
      await deleteDoc(doc(db, 'posts', postId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveReport = async (reportId: string) => {
    try {
      await updateDoc(doc(db, 'reports', reportId), {
        status: 'resolved'
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteReportAndContent = async (report: Report) => {
    if (!window.confirm('Deseja excluir o conteúdo denunciado e resolver a denúncia?')) return;
    try {
      if (report.type === 'message' && report.chatId && report.messageId) {
        await deleteDoc(doc(db, `chats/${report.chatId}/messages`, report.messageId));
      } else if (report.type === 'post' && report.postId) {
        await deleteDoc(doc(db, 'posts', report.postId));
      }
      await updateDoc(doc(db, 'reports', report.id), {
        status: 'resolved'
      });
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir conteúdo. Verifique as permissões.');
    }
  };

  const filteredUsers = users.filter(u => 
    u.username?.toLowerCase().includes(search.toLowerCase()) || 
    u.displayName?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateOfficialProfile = async () => {
    try {
      const officialUid = 'conectaldeia_official';
      const docRef = doc(db, 'users', officialUid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        alert('Perfil oficial já existe.');
        return;
      }

      await setDoc(docRef, {
        uid: officialUid,
        username: 'conectaldeiaofc',
        displayName: 'ConectAldeia Oficial',
        bio: 'Perfil oficial da maior rede de conexão indígena do Brasil. 🌿',
        photoURL: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=200&h=200&auto=format&fit=crop',
        isVerified: true,
        isAdmin: true,
        vipStatus: {
          isVip: true,
          expiresAt: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString()
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      alert('Perfil oficial @conectaldeiaofc criado com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao criar perfil oficial.');
    }
  };

  const handlePostTestReel = async () => {
    try {
      const userEmail = 'emersonsouza609e@gmail.com';
      const q = query(collection(db, 'users'), where('email', '==', userEmail), limit(1));
      const querySnapshot = await getDocs(q);
      
      let targetUid = profile?.uid;
      
      if (!querySnapshot.empty) {
        targetUid = querySnapshot.docs[0].id;
      }

      if (!targetUid) {
        alert('Não foi possível encontrar seu perfil para postar o Reel.');
        return;
      }

      await addDoc(collection(db, 'posts'), {
        authorId: targetUid,
        caption: 'Testando os Reels do ConectAldeias! 🌿📺 #PovosIndigenas #NatuzaNoFeed',
        imageUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', // Proxying a standard test video as "Natuza" placeholder
        type: 'video',
        likesCount: 0,
        commentsCount: 0,
        musicName: 'Ritual Ancestral - O Som da Mata',
        isArchived: false,
        createdAt: serverTimestamp(),
        author: {
          uid: targetUid,
          username: profile?.username || 'usuario',
          displayName: profile?.displayName || 'Usuário',
          photoURL: profile?.photoURL || ''
        }
      });
      alert('Reel de teste postado com sucesso! Verifique seu perfil ou a aba Reels.');
    } catch (err) {
      console.error(err);
      alert('Erro ao postar Reel de teste.');
    }
  };

  return (
    <div className="flex-1 px-4 py-8 md:px-8 pb-20">
      <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 text-urucum mb-2">
            <ShieldAlert className="h-6 w-6" />
            <span className="text-xs font-black uppercase tracking-[0.3em]">Cesto de Vigilância</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white italic">TERMINAL PAGÉ</h1>
          <p className="text-zinc-500 mt-1">Sabedoria e proteção para a nossa rede</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button 
              onClick={() => navigate('/promo')}
              className="flex items-center gap-2 bg-urucum px-4 py-2 rounded-xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-white hover:text-urucum transition-all shadow-lg shadow-urucum/30"
            >
              <PlayCircle className="h-4 w-4" /> Ver Trailer de Lançamento
            </button>
          </div>
        </div>

        <div className="flex bg-zinc-900/50 p-1 rounded-2xl border border-zinc-800">
          <button 
            onClick={() => setActiveTab('users')}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
              activeTab === 'users' ? "bg-urucum text-white shadow-lg shadow-urucum/20" : "text-zinc-500 hover:text-white"
            )}
          >
            <Users className="h-4 w-4" /> Usuários
          </button>
          <button 
            onClick={() => setActiveTab('posts')}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
              activeTab === 'posts' ? "bg-urucum text-white shadow-lg shadow-urucum/20" : "text-zinc-500 hover:text-white"
            )}
          >
            <FileText className="h-4 w-4" /> Posts
          </button>
          <button 
            onClick={() => setActiveTab('reports')}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
              activeTab === 'reports' ? "bg-urucum text-white shadow-lg shadow-urucum/20" : "text-zinc-500 hover:text-white"
            )}
          >
            <Flag className="h-4 w-4" /> Denúncias
          </button>
        </div>
      </header>

      <div className="mb-8 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-600" />
        <input 
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={activeTab === 'users' ? "Buscar por username ou nome..." : "Filtro de conteúdo..."}
          className="w-full bg-zinc-900/30 border border-urucum/10 rounded-2xl py-4 pl-12 pr-6 text-white outline-none focus:ring-1 focus:ring-urucum/50 transition-all"
        />
      </div>

      <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl overflow-hidden backdrop-blur-sm">
        {activeTab === 'users' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              {/* ... Users Table Header ... */}
              <thead>
                <tr className="border-bottom border-zinc-800 bg-zinc-900/50">
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-zinc-500">Usuário</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-zinc-500">Privilégios</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-zinc-500">VIP Status</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-zinc-500">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {filteredUsers.map((user) => (
                  <tr key={user.uid} className="hover:bg-zinc-800/20 transition-colors">
                    {/* ... User Row ... */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full overflow-hidden border border-zinc-800">
                          <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.username}`} className="h-full w-full object-cover" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white leading-none mb-1">{user.displayName}</p>
                          <p className="text-xs text-zinc-500 italic">@{user.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {user.isAdmin && <span className="bg-urucum/10 text-urucum text-[10px] font-black px-2 py-1 rounded uppercase tracking-tighter border border-urucum/20">Pagé Admin</span>}
                        {user.isVerified && <span className="bg-blue-500/10 text-blue-500 text-[10px] font-black px-2 py-1 rounded uppercase tracking-tighter border border-blue-500/20">Verificado</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {user.vipStatus?.isVip ? (
                        <div className="flex items-center gap-1.5 text-amber-500">
                          <Crown className="h-3.5 w-3.5" />
                          <span className="text-xs font-bold">Ativo</span>
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-600 font-bold">Nenhum</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleToggleAdmin(user)}
                          className={cn(
                            "px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all",
                            user.isAdmin ? "bg-zinc-800 text-zinc-400" : "bg-urucum/10 text-urucum border border-urucum/20"
                          )}
                        >
                          {user.isAdmin ? 'Revogar Pagé' : 'Dar Pagé'}
                        </button>
                        <button 
                          onClick={() => handleToggleVerify(user)}
                          className={cn(
                            "px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all",
                            user.isVerified ? "bg-zinc-800 text-zinc-400" : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                          )}
                        >
                          {user.isVerified ? 'Tirar Selo' : 'Dar Selo'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'posts' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {/* ... Posts Grid ... */}
            {posts.map((post) => (
              <div key={post.id} className="group relative aspect-square rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950">
                <img src={post.imageUrl} className="h-full w-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-4 flex flex-col justify-end">
                   <p className="text-xs text-zinc-400 line-clamp-2 mb-2">{post.caption}</p>
                   <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">ID: {post.id.slice(0, 8)}...</span>
                      <button 
                        onClick={() => handleDeletePost(post.id)}
                        className="bg-urucum p-2 rounded-xl text-white shadow-lg shadow-urucum/30 hover:scale-110 transition-transform"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                   </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-bottom border-zinc-800 bg-zinc-900/50">
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-zinc-500">Denunciado por</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-zinc-500">Conteúdo Denunciado</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-zinc-500">Motivo</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-zinc-500">Status</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-zinc-500">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {reports.map((report) => (
                  <tr key={report.id} className={cn("hover:bg-zinc-800/20 transition-colors", report.status === 'resolved' && "opacity-50")}>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-white">{report.reporterName}</p>
                      <p className="text-[10px] text-zinc-500">{report.type === 'message' ? 'Mensagem' : 'Post'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-zinc-300 max-w-xs truncate">{report.content}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-red-400 font-medium">{report.reason}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded",
                        report.status === 'pending' ? "bg-amber-500/10 text-amber-500" : "bg-green-500/10 text-green-500"
                      )}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {report.status === 'pending' && (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleResolveReport(report.id)}
                            className="bg-zinc-800 hover:bg-zinc-700 text-white p-2 rounded-xl transition-colors"
                            title="Marcar como resolvido"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteReportAndContent(report)}
                            className="bg-red-500 hover:bg-red-400 text-white p-2 rounded-xl transition-colors"
                            title="Excluir conteúdo perigoso"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
