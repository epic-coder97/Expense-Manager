import React, { useState } from 'react';
    import { Calendar, IndianRupee, ArrowRight, CheckCircle2 } from 'lucide-react';
    import { Button } from './Button';
    import { storageService } from '../services/storage';
    
    interface SetupWizardProps {
      onComplete: () => void;
    }
    
    export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
      const [balance, setBalance] = useState<string>('');
      const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
      const [error, setError] = useState('');
    
      const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
    
        if (!balance || isNaN(Number(balance))) {
          setError('Please enter a valid opening balance.');
          return;
        }
    
        if (!date) {
          setError('Please select a valid date.');
          return;
        }
    
        // Format date from YYYY-MM-DD to DD/MM/YYYY
        const [year, month, day] = date.split('-');
        const formattedDate = `${day}/${month}/${year}`;
    
        const currentUser = storageService.getUser();
        if (currentUser) {
          storageService.saveUser({
            ...currentUser,
            isFirstTime: false,
            openingBalance: Number(balance),
            openingDate: formattedDate
          });
          onComplete();
        } else {
          setError("User session invalid. Please restart.");
        }
      };
    
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
            
            {/* Left Side - Decor */}
            <div className="bg-slate-900 text-white p-8 md:w-1/3 flex flex-col justify-between relative overflow-hidden">
              <div className="relative z-10">
                <div className="bg-white/10 w-12 h-12 rounded-xl flex items-center justify-center mb-6 backdrop-blur-sm">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Let's get setup</h2>
                <p className="text-slate-300 text-sm">We just need a few details to initialize your expense tracking journey.</p>
              </div>
              
              {/* Decorative circles */}
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-600 rounded-full opacity-20 blur-2xl"></div>
              <div className="absolute top-10 -left-10 w-32 h-32 bg-purple-600 rounded-full opacity-20 blur-2xl"></div>
            </div>
    
            {/* Right Side - Form */}
            <div className="p-8 md:w-2/3">
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Balance Input */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Opening Balance (₹)
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <IndianRupee className="h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                      type="number"
                      value={balance}
                      onChange={(e) => setBalance(e.target.value)}
                      className="block w-full pl-10 pr-3 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:bg-white focus:border-primary focus:ring-0 transition-all font-mono text-lg"
                      placeholder="10000"
                      min="0"
                      required
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Current cash in hand or bank balance.</p>
                </div>
    
                {/* Date Input */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    As of Date
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="block w-full pl-10 pr-3 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:bg-white focus:border-primary focus:ring-0 transition-all"
                      required
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">When did you have this balance?</p>
                </div>
    
                {error && (
                  <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100">
                    {error}
                  </div>
                )}
    
                <div className="pt-4">
                  <Button type="submit" className="flex items-center justify-center gap-2">
                    Start Tracking <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      );
    };