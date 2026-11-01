import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, MapPin, CheckCircle, Clock, Calendar, FileText, Send, Users, Settings, LogOut, Upload, Search, MessageSquare, AlertCircle, Menu, X, User } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';

// ==========================================
// 1. KONFIGURASI FIREBASE
// ==========================================
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ==========================================
// 2. KOMPONEN UTAMA (APP)
// ==========================================
export default function App() {
  // State Autentikasi
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null); // 'admin' atau 'employee'
  const [currentUser, setCurrentUser] = useState(null);
  const [loginMode, setLoginMode] = useState('employee'); // 'employee' | 'admin'

  // Kredensial Admin Default (Bisa diubah di Settings nantinya)
  const [adminCreds, setAdminCreds] = useState({ username: 'admin', password: 'admin' });
  
  // Data Mock (Sebaiknya dari Firestore, untuk demo ini menggunakan state)
  const [employees, setEmployees] = useState([
    { id: '1', username: 'karyawan1', password: '123', name: 'Budi Santoso', position: 'Welder' }
  ]);
  
  // State Admin Settings
  const [adminProfilePic, setAdminProfilePic] = useState(null);
  
  // State Navigasi
  const [activeTab, setActiveTab] = useState('presensi'); // Karyawan tab
  const [adminTab, setAdminTab] = useState('dashboard'); // Admin tab

  // ==========================================
  // LOGIN HANDLER
  // ==========================================
  const handleLogin = (e) => {
    e.preventDefault();
    const username = e.target.username.value;
    const password = e.target.password.value;

    if (loginMode === 'admin') {
      if (username === adminCreds.username && password === adminCreds.password) {
        setIsLoggedIn(true);
        setUserRole('admin');
        setCurrentUser({ name: 'Administrator' });
      } else {
        alert('Username atau Password Admin salah!');
      }
    } else {
      const emp = employees.find(emp => emp.username === username && emp.password === password);
      if (emp) {
        setIsLoggedIn(true);
        setUserRole('employee');
        setCurrentUser(emp);
      } else {
        alert('Akun karyawan tidak ditemukan atau kredensial salah!');
      }
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole(null);
    setCurrentUser(null);
  };

  // ==========================================
  // TAMPILAN LOGIN
  // ==========================================
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-slate-100">
        <div className="bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-700">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-blue-400 mb-2">PT Adaro Indonesia</h1>
            <p className="text-slate-400">Sistem Presensi & Laporan Kontraktor</p>
          </div>

          <div className="flex rounded-lg bg-slate-700 p-1 mb-6">
            <button 
              className={`flex-1 py-2 rounded-md font-medium transition-colors ${loginMode === 'employee' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'}`}
              onClick={() => setLoginMode('employee')}
            >
              Portal Karyawan
            </button>
            <button 
              className={`flex-1 py-2 rounded-md font-medium transition-colors ${loginMode === 'admin' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'}`}
              onClick={() => setLoginMode('admin')}
            >
              Portal Admin
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Username</label>
              <input type="text" name="username" required className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500" placeholder="Masukkan username" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input type="password" name="password" required className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500" placeholder="Masukkan password" />
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors mt-4">
              Masuk
            </button>
          </form>
          {loginMode === 'admin' && <p className="text-xs text-slate-500 text-center mt-4">Gunakan admin / admin untuk percobaan pertama</p>}
        </div>
      </div>
    );
  }

  // ==========================================
  // ROUTING RENDERER
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      {userRole === 'admin' ? (
        <AdminPortal 
          onLogout={handleLogout} 
          adminTab={adminTab} 
          setAdminTab={setAdminTab} 
          employees={employees} 
          setEmployees={setEmployees}
          adminCreds={adminCreds}
          setAdminCreds={setAdminCreds}
          adminProfilePic={adminProfilePic}
          setAdminProfilePic={setAdminProfilePic}
        />
      ) : (
        <EmployeePortal 
          onLogout={handleLogout} 
          currentUser={currentUser} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          db={db}
        />
      )}
    </div>
  );
}


