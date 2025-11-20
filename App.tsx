import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle2 } from 'lucide-react';
import { Login } from './components/Login';
import { SetupWizard } from './components/SetupWizard';
import { Layout, View } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { CategoryManager } from './components/CategoryManager';
import { TransactionList } from './components/TransactionList';
import { TransactionForm } from './components/TransactionForm';
import { Reports } from './components/Reports';
import { Settings } from './components/Settings';
import { Button } from './components/Button';
import { storageService } from './services/storage';
import { UserProfile, Transaction } from './types';

const App: React.FC = () => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  
  // Navigation & Data State
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // UI State
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Refresh user data and transactions from storage
  const refreshData = () => {
    const userData = storageService.getUser();
    setUser(userData);
    setTransactions(storageService.getTransactions());
    return userData;
  };

  useEffect(() => {
    // Initialize data on app load
    storageService.initializeCategories();
    setIsLoading(false);
  }, []);

  // Notification timer
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleLoginSuccess = () => {
    const userData = refreshData();
    if (userData) {
      setIsAuthenticated(true);
    }
  };

  const handleSetupComplete = () => {
    refreshData();
    storageService.initializeCategories();
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setCurrentView('dashboard');
    storageService.clearSession();
  };

  const handleTransactionSaved = (message?: string) => {
    setShowAddTransaction(false);
    setEditingTransaction(null);
    refreshData();
    if (message) setNotification(message);
    // Optionally redirect to list
    setCurrentView('transactions');
  };

  const handleEditTransaction = (txn: Transaction) => {
    setEditingTransaction(txn);
    setShowAddTransaction(true); // Reuse the modal/form view logic
    setCurrentView('transactions'); // Ensure we are on the transactions view
  };

  const handleTransactionDeleted = (message?: string) => {
    refreshData();
    if (message) setNotification(message);
  };

  const handleCancelEdit = () => {
    setShowAddTransaction(false);
    setEditingTransaction(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  if (user?.isFirstTime) {
    return <SetupWizard onComplete={handleSetupComplete} />;
  }

  return (
    <Layout 
      onLogout={handleLogout} 
      currentView={currentView} 
      onNavigate={(view) => {
        setCurrentView(view);
        setShowAddTransaction(false);
        setEditingTransaction(null);
      }}
    >
      {/* Sub-header actions for specific views */}
      {currentView === 'transactions' && !showAddTransaction && (
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-900">Transactions</h2>
          <Button 
            className="w-auto flex items-center gap-2" 
            onClick={() => setShowAddTransaction(true)}
          >
            <Plus className="w-4 h-4" /> New Transaction
          </Button>
        </div>
      )}

      {currentView === 'dashboard' && user && (
        <Dashboard 
          user={user} 
          onNavigate={(view) => setCurrentView(view)}
          onAddTransaction={() => {
            setCurrentView('transactions');
            setShowAddTransaction(true);
          }}
        />
      )}

      {currentView === 'transactions' && (
        <>
          {showAddTransaction ? (
            <TransactionForm 
              onComplete={handleTransactionSaved}
              onCancel={handleCancelEdit}
              initialData={editingTransaction || undefined}
            />
          ) : (
            <TransactionList 
              transactions={transactions} 
              onEdit={handleEditTransaction}
              onDelete={handleTransactionDeleted}
            />
          )}
        </>
      )}

      {currentView === 'categories' && <CategoryManager />}
      
      {currentView === 'reports' && <Reports />}

      {currentView === 'settings' && <Settings />}

      {/* Global Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-2xl z-50 animate-bounce-in flex items-center gap-3 border border-slate-700">
          <div className="bg-green-500/20 p-1.5 rounded-full">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
          </div>
          <span className="text-sm font-medium">{notification}</span>
        </div>
      )}
    </Layout>
  );
};

export default App;