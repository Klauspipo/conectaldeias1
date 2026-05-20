import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp, getDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Send, Loader2, User as UserIcon, Search, PlusCircle, MessageSquare, Phone, Video, Flag, AlertTriangle, X, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

interface ChatData {
  id: string;
  participants: string[];
  otherUser?: any;
  lastMessage?: string;
  lastSenderId?: string;
  updatedAt?: any;
}

export default function Messages() {
  const { user, profile, triggerQuotaExceeded } = useAuth();
  const [chats, setChats] = useState<ChatData[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatData | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reporting State
  const [reportingMsg, setReportingMsg] = useState<any | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    // Listen for chats where user is a participant
    const q = query(
      collection(db, 'chats'), 
      where('participants', 'array-contains', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const fetchChatsData = async () => {
        try {
          const chatsData = await Promise.all(
            snap.docs.map(async (d) => {
              const chat = { id: d.id, ...d.data() } as ChatData;
              // Find the other participant to show their info
              const otherId = chat.participants.find((p: string) => p !== user.uid);
              if (!otherId) return chat;
              const otherSnap = await getDoc(doc(db, 'users', otherId)).catch(() => null);
              return { ...chat, otherUser: otherSnap?.exists() ? otherSnap.data() : null };
            })
          );
          setChats(chatsData);
          setLoadingChats(false);
        } catch (err) {
          console.error('Chats processing error:', err);
        }
      };
      
      fetchChatsData();
    }, (err) => {
      console.error('Chats snapshot listener error:', err);
      triggerQuotaExceeded();
    });

    return unsubscribe;
  }, [user, triggerQuotaExceeded]);

  useEffect(() => {
    if (!selectedChat) return;

    const q = query(
      collection(db, `chats/${selectedChat.id}/messages`),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.error('Messages snapshot listener error:', err);
      triggerQuotaExceeded();
    });

    return unsubscribe;
  }, [selectedChat, triggerQuotaExceeded]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    const messageText = newMessage;
    setNewMessage('');

    try {
      await addDoc(collection(db, `chats/${selectedChat.id}/messages`), {
        senderId: user?.uid,
        text: messageText,
        createdAt: serverTimestamp(),
      });

      await setDoc(doc(db, 'chats', selectedChat.id), {
        lastMessage: messageText,
        lastSenderId: user?.uid,
        updatedAt: serverTimestamp(),
      }, { merge: true });

    } catch (err) {
      console.error(err);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingMsg || !reportReason.trim() || !user) return;

    setIsSubmittingReport(true);
    try {
      await addDoc(collection(db, 'reports'), {
        reporterId: user.uid,
        reporterName: profile?.displayName || user.email,
        reportedId: reportingMsg.senderId,
        messageId: reportingMsg.id,
        chatId: selectedChat?.id,
        content: reportingMsg.text,
        reason: reportReason,
        status: 'pending',
        type: 'message',
        createdAt: serverTimestamp(),
      });
      alert('Denúncia enviada com sucesso. Nossa equipe irá analisar.');
      setReportingMsg(null);
      setReportReason('');
    } catch (err) {
      console.error('Error submitting report:', err);
      alert('Erro ao enviar denúncia.');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  return (
    <div className="flex h-full overflow-hidden bg-zinc-950">
      {/* Sidebar List (WhatsApp/Discord Style) */}
      <aside className={cn(
        "flex-col border-r border-zinc-900 bg-zinc-950 transition-all md:flex md:w-80",
        selectedChat ? "hidden md:flex" : "flex w-full"
      )}>
        <div className="p-6 border-b border-urucum/10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-white italic">Aldeias</h2>
            <Link 
              to="/marketplace"
              className="flex items-center gap-2 bg-urucum text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter hover:bg-red-700 transition-all shadow-lg shadow-urucum/20 border border-urucum/30"
            >
              <ShoppingBag className="h-3 w-3" />
              FEIRA DE ARTESANATO
            </Link>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
            <input 
              placeholder="Buscar conversas..."
              className="w-full rounded-xl bg-zinc-950 border border-zinc-900 px-10 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-urucum/30 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 p-2">
          {loadingChats ? (
            <div className="p-8 text-center"><Loader2 className="animate-spin h-6 w-6 m-auto text-zinc-800" /></div>
          ) : chats.length > 0 ? (
            chats.map(chat => (
              <button
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className={cn(
                  "w-full flex items-center gap-3 p-4 rounded-2xl transition-colors",
                  selectedChat?.id === chat.id 
                    ? "bg-urucum/10 border border-urucum/20" 
                    : "hover:bg-zinc-900 border border-transparent"
                )}
              >
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-zinc-800">
                  {chat.otherUser?.photoURL ? (
                    <img src={chat.otherUser.photoURL} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-zinc-800 text-zinc-600 font-bold">
                       {chat.otherUser?.displayName?.[0] || 'U'}
                    </div>
                  )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex justify-between items-baseline">
                    <h4 className="font-bold text-white truncate">{chat.otherUser?.displayName}</h4>
                    <span className="text-[10px] text-zinc-600 shrink-0 capitalize">
                      {chat.updatedAt && formatDistanceToNow(chat.updatedAt.toDate(), { locale: ptBR })}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 truncate mt-0.5">
                    {chat.lastSenderId === user?.uid ? 'Você: ' : ''}{chat.lastMessage || 'Nova conversa'}
                  </p>
                </div>
              </button>
            ))
          ) : (
            <div className="p-8 text-center">
              <p className="text-zinc-600 text-sm">Nenhuma conversa ainda.</p>
            </div>
          )}
        </div>
      </aside>

      {/* Chat Window */}
      <section className={cn(
        "flex-1 flex flex-col bg-zinc-950 relative",
        !selectedChat ? "hidden md:flex items-center justify-center" : "flex"
      )}>
        {selectedChat ? (
          <>
            <header className="flex h-20 items-center justify-between border-b border-zinc-900 bg-zinc-950/50 px-6 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSelectedChat(null)}
                  className="md:hidden text-zinc-500 hover:text-white"
                >
                  <Search className="h-5 w-5 rotate-90" />
                </button>
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-zinc-800">
                   {selectedChat.otherUser?.photoURL ? (
                    <img src={selectedChat.otherUser.photoURL} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-zinc-800 text-zinc-600 font-bold">
                       {selectedChat.otherUser?.displayName?.[0] || 'U'}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-white">{selectedChat.otherUser?.displayName}</h3>
                  <p className="text-[10px] text-green-500 font-semibold tracking-widest uppercase">Online</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="text-zinc-500 hover:text-ochre transition-colors p-2 rounded-full hover:bg-zinc-900">
                  <Phone className="h-5 w-5" />
                </button>
                <button className="text-zinc-500 hover:text-forest transition-colors p-2 rounded-full hover:bg-zinc-900">
                  <Video className="h-5 w-5" />
                </button>
              </div>
            </header>

            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-4"
            >
              <div className="flex flex-col gap-2">
                {messages.map(msg => (
                  <div 
                    key={msg.id}
                    className={cn(
                      "group relative max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                      msg.senderId === user?.uid 
                        ? "ml-auto bg-urucum text-white rounded-br-none shadow-urucum/20" 
                        : "mr-auto bg-zinc-900 text-zinc-200 rounded-bl-none"
                    )}
                  >
                    {msg.text}
                    {msg.senderId !== user?.uid && (
                      <button 
                        onClick={() => setReportingMsg(msg)}
                        className="absolute -right-10 top-1/2 -translate-y-1/2 p-2 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-600 hover:text-red-500"
                        title="Denunciar"
                      >
                        <Flag className="h-4 w-4" />
                      </button>
                    )}
                    <div className={cn(
                      "text-[9px] mt-1 opacity-50 text-right",
                      msg.senderId === user?.uid ? "text-red-100" : "text-zinc-500"
                    )}>
                      {msg.createdAt && formatDistanceToNow(msg.createdAt.toDate(), { locale: ptBR })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <footer className="p-6">
              <form 
                onSubmit={handleSendMessage}
                className="flex items-center gap-2 rounded-2xl bg-zinc-900 border border-urucum/10 p-2 shadow-2xl focus-within:ring-1 focus-within:ring-urucum/50 transition-all"
              >
                <input 
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Envie uma mensagem..."
                  className="flex-1 bg-transparent px-4 py-2 text-white outline-none placeholder:text-zinc-600"
                />
                <button 
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="rounded-xl bg-urucum p-3 text-white transition-all hover:bg-red-700 disabled:opacity-30 active:scale-95 shadow-lg shadow-urucum/20"
                >
                  <Send className="h-5 w-5" />
                </button>
              </form>
            </footer>
          </>
        ) : (
          <div className="text-center space-y-4 px-6">
            <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-3xl bg-zinc-900 border border-zinc-800 text-zinc-700 shadow-2xl">
              <MessageSquare className="h-10 w-10" />
            </div>
            <h2 className="text-xl font-bold text-zinc-300">Suas Mensagens</h2>
            <p className="text-zinc-600 max-w-xs mx-auto">Selecione uma conversa para começar a falar ou encontre novas pessoas no Descobrir.</p>
          </div>
        )}

        {/* Reporting Modal */}
        <AnimatePresence>
          {reportingMsg && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setReportingMsg(null)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative w-full max-w-md rounded-3xl bg-zinc-900 border border-zinc-800 p-8 shadow-2xl"
              >
                <div className="flex items-center gap-3 text-red-500 mb-6">
                  <AlertTriangle className="h-6 w-6" />
                  <h3 className="text-xl font-bold text-white">Denunciar Mensagem</h3>
                </div>

                <p className="text-zinc-500 text-sm mb-6">
                  Você está denunciando a mensagem: <br />
                  <span className="text-zinc-300 italic">"{reportingMsg.text}"</span>
                </p>

                <form onSubmit={handleReportSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-zinc-600">Motivo da Denúncia</label>
                    <textarea 
                      required
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      placeholder="Descreva o que há de errado..."
                      className="w-full h-32 rounded-2xl bg-zinc-950 border border-zinc-800 p-4 text-white text-sm outline-none focus:ring-1 focus:ring-red-500 transition-all resize-none"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button 
                      type="button"
                      onClick={() => setReportingMsg(null)}
                      className="flex-1 rounded-xl bg-zinc-800 px-6 py-3 text-sm font-bold text-white hover:bg-zinc-700 transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      disabled={isSubmittingReport}
                      className="flex-1 rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white hover:bg-red-500 transition-all shadow-lg shadow-red-500/20 disabled:opacity-50"
                    >
                      {isSubmittingReport ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Enviar Denúncia'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
