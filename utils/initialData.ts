import { Category } from '../types';

export const PREDEFINED_CATEGORIES: Category[] = [
  // CREDIT CATEGORIES
  {
    id: 'cat_income',
    name: 'Income',
    type: 'credit',
    subCategories: [
      { id: 'sub_salary', name: 'Monthly Salary' },
      { id: 'sub_bonus', name: 'Bonus' },
      { id: 'sub_incentives', name: 'Incentives' },
      { id: 'sub_freelance', name: 'Freelance' },
      { id: 'sub_other_income', name: 'Others' }
    ]
  },
  {
    id: 'cat_redemption',
    name: 'Redemption',
    type: 'credit',
    subCategories: [
      { id: 'sub_fd_withdrawal', name: 'FD/RD Withdrawal' },
      { id: 'sub_ppf_withdrawal', name: 'PPF Withdrawal' },
      { id: 'sub_property_sale', name: 'Property Sale' },
      { id: 'sub_gold_sale', name: 'Gold Sale' },
      { id: 'sub_other_redemption', name: 'Others' }
    ]
  },
  
  // DEBIT CATEGORIES
  {
    id: 'cat_expenses',
    name: 'Expenses',
    type: 'debit',
    subCategories: [
      { id: 'sub_groceries', name: 'Groceries' },
      { id: 'sub_restaurants', name: 'Restaurants' },
      { id: 'sub_fuel', name: 'Fuel' },
      { id: 'sub_transport', name: 'Public Transport' },
      { id: 'sub_electricity', name: 'Electricity' },
      { id: 'sub_water', name: 'Water' },
      { id: 'sub_internet', name: 'Internet' },
      { id: 'sub_phone', name: 'Phone' },
      { id: 'sub_rent', name: 'Rent' },
      { id: 'sub_movies', name: 'Movies' },
      { id: 'sub_subscriptions', name: 'Subscriptions' },
      { id: 'sub_medical', name: 'Medical' },
      { id: 'sub_pharmacy', name: 'Pharmacy' },
      { id: 'sub_clothing', name: 'Clothing' },
      { id: 'sub_electronics', name: 'Electronics' },
      { id: 'sub_other_expenses', name: 'Others' }
    ]
  },
  {
    id: 'cat_investment',
    name: 'Investment',
    type: 'debit',
    subCategories: [
      { id: 'sub_fd', name: 'FD' },
      { id: 'sub_rd', name: 'RD' },
      { id: 'sub_ppf', name: 'PPF' },
      { id: 'sub_sip', name: 'Mutual Funds SIP' },
      { id: 'sub_stocks', name: 'Stocks' },
      { id: 'sub_property', name: 'Property' },
      { id: 'sub_gold', name: 'Gold' },
      { id: 'sub_lic', name: 'LIC' },
      { id: 'sub_term_ins', name: 'Term Insurance' },
      { id: 'sub_home_loan', name: 'Home Loan EMI' },
      { id: 'sub_personal_loan', name: 'Personal Loan EMI' },
      { id: 'sub_other_inv', name: 'Others' }
    ]
  }
];