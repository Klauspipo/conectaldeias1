import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

// Increase payload bounds for Base64 image uploads
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

const DB_FILE = path.join(process.cwd(), 'database.json');

// Live cache of database
let dbData: Record<string, any[]> = {};

// Helper to load db safely
function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const cnt = fs.readFileSync(DB_FILE, 'utf-8');
      dbData = JSON.parse(cnt || '{}');
      console.log('Database loaded successfully from:', DB_FILE);
    } else {
      dbData = {};
      fs.writeFileSync(DB_FILE, '{}', 'utf-8');
      console.log('New database created in:', DB_FILE);
    }
  } catch (err) {
    console.error('Failed to load database. Initializing in-memory.', err);
    dbData = {};
  }
}

// Helper to save db safely
function saveDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), 'utf-8');
  } catch (err) {
    console.error('DB save failed:', err);
  }
}

// Initialize database
loadDB();

// API REST routes
app.get('/api/db', (req, res) => {
  const { path: colPath, id } = req.query;
  if (!colPath || typeof colPath !== 'string') {
    return res.status(400).json({ error: 'Missing path parameter' });
  }

  const list = dbData[colPath] || [];

  if (id && typeof id === 'string') {
    const doc = list.find((item) => item && item.id === id);
    if (!doc) {
      return res.status(404).json({ error: `Doc with ID ${id} not found in ${colPath}` });
    }
    return res.json(doc);
  }

  return res.json(list);
});

app.post('/api/db', (req, res) => {
  const { path: colPath } = req.query;
  if (!colPath || typeof colPath !== 'string') {
    return res.status(400).json({ error: 'Missing path parameter' });
  }

  const body = req.body;
  if (!body.id) {
    body.id = Math.random().toString(36).substring(2, 15);
  }

  if (!dbData[colPath]) {
    dbData[colPath] = [];
  }

  dbData[colPath].push(body);
  saveDB();

  return res.status(201).json(body);
});

app.put('/api/db', (req, res) => {
  const { path: colPath, id } = req.query;
  if (!colPath || typeof colPath !== 'string' || !id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Missing path or id parameter' });
  }

  const body = req.body;
  body.id = id; // Ensure correct ID

  if (!dbData[colPath]) {
    dbData[colPath] = [];
  }

  const index = dbData[colPath].findIndex((item) => item && item.id === id);
  if (index > -1) {
    dbData[colPath][index] = body;
  } else {
    dbData[colPath].push(body);
  }

  saveDB();
  return res.json(body);
});

app.delete('/api/db', (req, res) => {
  const { path: colPath, id } = req.query;
  if (!colPath || typeof colPath !== 'string' || !id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Missing path or id parameter' });
  }

  if (dbData[colPath]) {
    dbData[colPath] = dbData[colPath].filter((item) => item && item.id !== id);
    saveDB();
  }

  return res.json({ status: 'success' });
});

