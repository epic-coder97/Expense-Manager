import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, ChevronDown, ChevronRight, FolderOpen, Tag, AlertTriangle, X, Save } from 'lucide-react';
import { Category, TransactionType, SubCategory } from '../types';
import { storageService } from '../services/storage';
import { Button } from './Button';

export const CategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState<TransactionType>('debit');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add_cat' | 'edit_cat' | 'add_sub' | 'edit_sub'>('add_cat');
  const [editingId, setEditingId] = useState<string | null>(null); // Cat ID or Sub ID
  const [parentId, setParentId] = useState<string | null>(null); // For subcategories
  const [nameInput, setNameInput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = () => {
    setCategories(storageService.getCategories());
  };

  const toggleExpand = (catId: string) => {
    const newSet = new Set(expandedCategories);
    if (newSet.has(catId)) {
      newSet.delete(catId);
    } else {
      newSet.add(catId);
    }
    setExpandedCategories(newSet);
  };

  const filteredCategories = categories.filter(c => c.type === activeTab);

  // --- CRUD HANDLERS ---

  const openModal = (mode: typeof modalMode, parentId: string | null = null, editId: string | null = null, currentName: string = '') => {
    setModalMode(mode);
    setParentId(parentId);
    setEditingId(editId);
    setNameInput(currentName);
    setError('');
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!nameInput.trim()) {
      setError('Name cannot be empty');
      return;
    }

    const newCategories = [...categories];

    try {
      if (modalMode === 'add_cat') {
        // Check duplicate
        if (categories.some(c => c.type === activeTab && c.name.toLowerCase() === nameInput.toLowerCase())) {
          throw new Error('Category with this name already exists');
        }
        newCategories.push({
          id: `cat_${Date.now()}`,
          name: nameInput.trim(),
          type: activeTab,
          subCategories: []
        });
      } 
      else if (modalMode === 'edit_cat' && editingId) {
        const idx = newCategories.findIndex(c => c.id === editingId);
        if (idx > -1) {
          // Check duplicate (excluding self)
          if (newCategories.some(c => c.type === activeTab && c.id !== editingId && c.name.toLowerCase() === nameInput.toLowerCase())) {
            throw new Error('Category with this name already exists');
          }
          newCategories[idx].name = nameInput.trim();
        }
      } 
      else if (modalMode === 'add_sub' && parentId) {
        const catIdx = newCategories.findIndex(c => c.id === parentId);
        if (catIdx > -1) {
           if (newCategories[catIdx].subCategories.some(s => s.name.toLowerCase() === nameInput.toLowerCase())) {
            throw new Error('Sub-category with this name already exists');
           }
           newCategories[catIdx].subCategories.push({
             id: `sub_${Date.now()}`,
             name: nameInput.trim()
           });
           // Auto expand
           if (!expandedCategories.has(parentId)) {
             toggleExpand(parentId);
           }
        }
      } 
      else if (modalMode === 'edit_sub' && parentId && editingId) {
        const catIdx = newCategories.findIndex(c => c.id === parentId);
        if (catIdx > -1) {
          const subIdx = newCategories[catIdx].subCategories.findIndex(s => s.id === editingId);
          if (subIdx > -1) {
             if (newCategories[catIdx].subCategories.some(s => s.id !== editingId && s.name.toLowerCase() === nameInput.toLowerCase())) {
              throw new Error('Sub-category with this name already exists');
             }
             newCategories[catIdx].subCategories[subIdx].name = nameInput.trim();
          }
        }
      }

      storageService.saveCategories(newCategories);
      setCategories(newCategories);
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteCategory = (catId: string) => {
    if (storageService.hasTransactions(catId)) {
      alert("Cannot delete category with existing transactions.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this category? All sub-categories will be deleted.")) {
      return;
    }
    const newCats = categories.filter(c => c.id !== catId);
    storageService.saveCategories(newCats);
    setCategories(newCats);
  };

  const handleDeleteSubCategory = (catId: string, subId: string) => {
    if (storageService.hasSubCategoryTransactions(subId)) {
      alert("Cannot delete sub-category with existing transactions.");
      return;
    }
    if (!window.confirm("Delete this sub-category?")) {
      return;
    }
    const newCats = categories.map(c => {
      if (c.id === catId) {
        return { ...c, subCategories: c.subCategories.filter(s => s.id !== subId) };
      }
      return c;
    });
    storageService.saveCategories(newCats);
    setCategories(newCats);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Categories</h2>
          <p className="text-slate-500">Manage your income and expense classification.</p>
        </div>
        <Button 
          className="sm:w-auto w-full flex items-center justify-center gap-2"
          onClick={() => openModal('add_cat')}
        >
          <Plus className="w-4 h-4" /> Add Category
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-slate-100 rounded-xl w-full sm:w-fit">
        <button
          onClick={() => setActiveTab('debit')}
          className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'debit' 
              ? 'bg-white text-primary shadow-sm' 
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Debit (Expenses)
        </button>
        <button
          onClick={() => setActiveTab('credit')}
          className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'credit' 
              ? 'bg-white text-primary shadow-sm' 
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Credit (Income)
        </button>
      </div>

      {/* Category List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {filteredCategories.length === 0 ? (
          <div className="p-12 text-center">
            <FolderOpen className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <h3 className="text-slate-900 font-medium">No categories found</h3>
            <p className="text-slate-500 text-sm mt-1">Add a category to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredCategories.map(category => (
              <div key={category.id} className="group">
                {/* Category Header */}
                <div className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                  <div 
                    className="flex items-center gap-3 flex-grow cursor-pointer" 
                    onClick={() => toggleExpand(category.id)}
                  >
                    <span className={`text-slate-400 transition-transform duration-200 ${expandedCategories.has(category.id) ? 'rotate-90' : ''}`}>
                      {category.subCategories.length > 0 ? <ChevronRight className="w-5 h-5" /> : <Tag className="w-4 h-4 ml-0.5" />}
                    </span>
                    <span className="font-medium text-slate-900">{category.name}</span>
                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                      {category.subCategories.length}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => openModal('add_sub', category.id)}
                      className="p-2 text-slate-400 hover:text-primary hover:bg-blue-50 rounded-lg"
                      title="Add Sub-category"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => openModal('edit_cat', null, category.id, category.name)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Edit Category"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteCategory(category.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      title="Delete Category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Sub Categories */}
                {expandedCategories.has(category.id) && (
                  <div className="bg-slate-50/50 border-t border-slate-100">
                    {category.subCategories.length === 0 ? (
                      <div className="px-12 py-3 text-sm text-slate-400 italic">
                        No sub-categories. Add one to organize better.
                      </div>
                    ) : (
                      <ul className="divide-y divide-slate-100">
                        {category.subCategories.map(sub => (
                          <li key={sub.id} className="flex items-center justify-between py-3 pl-12 pr-4 hover:bg-slate-100/80 transition-colors group/sub">
                            <span className="text-sm text-slate-600">{sub.name}</span>
                            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover/sub:opacity-100 transition-opacity">
                              <button 
                                onClick={() => openModal('edit_sub', category.id, sub.id, sub.name)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-md"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleDeleteSubCategory(category.id, sub.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-md"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-semibold text-slate-900">
                {modalMode === 'add_cat' && 'Add New Category'}
                {modalMode === 'edit_cat' && 'Edit Category'}
                {modalMode === 'add_sub' && 'Add Sub-category'}
                {modalMode === 'edit_sub' && 'Edit Sub-category'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                placeholder="e.g., Groceries"
                autoFocus
              />
              
              {error && (
                <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="mt-6 flex items-center gap-3">
                <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <span className="flex items-center gap-2">
                    <Save className="w-4 h-4" /> Save
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};