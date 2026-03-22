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
  getDoc,
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
import { CATEGORIES } from '../constants';

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
  const [isAdminUser, setIsAdminUser] = useState(false);
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
      if (u) {
        // Check admin status
        const checkAdmin = async () => {
          if (u.email === 'ramirezestebanramirez@gmail.com') {
            setIsAdminUser(true);
          } else {
            try {
              const adminDoc = await getDoc(doc(db, 'admin_users', u.uid));
              if (adminDoc.exists() && adminDoc.data().role === 'admin') {
                setIsAdminUser(true);
              } else {
                setIsAdminUser(false);
              }
            } catch (e) {
              console.error("Admin check error", e);
              setIsAdminUser(false);
            }
          }
          setIsPageLoading(false);
        };
        checkAdmin();
      } else {
        setIsAdminUser(false);
        setIsPageLoading(false);
      }
    });

    const q = query(collection(db, 'productos'));
    const unsubscribeProducts = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      // Sort by createdAt desc client-side
      const sorted = fetched.sort((a, b) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      });
      setProducts(sorted);
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
    
    console.log("Starting save operation...");
    setIsSaving(true);
    setError('');
    const path = 'productos';
    
    try {
      if (!isAdminUser) {
        throw new Error('No tenés permisos de administrador para realizar esta acción.');
      }

      // Validaciones básicas antes de enviar
      if (!currentProduct.name || !currentProduct.price || currentProduct.price <= 0 || !currentProduct.subcategory || !currentProduct.category || !currentProduct.images?.[0]) {
        throw new Error('El nombre, el precio (mayor a 0), la categoría, la subcategoría y la imagen son obligatorios.');
      }

      // Preparar datos limpios para Firestore
      // Extraemos campos que NO deben enviarse en el cuerpo del documento o que son automáticos
      const { id, createdAt, updatedAt, ...baseData } = currentProduct as any;

      const dataToSave = {
        ...baseData,
        name: currentProduct.name.trim(),
        description: currentProduct.description?.trim() || '',
        price: Number(currentProduct.price),
        stock: Number(currentProduct.stock),
        category: currentProduct.category,
        subcategory: currentProduct.subcategory,
        images: currentProduct.images,
      };

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Tiempo de espera agotado (15s). Verificá tu conexión.')), 15000)
      );

      if (isEditing && id) {
        console.log("Updating product:", id);
        const updatePromise = updateDoc(doc(db, path, id), {
          ...dataToSave,
          updatedAt: serverTimestamp()
        });
        await Promise.race([updatePromise, timeoutPromise]);
        console.log("Product updated successfully");
      } else {
        console.log("Adding new product");
        const addPromise = addDoc(collection(db, path), {
          ...dataToSave,
          createdAt: serverTimestamp()
        });
        await Promise.race([addPromise, timeoutPromise]);
        console.log("Product added successfully");
      }
      
      setIsEditing(false);
      setCurrentProduct({ name: '', description: '', price: 0, images: [''], stock: 0, category: 'ropa', subcategory: 'Baggy' });
      console.log("Form reset");
    } catch (err: any) {
      console.error("Save Error:", err);
      const firestoreError = handleFirestoreError(err, isEditing ? OperationType.UPDATE : OperationType.CREATE, path);
      const errorData = JSON.parse(firestoreError.message);
      setError(`Error (${errorData.operationType}): ${errorData.error}`);
    } finally {
      console.log("Save operation finished");
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdminUser) {
      setError('No tenés permisos para eliminar.');
      return;
    }
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

  if (!isAdminUser) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 bg-surface-container border border-white/5 text-center">
        <h2 className="text-4xl mb-8 italic text-secondary">Acceso Denegado</h2>
        <p className="text-white/60 mb-8">No tenés permisos de administrador para acceder a este panel.</p>
        <p className="text-white/40 text-xs mb-8">Conectado como: {user.email}</p>
        <button onClick={() => auth.signOut()} className="btn btn-secondary w-full">Salir</button>
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
          
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl">{isEditing ? 'Editar Producto' : 'Nuevo Producto'}</h3>
            {isEditing && (
              <button 
                onClick={() => { setIsEditing(false); setCurrentProduct({ name: '', description: '', price: 0, images: [''], stock: 0, category: 'ropa', subcategory: 'Baggy' }); }}
                className="text-xs uppercase font-bold text-primary hover:underline"
              >
                Nuevo
              </button>
            )}
          </div>
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
                onChange={e => {
                  const newCat = e.target.value as 'ropa' | 'accesorios';
                  setCurrentProduct({
                    ...currentProduct, 
                    category: newCat, 
                    subcategory: CATEGORIES[newCat][0]
                  });
                }}
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
                  CATEGORIES.ropa.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))
                ) : (
                  CATEGORIES.accesorios.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))
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
