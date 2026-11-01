import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp, getDocs, onSnapshot, query, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { 
  Camera, MapPin, Clock, Calendar, FileText, 
  CheckCircle, Loader2, LogOut, X, Send, CheckCircle2, 
  ChevronLeft, User, Briefcase, Users, LayoutDashboard, Settings, 
  MessageSquare, Plus, Menu, Trash2,
  Lock, AlertCircle, Save
} from 'lucide-react';

// --- 1. Konfigurasi Firebase (Disesuaikan untuk Vercel / .env) ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Helper paths (Disesuaikan langsung ke root Firestore Anda)
const getCollectionPath = (colName) => collection(db, colName);
const getDocPath = (colName, docId) => doc(db, colName, docId);

// --- 2. Komponen UI Global ---
const Toast = ({ message, type, onClose }) => {
  if (!message) return null;
  const bgColor = type === 'error' ? 'bg-red-500' : type === 'success' ? 'bg-emerald-500' : 'bg-blue-600';
  return (
    <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] flex items-center px-4 py-3 rounded-full shadow-2xl text-white text-sm font-bold w-max max-w-[90vw] animate-in slide-in-from-top-4 fade-in duration-300 ${bgColor}`}>
      <span className="mr-2">{message}</span>
      <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors"><X size={16} /></button>
    </div>
  );
};

// --- 3. Gemini AI Chatbot (Admin Only) ---
const GeminiChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: 'model', text: 'Sistem AI aktif. Ada yang bisa saya bantu terkait pengelolaan kontraktor hari ini?' }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const newMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const apiKey = ""; // Opsional: Masukkan API Key Gemini Anda di sini jika ingin chatbotnya berfungsi
      if(!apiKey) throw new Error("API Key kosong");

      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;
      const payload = {
        contents: [{ parts: [{ text: `Kamu adalah AI asisten untuk admin web presensi kontraktor. Jawab dengan ringkas, profesional, dan to the point. Pertanyaan: ${input}` }] }],
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Koneksi ke AI terputus.";
      setMessages(prev => [...prev, { role: 'model', text: aiText }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', text: "Maaf, API Key Gemini belum diatur atau terjadi kesalahan jaringan." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 w-80 h-96 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4">
          <div className="bg-blue-600 text-white p-3 flex justify-between items-center shadow-md">
            <div className="flex items-center gap-2 font-bold text-sm">
              <MessageSquare size={18} /> Gemini Assistant
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-blue-700 p-1.5 rounded-full transition-colors"><X size={16} /></button>
          </div>
          <div className="flex-1 p-3 overflow-y-auto bg-slate-800 space-y-3 text-sm">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl shadow-sm ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-700 border border-slate-600 text-slate-200 rounded-tl-none'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isLoading && <div className="text-blue-400 text-xs flex gap-2 items-center"><Loader2 size={14} className="animate-spin" /> Menghasilkan respon...</div>}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-3 bg-slate-900 border-t border-slate-700 flex gap-2">
            <input 
              type="text" value={input} onChange={e=>setInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSend()}
              className="flex-1 bg-slate-800 text-white border border-slate-700 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-slate-400"
              placeholder="Tanya asisten..."
            />
            <button onClick={handleSend} disabled={isLoading || !input.trim()} className="bg-blue-600 text-white p-2.5 rounded-full hover:bg-blue-500 disabled:opacity-50 transition-colors shadow-lg">
              <Send size={16} />
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setIsOpen(true)} className="bg-blue-600 text-white p-4 rounded-full shadow-2xl hover:bg-blue-500 hover:scale-105 transition-all flex items-center justify-center">
          <MessageSquare size={26} />
        </button>
      )}
    </div>
  );
};

// ============================================================================
// KOMPONEN PENGATURAN ADMIN
// ============================================================================
const AdminPengaturan = ({ setToast, firestoreUser, user }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [adminProfilePic, setAdminProfilePic] = useState(user?.profilePic || null);
  const [adminAuth, setAdminAuth] = useState({ oldPassword: '', newUsername: user?.username || '', newPassword: '' });

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAdminProfilePic(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAuth = async (e) => {
    e.preventDefault();
    if (adminAuth.newPassword && !adminAuth.oldPassword) {
      setToast({msg: 'Masukkan password lama untuk validasi!', type: 'error'}); return;
    }
    setIsLoading(true);
    try {
      const q = query(getCollectionPath('admin_auth'));
      const snapshot = await getDocs(q);
      
      let newAuthData = { username: adminAuth.newUsername, profilePic: adminProfilePic };
      if (adminAuth.newPassword) newAuthData.password = adminAuth.newPassword;
      else if (!snapshot.empty) newAuthData.password = snapshot.docs[0].data().password;
      else newAuthData.password = 'admin';

      if (snapshot.empty) await addDoc(getCollectionPath('admin_auth'), newAuthData);
      else await updateDoc(getDocPath('admin_auth', snapshot.docs[0].id), newAuthData);
      
      setToast({msg: 'Profil Admin berhasil diperbarui!', type: 'success'});
      setAdminAuth({ oldPassword: '', newUsername: adminAuth.newUsername, newPassword: '' });
    } catch (err) {
      setToast({msg: 'Gagal memperbarui pengaturan', type: 'error'});
    }
    setIsLoading(false);
  };

  return (
    <div className="p-6 max-w-4xl">
      <h2 className="text-2xl font-bold text-slate-800 mb-6 border-b-2 border-blue-500 pb-2 inline-block">Pengaturan Admin</h2>
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
        <div className="mb-6 border-b border-slate-100 pb-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Lock size={20} className="text-blue-600"/> Kredensial & Profil</h3>
          <p className="text-sm text-slate-500 mt-1">Sesuaikan identitas pengelola Portal Admin.</p>
        </div>
        <form onSubmit={handleSaveAuth} className="space-y-6 max-w-lg">
          {/* Upload Foto */}
          <div className="flex items-center gap-6 p-5 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="w-24 h-24 rounded-full bg-slate-200 border-4 border-white shadow-md flex items-center justify-center overflow-hidden relative group">
              {adminProfilePic ? <img src={adminProfilePic} alt="Admin" className="w-full h-full object-cover" /> : <User size={40} className="text-slate-400" />}
              <label className="absolute inset-0 bg-black/60 hidden group-hover:flex items-center justify-center cursor-pointer transition-all">
                <Camera size={24} className="text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-md">Foto Profil Admin</h4>
              <p className="text-xs text-slate-500 mb-3 max-w-[200px]">Pilih foto formal untuk ditampilkan di Topbar.</p>
              <label className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-all shadow-sm inline-block">
                Ganti Gambar
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-2 tracking-wider">Username Admin</label>
            <input type="text" required value={adminAuth.newUsername} onChange={e=>setAdminAuth({...adminAuth, newUsername: e.target.value})} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-slate-800 font-medium" />
          </div>
          
          <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl">
            <p className="text-xs font-semibold text-orange-800 mb-3 flex items-center gap-2"><AlertCircle size={14}/> Ubah Password (Opsional)</p>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Password Lama</label>
            <input type="password" value={adminAuth.oldPassword} onChange={e=>setAdminAuth({...adminAuth, oldPassword: e.target.value})} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 mb-3 text-sm" placeholder="Diperlukan jika ingin ganti password" />
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Password Baru</label>
            <input type="password" value={adminAuth.newPassword} onChange={e=>setAdminAuth({...adminAuth, newPassword: e.target.value})} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm" />
          </div>
          
          <button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md">
            {isLoading ? <Loader2 size={20} className="animate-spin"/> : <Save size={20}/>} Simpan Pengaturan
          </button>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// ADMIN PORTAL - Dashboard & Generic Views
// ============================================================================
const AdminDashboardView = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold text-slate-800 mb-6 border-b-2 border-blue-500 pb-2 inline-block">Dashboard Kontraktor</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {[ 
        { title: 'Karyawan Aktif', val: 'Kelola Tim', icon: Users, color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200' },
        { title: 'Presensi Masuk', val: 'Monitoring', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100', border: 'border-emerald-200' },
        { title: 'Laporan Pekerjaan', val: 'Review Harian', icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-100', border: 'border-indigo-200' },
      ].map((stat, i) => (
        <div key={i} className={`bg-white rounded-2xl p-6 shadow-md border ${stat.border} flex flex-col justify-between relative overflow-hidden group hover:-translate-y-1 transition-transform`}>
          <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${stat.bg} opacity-50 group-hover:scale-125 transition-transform`}></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} shadow-inner`}>
              <stat.icon size={32} />
            </div>
            <div>
              <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">{stat.title}</p>
              <h3 className="text-xl font-extrabold text-slate-800 mt-1">{stat.val}</h3>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const AdminDataViewer = ({ title, collectionName, columns, firestoreUser, setToast }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firestoreUser) return;
    const unsub = onSnapshot(getCollectionPath(collectionName), (snapshot) => {
      const fetched = [];
      snapshot.forEach(doc => fetched.push({ id: doc.id, ...doc.data() }));
      fetched.sort((a,b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      setData(fetched);
      setLoading(false);
    });
    return () => unsub();
  }, [firestoreUser, collectionName]);

  const handleDelete = async (id) => {
    try {
      await deleteDoc(getDocPath(collectionName, id));
      setToast({msg: 'Data berhasil dihapus', type: 'success'});
    } catch (err) {
      setToast({msg: 'Gagal menghapus data', type: 'error'});
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-slate-800 mb-6 border-b-2 border-blue-500 pb-2 inline-block">{title}</h2>
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        {loading ? (
           <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-blue-600 w-10 h-10" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-800 text-white uppercase text-xs font-bold">
                <tr>
                  {columns.map((c, i) => <th key={i} className="px-5 py-4 tracking-wider">{c.label}</th>)}
                  <th className="px-5 py-4 tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((item, idx) => (
                  <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    {columns.map((c, i) => (
                      <td key={i} className="px-5 py-4 whitespace-nowrap">
                        {c.render ? c.render(item[c.key], item) : (item[c.key] || '-')}
                      </td>
                    ))}
                    <td className="px-5 py-4 text-right">
                      <button onClick={() => handleDelete(item.id)} className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"><Trash2 size={18}/></button>
                    </td>
                  </tr>
                ))}
                {data.length === 0 && <tr><td colSpan={columns.length + 1} className="text-center py-8 text-slate-400 font-medium">Belum ada data terekam.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const AdminManajemenKaryawan = ({ setToast, firestoreUser }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ nama: '', username: '', password: '', posisi: '' });

  useEffect(() => {
    if (!firestoreUser) return;
    const unsub = onSnapshot(getCollectionPath('users'), (snapshot) => {
      const fetched = [];
      snapshot.forEach(doc => fetched.push({ id: doc.id, ...doc.data() }));
      setUsers(fetched.filter(u => u.role === 'employee')); 
      setLoading(false);
    });
    return () => unsub();
  }, [firestoreUser]);

  const handleDaftar = async (e) => {
    e.preventDefault();
    if (!form.nama || !form.username || !form.password) { setToast({msg: 'Lengkapi form!', type: 'error'}); return; }
    try {
      await addDoc(getCollectionPath('users'), { ...form, role: 'employee', createdAt: serverTimestamp() });
      setToast({msg: 'Karyawan terdaftar!', type: 'success'});
      setForm({ nama: '', username: '', password: '', posisi: '' });
    } catch (err) { setToast({msg: 'Gagal mendaftar', type: 'error'}); }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-slate-800 mb-6 border-b-2 border-blue-500 pb-2 inline-block">Manajemen Karyawan</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Tambah */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 lg:col-span-1 h-fit">
          <h3 className="font-bold text-lg mb-6 text-slate-800 flex items-center gap-2">
            <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><Plus size={20}/></div>
            Tambah Karyawan
          </h3>
          <form onSubmit={handleDaftar} className="space-y-4">
            {['nama', 'username', 'password', 'posisi'].map(field => (
              <div key={field}>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1 tracking-wider">{field}</label>
                <input type={field==='password'?'password':'text'} required={field!=='posisi'} value={form[field]} onChange={e=>setForm({...form, [field]: e.target.value})} 
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm" />
              </div>
            ))}
            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 shadow-md transition-all mt-4">Simpan Karyawan</button>
          </form>
        </div>
        {/* Tabel */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden lg:col-span-2">
           <div className="p-5 border-b border-slate-100 bg-slate-50"><h3 className="font-bold text-lg text-slate-800">Daftar Karyawan Aktif</h3></div>
           <div className="overflow-x-auto">
             <table className="w-full text-left text-sm text-slate-600">
               <thead className="bg-slate-800 text-white text-xs uppercase font-bold tracking-wider">
                 <tr><th className="px-5 py-4">Nama & Posisi</th><th className="px-5 py-4">Username</th><th className="px-5 py-4 text-right">Aksi</th></tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {users.map(u => (
                   <tr key={u.id} className="hover:bg-slate-50">
                     <td className="px-5 py-4">
                       <p className="font-bold text-slate-800 text-base">{u.nama}</p>
                       <p className="text-xs text-slate-500 bg-slate-200 inline-block px-2 py-0.5 rounded-full mt-1">{u.posisi || 'Pekerja'}</p>
                     </td>
                     <td className="px-5 py-4 font-mono text-blue-600">{u.username}</td>
                     <td className="px-5 py-4 text-right">
                        <button onClick={() => deleteDoc(getDocPath('users', u.id))} className="p-2 text-red-500 hover:bg-red-100 rounded-lg"><Trash2 size={18}/></button>
                     </td>
                   </tr>
                 ))}
                 {users.length === 0 && !loading && <tr><td colSpan="3" className="text-center py-8">Belum ada karyawan terdaftar.</td></tr>}
               </tbody>
             </table>
           </div>
        </div>
      </div>
    </div>
  );
};

const AdminPortal = ({ user, onLogout, setToast, firestoreUser }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menu = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'presensi', label: 'Data Presensi', icon: MapPin },
    { id: 'perizinan', label: 'Izin Kerja', icon: Calendar },
    { id: 'laporan', label: 'Lap. Harian', icon: FileText },
    { id: 'karyawan', label: 'Kelola Karyawan', icon: Users },
    { id: 'pengaturan', label: 'Pengaturan', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans">
      {/* Sidebar - Tema Navy Blue */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 transition-transform transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:relative flex flex-col shadow-2xl`}>
        <div className="p-6 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3 text-white">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg"><Briefcase size={24} /></div>
            <h1 className="font-extrabold text-lg leading-tight tracking-wide">ADMIN<br/><span className="text-xs text-blue-400 font-medium">Contractor Hub</span></h1>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {menu.map(m => (
            <button key={m.id} onClick={() => {setActiveTab(m.id); setIsMobileMenuOpen(false);}} 
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-semibold text-sm ${activeTab === m.id ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-800 hover:text-white'}`}>
              <m.icon size={20} className={activeTab === m.id ? "text-white" : "text-slate-500"}/> {m.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="bg-white shadow-sm border-b border-slate-200 px-6 py-4 flex justify-between items-center z-10">
          <div className="flex items-center gap-4">
             <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 -ml-2 text-slate-600 md:hidden hover:bg-slate-100 rounded-lg"><Menu size={24} /></button>
             <h1 className="text-xl font-bold text-slate-800 capitalize hidden sm:block">{activeTab.replace('_', ' ')}</h1>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-slate-800 leading-tight">{user.username}</p>
                <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider">Administrator</p>
             </div>
             <div className="w-12 h-12 rounded-full bg-slate-200 border-2 border-blue-100 flex items-center justify-center text-slate-500 overflow-hidden shadow-sm">
               {user.profilePic ? <img src={user.profilePic} alt="Admin" className="w-full h-full object-cover" /> : <User size={24}/>}
             </div>
             <button onClick={onLogout} title="Keluar" className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"><LogOut size={22} /></button>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto pb-24 bg-slate-50">
          {activeTab === 'dashboard' && <AdminDashboardView />}
          {activeTab === 'karyawan' && <AdminManajemenKaryawan setToast={setToast} firestoreUser={firestoreUser} />}
          {activeTab === 'pengaturan' && <AdminPengaturan firestoreUser={firestoreUser} setToast={setToast} user={user} />}
          {activeTab === 'presensi' && <AdminDataViewer title="Rekap Presensi Karyawan" collectionName="attendance" firestoreUser={firestoreUser} setToast={setToast} columns={[
              { label: 'Karyawan', key: 'nama', render: (v, row) => <div className="font-bold text-slate-800">{v || row.username}</div> },
              { label: 'Waktu', key: 'timestamp', render: (val) => val ? new Date(val.seconds * 1000).toLocaleString('id-ID') : '-' },
              { label: 'Aksi', key: 'type', render: (val) => <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${val==='Check-In' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>{val}</span> },
              { label: 'GPS', key: 'location', render: (val) => val ? <a href={`https://maps.google.com/?q=${val.lat},${val.lng}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1"><MapPin size={14}/> Lihat Map</a> : '-' },
              { label: 'Otentikasi', key: 'photo', render: (val) => val ? <img src={val} alt="Selfie" className="w-12 h-12 object-cover rounded-lg border border-slate-200 shadow-sm" /> : <span className="text-red-500 font-bold text-xs">No Image</span> },
            ]}/>}
          {activeTab === 'perizinan' && <AdminDataViewer title="Daftar Izin & Cuti" collectionName="leave_requests" firestoreUser={firestoreUser} setToast={setToast} columns={[
              { label: 'Nama', key: 'nama' },
              { label: 'Tanggal', key: 'timestamp', render: (val) => val ? new Date(val.seconds * 1000).toLocaleDateString('id-ID') : '-' },
              { label: 'Jenis', key: 'type', render: (val) => <span className="font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-lg">{val}</span> },
              { label: 'Alasan', key: 'reason' },
            ]}/>}
          {activeTab === 'laporan' && <AdminDataViewer title="Laporan Harian Pekerjaan" collectionName="daily_reports" firestoreUser={firestoreUser} setToast={setToast} columns={[
              { label: 'Pekerja', key: 'nama' },
              { label: 'Durasi', key: 'time', render: (_, r) => <span className="font-mono bg-slate-100 px-2 py-1 rounded">{r.startTime} - {r.finishTime}</span> },
              { label: 'Deskripsi', key: 'taskDetail', render: (v) => <div className="max-w-xs whitespace-normal">{v}</div> },
            ]}/>}
        </div>
      </main>
      <GeminiChatbot />
    </div>
  );
};


// ============================================================================
// PORTAL KARYAWAN (Mobile First - Robust Camera Logic)
// ============================================================================
const TopBar = ({ title, onBack, user, onLogout }) => (
  <div className="bg-slate-900 text-white p-4 sticky top-0 z-40 shadow-lg flex items-center justify-between rounded-b-[2rem] border-b-4 border-blue-600">
    <div className="flex items-center gap-3">
      {onBack && <button onClick={onBack} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full transition-colors"><ChevronLeft size={24} /></button>}
      <h1 className="font-extrabold text-lg tracking-wide">{title}</h1>
    </div>
    {user && onLogout && <button onClick={onLogout} className="text-slate-400 hover:text-red-400 p-2"><LogOut size={24} /></button>}
  </div>
);

const EmployeeDashboard = ({ user, onNavigate, onLogout }) => {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const timer = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(timer); }, []);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col pb-8 font-sans">
      <TopBar title="Portal Pekerja" user={user} onLogout={onLogout} />
      <div className="p-5 space-y-6 flex-1 max-w-md mx-auto w-full mt-4">
        
        <div className="px-2">
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-1">Selamat Bekerja,</p>
          <h2 className="text-3xl font-extrabold text-slate-800">{user.nama || user.username}</h2>
          <div className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">{user.posisi || 'Kontraktor Umum'}</div>
        </div>
        
        <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute -bottom-10 -right-10 opacity-10 text-white"><Clock size={200} /></div>
          <div className="relative z-10 text-center py-2">
            <p className="text-4xl font-black tracking-tighter">
              {time.toLocaleTimeString('id-ID', { hour12: false, hour: '2-digit', minute: '2-digit' })}
              <span className="text-2xl text-blue-400 ml-1">:{time.toLocaleTimeString('id-ID', { second: '2-digit' }).split(':')[2]}</span>
            </p>
            <p className="text-sm text-blue-200 mt-2 font-medium tracking-widest uppercase">{time.toLocaleDateString('id-ID', { weekday:'long', day:'numeric', month:'long', year:'numeric'})}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 px-1">
          <button onClick={() => onNavigate('presensi')} className="col-span-2 bg-white p-5 rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100 flex items-center gap-5 hover:-translate-y-1 transition-transform active:scale-95">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-inner"><MapPin size={32} /></div>
            <div className="text-left">
              <h4 className="font-extrabold text-slate-800 text-xl">Presensi Digital</h4>
              <p className="text-xs text-slate-500 font-medium mt-1">Check-in dengan GPS & Selfie</p>
            </div>
          </button>
          
          <button onClick={() => onNavigate('perizinan')} className="bg-white p-5 rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100 flex flex-col items-center text-center gap-3 hover:-translate-y-1 transition-transform active:scale-95">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-500 text-white rounded-2xl flex items-center justify-center shadow-inner"><Calendar size={28} /></div>
            <div>
              <h4 className="font-bold text-slate-800">Izin / Sakit</h4>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">Form Pengajuan</p>
            </div>
          </button>
          
          <button onClick={() => onNavigate('laporan')} className="bg-white p-5 rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100 flex flex-col items-center text-center gap-3 hover:-translate-y-1 transition-transform active:scale-95">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-inner"><FileText size={28} /></div>
            <div>
              <h4 className="font-bold text-slate-800">Lap. Harian</h4>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">Log Pekerjaan</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

// FITUR PRESENSI
const EmployeePresensi = ({ user, setToast, onBack }) => {
  const [btnState, setBtnState] = useState('idle');
  const [type, setType] = useState('Check-In');
  const [locationStr, setLocationStr] = useState('Menunggu inisiasi...');
  const [capturedImg, setCapturedImg] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const initCamera = async () => {
    try {
      setCameraError(null);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Browser perangkat Anda tidak mendukung fitur kamera (MediaDevices API).");
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } } 
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.warn("Video play interrupted:", e));
      }
      setLocationStr('Kamera siap. Tap tombol di bawah.');
    } catch (err) {
      let errMsg = "Akses kamera ditolak atau perangkat tidak ditemukan.";
      if (err.name === 'NotAllowedError') errMsg = "Izin kamera ditolak browser. Mohon izinkan kamera untuk absen.";
      if (err.name === 'NotFoundError') errMsg = "Tidak ada lensa kamera yang terdeteksi di perangkat ini.";
      
      setCameraError(errMsg);
      setToast({ msg: errMsg, type: 'error' });
      setLocationStr('Kamera Error');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    let isMounted = true;
    if (isMounted) initCamera();
    return () => { isMounted = false; stopCamera(); };
  }, []);

  const captureImageSafe = () => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return null;

    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const getGPSLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) { reject(new Error("Fitur GPS tidak didukung.")); return; }
      navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
    });
  };

  const handleAbsen = async () => {
    if (cameraError) { setToast({ msg: "Selesaikan masalah kamera terlebih dahulu.", type: 'error' }); return; }
    setBtnState('loading');
    setLocationStr('Mencari satelit GPS...');
    
    try {
      const pos = await getGPSLocation();
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setLocationStr(`Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);

      const imageBase64 = captureImageSafe();
      if (!imageBase64) throw new Error("Gagal menangkap gambar.");

      setCapturedImg(imageBase64);
      stopCamera(); 

      await addDoc(getCollectionPath('attendance'), {
        username: user.username,
        nama: user.nama || user.username,
        timestamp: serverTimestamp(),
        type: type,
        location: { lat, lng },
        photo: imageBase64
      });

      setBtnState('success');
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      setToast({ msg: `Presensi ${type} Berhasil Direkam!`, type: 'success' });
      
      setTimeout(() => { 
        setBtnState('idle'); 
        setType(type === 'Check-In' ? 'Check-Out' : 'Check-In'); 
        setCapturedImg(null); 
        initCamera(); 
      }, 3000);
    } catch (error) {
      let errMsg = error.message || "Gagal melakukan presensi.";
      if (error.code === 1) errMsg = "Akses GPS ditolak. Izinkan lokasi di pengaturan browser Anda.";
      if (error.code === 2) errMsg = "Sinyal GPS tidak stabil. Cari area terbuka.";
      if (error.code === 3) errMsg = "Waktu pencarian lokasi habis (Timeout).";
      
      setToast({ msg: errMsg, type: 'error' });
      setLocationStr('Presensi Dibatalkan / Gagal');
      setBtnState('idle');
      
      if (!capturedImg && !streamRef.current) initCamera();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-white font-sans">
      <TopBar title="Live Presensi" onBack={onBack} />
      
      <div className="flex-1 flex flex-col relative w-full h-full max-w-md mx-auto bg-black overflow-hidden shadow-inner">
        {cameraError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-slate-900">
             <AlertCircle size={64} className="text-red-500 mb-4 opacity-80" />
             <p className="text-sm font-bold text-red-400 mb-2">Akses Kamera Gagal</p>
             <p className="text-xs text-slate-400">{cameraError}</p>
             <button onClick={initCamera} className="mt-6 px-6 py-2 bg-slate-800 rounded-full text-sm font-bold border border-slate-700 hover:bg-slate-700">Coba Lagi</button>
          </div>
        ) : capturedImg ? (
          <img src={capturedImg} alt="Hasil Capture" className="w-full h-full object-cover absolute inset-0 animate-in fade-in zoom-in-95 duration-300" />
        ) : (
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover absolute inset-0"></video>
        )}
        
        <canvas ref={canvasRef} className="hidden"></canvas>
        
        <div className="absolute inset-0 flex flex-col justify-between p-5 pointer-events-none">
          <div className="flex justify-between items-start">
             <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 border border-white/10 shadow-lg">
               {!capturedImg && !cameraError && <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></div>}
               {capturedImg ? 'FOTO TERSIMPAN' : cameraError ? 'ERROR' : 'LIVE FEED'}
             </div>
             <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl text-xs font-mono font-bold tracking-widest border border-white/10 shadow-lg">
               {new Date().toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}
             </div>
          </div>
          
          {!capturedImg && !cameraError && (
            <div className="w-full h-72 border-2 border-blue-500/50 rounded-[2rem] mx-auto flex flex-col items-center justify-center relative overflow-hidden">
               <div className="absolute top-0 left-0 right-0 h-1 bg-blue-400/50 animate-[scan_3s_ease-in-out_infinite]"></div>
               <div className="absolute inset-0 shadow-[0_0_50px_rgba(59,130,246,0.2)_inset]"></div>
               <span className="text-white/80 font-bold text-sm bg-black/50 px-4 py-1.5 rounded-full backdrop-blur-sm shadow-md mt-48">
                 Posisikan wajah Anda
               </span>
            </div>
          )}

          <div className="bg-black/70 backdrop-blur-md rounded-2xl p-4 flex items-center gap-3 border border-white/10 shadow-lg mb-20">
             <MapPin size={24} className="text-blue-400 shrink-0" />
             <div className="flex-1 min-w-0">
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Status Koordinat</p>
               <p className="text-sm font-semibold truncate text-slate-100 mt-0.5">{locationStr}</p>
             </div>
          </div>
        </div>

        <div className="absolute bottom-6 left-6 right-6">
          <button 
            onClick={handleAbsen}
            disabled={btnState !== 'idle' || !!cameraError}
            className={`w-full h-16 rounded-2xl font-black text-lg text-white transition-all duration-300 flex items-center justify-center gap-3 shadow-2xl tracking-wide uppercase
              ${btnState === 'idle' ? (type === 'Check-In' ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/50' : 'bg-orange-600 hover:bg-orange-500 shadow-orange-600/50') : ''}
              ${btnState === 'loading' ? 'bg-slate-800 cursor-wait' : ''}
              ${btnState === 'success' ? 'bg-emerald-500 scale-105 shadow-emerald-500/50' : ''}
              ${cameraError ? 'bg-slate-800 opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {btnState === 'idle' && <><Camera size={26} /> {type} Sekarang</>}
            {btnState === 'loading' && <><Loader2 size={26} className="animate-spin" /> Memvalidasi Data...</>}
            {btnState === 'success' && <><CheckCircle size={28} /> Sukses!</>}
          </button>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `@keyframes scan { 0% { top: 0; } 50% { top: 100%; } 100% { top: 0; } }`}} />
    </div>
  );
};

// Fitur Form Karyawan Umum (Izin & Laporan)
const EmployeeForm = ({ title, type, user, setToast, onBack }) => {
  const [formType, setFormType] = useState('Sakit');
  const [desc, setDesc] = useState('');
  const [startTime, setStartTime] = useState('');
  const [finishTime, setFinishTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const isIzin = type === 'izin';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!desc) { setToast({msg:'Lengkapi form wajib!', type:'error'}); return; }
    if (!isIzin && (!startTime || !finishTime)) { setToast({msg:'Isi rentang jam kerja!', type:'error'}); return; }

    setIsSubmitting(true);
    try {
      if (isIzin) {
        await addDoc(getCollectionPath('leave_requests'), {
          username: user.username, nama: user.nama || user.username,
          timestamp: serverTimestamp(), type: formType, reason: desc, status: 'Menunggu'
        });
      } else {
        await addDoc(getCollectionPath('daily_reports'), {
          username: user.username, nama: user.nama || user.username,
          timestamp: serverTimestamp(), startTime, finishTime, taskDetail: desc
        });
      }
      setToast({ msg: 'Data form terkirim!', type: 'success' });
      setDesc(''); setStartTime(''); setFinishTime('');
      if(navigator.vibrate) navigator.vibrate(100);
    } catch (err) { setToast({ msg: 'Gagal mengirim data', type: 'error' }); } 
    finally { setIsSubmitting(false); }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <TopBar title={title} onBack={onBack} />
      <div className="p-5 flex-1 max-w-md mx-auto w-full mt-4">
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200 border border-slate-100 space-y-5">
          
          {isIzin ? (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">Kategori Izin</label>
              <div className="grid grid-cols-3 gap-3">
                {['Sakit', 'Izin', 'Cuti'].map(t => (
                  <button key={t} type="button" onClick={() => setFormType(t)}
                    className={`py-3 rounded-2xl text-sm font-bold border-2 transition-all ${formType === t ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">Jam Mulai</label>
                <input type="time" required value={startTime} onChange={e=>setStartTime(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-3 focus:border-blue-500 outline-none font-bold text-slate-700" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">Jam Selesai</label>
                <input type="time" required value={finishTime} onChange={e=>setFinishTime(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-3 focus:border-blue-500 outline-none font-bold text-slate-700" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">{isIzin ? 'Alasan Lengkap' : 'Deskripsi Pekerjaan'}</label>
            <textarea required value={desc} onChange={e=>setDesc(e.target.value)} rows="5" className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 focus:border-blue-500 outline-none resize-none text-sm text-slate-700 font-medium" placeholder="Tuliskan detailnya di sini..."></textarea>
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full bg-slate-900 text-white font-extrabold py-4 rounded-2xl hover:bg-slate-800 flex justify-center items-center gap-2 mt-4 transition-all shadow-lg active:scale-95">
            {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : <><Send size={20} /> Kirim Form</>}
          </button>
        </form>
      </div>
    </div>
  );
};


// ============================================================================
// MAIN ROUTER & APP
// ============================================================================
export default function App() {
  const [appState, setAppState] = useState('login'); 
  const [currentUser, setCurrentUser] = useState(null); 
  const [toastData, setToastData] = useState(null);
  const [firestoreUser, setFirestoreUser] = useState(null); 
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  const showToast = (data) => {
    setToastData(data);
    setTimeout(() => setToastData(null), 4000); 
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth); // Telah disesuaikan untuk login Vercel
      } catch (e) {
        showToast({msg: 'Koneksi Server Gagal', type: 'error'});
      }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setFirestoreUser(u);
      setIsAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (username, password) => {
    if (!username || !password) { showToast({ msg: 'Kredensial wajib diisi', type: 'error' }); return;