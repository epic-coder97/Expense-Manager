import React, { useState, useEffect } from 'react';
import { IndianRupee, TrendingUp, TrendingDown, Calendar, ArrowRight, Plus, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { UserProfile, Transaction } from '../types';
import { storageService } from '../services/storage';
import { Button } from './Button';

interface DashboardProps {
  user: UserProfile;
  onNavigate: (view: 'transactions') => void;
  onAddTransaction: () => void;
}

interface DashboardStats {
  currentBalance: number;
  lastTransactionDate: string;
  monthIncome: number;
  monthExpense: number;
  monthNet: number;
  recentTransactions: Transaction[];
  topCategories: { name: string; amount: number; id: string }[];
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onNavigate, onAddTransaction }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    setStats(storageService.getDashboardStats());
    setCategories(storageService.getCategories());
  }, [user]); // Refresh when user/data might change (though typically triggered by parent refresh)

  if (!stats) return null;

  const getCategoryName = (catId: string) => categories.find(c => c.id === catId)?.name || 'Unknown';

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Row: Balance & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Balance Card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[200px]">
          <div className="relative z-10">
            <h2 className="text-slate-400 text-sm font-medium mb-1">Total Balance</h2>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl sm:text-5xl font-bold tracking-tight">
                ₹{stats.currentBalance.toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-4 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Last updated: {stats.lastTransactionDate}
            </p>
          </div>

          {/* Quick Action Button inside Card for Mobile */}
          <div className="relative z-10 mt-6 sm:hidden">
            <Button onClick={onAddTransaction} className="bg-white/10 hover:bg-white/20 text-white border-none backdrop-blur-sm">
              <Plus className="w-5 h-5 mr-2" /> Add Transaction
            </Button>
          </div>

          {/* Decorative blob */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 opacity-10 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500 opacity-10 rounded-full blur-3xl -ml-10 -mb-10"></div>
        </div>

        {/* Monthly Summary & Quick Actions Desktop */}
        <div className="space-y-6 flex flex-col">
           {/* Monthly Net Card */}
           <div className="flex-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
             <h3 className="text-slate-500 text-sm font-medium mb-4">This Month</h3>
             <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-md">
                      <ArrowDownLeft className="w-4 h-4" />
                    </div>
                    <span className="text-sm text-slate-600">Income</span>
                  </div>
                  <span className="font-semibold text-slate-900">₹{stats.monthIncome.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-red-100 text-red-600 rounded-md">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                    <span className="text-sm text-slate-600">Expense</span>
                  </div>
                  <span className="font-semibold text-slate-900">₹{stats.monthExpense.toLocaleString('en-IN')}</span>
                </div>
                <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-900">Net Savings</span>
                  <span className={`font-bold ${stats.monthNet >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {stats.monthNet >= 0 ? '+' : ''}₹{stats.monthNet.toLocaleString('en-IN')}
                  </span>
                </div>
             </div>
           </div>
           
           {/* Desktop Add Button */}
           <div className="hidden sm:block">
             <Button onClick={onAddTransaction} className="w-full shadow-lg shadow-blue-600/20 py-4">
                <span className="flex items-center justify-center gap-2">
                  <Plus className="w-5 h-5" /> Add New Transaction
                </span>
             </Button>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="font-bold text-slate-900">Recent Activity</h3>
            <button 
              onClick={() => onNavigate('transactions')}
              className="text-sm text-primary hover:text-blue-700 font-medium flex items-center gap-1 transition-colors"
            >
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="divide-y divide-slate-100">
            {stats.recentTransactions.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                No transactions found. Start by adding one!
              </div>
            ) : (
              stats.recentTransactions.map(txn => (
                <div key={txn.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      txn.type === 'credit' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {txn.type === 'credit' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{getCategoryName(txn.categoryId)}</p>
                      <p className="text-xs text-slate-500">{txn.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${
                      txn.type === 'credit' ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {txn.type === 'credit' ? '+' : '-'}₹{txn.amount.toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-slate-400 font-mono">₹{txn.balance.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Categories Widget */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 h-fit">
          <h3 className="font-bold text-slate-900 mb-4">Top Expenses <span className="text-xs font-normal text-slate-500 ml-1">(Month)</span></h3>
          {stats.topCategories.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No expenses this month.</p>
          ) : (
            <div className="space-y-4">
              {stats.topCategories.map((cat, index) => (
                <div key={cat.id} className="relative">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-700">{cat.name}</span>
                    <span className="text-slate-900 font-semibold">₹{cat.amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        index === 0 ? 'bg-red-500' : index === 1 ? 'bg-orange-500' : 'bg-yellow-500'
                      }`}
                      style={{ width: `${Math.min((cat.amount / stats.monthExpense) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};