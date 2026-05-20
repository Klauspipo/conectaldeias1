import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, MessageCircle, Send, Music2, UserPlus, MoreVertical, Volume2, VolumeX, Play, Search, Camera } from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot, limit, doc, updateDoc, arrayUnion, arrayRemove, increment, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

interface Reel {
  id: string;
  imageUrl: string; // Used for video URL in this context
  caption: string;
  authorId: string;
  author: any;
  likesCount: number;
  commentsCount: number;
  musicName?: string;
  type: 'video';
  likedBy?: string[];
}

const ReelItem: React.FC<{ reel: Reel; isActive: boolean; isNear: boolean }> = ({ reel, isActive, isNear }) => {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [muted, setMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showHeart, setShowHeart] = useState(false);
  const lastTapRef = useRef<number>(0);

  useEffect(() => {
    setIsLiked(reel.likedBy?.includes(user?.uid || '') || false);
    setLikes(reel.likesCount || 0);
  }, [reel.likedBy, reel.likesCount, user?.uid]);

  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.play().catch(() => setIsPlaying(false));
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [isActive]);

  const handleLike = async () => {
    if (!user) return;
    
    // Toggle locally for instant feedback
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setLikes(prev => newLiked ? prev + 1 : prev - 1);

    try {
      const reelRef = doc(db, 'posts', reel.id);
      await updateDoc(reelRef, {
        likesCount: increment(newLiked ? 1 : -1),
        likedBy: newLiked ? arrayUnion(user.uid) : arrayRemove(user.uid)
      });
    } catch (err) {
      console.error(err);
      // Revert if failed
      setIsLiked(!newLiked);
      setLikes(prev => !newLiked ? prev + 1 : prev - 1);
    }
  };

  const handleVideoClick = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap
      if (!isLiked) {
        handleLike();
      }
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 1000);
    } else {
      // Single tap
      if (videoRef.current?.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current?.pause();
        setIsPlaying(false);
      }
    }
    lastTapRef.current = now;
  };

  return (
    <div className="relative h-full w-full bg-black snap-start">
      {reel.imageUrl && isNear ? (
        <video
          ref={videoRef}
          src={reel.imageUrl}
          className="h-full w-full object-cover"
          loop
          muted={muted}
          playsInline
          preload={isActive ? "auto" : "metadata"}
          onClick={handleVideoClick}
        />
      ) : reel.imageUrl ? (
        <div className="h-full w-full flex flex-col items-center justify-center text-zinc-500 bg-black">
           <div className="h-10 w-10 rounded-full border-2 border-dashed border-zinc-900 border-t-urucum animate-spin mb-3" />
           <span className="font-bold uppercase tracking-widest text-[9px] text-zinc-600">Preparando Vídeo...</span>
        </div>
      ) : (
        <div className="h-full w-full flex flex-col items-center justify-center text-zinc-850">
           <Play className="h-16 w-16 mb-4" />
           <span className="font-black uppercase tracking-widest text-xs italic">Vídeo não encontrado</span>
        </div>
      )}

      <AnimatePresence>
        {showHeart && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 1 }}
            exit={{ scale: 2, opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
          >
            <Heart className="h-24 w-24 text-white fill-white drop-shadow-2xl" />
          </motion.div>
        )}
        {!isPlaying && !showHeart && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="bg-black/40 p-6 rounded-full backdrop-blur-md">
              <Play className="h-12 w-12 text-white fill-white" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Side Actions */}
      <div className="absolute right-4 bottom-24 flex flex-col items-center gap-6 z-20">
        <div className="flex flex-col items-center gap-1">
          <motion.button 
            whileTap={{ scale: 1.5 }}
            onClick={handleLike}
            className="p-3"
          >
            <Heart className={cn("h-8 w-8 transition-colors", isLiked ? "text-urucum fill-urucum shadow-urucum/50" : "text-white")} />
          </motion.button>
          <span className="text-white text-xs font-black shadow-black drop-shadow-md">{likes}</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <motion.button 
            whileTap={{ scale: 0.8 }}
            className="p-3"
          >
            <MessageCircle className="h-8 w-8 text-white" />
          </motion.button>
          <span className="text-white text-xs font-black shadow-black drop-shadow-md">{reel.commentsCount || 0}</span>
        </div>

        <motion.button 
          whileTap={{ scale: 0.8, x: 5, y: -5 }}
          className="p-3"
        >
          <Send className="h-8 w-8 text-white" />
        </motion.button>

        <motion.button 
          whileTap={{ scale: 0.8, rotate: 90 }}
          className="p-3"
        >
          <MoreVertical className="h-8 w-8 text-white" />
        </motion.button>

        <motion.div 
          whileHover={{ scale: 1.1 }}
          className="mt-4 h-10 w-10 rounded-lg border-2 border-white overflow-hidden animate-spin-slow"
        >
           <img src={reel.author?.photoURL} className="h-full w-full object-cover" />
        </motion.div>
      </div>

      {/* Top Controls */}
      <div className="absolute top-8 left-6 right-6 flex items-center justify-between z-20">
         <h2 className="text-2xl font-black text-white italic tracking-tighter shadow-black drop-shadow-lg">REELS</h2>
         <div className="flex items-center gap-4">
            <button onClick={() => setMuted(!muted)} className="p-2 bg-black/20 rounded-full backdrop-blur-md">
               {muted ? <VolumeX className="h-6 w-6 text-white" /> : <Volume2 className="h-6 w-6 text-white" />}
            </button>
            <Camera className="h-6 w-6 text-white" />
         </div>
      </div>

      {/* Bottom Info */}
      <div className="absolute bottom-10 left-6 right-20 z-20">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full border-2 border-white overflow-hidden shadow-lg">
             <img src={reel.author?.photoURL} className="h-full w-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-white font-black text-sm italic",
                reel.author?.usernameStyle === 'neon' && "username-neon",
                reel.author?.usernameStyle === 'neon-8bit' && "username-8bit",
                reel.author?.usernameStyle === 'steampunk' && "username-steampunk"
              )}>@{reel.author?.username}</span>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="text-[10px] bg-white/20 border border-white/20 text-white px-3 py-1 rounded-full font-black uppercase tracking-widest backdrop-blur-md"
              >
                 Seguir
              </motion.button>
            </div>
          </div>
        </div>

        <p className="text-white text-sm font-medium mb-4 line-clamp-2 drop-shadow-md">
          {reel.caption}
        </p>

        <div className="flex items-center gap-2 text-white/80">
          <Music2 className="h-4 w-4" />
          <div className="overflow-hidden w-40">
             <div className="whitespace-nowrap animate-marquee text-[10px] font-black uppercase tracking-[0.2em]">
                {reel.musicName || 'Áudio Original • ConectAldeias'}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Reels() {
  const { triggerQuotaExceeded } = useAuth();
  const [reels, setReels] = useState<Reel[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch posts that are videos as Reels
    const q = query(
      collection(db, 'posts'), 
      where('type', '==', 'video'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsub = onSnapshot(q, (snap) => {
      const fetchReelsData = async () => {
        try {
          const reelsData = await Promise.all(
            snap.docs.map(async (d) => {
              const reel = { id: d.id, ...d.data() } as Reel;
              const authorSnap = await getDoc(doc(db, 'users', reel.authorId)).catch(() => null);
              return { 
                ...reel, 
                author: authorSnap?.exists() ? authorSnap.data() : { username: 'usuario', displayName: 'Usuário', photoURL: null } 
              };
            })
          );
          setReels(reelsData);
        } catch (err) {
          console.error('Reels processing error:', err);
        }
      };

      fetchReelsData();
    }, (error) => {
      console.error('Reels snapshot error:', error);
      triggerQuotaExceeded();
    });

    return unsub;
  }, [triggerQuotaExceeded]);

  const handleScroll = () => {
    if (containerRef.current) {
      const index = Math.round(containerRef.current.scrollTop / containerRef.current.clientHeight);
      setActiveIndex(index);
    }
  };

  return (
    <div className="flex-1 bg-black h-screen overflow-hidden">
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto snap-y snap-mandatory no-scrollbar"
      >
        {reels.length > 0 ? reels.map((reel, index) => (
          <ReelItem 
            key={reel.id} 
            reel={reel} 
            isActive={index === activeIndex} 
            isNear={Math.abs(index - activeIndex) <= 1}
          />
        )) : (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-4">
             <div className="h-20 w-20 rounded-full border-4 border-dashed border-zinc-900 border-t-urucum animate-spin" />
             <p className="font-black italic uppercase tracking-widest text-xs">Pajés digitais buscando conteúdos...</p>
          </div>
        )}
      </div>
    </div>
  );
}