// ==========================================
// PORTAL KARYAWAN
// ==========================================
function EmployeePortal({ onLogout, currentUser, activeTab, setActiveTab, db }) {
  const [time, setTime] = useState(new Date().toLocaleTimeString('id-ID'));
  
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date().toLocaleTimeString('id-ID')), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="max-w-md mx-auto bg-slate-800 min-h-screen shadow-2xl relative pb-20 border-x border-slate-700">
      {/* Header */}
      <header className="bg-slate-900 p-6 border-b border-slate-700 rounded-b-3xl shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Halo, {currentUser.name}</h2>
            <p className="text-blue-400 text-sm">{currentUser.position}</p>
          </div>
          <button onClick={onLogout} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-red-400 transition">
            <LogOut size={20} />
          </button>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 flex items-center justify-between border border-slate-700">
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Waktu Server</p>
            <p className="text-3xl font-mono font-bold text-white">{time}</p>
          </div>
          <Clock className="text-blue-500 opacity-50" size={40} />
        </div>
      </header>

      {/* Konten Utama */}
      <div className="p-6">
        {activeTab === 'presensi' && <TabPresensi db={db} currentUser={currentUser} />}
        {activeTab === 'izin' && <TabIzin db={db} currentUser={currentUser} />}
        {activeTab === 'laporan' && <TabLaporan db={db} currentUser={currentUser} />}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full max-w-md bg-slate-900 border-t border-slate-700 flex justify-around py-3 px-6 rounded-t-2xl z-50">
        <NavButton icon={<MapPin />} label="Presensi" active={activeTab === 'presensi'} onClick={() => setActiveTab('presensi')} />
        <NavButton icon={<Calendar />} label="Izin" active={activeTab === 'izin'} onClick={() => setActiveTab('izin')} />
        <NavButton icon={<FileText />} label="Laporan" active={activeTab === 'laporan'} onClick={() => setActiveTab('laporan')} />
      </nav>
    </div>
  );
}

