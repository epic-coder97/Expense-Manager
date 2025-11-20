import { Category, Transaction, TransactionType } from '../types';

export interface ImportValidationResult {
  validRows: Transaction[];
  errorRows: { row: number; raw: string[]; errors: string[] }[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
  };
}

// Helper to escape CSV fields
const escape = (field: any): string => {
  const stringField = String(field || '');
  if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
    return `"${stringField.replace(/"/g, '""')}"`;
  }
  return stringField;
};

// Helper to parse CSV line handling quotes
const parseLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
};

export const csvHelper = {
  // Generate CSV Template
  generateTemplate: (): string => {
    return `Date,Type,Category,Sub-category,Amount,Notes\n31/01/2024,Debit,Expenses,Groceries,1500,Monthly Dmart run`;
  },

  // Export Transactions to CSV
  exportToCSV: (transactions: Transaction[], categories: Category[]): string => {
    const header = ['Date', 'Type', 'Category', 'Sub-category', 'Amount', 'Balance', 'Notes'];
    const rows = transactions.map(t => {
      const cat = categories.find(c => c.id === t.categoryId);
      const sub = cat?.subCategories.find(s => s.id === t.subCategoryId);
      
      return [
        t.date,
        t.type === 'credit' ? 'Credit' : 'Debit',
        cat?.name || 'Unknown',
        sub?.name || 'Unknown',
        t.amount,
        t.balance,
        t.notes
      ].map(escape).join(',');
    });

    return [header.join(','), ...rows].join('\n');
  },

  // Parse and Validate Import CSV
  validateImport: (csvContent: string, categories: Category[]): ImportValidationResult => {
    const lines = csvContent.split(/\r?\n/).filter(l => l.trim());
    const validRows: Transaction[] = [];
    const errorRows: { row: number; raw: string[]; errors: string[] }[] = [];
    
    // Skip header if exists (Basic check: check if first col is "Date")
    let startIndex = 0;
    if (lines[0] && lines[0].toLowerCase().startsWith('date')) {
      startIndex = 1;
    }

    for (let i = startIndex; i < lines.length; i++) {
      const raw = parseLine(lines[i]);
      // Expected format: Date, Type, Category, Sub-category, Amount, Balance(opt), Notes(opt)
      // Indices: 0=Date, 1=Type, 2=Cat, 3=Sub, 4=Amount, 5=Balance(ignored), 6=Notes
      
      if (raw.length < 5) {
        errorRows.push({ row: i + 1, raw, errors: ['Insufficient columns'] });
        continue;
      }

      const errors: string[] = [];
      const [dateStr, typeStr, catName, subName, amountStr, , notesStr] = raw;

      // 1. Validate Date (DD/MM/YYYY)
      const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
      let isoDate = '';
      let displayDate = '';
      const dateMatch = dateStr.match(dateRegex);
      
      if (!dateMatch) {
        errors.push('Invalid Date format (DD/MM/YYYY required)');
      } else {
        const [_, d, m, y] = dateMatch;
        // Check validity
        const testDate = new Date(`${y}-${m}-${d}`);
        if (isNaN(testDate.getTime())) {
          errors.push('Invalid calendar date');
        } else {
          isoDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
          displayDate = `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
        }
      }

      // 2. Validate Type
      const typeLower = typeStr.toLowerCase();
      if (typeLower !== 'credit' && typeLower !== 'debit') {
        errors.push('Type must be Credit or Debit');
      }

      // 3. Validate Category & Sub-category
      const category = categories.find(c => c.name.toLowerCase() === catName.toLowerCase());
      let categoryId = '';
      let subCategoryId = '';

      if (!category) {
        errors.push(`Category '${catName}' not found`);
      } else {
        if (category.type !== typeLower) {
          errors.push(`Category '${catName}' does not match type '${typeStr}'`);
        }
        categoryId = category.id;
        
        const sub = category.subCategories.find(s => s.name.toLowerCase() === subName.toLowerCase());
        if (!sub) {
          errors.push(`Sub-category '${subName}' not found in '${catName}'`);
        } else {
          subCategoryId = sub.id;
        }
      }

      // 4. Validate Amount
      const amount = parseFloat(amountStr);
      if (isNaN(amount) || amount <= 0) {
        errors.push('Amount must be a positive number');
      }

      if (errors.length > 0) {
        errorRows.push({ row: i + 1, raw, errors });
      } else {
        validRows.push({
          id: `txn_imp_${Date.now()}_${i}`,
          date: displayDate,
          isoDate: isoDate,
          timestamp: new Date(isoDate).getTime(),
          type: typeLower as TransactionType,
          categoryId,
          subCategoryId,
          amount,
          notes: (notesStr || '').trim(),
          balance: 0 // To be recalculated
        });
      }
    }

    return {
      validRows,
      errorRows,
      summary: {
        total: lines.length - startIndex,
        valid: validRows.length,
        invalid: errorRows.length
      }
    };
  }
};