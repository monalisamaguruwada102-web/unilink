import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { supabase } from './lib/supabase'; // Live SDK
import { 
  Heart, X, MessageCircle, Info, ShieldCheck, GraduationCap, 
  MapPin, School, Mail, User, Sparkles, Send, Image as ImageIcon, 
  Share2, Play, Hash, Globe, Filter, Navigation, Star, Bell, Settings,
  CheckCheck, Search, ChevronRight, Plus, Camera, Video, MessageSquare,
  Users, Trash2, ArrowLeft, MoreHorizontal, UserCheck, Eye, EyeOff,
  Calendar, BookOpen, Building, LogOut, Edit3, Image as LucidImage,
  RefreshCcw, Sparkle, Loader2
} from 'lucide-react';

// --- CUSTOM DATE SCROLLER ---
const DateScroller = ({ value, onChange }) => {
  const years = Array.from({ length: 50 }, (_, i) => 2024 - i);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="flex gap-2 w-full">
       <select className="input-field flex-1" value={value.month} onChange={(e) => onChange({...value, month: e.target.value})}>
          {months.map(m => <option key={m} value={m}>{m}</option>)}
       </select>
       <select className="input-field flex-1" value={value.day} onChange={(e) => onChange({...value, day: e.target.value})}>
          {days.map(d => <option key={d} value={d}>{d}</option>)}
       </select>
       <select className="input-field flex-1" value={value.year} onChange={(e) => onChange({...value, year: e.target.value})}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
       </select>
    </div>
  );
};