function NavButton({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center p-2 transition-all ${active ? 'text-blue-500 transform -translate-y-1' : 'text-slate-500 hover:text-slate-300'}`}>
      {icon}
      <span className="text-[10px] font-medium mt-1">{label}</span>
    </button>
  );
}

// Fitur 1: Presensi Karyawan (Kamera & GPS)
function TabPresensi({ db, currentUser }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [streamActive, setStreamActive] = useState(false);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStreamActive(true);
        setErrorMsg('');
      }
    } catch (err) {
      setErrorMsg('Gagal mengakses kamera. Pastikan izin kamera diberikan.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      setStreamActive(false);
    }
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera(); // Cleanup saat pindah tab
  }, []);

  const handleCheckIn = () => {
    setLoading(true);
    setErrorMsg('');
    
    // 1. Ambil Lokasi
    if (!navigator.geolocation) {
      setErrorMsg('Browser Anda tidak mendukung GPS');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        // 2. Ambil Foto (Draw video to canvas)
        let photoBase64 = "";
        if (canvasRef.current && videoRef.current && streamActive) {
          const context = canvasRef.current.getContext('2d');
          canvasRef.current.width = videoRef.current.videoWidth;
          canvasRef.current.height = videoRef.current.videoHeight;
          context.drawImage(videoRef.current, 0, 0);
          photoBase64 = canvasRef.current.toDataURL('image/jpeg', 0.7);
        }

        // 3. Simpan ke Firestore (Opsional jika Anda sudah setup security rules)
        try {
          // Haptic Feedback jika didukung (Android)
          if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

          await addDoc(collection(db, "presensi"), {
            name: currentUser.name,
            timestamp: serverTimestamp(),
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            photo: photoBase64,
            type: 'Check-In'
          });

          setSuccess(true);
          stopCamera(); // Matikan kamera setelah berhasil
        } catch (e) {
          console.error("Error adding document: ", e);
          setErrorMsg('Gagal menyimpan data ke server.');
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        setErrorMsg('Gagal mendapatkan lokasi. Pastikan GPS aktif.');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="text-green-500" size={60} />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">Check-In Berhasil!</h3>
        <p className="text-slate-400 text-center">Data kehadiran, lokasi, dan foto Anda telah tersimpan dengan aman.</p>
        <button onClick={() => {setSuccess(false); startCamera();}} className="mt-8 text-blue-400 border border-blue-400 px-6 py-2 rounded-full hover:bg-blue-400 hover:text-white transition">
          Lakukan Presensi Baru
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 rounded-2xl p-4 border border-slate-700 relative overflow-hidden">
        {errorMsg ? (
           <div className="bg-red-900/50 p-4 rounded-xl text-red-200 text-sm flex items-start gap-3">
             <AlertCircle size={20} className="shrink-0 mt-0.5" />
             <p>{errorMsg}</p>
           </div>
        ) : (
          <div className="relative aspect-[3/4] bg-black rounded-xl overflow-hidden shadow-inner">
            <video ref={videoRef} autoPlay playsInline muted className="object-cover w-full h-full" />
            {/* Guide overlay */}
            <div className="absolute inset-0 pointer-events-none border-2 border-white/20 rounded-xl m-8 flex items-center justify-center">
              <span className="bg-black/50 text-white/70 text-xs px-3 py-1 rounded-full backdrop-blur-sm">Posisikan wajah di tengah</span>
            </div>
            {/* Hidden canvas for taking snapshot */}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}
      </div>

      <button 
        onClick={handleCheckIn} 
        disabled={loading || !!errorMsg}
        className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg transition-all ${loading ? 'bg-slate-700 text-slate-400' : errorMsg ? 'bg-red-900 text-red-400' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
      >
        {loading ? (
          <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Memproses GPS...</>
        ) : (
          <><Camera size={24} /> Check-In Sekarang</>
        )}
      </button>
    </div>
  );
}

// Fitur 2: Pengajuan Izin
function TabIzin({ db, currentUser }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Pengajuan Izin berhasil dikirim ke Admin!");
    e.target.reset();
  };

  return (
    <div className="bg-slate-900 p-5 rounded-2xl border border-slate-700">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Calendar size={20} className="text-blue-400"/> Form Pengajuan Izin</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-slate-400 mb-1">Jenis Izin</label>
          <select className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none">
            <option>Sakit</option>
            <option>Cuti Tahunan</option>
            <option>Izin Kepentingan Keluarga</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Tanggal Mulai</label>
          <input type="date" required className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Lampiran (Foto Surat Dokter/Bukti)</label>
          <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center hover:bg-slate-800 transition cursor-pointer">
            <Upload className="mx-auto text-slate-500 mb-2" />
            <p className="text-sm text-slate-400">Klik atau Drag & Drop foto di sini</p>
          </div>
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-500 transition">Kirim Pengajuan</button>
      </form>
    </div>
  );
}

// Fitur 3: Laporan Harian
function TabLaporan({ db, currentUser }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Laporan Harian berhasil disubmit!");
    e.target.reset();
  };

  return (
    <div className="bg-slate-900 p-5 rounded-2xl border border-slate-700">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><FileText size={20} className="text-blue-400"/> Laporan Pekerjaan Harian</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Waktu Mulai</label>
            <input type="time" required className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Waktu Selesai</label>
            <input type="time" required className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white" />
          </div>
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Area Kerja / Proyek</label>
          <input type="text" required placeholder="Contoh: Chute Tahap 4" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white" />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Detail Pekerjaan</label>
          <textarea required rows="4" placeholder="Deskripsikan pekerjaan yang diselesaikan hari ini..." className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none"></textarea>
        </div>
        <button type="submit" className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-500 transition flex items-center justify-center gap-2">
          <Send size={18} /> Submit Laporan
        </button>
      </form>
    </div>
  );
}

// ==========================================
// PORTAL ADMIN WEB BASE
// ==========================================
function AdminPortal({ onLogout, adminTab, setAdminTab, employees, setEmployees, adminCreds, setAdminCreds, adminProfilePic, setAdminProfilePic }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-200">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-0 -translate-x-full'} transition-all duration-300 bg-slate-900 border-r border-slate-800 flex flex-col`}>
        <div className="p-6 border-b border-slate-800 flex justify-between items-center whitespace-nowrap">
          <h1 className="font-bold text-xl text-blue-400 tracking-wider">ADARO <span className="text-white">ADMIN</span></h1>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <AdminNavLink icon={<FileText/>} label="Dashboard Rekap" active={adminTab==='dashboard'} onClick={() => setAdminTab('dashboard')} />
          <AdminNavLink icon={<Users/>} label="Kelola Karyawan" active={adminTab==='karyawan'} onClick={() => setAdminTab('karyawan')} />
          <AdminNavLink icon={<Settings/>} label="Pengaturan" active={adminTab==='settings'} onClick={() => setAdminTab('settings')} />
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button onClick={onLogout} className="flex items-center gap-3 w-full p-3 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition">
            <LogOut size={20} /> <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Topbar */}
        <header className="bg-slate-900 border-b border-slate-800 h-16 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-slate-400 hover:text-white">
              <Menu size={24} />
            </button>
            <h2 className="text-lg font-medium capitalize">{adminTab.replace('-', ' ')}</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input type="text" placeholder="Cari data..." className="bg-slate-800 border border-slate-700 rounded-full pl-9 pr-4 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 w-48 lg:w-64" />
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center overflow-hidden border border-slate-600">
              {adminProfilePic ? (
                <img src={adminProfilePic} alt="Admin" className="w-full h-full object-cover" />
              ) : (
                <User size={18} className="text-white" />
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-auto p-6">
          {adminTab === 'dashboard' && <AdminDashboard />}
          {adminTab === 'karyawan' && <AdminKaryawan employees={employees} setEmployees={setEmployees} />}
          {adminTab === 'settings' && <AdminSettings adminCreds={adminCreds} setAdminCreds={setAdminCreds} adminProfilePic={adminProfilePic} setAdminProfilePic={setAdminProfilePic} />}
        </div>
        
        {/* Gemini AI Widget (Mockup) */}
        <div className="absolute bottom-6 right-6">
          <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-2xl hover:scale-105 transition-transform flex items-center gap-2 group">
            <MessageSquare size={24} />
            <span className="w-0 overflow-hidden group-hover:w-20 transition-all duration-300 whitespace-nowrap text-sm font-medium">Tanya AI</span>
          </button>
        </div>
      </main>
    </div>
  );
}

