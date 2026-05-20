import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Heart,
  MessageCircle,
  Send,
  Plus,
  Image as ImageIcon,
  Loader2,
  X,
  BadgeCheck,
  Crown,
  Upload,
  ArrowLeft,
  ChevronRight,
  MoreHorizontal,
  Bookmark,
  Volume2,
  VolumeX,
  PlayCircle,
  Music,
  Download,
  RefreshCw,
  Search,
} from "lucide-react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  getDoc,
  doc,
  where,
  limit,
  updateDoc,
  increment,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { fileToBase64, cn } from "../lib/utils";
import { POPULAR_SONGS, Song } from "../data/songs";

interface Post {
  id: string;
  authorId: string;
  caption: string;
  imageUrl: string;
  likesCount: number;
  commentsCount?: number;
  type?: "image" | "video";
  createdAt: any;
  author?: any;
  likedBy?: string[];
}

interface Story {
  id: string;
  authorId: string;
  imageUrl: string;
  type?: "image" | "video";
  createdAt: any;
  author?: any;
  musicTitle?: string;
  musicArtist?: string;
  musicAudioUrl?: string;
  mentionedUsers?: string[];
}

const FeedPost: React.FC<{ post: Post; user: any; navigate: any }> = ({
  post,
  user,
  navigate,
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    setIsLiked(post.likedBy?.includes(user?.uid || "") || false);
    setLikes(post.likesCount || 0);
  }, [post.likedBy, post.likesCount, user?.uid]);

  // Compute a stable beautiful native/indigenous soundtrack if none is set
  const fallbackSongs = [
    { title: "Txuã", artist: "Alok (feat. Mapu Huni Kuin)", id: "S0TbyuPyzS0" },
    { title: "Canto Sagrado de Cura", artist: "Povo Yawanawá", id: "E50T-D5uXgA" },
    { title: "Demarcação Já", artist: "Artistas da MPB", id: "Kz6EAs9-mOk" },
    { title: "Força da Floresta", artist: "Txai Fernando", id: "L2G93k7_2Fk" },
    { title: "Rap da Resistência", artist: "Kunumi MC", id: "34d7u6fAnf4" }
  ];
  const postIndex = post.id ? post.id.charCodeAt(0) % fallbackSongs.length : 0;
  const fallbackSong = fallbackSongs[postIndex];

  const activeMusicTitle = post.musicTitle || fallbackSong.title;
  const activeMusicArtist = post.musicArtist || fallbackSong.artist;
  const activeMusicUrl = post.musicAudioUrl || fallbackSong.id;

  const handleLike = async () => {
    if (!user) return;
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setLikes((prev) => (newLiked ? prev + 1 : prev - 1));

    try {
      const postRef = doc(db, "posts", post.id);
      await updateDoc(postRef, {
        likesCount: increment(newLiked ? 1 : -1),
        likedBy: newLiked ? arrayUnion(user.uid) : arrayRemove(user.uid),
      });
    } catch (err) {
      console.error(err);
      setIsLiked(!newLiked);
      setLikes((prev) => (!newLiked ? prev + 1 : prev - 1));
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-black border-b border-zinc-900 md:border md:border-zinc-900 md:rounded-lg overflow-hidden mb-6"
    >
      {/* Background audio player for YouTube soundtrack */}
      {!muted && activeMusicUrl && !activeMusicUrl.startsWith('http') && (
        <iframe
          key={`post-audio-${post.id}`}
          src={`https://www.youtube-nocookie.com/embed/${activeMusicUrl}?autoplay=1&loop=1&playlist=${activeMusicUrl}&controls=0`}
          className="w-0 h-0 absolute opacity-0 pointer-events-none"
          allow="autoplay; encrypted-media"
        />
      )}

      {/* Post Header */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full overflow-hidden p-[1px] bg-gradient-to-tr from-[#fbc02d] via-[#e91e63] to-[#9c27b0]">
            <div className="h-full w-full rounded-full border border-black overflow-hidden bg-zinc-900">
              {post.author?.photoURL ? (
                <img
                  src={post.author.photoURL}
                  alt={post.author.username}
                  onClick={() => navigate(`/u/${post.author?.username}`)}
                  className="h-full w-full object-cover cursor-pointer"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div 
                  onClick={() => navigate(`/u/${post.author?.username}`)}
                  className="flex h-full w-full items-center justify-center bg-zinc-800 text-zinc-450 text-[10px] uppercase font-bold cursor-pointer"
                >
                  {post.author?.displayName?.[0]}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1 leading-none">
              <span
                onClick={() => navigate(`/u/${post.author?.username}`)}
                className={cn(
                  "text-[13px] font-bold text-white hover:text-zinc-300 cursor-pointer",
                  post.author?.usernameStyle === "neon" && "username-neon",
                  post.author?.usernameStyle === "neon-8bit" && "username-8bit",
                  post.author?.usernameStyle === "steampunk" &&
                    "username-steampunk",
                )}
              >
                {post.author?.username}
              </span>
              {post.author?.isVerified && (
                <BadgeCheck className="h-3.5 w-3.5 text-blue-400 fill-blue-400/10 shrink-0" />
              )}
              {post.author?.vipStatus?.isVip && (
                <Crown className="h-3.5 w-3.5 text-amber-500 fill-amber-500/10 shrink-0" />
              )}
              <span className="text-zinc-650 text-[10px]">•</span>
              <span className="text-[11px] text-zinc-500">
                {post.createdAt
                  ? formatDistanceToNow(post.createdAt.toDate(), {
                      locale: ptBR,
                    })
                  : ""}
              </span>
            </div>

            {/* Soundtrack Indicator - EXACTLY like Instagram with the running track label */}
            {activeMusicTitle && (
              <div className="flex items-center gap-1 text-[10.5px] text-zinc-400 font-normal mt-0.5 leading-none">
                <Music className="h-2.5 w-2.5 text-urucum shrink-0 animate-spin" style={{ animationDuration: "4s" }} />
                <span className="truncate max-w-[190px] md:max-w-[280px]">
                  {activeMusicArtist} · {activeMusicTitle}
                </span>
              </div>
            )}
          </div>
        </div>
        <button className="text-zinc-400 hover:text-white p-1">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      {/* Main Media area */}
      <div className="relative aspect-square w-full bg-zinc-950 flex items-center justify-center overflow-hidden">
        {post.type === "video" ? (
          <div className="relative w-full h-full group">
            {post.imageUrl ? (
              <video
                src={post.imageUrl}
                className="h-full w-full object-cover"
                muted={muted}
                autoPlay
                loop
                playsInline
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-zinc-805">
                <PlayCircle className="h-12 w-12 mb-2" />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Mídia indisponível
                </span>
              </div>
            )}
          </div>
        ) : post.imageUrl ? (
          <img
            src={post.imageUrl}
            alt={post.caption}
            className="h-full w-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-zinc-805">
            <ImageIcon className="h-12 w-12 mb-2" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Imagem indisponível
            </span>
          </div>
        )}

        {/* 1/2 indicator overlay on top-right of image just like Instagram */}
        <div className="absolute top-3.5 right-3.5 bg-black/60 text-[10px] text-zinc-200 font-bold px-2 py-0.5 rounded-full backdrop-blur-md opacity-90 select-none pointer-events-none">
          1/2
        </div>

        {/* Mute/Sound toggle overlay at bottom-right of image - ALWAYS visible just like on Instagram */}
        <button
          onClick={() => setMuted(!muted)}
          type="button"
          className="absolute bottom-3.5 right-3.5 p-2 bg-black/60 rounded-full text-white backdrop-blur-md hover:bg-black/90 active:scale-95 transition-all shadow-lg z-20 cursor-pointer border border-zinc-800/25"
        >
          {muted ? (
            <VolumeX className="h-4 w-4 text-zinc-300" />
          ) : (
            <Volume2 className="h-4 w-4 text-white animate-pulse" />
          )}
        </button>
      </div>

      {/* Post Actions (Likes, Comments, Shares, Bookmarks) */}
      <div className="px-3 pt-3 pb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <motion.button
              whileTap={{ scale: 1.4 }}
              onClick={handleLike}
              className={cn(
                "transition-colors",
                isLiked ? "text-red-500" : "text-white hover:text-zinc-400",
              )}
            >
              <Heart className={cn("h-[26px] w-[26px]", isLiked && "fill-red-500 text-red-500")} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.8 }}
              className="text-white hover:text-zinc-400"
              onClick={() => navigate(`/u/${post.author?.username}`)}
            >
              <MessageCircle className="h-[26px] w-[26px]" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.8, x: 5, y: -5 }}
              className="text-white hover:text-zinc-400"
            >
              <Send className="h-[25px] w-[25px]" />
            </motion.button>
          </div>
          <motion.button
            whileTap={{ scale: 0.8 }}
            className="text-white hover:text-zinc-400"
          >
            <Bookmark className="h-[25px] w-[25px]" />
          </motion.button>
        </div>

        {/* Likes, caption and comments lists */}
        <div className="space-y-1 px-0.5">
          <p className="text-[13.5px] font-bold text-white tracking-tight leading-none">
            {likes.toLocaleString()} curtidas
          </p>
          <div className="text-[13px] text-zinc-100 leading-snug">
            <span
              onClick={() => navigate(`/u/${post.author?.username}`)}
              className={cn(
                "font-bold text-white mr-2 cursor-pointer hover:underline",
                post.author?.usernameStyle === "neon" && "username-neon",
                post.author?.usernameStyle === "neon-8bit" && "username-8bit",
                post.author?.usernameStyle === "steampunk" &&
                  "username-steampunk",
              )}
            >
              {post.author?.username}
            </span>
            {post.caption}
          </div>
          <button 
            onClick={() => navigate(`/u/${post.author?.username}`)}
            className="text-zinc-550 text-xs font-normal pt-1 hover:text-zinc-400 transition-colors block"
          >
            Ver todos os {post.commentsCount || "0"} comentários
          </button>
        </div>
      </div>
    </motion.article>
  );
};