// --- CORE SYSTEM: SUPABASE INTEGRATED ---

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('register');
  const [notifications, setNotifications] = useState([]);

  // Live Registration State
  const [user, setUser] = useState({
    name: "", surname: "", polytechnic: "", course: "", 
    dob: { day: '1', month: 'Jan', year: '2004' },
    gender: 'Female', email: "", password: "",
    image: null, lat: null, lng: null
  });

  const [setupStep, setSetupStep] = useState(1);
  const [posts, setPosts] = useState([]);
  const [matches, setMatches] = useState([]);
  
  const ZimbabwePolys = [
    "Harare Polytechnic", "Bulawayo Polytechnic", "Mutare Polytechnic", 
    "Kwekwe Polytechnic", "Masvingo Polytechnic", "Gweru Polytechnic", 
    "Joshua Mqabuko Nkomo Polytechnic", "Kushinga Phikelela Polytechnic"
  ];

  // Auth Hook
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) setView('discovery');
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) setView('discovery');
    });
  }, []);

  const addNotification = (text, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [{ id, text, type }, ...prev]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
  };

  // --- DATABASE ACTIONS ---

  const handleRegister = async () => {
    setLoading(true);
    try {
      // 1. Sign Up User
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: user.email,
        password: user.password,
      });

      if (authError) throw authError;

      // 2. Add to Detailed Profiles
      const { error: profileError } = await supabase.from('profiles').insert([{
        id: authData.user.id,
        name: user.name,
        surname: user.surname,
        polytechnic: user.polytechnic,
        course: user.course,
        gender: user.gender,
        email: user.email
      }]);

      if (profileError) throw profileError;

      addNotification("Welcome to UniLink!", "spark");
      setView('login');
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadProfile = async (file) => {
    if (!session) return;
    setLoading(true);
    try {
      const fileName = `avatars/${session.user.id}-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage.from('media').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('media').getPublicUrl(fileName);
      await supabase.from('profiles').update({ avatar_url: urlData.publicUrl }).eq('id', session.user.id);
      
      setUser({...user, image: urlData.publicUrl});
      addNotification("Profile Image Updated!");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- VIEWS ---

  if (!session && (view === 'register' || view === 'login')) return (
    <div className="min-h-screen bg-gradient-premium p-8 py-16 flex flex-col items-center">
       <div className="absolute top-10 flex flex-col items-center">
          <Sparkles size={48} className="text-accent-pink mb-2" />
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-gradient leading-none">UniLink</h1>
       </div>
       
       <AnimatePresence>
         {notifications.map(n => <NotificationAlert key={n.id} {...n} onClose={() => setNotifications(prev => prev.filter(x => x.id !== n.id))} />)}
       </AnimatePresence>

       {view === 'register' && (
         <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="w-full max-w-[400px] mt-24 space-y-6">
            <h2 className="text-2xl font-black italic uppercase text-white px-2">Join Platform <span className="text-[10px] text-primary-400">({setupStep}/2)</span></h2>

            <AnimatePresence mode="wait">
               {setupStep === 1 ? (
                 <motion.div key="r1" initial={{ x: 10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 pb-2"><input className="input-field" placeholder="Name" value={user.name} onChange={e => setUser({...user, name: e.target.value})} /><input className="input-field" placeholder="Surname" value={user.surname} onChange={e => setUser({...user, surname: e.target.value})} /></div>
                    <DateScroller value={user.dob} onChange={(v) => setUser({...user, dob: v})} />
                    <div className="flex gap-2">
                       {['Male','Female'].map(g => (<button key={g} onClick={() => setUser({...user, gender: g})} className={`flex-1 py-4 rounded-2xl border text-[9px] font-black uppercase transition-all ${user.gender === g ? 'bg-primary-600 border-primary-500 shadow-glow' : 'bg-white/5 opacity-50'}`}>{g}</button>))}
                    </div>
                 </motion.div>
               ) : (
                 <motion.div key="r2" initial={{ x: 10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-4">
                    <select className="input-field appearance-none" value={user.polytechnic} onChange={e => setUser({...user, polytechnic: e.target.value})}><option>Select Poly...</option>{ZimbabwePolys.map(p => <option key={p} value={p}>{p}</option>)}</select>
                    <input className="input-field" placeholder="@email.com" value={user.email} onChange={e => setUser({...user, email: e.target.value})} />
                    <input className="input-field" type="password" placeholder="Password" value={user.password} onChange={e => setUser({...user, password: e.target.value})} />
                 </motion.div>
               )}
            </AnimatePresence>

            <button disabled={loading} onClick={() => setupStep < 2 ? setSetupStep(2) : handleRegister()} className="btn-primary w-full py-5 font-black uppercase tracking-widest italic shadow-xl h-20">
               {loading ? <Loader2 className="animate-spin" /> : (setupStep === 2 ? 'Complete Setup' : 'Next Stage')}
            </button>
            <button onClick={() => setView('login')} className="w-full text-white/30 text-[9px] font-black uppercase hover:text-white transition-all">Sign In Instead</button>
         </motion.div>
       )}

       {view === 'login' && (
         <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-[340px] mt-24 space-y-4">
            <input className="input-field text-center" placeholder="Email" />
            <input className="input-field text-center" type="password" placeholder="Password" />
            <button onClick={() => setView('discovery')} className="btn-primary w-full py-5 font-black uppercase tracking-widest h-16">Enter Platform</button>
            <button onClick={() => setView('register')} className="w-full text-white/30 text-[9px] font-black uppercase hover:text-white">Register New Account</button>
         </motion.div>
       )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-premium flex flex-col items-center">
       <header className="w-full max-w-[600px] px-8 pt-10 pb-4 flex justify-between items-center z-[100]">
         <div className="flex flex-col"><h1 className="text-2xl font-black italic tracking-tighter text-gradient uppercase">UniLink</h1><span className="text-[8px] font-black text-white/20 tracking-[0.4em] uppercase">{user.polytechnic || 'Zimbabwe Student'}</span></div>
         <button onClick={() => setView('profile')} className="w-12 h-12 rounded-2xl border-2 border-primary-500/30 overflow-hidden shadow-glow">
            {user.image ? <img src={user.image} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-white/10 flex items-center justify-center text-white/30"><User size={20}/></div>}
         </button>
       </header>

       <main className="flex-1 w-full max-w-[600px] flex flex-col items-center relative pb-32">
          {view === 'discovery' && (
             <div className="flex flex-col items-center justify-center min-h-[70vh] opacity-30 text-center px-10">
                <Heart size={64} className="mb-6"/>
                <h3 className="text-2xl font-black italic uppercase tracking-tighter">Nearby Students</h3>
                <p className="text-xs font-bold leading-relaxed italic">The live database is empty. Be the first to join your college feed!</p>
             </div>
          )}

          {view === 'profile' && (
             <motion.div className="w-full px-8 flex flex-col items-center pb-12">
                <div className="relative mb-8 mt-10">
                   <div className="w-40 h-40 rounded-[3.5rem] bg-white/5 border-4 border-primary-500/20 overflow-hidden shadow-glow">
                      {user.image ? <img src={user.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white/10"><User size={64}/></div>}
                   </div>
                   <label className="absolute bottom-2 right-2 w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center shadow-2xl cursor-pointer hover:scale-110 active:scale-90 transition-all">
                      <LucidImage size={24} />
                      <input type="file" className="hidden" onChange={(e) => handleUploadProfile(e.target.files[0])} />
                   </label>
                </div>
                <div className="text-center mb-10"><h3 className="text-3xl font-black italic uppercase leading-none mb-2">{user.name || 'Admin'}</h3><p className="text-primary-400 font-bold tracking-widest text-xs uppercase">{user.polytechnic || 'Mutare Poly'}</p></div>
                <button onClick={() => supabase.auth.signOut().then(() => setSession(null))} className="w-full py-5 rounded-3xl bg-red-500/10 text-red-500 font-black uppercase text-[10px] flex items-center justify-center gap-3">Logout</button>
             </motion.div>
          )}
       </main>

       <nav className="fixed bottom-0 w-full max-w-[500px] glass-card h-32 flex items-stretch border-x-0 border-b-0 rounded-t-[5rem] px-12 shadow-[0_-40px_80px_rgba(0,0,0,0.8)] z-[100]">
          {[{id:'discovery',icon:Heart},{id:'feed',icon:Globe},{id:'chat',icon:MessageSquare}].map(t => (
            <button key={t.id} onClick={() => setView(t.id)} className={`flex-1 flex flex-col items-center justify-center gap-2 transition-all ${view === t.id ? 'text-primary-400' : 'text-white/20'}`}><t.icon size={30}/><span className="text-[10px] font-black uppercase tracking-[0.2em] italic">{t.id}</span></button>
          ))}
       </nav>
    </div>
  );
}

function NotificationAlert({ text, type = 'info', onClose }) {
  return (
    <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 20, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className="fixed top-0 left-1/2 -translate-x-1/2 z-[200] w-[90vw] max-w-[400px]">
       <div className="p-4 rounded-2xl glass-card border border-white/10 flex items-center gap-4 bg-black/80">
          <Sparkle size={24} className="text-primary-400" />
          <p className="flex-1 text-sm font-bold text-white/90">{text}</p>
          <button onClick={onClose}><X size={16}/></button>
       </div>
    </motion.div>
  );
}

export default App;
