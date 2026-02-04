import { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import './App.css';
import { supabase } from './supabase';
import { Toaster } from 'sonner';

import { setupTelegramApp } from './utils/telegram';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import Onboarding from './components/Onboarding';
import PageTransition from './components/PageTransition';

// Lazy Load Pages
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Orders = lazy(() => import('./pages/Orders'));
const OrderDetail = lazy(() => import('./pages/OrderDetail'));
const Search = lazy(() => import('./pages/Search'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Tasks = lazy(() => import('./pages/Tasks'));
const Accounting = lazy(() => import('./pages/Accounting'));
const Profile = lazy(() => import('./pages/Profile'));
const PinLock = lazy(() => import('./pages/PinLock'));
const Services = lazy(() => import('./pages/Services'));
const Monitoring = lazy(() => import('./pages/services/Monitoring'));
const Staff = lazy(() => import('./pages/services/Staff'));
const Mighty = lazy(() => import('./pages/services/Mighty'));
const DesslyHub = lazy(() => import('./pages/services/DesslyHub'));
const Notifications = lazy(() => import('./pages/Notifications'));
const News = lazy(() => import('./pages/News'));
const TeamChat = lazy(() => import('./pages/TeamChat'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Wiki = lazy(() => import('./pages/Wiki'));
const NotFound = lazy(() => import('./pages/NotFound'));

const LoadingScreen = () => (
  <div className="min-h-screen bg-[#1c1c1e] flex items-center justify-center text-white">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
  </div>
);

function AppContent() {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    setupTelegramApp();

    const visited = localStorage.getItem('bazzar_onboarding_completed');
    if (!visited) setShowOnboarding(true);

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        setIsPinVerified(false);
      }
      setIsLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      if (!session) setIsPinVerified(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = () => setIsAuthenticated(true);
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setIsPinVerified(false);
  };
  const handlePinSuccess = () => setIsPinVerified(true);
  const handleOnboardingComplete = () => {
    localStorage.setItem('bazzar_onboarding_completed', 'true');
    setShowOnboarding(false);
  };

  // 1. Loading
  if (isLoading) return <LoadingScreen />;

  // 2. Onboarding
  if (showOnboarding) {
    return (
      <PageTransition key="onboarding">
        <Onboarding onComplete={handleOnboardingComplete} />
      </PageTransition>
    );
  }

  // 3. Auth
  if (!isAuthenticated) {
    return (
      <PageTransition key="login">
        <Suspense fallback={<LoadingScreen />}>
          <Login onLogin={handleLogin} />
        </Suspense>
      </PageTransition>
    );
  }

  // 4. PIN
  if (!isPinVerified) {
    return (
      <PageTransition key="pin">
        <Suspense fallback={<LoadingScreen />}>
          <PinLock onSuccess={handlePinSuccess} mode="check" onForgot={() => handleLogout()} />
        </Suspense>
      </PageTransition>
    );
  }

  // 5. App Routes
  return (
    <div className="bg-[#1c1c1e] min-h-screen text-white">
      <Suspense fallback={<LoadingScreen />}>
        <AnimatePresence mode="wait" initial={false}>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageTransition><Dashboard /></PageTransition>} />
            <Route path="/orders" element={<PageTransition><Orders /></PageTransition>} />
            <Route path="/orders/:id" element={<PageTransition><OrderDetail /></PageTransition>} />
            <Route path="/services" element={<PageTransition><Services /></PageTransition>} />
            <Route path="/services/monitoring" element={<PageTransition><Monitoring /></PageTransition>} />
            <Route path="/services/staff" element={<PageTransition><Staff /></PageTransition>} />
            <Route path="/services/desslyhub" element={<PageTransition><DesslyHub /></PageTransition>} />

            <Route element={<ProtectedAdminRoute />}>
              <Route path="/services/mighty" element={<PageTransition><Mighty /></PageTransition>} />
            </Route>

            <Route path="/calendar" element={<PageTransition><Calendar /></PageTransition>} />
            <Route path="/tasks" element={<PageTransition><Tasks /></PageTransition>} />
            <Route path="/accounting" element={<PageTransition><Accounting /></PageTransition>} />
            <Route path="/search" element={<PageTransition><Search /></PageTransition>} />
            <Route path="/profile" element={<PageTransition><Profile onLogout={handleLogout} /></PageTransition>} />
            <Route path="/notifications" element={<PageTransition><Notifications /></PageTransition>} />
            <Route path="/news" element={<PageTransition><News /></PageTransition>} />
            <Route path="/chat" element={<PageTransition><TeamChat /></PageTransition>} />
            <Route path="/leaderboard" element={<PageTransition><Leaderboard /></PageTransition>} />
            <Route path="/wiki" element={<PageTransition><Wiki /></PageTransition>} />
            <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
          </Routes>
        </AnimatePresence>
      </Suspense>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Toaster position="top-center" theme="dark" />
      <AppContent />
    </Router>
  );
}

export default App;
