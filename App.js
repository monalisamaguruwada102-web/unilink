import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Image, SafeAreaView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, FlatList, Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { supabase } from './src/lib/supabase';
import { 
  Heart, X, MessageCircle, Info, ShieldCheck, GraduationCap, 
  MapPin, School, Mail, User, Sparkles, Send, Globe, Filter, Star, 
  Bell, Plus, Image as LucidImage, ArrowLeft, MoreHorizontal,
  MessageSquare, UserPlus, BookOpen, Ticket, Zap, Ghost, ShoppingBag, Phone
} from 'lucide-react-native';
import * as Location from 'expo-location';

// --- UNI-LINK STUDENT ECOSYSTEM (v2.1 STABILIZED) ---

export default function App() {
  const [session, setSession] = useState(null);
  const [view, setView] = useState('register'); // register | login | discovery | feed | chat | profile | events
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({ name: "", poly: "", course: "", year: 1, phone: "" });
  
  // Real-Time System States
  const [posts, setPosts] = useState([]);
  const [matches, setMatches] = useState([]);
  const [nearbyStudents, setNearbyStudents] = useState([]);
  const [events, setEvents] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeChat, setActiveChat] = useState(null);

  // Feature Toggles
  const [isStudyMode, setIsStudyMode] = useState(false); // Study Buddy Mode
  const [isAnonPost, setIsAnonPost] = useState(false); // Anonymous Confessions

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
         fetchProfile(session.user.id);
         fetchFeed();
         fetchDiscovery();
         fetchEvents();
         fetchMatches();
         setView('discovery');
      }
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) setView('discovery');
    });
  }, []);

  const fetchProfile = async (id) => {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', id).single();
      if (data) setUserData({ name: data.name, poly: data.polytechnic, course: data.course, year: data.year_of_study || 1, phone: data.phone_number });
    } catch(err) { console.log("Profile Sync Fail"); }
  };

  const fetchFeed = async () => {
    try {
      const { data } = await supabase.from('posts').select('*, profiles(name, polytechnic)').order('created_at', { ascending: false });
      if (data) setPosts(data);
    } catch(err) {}
  };

  const fetchDiscovery = async () => {
    try {
      let query = supabase.from('profiles').select('*').limit(15);
      if (isStudyMode && userData.course) query = query.eq('course', userData.course); 
      const { data } = await query;
      if (data && session) setNearbyStudents(data.filter(p => p.id !== session.user.id));
    } catch(err) {}
  };

  const fetchEvents = async () => {
    try {
      const { data } = await supabase.from('events').select('*').order('event_date', { ascending: true });
      if (data) setEvents(data);
    } catch(err) {}
  };

  const fetchMatches = async () => {
    if (!session) return;
    try {
      const { data } = await supabase.from('matches').select('*, profiles!user_2(name, polytechnic, phone_number)').or(`user_1.eq.${session.user.id},user_2.eq.${session.user.id}`);
      if (data) setMatches(data);
    } catch(err) {}
  };

  useEffect(() => { fetchDiscovery(); }, [isStudyMode]);

  // --- ACTIONS ---

  const openWhatsApp = (phone) => {
    if (!phone) return Alert.alert("Not Shared", "Student has not shared their WhatsApp yet.");
    const url = `whatsapp://send?phone=${phone}`;
    Linking.openURL(url).catch(() => Alert.alert("WhatsApp Not Found", "Please install WhatsApp to chat directly."));
  };

  const handleRSVP = async (evId) => {
    Alert.alert("RSVP Confirmed! 🎫", "Check your student email for your digital ticket.");
  };

  // --- SUB-VIEWS ---

  const EventHub = () => (
     <ScrollView className="flex-1 px-8 pt-4">
        <View className="flex-row justify-between items-center mb-10"><Text className="text-2xl font-black italic uppercase text-white tracking-widest leading-none">Poly Event Hub</Text><TouchableOpacity className="w-12 h-12 bg-primary-600 rounded-2xl items-center justify-center shadow-glow shadow-primary-500/30"><Ticket color="#fff" size={24}/></TouchableOpacity></View>
        {(events.length > 0 ? events : [{id:1,title:'Graduation Afterparty',location:'Great Hall',date:'OCT 20',price:'$5'}]).map(ev => (
          <View key={ev.id} className="bg-white/5 p-6 rounded-[3.5rem] border border-white/10 shadow-2xl mb-6 relative overflow-hidden">
             <View className="absolute top-4 right-4 bg-primary-600 px-3 py-1 rounded-full"><Text className="text-white text-[8px] font-black uppercase tracking-widest">{ev.price || 'FREE'}</Text></View>
             <Text className="text-xl font-black italic text-white mb-2 uppercase">{ev.title}</Text>
             <View className="flex-row items-center gap-2 mb-4"><MapPin color="#7c3aed" size={14}/><Text className="text-xs font-bold text-white/50">{ev.location} • {ev.date}</Text></View>
             <TouchableOpacity onPress={() => handleRSVP(ev.id)} className="bg-primary-600 py-5 rounded-3xl items-center shadow-glow"><Text className="text-white font-black italic uppercase tracking-widest text-xs">Secure Spot</Text></TouchableOpacity>
          </View>
        ))}
     </ScrollView>
  );

  // --- MAIN RENDER ---

  const MainApp = () => (
     <SafeAreaView className="flex-1 bg-[#05051e]">
       <StatusBar style="light" />
       
       {!session ? (
         <View className="flex-1 p-8 justify-center items-center">
            <Sparkles size={64} color="#f472b6" />
            <Text className="text-5xl font-black italic uppercase text-white mt-6 tracking-tighter">UniLink</Text>
            <TouchableOpacity onPress={() => setView('login')} className="bg-primary-600 w-full py-6 rounded-[2.5rem] items-center mt-20 shadow-glow shadow-primary-500/40 border-2 border-primary-500"><Text className="text-white font-black italic uppercase tracking-widest text-lg">Enter Platform</Text></TouchableOpacity>
            <Text className="mt-8 text-white/20 text-[10px] font-black uppercase tracking-widest italic">Zimbabwe Student Ecosystem</Text>
         </View>
       ) : (
         <>
           <View className="px-8 pt-10 pb-4 flex-row justify-between items-center z-50">
              <View><Text className="text-2xl font-black italic text-primary-500 uppercase">UniLink</Text><Text className="text-[8px] font-black text-white/30 uppercase tracking-[0.4em]">{userData.poly || 'Zimbabwe Poly'}</Text></View>
              <TouchableOpacity onPress={() => setView('profile')} className="w-12 h-12 bg-white/5 rounded-2xl border-2 border-primary-500/30 items-center justify-center shadow-glow"><User color="#7c3aed" size={24}/></TouchableOpacity>
           </View>

           <View className="flex-1 pb-32">
              {view === 'discovery' && (
                 <ScrollView className="flex-1 px-8 pt-4">
                    <View className="flex-row justify-between items-end mb-10">
                       <View><Text className="text-2xl font-black italic text-white uppercase">{isStudyMode ? 'Study Match' : 'Nearby students'}</Text><Text className="text-[8px] font-black text-white/20 uppercase tracking-widest italic">{isStudyMode ? `Academic Target: ${userData.course}` : 'Campus Proximity active'}</Text></View>
                       <TouchableOpacity onPress={() => setIsStudyMode(!isStudyMode)} className={`px-5 py-4 rounded-[2rem] border-2 flex-row items-center gap-3 ${isStudyMode ? 'bg-primary-600 border-primary-400 shadow-glow' : 'bg-white/5 border-white/5 opacity-50'}`}><BookOpen color="#fff" size={18}/><Text className="text-white text-[10px] font-black uppercase tracking-widest">{isStudyMode ? 'ON' : 'STUDY'}</Text></TouchableOpacity>
                    </View>
                    {nearbyStudents.map(p => (
                       <View key={p.id} className="w-full h-[60vh] rounded-[3.5rem] bg-white/5 mb-10 overflow-hidden border border-white/10 shadow-2xl relative">
                          <View className="absolute inset-x-0 bottom-0 p-10 h-1/2 bg-gradient-to-t from-black justify-end">
                             <Text className="text-4xl font-black italic text-white uppercase leading-none mb-1">{p.name || 'Student'}</Text>
                             <Text className="text-primary-400 font-bold uppercase text-[10px] mb-8 tracking-[0.2em]">{p.polytechnic} • {p.course}</Text>
                             <View className="flex-row gap-5"><TouchableOpacity className="w-16 h-16 bg-white/5 rounded-full items-center justify-center border border-white/20"><X color="#ef4444" size={32}/></TouchableOpacity><TouchableOpacity className="flex-1 bg-primary-600 py-6 rounded-3xl items-center shadow-glow"><Text className="text-white font-black italic uppercase tracking-widest text-lg">{isStudyMode ? 'Meet & Study' : 'Express Love'}</Text></TouchableOpacity></View>
                          </View>
                       </View>
                    ))}
                 </ScrollView>
              )}

              {view === 'feed' && (
                 <ScrollView className="flex-1 px-8 pt-4">
                    <View className="flex-row justify-between items-center mb-10">
                       <View><Text className="text-2xl font-black italic uppercase text-white">Campus Flow</Text><Text className="text-[8px] font-black text-white/30 uppercase tracking-widest italic">{isAnonPost ? 'Anonymous Confidential active 🎭' : 'Real-Time Voice'}</Text></View>
                       <TouchableOpacity onPress={() => setIsAnonPost(!isAnonPost)} className={`px-5 py-4 rounded-3xl border-2 flex-row items-center gap-3 ${isAnonPost ? 'bg-black border-white/50 shadow-glow' : 'bg-white/5 border-white/10 opacity-30'}`}><Ghost color={isAnonPost?'#fff':'#333'} size={18}/><Text className="text-white text-[10px] font-black uppercase italic">ANON</Text></TouchableOpacity>
                    </View>
                    <View className="bg-white/5 p-5 rounded-[2.5rem] mb-12 border border-white/5 flex-row items-center gap-4 shadow-xl">
                       <TextInput className="flex-1 text-white text-sm font-bold italic" placeholder={isAnonPost ? "Type your confession..." : "Post to campus..."} placeholderTextColor="#333" />
                       <TouchableOpacity className="bg-primary-600 p-4 rounded-2xl shadow-glow shadow-primary-500/30"><Send color="#fff" size={20}/></TouchableOpacity>
                    </View>
                    {posts.map(p => (
                       <View key={p.id} className={`p-8 rounded-[3.5rem] border mb-8 shadow-2xl ${p.is_anonymous ? 'bg-black border-white/20' : 'bg-white/5 border-white/5'}`}>
                          <View className="flex-row items-center gap-4 mb-6">
                             <View className={`w-12 h-12 rounded-2xl items-center justify-center shadow-glow ${p.is_anonymous ? 'bg-indigo-900' : 'bg-primary-600'}`}>{p.is_anonymous ? <Ghost color="#fff" size={24}/> : <User color="#fff" size={24}/>}</View>
                             <View className="flex-1"><Text className="text-white font-black text-sm italic">{p.is_anonymous ? 'Secret Student' : p.profiles?.name}</Text><Text className="text-[10px] text-white/20 uppercase tracking-widest font-black">{p.profiles?.polytechnic} • CAMPUS NEWS</Text></View>
                          </View>
                          <Text className="text-sm font-bold italic text-white/80 leading-relaxed">"{p.content}"</Text>
                       </View>
                    ))}
                 </ScrollView>
              )}

              {view === 'events' && <EventHub />}
              
              {view === 'chat' && (
                 <ScrollView className="flex-1 px-8 pt-4">
                    <Text className="text-2xl font-black italic uppercase text-white mb-10 tracking-widest">In-App Inbox</Text>
                    {matches.length > 0 ? matches.map(m => (
                        <TouchableOpacity key={m.id} className="bg-white/5 p-6 rounded-[2.5rem] border border-white/5 flex-row items-center gap-4 mb-4 relative overflow-hidden">
                           <View className="w-16 h-16 rounded-[1.5rem] bg-primary-500/20 items-center justify-center"><User color="#7c3aed" size={32}/></View>
                           <View className="flex-1"><Text className="text-white font-black italic uppercase text-sm mb-1">{m.profiles?.name || 'New Match'}</Text><Text className="text-[9px] text-white/20 font-black uppercase tracking-[0.2em] italic">MATCHED</Text></View>
                           <TouchableOpacity onPress={() => openWhatsApp(m.profiles?.phone_number)} className="bg-green-600/10 p-4 rounded-2xl border border-green-500/30"><Phone color="#16a34a" size={20}/></TouchableOpacity>
                        </TouchableOpacity>
                    )) : (
                      <View className="items-center justify-center pt-24 opacity-30 text-center"><Star color="#7c3aed" size={64}/><Text className="text-sm font-black uppercase mt-6 text-white text-center italic tracking-widest">Matches & Messages appear here!</Text></View>
                    )}
                 </ScrollView>
              )}

              {view === 'profile' && (
                <View className="flex-1 px-10 pt-10 items-center">
                   <View className="w-48 h-48 rounded-[4rem] bg-white/5 items-center justify-center border-4 border-primary-500/20 shadow-glow"><User color="#7c3aed" size={96}/></View>
                   <Text className="text-4xl font-black italic uppercase text-white mt-12 leading-none text-center">{userData.name || 'Admin'}</Text>
                   <Text className="text-primary-400 font-bold tracking-[0.3em] text-[10px] uppercase mt-4 text-center">{userData.poly || 'Zimbabwe Poly'}</Text>
                   <View className="w-full bg-white/5 p-8 rounded-[3rem] border border-white/5 mt-12"><Text className="text-[9px] font-black uppercase text-primary-400 tracking-widest mb-3 italic tracking-[0.2em]">Academic Record</Text><Text className="text-sm font-black text-white italic uppercase">{userData.course} • Year {userData.year}</Text></View>
                   <TouchableOpacity onPress={() => supabase.auth.signOut()} className="w-full h-20 bg-red-500/10 rounded-[2.5rem] items-center justify-center mt-6 border border-red-500/20"><Text className="text-red-500 font-black uppercase text-[10px] tracking-widest italic tracking-[0.2em]">Logout Session</Text></TouchableOpacity>
                </View>
              )}
           </View>

           {/* MOBILE NAVIGATION */}
           <View className="h-32 bg-[#080825] border-t border-white/10 rounded-t-[5rem] flex-row px-10 items-center shadow-[0_-30px_80px_rgba(0,0,0,1)] absolute bottom-0 left-0 right-0">
              {[{id:'discovery',icon:Heart},{id:'feed',icon:Globe},{id:'events',icon:Ticket},{id:'chat',icon:MessageSquare}].map(t => (
                <TouchableOpacity key={t.id} onPress={() => setView(t.id)} className={`flex-1 items-center gap-2 ${view === t.id ? 'opacity-100' : 'opacity-20'}`}><t.icon color={view===t.id?'#7c3aed':'#fff'} size={32}/><Text className="text-[8px] font-black text-white uppercase italic tracking-widest">{t.id}</Text></TouchableOpacity>
              ))}
           </View>
         </>
       )}
    </SafeAreaView>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
       <MainApp />
    </GestureHandlerRootView>
  );
}
