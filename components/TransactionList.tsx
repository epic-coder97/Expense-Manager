import React, { useState, useEffect } from 'react';
import { Search, Filter, ArrowDownLeft, ArrowUpRight, Calendar, Tag, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { Transaction, Category } from '../types';
import { storageService } from '../services/storage';
import { Button } from './Button';

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (message?: string) => void; // Callback to parent to refresh data with message
}

// Extracted Row Component for performance and cleaner code
const TransactionRow: React.FC<{ 
  txn: Transaction; 
  categories: Category[]; 
  onEdit: (t: Transaction) => void; 
  onDeleteClick: (t: Transaction) => void;
}> = ({ txn, categories, onEdit, onDeleteClick }) => {
  
  const getCategoryName = (catId: string) => categories.find(c => c.id === catId)?.name || 'Unknown';
  const getSubCategoryName = (catId: string, subId: string) => {
    const cat = categories.find(c => c.id === catId);
    return cat?.subCategories.find(s => s.id === subId)?.name || 'Unknown';
  };

  return (
    <div className="group bg-white p-4 rounded-xl border border-slate-200 hover:border-primary/50 hover:shadow-md transition-all mb-3 relative">
      <div className="flex items-start justify-between gap-3">
        {/* Icon & Basic Info */}
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-full flex-shrink-0 mt-1 ${
            txn.type === 'credit' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
          }`}>
            {txn.type === 'credit' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
          </div>
          
          <div>
            <h4 className="font-semibold text-slate-900 text-sm sm:text-base">
              {getSubCategoryName(txn.categoryId, txn.subCategoryId)}
            </h4>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {txn.date}
              </span>
              <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
              <span className="flex items-center gap-1">
                <Tag className="w-3 h-3" /> {getCategoryName(txn.categoryId)}
              </span>
            </div>
            {txn.notes && (
              <p className="text-xs text-slate-400 mt-1.5 line-clamp-1">{txn.notes}</p>
            )}
          </div>
        </div>

        {/* Amount & Balance */}
        <div className="text-right flex-shrink-0">
          <p className={`font-bold text-sm sm:text-base ${
            txn.type === 'credit' ? 'text-emerald-600' : 'text-red-600'
          }`}>
            {txn.type === 'credit' ? '+' : '-'}₹{txn.amount.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Bal: ₹{txn.balance.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Hover Actions */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white shadow-sm rounded-lg border border-slate-100 p-0.5">
        <button 
          onClick={(e) => { e.stopPropagation(); onEdit(txn); }}
          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
          title="Edit"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onDeleteClick(txn); }}
          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export const TransactionList: React.FC<TransactionListProps> = ({ transactions, onEdit, onDelete }) => {
  const [filterType, setFilterType] = useState<'all' | 'credit' | 'debit'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Pagination
  const [displayLimit, setDisplayLimit] = useState(50);

  // Delete Modal State
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setCategories(storageService.getCategories());
  }, []);

  // Helpers for Filtering
  const getCategoryName = (catId: string) => categories.find(c => c.id === catId)?.name || 'Unknown';
  const getSubCategoryName = (catId: string, subId: string) => {
    const cat = categories.find(c => c.id === catId);
    return cat?.subCategories.find(s => s.id === subId)?.name || 'Unknown';
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesType = filterType === 'all' || t.type === filterType;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      (t.notes || '').toLowerCase().includes(searchLower) ||
      getCategoryName(t.categoryId).toLowerCase().includes(searchLower) ||
      getSubCategoryName(t.categoryId, t.subCategoryId).toLowerCase().includes(searchLower) ||
      t.amount.toString().includes(searchLower);
    
    return matchesType && matchesSearch;
  });

  const displayedTransactions = filteredTransactions.slice(0, displayLimit);

  const handleConfirmDelete = async () => {
    if (!transactionToDelete) return;
    
    setIsDeleting(true);
    
    // Simulate async to show loading state
    setTimeout(() => {
      try {
        const count = storageService.deleteTransaction(transactionToDelete.id);
        setTransactionToDelete(null);
        onDelete(`Transaction deleted. ${count} balances recalculated.`);
      } catch (e) {
        console.error("Delete failed", e);
      } finally {
        setIsDeleting(false);
      }
    }, 100);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm"
          />
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 text-sm font-medium rounded-lg border ${
              filterType === 'all' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType('credit')}
            className={`px-4 py-2 text-sm font-medium rounded-lg border ${
              filterType === 'credit' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-300 hover:bg-emerald-50 hover:text-emerald-700'
            }`}
          >
            Income
          </button>
          <button
            onClick={() => setFilterType('debit')}
            className={`px-4 py-2 text-sm font-medium rounded-lg border ${
              filterType === 'debit' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-600 border-slate-300 hover:bg-red-50 hover:text-red-700'
            }`}
          >
            Expense
          </button>
        </div>
      </div>

      {/* List */}
      <div className="mt-4">
        {displayedTransactions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 border-dashed">
            <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <Filter className="w-5 h-5 text-slate-300" />
            </div>
            <h3 className="text-slate-900 font-medium text-sm">No transactions found</h3>
            <p className="text-slate-400 text-xs mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            {displayedTransactions.map(txn => (
              <TransactionRow 
                key={txn.id} 
                txn={txn} 
                categories={categories}
                onEdit={onEdit}
                onDeleteClick={(t) => setTransactionToDelete(t)}
              />
            ))}
            
            {displayedTransactions.length < filteredTransactions.length && (
              <button 
                onClick={() => setDisplayLimit(prev => prev + 50)}
                className="w-full py-3 text-sm text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-colors"
              >
                Load More
              </button>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {transactionToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Transaction?</h3>
              <p className="text-slate-500 text-sm mb-6">
                Are you sure you want to delete this transaction of 
                <span className="font-bold text-slate-900"> ₹{transactionToDelete.amount.toLocaleString('en-IN')}</span>? 
                <br/>
                <span className="text-red-600 font-medium block mt-2 text-xs">
                  ⚠️ All future balances will be recalculated.
                </span>
              </p>
              
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setTransactionToDelete(null)} disabled={isDeleting}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={handleConfirmDelete} isLoading={isDeleting}>
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};