// Script to clear localStorage and reset with monthly interest data
// Run this in browser console to fix the quarterly interest issue

console.log('🔄 Clearing localStorage and resetting with monthly interest data...');

// Clear existing data
localStorage.removeItem('series');
localStorage.removeItem('investors');
localStorage.removeItem('auditLogs');

console.log('✅ Cleared existing localStorage data');

// Reset with fresh monthly interest data
const freshSeriesData = [
  {
    id: 1,
    name: 'Series A',
    status: 'active',
    interestFrequency: 'Monthly Interest',
    interestRate: 9.5,
    investors: 0,
    fundsRaised: 35000000,
    targetAmount: 50000000,
    issueDate: '1/6/2023',
    maturityDate: '1/6/2028',
    faceValue: 1000,
    minInvestment: 10000,
    releaseDate: '1/6/2023',
    lockInPeriod: 24
  },
  {
    id: 2,
    name: 'Series B',
    status: 'active',
    interestFrequency: 'Monthly Interest',
    interestRate: 10,
    investors: 0,
    fundsRaised: 42000000,
    targetAmount: 50000000,
    issueDate: '15/9/2023',
    maturityDate: '15/9/2028',
    faceValue: 1000,
    minInvestment: 15000,
    releaseDate: '15/9/2023',
    lockInPeriod: 30
  },
  {
    id: 3,
    name: 'Series C',
    status: 'active',
    interestFrequency: 'Monthly Interest',
    interestRate: 10.5,
    investors: 0,
    fundsRaised: 30000000,
    targetAmount: 45000000,
    issueDate: '1/1/2024',
    maturityDate: '1/1/2029',
    faceValue: 1000,
    minInvestment: 20000,
    releaseDate: '1/1/2024',
    lockInPeriod: 12
  },
  {
    id: 4,
    name: 'Series D',
    status: 'active',
    interestFrequency: 'Monthly Interest',
    interestRate: 11,
    investors: 0,
    fundsRaised: 20000000,
    targetAmount: 40000000,
    issueDate: '15/3/2024',
    maturityDate: '15/3/2029',
    faceValue: 1000,
    minInvestment: 25000,
    releaseDate: '15/3/2024',
    lockInPeriod: 18
  },
  {
    id: 5,
    name: 'Series E',
    status: 'active',
    interestFrequency: 'Monthly Interest',
    interestRate: 11.5,
    investors: 0,
    fundsRaised: 15000000,
    targetAmount: 35000000,
    issueDate: '15/5/2024',
    maturityDate: '15/5/2029',
    faceValue: 1000,
    minInvestment: 30000,
    releaseDate: '15/5/2024',
    lockInPeriod: 36
  },
  {
    id: 6,
    name: 'Series AB',
    status: 'active',
    interestFrequency: 'Monthly Interest',
    interestRate: 9.0,
    investors: 0,
    fundsRaised: 25000000,
    targetAmount: 60000000,
    issueDate: '1/12/2024',
    maturityDate: '1/12/2029',
    faceValue: 1000,
    minInvestment: 15000,
    releaseDate: '1/12/2024',
    lockInPeriod: 18
  }
];

// Save fresh data to localStorage
localStorage.setItem('series', JSON.stringify(freshSeriesData));

console.log('✅ Reset series data with monthly interest frequency');
console.log('📊 Updated series:', freshSeriesData.map(s => `${s.name}: ${s.interestFrequency}`));

// Refresh the page to load new data
console.log('🔄 Please refresh the page to see the changes');
console.log('💡 All series now have Monthly Interest frequency');