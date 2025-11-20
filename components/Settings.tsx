import React, { useState, useRef } from 'react';
import { Download, Upload, RefreshCw, Trash2, AlertTriangle, FileText, CheckCircle2, X, FileJson } from 'lucide-react';
import { Button } from './Button';
import { storageService } from '../services/storage';
import { csvHelper, ImportValidationResult } from '../utils/csvHelper';
import { Transaction } from '../types';

export const Settings: React.FC = () => {
  // Import State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importState, setImportState] = useState<{
    step: 'idle' | 'preview' | 'processing' | 'success';
    validation: ImportValidationResult | null;
    filename: string;
  }>({ step: 'idle', validation: null, filename: '' });
  
  const [notification, setNotification] = useState<string | null>(null);

  // --- EXPORT HANDLERS ---

  const handleDownloadTemplate = () => {
    const csv = csvHelper.generateTemplate();
    downloadFile(csv, 'ExpenseTracker_Template.csv', 'text/csv');
  };

  const handleExportCSV = () => {
    const txns = storageService.getTransactions();
    const cats = storageService.getCategories();
    const csv = csvHelper.exportToCSV(txns, cats);
    const date = new Date().toISOString().slice(0,10).replace(/-/g,'');
    downloadFile(csv, `ExpenseTracker_Export_${date}.csv`, 'text/csv');
  };

  const handleExportJSON = () => {
    const json = storageService.getBackupData();
    const date = new Date().toISOString().slice(0,10).replace(/-/g,'');
    downloadFile(json, `ExpenseTracker_Backup_${date}.json`, 'application/json');
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // --- IMPORT HANDLERS ---

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      const categories = storageService.getCategories();
      const validation = csvHelper.validateImport(content, categories);
      
      setImportState({
        step: 'preview',
        validation,
        filename: file.name
      });
    };
    reader.readAsText(file);
    // Reset input so same file can be selected again if cancelled
    e.target.value = ''; 
  };

  const handleConfirmImport = () => {
    if (!importState.validation) return;

    setImportState(prev => ({ ...prev, step: 'processing' }));
    
    setTimeout(() => {
      try {
        const count = storageService.bulkAddTransactions(importState.validation!.validRows);
        setImportState({ step: 'success', validation: null, filename: '' });
        setNotification(`Successfully imported ${count} transactions.`);
      } catch (e) {
        console.error(e);
        alert("Import failed.");
        setImportState(prev => ({ ...prev, step: 'preview' })); // Go back to preview on error
      }
    }, 500);
  };

  const downloadErrorLog = () => {
    if (!importState.validation) return;
    
    let csv = "Row,Original Data,Errors\n";
    importState.validation.errorRows.forEach(err => {
      const rowData = `"${err.raw.join('","')}"`;
      const errors = `"${err.errors.join('; ')}"`;
      csv += `${err.row},${rowData},${errors}\n`;
    });
    
    downloadFile(csv, 'Import_Errors.csv', 'text/csv');
  };

  // --- RESET HANDLER ---

  const handleResetData = () => {
    if (confirm("CRITICAL WARNING: This will wipe ALL your data including categories and transactions. This action cannot be undone. Are you sure?")) {
      storageService.factoryReset();
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
        <p className="text-slate-500">Manage your data, import backups, and system preferences.</p>
      </div>

      {/* EXPORT SECTION */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Download className="w-5 h-5 text-blue-600" /> Export Data
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-slate-100 rounded-lg bg-slate-50 hover:border-blue-200 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <FileText className="w-8 h-8 text-slate-400" />
              <Button variant="secondary" className="w-auto text-xs py-2 h-auto" onClick={handleExportCSV}>
                Export CSV
              </Button>
            </div>
            <h4 className="font-medium text-slate-900">Transaction History</h4>
            <p className="text-xs text-slate-500 mt-1">Download all your income and expenses as a CSV file readable by Excel.</p>
          </div>

          <div className="p-4 border border-slate-100 rounded-lg bg-slate-50 hover:border-blue-200 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <FileJson className="w-8 h-8 text-slate-400" />
              <Button variant="secondary" className="w-auto text-xs py-2 h-auto" onClick={handleExportJSON}>
                Export Backup
              </Button>
            </div>
            <h4 className="font-medium text-slate-900">Full System Backup</h4>
            <p className="text-xs text-slate-500 mt-1">JSON file containing all categories, settings, and transactions for restoration.</p>
          </div>
        </div>
      </div>

      {/* IMPORT SECTION */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5 text-emerald-600" /> Import Data
        </h3>
        
        {importState.step === 'idle' || importState.step === 'success' ? (
          <div className="space-y-6">
             {importState.step === 'success' && (
               <div className="bg-green-50 border border-green-100 p-4 rounded-lg flex items-center gap-3 mb-4">
                 <CheckCircle2 className="w-5 h-5 text-green-600" />
                 <div>
                   <p className="font-medium text-green-900">Import Successful</p>
                   <p className="text-xs text-green-700">{notification}</p>
                 </div>
                 <button onClick={() => setImportState({ step: 'idle', validation: null, filename: '' })} className="ml-auto text-green-700 hover:text-green-900">
                   <X className="w-4 h-4" />
                 </button>
               </div>
             )}

             <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <p className="text-sm text-slate-600 mb-3">1. Download the template to format your data correctly.</p>
                  <Button variant="secondary" className="w-full sm:w-auto flex items-center gap-2" onClick={handleDownloadTemplate}>
                    <Download className="w-4 h-4" /> Download Template
                  </Button>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-600 mb-3">2. Upload your filled CSV file.</p>
                  <input 
                    type="file" 
                    accept=".csv" 
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <Button className="w-full sm:w-auto flex items-center gap-2" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="w-4 h-4" /> Select CSV File
                  </Button>
                </div>
             </div>
          </div>
        ) : importState.step === 'preview' ? (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
               <div>
                 <h4 className="font-semibold text-slate-900">Preview: {importState.filename}</h4>
                 <p className="text-xs text-slate-500">
                   Total: {importState.validation?.summary.total} | 
                   Valid: <span className="text-green-600 font-bold">{importState.validation?.summary.valid}</span> | 
                   Errors: <span className="text-red-600 font-bold">{importState.validation?.summary.invalid}</span>
                 </p>
               </div>
               <Button variant="secondary" onClick={() => setImportState({ step: 'idle', validation: null, filename: '' })} className="w-auto">
                 Cancel
               </Button>
            </div>

            {/* Errors Section */}
            {importState.validation?.errorRows.length! > 0 && (
              <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h5 className="font-bold text-red-800 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Issues Found ({importState.validation?.errorRows.length})
                  </h5>
                  <button onClick={downloadErrorLog} className="text-xs font-medium text-red-700 hover:underline">
                    Download Error Log
                  </button>
                </div>
                <div className="max-h-40 overflow-y-auto text-xs space-y-1">
                  {importState.validation?.errorRows.slice(0, 10).map((err, idx) => (
                    <div key={idx} className="text-red-700">
                      <span className="font-bold">Row {err.row}:</span> {err.errors.join(', ')}
                    </div>
                  ))}
                  {importState.validation!.errorRows.length > 10 && (
                    <p className="text-red-500 italic pt-1">...and {importState.validation!.errorRows.length - 10} more errors.</p>
                  )}
                </div>
              </div>
            )}

            {/* Valid Rows Preview */}
            {importState.validation?.validRows.length! > 0 ? (
              <div>
                <h5 className="font-semibold text-slate-700 mb-2">Valid Transactions Preview</h5>
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-medium">
                      <tr>
                        <th className="px-4 py-2">Date</th>
                        <th className="px-4 py-2">Type</th>
                        <th className="px-4 py-2">Amount</th>
                        <th className="px-4 py-2">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {importState.validation?.validRows.slice(0, 5).map((row, idx) => (
                        <tr key={idx} className="bg-white">
                          <td className="px-4 py-2">{row.date}</td>
                          <td className="px-4 py-2 capitalize">{row.type}</td>
                          <td className="px-4 py-2">₹{row.amount}</td>
                          <td className="px-4 py-2 text-slate-500 truncate max-w-[200px]">{row.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {importState.validation!.validRows.length > 5 && (
                    <div className="px-4 py-2 bg-slate-50 text-xs text-slate-500 text-center">
                      ...and {importState.validation!.validRows.length - 5} more valid rows.
                    </div>
                  )}
                </div>
                
                <div className="mt-6">
                  <Button onClick={handleConfirmImport} className="w-full sm:w-auto">
                    Import {importState.validation?.validRows.length} Valid Rows
                  </Button>
                </div>
              </div>
            ) : (
               <div className="text-center py-6 text-slate-500 bg-slate-50 rounded-lg border border-slate-200 border-dashed">
                 No valid rows to import. Please check the error log and correct your CSV.
               </div>
            )}
          </div>
        ) : (
          <div className="py-12 text-center">
            <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
            <p className="text-slate-500">Processing import...</p>
          </div>
        )}
      </div>

      {/* DANGER ZONE */}
      <div className="bg-red-50 rounded-xl shadow-sm border border-red-100 p-6 mt-8">
        <h3 className="text-lg font-bold text-red-900 mb-2 flex items-center gap-2">
          <Trash2 className="w-5 h-5" /> Danger Zone
        </h3>
        <p className="text-sm text-red-700 mb-4">
          Resetting the application will permanently delete all transactions, categories, and user settings. 
          This action cannot be undone.
        </p>
        <Button variant="danger" className="w-auto" onClick={handleResetData}>
          Reset All Data
        </Button>
      </div>
    </div>
  );
};