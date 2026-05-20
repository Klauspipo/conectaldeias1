import React, { useState, useEffect } from 'react';
import { query, collection, getDocs, where, limit, getDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Search, UserPlus, Loader2, User as UserIcon, Heart, MessageCircle, Compass, Grid, Users, Eye, Play, Sparkles, Flame, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

interface UserData {
  id: string;
  uid: string;
  username: string;
  displayName: string;
  photoURL?: string;
  vipStatus?: {
    isVip: boolean;
    activeFrame?: string;
  };
}

interface Post {
  id: string;
  authorId: string;
  caption: string;
  imageUrl: string;
  likesCount: number;
  commentsCount?: number;
  type?: 'image' | 'video';
  createdAt: any;
  author?: UserData;
}

export default function Discover() {
  const { profile: myProfile, triggerQuotaExceeded } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'posts' | 'people'>('all');
  const [users, setUsers] = useState<UserData[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // Suggested tags to browse
  const SUGGESTED_TAGS = ['Tudo', 'Originários', 'Músicas', 'Arte & Dança', 'Eventos', 'Toré', 'Parcerias'];
  const [selectedTag, setSelectedTag] = useState('Tudo');

  useEffect(() => {
    const fetchExploreData = async () => {
      setLoading(true);
      try {
        // Fetch users
        const usersQ = query(collection(db, 'users'), limit(15));
        const usersSnap = await getDocs(usersQ);
        const mappedUsers = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }) as UserData);
        setUsers(mappedUsers.filter(u => u.username !== myProfile?.username));

        // Fetch posts
        const postsQ = query(collection(db, 'posts'), limit(24));
        const postsSnap = await getDocs(postsQ);
        const postsList = postsSnap.docs.map(d => ({ id: d.id, ...d.data() }) as Post);

        // Resolve author info for each post
        const postsWithAuthors = await Promise.all(
          postsList.map(async (post) => {
            let authorInfo = mappedUsers.find(u => u.uid === post.authorId);
            if (!authorInfo && post.authorId) {
              try {
                const authorDoc = await getDoc(doc(db, 'users', post.authorId));
                if (authorDoc.exists()) {
                  authorInfo = { id: authorDoc.id, ...authorDoc.data() } as UserData;
                }
              } catch (e) {
                console.error('Error fetching author for discover post:', e);
              }
            }
            return {
              ...post,
              author: authorInfo
            };
          })
        );
        setPosts(postsWithAuthors);
      } catch (err) {
        console.error(err);
        triggerQuotaExceeded();
      } finally {
        setLoading(false);
      }
    };

    if (searchTerm === '') {
      fetchExploreData();
    }
  }, [searchTerm, myProfile, triggerQuotaExceeded]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    try {
      const searchTermLower = searchTerm.toLowerCase();
      // Search users
      const q = query(
        collection(db, 'users'), 
        where('username', '>=', searchTermLower),
        where('username', '<=', searchTermLower + '\uf8ff'),
        limit(15)
      );
      const snap = await getDocs(q);
      const searchUsers = snap.docs.map(d => ({ id: d.id, ...d.data() }) as UserData).filter(u => u.username !== myProfile?.username);
      setUsers(searchUsers);

      // Simple keyword matching helper on posts captions
      const postsQ = query(collection(db, 'posts'), limit(30));
      const postsSnap = await getDocs(postsQ);
      const allPosts = postsSnap.docs.map(d => ({ id: d.id, ...d.data() }) as Post);
      
      const filteredPosts = allPosts.filter(post => 
        post.caption?.toLowerCase().includes(searchTermLower)
      );

      const postsWithAuthors = await Promise.all(
        filteredPosts.map(async (post) => {
          let authorInfo = searchUsers.find(u => u.uid === post.authorId);
          if (!authorInfo && post.authorId) {
            try {
              const authorDoc = await getDoc(doc(db, 'users', post.authorId));
              if (authorDoc.exists()) {
                authorInfo = { id: authorDoc.id, ...authorDoc.data() } as UserData;
              }
            } catch (e) {
              // fallback
            }
          }
          return { ...post, author: authorInfo };
        })
      );
      setPosts(postsWithAuthors);
    } catch (err) {
      console.error(err);
      triggerQuotaExceeded();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 px-4 py-6 md:px-8 pb-24 max-w-7xl mx-auto">
      {/* Header & Search */}
      <header className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Compass className="h-6 w-6 text-urucum animate-pulse" />
            <h1 className="text-2xl font-black uppercase tracking-widest text-white">Descobrir</h1>
          </div>
        </div>

        {/* Instagram Pill Search Box */}
        <form onSubmit={handleSearch} className="relative group mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 transition-colors group-focus-within:text-urucum" />
          <input 
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por contas originárias, aldeias ou palavras-chave..."
            className="w-full rounded-full bg-zinc-900 border border-zinc-800/80 px-12 py-3.5 text-xs text-white outline-none focus:ring-1 focus:ring-urucum placeholder-zinc-500 shadow-lg tracking-wider transition-all"
          />
        </form>

        {/* Categories tags slider */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
          {SUGGESTED_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={cn(
                "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all shrink-0 select-none",
                selectedTag === tag 
                  ? "bg-urucum border-urucum text-white shadow-lg shadow-urucum/10" 
                  : "bg-zinc-900/60 border-zinc-850 text-zinc-400 hover:text-white hover:bg-zinc-900"
              )}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Nav Tabs like instagram explore vs people */}
        <div className="flex border-b border-zinc-850 mt-6">
          <button
            onClick={() => setActiveTab('all')}
            className={cn(
              "flex-1 pb-3 text-2xs font-black uppercase tracking-widest transition-all border-b-2 flex items-center justify-center gap-2",
              activeTab === 'all' ? "border-urucum text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"
            )}
          >
            <Compass className="h-4.5 w-4.5" />
            <span>Ver Tudo</span>
          </button>
          <button
            onClick={() => setActiveTab('posts')}
            className={cn(
              "flex-1 pb-3 text-2xs font-black uppercase tracking-widest transition-all border-b-2 flex items-center justify-center gap-2",
              activeTab === 'posts' ? "border-urucum text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"
            )}
          >
            <Grid className="h-4.5 w-4.5" />
            <span>Publicações</span>
          </button>
          <button
            onClick={() => setActiveTab('people')}
            className={cn(
              "flex-1 pb-3 text-2xs font-black uppercase tracking-widest transition-all border-b-2 flex items-center justify-center gap-2",
              activeTab === 'people' ? "border-urucum text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"
            )}
          >
            <Users className="h-4.5 w-4.5" />
            <span>Contas</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-urucum" />
        </div>
      ) : (
        <div className="space-y-10">
          
          {/* Section: Recommended Creators Slider (Visible in All or People) */}
          {(activeTab === 'all' || activeTab === 'people') && users.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Flame className="h-3.5 w-3.5 text-urucum" /> Sugestões para você seguir
                </h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {users.map((user) => (
                  <div 
                    key={user.id}
                    className="bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-850/80 rounded-2xl p-4 flex flex-col items-center justify-between text-center transition-all relative group"
                  >
                    {/* VIP highlight badge */}
                    {user.vipStatus?.isVip && (
                      <span className="absolute top-2.5 right-2.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded">
                        VIP
                      </span>
                    )}

                    <Link to={`/u/${user.username}`} className="flex flex-col items-center select-none cursor-pointer">
                      <div className="h-16 w-16 mb-3 rounded-full overflow-hidden border-2 border-zinc-800 scale-100 group-hover:scale-105 transition-transform duration-300">
                        {user.photoURL ? (
                          <img src={user.photoURL} alt={user.username} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-zinc-800 text-zinc-600">
                            <UserIcon className="h-8 w-8" />
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-black text-white hover:text-urucum transition-colors truncate max-w-[120px] leading-tight flex items-center gap-1">
                        {user.displayName}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-bold truncate max-w-[120px]">@{user.username}</span>
                    </Link>

                    <Link 
                      to={`/u/${user.username}`}
                      className="mt-4 w-full text-center py-2 bg-zinc-800 hover:bg-urucum hover:text-white text-zinc-300 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all"
                    >
                      Ver Perfil
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Section: Instagram Masonry/Explore Grid (Visible in All or Posts) */}
          {(activeTab === 'all' || activeTab === 'posts') && (
            <section className="space-y-4">
              {activeTab === 'all' && (
                <div className="flex items-center justify-between pt-4 border-t border-zinc-900">
                  <h2 className="text-xs font-black uppercase tracking-wider text-zinc-400">Conteúdo em Destaque</h2>
                </div>
              )}
              
              {posts.length > 0 ? (
                <div className="grid grid-cols-3 gap-1 md:gap-3">
                  {posts.map((post, idx) => {
                    // Instagram Explore grid layout usually has some items spans
                    const isFeatureItem = idx === 4 || idx === 13;
                    return (
                      <div 
                        key={post.id}
                        onClick={() => setSelectedPost(post)}
                        className={cn(
                          "relative aspect-square overflow-hidden bg-zinc-900 group cursor-pointer transition-all border border-zinc-950/20 rounded",
                          isFeatureItem && "col-span-1 row-span-1 md:col-span-2 md:row-span-2 md:aspect-auto md:h-full min-h-[180px]"
                        )}
                      >
                        {post.type === 'video' ? (
                          <div className="w-full h-full relative">
                            <video src={post.imageUrl} muted loop className="w-full h-full object-cover" />
                            <div className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white pointer-events-none">
                              <Play className="h-3 w-3 fill-white" />
                            </div>
                          </div>
                        ) : (
                          <img src={post.imageUrl} alt={post.caption} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        )}

                        {/* Interactive overlay on hover like Instagram */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-5 text-white">
                          <div className="flex items-center gap-1.5 font-black text-xs md:text-sm">
                            <Heart className="h-4 w-4 md:h-5 md:w-5 fill-white" />
                            <span>{post.likesCount || 0}</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-black text-xs md:text-sm">
                            <MessageCircle className="h-4 w-4 md:h-5 md:w-5 fill-white" />
                            <span>{post.commentsCount || 0}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-16 text-center bg-zinc-900/20 border border-zinc-900 rounded-3xl">
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Nenhuma publicação encontrada para sua busca.</p>
                </div>
              )}
            </section>
          )}

        </div>
      )}

      {/* Instagram Explore Grid Detail Post Popup Lightbox Modal */}
      <AnimatePresence>
        {selectedPost && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-950 border border-zinc-900 rounded-3xl overflow-hidden w-full max-w-4xl max-h-[90vh] flex flex-col md:flex-row shadow-2xl relative"
            >
              <button 
                onClick={() => setSelectedPost(null)}
                className="absolute top-3 right-3 z-[160] p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors font-black text-sm"
              >
                ✕
              </button>

              {/* Left Side: Media content */}
              <div className="flex-1 bg-black flex items-center justify-center relative min-h-[300px] max-h-[45vh] md:max-h-full">
                {selectedPost.type === 'video' ? (
                  <video src={selectedPost.imageUrl} controls autoPlay loop className="w-full max-h-full object-contain" />
                ) : (
                  <img src={selectedPost.imageUrl} alt="post media" className="w-full max-h-full object-contain" />
                )}
              </div>

              {/* Right Side: Info / Instagram Styled Details */}
              <div className="w-full md:w-[380px] border-t md:border-t-0 md:border-l border-zinc-900 p-6 flex flex-col justify-between bg-zinc-950">
                <div>
                  {/* Author Header */}
                  <div className="flex items-center gap-3 border-b border-zinc-900 pb-4 mb-4">
                    <div className="h-9 w-9 rounded-full overflow-hidden border border-zinc-800">
                      {selectedPost.author?.photoURL ? (
                        <img src={selectedPost.author.photoURL} alt={selectedPost.author.username} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-zinc-800 text-zinc-600">
                          <UserIcon className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white hover:text-urucum transition-all">
                        <Link to={`/u/${selectedPost.author?.username}`} onClick={() => setSelectedPost(null)}>
                          {selectedPost.author?.displayName || 'Originário'}
                        </Link>
                      </h4>
                      <p className="text-[10px] text-zinc-500">@{selectedPost.author?.username || 'parceiro'}</p>
                    </div>
                  </div>

                  {/* Caption */}
                  <div className="text-xs text-zinc-300 leading-relaxed max-h-[180px] overflow-y-auto no-scrollbar">
                    <span className="font-bold text-white mr-2">@{selectedPost.author?.username || 'parceiro'}</span>
                    {selectedPost.caption}
                  </div>
                </div>

                {/* Footer details */}
                <div className="pt-4 border-t border-zinc-900 mt-4 space-y-4">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Heart className="h-4.5 w-4.5 text-urucum fill-urucum" /> {selectedPost.likesCount || 0} curtidas
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-4.5 w-4.5 text-zinc-500" /> {selectedPost.commentsCount || 0} comentários
                    </span>
                  </div>

                  <div className="flex gap-2.5">
                    <button 
                      onClick={() => {
                        navigate(`/u/${selectedPost.author?.username}`);
                        setSelectedPost(null);
                      }}
                      className="flex-1 py-3 bg-urucum hover:bg-red-700 text-white font-black uppercase text-[10px] tracking-widest rounded-xl transition-all text-center"
                    >
                      Ver Perfil
                    </button>
                    <button 
                      onClick={() => {
                        navigate(`/`);
                        setSelectedPost(null);
                      }}
                      className="px-4 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 text-zinc-300 font-extrabold uppercase text-[10px] tracking-widest rounded-xl transition-all"
                    >
                      Ir ao Feed
                    </button>
                  </div>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
