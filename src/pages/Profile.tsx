import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, Grid, Bookmark, MessageSquare, UserPlus, UserMinus, 
  Loader2, Camera, LogOut, Check, Heart, BadgeCheck, ShieldAlert, 
  Crown, Upload, PlusSquare, Menu, Lock, Unlock, Archive, UserX, 
  ShieldCheck, X, EyeOff, PlayCircle, QrCode, History, Star, 
  CreditCard, HelpCircle, Info, AtSign, Users2, Music, Trash2, Volume2, VolumeX
} from 'lucide-react';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, setDoc, deleteDoc, serverTimestamp, addDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, auth, signOut } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { cn, fileToBase64 } from '../lib/utils';
import ImageCropper from '../components/ImageCropper';
import { POPULAR_SONGS, Song } from '../data/songs';

export default function Profile() {
  const { username } = useParams();
  const { user: currentUser, profile: myProfile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [newPostData, setNewPostData] = useState({ imageUrl: '', caption: '', type: 'image' });
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropTarget, setCropTarget] = useState<'avatar' | 'post' | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [editData, setEditData] = useState({ 
    displayName: '', 
    bio: '', 
    photoURL: '',
    usernameStyle: 'default' as 'default' | 'neon' | 'neon-8bit' | 'steampunk',
    profileAnimation: 'none' as 'none' | 'rainbow' | 'pulse',
    bannerStyle: 'none' as any
  });
  const [showSettings, setShowSettings] = useState(false);
  const [view, setView] = useState<'posts' | 'reels' | 'archived' | 'saved' | 'blocked'>('posts');
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [isBlockedByMe, setIsBlockedByMe] = useState(false);

  const isMyProfile = !username || username === myProfile?.username;
  const isAdmin = myProfile?.isAdmin;

  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [profileAudio, setProfileAudio] = useState<HTMLAudioElement | null>(null);
  const [showSongSelector, setShowSongSelector] = useState(false);

  useEffect(() => {
    return () => {
      if (profileAudio) {
        profileAudio.pause();
      }
    };
  }, [profileAudio]);

  const handleSelectProfileSong = async (songId: string | null) => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        profileSongId: songId || '',
        updatedAt: serverTimestamp(),
      });
      if (profileAudio) {
        profileAudio.pause();
        setIsPlayingMusic(false);
      }
      setProfile({ ...profile, profileSongId: songId || '' });
      await refreshProfile();
      setShowSongSelector(false);
    } catch (err) {
      console.error('Error updating profile song:', err);
    }
  };

  const handleToggleProfileMusic = (song: Song) => {
    if (profileAudio) {
      profileAudio.pause();
      if (isPlayingMusic) {
        setIsPlayingMusic(false);
        return;
      }
    }

    const audio = new Audio(song.audioUrl);
    audio.loop = true;
    audio.play();
    setProfileAudio(audio);
    setIsPlayingMusic(true);
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      try {
        let profileData = null;
        if (isMyProfile) {
          profileData = myProfile;
        } else {
          const q = query(collection(db, 'users'), where('username', '==', username));
          const snap = await getDocs(q);
          if (!snap.empty) {
            profileData = { id: snap.docs[0].id, ...snap.docs[0].data() };
          }
        }

        if (profileData) {
          setProfile(profileData);
          setEditData({
            displayName: profileData.displayName,
            bio: profileData.bio || '',
            photoURL: profileData.photoURL || '',
            usernameStyle: profileData.usernameStyle || 'default',
            profileAnimation: profileData.profileAnimation || 'none',
            bannerStyle: profileData.bannerStyle || 'none',
          });

          // Fetch posts
          const profileId = profileData.uid || profileData.id;
          
          // Check if blocked
          if (currentUser && !isMyProfile) {
            const myBlocked = myProfile?.blockedUsers || [];
            setIsBlockedByMe(myBlocked.includes(profileId));

            const theirBlocked = profileData.blockedUsers || [];
            if (theirBlocked.includes(currentUser.uid)) {
              setProfile({ ...profileData, isBlockedByYou: true });
              setLoading(false);
              return;
            }
          }

          // Fetch posts (only non-archived if not my profile)
          const postsQ = isMyProfile 
            ? query(collection(db, 'posts'), where('authorId', '==', profileId))
            : query(collection(db, 'posts'), where('authorId', '==', profileId), where('isArchived', '!=', true));
          
          const postsSnap = await getDocs(postsQ);
          setPosts(postsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

          // Check following
          if (currentUser && !isMyProfile) {
            const followId = `${currentUser.uid}_${profileId}`;
            const followSnap = await getDoc(doc(db, 'follows', followId));
            setIsFollowing(followSnap.exists());
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [username, isMyProfile, myProfile, currentUser]);

  const handleFollow = async () => {
    if (!currentUser || !profile) return;
    const profileId = profile.uid || profile.id;
    const followId = `${currentUser.uid}_${profileId}`;
    
    try {
      if (isFollowing) {
        await deleteDoc(doc(db, 'follows', followId));
        setIsFollowing(false);
      } else {
        await setDoc(doc(db, 'follows', followId), {
          followerId: currentUser.uid,
          followingId: profileId,
          createdAt: serverTimestamp(),
        });
        setIsFollowing(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCropTarget('avatar');
      setShowCropModal(true);
      e.target.value = '';
    }
  };

  const handlePostFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const type = file.type.startsWith('video/') ? 'video' : 'image';
      if (type === 'image') {
        setCropTarget('post');
        setShowCropModal(true);
        e.target.value = '';
      } else {
        try {
          const base64 = await fileToBase64(file);
          setNewPostData({ ...newPostData, imageUrl: base64, type });
        } catch (err) {
          console.error('Error converting post file to base64:', err);
        }
      }
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newPostData.imageUrl || isPosting) return;

    setIsPosting(true);
    try {
      const postRef = await addDoc(collection(db, 'posts'), {
        caption: newPostData.caption,
        imageUrl: newPostData.imageUrl,
        type: newPostData.type,
        authorId: currentUser.uid,
        likesCount: 0,
        createdAt: serverTimestamp(),
      });

      setPosts([{ id: postRef.id, ...newPostData, authorId: currentUser.uid, likesCount: 0, createdAt: new Date() }, ...posts]);
      setNewPostData({ imageUrl: '', caption: '', type: 'image' });
      setIsCreatingPost(false);
    } catch (err) {
      console.error('Error creating post:', err);
    } finally {
      setIsPosting(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        displayName: editData.displayName,
        bio: editData.bio,
        photoURL: editData.photoURL,
        usernameStyle: editData.usernameStyle,
        profileAnimation: editData.profileAnimation,
        bannerStyle: editData.bannerStyle,
        updatedAt: serverTimestamp(),
      });
      await refreshProfile();
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleVerify = async () => {
    if (!isAdmin || !profile) return;
    const profileId = profile.uid || profile.id;
    try {
      await updateDoc(doc(db, 'users', profileId), {
        isVerified: !profile.isVerified,
        updatedAt: serverTimestamp(),
      });
      setProfile({ ...profile, isVerified: !profile.isVerified });
    } catch (err) {
      console.error('Error toggling verification:', err);
    }
  };

  const handleToggleAdmin = async () => {
    if (!isAdmin || !profile) return;
    const profileId = profile.uid || profile.id;
    try {
      await updateDoc(doc(db, 'users', profileId), {
        isAdmin: !profile.isAdmin,
        updatedAt: serverTimestamp(),
      });
      setProfile({ ...profile, isAdmin: !profile.isAdmin });
    } catch (err) {
      console.error('Error toggling admin:', err);
    }
  };

  const handleTogglePrivacy = async () => {
    if (!currentUser || !myProfile) return;
    try {
      const newStatus = !myProfile.isPrivate;
      await updateDoc(doc(db, 'users', currentUser.uid), {
        isPrivate: newStatus,
        updatedAt: serverTimestamp()
      });
      await refreshProfile();
    } catch (err) {
      console.error(err);
    }
  };

  const handleArchivePost = async (postId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'posts', postId), {
        isArchived: !currentStatus
      });
      setPosts(posts.map(p => p.id === postId ? { ...p, isArchived: !currentStatus } : p));
    } catch (err) {
      console.error(err);
    }
  };

  const handleBlockUser = async () => {
    if (!currentUser || !profile || isMyProfile) return;
    const profileId = profile.uid || profile.id;
    
    try {
      if (isBlockedByMe) {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          blockedUsers: arrayRemove(profileId)
        });
        setIsBlockedByMe(false);
      } else {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          blockedUsers: arrayUnion(profileId)
        });
        setIsBlockedByMe(true);
        setIsFollowing(false);
        // Also remove follow if exists
        const followId = `${currentUser.uid}_${profileId}`;
        await deleteDoc(doc(db, 'follows', followId));
      }
      await refreshProfile();
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBlockedUsers = async () => {
    if (!myProfile?.blockedUsers?.length) {
      setBlockedUsers([]);
      return;
    }
    try {
      const q = query(collection(db, 'users'), where('uid', 'in', myProfile.blockedUsers));
      const snap = await getDocs(q);
      setBlockedUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (view === 'blocked' && isMyProfile) {
      fetchBlockedUsers();
    }
  }, [view, myProfile]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-700" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Usuário não encontrado</h2>
        <p className="text-zinc-500 mb-6">O link que você seguiu pode estar quebrado ou a página pode ter sido removida.</p>
        <button onClick={() => navigate('/')} className="text-indigo-500 font-semibold">Voltar para o Feed</button>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen bg-zinc-950 overflow-hidden relative">
      {/* Profile Banner */}
      <div className={cn(
        "h-32 md:h-48 w-full bg-zinc-900 absolute top-0 left-0 transition-all z-0",
        profile.bannerStyle === 'christmas' && "banner-christmas",
        profile.bannerStyle === 'easter' && "banner-easter",
        profile.bannerStyle === 'junina' && "banner-junina",
        profile.bannerStyle === '8bit' && "banner-8bit",
        profile.bannerStyle === 'retro' && "banner-retro"
      )}>
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent" />
      </div>

      <div className="px-4 py-8 md:px-8 pb-20 relative z-10 pt-16 md:pt-24">
      {/* Profile Effect */}
      {profile.vipStatus?.isVip && profile.vipStatus?.activeEffect && (
        <div className="absolute inset-0 pointer-events-none z-0 opacity-30 overflow-hidden">
          <img src={profile.vipStatus.activeEffect} alt="Effect" className="h-full w-full object-cover animate-pulse" />
        </div>
      )}

      {/* Admin Panel (if applicable) */}
      {isAdmin && !isMyProfile && (
        <div className="mb-10 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
             <ShieldAlert className="text-red-400 h-5 w-5" />
             <span className="text-red-400 text-sm font-bold uppercase tracking-wider">Painel Admin</span>
          </div>
          <div className="flex gap-2">
             <button 
               onClick={handleToggleVerify}
               className="rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-zinc-800"
             >
               {profile.isVerified ? 'Remover Verificado' : 'Conceder Verificado'}
             </button>
             <button 
               onClick={handleToggleAdmin}
               className="rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-zinc-800"
             >
               {profile.isAdmin ? 'Remover Admin' : 'Conceder Admin'}
             </button>
          </div>
        </div>
      )}

      {/* Header / Basic Info */}
      <div className="mb-10 flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12 relative z-10">
        <div className="flex flex-col items-center shrink-0">
          <div className="relative group shrink-0">
            <div className={cn(
              "h-24 w-24 md:h-40 md:w-40 rounded-full border-4 border-zinc-900 bg-zinc-900 shadow-xl relative transition-all",
              "overflow-hidden",
              profile.vipStatus?.isVip && profile.profileAnimation === 'rainbow' && "vip-border-animate p-1 border-none",
              profile.vipStatus?.isVip && profile.profileAnimation === 'pulse' && "animate-pulse ring-4 ring-urucum/30"
            )}>
              <div className="h-full w-full rounded-full overflow-hidden relative z-0">
                 {profile.photoURL ? (
                   <img src={profile.photoURL} alt={profile.username} className="h-full w-full object-cover" />
                 ) : (
                   <div className="flex h-full w-full items-center justify-center bg-zinc-800 text-3xl font-bold text-zinc-600">
                     {profile.displayName?.[0] || 'U'}
                   </div>
                 )}
              </div>
              
              {/* VIP Frame */}
              {profile.vipStatus?.isVip && profile.vipStatus?.activeFrame && (
                <img src={profile.vipStatus.activeFrame} alt="Frame" className="absolute inset-0 h-full w-full object-contain scale-125 pointer-events-none z-10" />
              )}
            </div>
            {isMyProfile && (
              <button 
                onClick={() => setIsEditing(true)}
                className="absolute bottom-1 right-1 rounded-full bg-urucum p-2 text-white shadow-lg md:bottom-2 md:right-2 z-30"
              >
                <Camera className="h-4 w-4 md:h-5 md:w-5" />
              </button>
            )}
          </div>

          {/* Profile Music widget underneath the profile avatar image */}
          {(() => {
            const activeProfileSong = profile.profileSongId ? POPULAR_SONGS.find(s => s.id === profile.profileSongId) : null;
            if (activeProfileSong) {
              return (
                <div className="mt-4 w-44 bg-zinc-900/90 backdrop-blur border border-zinc-800 rounded-xl px-3 py-2 flex flex-col items-center gap-1.5 shadow-lg relative shrink-0">
                  <div className="flex items-center gap-2 w-full justify-between">
                    <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
                      <Music className={cn("h-3.5 w-3.5 text-urucum shrink-0", isPlayingMusic && "animate-spin")} style={{ animationDuration: '4s' }} />
                      <div className="truncate text-left">
                        <p className="text-[10px] font-black uppercase text-white tracking-widest leading-none truncate">{activeProfileSong.title}</p>
                        <p className="text-[8px] text-zinc-500 font-bold tracking-tight truncate leading-none mt-0.5">{activeProfileSong.artist}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleToggleProfileMusic(activeProfileSong)}
                      className="text-[9px] bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-1.5 py-0.5 rounded font-black uppercase tracking-wider scale-95 shrink-0"
                    >
                      {isPlayingMusic ? 'Parar' : 'Tocar'}
                    </button>
                  </div>
                  {isMyProfile && (
                    <button 
                      onClick={() => handleSelectProfileSong(null)}
                      className="w-full text-center text-[8px] font-bold text-red-500/80 hover:text-red-500 uppercase tracking-widest border-t border-zinc-850 pt-1 mt-0.5"
                    >
                      Remover Música
                    </button>
                  )}
                </div>
              );
            } else if (isMyProfile) {
              return (
                <button 
                  onClick={() => setShowSongSelector(true)}
                  className="mt-4 text-[10px] px-3 py-1.5 bg-zinc-900 border border-zinc-800/80 rounded-lg text-zinc-400 hover:text-white hover:border-zinc-700 font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all w-44"
                >
                  <Music className="h-3 w-3 text-urucum" />
                  Música de Perfil
                </button>
              );
            }
            return null;
          })()}
        </div>

        <div className="flex-1 text-center md:text-left space-y-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex items-center gap-2">
              <h1 className={cn(
                "text-2xl font-bold text-white",
                profile.usernameStyle === 'neon' && "username-neon",
                profile.usernameStyle === 'neon-8bit' && "username-8bit",
                profile.usernameStyle === 'steampunk' && "username-steampunk"
              )}>
                {profile.username}
              </h1>
              <div className="flex items-center gap-1">
                {profile.isVerified && <BadgeCheck className="h-6 w-6 text-blue-400 fill-blue-400/10" />}
                {profile.vipStatus?.isVip && <Crown className="h-6 w-6 text-amber-500 fill-amber-500/10" />}
              </div>
            </div>
            <div className="flex gap-2">
              {isMyProfile ? (
                 <>
                   <motion.button 
                     whileHover={{ scale: 1.05 }}
                     whileTap={{ scale: 0.95 }}
                     onClick={() => setIsCreatingPost(!isCreatingPost)}
                     className="rounded-lg bg-urucum px-4 py-1.5 text-sm font-semibold text-white shadow-lg shadow-urucum/20 hover:bg-red-700 transition-all border border-urucum/50"
                   >
                     {isCreatingPost ? 'Cancelar' : 'Novo Post'}
                   </motion.button>
                   <motion.button 
                     whileTap={{ rotate: 90 }}
                     onClick={() => setShowSettings(true)}
                     className="rounded-lg bg-zinc-900 p-2 text-zinc-200 transition-all hover:bg-zinc-800 border border-zinc-800"
                   >
                     <Menu className="h-5 w-5" />
                   </motion.button>
                 </>
              ) : (
                <>
                  {!isBlockedByMe && (
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleFollow}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-6 py-1.5 text-sm font-semibold transition-all shadow-lg",
                        isFollowing 
                          ? "bg-zinc-900 border border-zinc-800 text-zinc-200" 
                          : "bg-urucum border border-urucum/50 text-white shadow-urucum/20"
                      )}
                    >
                      {isFollowing ? <><UserMinus className="h-4 w-4" /> Seguindo</> : <><UserPlus className="h-4 w-4" /> Seguir</>}
                    </motion.button>
                  )}
                  <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={() => navigate(`/messages?chatWith=${profile.uid || profile.id}`)}
                    className="rounded-lg bg-zinc-900 p-2 text-zinc-200 hover:bg-zinc-800 border border-zinc-800 transition-colors"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </motion.button>
                  <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={handleBlockUser}
                    className={cn(
                      "rounded-lg p-2 transition-colors border",
                      isBlockedByMe ? "bg-red-500/10 border-red-500/50 text-red-500" : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-red-400"
                    )}
                    title={isBlockedByMe ? "Desbloquear" : "Bloquear"}
                  >
                    <UserX className="h-4 w-4" />
                  </motion.button>
                </>
              )}
            </div>
          </div>

          <div className="flex justify-center md:justify-start gap-8 font-medium">
            <div className="text-center md:text-left">
              <span className="block text-lg text-white">{posts.length}</span>
              <span className="text-xs text-zinc-500 uppercase tracking-wider">Posts</span>
            </div>
            <div className="text-center md:text-left">
              <span className="block text-lg text-white">{profile.followersCount || 0}</span>
              <span className="text-xs text-zinc-500 uppercase tracking-wider">Seguidores</span>
            </div>
            <div className="text-center md:text-left">
              <span className="block text-lg text-white">{profile.followingCount || 0}</span>
              <span className="text-xs text-zinc-500 uppercase tracking-wider">Seguindo</span>
            </div>
          </div>

          <div>
            <h2 className="font-bold text-white">{profile.displayName}</h2>
            <p className="text-sm text-zinc-400 whitespace-pre-wrap">{profile.bio || 'Sem biografia.'}</p>
          </div>
        </div>
      </div>

      {isCreatingPost && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-10 rounded-2xl border border-urucum/30 bg-urucum/5 p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-full bg-urucum flex items-center justify-center text-white">
               <PlusSquare className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Criar Publicação</h3>
              <p className="text-zinc-500 text-xs uppercase tracking-widest">Compartilhe um momento em seu perfil</p>
            </div>
          </div>
          
          <form onSubmit={handleCreatePost} className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                   <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Mídia (Foto ou Vídeo)</label>
                      <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-zinc-800 rounded-2xl cursor-pointer hover:bg-zinc-900/50 hover:border-indigo-500/50 transition-all group">
                         {newPostData.imageUrl ? (
                           <div className="relative h-full w-full p-2">
                             {newPostData.type === 'video' ? (
                               <video src={newPostData.imageUrl} className="h-full w-full object-cover rounded-xl" />
                             ) : (
                               <img src={newPostData.imageUrl} className="h-full w-full object-cover rounded-xl" />
                             )}
                             <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                               <p className="text-white text-xs font-bold">TROCAR MÍDIA</p>
                             </div>
                           </div>
                         ) : (
                           <div className="flex flex-col items-center justify-center py-6">
                              <Upload className="h-8 w-8 text-zinc-600 mb-2 group-hover:text-indigo-400" />
                              <p className="text-sm text-zinc-500 group-hover:text-zinc-400">Clique para selecionar</p>
                              <p className="text-[10px] text-zinc-600 mt-1 uppercase tracking-tighter">JPG, PNG, MP4 (Máx. 1MB)</p>
                           </div>
                         )}
                         <input type="file" className="hidden" accept="image/*,video/*" onChange={handlePostFileChange} />
                      </label>
                   </div>
                </div>

                <div className="space-y-4 flex flex-col">
                   <div className="space-y-2 flex-1">
                      <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Legenda</label>
                      <textarea 
                        value={newPostData.caption}
                        onChange={e => setNewPostData({...newPostData, caption: e.target.value})}
                        placeholder="Escreva algo sobre este momento..."
                        className="w-full h-full min-h-[120px] rounded-2xl bg-zinc-950 border border-zinc-800 p-4 text-white text-sm outline-none focus:ring-1 focus:ring-urucum transition-all resize-none"
                      />
                   </div>
                   <button 
                     type="submit"
                     disabled={isPosting || !newPostData.imageUrl}
                     className="w-full bg-urucum hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-urucum/20 disabled:opacity-50 disabled:shadow-none"
                   >
                     {isPosting ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'PUBLICAR NO PERFIL'}
                   </button>
                </div>
             </div>
          </form>
        </motion.div>
      )}

      {isEditing && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4"
        >
          <h3 className="text-lg font-bold text-white">Editar Perfil</h3>
            <div className="space-y-10">
              {/* Basic Info Edit */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Nome Exibido</label>
                  <input 
                    value={editData.displayName}
                    onChange={e => setEditData({...editData, displayName: e.target.value})}
                    className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-4 py-2 text-white text-sm outline-none focus:ring-1 focus:ring-urucum"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Foto do Perfil</label>
                  <label className="flex items-center justify-center w-full h-10 border border-zinc-800 rounded-lg cursor-pointer bg-zinc-950 hover:bg-zinc-900 transition-all text-xs font-bold text-zinc-400 gap-2">
                    <Upload className="h-4 w-4" />
                    {editData.photoURL ? 'TROCAR FOTO (ARQUIVO)' : 'UPLOAD FOTO'}
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                  </label>
                </div>
              </div>

              {/* VIP Customization options */}
              {profile.vipStatus?.isVip && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
                    <div className="space-y-4">
                      <h4 className="flex items-center gap-2 text-xs font-black text-amber-500 uppercase tracking-widest">
                        <Star className="h-4 w-4" /> Estilo do Usuário (VIP)
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'default', label: 'Padrão', className: 'text-white' },
                          { id: 'neon', label: 'Neon Blue', className: 'username-neon text-xs' },
                          { id: 'neon-8bit', label: 'Neon 8-Bit', className: 'username-8bit text-[8px]' },
                          { id: 'steampunk', label: 'Steampunk', className: 'username-steampunk text-xs' }
                        ].map(style => (
                          <button
                            key={style.id}
                            onClick={() => setEditData({ ...editData, usernameStyle: style.id as any })}
                            className={cn(
                              "flex flex-col items-center justify-center p-3 rounded-lg border transition-all text-center gap-1",
                              editData.usernameStyle === style.id 
                                ? "bg-amber-500/20 border-amber-500" 
                                : "bg-zinc-950 border-zinc-800 hover:border-zinc-700"
                            )}
                          >
                            <span className={cn("font-bold truncate w-full", style.className)}>{style.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="flex items-center gap-2 text-xs font-black text-amber-500 uppercase tracking-widest">
                        <Star className="h-4 w-4" /> Animação do Perfil (VIP)
                      </h4>
                       <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'none', label: 'Nenhuma' },
                          { id: 'rainbow', label: 'Arco-Íris' },
                          { id: 'pulse', label: 'Pulso Tribal' }
                        ].map(anim => (
                          <button
                            key={anim.id}
                            onClick={() => setEditData({ ...editData, profileAnimation: anim.id as any })}
                            className={cn(
                              "flex flex-col items-center justify-center p-3 rounded-lg border transition-all text-center gap-1",
                              editData.profileAnimation === anim.id 
                                ? "bg-amber-500/20 border-amber-500" 
                                : "bg-zinc-950 border-zinc-800 hover:border-zinc-700"
                            )}
                          >
                            <span className="text-[10px] font-bold text-white uppercase">{anim.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                      <h4 className="flex items-center gap-2 text-xs font-black text-amber-500 uppercase tracking-widest">
                        <Star className="h-4 w-4" /> Banner do Perfil (VIP)
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {[
                          { id: 'none', label: 'Padrão', preview: 'bg-zinc-800' },
                          { id: 'christmas', label: 'Natal', preview: 'banner-christmas' },
                          { id: 'easter', label: 'Páscoa', preview: 'banner-easter' },
                          { id: 'junina', label: 'F. Junina', preview: 'banner-junina' },
                          { id: '8bit', label: '8-Bit', preview: 'banner-8bit' },
                          { id: 'retro', label: 'Retro', preview: 'banner-retro' }
                        ].map(banner => (
                          <button
                            key={banner.id}
                            onClick={() => setEditData({ ...editData, bannerStyle: banner.id as any })}
                            className={cn(
                              "flex flex-col items-center justify-center p-2 rounded-lg border transition-all text-center gap-1.5",
                              editData.bannerStyle === banner.id 
                                ? "bg-amber-500/20 border-amber-500" 
                                : "bg-zinc-950 border-zinc-800 hover:border-zinc-700"
                            )}
                          >
                            <div className={cn("h-8 w-full rounded-md", banner.preview)} />
                            <span className="text-[10px] font-bold text-white uppercase">{banner.label}</span>
                          </button>
                        ))}
                      </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Biografia</label>
                <textarea 
                  value={editData.bio}
                  onChange={e => setEditData({...editData, bio: e.target.value})}
                  rows={3}
                  className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-4 py-2 text-white text-sm outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>
            </div>
          <div className="flex justify-end gap-3 pt-2">
            <button 
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-white"
            >
              Cancelar
            </button>
            <button 
              onClick={handleUpdateProfile}
              className="flex items-center gap-2 rounded-lg bg-urucum px-6 py-2 text-sm font-bold text-white hover:bg-red-700"
            >
              <Check className="h-4 w-4" /> Salvar Alterações
            </button>
          </div>
        </motion.div>
      )}

      {/* Grid of Posts */}
      <div className="border-t border-zinc-900 pt-8">
        {profile.isPrivate && !isMyProfile && !isFollowing ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="h-20 w-20 rounded-full bg-zinc-900 flex items-center justify-center mb-4 border border-zinc-800">
               <Lock className="h-10 w-10 text-zinc-600" />
            </div>
            <h3 className="text-white font-bold text-lg">Esta conta é privada</h3>
            <p className="text-zinc-500 max-w-xs mx-auto mt-2">Siga esta conta para ver suas fotos e vídeos.</p>
          </div>
        ) : profile.isBlockedByYou ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="h-20 w-20 rounded-full bg-zinc-900 flex items-center justify-center mb-4 border border-zinc-800">
               <EyeOff className="h-10 w-10 text-zinc-600" />
            </div>
            <h3 className="text-white font-bold text-lg">Usuário não disponível</h3>
            <p className="text-zinc-500 max-w-xs mx-auto mt-2">Você bloqueou este usuário ou ele bloqueou você.</p>
          </div>
        ) : (
          <>
            <div className="mb-6 flex justify-center gap-8 md:gap-12 border-b border-zinc-900/50 md:border-none">
              <button 
                onClick={() => setView('posts')}
                className={cn(
                  "flex items-center gap-2 py-3 transition-colors uppercase tracking-widest text-[10px] font-black",
                  view === 'posts' ? "border-t-2 border-white text-white" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                <Grid className="h-4 w-4" />
                <span>Publicações</span>
              </button>
              <button 
                onClick={() => setView('reels')}
                className={cn(
                  "flex items-center gap-2 py-3 transition-colors uppercase tracking-widest text-[10px] font-black",
                  view === 'reels' ? "border-t-2 border-white text-white" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                <PlayCircle className="h-4 w-4" />
                <span>Reels</span>
              </button>
              {isMyProfile && (
                <button 
                  onClick={() => setView('archived')}
                  className={cn(
                    "flex items-center gap-2 py-3 transition-colors uppercase tracking-widest text-[10px] font-black",
                    view === 'archived' ? "border-t-2 border-white text-white" : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  <Archive className="h-4 w-4" />
                  <span>Arquivados</span>
                </button>
              )}
              <button 
                onClick={() => setView('saved')}
                className={cn(
                  "flex items-center gap-2 py-3 transition-colors uppercase tracking-widest text-[10px] font-black",
                  view === 'saved' ? "border-t-2 border-white text-white" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                <Bookmark className="h-4 w-4" />
                <span>Salvos</span>
              </button>
            </div>

            {view === 'blocked' && isMyProfile ? (
              <div className="space-y-4 max-w-md mx-auto">
                <h3 className="text-white font-bold mb-6">Usuários Bloqueados</h3>
                {blockedUsers.length > 0 ? blockedUsers.map(u => (
                  <div key={u.id} className="flex items-center justify-between bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                    <div className="flex items-center gap-3">
                      <img src={u.photoURL} className="h-10 w-10 rounded-full object-cover" />
                      <div>
                        <p className="text-white font-bold text-sm">{u.username}</p>
                        <p className="text-zinc-500 text-xs">{u.displayName}</p>
                      </div>
                    </div>
                    <button 
                      onClick={async () => {
                        await updateDoc(doc(db, 'users', currentUser.uid), { blockedUsers: arrayRemove(u.uid) });
                        fetchBlockedUsers();
                      }}
                      className="text-red-500 text-xs font-black uppercase hover:underline"
                    >
                      Desbloquear
                    </button>
                  </div>
                )) : (
                  <p className="text-center text-zinc-500 py-10">Nenhum usuário bloqueado.</p>
                )}
              </div>
            ) : (
            <div className="grid grid-cols-3 gap-1 md:gap-6">
              {(() => {
                const filtered = 
                  view === 'posts' ? posts.filter(p => !p.isArchived) :
                  view === 'reels' ? posts.filter(p => p.type === 'video' && !p.isArchived) :
                  view === 'archived' ? posts.filter(p => p.isArchived) :
                  [];
                
                if (filtered.length === 0) {
                  return (
                    <div className="col-span-3 py-20 text-center">
                      <p className="text-zinc-600">Nenhum conteúdo nesta categoria.</p>
                    </div>
                  );
                }

                return filtered.map(post => (
                  <motion.div 
                    key={post.id} 
                    whileHover={{ scale: 1.02 }}
                    className="aspect-square cursor-pointer overflow-hidden rounded-md md:rounded-xl bg-zinc-900 group relative shadow-lg"
                  >
                    {post.type === 'video' ? (
                        <video src={post.imageUrl} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    ) : (
                        <img src={post.imageUrl} alt={post.caption} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                      <div className="flex gap-4 text-white font-bold">
                        <span className="flex items-center gap-1"><Heart className="h-5 w-5 fill-white" /> {post.likesCount}</span>
                      </div>
                      {isMyProfile && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleArchivePost(post.id, post.isArchived);
                          }}
                          className="bg-white/10 hover:bg-white/20 p-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                          {post.isArchived ? 'Desarquivar' : 'Arquivar'}
                        </button>
                      )}
                    </div>
                  </motion.div>
                ));
              })()}
            </div>
            )}
          </>
        )}
      </div>

      {/* Settings Drawer */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-xs h-full bg-jenkins bg-zinc-950 border-l border-zinc-800 p-8 flex flex-col overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-10">
                 <h2 className="text-xl font-black text-white italic">OPÇÕES</h2>
                 <button onClick={() => setShowSettings(false)} className="rounded-full bg-zinc-900 p-2 text-zinc-400">
                    <X className="h-5 w-5" />
                 </button>
              </div>

              <div className="flex-1 space-y-6">
                {/* Account Settings */}
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest pl-2">Sua Conta</p>
                  <nav className="space-y-1">
                    <button 
                      onClick={() => { setIsEditing(true); setShowSettings(false); }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-900 transition-all text-zinc-200"
                    >
                      <Settings className="h-5 w-5" />
                      <span className="text-sm font-bold">Configurações e Privacidade</span>
                    </button>
                    <button 
                      onClick={() => { navigate('/vip'); setShowSettings(false); }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-transparent hover:from-amber-500/20 transition-all text-amber-500"
                    >
                      <Crown className="h-5 w-5" />
                      <span className="text-sm font-bold">Meta Verified (VIP)</span>
                    </button>
                  </nav>
                </div>

                {/* Content & Activity */}
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest pl-2">Como você usa o ConectAldeias</p>
                  <nav className="space-y-1">
                    <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-900 transition-all text-zinc-200">
                      <Star className="h-5 w-5" />
                      <span className="text-sm font-bold">Favoritos</span>
                    </button>
                    <button 
                      onClick={() => { setView('saved'); setShowSettings(false); }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-900 transition-all text-zinc-200"
                    >
                      <Bookmark className="h-5 w-5" />
                      <span className="text-sm font-bold">Salvos</span>
                    </button>
                    <button 
                      onClick={() => { setView('archived'); setShowSettings(false); }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-900 transition-all text-zinc-200"
                    >
                      <Archive className="h-5 w-5" />
                      <span className="text-sm font-bold">Itens Arquivados</span>
                    </button>
                    <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-900 transition-all text-zinc-200">
                      <History className="h-5 w-5" />
                      <span className="text-sm font-bold">Sua Atividade</span>
                    </button>
                  </nav>
                </div>

                {/* Privacy & Interactions */}
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest pl-2">Quem pode ver seu conteúdo</p>
                  <nav className="space-y-1">
                    <button 
                      onClick={handleTogglePrivacy}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-zinc-900 transition-all text-zinc-200"
                    >
                      <div className="flex items-center gap-3">
                        <Lock className="h-5 w-5" />
                        <span className="text-sm font-bold">Privacidade da Conta</span>
                      </div>
                      <span className="text-xs text-zinc-500">{myProfile.isPrivate ? 'Privada' : 'Pública'}</span>
                    </button>
                    <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-900 transition-all text-zinc-200">
                      <Users2 className="h-5 w-5" />
                      <span className="text-sm font-bold">Amigos Próximos</span>
                    </button>
                    <button 
                      onClick={() => { setView('blocked'); setShowSettings(false); }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-900 transition-all text-zinc-200"
                    >
                      <UserX className="h-5 w-5" />
                      <span className="text-sm font-bold">Bloqueados</span>
                    </button>
                  </nav>
                </div>

                {/* More Info */}
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest pl-2">Mais Informações</p>
                  <nav className="space-y-1">
                    <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-900 transition-all text-zinc-200">
                      <QrCode className="h-5 w-5" />
                      <span className="text-sm font-bold">Código QR</span>
                    </button>
                    <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-900 transition-all text-zinc-200">
                      <CreditCard className="h-5 w-5" />
                      <span className="text-sm font-bold">Pedidos e Pagamentos</span>
                    </button>
                    <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-900 transition-all text-zinc-200">
                      <HelpCircle className="h-5 w-5" />
                      <span className="text-sm font-bold">Ajuda</span>
                    </button>
                  </nav>
                </div>
              </div>

              <div className="pt-8 mt-auto border-t border-zinc-900">
                <button 
                  onClick={() => signOut(auth).then(() => navigate('/login'))}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 hover:bg-red-500/20 transition-all text-red-500 font-black uppercase tracking-[0.2em] text-xs"
                >
                  <LogOut className="h-5 w-5" />
                  Sair do ConectAldeias
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCropModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg"
            >
              <ImageCropper
                aspectRatio={cropTarget === 'avatar' ? 'square' : 'rect'}
                title={cropTarget === 'avatar' ? 'Ajustar Foto de Perfil' : 'Ajustar Foto do Post'}
                onCancel={() => {
                  setShowCropModal(false);
                  setCropTarget(null);
                }}
                onCropComplete={(croppedDataUrl) => {
                  if (cropTarget === 'avatar') {
                    setEditData(prev => ({ ...prev, photoURL: croppedDataUrl }));
                  } else {
                    setNewPostData(prev => ({ ...prev, imageUrl: croppedDataUrl, type: 'image' }));
                  }
                  setShowCropModal(false);
                  setCropTarget(null);
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSongSelector && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative"
            >
              <div className="flex items-center justify-between mb-4 border-b border-zinc-850 pb-3">
                <div className="flex items-center gap-2">
                  <Music className="h-5 w-5 text-urucum animate-pulse" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-white">Escolher Música do Perfil</h3>
                </div>
                <button 
                  onClick={() => setShowSongSelector(false)}
                  className="p-1 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {POPULAR_SONGS.map((song) => {
                  const isSelected = profile?.profileSongId === song.id;
                  const isPreviewPlaying = isPlayingMusic && profileAudio?.src === song.audioUrl;
                  return (
                    <div 
                      key={song.id} 
                      className={cn(
                        "flex items-center justify-between p-3 rounded-2xl border transition-all",
                        isSelected 
                          ? "bg-urucum/10 border-urucum" 
                          : "border-zinc-850 bg-zinc-900/50 hover:bg-zinc-800"
                      )}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="text-xs font-bold text-white leading-tight truncate">{song.title}</p>
                        <p className="text-[10px] text-zinc-500 truncate mt-0.5">{song.artist}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleProfileMusic(song)}
                          className="px-2.5 py-1 text-[9px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded uppercase tracking-wider"
                        >
                          {isPreviewPlaying ? 'Parar ⏸️' : 'Ouvir 🎧'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectProfileSong(isSelected ? null : song.id)}
                          className={cn(
                            "px-2.5 py-1 text-[9px] font-bold rounded uppercase tracking-wider transition-colors",
                            isSelected 
                              ? "bg-urucum text-white hover:bg-red-700" 
                              : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                          )}
                        >
                          {isSelected ? 'Remover' : 'Escolher'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  </div>
);
}