function AdminNavLink({ icon, label, active, onClick }) {
  return (
    <button 
      onClick={onClick} 
      className={`flex items-center gap-3 w-full p-3 rounded-lg transition-colors ${active ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
    >
      {icon} <span className="font-medium">{label}</span>
    </button>
  );
}

// Tab Admin: Dashboard & Rekap Data
function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <p className="text-slate-400 text-sm mb-2">Presensi Hari Ini</p>
          <div className="text-3xl font-bold text-white mb-4">42 <span className="text-sm font-normal text-slate-500">/ 50 Karyawan</span></div>
          <div className="w-full bg-slate-800 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full" style={{width:'84%'}}></div></div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <p className="text-slate-400 text-sm mb-2">Izin & Cuti Menunggu</p>
          <div className="text-3xl font-bold text-yellow-500">3 <span className="text-sm font-normal text-slate-500">Pengajuan</span></div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <p className="text-slate-400 text-sm mb-2">Laporan Pekerjaan Masuk</p>
          <div className="text-3xl font-bold text-blue-400">38 <span className="text-sm font-normal text-slate-500">Laporan</span></div>
        </div>
      </div>
      
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-800">
          <h3 className="font-bold text-lg">Log Presensi Terbaru</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950 text-slate-400">
              <tr>
                <th className="p-4">Nama</th>
                <th className="p-4">Waktu</th>
                <th className="p-4">Lokasi (Lat, Lng)</th>
                <th className="p-4">Status</th>
                <th className="p-4">Foto Selfie</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              <tr className="hover:bg-slate-800/30">
                <td className="p-4 font-medium text-white">Budi Santoso</td>
                <td className="p-4 text-slate-400">06:45 WIB</td>
                <td className="p-4 text-slate-400">-2.1234, 115.4321 (Site Kelanis)</td>
                <td className="p-4"><span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs">Tepat Waktu</span></td>
                <td className="p-4"><div className="w-10 h-10 bg-slate-800 rounded border border-slate-700 flex items-center justify-center text-xs text-slate-500">Foto</div></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Tab Admin: Kelola Karyawan
function AdminKaryawan({ employees, setEmployees }) {
  const [showForm, setShowForm] = useState(false);

  const handleAddEmployee = (e) => {
    e.preventDefault();
    const newEmp = {
      id: Date.now().toString(),
      name: e.target.name.value,
      position: e.target.position.value,
      username: e.target.username.value,
      password: e.target.password.value,
    };
    setEmployees([...employees, newEmp]);
    setShowForm(false);
    alert('Karyawan berhasil ditambahkan!');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Database Karyawan</h2>
          <p className="text-sm text-slate-400">Kelola akses portal presensi karyawan Anda.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition">
          {showForm ? 'Batal' : '+ Tambah Karyawan'}
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-900 border border-blue-500/50 rounded-2xl p-6 shadow-lg mb-6">
          <h3 className="font-bold mb-4 border-b border-slate-800 pb-2">Buat Akun Karyawan Baru</h3>
          <form onSubmit={handleAddEmployee} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm mb-1 text-slate-400">Nama Lengkap</label><input name="name" required className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white" /></div>
            <div><label className="block text-sm mb-1 text-slate-400">Posisi / Jabatan</label><input name="position" required className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white" /></div>
            <div><label className="block text-sm mb-1 text-slate-400">Username Akses</label><input name="username" required className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white" /></div>
            <div><label className="block text-sm mb-1 text-slate-400">Password Akses</label><input name="password" required className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white" /></div>
            <div className="md:col-span-2 pt-2"><button type="submit" className="w-full md:w-auto bg-green-600 hover:bg-green-500 text-white px-6 py-2.5 rounded-lg font-bold">Simpan Akun</button></div>
          </form>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-950 text-slate-400">
            <tr>
              <th className="p-4">Nama Lengkap</th>
              <th className="p-4">Posisi</th>
              <th className="p-4">Username Login</th>
              <th className="p-4">Password</th>
              <th className="p-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {employees.map(emp => (
              <tr key={emp.id} className="hover:bg-slate-800/30">
                <td className="p-4 font-medium">{emp.name}</td>
                <td className="p-4 text-slate-400">{emp.position}</td>
                <td className="p-4"><span className="bg-slate-800 px-2 py-1 rounded font-mono text-blue-400">{emp.username}</span></td>
                <td className="p-4"><span className="bg-slate-800 px-2 py-1 rounded font-mono text-slate-500">{emp.password}</span></td>
                <td className="p-4 text-right">
                  <button onClick={() => setEmployees(employees.filter(e => e.id !== emp.id))} className="text-red-400 hover:text-red-300 text-xs bg-red-400/10 px-3 py-1 rounded">Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Tab Admin: Settings
function AdminSettings({ adminCreds, setAdminCreds, adminProfilePic, setAdminProfilePic }) {
  const handleUpdateCreds = (e) => {
    e.preventDefault();
    const baru = e.target.newUser.value;
    const pass = e.target.newPass.value;
    setAdminCreds({ username: baru, password: pass });
    alert("Kredensial Admin berhasil diperbarui! Gunakan saat login berikutnya.");
    e.target.reset();
  };

  const handlePicUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAdminProfilePic(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <h2 className="text-xl font-bold border-b border-slate-800 pb-4">Pengaturan Sistem</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Seting Akun & Kredensial */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <h3 className="font-bold text-blue-400 mb-4 flex items-center gap-2"><User size={18}/> Kredensial & Profil Admin</h3>
          
          <div className="mb-6 flex items-center gap-4">
             <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-blue-500 overflow-hidden shrink-0 flex items-center justify-center">
               {adminProfilePic ? <img src={adminProfilePic} alt="Profile" className="w-full h-full object-cover"/> : <User size={24} className="text-slate-500"/>}
             </div>
             <div>
               <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-xs px-3 py-1.5 rounded border border-slate-700 transition">
                 Ubah Foto Profil
                 <input type="file" accept="image/*" className="hidden" onChange={handlePicUpload} />
               </label>
               <p className="text-[10px] text-slate-500 mt-1">Format: JPG, PNG (Max 2MB)</p>
             </div>
          </div>

          <form onSubmit={handleUpdateCreds} className="space-y-4 pt-4 border-t border-slate-800">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Username Admin Baru</label>
              <input name="newUser" required defaultValue={adminCreds.username} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Password Admin Baru</label>
              <input name="newPass" required type="password" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white" />
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg font-medium transition">Perbarui Kredensial</button>
          </form>
        </div>

        {/* Seting Geofencing */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <h3 className="font-bold text-blue-400 mb-4 flex items-center gap-2"><MapPin size={18}/> Geofencing & Lokasi Proyek</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Titik Koordinat Utama (Lat, Lng)</label>
              <input defaultValue="-2.1234, 115.4321" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-300 font-mono text-sm" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Radius Toleransi (Meter)</label>
              <input type="number" defaultValue="500" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white" />
            </div>
            <button className="bg-slate-800 hover:bg-slate-700 text-white py-2 px-4 rounded-lg font-medium transition text-sm">Simpan Lokasi</button>
          </div>
        </div>
      </div>
    </div>
  );
}