app.get('/api/youtube/search', async (req, res) => {
  const query = req.query.q as string || '';
  console.log('Searching YouTube for:', query);

  const FALLBACK_YT_SEARCH = [
    {
      id: 'S0TbyuPyzS0',
      title: 'Txuã (feat. Mapu Huni Kuin)',
      artist: 'Alok',
      audioUrl: 'S0TbyuPyzS0',
      youtubeUrl: 'https://youtube.com/watch?v=S0TbyuPyzS0'
    },
    {
      id: 'Kz6EAs9-mOk',
      title: 'Demarcação Já (Videoclipe Oficial)',
      artist: 'Vários Artistas da MPB',
      audioUrl: 'Kz6EAs9-mOk',
      youtubeUrl: 'https://youtube.com/watch?v=Kz6EAs9-mOk'
    },
    {
      id: '34d7u6fAnf4',
      title: 'O Rap da Resistência',
      artist: 'Kunumi MC',
      audioUrl: '34d7u6fAnf4',
      youtubeUrl: 'https://youtube.com/watch?v=34d7u6fAnf4'
    },
    {
      id: 'x7Eof14m9tY',
      title: 'Canto Sagrado do Povo Xavante',
      artist: 'Tribo Xavante',
      audioUrl: 'x7Eof14m9tY',
      youtubeUrl: 'https://youtube.com/watch?v=x7Eof14m9tY'
    },
    {
      id: 'Uq_Z8D4YEx0',
      title: 'Cantos Celestiais Huni Kuin',
      artist: 'Aldeia Katukina',
      audioUrl: 'Uq_Z8D4YEx0',
      youtubeUrl: 'https://youtube.com/watch?v=Uq_Z8D4YEx0'
    },
    {
      id: 'E50T-D5uXgA',
      title: 'Canto Sagrado de Cura (Haux Haux)',
      artist: 'Povo Yawanawá',
      audioUrl: 'E50T-D5uXgA',
      youtubeUrl: 'https://youtube.com/watch?v=E50T-D5uXgA'
    },
    {
      id: 'L2G93k7_2Fk',
      title: 'Força da Floresta',
      artist: 'Txai Fernando',
      audioUrl: 'L2G93k7_2Fk',
      youtubeUrl: 'https://youtube.com/watch?v=L2G93k7_2Fk'
    },
    {
      id: '8v_C3q79F_0',
      title: 'Canto do Pajé - Sons de Cura',
      artist: 'Indígenas Fulni-ô',
      audioUrl: '8v_C3q79F_0',
      youtubeUrl: 'https://youtube.com/watch?v=8v_C3q79F_0'
    }
  ];

  if (!query.trim()) {
    return res.json(FALLBACK_YT_SEARCH);
  }

  try {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query + ' indigena cantos')}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });

    if (!response.ok) {
      throw new Error(`YouTube responded with ${response.status}`);
    }

    const html = await response.text();
    const startIdx = html.indexOf('ytInitialData = ');
    if (startIdx === -1) {
      throw new Error('ytInitialData not found in HTML');
    }

    const sub = html.substring(startIdx + 16);
    let depth = 0;
    let endIdx = 0;
    for (let i = 0; i < sub.length; i++) {
      if (sub[i] === '{') depth++;
      else if (sub[i] === '}') {
        depth--;
        if (depth === 0) {
          endIdx = i + 1;
          break;
        }
      }
    }

    const jsonStr = sub.substring(0, endIdx);
    const data = JSON.parse(jsonStr);

    const videos: any[] = [];
    const contents = data.contents?.twoColumnSearchResultRenderer?.primaryContents?.sectionListRenderer?.contents;
    if (contents) {
      const itemSection = contents.find((c: any) => c.itemSectionRenderer);
      const items = itemSection?.itemSectionRenderer?.contents || [];
      for (const item of items) {
        if (item.videoRenderer) {
          const vr = item.videoRenderer;
          const videoId = vr.videoId;
          const title = vr.title?.runs?.[0]?.text || vr.title?.accessibility?.title?.text || '';
          const channelTitle = vr.ownerText?.runs?.[0]?.text || '';

          if (videoId && title) {
            videos.push({
              id: videoId,
              title: title,
              artist: channelTitle || 'YouTube Video',
              audioUrl: videoId,
              youtubeUrl: `https://youtube.com/watch?v=${videoId}`
            });
          }
        }
      }
    }

    if (videos.length > 0) {
      return res.json(videos.slice(0, 15));
    } else {
      throw new Error('No videos found in parse');
    }
  } catch (err) {
    console.error('YouTube scraping failed, serving filtered fallbacks:', err);
    const filtered = FALLBACK_YT_SEARCH.filter(
      item =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.artist.toLowerCase().includes(query.toLowerCase())
    );
    return res.json(filtered.length > 0 ? filtered : FALLBACK_YT_SEARCH);
  }
});

// Seed data helper (seeds a default admin/user or welcome items if DB is fresh)
if (Object.keys(dbData).length === 0) {
  // Add some initial placeholder village events and listings to make the app ready to run
  dbData['village_events'] = [
    {
      id: 'event1',
      title: 'Assembleia Geral dos Povos',
      description: 'Discussão sobre preservação da língua e demarcação territorial.',
      date: '2026-06-15T10:00:00.000Z',
      location: 'Centro Cultural Kariri',
      organizer: 'Conselho Indígena',
      joinedUsers: [],
    },
    {
      id: 'event2',
      title: 'Feira Whãpa de Artesanato',
      description: 'Compartilhamento de saberes, cestarias tradicionais e pinturas corporais.',
      date: '2026-06-22T08:30:00.000Z',
      location: 'Aldeia Sítio',
      organizer: 'Associação das Mulheres Artesãs',
      joinedUsers: [],
    }
  ];
  dbData['products'] = [
    {
      id: 'prod1',
      title: 'Arco e Flecha Cerimonial Guajajara',
      description: 'Artesanato feito de madeira nobre tucum, penas naturais e grafismos tradicionais de jenipapo.',
      price: 250,
      sellerName: 'Karuan Guajajara',
      imageUrl: 'https://images.unsplash.com/photo-1623194017770-5296838a6a68?q=80&w=600&auto=format&fit=crop',
      sellerId: 'demo-seller-1',
      createdAt: new Date().toISOString()
    }
  ];
  saveDB();
}

async function startServer() {
  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ConectAldeias server running smoothly on port ${PORT}`);
  });
}

startServer();
