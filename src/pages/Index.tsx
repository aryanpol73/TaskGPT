import { useAuth } from '@/contexts/AuthContext';
import AuthPage from './AuthPage';
import Dashboard from './Dashboard';

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full gradient-primary animate-pulse-glow" />
      </div>
    );
  }

  return user ? <Dashboard /> : <AuthPage />;
};

export default Index;
