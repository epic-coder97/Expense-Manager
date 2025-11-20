import React, { useState, useEffect } from 'react';
import { Save, X, Calendar, IndianRupee, FileText, ArrowRight, AlertTriangle } from 'lucide-react';
import { Button } from './Button';
import { Category, SubCategory, TransactionType, Transaction } from '../types';
import { storageService } from '../services/storage';

interface TransactionFormProps {
  onComplete: (message?: string) => void;
  onCancel: () => void;
  initialData?: Transaction;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ onComplete, onCancel, initialData }) => {
  const isEditing = !!initialData;

  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<TransactionType>('debit');
  const [categoryId, setCategoryId] = useState('');
  const [subCategoryId, setSubCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  
  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Data State
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredSubCategories, setFilteredSubCategories] = useState<SubCategory[]>([]);
  const [previewBalance, setPreviewBalance] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadedCategories = storageService.getCategories();
    setCategories(loadedCategories);

    // If editing, populate fields
    if (initialData) {
      setDate(initialData.isoDate);
      setType(initialData.type);
      setCategoryId(initialData.categoryId);
      setSubCategoryId(initialData.subCategoryId);
      setAmount(initialData.amount.toString());
      setNotes(initialData.notes || '');

      // Manually trigger subcategory filtering for the initial load
      const cat = loadedCategories.find(c => c.id === initialData.categoryId);
      if (cat) {
        setFilteredSubCategories(cat.subCategories);
      }
    }
  }, [initialData]);

  // Update subcategories when category changes
  useEffect(() => {
    if (categoryId) {
      const cat = categories.find(c => c.id === categoryId);
      setFilteredSubCategories(cat ? cat.subCategories : []);
      
      // Only reset subcategory if it's not valid for the new category
      // (This prevents clearing it during the initial edit load)
      if (cat && !cat.subCategories.find(s => s.id === subCategoryId)) {
        setSubCategoryId('');
      }
    } else {
      setFilteredSubCategories([]);
    }
  }, [categoryId, categories]);

  // Calculate preview balance (Only for Add Mode)
  useEffect(() => {
    if (isEditing) {
      setPreviewBalance(null);
      return;
    }

    if (!date || !amount || isNaN(Number(amount))) {
      setPreviewBalance(null);
      return;
    }

    const numAmount = Number(amount);
    const currentWalletBalance = storageService.getCurrentBalance();
    
    if (type === 'credit') {
      setPreviewBalance(currentWalletBalance + numAmount);
    } else {
      setPreviewBalance(currentWalletBalance - numAmount);
    }
  }, [amount, type, date, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!categoryId || !subCategoryId) {
      setError('Please select a category and sub-category');
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);

    // Use setTimeout to allow UI to render the loading state before the synchronous storage operation blocks
    setTimeout(() => {
      try {
        const [year, month, day] = date.split('-');
        const formattedDate = `${day}/${month}/${year}`;
        const timestamp = new Date(date).getTime();

        const commonData = {
          date: formattedDate,
          isoDate: date,
          timestamp: timestamp,
          type,
          categoryId,
          subCategoryId,
          amount: Number(amount),
          notes: notes.trim()
        };

        let updatedCount = 0;

        if (isEditing && initialData) {
          updatedCount = storageService.updateTransaction({
            ...initialData,
            ...commonData,
            balance: 0 // Will be recalculated
          });
        } else {
          updatedCount = storageService.addTransaction({
            id: `txn_${Date.now()}`,
            ...commonData
          });
        }

        onComplete(`Transaction saved. ${updatedCount} balances recalculated.`);
      } catch (err) {
        console.error(err);
        setError('Failed to save transaction');
        setIsSubmitting(false);
      }
    }, 100);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden animate-fade-in mb-6">
      <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <h3 className="font-bold text-slate-900">{isEditing ? 'Edit Transaction' : 'Add Transaction'}</h3>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600" disabled={isSubmitting}>
          <X className="w-5 h-5" />
        </button>
      </div>

      {isEditing && (
        <div className="px-6 pt-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-3 items-start">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-semibold">Warning</p>
              <p>Editing this transaction will recalculate the running balance for all subsequent transactions.</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
        
        {/* Type Selection */}
        <div className="flex p-1 bg-slate-100 rounded-lg">
          <button
            type="button"
            onClick={() => { setType('debit'); setCategoryId(''); }}
            disabled={isSubmitting}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              type === 'debit' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Debit (Expense)
          </button>
          <button
            type="button"
            onClick={() => { setType('credit'); setCategoryId(''); }}
            disabled={isSubmitting}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              type === 'credit' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Credit (Income)
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Date</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={isSubmitting}
                className="block w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm disabled:bg-slate-50"
                required
              />
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Amount</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <IndianRupee className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isSubmitting}
                placeholder="0.00"
                className="block w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm font-mono disabled:bg-slate-50"
                required
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={isSubmitting}
              className="block w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm appearance-none disabled:bg-slate-50"
              required
            >
              <option value="">Select Category</option>
              {categories.filter(c => c.type === type).map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Sub-Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Sub-Category</label>
            <select
              value={subCategoryId}
              onChange={(e) => setSubCategoryId(e.target.value)}
              className="block w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm appearance-none disabled:bg-slate-100 disabled:text-slate-400"
              disabled={!categoryId || isSubmitting}
              required
            >
              <option value="">Select Sub-Category</option>
              {filteredSubCategories.map(sub => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Notes (Optional)</label>
          <div className="relative">
            <div className="absolute top-3 left-3 flex items-start pointer-events-none">
              <FileText className="h-4 w-4 text-slate-400" />
            </div>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isSubmitting}
              placeholder="e.g., Grocery shopping at Big Bazaar"
              className="block w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm resize-none disabled:bg-slate-50"
            />
          </div>
        </div>

        {/* Balance Preview (Add Mode Only) */}
        {previewBalance !== null && !isEditing && (
          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm">
            <span className="text-slate-500">Updated Balance:</span>
            <span className="font-bold font-mono text-slate-900">₹{previewBalance.toLocaleString('en-IN')}</span>
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting} className="w-1/3">
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting} className="w-2/3">
            <span className="flex items-center justify-center gap-2">
              {isEditing ? 'Update Transaction' : 'Save Transaction'} 
              <ArrowRight className="w-4 h-4" />
            </span>
          </Button>
        </div>
      </form>
    </div>
  );
};