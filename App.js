import 'react-native-url-polyfill/auto';
import 'react-native-gesture-handler';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, ScrollView,
  SafeAreaView, ActivityIndicator, Alert, KeyboardAvoidingView,
  Platform, Linking, StyleSheet, Dimensions, Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase';
import {
  Heart, X, MapPin, User, Sparkles, Send, Globe, Star,
  ArrowLeft, MessageSquare, BookOpen, Ticket, Ghost, Phone, Camera
} from 'lucide-react-native';

// ============================================================
//  UNI-LINK STUDENT ECOSYSTEM — v3.0 (PREMIUM WEB EDITION)
// ============================================================

const C = {
  bg:       '#05051e',
  webBg:    '#02020a',
  card:     'rgba(255,255,255,0.05)',
  border:   'rgba(255,255,255,0.08)',
  primary:  '#7c3aed',
  primary2: '#6d28d9',
  pink:     '#f472b6',
  text:     '#ffffff',
  dim:      'rgba(255,255,255,0.3)',
  dimmer:   'rgba(255,255,255,0.1)',
};

// ── Shared UI ────────────────────────────────────────────────

function Btn({ label, onPress, loading, style, textStyle, secondary }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[styles.btn, secondary ? styles.btnSecondary : styles.btnPrimary, style]}
    >
      {loading
        ? <ActivityIndicator color="#fff" />
        : <Text style={[styles.btnText, textStyle]}>{label}</Text>}
    </TouchableOpacity>
  );
}

function Field({ placeholder, value, onChangeText, secure }) {
  return (
    <View style={styles.field}>
      <TextInput
        style={styles.fieldInput}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.25)"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!!secure}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}

// ── Web Responsive Wrapper ─────────────────────────────────

function AppContainer({ children }) {
  const isWeb = Platform.OS === 'web';
  const { width } = Dimensions.get('window');
  const isMobileView = width < 768;

  if (!isWeb || isMobileView) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        {children}
      </View>
    );
  }

  return (
    <View style={styles.webViewport}>
      <View style={styles.webSidebar}>
        <View style={{ padding: 40 }}>
           <Sparkles size={48} color={C.pink} />
           <Text style={[styles.logo, { marginTop: 24, fontSize: 32 }]}>UniLink</Text>
           <Text style={[styles.subtext, { marginBottom: 32 }]}>Student Ecosystem</Text>
           <Text style={styles.sidebarDesc}>
             Zimbabwe's exclusive university platform for students to connect, study, and thrive together.
           </Text>
        </View>
        <View style={styles.sidebarFooter}>
           <Text style={styles.sidebarFooterText}>© 2026 UniLink Zim</Text>
        </View>
      </View>
      
      <View style={styles.phoneContainer}>
        <View style={styles.phoneFrame}>
          {children}
        </View>
      </View>
    </View>
  );
}

// ── Core App ────────────────────────────────────────────────

