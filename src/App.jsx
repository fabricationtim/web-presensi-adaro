import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { LayoutDashboard, MapPin, Calendar, FileText, Users, Settings, LogOut, Briefcase, CheckCircle, ClipboardList, Camera } from 'lucide-react';

// 1. Konfigurasi Firebase (Otomatis mengambil dari Vercel/File .env)
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

export default function App() {
  const [userRole, setUserRole] = useState(null); // 'admin' atau 'karyawan'
  const [username, setUsername] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // State Data Admin
  const [dataPresensi, setDataPresensi] = useState([]);
  const [dataLaporan, setDataLaporan] = useState([]);
  const [dataIzin, setDataIzin] = useState([]);

  // Fungsi Login
  const handleLogin = (e) => {
    e.preventDefault();
    const inputUser = e.target.username.value;
    const inputPass = e.target.password.value;
    
    if (inputUser === 'admin' && inputPass === 'admin') {
      setUserRole('admin');
      setUsername('Administrator');
      fetchAdminData();
    } else if (inputUser && inputPass) {
      setUserRole('karyawan');
      setUsername(inputUser);
    } else {
      alert("Harap isi username dan password!");
    }
  };

  // Fungsi Mengambil Data dari Firebase untuk Admin
  const fetchAdminData = async () => {
    try {
      const presensiSnap = await getDocs(query(collection(db, "presensi"), orderBy("waktu", "desc")));
      setDataPresensi(presensiSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const laporanSnap = await getDocs(query(collection(db, "laporan"), orderBy("waktu", "desc")));
      setDataLaporan(laporanSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const izinSnap = await getDocs(query(collection(db, "izin"), orderBy("waktu", "desc")));
      setDataIzin(izinSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Gagal mengambil data: ", error);
    }
  };

  // === HALAMAN LOGIN ===
  if (!userRole) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white">
              <Briefcase size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">PT Adaro Indonesia</h1>
            <p className="text-slate-500 text-sm mt-1">Sistem Presensi & Laporan Kontraktor</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-slate-700 text-sm font-medium mb-2">Username</label>
              <input type="text" name="username" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Masukkan username" />
            </div>
            <div>
              <label className="block text-slate-700 text-sm font-medium mb-2">Password</label>
              <input type="password" name="password" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Masukkan password" />
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition-colors shadow-md shadow-blue-200">
              Masuk Sistem
            </button>
          </form>
        </div>
      </div>
    );
  }

  // === PORTAL ADMIN ===
  if (userRole === 'admin') {
    return (
      <div className="flex h-screen bg-slate-50 font-sans">
        {/* Sidebar */}
        <div className="w-72 bg-slate-900 text-slate-300 flex flex-col">
          <div className="p-6 border-b border-slate-800 flex items-center gap-4">
            <div className="bg-blue-600 p-2.5 rounded-xl text-white">
              <Briefcase size={24} />
            </div>
            <div>
              <h2 className="text-white font-black tracking-wide text-lg">ADMIN</h2>
              <p className="text-xs text-blue-400 font-medium tracking-wider uppercase">Contractor Hub</p>
            </div>
          </div>
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {[
              { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
              { id: 'data', icon: <MapPin size={20} />, label: 'Data Presensi' },
              { id: 'izin', icon: <Calendar size={20} />, label: 'Data Izin Kerja' },
              { id: 'laporan', icon: <FileText size={20} />, label: 'Laporan Harian' },
            ].map((item) => (
              <button key={item.id} onClick={() => { setActiveTab(item.id); fetchAdminData(); }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${
                  activeTab === item.id ? 'bg-blue-600 text-white font-medium shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 hover:text-white'
                }`}>
                {item.icon}
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-slate-800">
            <button onClick={() => setUserRole(null)} className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-slate-800 rounded-xl transition-colors">
              <LogOut size={20} />
              <span className="text-sm font-medium">Keluar</span>
            </button>
          </div>
        </div>

        {/* Konten Utama Admin */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white border-b border-slate-200 h-20 flex items-center justify-between px-8 shrink-0">
            <h1 className="text-2xl font-bold text-slate-800 capitalize">{activeTab.replace('-', ' ')}</h1>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-bold text-slate-800 leading-tight">Admin Site Kelanis</p>
                <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">Administrator</p>
              </div>
              <div className="w-11 h-11 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200">
                <Users size={22} className="text-slate-500" />
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-8">
            {activeTab === 'dashboard' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center gap-5">
                  <div className="bg-blue-50 text-blue-600 p-4 rounded-2xl"><Users size={32} /></div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 tracking-wider mb-1">TOTAL DATA</p>
                    <h3 className="text-2xl font-black text-slate-800">{dataPresensi.length + dataLaporan.length + dataIzin.length} Entri</h3>
                  </div>
                </div>
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center gap-5">
                  <div className="bg-green-50 text-green-600 p-4 rounded-2xl"><CheckCircle size={32} /></div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 tracking-wider mb-1">PRESENSI MASUK</p>
                    <h3 className="text-2xl font-black text-slate-800">{dataPresensi.length} Pekerja</h3>
                  </div>
                </div>
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center gap-5">
                  <div className="bg-indigo-50 text-indigo-600 p-4 rounded-2xl"><ClipboardList size={32} /></div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 tracking-wider mb-1">LAPORAN MASUK</p>
                    <h3 className="text-2xl font-black text-slate-800">{dataLaporan.length} Dokumen</h3>
                  </div>
                </div>
              </div>
            )}

            {/* Tabel Data Admin */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="p-4 text-sm font-semibold text-slate-600">Nama/Karyawan</th>
                    <th className="p-4 text-sm font-semibold text-slate-600">Waktu Input</th>
                    <th className="p-4 text-sm font-semibold text-slate-600">Detail / Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {(activeTab === 'data' || activeTab === 'dashboard' ? dataPresensi : activeTab === 'izin' ? dataIzin : dataLaporan).map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-medium text-slate-800">{item.nama}</td>
                      <td className="p-4 text-sm text-slate-500">
                        {item.waktu?.toDate ? item.waktu.toDate().toLocaleString('id-ID') : 'Baru saja'}
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        {item.lokasi && <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">Lat: {item.lokasi.lat.toFixed(4)}, Lng: {item.lokasi.lng.toFixed(4)}</span>}
                        {item.jenisIzin && `Izin: ${item.jenisIzin} - ${item.alasan}`}
                        {item.pekerjaan && `Tugas: ${item.pekerjaan}`}
                      </td>
                    </tr>
                  ))}
                  {(activeTab === 'data' ? dataPresensi : activeTab === 'izin' ? dataIzin : dataLaporan).length === 0 && (
                     <tr><td colSpan="3" className="p-8 text-center text-slate-400">Belum ada data terekam.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // === PORTAL KARYAWAN (USER) ===
  const submitPresensi = async () => {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        await addDoc(collection(db, "presensi"), {
          nama: username,
          lokasi: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          waktu: serverTimestamp(),
          status: "Hadir"
        });
        alert("✅ Presensi berhasil dikirim ke Admin!");
      } catch (e) { alert("Gagal mengirim data: " + e.message); }
    }, () => alert("Mohon izinkan akses GPS lokasi!"));
  };

  const submitIzin = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "izin"), {
        nama: username,
        jenisIzin: e.target.jenis.value,
        alasan: e.target.alasan.value,
        waktu: serverTimestamp()
      });
      alert("✅ Pengajuan izin terkirim!"); e.target.reset();
    } catch (e) { alert("Error: " + e.message); }
  };

  const submitLaporan = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "laporan"), {
        nama: username,
        pekerjaan: e.target.pekerjaan.value,
        waktu: serverTimestamp()
      });
      alert("✅ Laporan pekerjaan berhasil disubmit!"); e.target.reset();
    } catch (e) { alert("Error: " + e.message); }
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-20">
      <header className="bg-blue-600 text-white p-6 shadow-md rounded-b-3xl mb-6">
        <h1 className="text-xl font-bold">Halo, {username}</h1>
        <p className="text-blue-100 text-sm">Portal Pekerja Lapangan</p>
      </header>

      <div className="px-4 space-y-6 max-w-md mx-auto">
        {/* Form Presensi */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><MapPin size={20} className="text-blue-500"/> Absensi Hari Ini</h2>
          <button onClick={submitPresensi} className="w-full bg-green-500 hover:bg-green-600 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-green-200 transition-all">
            <Camera size={24} /> Check-In Sekarang
          </button>
        </div>

        {/* Form Laporan */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><ClipboardList size={20} className="text-blue-500"/> Laporan Pekerjaan</h2>
          <form onSubmit={submitLaporan} className="space-y-3">
            <textarea name="pekerjaan" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500" placeholder="Apa yang Anda kerjakan hari ini?"></textarea>
            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold">Kirim Laporan</button>
          </form>
        </div>

        {/* Form Izin */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Calendar size={20} className="text-blue-500"/> Pengajuan Izin/Sakit</h2>
          <form onSubmit={submitIzin} className="space-y-3">
            <select name="jenis" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <option value="Sakit">Sakit (dengan Keterangan Dokter)</option>
              <option value="Izin">Izin Keperluan Pribadi</option>
            </select>
            <input type="text" name="alasan" required placeholder="Alasan spesifik..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" />
            <button type="submit" className="w-full bg-slate-800 text-white py-3 rounded-xl font-semibold">Ajukan Izin</button>
          </form>
        </div>

        <button onClick={() => setUserRole(null)} className="w-full text-slate-500 font-medium py-3">Keluar (Log Out)</button>
      </div>
    </div>
  );
}