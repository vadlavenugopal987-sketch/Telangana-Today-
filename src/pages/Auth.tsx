import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button, Input, Select, Card, useToast } from '../components/ui';
import { KeyRound, Mail, User, ShieldAlert, ArrowRight } from 'lucide-react';
import { UserRole } from '../types';
import { supabase } from '../services/supabaseClient';

export const Auth: React.FC = () => {
  const { login, register, isDemo } = useAuth();
  const { success, error } = useToast();
  const [view, setView] = useState<'login' | 'register' | 'forgot'>('login');
  
  // Form values
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('Staff');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (view === 'register' && !fullName)) {
      error('Validation Error', 'Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (view === 'login') {
        await login(email, password);
        success('Access Granted', 'Welcome to Telangana Today.');
      } else {
        await register(email, fullName, role);
        success('Account setup complete', `Account successfully generated for ${fullName}.`);
      }
    } catch (err: any) {
      error('Sign-in Error', err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    try {
      if (isDemo) {
        // Sign in as default admin for clean testing
        await login('admin@telanganatoday.com', 'Password123');
        success('Google OAuth Connection', 'Successfully logged in using linked Google profile.');
      } else if (supabase) {
        const { error: err } = await supabase.auth.signInWithOAuth({
          provider: 'google'
        });
        if (err) throw err;
      }
    } catch (err: any) {
      error('Google Authentication Failed', err.message || 'Google Auth is currently offline.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      error('Email Required', 'Please enter your registered email address.');
      return;
    }
    success('Password Reset Dispatched', `A password reset link was simulated for ${email}.`);
    setView('login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-12">
      
      {/* Container */}
      <div className="w-full max-w-md space-y-6">
        
        {/* Header Block */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-10 h-10 bg-slate-950 flex items-center justify-center text-white font-black text-lg rounded-lg shadow-sm">
            T
          </div>
          <h2 className="text-xl font-black text-slate-950 tracking-tight">
            Telangana Today
          </h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">
            Media Billing & Advertisement Portal
          </p>
        </div>

        {/* Form Card */}
        <Card className="border border-slate-950 rounded-xl bg-white p-6 relative overflow-hidden">
          
          {view === 'login' && (
            <div className="space-y-4">
              <div className="text-left mb-1">
                <h3 className="text-base font-extrabold text-slate-950">System Sign In</h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">Access billing logs and advertiser campaigns</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Registered Email Address"
                  placeholder="your.email@example.com"
                  type="email"
                  icon={Mail}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <Input
                  label="Password"
                  placeholder="••••••••"
                  type="password"
                  icon={KeyRound}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <div className="flex items-center justify-end text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setView('forgot')}
                    className="text-slate-600 hover:text-slate-950 hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  isLoading={isSubmitting}
                  icon={ArrowRight}
                >
                  Log In
                </Button>
              </form>

              {/* Google OAuth Button */}
              <div className="relative flex py-2 items-center text-xs text-slate-400 font-bold uppercase">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-3">Or</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <Button
                type="button"
                variant="secondary"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-2 hover:bg-slate-50"
              >
                {/* SVG Google icon */}
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span>Continue with Google</span>
              </Button>

              <div className="text-center text-xs text-slate-500 font-semibold mt-4">
                Need to register?{' '}
                <button
                  type="button"
                  onClick={() => { setView('register'); setEmail(''); setPassword(''); }}
                  className="font-bold text-slate-950 hover:underline cursor-pointer"
                >
                  Create account
                </button>
              </div>
            </div>
          )}

          {view === 'register' && (
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="text-left mb-2">
                <h3 className="text-base font-extrabold text-slate-900">Create Profile</h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">Register a new system user profile</p>
              </div>

              <Input
                label="Full Name"
                placeholder="Emily Davis"
                type="text"
                icon={User}
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />

              <Input
                label="Email Address"
                placeholder="your.email@example.com"
                type="email"
                icon={Mail}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Input
                label="Password"
                placeholder="••••••••"
                type="password"
                icon={KeyRound}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <Select
                label="Select Access Role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                options={[
                  { value: 'Staff', label: 'Staff (Record Payments & View)' },
                  { value: 'Manager', label: 'Manager (Add/Edit Files)' },
                  { value: 'Admin', label: 'Admin (Full Privileges)' }
                ]}
              />

              <Button
                type="submit"
                className="w-full"
                isLoading={isSubmitting}
              >
                Register Account
              </Button>

              <div className="text-center text-xs text-slate-500 font-semibold mt-4">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => { setView('login'); setEmail(''); setPassword(''); }}
                  className="font-bold text-slate-950 hover:underline cursor-pointer"
                >
                  Log in here
                </button>
              </div>
            </form>
          )}

          {view === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-4 pt-2">
              <div className="text-left mb-2">
                <h3 className="text-base font-extrabold text-slate-900">Reset Credentials</h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">Request a recovery link for your account</p>
              </div>

              <Input
                label="Registered Email Address"
                placeholder="your.email@example.com"
                type="email"
                icon={Mail}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Button
                type="submit"
                className="w-full"
                isLoading={isSubmitting}
              >
                Send Recovery Instructions
              </Button>

              <div className="text-center text-xs font-bold mt-4">
                <button
                  type="button"
                  onClick={() => setView('login')}
                  className="text-slate-600 hover:text-slate-950 cursor-pointer"
                >
                  Back to Log In
                </button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};
