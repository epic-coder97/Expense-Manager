import React, { useState, useEffect } from 'react';
import { Lock, KeyRound, AlertCircle } from 'lucide-react';
import { Button } from './Button';
import { hashPassword } from '../utils/crypto';
import { storageService } from '../services/storage';

interface LoginProps {
  onLoginSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user exists to determine mode
    const exists = storageService.isUserExists();
    setIsFirstTime(!exists);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isFirstTime) {
        // Registration Mode
        if (pin.length < 4) {
          throw new Error("PIN must be at least 4 digits/characters.");
        }
        if (pin !== confirmPin) {
          throw new Error("PINs do not match.");
        }

        const hashed = await hashPassword(pin);
        
        // Initialize user in storage
        storageService.saveUser({
          passwordHash: hashed,
          isFirstTime: true, // Still true until setup wizard completes
          openingBalance: 0,
          openingDate: ''
        });

        onLoginSuccess();
      } else {
        // Login Mode
        const user = storageService.getUser();
        if (!user) throw new Error("User data not found.");

        const hashedAttempt = await hashPassword(pin);
        
        if (hashedAttempt === user.passwordHash) {
          onLoginSuccess();
        } else {
          throw new Error("Incorrect PIN/Password.");
        }
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-primary p-8 text-center">
          <div className="bg-blue-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">
            {isFirstTime ? 'Create Your Vault' : 'Welcome Back'}
          </h1>
          <p className="text-blue-100 mt-2">
            {isFirstTime ? 'Set a secure PIN to protect your data' : 'Enter your PIN to access your expenses'}
          </p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {isFirstTime ? 'Create PIN / Password' : 'Enter PIN / Password'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  placeholder="••••••"
                  autoFocus
                />
              </div>
            </div>

            {isFirstTime && (
              <div className="animate-fade-in">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Confirm PIN / Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    placeholder="••••••"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" isLoading={loading}>
              {isFirstTime ? 'Create Account' : 'Unlock'}
            </Button>
          </form>
        </div>
      </div>
      <p className="mt-8 text-center text-slate-400 text-sm">
        Secure LocalStorage Encryption
      </p>
    </div>
  );
};