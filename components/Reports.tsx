
import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ArrowDownLeft, ArrowUpRight, TrendingUp, PieChart, Calendar, BarChart3 } from 'lucide-react';
import { storageService } from '../services/storage';
import { Transaction, Category } from '../types';

export const Reports: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    setTransactions(storageService.getTransactions());
    setCategories(storageService.getCategories());
  }, []);

  // --- HELPERS ---

  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || 'Unknown';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  // --- CALCULATIONS ---

  const stats = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Current Month Filtering
    const currentMonthTxns = transactions.filter(t => {
      const d = new Date(t.isoDate);
      return d.getMonth() === month && d.getFullYear() === year;
    });

    const income = currentMonthTxns
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = currentMonthTxns
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0);

    const net = income - expense;
    const savingsRate = income > 0 ? (net / income) * 100 : 0;

    // Category Breakdown (Expenses)
    const categoryMap = new Map<string, number>();
    currentMonthTxns
      .filter(t => t.type === 'debit')
      .forEach(t => {
        const current = categoryMap.get(t.categoryId) || 0;
        categoryMap.set(t.categoryId, current + t.amount);
      });

    const categoryStats = Array.from(categoryMap.entries())
      .map(([id, amount]) => ({
        id,
        name: getCategoryName(id),
        amount,
        percentage: expense > 0 ? (amount / expense) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount);

    // Trend Data (Last 6 Months)
    const trendData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentDate);
      d.setMonth(d.getMonth() - i);
      const m = d.getMonth();
      const y = d.getFullYear();
      const label = d.toLocaleString('default', { month: 'short' });

      const monthTxns = transactions.filter(t => {
        const td = new Date(t.isoDate);
        return td.getMonth() === m && td.getFullYear() === y;
      });

      const mIncome = monthTxns.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
      const mExpense = monthTxns.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0);
      
      trendData.push({ label, income: mIncome, expense: mExpense });
    }

    return {
      income,
      expense,
      net,
      savingsRate,
      categoryStats,
      trendData
    };
  }, [transactions, currentDate, categories]);

  const maxTrendValue = Math.max(
    ...stats.trendData.map(d => Math.max(d.income, d.expense)), 
    1000 // Minimum scale
  );

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header & Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" /> Monthly Report
        </h2>
        
        <div className="flex items-center bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
          <button 
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-slate-50 rounded-lg text-slate-500 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="px-4 min-w-[140px] text-center font-semibold text-slate-700 select-none flex items-center justify-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </div>
          <button 
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-slate-50 rounded-lg text-slate-500 transition-colors"
            disabled={new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1) > new Date()}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-sm font-medium mb-2 flex items-center gap-2">
            <ArrowDownLeft className="w-4 h-4 text-emerald-500" /> Income
          </div>
          <div className="text-2xl font-bold text-slate-900">{formatCurrency(stats.income)}</div>
        </div>
        
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-sm font-medium mb-2 flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4 text-red-500" /> Expense
          </div>
          <div className="text-2xl font-bold text-slate-900">{formatCurrency(stats.expense)}</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-sm font-medium mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-500" /> Net Savings
          </div>
          <div className={`text-2xl font-bold ${stats.net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {stats.net > 0 ? '+' : ''}{formatCurrency(stats.net)}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-sm font-medium mb-2 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-purple-500" /> Savings Rate
          </div>
          <div className="flex items-end gap-2">
            <div className="text-2xl font-bold text-slate-900">{stats.savingsRate.toFixed(1)}%</div>
            {stats.income > 0 && (
              <div className="w-full bg-slate-100 h-2 rounded-full mb-1.5 ml-2 overflow-hidden">
                <div 
                  className={`h-full rounded-full ${stats.savingsRate > 20 ? 'bg-emerald-500' : stats.savingsRate > 0 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                  style={{ width: `${Math.max(0, Math.min(100, stats.savingsRate))}%` }}
                ></div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Category Breakdown */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-bold text-slate-900 mb-6">Expense by Category</h3>
          {stats.categoryStats.length === 0 ? (
             <div className="text-center py-12 text-slate-400">
               No expenses recorded for this month.
             </div>
          ) : (
            <div className="space-y-5">
              {stats.categoryStats.map((cat) => (
                <div key={cat.id} className="relative">
                  <div className="flex justify-between text-sm mb-1.5">
                    <div className="font-medium text-slate-700">{cat.name}</div>
                    <div className="flex gap-3">
                      <span className="font-semibold text-slate-900">{formatCurrency(cat.amount)}</span>
                      <span className="text-slate-400 w-10 text-right">{cat.percentage.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="bg-primary h-full rounded-full transition-all duration-500" 
                      style={{ width: `${cat.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 6 Month Trend */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-bold text-slate-900 mb-6">6 Month Trend</h3>
          <div className="flex items-end justify-between h-64 gap-2">
            {stats.trendData.map((data, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                
                {/* Bars Container */}
                <div className="w-full flex gap-1 items-end justify-center h-full">
                  {/* Income Bar */}
                  <div 
                    className="w-3 bg-emerald-400 rounded-t-sm transition-all duration-500 hover:bg-emerald-500 relative"
                    style={{ height: `${Math.max(4, (data.income / maxTrendValue) * 100)}%` }}
                  ></div>
                  {/* Expense Bar */}
                  <div 
                    className="w-3 bg-red-400 rounded-t-sm transition-all duration-500 hover:bg-red-500 relative"
                    style={{ height: `${Math.max(4, (data.expense / maxTrendValue) * 100)}%` }}
                  ></div>
                </div>

                {/* Label */}
                <span className="text-xs text-slate-500 font-medium">{data.label}</span>

                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs p-2 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10">
                  <div className="flex gap-2">
                    <span className="text-emerald-300">In: {formatCurrency(data.income)}</span>
                    <span className="text-red-300">Out: {formatCurrency(data.expense)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 flex justify-center gap-6 text-xs text-slate-500">
             <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-emerald-400 rounded-sm"></div> Income
             </div>
             <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-red-400 rounded-sm"></div> Expense
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};
    