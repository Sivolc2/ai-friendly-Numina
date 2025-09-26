import { createContext, useContext, useState, ReactNode } from 'react';
import { User, Profile } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: Profile | null;
  isAdmin: boolean;
  isPhotographer: boolean;
  signIn: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [loading] = useState(false);

  const signIn = async (email: string) => {
    console.log('Mock sign in:', email);
    // Mock authentication
    setUser({
      id: '1',
      email,
      name: 'Demo User',
      role: 'user'
    });
  };

  const signOut = async () => {
    console.log('Mock sign out');
    setUser(null);
    setUserProfile(null);
  };

  const isAdmin = user?.role === 'admin';
  const isPhotographer = user?.role === 'photographer';

  const value: AuthContextType = {
    user,
    userProfile,
    isAdmin,
    isPhotographer,
    signIn,
    signOut,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}