export default function App() {
  const [session,        setSession]        = useState(null);
  const [view,           setView]           = useState('landing');
  const [loading,        setLoading]        = useState(false);
  const [appReady,       setAppReady]       = useState(false);

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');

  const [userData, setUserData] = useState({ name: '', poly: '', course: '', year: 1, phone: '' });
  const [posts,           setPosts]          = useState([]);
  const [matches,         setMatches]        = useState([]);
  const [nearbyStudents,  setNearbyStudents] = useState([]);
  const [events,          setEvents]         = useState([]);
  const [isStudyMode,     setIsStudyMode]    = useState(false);
  const [postText,        setPostText]       = useState('');
  const [postMedia,       setPostMedia]      = useState(null);
  const [isAnonPost,      setIsAnonPost]     = useState(false);

  // ── Auth bootstrap ─────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    // Safety timeout: Ensure app boots even if supabase hangs
    const safetyId = setTimeout(() => {
      if (mounted && !appReady) setAppReady(true);
    }, 2500);

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      clearTimeout(safetyId);
      const s = data?.session ?? null;
      setSession(s);
      if (s) {
        loadAll(s);
        setView('discovery');
      }
      setAppReady(true);
    }).catch(() => {
      if (mounted) {
        clearTimeout(safetyId);
        setAppReady(true);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!mounted) return;
      setSession(s);
      if (s) {
        loadAll(s);
        setView('discovery');
      } else {
        setView('landing');
      }
    });

    return () => {
      mounted = false;
      clearTimeout(safetyId);
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  useEffect(() => { if (session) fetchDiscovery(session); }, [isStudyMode]);

  // ── Loaders ───────────────────────────────────────────────
  const loadAll = useCallback((s) => {
    fetchProfile(s.user.id);
    fetchFeed();
    fetchDiscovery(s);
    fetchEvents();
    fetchMatches(s);
  }, [isStudyMode, userData.course]);

  const fetchProfile = async (id) => {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', id).single();
      if (data) setUserData({ name: data.name || '', poly: data.polytechnic || '', course: data.course || '', year: data.year_of_study || 1, phone: data.phone_number || '' });
    } catch (e) { console.warn('fetchProfile:', e?.message); }
  };

  const fetchFeed = async () => {
    try {
      const { data } = await supabase.from('posts').select('*, profiles(name, polytechnic)').order('created_at', { ascending: false }).limit(30);
      if (data) setPosts(data);
    } catch (e) { console.warn('fetchFeed:', e?.message); }
  };

  const fetchDiscovery = async (s) => {
    try {
      const curSession = s || session;
      if (!curSession) return;
      let query = supabase.from('profiles').select('*').limit(20);
      if (isStudyMode && userData.course) query = query.eq('course', userData.course);
      const { data } = await query;
      if (data) setNearbyStudents(data.filter(p => p.id !== curSession.user.id));
    } catch (e) { console.warn('fetchDiscovery:', e?.message); }
  };

  const fetchEvents = async () => {
    try {
      const { data } = await supabase.from('events').select('*').order('event_date', { ascending: true });
      if (data) setEvents(data);
    } catch (e) { console.warn('fetchEvents:', e?.message); }
  };

  const fetchMatches = async (s) => {
    try {
      const curSession = s || session;
      if (!curSession) return;
      const { data } = await supabase
        .from('matches')
        .select('*, profiles!user_2(name, polytechnic, phone_number)')
        .or(`user_1.eq.${curSession.user.id},user_2.eq.${curSession.user.id}`);
      if (data) setMatches(data);
    } catch (e) { console.warn('fetchMatches:', e?.message); }
  };

  // ── Actions ───────────────────────────────────────────────
  const handleAuth = async () => {
    if (!email || !password) return alert('Enter your email and password.');
    if (view === 'register' && (!userData.name || !userData.poly || !userData.course)) {
      return alert('Complete all fields to create your student profile.');
    }

    setLoading(true);
    try {
      if (view === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) alert('Login Failed: ' + error.message);
      } else {
        // REGISTER
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        
        if (data?.user) {
          // Immediately create the public profile (satisfies DB NOT NULL constraints)
          const { error: profError } = await supabase.from('profiles').upsert({
            id: data.user.id,
            name: userData.name,
            surname: 'Student', // Default for now
            email: email.toLowerCase(),
            polytechnic: userData.poly,
            course: userData.course,
            year_of_study: 1,
            created_at: new Date().toISOString()
          });
          
          if (profError) {
             console.warn('Profile Creation Error:', profError.message);
             // Note: If email confirmation is ON, user can't login yet anyway.
          }

          alert('Account Created! Check your email to confirm then Sign In.');
          setView('login');
        }
      }
    } catch (e) { 
      alert(e?.message || 'Something went wrong.'); 
    } finally { 
      setLoading(false); 
    }
  };

  const openWhatsApp = (phone) => {
    if (!phone) return Alert.alert('Not Shared', 'Student has not shared their WhatsApp yet.');
    Linking.openURL(`https://wa.me/${phone}`);
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) setPostMedia(result.assets[0].uri);
  };

  const submitPost = async () => {
    if ((!postText.trim() && !postMedia) || !session) return;
    setLoading(true);
    try {
      let media_url = null;

      if (postMedia) {
        // Prepare file (Platform specific)
        const filename = `${session.user.id}/${Date.now()}.jpg`;
        const formData = new FormData();
        
        if (Platform.OS === 'web') {
           const response = await fetch(postMedia);
           const blob = await response.blob();
           const { data: uploadData, error: uploadError } = await supabase.storage
             .from('post-media')
             .upload(filename, blob);
           if (uploadError) throw uploadError;
           media_url = supabase.storage.from('post-media').getPublicUrl(filename).data.publicUrl;
        } else {
           // Native upload logic simplified for current environment
           // (Usually requires expo-file-system or base64)
           // For this specific web-first fix, we focus on the web-stable method
        }
      }

      await supabase.from('posts').insert({ 
        author_id: session.user.id, 
        content: postText.trim(), 
        is_anonymous: isAnonPost,
        media_url: media_url
      });
      
      setPostText('');
      setPostMedia(null);
      fetchFeed();
    } catch (e) { 
      console.warn('submitPost:', e?.message);
      alert('Upload failed: Ensure a "post-media" bucket exists in Supabase storage.');
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (swipedId, isLike) => {
    if (!session) return;
    try {
      // 1. Record the swipe
      const { error } = await supabase.from('swipes').upsert({
        swiper_id: session.user.id,
        swiped_id: swipedId,
        is_like: isLike,
        is_study_request: isStudyMode
      });
      if (error) throw error;

      // 2. Check for match if it's a like
      if (isLike) {
        const { data: revSwipe } = await supabase
          .from('swipes')
          .select('*')
          .eq('swiper_id', swipedId)
          .eq('swiped_id', session.user.id)
          .eq('is_like', true)
          .single();

        if (revSwipe) {
          await supabase.from('matches').insert({
            user_1: session.user.id,
            user_2: swipedId,
            match_type: isStudyMode ? 'study' : 'dating'
          });
          alert("It's a Match! 🎉 Check your chat tab.");
          fetchMatches(session);
        }
      }
      setNearbyStudents(prev => prev.filter(p => p.id !== swipedId));
    } catch (e) { console.warn('handleSwipe:', e?.message); }
  };

  const handleRSVP = async (eventId) => {
    if (!session) return;
    try {
      const { error } = await supabase.from('event_rsvps').insert({ 
        event_id: eventId, 
        user_id: session.user.id 
      });
      if (error) throw error;
      alert('RSVP Confirmed! 🎫 Check your student email.');
    } catch (e) { alert('Error: Already registered or network failure.'); }
  };

  // ── Rendering States ──────────────────────────────────────

  if (!appReady) {
    return (
      <AppContainer>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Sparkles size={48} color={C.pink} />
          <Text style={[styles.logo, { marginTop: 16 }]}>UniLink</Text>
          <ActivityIndicator color={C.primary} style={{ marginTop: 24 }} />
        </View>
      </AppContainer>
    );
  }

  if (!session) {
    return (
      <AppContainer>
        <StatusBar style="light" />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, padding: 32, justifyContent: 'center' }}>
          {view === 'landing' && (
            <View style={{ alignItems: 'center' }}>
              <Sparkles size={64} color={C.pink} />
              <Text style={[styles.logo, { marginTop: 24, marginBottom: 8 }]}>UniLink</Text>
              <Text style={styles.subtext}>Zimbabwe Student Ecosystem</Text>
              <Btn label="Enter Platform" onPress={() => setView('login')} style={{ marginTop: 48, width: '100%' }} />
              <TouchableOpacity onPress={() => setView('register')} style={{ marginTop: 16 }}>
                <Text style={styles.linkText}>New student? Create Account →</Text>
              </TouchableOpacity>
            </View>
          )}

          {(view === 'login' || view === 'register') && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 40 }}>
              <TouchableOpacity onPress={() => setView('landing')} style={{ marginBottom: 24 }}>
                <ArrowLeft color={C.text} size={24} />
              </TouchableOpacity>
              <Text style={styles.pageTitle}>{view === 'login' ? 'Welcome Back' : 'Join UniLink'}</Text>
              <Text style={[styles.subtext, { marginBottom: 24 }]}>
                {view === 'login' ? 'Sign in to your account' : 'Setup your official student profile'}
              </Text>
              
              {view === 'register' && (
                <>
                  <Field placeholder="Full Name" value={userData.name} onChangeText={(t) => setUserData({...userData, name: t})} />
                  <Field placeholder="Polytechnic (e.g. Bulawayo Poly)" value={userData.poly} onChangeText={(t) => setUserData({...userData, poly: t})} />
                  <Field placeholder="Your Course" value={userData.course} onChangeText={(t) => setUserData({...userData, course: t})} />
                </>
              )}
              
              <Field placeholder="Student Email" value={email} onChangeText={setEmail} />
              <Field placeholder="Password" value={password} onChangeText={setPassword} secure />
              
              <Btn label={view === 'login' ? 'Sign In' : 'Create Account'} onPress={handleAuth} loading={loading} style={{ marginTop: 8 }} />
              
              <TouchableOpacity onPress={() => setView(view === 'login' ? 'register' : 'login')} style={{ marginTop: 24, alignItems: 'center' }}>
                <Text style={styles.linkText}>{view === 'login' ? "Don't have an account? Register" : 'Already registered? Sign In'}</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </KeyboardAvoidingView>
      </AppContainer>
    );
  }

  return (
    <AppContainer>
      <StatusBar style="light" />
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerLogo}>UniLink</Text>
            <Text style={styles.headerSub}>{userData.poly || 'Zimbabwe Poly'}</Text>
          </View>
          <TouchableOpacity onPress={() => setView('profile')} style={styles.avatarBtn}>
            <User color={C.primary} size={22} />
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1 }}>
          {view === 'discovery' && (
            <ScrollView contentContainerStyle={{ padding: 24 }}>
              <View style={[styles.row, { marginBottom: 20, justifyContent: 'space-between' }]}>
                <View>
                  <Text style={styles.sectionTitle}>{isStudyMode ? 'Study Match' : 'Discover'}</Text>
                  <Text style={styles.sectionSub}>{isStudyMode ? 'Same course focus' : 'Campus proximity'}</Text>
                </View>
                <TouchableOpacity onPress={() => setIsStudyMode(!isStudyMode)} style={[styles.pill, isStudyMode && styles.pillActive]}>
                  <BookOpen color="#fff" size={14} />
                  <Text style={styles.pillText}>{isStudyMode ? 'ON' : 'STUDY'}</Text>
                </TouchableOpacity>
              </View>

              {nearbyStudents.length === 0 && (
                <View style={styles.emptyBox}>
                  <Star color={C.primary} size={48} />
                  <Text style={styles.emptyText}>Looking for students...</Text>
                </View>
              )}

              {nearbyStudents.map(p => (
                <View key={p.id} style={styles.card}>
                  <View style={styles.cardAvatar}><User color={C.primary} size={48} /></View>
                  <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={styles.cardName}>{p.name || 'Student'}</Text>
                    <Text style={styles.cardSub}>{p.polytechnic}</Text>
                  </View>
                  <View style={styles.row}>
                    <TouchableOpacity onPress={() => handleSwipe(p.id, false)} style={styles.passBtn}>
                      <X color="#ef4444" size={22} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleSwipe(p.id, true)} style={styles.likeBtn}>
                      <Heart color="#fff" size={22} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}

          {view === 'feed' && (
            <ScrollView contentContainerStyle={{ padding: 24 }}>
              <View style={[styles.row, { marginBottom: 20, justifyContent: 'space-between' }]}>
                <Text style={styles.sectionTitle}>Campus Flow</Text>
                <TouchableOpacity onPress={() => setIsAnonPost(!isAnonPost)} style={[styles.pill, isAnonPost && styles.pillActive]}>
                  <Ghost color="#fff" size={14} />
                  <Text style={styles.pillText}>ANON</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.postBox}>
                <TouchableOpacity onPress={pickImage} style={[styles.imageBtn, postMedia && { borderColor: C.primary }]}>
                  <Camera color={postMedia ? C.primary : "rgba(255,255,255,0.4)"} size={20} />
                </TouchableOpacity>
                <TextInput
                  style={styles.postInput}
                  placeholder="Post something to campus..."
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  value={postText}
                  onChangeText={setPostText}
                  multiline
                />
                <TouchableOpacity onPress={submitPost} disabled={loading} style={styles.sendBtn}>
                  {loading ? <ActivityIndicator color="#fff" size="small" /> : <Send color="#fff" size={18} />}
                </TouchableOpacity>
              </View>
              
              {postMedia && (
                <View style={styles.previewContainer}>
                  <Image source={{ uri: postMedia }} style={styles.previewImg} />
                  <TouchableOpacity onPress={() => setPostMedia(null)} style={styles.removeMedia}>
                    <X color="#fff" size={12} />
                  </TouchableOpacity>
                </View>
              )}

              {posts.map(p => (
                <View key={p.id} style={styles.postCard}>
                  <View style={[styles.postAvatar, p.is_anonymous && { backgroundColor: '#312e81' }]}>
                    {p.is_anonymous ? <Ghost color="#fff" size={20} /> : <User color="#fff" size={20} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.postAuthor}>{p.is_anonymous ? 'Secret Student' : p.profiles?.name}</Text>
                    <Text style={styles.postContent}>{p.content}</Text>
                    {p.media_url && (
                      <Image source={{ uri: p.media_url }} style={styles.postMedia} resizeMode="cover" />
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>
          )}

          {view === 'events' && (
            <ScrollView contentContainerStyle={{ padding: 24 }}>
              <Text style={[styles.sectionTitle, { marginBottom: 20 }]}>Poly Event Hub</Text>
              {events.map(ev => (
                <View key={ev.id} style={styles.eventCard}>
                   <Text style={styles.eventTitle}>{ev.title}</Text>
                   <Text style={styles.eventSub}>{ev.location} • {ev.event_date}</Text>
                   <Btn label="Secure Spot 🎫" onPress={() => handleRSVP(ev.id)} style={{ marginTop: 16 }} />
                </View>
              ))}
            </ScrollView>
          )}

          {view === 'chat' && (
            <ScrollView contentContainerStyle={{ padding: 24 }}>
              <Text style={[styles.sectionTitle, { marginBottom: 20 }]}>Messages</Text>
              {matches.length === 0 && (
                <View style={styles.emptyBox}>
                  <MessageSquare color={C.primary} size={48} />
                  <Text style={styles.emptyText}>Matches appear here!</Text>
                </View>
              )}
              {matches.map(m => (
                <View key={m.id} style={styles.matchCard}>
                  <View style={styles.matchAvatar}><User color={C.primary} size={28} /></View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={styles.matchName}>{m.profiles?.name}</Text>
                    <Text style={styles.matchSub}>MATCHED</Text>
                  </View>
                  <TouchableOpacity onPress={() => openWhatsApp(m.profiles?.phone_number)} style={styles.waBtn}>
                    <Phone color="#16a34a" size={18} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          {view === 'profile' && (
            <ScrollView contentContainerStyle={{ padding: 32, alignItems: 'center' }}>
              <View style={styles.profileAvatar}><User color={C.primary} size={72} /></View>
              <Text style={styles.profileName}>{userData.name || 'Student'}</Text>
              <Text style={styles.profilePoly}>{userData.poly || 'Zimbabwe Poly'}</Text>
              <Btn label="Sign Out" onPress={() => supabase.auth.signOut()} style={{ marginTop: 16, width: '100%' }} secondary />
            </ScrollView>
          )}
        </View>

        <View style={styles.nav}>
          {[
            { id: 'discovery', icon: Heart, label: 'Discover' },
            { id: 'feed',      icon: Globe, label: 'Feed' },
            { id: 'events',    icon: Ticket, label: 'Events' },
            { id: 'chat',      icon: MessageSquare, label: 'Chat' },
          ].map(t => {
            const active = view === t.id;
            const Icon = t.icon;
            return (
              <TouchableOpacity key={t.id} onPress={() => setView(t.id)} style={styles.navItem}>
                <Icon color={active ? C.primary : 'rgba(255,255,255,0.25)'} size={26} />
                <Text style={[styles.navLabel, active && { color: C.primary }]}>{t.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </GestureHandlerRootView>
    </AppContainer>
  );
}

const styles = StyleSheet.create({
  // Web Layout
  webViewport: { flex: 1, flexDirection: 'row', backgroundColor: C.webBg },
  webSidebar:  { width: 400, borderRightWidth: 1, borderRightColor: C.border, justifyContent: 'center' },
  sidebarDesc: { color: C.dim, fontSize: 16, lineHeight: 26 },
  sidebarFooter:{ position: 'absolute', bottom: 40, left: 40 },
  sidebarFooterText: { color: C.dimmer, fontSize: 12, fontWeight: '700' },
  phoneContainer:{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  phoneFrame:  { width: 375, height: 812, borderRadius: 40, overflow: 'hidden', backgroundColor: C.bg, borderWidth: 8, borderColor: '#111', shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.5, shadowRadius: 30 },

  // Standard UI
  btn:          { paddingVertical: 18, paddingHorizontal: 24, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  btnPrimary:   { backgroundColor: '#7c3aed' },
  btnSecondary: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  btnText:      { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 1.5, textTransform: 'uppercase' },

  field:      { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 20, paddingVertical: 16, marginBottom: 14 },
  fieldInput: { color: '#fff', fontSize: 15, fontWeight: '600', height: 40 },

  logo:       { color: '#fff', fontSize: 42, fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase' },
  subtext:    { color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2 },
  linkText:   { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '600', textDecorationLine: 'underline' },
  pageTitle:  { color: '#fff', fontSize: 30, fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase', marginBottom: 6 },
  
  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 20 },
  headerLogo: { color: '#7c3aed', fontSize: 22, fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase' },
  headerSub:  { color: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  avatarBtn:  { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },

  sectionTitle:{ color: '#fff', fontSize: 20, fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase' },
  sectionSub: { color: 'rgba(255,255,255,0.2)', fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },

  pill:       { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.04)' },
  pillActive: { backgroundColor: '#7c3aed' },
  pillText:   { color: '#fff', fontSize: 10, fontWeight: '900' },

  card:       { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 24, padding: 16, marginBottom: 16 },
  cardAvatar: { width: 64, height: 64, borderRadius: 18, backgroundColor: 'rgba(124,58,237,0.15)', alignItems: 'center', justifyContent: 'center' },
  cardName:   { color: '#fff', fontSize: 18, fontWeight: '900' },
  cardSub:    { color: '#7c3aed', fontSize: 11, fontWeight: '700' },
  passBtn:    { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  likeBtn:    { width: 44, height: 44, borderRadius: 22, backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center' },

  postBox:    { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, padding: 12, marginBottom: 20 },
  imageBtn:   { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 1, borderColor: 'transparent' },
  postInput:  { flex: 1, color: '#fff', fontSize: 14, minHeight: 40, marginRight: 12 },
  sendBtn:    { width: 44, height: 44, borderRadius: 12, backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center' },
  
  previewContainer: { marginBottom: 20, position: 'relative' },
  previewImg:  { width: '100%', height: 200, borderRadius: 20 },
  removeMedia: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.5)', width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  postCard:   { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: 16, marginBottom: 12, flexDirection: 'row' },
  postAvatar: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#4c1d95', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  postAuthor: { color: '#fff', fontWeight: '800', fontSize: 13 },
  postContent:{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 4 },
  postMedia:  { width: '100%', height: 250, borderRadius: 16, marginTop: 12 },

  eventCard:  { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 24, padding: 20, marginBottom: 16 },
  eventTitle: { color: '#fff', fontWeight: '900', fontSize: 18 },
  eventSub:   { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4 },

  matchCard:  { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, padding: 16, marginBottom: 12 },
  matchAvatar:{ width: 50, height: 50, borderRadius: 14, backgroundColor: 'rgba(124,58,237,0.15)', alignItems: 'center', justifyContent: 'center' },
  matchName:  { color: '#fff', fontWeight: '800', fontSize: 16 },
  matchSub:   { color: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: '700' },
  waBtn:      { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(22,163,74,0.1)', alignItems: 'center', justifyContent: 'center' },

  profileAvatar:{ width: 120, height: 120, borderRadius: 40, backgroundColor: 'rgba(124,58,237,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  profileName:  { color: '#fff', fontSize: 24, fontWeight: '900' },
  profilePoly:  { color: '#7c3aed', fontSize: 12, fontWeight: '700', marginTop: 4 },

  nav:        { flexDirection: 'row', backgroundColor: '#080825', height: 80, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 12 },
  navItem:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navLabel:   { color: 'rgba(255,255,255,0.2)', fontSize: 9, fontWeight: '800', marginTop: 4 },

  row: { flexDirection: 'row', alignItems: 'center' },
  emptyBox: { alignItems: 'center', paddingVertical: 40, opacity: 0.5 },
  emptyText: { color: '#fff', marginTop: 16, textAlign: 'center' }
});
