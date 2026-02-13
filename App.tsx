
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import SearchComponent from './components/SearchComponent';
import LegalAnalyzer from './components/LegalAnalyzer';
import PetitionGenerator from './components/PetitionGenerator';
import FileConverter from './components/FileConverter';
import ForumComponent from './components/ForumComponent';
import PricingModal from './components/PricingModal';
import LoginModal from './components/LoginModal';
import ProfileComponent from './components/ProfileComponent';
import DeadlineCalendar from './components/DeadlineCalendar';
import { AppTab, UserProfile } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>('search');
  const [credits, setCredits] = useState({ remaining: 30, total: 30 });
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const savedCredits = localStorage.getItem('dp_credits');
    const lastReset = localStorage.getItem('dp_last_reset');
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    if (lastReset && now - parseInt(lastReset) < twentyFourHours) {
      if (savedCredits) {
        setCredits({ remaining: parseInt(savedCredits), total: 30 });
      }
    } else {
      setCredits({ remaining: 30, total: 30 });
      localStorage.setItem('dp_credits', '30');
      localStorage.setItem('dp_last_reset', now.toString());
    }
  }, []);

  const deductCredit = (amount: number = 1) => {
    setCredits(prev => {
      const newRemaining = Math.max(0, prev.remaining - amount);
      localStorage.setItem('dp_credits', newRemaining.toString());
      return { ...prev, remaining: newRemaining };
    });
  };

  const handleLogin = (userData: UserProfile) => {
    setUser(userData);
    setIsLoginOpen(false);
  };

  return (
    <>
      <Layout 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        credits={credits}
        onOpenPricing={() => setIsPricingOpen(true)}
        user={user}
        onOpenLogin={() => setIsLoginOpen(true)}
      >
        {activeTab === 'search' && (
          <SearchComponent deductCredit={deductCredit} creditsRemaining={credits.remaining} />
        )}
        {(activeTab === 'petition-analysis' || activeTab === 'contract-analysis') && (
          <LegalAnalyzer 
            mode={activeTab === 'petition-analysis' ? 'petition' : 'contract'}
            deductCredit={deductCredit} 
            creditsRemaining={credits.remaining} 
          />
        )}
        {activeTab === 'petition-generator' && (
          <PetitionGenerator deductCredit={deductCredit} creditsRemaining={credits.remaining} />
        )}
        {activeTab === 'file-converter' && (
          <FileConverter deductCredit={deductCredit} creditsRemaining={credits.remaining} />
        )}
        {activeTab === 'deadline-calendar' && (
          <DeadlineCalendar />
        )}
        {activeTab === 'forum' && (
          <ForumComponent user={user} />
        )}
        {activeTab === 'profile' && (
          <ProfileComponent 
            user={user} 
            setUser={setUser}
            onLogout={() => setUser(null)} 
            onOpenLogin={() => setIsLoginOpen(true)} 
          />
        )}
      </Layout>
      <PricingModal isOpen={isPricingOpen} onClose={() => setIsPricingOpen(false)} />
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} onLogin={handleLogin} />
    </>
  );
};

export default App;