export default function Feed() {
  const { user, profile, triggerQuotaExceeded } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showStoryCreate, setShowStoryCreate] = useState(false);
  const [newCaption, setNewCaption] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newMediaType, setNewMediaType] = useState<"image" | "video">("image");
  const [isPosting, setIsPosting] = useState(false);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);

  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [storyProgress, setStoryProgress] = useState(0);
  const [muted, setMuted] = useState(true);

  // Music & Mention Creation State
  const [selectedCreationSong, setSelectedCreationSong] = useState<Song | null>(
    null,
  );
  const [mentionedUsernames, setMentionedUsernames] = useState<string>("");
  const [isPlayingPreview, setIsPlayingPreview] = useState<string | null>(null);
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(
    null,
  );
  const [storyAudio, setStoryAudio] = useState<HTMLAudioElement | null>(null);

  // YouTube music search state
  const [ytSearchTerm, setYtSearchTerm] = useState("");
  const [ytSearchResults, setYtSearchResults] = useState<Song[]>([]);
  const [ytSearching, setYtSearching] = useState(false);

  useEffect(() => {
    if (showStoryCreate) {
      setYtSearching(true);
      fetch('/api/youtube/search')
        .then(res => res.json())
        .then(data => {
          setYtSearchResults(data);
          setYtSearching(false);
        })
        .catch(err => {
          console.error("Failed to load initial songs:", err);
          setYtSearchResults(POPULAR_SONGS);
          setYtSearching(false);
        });
    } else {
      setYtSearchTerm("");
      setIsPlayingPreview(null);
    }
  }, [showStoryCreate]);

  const handleYtSearch = async (queryStr: string) => {
    setYtSearching(true);
    try {
      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(queryStr)}`);
      if (res.ok) {
        const data = await res.json();
        setYtSearchResults(data);
      }
    } catch (err) {
      console.error("YouTube search error:", err);
    } finally {
      setYtSearching(false);
    }
  };

  // Playback of active audio in stories
  useEffect(() => {
    if (storyAudio) {
      storyAudio.pause();
      storyAudio.src = "";
    }

    if (selectedStory && selectedStory.musicAudioUrl && selectedStory.musicAudioUrl.startsWith('http')) {
      const audio = new Audio(selectedStory.musicAudioUrl);
      audio.loop = true;
      audio.volume = muted ? 0 : 0.7;
      audio
        .play()
        .catch((err) => console.log("Auto-play blocked or error:", err));
      setStoryAudio(audio);
    } else {
      setStoryAudio(null);
    }

    return () => {
      if (storyAudio) {
        storyAudio.pause();
      }
    };
  }, [selectedStory, selectedStoryIndex]);

  // Adjust story audio when muted changes
  useEffect(() => {
    if (storyAudio) {
      storyAudio.volume = muted ? 0 : 0.7;
    }
  }, [muted, storyAudio]);

  // Handle play preview in creator modal
  const handleTogglePreview = (song: Song) => {
    if (previewAudio) {
      previewAudio.pause();
      setPreviewAudio(null);
    }

    if (isPlayingPreview === song.id) {
      setIsPlayingPreview(null);
      return;
    }

    setIsPlayingPreview(song.id);

    if (song.audioUrl && song.audioUrl.startsWith('http')) {
      const audio = new Audio(song.audioUrl);
      audio.play().catch(e => console.log("Audio preview debug:", e));
      setPreviewAudio(audio);
    }
  };

  useEffect(() => {
    return () => {
      if (previewAudio) previewAudio.pause();
    };
  }, [previewAudio]);

  useEffect(() => {
    let timer: any;
    if (selectedStory) {
      setStoryProgress(0);
      timer = setInterval(() => {
        setStoryProgress((prev) => {
          if (prev >= 100) {
            handleNextStory();
            return 0;
          }
          return prev + 1;
        });
      }, 50); // 5 seconds total (100 * 50ms)
    }
    return () => clearInterval(timer);
  }, [selectedStory, selectedStoryIndex]);

  const handleNextStory = () => {
    const nextIndex = selectedStoryIndex + 1;
    if (nextIndex < stories.length) {
      setSelectedStoryIndex(nextIndex);
      setSelectedStory(stories[nextIndex]);
      setStoryProgress(0);
    } else {
      setSelectedStory(null);
    }
  };

  const handlePrevStory = () => {
    const prevIndex = selectedStoryIndex - 1;
    if (prevIndex >= 0) {
      setSelectedStoryIndex(prevIndex);
      setSelectedStory(stories[prevIndex]);
      setStoryProgress(0);
    } else {
      setStoryProgress(0);
    }
  };

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleRepost = async (story: Story) => {
    if (isPosting) return;
    setIsPosting(true);
    try {
      await addDoc(collection(db, "stories"), {
        authorId: user?.uid,
        imageUrl: story.imageUrl,
        type: story.type || "image",
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
        musicTitle: story.musicTitle || "",
        musicArtist: story.musicArtist || "",
        musicAudioUrl: story.musicAudioUrl || "",
        mentionedUsers: [], // clear mentions for the repost, or preserve
      });
      showToast(
        `Você repostou o Story de @${story.author?.username || "parceiro"} com sucesso!`,
      );
      setSelectedStory(null);
    } catch (err) {
      console.error("Erro ao repostar story:", err);
      showToast("Ocorreu um erro ao tentar repostar o Story.");
    } finally {
      setIsPosting(false);
    }
  };

  const handleDownloadStory = async (story: Story) => {
    try {
      showToast(
        "Iniciando download... Música protegida por direitos autorais do YouTube foi removida! 🛡️",
      );
      const res = await fetch(story.imageUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `conectaldeias-story-${story.id}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      // fallback
      const a = document.createElement("a");
      a.href = story.imageUrl;
      a.download = `conectaldeias-story-${story.id}.jpg`;
      a.target = "_blank";
      a.click();
    }
  };

  useEffect(() => {
    // Fetch stories (active ones could be filtered by date, but for now just recent)
    const storiesQ = query(collection(db, "stories"), limit(20));
    const unsubStories = onSnapshot(
      storiesQ,
      (snap) => {
        const fetchStoriesData = async () => {
          try {
            const storiesData = await Promise.all(
              snap.docs.map(async (d) => {
                const story = { id: d.id, ...d.data() } as Story;
                const authorSnap = await getDoc(
                  doc(db, "users", story.authorId),
                ).catch(() => null);
                return {
                  ...story,
                  author: authorSnap?.exists()
                    ? authorSnap.data()
                    : {
                        username: "usuario",
                        displayName: "Usuário",
                        photoURL: null,
                      },
                };
              }),
            );
            setStories(
              storiesData.sort(
                (a, b) =>
                  (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0),
              ),
            );
          } catch (err) {
            console.error("Stories processing error:", err);
          }
        };

        fetchStoriesData();
      },
      (err) => {
        console.error("Stories snapshot listener error:", err);
        triggerQuotaExceeded();
      },
    );

    const q = query(collection(db, "posts"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchPostsData = async () => {
          try {
            const postsData = await Promise.all(
              snapshot.docs.map(async (d) => {
                const post = { id: d.id, ...d.data() } as Post;
                const authorSnap = await getDoc(
                  doc(db, "users", post.authorId),
                ).catch(() => null);
                return {
                  ...post,
                  author: authorSnap?.exists()
                    ? authorSnap.data()
                    : {
                        username: "usuario",
                        displayName: "Usuário",
                        photoURL: null,
                      },
                };
              }),
            );
            setPosts(
              postsData.sort(
                (a, b) =>
                  (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0),
              ),
            );
            setLoading(false);
          } catch (err) {
            console.error("Posts processing error:", err);
          }
        };

        fetchPostsData();
      },
      (err) => {
        console.error("Posts snapshot listener error:", err);
        triggerQuotaExceeded();
        setLoading(false);
      },
    );

    return () => {
      unsubscribe();
      unsubStories();
    };
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const type = file.type.startsWith("video/") ? "video" : "image";
      try {
        const base64 = await fileToBase64(file);
        setNewImageUrl(base64);
        setNewMediaType(type);
      } catch (err) {
        console.error("Error converting file to base64:", err);
      }
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImageUrl.trim() || isPosting) return;

    setIsPosting(true);
    try {
      await addDoc(collection(db, "posts"), {
        authorId: user?.uid,
        caption: newCaption,
        imageUrl: newImageUrl,
        type: newMediaType,
        likesCount: 0,
        likedBy: [],
        createdAt: serverTimestamp(),
      });
      setNewCaption("");
      setNewImageUrl("");
      setNewMediaType("image");
      setShowCreate(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsPosting(false);
    }
  };

  const handleCreateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImageUrl.trim() || isPosting) return;
    setIsPosting(true);

    const parsedMentions = mentionedUsernames
      .split(/[,\s]+/)
      .map((u) => u.trim().replace(/^@/, "").toLowerCase())
      .filter(Boolean);

    try {
      await addDoc(collection(db, "stories"), {
        authorId: user?.uid,
        imageUrl: newImageUrl,
        type: newMediaType,
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
        musicTitle: selectedCreationSong?.title || "",
        musicArtist: selectedCreationSong?.artist || "",
        musicAudioUrl: selectedCreationSong?.audioUrl || "",
        mentionedUsers: parsedMentions,
      });
      setNewImageUrl("");
      setNewMediaType("image");
      setSelectedCreationSong(null);
      setMentionedUsernames("");
      setShowStoryCreate(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="flex-1 bg-zinc-950 min-h-screen">
      {/* Instagram-style Top Header (Matches the screenshot) */}
      <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-900/50 px-4 py-3 flex items-center justify-between select-none">
        <button 
          onClick={() => setShowCreate(true)}
          className="text-white hover:text-zinc-300 transition-colors p-1"
          title="Nova Publicação"
        >
          <Plus className="h-7 w-7 stroke-[1.5]" />
        </button>
        <span 
          className="text-2xl font-bold tracking-tight text-white italic"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          ConectAldeias
        </span>
        <button 
          onClick={() => showToast("Nenhuma nova notificação 🌿")}
          className="text-white hover:text-zinc-300 transition-colors p-1 relative"
          title="Notificações"
        >
          <Heart className="h-6 w-6 stroke-[1.5]" />
          <span className="absolute top-1 right-1 h-1.5 w-1.5 bg-red-500 rounded-full animate-pulse" />
        </button>
      </header>

      <div className="max-w-[1000px] mx-auto flex gap-8 lg:px-8">
        {/* Main Feed Content */}
        <main className="flex-1 w-full max-w-[630px] pt-4 pb-20 md:pb-8">
          {/* Stories Bar - Instagram Style */}
          <div className="mb-6 flex gap-4 overflow-x-auto pb-3 scrollbar-hide px-4 md:px-0 border-b border-zinc-900/30">
            {/* Seu Story Button (Matches screenshot with blue bottom-right border plus icon) */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowStoryCreate(true)}
              className="flex flex-col items-center gap-1.5 shrink-0 group relative cursor-pointer"
            >
              <div className="relative h-[68px] w-[68px] rounded-full p-[2.5px] bg-zinc-900 border border-zinc-900 overflow-visible transition-transform">
                <div className="h-full w-full rounded-full overflow-hidden bg-zinc-800">
                  {profile?.photoURL ? (
                    <img
                      src={profile.photoURL}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xs font-bold text-zinc-400">
                      {profile?.displayName?.[0] || 'U'}
                    </div>
                  )}
                </div>
                {/* Plus circle button layered at bottom right (matches the screenshot) */}
                <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-0.5 border-2 border-black h-5 w-5 flex items-center justify-center">
                  <Plus className="h-3.5 w-3.5 text-white stroke-[3px]" />
                </div>
              </div>
              <span className="text-[11px] font-normal text-zinc-400 truncate w-16 text-center">
                Seu story
              </span>
            </motion.button>

            {/* List of active stories */}
            {stories.map((story, index) => {
              // Get clean lowercase username with no '@' prefix, matching the screenshot
              const cleanUsername = story.author?.username
                ? story.author.username.toLowerCase()
                : "usuario";

              return (
                <motion.button
                  key={story.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSelectedStory(story);
                    setSelectedStoryIndex(index);
                  }}
                  className="flex flex-col items-center gap-1.5 shrink-0 outline-none group cursor-pointer"
                >
                  <div className="h-[68px] w-[68px] rounded-full bg-gradient-to-tr from-[#fbc02d] via-[#e91e63] to-[#9c27b0] p-[2.5px] transition-transform">
                    <div className="h-full w-full rounded-full border-2 border-black overflow-hidden bg-zinc-900">
                      <img
                        src={story.imageUrl}
                        alt="Story"
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                  {/* Lowercase, clean plain username (no @ prefix, matches screenshot) */}
                  <span className="text-[11px] font-normal text-zinc-300 truncate w-16 text-center leading-tight">
                    {cleanUsername}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* Posts Feed */}
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-700" />
              </div>
            ) : posts.length > 0 ? (
              posts.map((post) => (
                <FeedPost
                  key={post.id}
                  post={post}
                  user={user}
                  navigate={navigate}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-800 py-32 text-center">
                <ImageIcon className="mb-4 h-12 w-12 text-zinc-800" />
                <h3 className="mb-1 text-lg font-black text-zinc-400 uppercase tracking-widest italic leading-none">
                  Vazio absoluto
                </h3>
                <p className="text-sm text-zinc-600 font-bold uppercase tracking-tight">
                  Estamos esperando sua sabedoria brilhar.
                </p>
              </div>
            )}
          </div>
        </main>

        {/* Sidebar Suggestions - Instagram style */}
        <aside className="hidden lg:block w-[320px] py-12 sticky top-0 h-fit">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full overflow-hidden border border-zinc-800">
                <img
                  src={profile?.photoURL || ""}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-bold text-white italic">
                  @{profile?.username}
                </span>
                <span className="text-xs text-zinc-500">
                  {profile?.displayName}
                </span>
              </div>
            </div>
            <button className="text-[10px] font-black text-urucum uppercase tracking-widest">
              Mudar
            </button>
          </div>

          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
              Sugeridos para você
            </span>
            <button className="text-[10px] font-black text-white uppercase tracking-widest">
              Ver Tudo
            </button>
          </div>

          <div className="space-y-4">
            {/* Simple list of "Official" or recommended profiles */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-urucum flex items-center justify-center text-[10px] font-black text-white italic">
                  C
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-xs font-bold text-white italic">
                    conectaldeiaofc
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    Perfil Oficial
                  </span>
                </div>
              </div>
              <button className="text-[10px] font-black text-urucum uppercase tracking-widest">
                Seguir
              </button>
            </div>
          </div>

          <div className="mt-12 text-[10px] font-bold text-zinc-700 uppercase tracking-[0.2em] leading-relaxed">
            Sobre • Ajuda • Imprensa • API • Empregos • Privacidade • Termos •
            Localizações • Idioma • Meta Verified
            <div className="mt-4">© 2026 CONECTALDEIAS DE PAJÉ</div>
          </div>
        </aside>
      </div>

      {/* Floating Action Button for Mobile */}
      <button
        onClick={() => setShowCreate(true)}
        className="md:hidden fixed bottom-24 right-6 h-14 w-14 bg-urucum rounded-full flex items-center justify-center text-white shadow-2xl shadow-urucum/40 z-40 active:scale-90 transition-transform"
      >
        <Plus className="h-8 w-8" />
      </button>

      <AnimatePresence>
        {selectedStory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center"
            onClick={() => setSelectedStory(null)}
          >
            {/* Desktop backgrounds */}
            <div className="hidden lg:block absolute inset-0 opacity-20">
              <img
                src={selectedStory.imageUrl}
                className="w-full h-full object-cover blur-3xl"
              />
            </div>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full h-full md:h-[90vh] md:max-w-md md:rounded-3xl overflow-hidden bg-zinc-900 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Leitor de Música do YouTube para Stories em Segundo Plano (Sem anúncios) */}
              {selectedStory && selectedStory.musicAudioUrl && !selectedStory.musicAudioUrl.startsWith('http') && (
                <iframe
                  key={`${selectedStory.id}-${selectedStoryIndex}-${muted}`}
                  src={`https://www.youtube-nocookie.com/embed/${selectedStory.musicAudioUrl}?autoplay=1&mute=${muted ? 1 : 0}&loop=1&playlist=${selectedStory.musicAudioUrl}&controls=0`}
                  className="w-0 h-0 absolute opacity-0 pointer-events-none"
                  allow="autoplay; encrypted-media"
                />
              )}

              {/* Progress Bars */}
              <div className="absolute top-4 left-4 right-4 z-[110] flex gap-1">
                {stories.map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 h-0.5 bg-white/20 rounded-full overflow-hidden"
                  >
                    <div
                      className="h-full bg-white transition-all duration-75"
                      style={{
                        width:
                          i === selectedStoryIndex
                            ? `${storyProgress}%`
                            : i < selectedStoryIndex
                              ? "100%"
                              : "0%",
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Header */}
              <div className="absolute top-8 left-4 right-4 z-[110] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full overflow-hidden border border-white/20">
                    <img
                      src={selectedStory.author?.photoURL || ""}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-white text-xs font-black italic">
                      {selectedStory.author?.displayName}
                    </p>
                    <p className="text-white/50 text-[9px] font-medium uppercase tracking-widest">
                      {selectedStory.createdAt
                        ? formatDistanceToNow(
                            selectedStory.createdAt.toDate(),
                            { addSuffix: true, locale: ptBR },
                          )
                        : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {selectedStory.mentionedUsers?.includes(
                    profile?.username?.toLowerCase() || "",
                  ) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRepost(selectedStory);
                      }}
                      className="bg-urucum hover:bg-red-700 text-white p-1 rounded-full transition-all flex items-center gap-1 text-[9px] font-black uppercase px-2 tracking-wider"
                    >
                      <RefreshCw
                        className="h-2 w-2 animate-spin"
                        style={{ animationDuration: "4s" }}
                      />
                      <span>Repostar</span>
                    </button>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadStory(selectedStory);
                    }}
                    title="Baixar Foto"
                    className="text-white hover:text-zinc-300 p-1.5 bg-black/40 rounded-full transition-all"
                  >
                    <Download className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => setSelectedStory(null)}
                    className="text-white h-6 w-6 flex items-center justify-center p-1 bg-black/40 hover:bg-black/60 rounded-full transition-all"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Music & Mention stickers on top of the story */}
              {selectedStory.musicTitle && (
                <div className="absolute top-24 left-4 z-[110] bg-black/60 text-white backdrop-blur-md rounded-full px-3 py-1.5 flex items-center gap-2 border border-white/10 max-w-[85%] text-[9px] uppercase font-black tracking-widest pointer-events-none">
                  <Music
                    className="h-3 w-3 text-urucum animate-spin"
                    style={{ animationDuration: "3s" }}
                  />
                  <span className="truncate">
                    {selectedStory.musicTitle} - {selectedStory.musicArtist}
                  </span>
                </div>
              )}

              {selectedStory.mentionedUsers &&
                selectedStory.mentionedUsers.length > 0 && (
                  <div className="absolute top-36 left-4 z-[110] flex flex-wrap gap-1.5 max-w-[85%] pointer-events-none">
                    {selectedStory.mentionedUsers.map((username, idx) => (
                      <span
                        key={idx}
                        className="bg-urucum text-white text-[9px] font-black uppercase tracking-wider rounded-full px-2.5 py-1 border border-urucum/20 leading-none"
                      >
                        @{username}
                      </span>
                    ))}
                  </div>
                )}

              {/* Main Content */}
              {selectedStory.type === "video" ? (
                selectedStory.imageUrl ? (
                  <video
                    src={selectedStory.imageUrl}
                    className="h-full w-full object-cover"
                    autoPlay
                    playsInline
                    loop
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-zinc-950">
                    <PlayCircle className="h-12 w-12 text-zinc-900" />
                  </div>
                )
              ) : selectedStory.imageUrl ? (
                <img
                  src={selectedStory.imageUrl}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-zinc-950">
                  <ImageIcon className="h-12 w-12 text-zinc-900" />
                </div>
              )}

              {/* Tap Areas for Navigation */}
              <div className="absolute inset-x-0 inset-y-20 flex z-50">
                <div
                  className="w-1/3 h-full cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevStory();
                  }}
                />
                <div
                  className="w-2/3 h-full cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextStory();
                  }}
                />
              </div>

              {/* Footer / Reply */}
              <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent z-[110]">
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-white/10 backdrop-blur-md border border-white/10 rounded-full px-5 py-3">
                    <input
                      type="text"
                      placeholder={`Responder a @${selectedStory.author?.username}...`}
                      className="bg-transparent border-none text-white text-xs w-full focus:outline-none placeholder:text-white/40"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <button className="text-white h-6 w-6">
                    <Heart className="h-6 w-6" />
                  </button>
                  <button className="text-white h-6 w-6">
                    <Send className="h-6 w-6" />
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Side Navigation for Desktop */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrevStory();
              }}
              className="hidden lg:flex absolute left-8 top-1/2 -translate-y-1/2 h-10 w-10 bg-white/10 rounded-full items-center justify-center text-white hover:bg-white/20 transition-all"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNextStory();
              }}
              className="hidden lg:flex absolute right-8 top-1/2 -translate-y-1/2 h-10 w-10 bg-white/10 rounded-full items-center justify-center text-white hover:bg-white/20 transition-all"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </motion.div>
        )}

        {(showCreate || showStoryCreate) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-lg rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl"
            >
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">
                  {showStoryCreate ? "Adicionar ao Stories" : "Criar novo post"}
                </h3>
                <button
                  onClick={() => {
                    setShowCreate(false);
                    setShowStoryCreate(false);
                    setIsPlayingPreview(null);
                  }}
                  className="text-zinc-400 hover:text-white"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form
                onSubmit={
                  showStoryCreate ? handleCreateStory : handleCreatePost
                }
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">
                    Mídia ({showStoryCreate ? "Story" : "Post"})
                  </label>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-800 rounded-xl cursor-pointer hover:bg-zinc-950/50 hover:border-urucum/50 transition-all group">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-3 text-zinc-500 group-hover:text-urucum" />
                      <p className="mb-2 text-sm text-zinc-500 group-hover:text-zinc-400">
                        <span className="font-semibold">
                          Clique para enviar
                        </span>{" "}
                        ou arraste
                      </p>
                      <p className="text-xs text-zinc-600 uppercase tracking-widest">
                        PNG, JPG, MP4 (Máx. 1MB)
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*,video/*"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>

                {newImageUrl && (
                  <div className="aspect-video w-full overflow-hidden rounded-xl bg-zinc-950 border border-zinc-800">
                    {newMediaType === "video" ? (
                      <video
                        src={newImageUrl}
                        className="h-full w-full object-cover"
                        controls
                      />
                    ) : (
                      <img
                        src={newImageUrl}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                )}

                {showStoryCreate ? (
                  <div className="space-y-2 pt-2">
                    <label className="text-sm font-medium text-zinc-400">
                      Mencionar originários (Usernames separados por espaço ou vírgula)
                    </label>
                    <input
                      type="text"
                      value={mentionedUsernames}
                      onChange={(e) => setMentionedUsernames(e.target.value)}
                      placeholder="Ex: @josemar_pires, @paje_xingu"
                      className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-urucum/50 text-sm"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400">
                      Legenda
                    </label>
                    <textarea
                      value={newCaption}
                      onChange={(e) => setNewCaption(e.target.value)}
                      placeholder="Escreva algo sobre este momento..."
                      className="h-24 w-full resize-none rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-2 text-white outline-none focus:ring-2 focus:ring-urucum/50"
                    />
                  </div>
                )}

                {/* Unified YouTube soundtrack selector block for both stories and posts */}
                <div className="space-y-3 pt-2">
                  <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                    <Music className="h-4 w-4 text-urucum" />
                    Trilha Sonora do YouTube (Opcional - Busque e escolha)
                  </label>

                  {/* Search bar inside Creator modal */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={ytSearchTerm}
                        onChange={(e) => setYtSearchTerm(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleYtSearch(ytSearchTerm);
                          }
                        }}
                        placeholder="Busque música indígena, rituais, MPB..."
                        className="w-full rounded-xl bg-zinc-950 border border-zinc-800 pl-10 pr-4 py-2 text-xs text-white outline-none focus:ring-2 focus:ring-urucum/50"
                      />
                      <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleYtSearch(ytSearchTerm)}
                      disabled={ytSearching}
                      className="px-4 py-2 text-xs font-black uppercase tracking-wider bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-all border border-zinc-700 flex items-center gap-1.5"
                    >
                      {ytSearching ? (
                        <Loader2 className="h-3 w-3 animate-spin text-white" />
                      ) : (
                        "Buscar 🔍"
                      )}
                    </button>
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-2 border border-zinc-850 rounded-xl p-3 bg-zinc-950">
                    {ytSearching ? (
                      <div className="flex flex-col items-center justify-center py-4 text-zinc-500 gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-urucum" />
                        <span className="text-[10px] font-medium">Buscando faixas no YouTube...</span>
                      </div>
                    ) : ytSearchResults.length === 0 ? (
                      <div className="text-center text-xs text-zinc-500 py-4">
                        Nenhuma música indígena listada. Digite acima para encontrar!
                      </div>
                    ) : (
                      ytSearchResults.map((song) => {
                        const isSelected = selectedCreationSong?.id === song.id;
                        const isPreviewing = isPlayingPreview === song.id;
                        return (
                          <div
                            key={song.id}
                            className={cn(
                              "flex items-center justify-between p-2 rounded-lg transition-all border",
                              isSelected
                                ? "bg-urucum/10 border-urucum"
                                : "border-transparent bg-zinc-900/40 hover:bg-zinc-900",
                            )}
                          >
                            <div className="flex flex-col max-w-[55%]">
                              <span className="text-xs font-bold text-white leading-tight truncate">
                                {song.title}
                              </span>
                              <span className="text-[10px] text-zinc-500 truncate">
                                {song.artist}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleYtSearch(song.title)}
                                className="hidden"
                              />
                              <button
                                type="button"
                                onClick={() => handleTogglePreview(song)}
                                className={cn(
                                  "px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded border transition-all",
                                  isPreviewing
                                    ? "bg-urucum text-white border-urucum animate-pulse"
                                    : "bg-zinc-850 hover:bg-zinc-800 text-zinc-400 border-zinc-800 hover:text-white"
                                )}
                              >
                                {isPreviewing ? "Parar" : "Ouvir"}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedCreationSong(
                                    isSelected ? null : song,
                                  )
                                }
                                className={cn(
                                  "px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded border transition-all",
                                  isSelected
                                    ? "bg-emerald-600 border-emerald-500 text-white"
                                    : "bg-zinc-850 hover:bg-zinc-800 text-zinc-400 border-zinc-800 hover:text-white",
                                )}
                              >
                                {isSelected ? "Remover" : "Escolher"}
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Selected Track Indicator */}
                  {selectedCreationSong && (
                    <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Music className="h-4 w-4 text-emerald-500 animate-pulse" />
                        <div>
                          <p className="text-xs font-bold text-white">{selectedCreationSong.title}</p>
                          <p className="text-[10px] text-zinc-500">{selectedCreationSong.artist}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedCreationSong(null)}
                        className="text-xs text-red-500 font-bold hover:underline"
                      >
                        Limpar Trilha
                      </button>
                    </div>
                  )}

                  {/* Background iframe to play preview in creator modal */}
                  {isPlayingPreview && !isPlayingPreview.startsWith('http') && (
                    <iframe
                      key={`preview-${isPlayingPreview}`}
                      src={`https://www.youtube-nocookie.com/embed/${isPlayingPreview}?autoplay=1&controls=0`}
                      className="w-0 h-0 absolute opacity-0 pointer-events-none"
                      allow="autoplay; encrypted-media"
                    />
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isPosting || !newImageUrl}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-urucum py-3 font-semibold text-white transition-all hover:bg-red-700 disabled:opacity-50"
                >
                  {isPosting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Publicar"
                  )}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] bg-zinc-900 border border-zinc-800 text-white px-6 py-3.5 rounded-full shadow-2xl flex items-center gap-3 text-xs font-black uppercase tracking-wider"
          >
            <span className="h-2 w-2 rounded-full bg-urucum animate-ping" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
