import React, { useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  updateDoc, 
  serverTimestamp,
  query,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { Plus, Trash2, Edit2, LogOut, Package, Image as ImageIcon, Loader2 } from 'lucide-react';
import { auth, db, googleProvider } from '../firebase';
import { Product } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return new Error(JSON.stringify(errInfo));
};

const Admin: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const [products, setProducts] = useState<Product[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    images: [''],
    stock: 0,
    category: 'ropa',
    subcategory: 'Baggy'
  });

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsPageLoading(false);
    });

    const q = query(collection(db, 'productos'), orderBy('createdAt', 'desc'));
    const unsubscribeProducts = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    }, (err) => {
      console.error("Firestore Snapshot Error:", err);
      setError('Error al conectar con la base de datos. Verificá tu conexión.');
    });

    return () => {
      unsubscribeAuth();
      unsubscribeProducts();
    };
  }, []);

  const handleLogin = async () => {
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Login Error:", err);
      setError(`Error: ${err.message || 'Error al iniciar sesión.'}`);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    
    setIsSaving(true);
    setError('');
    const path = 'productos';
    
    try {
      // Validaciones básicas antes de enviar
      if (!currentProduct.name || !currentProduct.price || currentProduct.price <= 0) {
        throw new Error('El nombre y el precio (mayor a 0) son obligatorios.');
      }

      const productData = {
        ...currentProduct,
        price: Number(currentProduct.price),
        stock: Number(currentProduct.stock),
      };

      if (isEditing && currentProduct.id) {
        const { id, ...dataToUpdate } = productData;
        await updateDoc(doc(db, path, id), {
          ...dataToUpdate,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, path), {
          ...productData,
          createdAt: serverTimestamp()
        });
      }
      
      setIsEditing(false);
      setCurrentProduct({ name: '', description: '', price: 0, images: [''], stock: 0, category: 'ropa', subcategory: 'Baggy' });
    } catch (err: any) {
      console.error("Save Error:", err);
      setError(err.message || 'Error al guardar el producto. Verificá los permisos.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Seguro que querés eliminar este producto?')) return;
    const path = 'productos';
    try {
      await deleteDoc(doc(db, path, id));
    } catch (err) {
      console.error("Delete Error:", err);
      setError('Error al eliminar.');
    }
  };

  if (isPageLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={48} /></div>;

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 bg-surface-container border border-white/5 text-center">
        <h2 className="text-4xl mb-8 italic">Admin Login</h2>
        <p className="text-white/60 mb-8">Acceso exclusivo para el administrador de YONK.</p>

        <button 
          onClick={handleLogin} 
          className="btn btn-primary w-full flex items-center justify-center gap-3"
        >
          <img src="https://www.gstatic.com/firebase/explore/google.svg" className="w-5 h-5" alt="Google" />
          Entrar con Google
        </button>
        {error && <p className="text-secondary text-xs uppercase font-bold mt-6">{error}</p>}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h2 className="text-5xl italic">Panel Admin</h2>
          <p className="text-white/40 text-xs mt-2">Conectado como: <span className="text-primary">{user.email}</span></p>
        </div>
        <button onClick={() => auth.signOut()} className="flex items-center gap-2 text-white/40 hover:text-secondary transition-colors">
          <LogOut size={20} /> Salir
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Product Form */}
        <div className="lg:col-span-1 bg-surface-container p-8 border border-white/5 h-fit relative">
          {isSaving && (
            <div className="absolute inset-0 z-10 bg-background/80 flex items-center justify-center backdrop-blur-sm">
              <div className="text-center">
                <Loader2 className="animate-spin text-primary mx-auto mb-4" size={32} />
                <p className="font-display font-bold uppercase tracking-widest text-xs">Guardando...</p>
              </div>
            </div>
          )}
          
          <h3 className="text-2xl mb-8">{isEditing ? 'Editar Producto' : 'Nuevo Producto'}</h3>
          <form onSubmit={handleSaveProduct} className="space-y-6">
            {error && <p className="p-4 bg-secondary/10 border border-secondary/20 text-secondary text-xs uppercase font-bold">{error}</p>}
            
            <div>
              <label className="text-xs uppercase font-bold text-white/40 mb-2 block">Nombre del Producto</label>
              <input 
                placeholder="Nombre" 
                className="input" 
                value={currentProduct.name} 
                onChange={e => setCurrentProduct({...currentProduct, name: e.target.value})} 
                required 
                disabled={isSaving}
              />
            </div>

            <div>
              <label className="text-xs uppercase font-bold text-white/40 mb-2 block">Descripción</label>
              <textarea 
                placeholder="Descripción" 
                className="input h-32" 
                value={currentProduct.description} 
                onChange={e => setCurrentProduct({...currentProduct, description: e.target.value})} 
                disabled={isSaving}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs uppercase font-bold text-white/40 mb-2 block">Precio ($)</label>
                <input 
                  type="number" 
                  placeholder="Precio" 
                  className="input" 
                  value={currentProduct.price} 
                  onChange={e => setCurrentProduct({...currentProduct, price: Number(e.target.value)})} 
                  required 
                  disabled={isSaving}
                />
              </div>
              <div>
                <label className="text-xs uppercase font-bold text-white/40 mb-2 block">Stock</label>
                <input 
                  type="number" 
                  placeholder="Stock" 
                  className="input" 
                  value={currentProduct.stock} 
                  onChange={e => setCurrentProduct({...currentProduct, stock: Number(e.target.value)})} 
                  required 
                  disabled={isSaving}
                />
              </div>
            </div>

            <div>
              <label className="text-xs uppercase font-bold text-white/40 mb-2 block">Categoría</label>
              <select 
                className="input" 
                value={currentProduct.category} 
                onChange={e => setCurrentProduct({...currentProduct, category: e.target.value as any, subcategory: ''})}
                disabled={isSaving}
              >
                <option value="ropa">Ropa</option>
                <option value="accesorios">Accesorios</option>
              </select>
            </div>

            <div>
              <label className="text-xs uppercase font-bold text-white/40 mb-2 block">Subcategoría</label>
              <select 
                className="input" 
                value={currentProduct.subcategory} 
                onChange={e => setCurrentProduct({...currentProduct, subcategory: e.target.value})} 
                required 
                disabled={isSaving}
              >
                <option value="" disabled>Seleccionar Subcategoría</option>
                {currentProduct.category === 'ropa' ? (
                  <>
                    <option value="Baggy">Baggy</option>
                    <option value="Jorts">Jorts</option>
                    <option value="Remeras">Remeras</option>
                    <option value="Hoodies">Hoodies</option>
                    <option value="Buzos">Buzos</option>
                    <option value="Pantalones">Pantalones</option>
                    <option value="Camperas">Camperas</option>
                    <option value="Otros">Otros</option>
                  </>
                ) : (
                  <>
                    <option value="Anillos">Anillos</option>
                    <option value="Collares">Collares</option>
                    <option value="Pulseras">Pulseras</option>
                    <option value="Gorras">Gorras</option>
                    <option value="Aros">Aros</option>
                    <option value="Llaveros">Llaveros</option>
                    <option value="Cintos">Cintos</option>
                    <option value="Medias">Medias</option>
                    <option value="Otros">Otros</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="text-xs uppercase font-bold text-white/40 mb-2 block">URL de Imagen</label>
              <input 
                placeholder="URL de Imagen" 
                className="input" 
                value={currentProduct.images?.[0]} 
                onChange={e => setCurrentProduct({...currentProduct, images: [e.target.value]})} 
                required 
                disabled={isSaving}
              />
            </div>
            <div className="flex gap-4">
              <button type="submit" className="btn btn-primary flex-1" disabled={isSaving}>
                {isSaving ? 'Guardando...' : 'Guardar'}
              </button>
              {isEditing && (
                <button 
                  type="button" 
                  onClick={() => { setIsEditing(false); setCurrentProduct({ name: '', description: '', price: 0, images: [''], stock: 0, category: 'ropa', subcategory: 'Baggy' }); }}
                  className="btn btn-secondary"
                  disabled={isSaving}
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Product List */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-2xl mb-8">Productos ({products.length})</h3>
          <div className="grid grid-cols-1 gap-4">
            {products.map(p => (
              <div key={p.id} className="bg-surface-container p-4 flex items-center gap-6 border border-white/5">
                <img src={p.images[0]} alt={p.name} className="w-16 h-16 object-cover" />
                <div className="flex-1">
                  <h4 className="font-display font-bold uppercase">{p.name}</h4>
                  <p className="text-primary font-bold">${p.price} <span className="text-white/20 text-xs ml-2">Stock: {p.stock}</span></p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setIsEditing(true); setCurrentProduct(p); }}
                    className="p-3 bg-white/5 hover:bg-primary hover:text-black transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(p.id)}
                    className="p-3 bg-white/5 hover:bg-secondary hover:text-white transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
