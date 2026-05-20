import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Hash, Users, Calendar, Plus, MessageSquare, Shield, Megaphone, MapPin, Clock, Info, X, Camera, Send, ChevronRight, Image as ImageIcon, Trash2 } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ImageCropper from '../components/ImageCropper';

interface Event {
  id: string;
  title: string;
  description: string;
  date: any;
  location: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  type: 'ritual' | 'encontro' | 'protesto' | 'assembleia';
  category: string;
  imageUrl?: string;
}

const CHANNELS = [
  { id: 'announcements', name: 'anuncios da rede', icon: Megaphone, type: 'text' },
  { id: 'events', name: 'agenda indigena', icon: Calendar, type: 'events' },
  { id: 'general', name: 'geral aldeias', icon: Hash, type: 'text' },
  { id: 'rituals', name: 'rituais e cultura', icon: Shield, type: 'text' },
  { id: 'market', name: 'feira solidaria', icon: Users, type: 'text' },
];

export default function Villages() {
  const { user, profile, triggerQuotaExceeded } = useAuth();
  const [activeChannel, setActiveChannel] = useState(CHANNELS[1]); // Default to events
  const [events, setEvents] = useState<Event[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropTarget, setCropTarget] = useState<'event' | 'chat'>('event');
  const [activeRegion, setActiveRegion] = useState('Todas');
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [chatPhotoTemp, setChatPhotoTemp] = useState<string | null>(null);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    type: 'encontro' as Event['type'],
    imageUrl: ''
  });

  const REGIONS = [
    { id: 'Todas', name: 'Geral 🇧🇷' },
    { id: 'Norte', name: 'Norte 🌲' },
    { id: 'Nordeste', name: 'Nordeste 🏜️' },
    { id: 'Centro-Oeste', name: 'Centro-Oeste 🐆' },
    { id: 'Sudeste', name: 'Sudeste ⛰️' },
    { id: 'Sul', name: 'Sul ❄️' }
  ];

  const FUN_EXPRESSIONS = [
    { label: '👋 Anauê!', text: 'Anauê! (Minha saudação fraterna!)' },
    { label: '🛡️ Demarcação Já!', text: 'Demarcação Já! ✊🏽' },
    { label: '🏹 Awê!', text: 'Awê! (Força e União!)' },
    { label: '✨ Katu!', text: 'Katu! (Tudo bem!)' },
    { label: '🌎 Yby!', text: 'Yby! (Mãe terra!)' }
  ];

  useEffect(() => {
    if (activeChannel.type === 'events') {
      const q = query(collection(db, 'village_events'), orderBy('date', 'asc'));
      const unsub = onSnapshot(q, (snap) => {
        setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Event));
      }, (err) => {
        console.error("Events snapshot listener error:", err);
        triggerQuotaExceeded();
      });
      return unsub;
    } else if (activeChannel.type === 'text') {
      const q = query(collection(db, 'village_messages'), orderBy('createdAt', 'asc'));
      const unsub = onSnapshot(q, (snap) => {
        const msgs = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter((msg: any) => msg.channelId === activeChannel.id);
        setMessages(msgs);
        
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      }, (err) => {
        console.error("Messages snapshot listener error:", err);
        triggerQuotaExceeded();
      });
      return unsub;
    }
  }, [activeChannel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    try {
      const eventDate = new Date(`${newEvent.date}T${newEvent.time}`);
      await addDoc(collection(db, 'village_events'), {
        ...newEvent,
        date: eventDate,
        authorId: user.uid,
        authorName: profile.displayName,
        authorPhoto: profile.photoURL || '',
        createdAt: serverTimestamp()
      });
      setShowCreateEvent(false);
      setNewEvent({ title: '', description: '', date: '', time: '', location: '', type: 'encontro', imageUrl: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (textToSend?: string, customImage?: string) => {
    const contentText = textToSend !== undefined ? textToSend : messageText;
    if ((!contentText.trim() && !customImage) || !user || !profile || sending) return;
    setSending(true);

    try {
      await addDoc(collection(db, 'village_messages'), {
        channelId: activeChannel.id,
        authorId: user.uid,
        authorName: profile.displayName,
        authorPhoto: profile.photoURL || '',
        text: contentText,
        imageUrl: customImage || '',
        region: activeChannel.id === 'general' ? activeRegion : 'Geral',
        createdAt: serverTimestamp()
      });
      if (textToSend === undefined && !customImage) {
        setMessageText('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-full bg-zinc-950 rounded-3xl overflow-hidden border border-zinc-900 shadow-2xl">
      {/* Discord-style Channels Sidebar */}
      <aside className="w-16 md:w-60 bg-zinc-900/50 flex flex-col border-r border-zinc-900 shrink-0">
        <div className="h-16 px-4 flex items-center border-b border-zinc-900 shadow-sm">
           <span className="hidden md:block text-sm font-black text-white uppercase tracking-widest italic">CONECTA SERVIDOR</span>
           <Hash className="md:hidden h-6 w-6 text-urucum mx-auto" />
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
           {CHANNELS.map((channel) => (
             <button
               key={channel.id}
               onClick={() => {
                 setActiveChannel(channel);
                 setChatPhotoTemp(null);
                 setMessageText('');
               }}
               className={cn(
                 "w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all group",
                 activeChannel.id === channel.id 
                   ? "bg-urucum/10 text-urucum" 
                   : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
               )}
             >
               <channel.icon className={cn(
                 "h-5 w-5 shrink-0",
                 activeChannel.id === channel.id ? "text-urucum" : "text-zinc-600 group-hover:text-zinc-400"
               )} />
               <span className="hidden md:block text-sm font-bold truncate">{channel.name}</span>
             </button>
           ))}
        </div>

        <div className="p-3 border-t border-zinc-900 bg-zinc-950/30">
           <div className="hidden md:flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-urucum flex items-center justify-center text-[10px] font-black text-white">
                 {profile?.displayName?.[0]}
              </div>
              <div className="min-w-0">
                 <p className="text-xs font-bold text-white truncate">{profile?.displayName}</p>
                 <p className="text-[10px] text-zinc-650 font-medium">Online</p>
              </div>
           </div>
        </div>
      </aside>

      {/* Main Server Content */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        <header className="h-16 px-6 flex items-center justify-between border-b border-zinc-900 bg-zinc-950/50 backdrop-blur-md">
           <div className="flex items-center gap-3">
              <activeChannel.icon className="h-5 w-5 text-zinc-500" />
              <h2 className="text-sm font-black text-white uppercase tracking-widest">{activeChannel.name}</h2>
           </div>
           {activeChannel.type === 'events' && (
             <button 
               onClick={() => setShowCreateEvent(true)}
               className="bg-urucum hover:bg-red-650 text-white p-2 md:px-4 md:py-1.5 rounded-lg text-[10px] font-black flex items-center gap-2 transition-all shadow-lg shadow-urucum/20 uppercase tracking-widest"
             >
               <Plus className="h-4 w-4" />
               <span className="hidden md:block">Novo Evento</span>
             </button>
           )}
        </header>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col h-[calc(100vh-8rem)]">
           {activeChannel.type === 'events' ? (
             <div className="max-w-2xl mx-auto space-y-6 pb-20 w-full">
                <div className="bg-gradient-to-br from-urucum/10 to-transparent p-8 rounded-3xl border border-urucum/20 mb-10">
                   <Megaphone className="h-10 w-10 text-urucum mb-4" />
                   <h1 className="text-3xl font-black text-white italic tracking-tighter">AGENDA DA RESISTÊNCIA</h1>
                   <p className="text-zinc-500 text-sm mt-2">Aqui marcamos rituais, encontros, protestos e assembleias dos povos originários.</p>
                </div>

                {events.length > 0 ? events.map(event => (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={event.id}
                    className="group bg-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden hover:border-urucum/30 transition-all shadow-xl"
                  >
                    {event.imageUrl && (
                      <div className="h-48 w-full relative overflow-hidden border-b border-zinc-950">
                        <img 
                          src={event.imageUrl} 
                          alt={event.title} 
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
                      </div>
                    )}
                    <div className="p-6">
                       <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                             <div className="h-10 w-10 rounded-2xl bg-zinc-805 flex items-center justify-center">
                                {event.type === 'ritual' && <Shield className="h-6 w-6 text-ochre" />}
                                {event.type === 'encontro' && <Users className="h-6 w-6 text-forest" />}
                                {event.type === 'protesto' && <Megaphone className="h-6 w-6 text-urucum" />}
                                {event.type === 'assembleia' && <Shield className="h-6 w-6 text-white" />}
                             </div>
                             <div>
                                <h3 className="text-lg font-black text-white italic">{event.title}</h3>
                                <div className="flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                                   <span>Organizado por</span>
                                   <span className="text-urucum">@{event.authorName}</span>
                                </div>
                             </div>
                          </div>
                          <div className="bg-zinc-800 px-3 py-1 rounded-full text-[9px] font-black text-zinc-400 uppercase tracking-tighter">
                             {event.type}
                          </div>
                       </div>
                       
                       <p className="text-zinc-400 text-sm leading-relaxed mb-6">{event.description}</p>
                       
                       <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center gap-3 bg-zinc-950 p-3 rounded-2xl border border-zinc-800/50">
                             <Calendar className="h-5 w-5 text-urucum" />
                             <div>
                                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Data</p>
                                <p className="text-xs font-bold text-zinc-200">{event.date?.toDate ? format(event.date.toDate(), "dd 'de' MMM", { locale: ptBR }) : 'Em breve'}</p>
                             </div>
                          </div>
                          <div className="flex items-center gap-3 bg-zinc-950 p-3 rounded-2xl border border-zinc-800/50">
                             <MapPin className="h-5 w-5 text-forest" />
                             <div>
                                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Local</p>
                                <p className="text-xs font-bold text-zinc-200 truncate">{event.location}</p>
                             </div>
                          </div>
                       </div>
                    </div>
                    <div className="bg-zinc-950/50 px-6 py-4 flex items-center justify-between border-t border-zinc-800">
                       <div className="flex -space-x-2">
                          {[1,2,3].map(i => (
                            <div key={i} className="h-6 w-6 rounded-full bg-zinc-800 border-2 border-zinc-950" />
                          ))}
                          <div className="h-6 w-6 rounded-full bg-urucum flex items-center justify-center text-[8px] font-black text-white italic">+12</div>
                       </div>
                       <button className="text-[10px] font-black text-urucum uppercase tracking-[0.2em] hover:underline">Ver detalhes</button>
                    </div>
                  </motion.div>
                )) : (
                  <div className="py-20 text-center">
                     <p className="text-zinc-600 italic">Nenhum evento agendado neste momento.</p>
                  </div>
                )}
             </div>
           ) : (
             <div className="flex flex-col h-full overflow-hidden w-full">
                {/* Subdivision Regions Bar for General Chat */}
                {activeChannel.id === 'general' && (
                  <div className="flex items-center gap-2 pb-3 mb-3 border-b border-zinc-900/50 overflow-x-auto no-scrollbar shrink-0">
                    {REGIONS.map((region) => (
                      <button
                        key={region.id}
                        type="button"
                        onClick={() => {
                          setActiveRegion(region.id);
                        }}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-[10px] font-black tracking-wider uppercase border transition-all shrink-0 flex items-center gap-1.5",
                          activeRegion === region.id
                            ? "bg-urucum text-white border-urucum shadow-lg shadow-urucum/20 scale-[1.03]"
                            : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                        )}
                      >
                        {region.name}
                      </button>
                    ))}
                  </div>
                )}

                {/* Secure Chat Stream */}
                <div className="flex-1 overflow-y-auto px-2 space-y-4 mb-4 select-text">
                  {(activeChannel.id === 'general' && activeRegion !== 'Todas'
                    ? messages.filter(m => m.region === activeRegion)
                    : messages
                  ).length > 0 ? (
                    (activeChannel.id === 'general' && activeRegion !== 'Todas'
                      ? messages.filter(m => m.region === activeRegion)
                      : messages
                    ).map((msg, idx) => {
                      const isMe = msg.authorId === user?.uid;
                      const hasImage = !!msg.imageUrl;
                      const isSystemHighlight = msg.text?.includes('!') && (
                        msg.text?.includes('saudação') || 
                        msg.text?.includes('demarcação') || 
                        msg.text?.includes('Demarcação') || 
                        msg.text?.includes('Anauê') || 
                        msg.text?.includes('Awê') || 
                        msg.text?.includes('Katu')
                      );

                      return (
                        <div
                          key={msg.id || idx}
                          className={cn(
                            "flex items-start gap-3 max-w-[85%] md:max-w-[70%] transition-all",
                            isMe ? "ml-auto flex-row-reverse" : "mr-auto"
                          )}
                        >
                          {/* Avatar */}
                          <div className="h-9 w-9 rounded-full bg-zinc-800 border border-zinc-700 shrink-0 overflow-hidden relative shadow-sm">
                            {msg.authorPhoto ? (
                              <img src={msg.authorPhoto} alt={msg.authorName} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center font-black text-xs text-white uppercase bg-urucum/25 text-urucum">
                                {msg.authorName?.[0] || 'U'}
                              </div>
                            )}
                          </div>

                          {/* Message bubble */}
                          <div className="space-y-1 w-full flex-1">
                            {/* Author label and time */}
                            <div className={cn(
                              "flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase",
                              isMe ? "justify-end" : "justify-start"
                            )}>
                              <span className={cn(isMe ? "text-urucum" : "text-zinc-300")}>
                                {isMe ? 'Você' : `@${msg.authorName || 'Usuário'}`}
                              </span>
                              {activeChannel.id === 'general' && msg.region && msg.region !== 'Todas' && (
                                <span className="bg-zinc-900 border border-zinc-850 px-1.5 py-0.5 rounded text-[8px] font-black tracking-widest text-urucum uppercase">
                                  {msg.region}
                                </span>
                              )}
                              <span>•</span>
                              <span>
                                {msg.createdAt?.toDate 
                                  ? format(msg.createdAt.toDate(), "HH:mm", { locale: ptBR }) 
                                  : 'Agora'}
                              </span>
                            </div>

                            {/* Main background container */}
                            <div
                              className={cn(
                                "rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-md border-t transition-all",
                                isMe 
                                  ? cn(
                                      "bg-gradient-to-br from-urucum/20 to-zinc-900 border-urucum/30 text-white rounded-tr-none",
                                      isSystemHighlight && "ring-1 ring-urucum shadow-lg shadow-urucum/5"
                                    ) 
                                  : cn(
                                      "bg-zinc-900/90 border-zinc-800 text-zinc-100 rounded-tl-none",
                                      isSystemHighlight && "border-amber-500/30 bg-amber-950/10 text-amber-100"
                                    )
                              )}
                            >
                              {/* If message has custom uploaded image */}
                              {hasImage && (
                                <div className="rounded-xl overflow-hidden mb-2 max-w-full border border-zinc-950 shadow-inner">
                                  <img 
                                    src={msg.imageUrl} 
                                    alt="Imagem enviada" 
                                    className="w-full h-auto object-cover max-h-60 rounded-xl"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                              )}
                              
                              <p className={cn(
                                "whitespace-pre-wrap break-words",
                                isSystemHighlight ? "font-black tracking-tight" : ""
                              )}>
                                {msg.text}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center py-20 opacity-60">
                      <div className="h-16 w-16 rounded-2xl bg-zinc-900 flex items-center justify-center mb-4 border border-zinc-800/40">
                        <MessageSquare className="h-8 w-8 text-zinc-500" />
                      </div>
                      <h3 className="text-base font-black text-white italic">Bem-vindo ao canal #{activeChannel.name}</h3>
                      <p className="text-zinc-500 text-xs mt-1 max-w-xs">Este é o início do histórico de mensagens deste canal. Digite com respeito e segurança.</p>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick actions for expressions to entertain */}
                <div className="px-2 pb-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                  {FUN_EXPRESSIONS.map((expr, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSendMessage(expr.text)}
                      className="px-3 py-1.5 rounded-full bg-zinc-900/70 border border-zinc-800 hover:border-urucum/40 hover:bg-zinc-800 text-xs font-bold text-zinc-300 hover:text-white transition-all shrink-0 flex items-center gap-1"
                    >
                      {expr.label}
                    </button>
                  ))}
                </div>

                {/* Input box */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (chatPhotoTemp) {
                      handleSendMessage(messageText, chatPhotoTemp);
                      setChatPhotoTemp(null);
                    } else {
                      handleSendMessage();
                    }
                  }}
                  className="px-2 pb-4 shrink-0"
                >
                  {/* Photo attachment preview when cropped in state */}
                  {chatPhotoTemp && (
                    <div className="p-3 bg-zinc-900/95 border border-zinc-805 rounded-2xl mb-2 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <img src={chatPhotoTemp} alt="Attachment" className="h-10 w-10 object-cover rounded-lg border border-zinc-950" />
                        <div>
                          <p className="text-xs font-black text-white">Fotografia anexada</p>
                          <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Enquadramento pronto para enviar</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setChatPhotoTemp(null)}
                        className="p-1.5 px-3 rounded-lg bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-white text-xs font-bold transition-colors"
                      >
                        Descartar
                      </button>
                    </div>
                  )}

                  <div className="relative flex items-center">
                    {/* Choose and crop photo to insert inside chat */}
                    <button
                      type="button"
                      onClick={() => {
                        setCropTarget('chat');
                        setShowCropModal(true);
                      }}
                      className="absolute left-4 p-1 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-urucum transition-all z-10"
                      title="Anexar e Cortar Imagem"
                    >
                      <Camera className="h-5 w-5" />
                    </button>

                    <input
                      type="text"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder={
                        activeChannel.id === 'general'
                          ? `Enviar mensagem no Bate Papo Geral (${activeRegion})`
                          : `Enviar mensagem em #${activeChannel.name}`
                      }
                      className="w-full bg-zinc-900 border border-zinc-800 text-sm text-white pl-12 pr-14 py-4 rounded-2xl focus:outline-none focus:border-urucum/65 focus:ring-1 focus:ring-urucum/10 transition-all placeholder:text-zinc-650"
                    />

                    <button
                      type="submit"
                      disabled={sending || (!messageText.trim() && !chatPhotoTemp)}
                      className={cn(
                        "absolute right-4 p-2 rounded-xl transition-all",
                        (messageText.trim() || chatPhotoTemp) && !sending
                          ? "bg-urucum text-white shadow-lg shadow-urucum/20 hover:bg-red-650"
                          : "text-zinc-650 cursor-not-allowed bg-zinc-900"
                      )}
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </form>
             </div>
           )}
        </div>
      </main>

      {/* Create Event Modal */}
      <AnimatePresence>
        {showCreateEvent && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setShowCreateEvent(false)}
               className="absolute inset-0 bg-black/80 backdrop-blur-xl"
             />
             <motion.form 
               onSubmit={handleCreateEvent}
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl"
             >
                <div className="flex items-center justify-between mb-8">
                   <div className="flex items-center gap-3">
                      <Calendar className="h-6 w-6 text-urucum" />
                      <h2 className="text-xl font-black text-white italic uppercase tracking-widest">Novo Evento</h2>
                   </div>
                   <button type="button" onClick={() => setShowCreateEvent(false)} className="text-zinc-500 hover:text-white">
                      <X className="h-6 w-6" />
                   </button>
                </div>

                <div className="space-y-4">
                   <div>
                      <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 pl-1">Título do Evento</label>
                      <input 
                        required
                        type="text" 
                        placeholder="Ex: XII Assembleia Terena"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-3 text-sm text-white focus:outline-none focus:border-urucum/50"
                        value={newEvent.title}
                        onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                      />
                   </div>
                   <div>
                      <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 pl-1">Tipo</label>
                      <select 
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-3 text-sm text-white focus:outline-none focus:border-urucum/50 appearance-none"
                        value={newEvent.type}
                        onChange={e => setNewEvent({...newEvent, type: e.target.value as any})}
                      >
                         <option value="encontro">Encontro / Reunião</option>
                         <option value="ritual">Ritual / Celebração</option>
                         <option value="protesto">Manifestação / Protesto</option>
                         <option value="assembleia">Assembleia Geral</option>
                      </select>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                         <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 pl-1">Data</label>
                         <input 
                           required
                           type="date" 
                           className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-3 text-sm text-white focus:outline-none focus:border-urucum/50"
                           value={newEvent.date}
                           onChange={e => setNewEvent({...newEvent, date: e.target.value})}
                         />
                      </div>
                      <div>
                         <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 pl-1">Hora</label>
                         <input 
                           required
                           type="time" 
                           className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-3 text-sm text-white focus:outline-none focus:border-urucum/50"
                           value={newEvent.time}
                           onChange={e => setNewEvent({...newEvent, time: e.target.value})}
                         />
                      </div>
                   </div>
                   <div>
                      <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 pl-1">Localização</label>
                      <div className="relative">
                         <input 
                           required
                           type="text" 
                           placeholder="Ex: Aldeia Limão Verde / Online"
                           className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-12 py-3 text-sm text-white focus:outline-none focus:border-urucum/50"
                           value={newEvent.location}
                           onChange={e => setNewEvent({...newEvent, location: e.target.value})}
                         />
                         <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-600" />
                      </div>
                   </div>
                   <div>
                      <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 pl-1">Descrição</label>
                      <textarea 
                        required
                        placeholder="Conte mais sobre o objetivo deste evento..."
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-3 text-sm text-white focus:outline-none focus:border-urucum/50 h-32 resize-none"
                        value={newEvent.description}
                        onChange={e => setNewEvent({...newEvent, description: e.target.value})}
                      />
                   </div>
                   <div>
                     <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 pl-1">Fotografia do Evento</label>
                     {newEvent.imageUrl ? (
                       <div className="relative group rounded-2xl overflow-hidden border border-zinc-800 h-32 bg-zinc-950 mb-4">
                         <img src={newEvent.imageUrl} alt="Preview do Evento" className="w-full h-full object-cover" />
                         <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-colors duration-200">
                           <button
                             type="button"
                             onClick={() => {
                               setCropTarget('event');
                               setShowCropModal(true);
                             }}
                             className="bg-zinc-900 border border-zinc-700 hover:border-urucum text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                           >
                             <Camera className="h-3.5 w-3.5" /> Recortar
                           </button>
                           <button
                             type="button"
                             onClick={() => setNewEvent({ ...newEvent, imageUrl: '' })}
                             className="bg-red-950/80 border border-red-800 hover:border-red-650 text-red-100 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                           >
                             <Trash2 className="h-3.5 w-3.5" /> Remover
                           </button>
                         </div>
                       </div>
                     ) : (
                       <button
                         type="button"
                         onClick={() => {
                           setCropTarget('event');
                           setShowCropModal(true);
                         }}
                         className="w-full bg-zinc-950 border border-zinc-800 hover:border-urucum/30 hover:bg-zinc-900/40 rounded-2xl p-4 text-center cursor-pointer flex flex-col items-center justify-center gap-2 transition-all mb-4"
                       >
                         <ImageIcon className="h-6 w-6 text-zinc-500 mx-auto" />
                         <span className="text-xs font-bold text-zinc-400">Adicionar Foto do Evento (Opcional)</span>
                         <span className="text-[10px] text-zinc-600">Com enquadramento e corte interativo</span>
                       </button>
                     )}
                   </div>
                </div>

                <div className="mt-8 flex gap-4">
                   <button 
                     type="button"
                     onClick={() => setShowCreateEvent(false)}
                     className="flex-1 py-4 rounded-2xl border border-zinc-800 text-zinc-400 font-black uppercase tracking-widest text-[10px] hover:bg-zinc-800 transition-all"
                   >
                     Cancelar
                   </button>
                   <button 
                     type="submit"
                     className="flex-1 py-4 bg-urucum hover:bg-red-600 rounded-2xl text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-urucum/20 transition-all"
                   >
                     Publicar
                   </button>
                </div>
             </motion.form>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCropModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg"
            >
              <ImageCropper
                aspectRatio="rect"
                title={cropTarget === 'chat' ? 'Ajustar Imagem do Chat' : 'Novo Enquadramento do Evento'}
                onCancel={() => setShowCropModal(false)}
                onCropComplete={(croppedDataUrl) => {
                  if (cropTarget === 'chat') {
                    setChatPhotoTemp(croppedDataUrl);
                  } else {
                    setNewEvent({ ...newEvent, imageUrl: croppedDataUrl });
                  }
                  setShowCropModal(false);
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
