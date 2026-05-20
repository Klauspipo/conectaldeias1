export interface Song {
  id: string;
  title: string;
  artist: string;
  audioUrl: string; // Real play URL
  youtubeUrl: string; // Reference
}

export const POPULAR_SONGS: Song[] = [
  {
    id: 'song1',
    title: 'Canto da Floresta (Kunumi)',
    artist: 'Originários Beat',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    youtubeUrl: 'https://youtube.com/watch?v=forest-canto'
  },
  {
    id: 'song2',
    title: 'Awê de Resistência',
    artist: 'Guerreiros do Xingu',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    youtubeUrl: 'https://youtube.com/watch?v=awe-resistencia'
  },
  {
    id: 'song3',
    title: 'Sopro da Mãe Terra',
    artist: 'Pajé Cura & Tambor',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    youtubeUrl: 'https://youtube.com/watch?v=sopro-terra'
  },
  {
    id: 'song4',
    title: 'Toré Ancestral',
    artist: 'Ritual Sagrado',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    youtubeUrl: 'https://youtube.com/watch?v=tore-ancestral'
  },
  {
    id: 'song5',
    title: 'Eco das Aldeias',
    artist: 'Conexão Originária',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    youtubeUrl: 'https://youtube.com/watch?v=eco-aldeias'
  },
  {
    id: 'song6',
    title: 'Ritmo da Lua Cheia',
    artist: 'Pajé Pajurá',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
    youtubeUrl: 'https://youtube.com/watch?v=ritmo-lua'
  },
  {
    id: 'song7',
    title: 'Flauta dos Antigos',
    artist: 'Yawanawá Cantos',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
    youtubeUrl: 'https://youtube.com/watch?v=flauta-antigos'
  },
  {
    id: 'song8',
    title: 'Bênção do Sol',
    artist: 'Txai Fernando',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    youtubeUrl: 'https://youtube.com/watch?v=bencao-sol'
  },
  {
    id: 'song9',
    title: 'Força da Jurema',
    artist: 'Aldeia Katukina',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
    youtubeUrl: 'https://youtube.com/watch?v=forca-jurema'
  },
  {
    id: 'song10',
    title: 'Dança do Gavião',
    artist: 'Huni Kuin Cantadores',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3',
    youtubeUrl: 'https://youtube.com/watch?v=danca-gaviao'
  },
  {
    id: 'song11',
    title: 'Toré Kariri-Xocó Sagrado',
    artist: 'Guerreiros Kariri-Xocó',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3',
    youtubeUrl: 'https://youtube.com/watch?v=tore-kariri-xoco'
  },
  {
    id: 'song12',
    title: 'Canto Ritualístico Kariri-Xocó',
    artist: 'Aldeia Kariri-Xocó',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3',
    youtubeUrl: 'https://youtube.com/watch?v=canto-kariri-xoco'
  }
];
