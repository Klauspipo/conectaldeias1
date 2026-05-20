import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Search, Filter, Plus, X, Loader2, MessageSquare, Tag, Heart } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { cn, fileToBase64 } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  sellerId: string;
  sellerName: string;
  category: string;
  createdAt: any;
}

export default function Marketplace() {
  const { user, profile, triggerQuotaExceeded } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [search, setSearch] = useState('');
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    category: 'Artesanato'
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Product));
      setLoading(false);
    }, (err) => {
      console.error('Marketplace snapshot listener error:', err);
      triggerQuotaExceeded();
      setLoading(false);
    });
    return unsub;
  }, [triggerQuotaExceeded]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await fileToBase64(file);
        setNewProduct({ ...newProduct, imageUrl: base64 });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newProduct.imageUrl) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'products'), {
        ...newProduct,
        price: parseFloat(newProduct.price),
        sellerId: user.uid,
        sellerName: profile?.displayName || user.email,
        createdAt: serverTimestamp(),
      });
      setIsAddingProduct(false);
      setNewProduct({ name: '', description: '', price: '', imageUrl: '', category: 'Artesanato' });
    } catch (err) {
      console.error(err);
      alert('Erro ao cadastrar produto.');
    } finally {
      setSubmitting(false);
    }
  };

  const startTrade = (product: Product) => {
    // Logic to initiate chat with the seller
    navigate(`/messages?chatWith=${product.sellerId}`);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 px-4 py-8 md:px-8 pb-20">
      <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 text-ochre mb-2">
            <ShoppingBag className="h-6 w-6" />
            <span className="text-xs font-black uppercase tracking-[0.3em]">Cesto de Trocas</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white italic">FEIRA DE ARTESANATO</h1>
          <p className="text-zinc-500 mt-1">Nossa arte, nossa cultura, nossa resistência.</p>
        </div>

        <button 
          onClick={() => setIsAddingProduct(true)}
          className="flex items-center gap-2 bg-urucum hover:bg-red-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-xl shadow-urucum/20 active:scale-95 uppercase tracking-widest text-xs"
        >
          <Plus className="h-5 w-5" /> VENDER ITEM
        </button>
      </header>

      <div className="mb-10 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-600" />
        <input 
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar artesanatos, redes, pinturas..."
          className="w-full bg-zinc-900/30 border border-urucum/10 rounded-3xl py-5 pl-12 pr-6 text-white outline-none focus:ring-1 focus:ring-ochre/50 transition-all text-sm"
        />
      </div>

      {loading ? (
        <div className="flex justify-center p-20">
          <Loader2 className="h-10 w-10 text-amber-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <motion.div 
              layout
              key={product.id}
              className="group bg-zinc-900/30 border border-zinc-800 rounded-3xl overflow-hidden hover:border-amber-500/30 transition-all"
            >
              <div className="aspect-square relative overflow-hidden">
                <img src={product.imageUrl} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute top-4 right-4 bg-urucum/90 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                  <span className="text-xs font-black text-white italic">R$ {product.price.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="p-5">
                <div className="flex items-center gap-1.5 mb-2">
                  <Tag className="h-3 w-3 text-ochre" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{product.category}</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 line-clamp-1">{product.name}</h3>
                <p className="text-xs text-zinc-500 line-clamp-2 mb-4 h-8">{product.description}</p>
                
                <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50">
                   <div>
                      <p className="text-[10px] text-zinc-600 uppercase font-black">Artesão</p>
                      <p className="text-xs text-zinc-300 font-bold">{product.sellerName}</p>
                   </div>
                   <button 
                     onClick={() => startTrade(product)}
                     className="bg-zinc-800 hover:bg-urucum hover:text-white p-3 rounded-xl transition-all"
                   >
                     <MessageSquare className="h-5 w-5" />
                   </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal Adicionar Produto */}
      <AnimatePresence>
        {isAddingProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingProduct(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-xl rounded-[2.5rem] bg-zinc-900 border border-zinc-800 p-8 shadow-2xl"
            >
              <div className="mb-8 flex items-center justify-between">
                <div>
                   <h2 className="text-2xl font-black text-white italic">CADASTRAR ITEM</h2>
                   <p className="text-zinc-500 text-xs uppercase tracking-widest mt-1">Exponha sua arte na Feira de Artesanato</p>
                </div>
                <button onClick={() => setIsAddingProduct(false)} className="rounded-full bg-zinc-800 p-2 text-zinc-400 hover:text-white">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleAddProduct} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                       <label className="text-xs font-black uppercase text-zinc-500">Foto do Produto</label>
                       <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-zinc-800 rounded-3xl cursor-pointer hover:bg-zinc-950/50 hover:border-amber-500/50 transition-all group overflow-hidden">
                          {newProduct.imageUrl ? (
                            <img src={newProduct.imageUrl} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex flex-col items-center justify-center py-6">
                               <Plus className="h-8 w-8 text-zinc-600 mb-2 group-hover:text-amber-500" />
                               <p className="text-sm text-zinc-500 font-bold uppercase tracking-tighter">Adicionar Foto</p>
                            </div>
                          )}
                          <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                       </label>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black uppercase text-zinc-500">Nome do Item</label>
                      <input 
                        required
                        type="text"
                        value={newProduct.name}
                        onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                        className="w-full rounded-2xl bg-zinc-950 border border-zinc-800 p-4 text-white text-sm outline-none focus:ring-1 focus:ring-amber-500 transition-all"
                        placeholder="Ex: Cesto de Palha"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-black uppercase text-zinc-500">Preço (R$)</label>
                      <input 
                        required
                        type="number"
                        step="0.01"
                        value={newProduct.price}
                        onChange={e => setNewProduct({...newProduct, price: e.target.value})}
                        className="w-full rounded-2xl bg-zinc-950 border border-zinc-800 p-4 text-white text-sm outline-none focus:ring-1 focus:ring-amber-500 transition-all"
                        placeholder="0,00"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-black uppercase text-zinc-500">Categoria</label>
                      <select 
                        value={newProduct.category}
                        onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                        className="w-full rounded-2xl bg-zinc-950 border border-zinc-800 p-4 text-white text-sm outline-none focus:ring-1 focus:ring-amber-500 transition-all"
                      >
                        <option>Artesanato</option>
                        <option>Pintura</option>
                        <option>Vestuário</option>
                        <option>Alimentação</option>
                        <option>Outros</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-zinc-500">Descrição</label>
                  <textarea 
                    required
                    value={newProduct.description}
                    onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                    className="w-full h-24 rounded-2xl bg-zinc-950 border border-zinc-800 p-4 text-white text-sm outline-none focus:ring-1 focus:ring-amber-500 transition-all resize-none"
                    placeholder="Conte a história ou detalhes do item..."
                  />
                </div>

                <button 
                  type="submit"
                  disabled={submitting || !newProduct.imageUrl}
                  className="w-full bg-urucum hover:bg-red-700 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-urucum/20 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : 'CONFIRMAR CADASTRO'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
