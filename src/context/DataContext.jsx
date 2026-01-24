import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

// Initial dummy data - Start with some sample complaints for testing metrics
const initialComplaints = [
  {
    id: 1,
    investorId: 'ABCDE1234F', // Rajesh Kumar
    investorName: 'Rajesh Kumar',
    subject: 'Interest payment delay',
    description: 'Interest payment for Series A was delayed by 3 days',
    issue: 'Interest payment delay', // Add for compatibility
    remarks: 'Interest payment for Series A was delayed by 3 days', // Add for compatibility
    status: 'resolved',
    grievanceType: 'investor',
    seriesName: 'Series A', // Specific series for this complaint
    timestamp: '15/11/2024, 10:30:00 AM',
    isCompleted: true,
    resolutionComment: 'Interest payment has been processed and credited to your account. We apologize for the delay.',
    resolvedAt: '2024-11-16T14:30:00.000Z'
  },
  {
    id: 2,
    investorId: 'ABCDE1234F', // Rajesh Kumar - 2nd complaint
    investorName: 'Rajesh Kumar',
    subject: 'Document verification issue',
    description: 'KYC documents were not processed on time',
    issue: 'Document verification issue', // Add for compatibility
    remarks: 'KYC documents were not processed on time', // Add for compatibility
    status: 'resolved',
    grievanceType: 'investor',
    seriesName: 'Series B', // Different series for this complaint
    timestamp: '20/11/2024, 02:15:00 PM',
    isCompleted: true,
    resolutionComment: 'KYC documents have been verified and approved. Your account is now fully activated.',
    resolvedAt: '2024-11-21T11:45:00.000Z'
  },
  {
    id: 3,
    investorId: 'ABCDE1234F', // Rajesh Kumar - 3rd complaint (triggers churn)
    investorName: 'Rajesh Kumar',
    subject: 'Series performance concern',
    description: 'Concerned about Series A performance and want to exit early',
    issue: 'Series performance concern', // Add for compatibility
    remarks: 'Concerned about Series A performance and want to exit early', // Add for compatibility
    status: 'pending',
    grievanceType: 'investor',
    seriesName: 'Series A', // Specific series for this complaint
    timestamp: '22/12/2024, 09:45:00 AM',
    isCompleted: false,
    resolutionComment: 'We are reviewing your concern about Series A performance. Our investment team is preparing a detailed report on the series performance metrics.'
  },
  {
    id: 4,
    investorId: 'BCDEF2345G', // Priya Sharma
    investorName: 'Priya Sharma',
    subject: 'Interest calculation query',
    description: 'Query about interest calculation method',
    issue: 'Interest calculation query', // Add for compatibility
    remarks: 'Query about interest calculation method', // Add for compatibility
    status: 'in-progress',
    grievanceType: 'investor',
    seriesName: 'Series B', // Specific series for this complaint
    timestamp: '10/12/2024, 11:20:00 AM',
    isCompleted: false,
    resolutionComment: 'We have forwarded your query to our finance team. They will provide a detailed explanation of the interest calculation methodology within 2 business days.'
  }
];

const initialInvestors = [
  {
    id: 1,
    name: 'Rajesh Kumar',
    investorId: 'ABCDE1234F',
    email: 'rajesh.kumar@email.com',
    phone: '+91 98765 43210',
    series: ['Series A', 'Series B'],
    investment: 1500000,
    investments: [
      { seriesName: 'Series A', amount: 750000, date: '15/6/2023', timestamp: new Date('2023-06-15').toISOString() },
      { seriesName: 'Series B', amount: 750000, date: '20/9/2023', timestamp: new Date('2023-09-20').toISOString() }
    ],
    kycStatus: 'Completed',
    dateJoined: '15/6/2023',
    bankAccountNumber: '1234567890123456',
    ifscCode: 'SBIN0001234',
    bankName: 'State Bank of India'
  },
  {
    id: 2,
    name: 'Priya Sharma',
    investorId: 'BCDEF2345G',
    email: 'priya.sharma@email.com',
    phone: '+91 98765 43211',
    series: ['Series B'],
    investment: 1000000,
    investments: [
      { seriesName: 'Series B', amount: 1000000, date: '20/9/2023', timestamp: new Date('2023-09-20').toISOString() }
    ],
    kycStatus: 'Pending',
    dateJoined: '20/9/2023',
    bankAccountNumber: '9876543210987654',
    ifscCode: 'HDFC0001234',
    bankName: 'HDFC Bank'
  },
  {
    id: 3,
    name: 'Amit Patel',
    investorId: 'CDEFG3456H',
    email: 'amit.patel@email.com',
    phone: '+91 98765 43212',
    series: ['Series A'],
    investment: 750000,
    investments: [
      { seriesName: 'Series A', amount: 750000, date: '10/7/2023', timestamp: new Date('2023-07-10').toISOString() }
    ],
    kycStatus: 'Completed',
    dateJoined: '10/7/2023',
    bankAccountNumber: '5678901234567890',
    ifscCode: 'ICIC0001234',
    bankName: 'ICICI Bank'
  },
  {
    id: 4,
    name: 'Sneha Reddy',
    investorId: 'DEFGH4567I',
    email: 'sneha.reddy@email.com',
    phone: '+91 98765 43213',
    series: ['Series C'],
    investment: 1500000,
    investments: [
      { seriesName: 'Series C', amount: 1500000, date: '5/1/2024', timestamp: new Date('2024-01-05').toISOString() }
    ],
    kycStatus: 'Pending',
    dateJoined: '5/1/2024',
    bankAccountNumber: '3456789012345678',
    ifscCode: 'AXIS0001234',
    bankName: 'Axis Bank'
  },
  {
    id: 5,
    name: 'Vikram Singh',
    investorId: 'EFGHI5678J',
    email: 'vikram.singh@email.com',
    phone: '+91 98765 43215',
    series: ['Series A', 'Series B', 'Series C', 'Series D' , 'Series E'],
    investment: 3500000,
    investments: [
      { seriesName: 'Series A', amount: 700000, date: '1/6/2023', timestamp: new Date('2023-06-01').toISOString() },
      { seriesName: 'Series B', amount: 700000, date: '15/9/2023', timestamp: new Date('2023-09-15').toISOString() },
      { seriesName: 'Series C', amount: 700000, date: '1/1/2024', timestamp: new Date('2024-01-01').toISOString() },
      { seriesName: 'Series D', amount: 700000, date: '1/3/2024', timestamp: new Date('2024-03-01').toISOString() },
      { seriesName: 'Series E', amount: 700000, date: '15/5/2024', timestamp: new Date('2024-05-15').toISOString() }
    ],
    kycStatus: 'Completed',
    dateJoined: '1/6/2023',
    bankAccountNumber: '7890123456789012',
    ifscCode: 'SBIN0005678',
    bankName: 'State Bank of India'
  },
  {
    id: 6,
    name: 'Anjali Verma',
    investorId: 'FGHIJ6789K',
    email: 'anjali.verma@email.com',
    phone: '+91 98765 43215',
    series: ['Series B'],
    investment: 800000,
    investments: [
      { seriesName: 'Series B', amount: 800000, date: '15/10/2023', timestamp: new Date('2023-10-15').toISOString() }
    ],
    kycStatus: 'Rejected',
    dateJoined: '15/10/2023',
    bankAccountNumber: '2345678901234567',
    ifscCode: 'HDFC0005678',
    bankName: 'HDFC Bank'
  },
  {
    id: 7,
    name: 'Rohit Gupta',
    investorId: 'GHIJK7890L',
    email: 'rohit.gupta@email.com',
    phone: '+91 98765 43216',
    series: ['Series D'],
    investment: 2000000,
    investments: [
      { seriesName: 'Series D', amount: 2000000, date: '10/3/2024', timestamp: new Date('2024-03-10').toISOString() }
    ],
    kycStatus: 'Completed',
    dateJoined: '10/3/2024',
    bankAccountNumber: '6789012345678901',
    ifscCode: 'ICIC0005678',
    bankName: 'ICICI Bank'
  },
  {
    id: 8,
    name: 'Kavya Nair',
    investorId: 'HIJKL8901M',
    email: 'kavya.nair@email.com',
    phone: '+91 98765 43217',
    series: ['Series E'],
    investment: 1200000,
    investments: [
      { seriesName: 'Series E', amount: 1200000, date: '15/11/2024', timestamp: new Date('2024-11-15').toISOString() } // Recent investment for early redemption testing
    ],
    kycStatus: 'Pending',
    dateJoined: '15/11/2024', // Updated to match recent investment
    bankAccountNumber: '4567890123456789',
    ifscCode: 'AXIS0005678',
    bankName: 'Axis Bank'
  },
  {
    id: 9,
    name: 'Dwarampudi Sowmith Reddy',
    investorId: 'IJKLM9012N',
    email: 'dsowmithreddy@gmail.com',
    phone: '+91 90637 61569',
    series: ['Series AB'],
    investment: 500000,
    investments: [
      { seriesName: 'Series AB', amount: 500000, date: '1/12/2024', timestamp: new Date('2024-12-01').toISOString() }
    ],
    kycStatus: 'Completed',
    dateJoined: '1/12/2024',
    bankAccountNumber: '9876543210123456',
    ifscCode: 'SBIN0001234',
    bankName: 'State Bank of India'
  }
];

const initialSeries = [
  {
    id: 1,
    name: 'Series A',
    seriesCode: 'NCD-A-2023',
    status: 'active',
    interestFrequency: 'Non-cumulative & Monthly',
    interestRate: 9.5,
    investors: 0, // Will be calculated from actual investor data
    fundsRaised: 35000000,
    targetAmount: 50000000,
    issueDate: '1/6/2023',
    maturityDate: '1/8/2026',
    faceValue: 1000,
    minInvestment: 10000,
    releaseDate: '1/6/2023',
    lockInPeriod: '15/1/2025', // Lock-in ends January 2025 (coming up in <3 months)
    debentureTrustee: 'IDBI Trusteeship Services Ltd',
    investorsSize: 500
  },
  {
    id: 2,
    name: 'Series B',
    seriesCode: 'NCD-B-2023',
    status: 'active',
    interestFrequency: 'Non-cumulative & Monthly',
    interestRate: 10,
    investors: 0, // Will be calculated from actual investor data
    fundsRaised: 62000000,
    targetAmount: 80000000,
    issueDate: '15/9/2023',
    maturityDate: '15/9/2026',
    faceValue: 1000,
    minInvestment: 25000,
    releaseDate: '15/9/2023',
    lockInPeriod: '15/3/2025', // Lock-in ends March 2025 (coming up in <3 months)
    debentureTrustee: 'Catalyst Trusteeship Ltd',
    investorsSize: 800
  },
  {
    id: 3,
    name: 'Series C',
    seriesCode: 'NCD-C-2024',
    status: 'active',
    interestFrequency: 'Non-cumulative & Monthly',
    interestRate: 10.5,
    investors: 0, // Will be calculated from actual investor data
    fundsRaised: 28000000,
    targetAmount: 100000000,
    issueDate: '1/1/2024',
    maturityDate: '1/2/2026',
    faceValue: 1000,
    minInvestment: 50000,
    releaseDate: '1/1/2024',
    lockInPeriod: '15/4/2025', // Lock-in ends April 2025 (coming up in 3-6 months)
    debentureTrustee: 'Axis Trustee Services Ltd',
    investorsSize: 1000
  },
  {
    id: 4,
    name: 'Series D',
    seriesCode: 'NCD-D-2024',
    status: 'active',
    interestFrequency: 'Non-cumulative & Monthly',
    interestRate: 11,
    investors: 0, // Will be calculated from actual investor data
    fundsRaised: 45000000,
    targetAmount: 150000000,
    issueDate: '1/3/2024',
    maturityDate: '1/3/2029',
    faceValue: 1000,
    minInvestment: 100000,
    releaseDate: '1/3/2024',
    lockInPeriod: '15/8/2025', // Lock-in ends August 2025 (coming up in 6-12 months)
    debentureTrustee: 'SBICAP Trustee Company Ltd',
    investorsSize: 1500
  },
  {
    id: 5,
    name: 'Series E',
    seriesCode: 'NCD-E-2024',
    status: 'active',
    interestFrequency: 'Non-cumulative & Monthly',
    interestRate: 11.5,
    investors: 0, // Will be calculated from actual investor data
    fundsRaised: 32000000,
    targetAmount: 120000000,
    issueDate: '15/5/2024',
    maturityDate: '15/5/2029',
    faceValue: 1000,
    minInvestment: 75000,
    releaseDate: '15/5/2024',
    lockInPeriod: '15/7/2025', // Lock-in ends July 2025 (coming up in 6-12 months)
    debentureTrustee: 'Vistra ITCL (India) Ltd',
    investorsSize: 1200
  },
  {
    id: 6,
    name: 'Series AB',
    seriesCode: 'NCD-AB-2024',
    status: 'active',
    interestFrequency: 'Non-cumulative & Monthly',
    interestRate: 9.0,
    investors: 0, // Will be calculated from actual investor data
    fundsRaised: 25000000,
    targetAmount: 60000000,
    issueDate: '1/12/2024',
    maturityDate: '1/12/2029',
    faceValue: 1000,
    minInvestment: 15000,
    releaseDate: '1/12/2024',
    lockInPeriod: '15/6/2025', // Lock-in ends June 2025 (coming up in 3-6 months)
    debentureTrustee: 'IDBI Trusteeship Services Ltd',
    investorsSize: 600
  }
];

export const DataProvider = ({ children }) => {
  // Data validation and consistency check
  const validateAndFixData = () => {
    try {
      // Check if essential data exists and is valid
      const savedInvestors = localStorage.getItem('investors');
      const savedSeries = localStorage.getItem('series');
      const savedComplaints = localStorage.getItem('complaints');
      const dataVersion = localStorage.getItem('dataVersion');

      // Only reset if data is corrupted or missing, not on every load
      if (!savedInvestors || !savedSeries || !savedComplaints) {
        console.log('🔄 Missing data detected - Initializing with default data');
        localStorage.setItem('dataVersion', '2.1.0');
        if (!savedInvestors) localStorage.setItem('investors', JSON.stringify(initialInvestors));
        if (!savedSeries) localStorage.setItem('series', JSON.stringify(initialSeries));
        if (!savedComplaints) localStorage.setItem('complaints', JSON.stringify(initialComplaints));
        console.log('✅ Missing data initialized');
        return;
      }

      // Validate data integrity
      try {
        const investors = JSON.parse(savedInvestors);
        const series = JSON.parse(savedSeries);
        const complaints = JSON.parse(savedComplaints);
        
        if (!Array.isArray(investors) || !Array.isArray(series) || !Array.isArray(complaints)) {
          throw new Error('Data format invalid');
        }
        
        console.log('✅ Data validation passed - Using existing data');
      } catch (parseError) {
        console.log('🔄 Data corruption detected - Resetting corrupted data');
        localStorage.setItem('dataVersion', '2.1.0');
        localStorage.setItem('investors', JSON.stringify(initialInvestors));
        localStorage.setItem('series', JSON.stringify(initialSeries));
        localStorage.setItem('complaints', JSON.stringify(initialComplaints));
        console.log('✅ Corrupted data reset complete');
      }
      
      let investorsValid = true;
      let seriesValid = true;
      
      // Validate investors data
      if (savedInvestors) {
        try {
          const parsedInvestors = JSON.parse(savedInvestors);
          if (!Array.isArray(parsedInvestors) || parsedInvestors.length === 0) {
            investorsValid = false;
          } else {
            // Check if essential investors exist
            const hasRajeshKumar = parsedInvestors.some(inv => inv.investorId === 'ABCDE1234F');
            const hasSowmithReddy = parsedInvestors.some(inv => inv.name === 'Dwarampudi Sowmith Reddy');
            if (!hasRajeshKumar || !hasSowmithReddy) {
              investorsValid = false;
            }
          }
        } catch (e) {
          investorsValid = false;
        }
      } else {
        investorsValid = false;
      }
      
      // Validate series data
      if (savedSeries) {
        try {
          const parsedSeries = JSON.parse(savedSeries);
          if (!Array.isArray(parsedSeries) || parsedSeries.length === 0) {
            seriesValid = false;
          } else {
            // Check if essential series exist
            const hasSeriesAB = parsedSeries.some(s => s.name === 'Series AB');
            const hasSeriesA = parsedSeries.some(s => s.name === 'Series A');
            const hasSeriesZ = parsedSeries.some(s => s.name === 'Series Z'); // Should NOT exist
            if (!hasSeriesAB || !hasSeriesA || hasSeriesZ) {
              seriesValid = false;
            }
          }
        } catch (e) {
          seriesValid = false;
        }
      } else {
        seriesValid = false;
      }
      
      // Reset data if validation fails
      if (!investorsValid) {
        console.log('🔄 Resetting investors data to ensure consistency');
        localStorage.setItem('investors', JSON.stringify(initialInvestors));
      }
      
      if (!seriesValid) {
        console.log('🔄 Resetting series data to ensure consistency');
        localStorage.setItem('series', JSON.stringify(initialSeries));
      }
      
      // Set data version if not set
      if (!dataVersion) {
        localStorage.setItem('dataVersion', '2.1.0');
      }
      
      // Log data validation result
      if (investorsValid && seriesValid) {
        console.log('✅ Data validation passed - all essential data is present');
      } else {
        console.log('⚠️ Data validation failed - reset to initial state');
      }
      
    } catch (error) {
      console.error('❌ Data validation error:', error);
      // Only reset specific data that's corrupted, preserve user session
      console.log('🔄 Resetting only corrupted data, preserving user session');
      localStorage.setItem('dataVersion', '2.1.0');
      localStorage.setItem('investors', JSON.stringify(initialInvestors));
      localStorage.setItem('series', JSON.stringify(initialSeries));
      localStorage.setItem('complaints', JSON.stringify(initialComplaints));
      console.log('✅ Data reset complete - User session preserved');
    }
  };

  // Run data validation on component mount
  validateAndFixData();

  // Data consistency ensured - Series AB and essential investors are maintained

  const [investors, setInvestors] = useState(() => {
    const saved = localStorage.getItem('investors');
    if (saved) {
      const parsedInvestors = JSON.parse(saved);
      
      console.log('🔍 Loading investors from localStorage:', parsedInvestors.length, 'investors');
      parsedInvestors.forEach(inv => {
        console.log(`🔍 Investor ${inv.name}: series =`, inv.series);
      });
      
      // Clean up investor data and migrate 'Verified' to 'Completed'
      const cleanedInvestors = parsedInvestors.map(inv => {
        const cleaned = { ...inv };
        
        // Migrate KYC status from 'Verified' to 'Completed'
        if (cleaned.kycStatus === 'Verified') {
          cleaned.kycStatus = 'Completed';
        }
        
        // Migrate KYC documents status from 'Verified' to 'Completed'
        if (cleaned.kycDocuments && Array.isArray(cleaned.kycDocuments)) {
          cleaned.kycDocuments = cleaned.kycDocuments.map(doc => ({
            ...doc,
            status: doc.status === 'Verified' ? 'Completed' : doc.status
          }));
        }
        
        // Ensure series is an array
        if (!Array.isArray(cleaned.series)) {
          cleaned.series = [];
        }
        
        // Filter out invalid series entries (emails, non-series strings)
        const validSeries = cleaned.series.filter(s => 
          s && typeof s === 'string' && s.startsWith('Series')
        );
        cleaned.series = validSeries;
        
        // If investor has investment amount but no valid series, reset investment to 0
        if (cleaned.investment > 0 && cleaned.series.length === 0) {
          cleaned.investment = 0;
        }
        
        // Migration: Add investments array if it doesn't exist
        if (!cleaned.investments || !Array.isArray(cleaned.investments)) {
          // Create investments array from existing data
          cleaned.investments = cleaned.series.map(seriesName => ({
            seriesName: seriesName,
            amount: cleaned.series.length > 0 ? Math.round(cleaned.investment / cleaned.series.length) : 0,
            date: cleaned.dateJoined || new Date().toLocaleDateString('en-GB'),
            timestamp: new Date().toISOString()
          }));
        }
        
        console.log(`🔍 Cleaned investor ${cleaned.name}: series =`, cleaned.series);
        return cleaned;
      });
      
      // Save the migrated data back to localStorage
      localStorage.setItem('investors', JSON.stringify(cleanedInvestors));
      
      return cleanedInvestors;
    }
    console.log('🔍 No saved investors found, using initial data');
    return initialInvestors;
  });

  const [series, setSeries] = useState(() => {
    const savedSeries = localStorage.getItem('series');
    const savedInvestors = localStorage.getItem('investors');
    
    // Load all series from localStorage (no filtering)
    let parsedSeries = savedSeries ? JSON.parse(savedSeries) : initialSeries;
    
    // DEBUG: Log the first series to check if fields exist
    if (parsedSeries.length > 0) {
      console.log('🔍 DEBUG - First series data:', {
        name: parsedSeries[0].name,
        seriesCode: parsedSeries[0].seriesCode,
        debentureTrustee: parsedSeries[0].debentureTrustee
      });
    }
    
    // ALWAYS RECALCULATE: Always recalculate series data based on actual investor investments (excluding deleted investors)
    if (savedInvestors) {
      const parsedInvestors = JSON.parse(savedInvestors);
      
      parsedSeries = parsedSeries.map(s => {
        // Find all ACTIVE investors in this series (exclude deleted investors)
        const investorsInSeries = parsedInvestors.filter(inv => 
          inv.series && Array.isArray(inv.series) && inv.series.includes(s.name) &&
          inv.status !== 'deleted' // Exclude deleted investors
        );
        
        // Calculate total funds from investments array (per-series tracking, only active investors)
        const totalFundsFromInvestors = investorsInSeries.reduce((sum, inv) => {
          if (inv.investments && Array.isArray(inv.investments)) {
            const seriesInvestment = inv.investments.find(investment => investment.seriesName === s.name);
            return sum + (seriesInvestment ? seriesInvestment.amount : 0);
          }
          // Fallback to old calculation if investments array doesn't exist
          const investmentPerSeries = inv.series.length > 0 ? inv.investment / inv.series.length : 0;
          return sum + investmentPerSeries;
        }, 0);
        
        // For initial series (1-5), add the new investments to the base amount
        const isInitialSeries = s.id <= 5;
        const baseFunds = isInitialSeries ? (initialSeries.find(init => init.id === s.id)?.fundsRaised || 0) : 0;
        
        const calculatedInvestors = investorsInSeries.length;
        const calculatedFunds = baseFunds + Math.round(totalFundsFromInvestors);
        
        // Only log if there's a significant change to avoid spam
        if (Math.abs(s.investors - calculatedInvestors) > 0 || Math.abs(s.fundsRaised - calculatedFunds) > 1000) {
          console.log(`📊 ${s.name}: ${calculatedInvestors} investors (was ${s.investors}), ₹${calculatedFunds.toLocaleString()} funds (was ₹${s.fundsRaised.toLocaleString()})`);
        }
        
        return {
          ...s,
          investors: calculatedInvestors, // Only count active investors
          fundsRaised: calculatedFunds, // Only funds from active investors
          lastUpdated: new Date().toISOString() // Add timestamp for change detection
        };
      });
      
      // Save the recalculated series back to localStorage
      localStorage.setItem('series', JSON.stringify(parsedSeries));
    }
    
    return parsedSeries;
  });

  // Add a series refresh trigger
  const [seriesRefreshTrigger, setSeriesRefreshTrigger] = useState(0);

  const [complaints, setComplaints] = useState(() => {
    const saved = localStorage.getItem('complaints');
    return saved ? JSON.parse(saved) : initialComplaints;
  });

  // Audit Log State
  const [auditLogs, setAuditLogs] = useState(() => {
    const saved = localStorage.getItem('auditLogs');
    return saved ? JSON.parse(saved) : [];
  });

  // Investor Satisfaction Tracking State
  const [satisfactionEvents, setSatisfactionEvents] = useState(() => {
    const saved = localStorage.getItem('satisfactionEvents');
    return saved ? JSON.parse(saved) : {
      churnEvents: [], // Investors who deleted their accounts completely
      earlyRedemptionEvents: [] // Investors who exited series before maturity
    };
  });

  useEffect(() => {
    localStorage.setItem('investors', JSON.stringify(investors));
  }, [investors]);

  useEffect(() => {
    localStorage.setItem('series', JSON.stringify(series));
  }, [series]);

  useEffect(() => {
    localStorage.setItem('auditLogs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('satisfactionEvents', JSON.stringify(satisfactionEvents));
  }, [satisfactionEvents]);

  useEffect(() => {
    localStorage.setItem('complaints', JSON.stringify(complaints));
  }, [complaints]);

  const addSeries = (newSeries) => {
    // Check for duplicate series name
    const duplicateName = series.find(s => s.name.toLowerCase() === newSeries.name.toLowerCase());
    if (duplicateName) {
      alert(`A series with the name "${newSeries.name}" already exists. Please use a different name.`);
      return false;
    }
    
    const seriesToAdd = {
      ...newSeries,
      id: series.length + 1,
      investors: 0,
      fundsRaised: 0,
      status: 'DRAFT', // Always start in DRAFT state
      approvalStatus: 'pending' // New field for approval tracking
    };
    setSeries([...series, seriesToAdd]);
    
    // Initialize compliance status for the new series (all zeros)
    const newSeriesName = `${seriesToAdd.name} NCD`;
    setComplianceStatus(prev => ({
      ...prev,
      [newSeriesName]: { pre: 0, post: 0, recurring: 0 }
    }));
    
    return true;
  };

  const updateSeries = (id, updates) => {
    const oldSeries = series.find(s => s.id === id);
    const newSeries = { ...oldSeries, ...updates };
    
    // If series name is changing, update all investor records
    if (oldSeries && updates.name && oldSeries.name !== updates.name) {
      const updatedInvestors = investors.map(inv => {
        if (inv.series && inv.series.includes(oldSeries.name)) {
          return {
            ...inv,
            series: inv.series.map(s => s === oldSeries.name ? updates.name : s),
            investments: inv.investments ? inv.investments.map(investment => 
              investment.seriesName === oldSeries.name 
                ? { ...investment, seriesName: updates.name }
                : investment
            ) : []
          };
        }
        return inv;
      });
      setInvestors(updatedInvestors);
    }
    
    setSeries(series.map(s => s.id === id ? newSeries : s));
  };

  const approveSeries = (id, approvedData) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Parse dates
    const parseDate = (dateStr) => {
      if (!dateStr) return null;
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        return new Date(parts[2], parts[1] - 1, parts[0]);
      }
      return null;
    };
    
    const subscriptionStartDate = parseDate(approvedData.subscriptionStartDate);
    const subscriptionEndDate = parseDate(approvedData.subscriptionEndDate);
    
    // Determine status based on subscription window
    let status = 'upcoming'; // Default to upcoming
    
    if (subscriptionStartDate && subscriptionEndDate) {
      if (today < subscriptionStartDate) {
        status = 'upcoming'; // Before subscription starts
      } else if (today >= subscriptionStartDate && today <= subscriptionEndDate) {
        status = 'accepting'; // Within subscription window
      } else if (today > subscriptionEndDate) {
        status = 'active'; // After subscription ends
      }
    } else {
      // Fallback to old logic if no subscription dates
      const issueDate = parseDate(approvedData.issueDate);
      if (issueDate && issueDate <= today) {
        status = 'active';
      } else {
        status = 'upcoming';
      }
    }
    
    setSeries(series.map(s => 
      s.id === id 
        ? { 
            ...s, 
            ...approvedData, 
            status: status,
            approvalStatus: 'approved',
            approvedAt: new Date().toISOString(),
            releaseDate: approvedData.issueDate // Use issue date as release date
          } 
        : s
    ));
  };

  const deleteSeries = (seriesId) => {
    // Allow deletion of DRAFT and UPCOMING series, but not ACTIVE series
    const seriesToDelete = series.find(s => s.id === seriesId);
    if (seriesToDelete && (seriesToDelete.status === 'DRAFT' || seriesToDelete.status === 'upcoming')) {
      // Remove series from all investor records
      const updatedInvestors = investors.map(inv => {
        if (inv.series && inv.series.includes(seriesToDelete.name)) {
          const newSeries = inv.series.filter(s => s !== seriesToDelete.name);
          const newInvestments = inv.investments ? inv.investments.filter(i => i.seriesName !== seriesToDelete.name) : [];
          const newInvestment = newInvestments.reduce((sum, i) => sum + i.amount, 0);
          
          return {
            ...inv,
            series: newSeries,
            investments: newInvestments,
            investment: newInvestment
          };
        }
        return inv;
      });
      setInvestors(updatedInvestors);
      setSeries(series.filter(s => s.id !== seriesId));
      return true;
    }
    return false;
  };

  const rejectSeries = (id, rejectionReason) => {
    setSeries(series.map(s => 
      s.id === id 
        ? { 
            ...s, 
            status: 'REJECTED',
            approvalStatus: 'rejected',
            rejectedAt: new Date().toISOString(),
            rejectionReason: rejectionReason || 'No reason provided'
          } 
        : s
    ));
    return true;
  };

  // Force complete recalculation of all series metrics
  const forceRecalculateAllSeries = useCallback(() => {
    console.log('🔄 FORCING COMPLETE SERIES RECALCULATION');
    
    setSeries(currentSeries => {
      const recalculatedSeries = currentSeries.map(s => {
        // Find all ACTIVE investors in this series (exclude deleted investors)
        const investorsInSeries = investors.filter(inv => 
          inv.series && Array.isArray(inv.series) && inv.series.includes(s.name) &&
          inv.status !== 'deleted' // Exclude deleted investors
        );
        
        // Calculate total funds from investments array (only from active investors)
        const totalFundsFromInvestors = investorsInSeries.reduce((sum, inv) => {
          if (inv.investments && Array.isArray(inv.investments)) {
            const seriesInvestment = inv.investments.find(investment => investment.seriesName === s.name);
            return sum + (seriesInvestment ? seriesInvestment.amount : 0);
          }
          return sum;
        }, 0);
        
        // For initial series (1-5), add the new investments to the base amount
        const isInitialSeries = s.id <= 5;
        const baseFunds = isInitialSeries ? (initialSeries.find(init => init.id === s.id)?.fundsRaised || 0) : 0;
        
        const newInvestorCount = investorsInSeries.length;
        const newFundsRaised = baseFunds + Math.round(totalFundsFromInvestors);
        
        console.log(`📊 ${s.name}: ${newInvestorCount} investors (was ${s.investors}), ₹${newFundsRaised.toLocaleString()} funds (was ₹${s.fundsRaised.toLocaleString()})`);
        
        return {
          ...s,
          investors: newInvestorCount,
          fundsRaised: newFundsRaised
        };
      });
      
      // Save to localStorage
      localStorage.setItem('series', JSON.stringify(recalculatedSeries));
      console.log('✅ Series recalculation complete');
      
      return recalculatedSeries;
    });
  }, [investors]); // Only depend on investors, not series

  // Recalculate series metrics based on actual investor data (excluding deleted investors)
  const recalculateSeriesMetrics = (seriesName = null) => {
    console.log(`🔄 Recalculating series metrics${seriesName ? ` for ${seriesName}` : ' for all series'}`);
    
    setSeries(currentSeries => {
      const updatedSeries = currentSeries.map(s => {
        // If seriesName is provided, only recalculate that series
        if (seriesName && s.name !== seriesName) {
          return s;
        }
        
        // Get the most current investor data from localStorage to ensure we have the latest
        const currentInvestors = JSON.parse(localStorage.getItem('investors') || '[]');
        console.log(`🔍 Found ${currentInvestors.length} investors in localStorage for ${s.name}`);
        
        // Find all ACTIVE investors in this series (exclude deleted investors)
        const investorsInSeries = currentInvestors.filter(inv => 
          inv.series && Array.isArray(inv.series) && inv.series.includes(s.name) &&
          inv.status !== 'deleted' // Exclude deleted investors
        );
        
        console.log(`🔍 Found ${investorsInSeries.length} investors in ${s.name}:`, investorsInSeries.map(inv => inv.name));
        
        // Calculate total funds from investments array (only from active investors)
        const totalFundsFromInvestors = investorsInSeries.reduce((sum, inv) => {
          if (inv.investments && Array.isArray(inv.investments)) {
            const seriesInvestment = inv.investments.find(investment => investment.seriesName === s.name);
            const amount = seriesInvestment ? seriesInvestment.amount : 0;
            console.log(`🔍 ${inv.name} invested ₹${amount.toLocaleString()} in ${s.name}`);
            return sum + amount;
          }
          return sum;
        }, 0);
        
        console.log(`🔍 Total funds from investors in ${s.name}: ₹${totalFundsFromInvestors.toLocaleString()}`);
        
        // For initial series (1-5), add the new investments to the base amount
        const isInitialSeries = s.id <= 5;
        const baseFunds = isInitialSeries ? (initialSeries.find(init => init.id === s.id)?.fundsRaised || 0) : 0;
        
        const newInvestorCount = investorsInSeries.length;
        const newFundsRaised = baseFunds + Math.round(totalFundsFromInvestors);
        
        // Always log changes for debugging
        console.log(`📊 ${s.name}: ${newInvestorCount} investors (was ${s.investors}), ₹${newFundsRaised.toLocaleString()} funds (was ₹${s.fundsRaised.toLocaleString()})`);
        
        return {
          ...s,
          investors: newInvestorCount, // Only count active investors
          fundsRaised: newFundsRaised, // Only funds from active investors
          lastUpdated: new Date().toISOString() // Force React to detect change
        };
      });
      
      // Save updated series to localStorage immediately
      localStorage.setItem('series', JSON.stringify(updatedSeries));
      console.log('✅ Series metrics recalculated and saved');
      
      return updatedSeries;
    });
  };

  // Function to check and update series status based on issue date
  const checkAndUpdateSeriesStatus = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    setSeries(currentSeries => 
      currentSeries.map(s => {
        if (s.status === 'upcoming' && s.issueDate) {
          const parseDate = (dateStr) => {
            const parts = dateStr.split('/');
            if (parts.length === 3) {
              return new Date(parts[2], parts[1] - 1, parts[0]);
            }
            return null;
          };
          
          const issueDate = parseDate(s.issueDate);
          if (issueDate && issueDate <= today) {
            return { ...s, status: 'active' };
          }
        }
        return s;
      })
    );
  };

  // Check series status on component mount and set up daily check
  useEffect(() => {
    checkAndUpdateSeriesStatus();
    
    // Set up interval to check daily at midnight
    const checkInterval = setInterval(() => {
      checkAndUpdateSeriesStatus();
    }, 24 * 60 * 60 * 1000); // Check every 24 hours
    
    return () => clearInterval(checkInterval);
  }, []);

  // Series recalculation is now handled directly in updateInvestor for immediate updates

  const addInvestor = (newInvestor) => {
    // Check for duplicate investor ID
    const duplicateId = investors.find(inv => inv.investorId.toLowerCase() === newInvestor.investorId.toLowerCase());
    if (duplicateId) {
      alert(`An investor with ID "${newInvestor.investorId}" already exists. Please use a different ID.`);
      return false;
    }
    
    setInvestors([...investors, { ...newInvestor, id: investors.length + 1 }]);
    
    // Recalculate metrics for affected series
    if (newInvestor.series && Array.isArray(newInvestor.series)) {
      newInvestor.series.forEach(seriesName => {
        setTimeout(() => recalculateSeriesMetrics(seriesName), 100);
      });
    }
    
    return true;
  };

  const updateInvestor = (id, updates) => {
    console.log('🔄 updateInvestor called with:', { id, updates });
    
    // Find the investor being updated
    const targetInvestor = investors.find(inv => inv.id === id);
    if (!targetInvestor) {
      console.error('❌ Investor not found with id:', id);
      return;
    }
    
    console.log('📋 Current investor data:', targetInvestor);
    
    // Find and update investor
    const updatedInvestors = investors.map(inv => 
      inv.id === id ? { ...inv, ...updates } : inv
    );
    
    const updatedInvestor = updatedInvestors.find(inv => inv.id === id);
    console.log('📋 Updated investor data:', updatedInvestor);
    
    // Update state and localStorage immediately
    setInvestors(updatedInvestors);
    localStorage.setItem('investors', JSON.stringify(updatedInvestors));
    console.log('✅ Investors state and localStorage updated');
    
    // Update series immediately with detailed logging
    const updatedSeries = series.map(s => {
      // Find investors in this series from the updated data
      const investorsInSeries = updatedInvestors.filter(inv => 
        inv.series && inv.series.includes(s.name)
      );
      
      console.log(`📊 ${s.name}: Found ${investorsInSeries.length} investors`);
      
      // Calculate total funds
      let totalFunds = 0;
      investorsInSeries.forEach(inv => {
        if (inv.investments) {
          inv.investments.forEach(investment => {
            if (investment.seriesName === s.name) {
              totalFunds += investment.amount;
              console.log(`💰 ${inv.name} invested ₹${investment.amount.toLocaleString()} in ${s.name}`);
            }
          });
        }
      });
      
      // Add base funds for initial series
      if (s.id <= 5) {
        const baseFunds = initialSeries.find(init => init.id === s.id)?.fundsRaised || 0;
        totalFunds += baseFunds;
        console.log(`💰 ${s.name}: Added base funds ₹${baseFunds.toLocaleString()}, total now ₹${totalFunds.toLocaleString()}`);
      }
      
      const oldFunds = s.fundsRaised;
      const oldInvestors = s.investors;
      
      console.log(`📊 ${s.name}: ${investorsInSeries.length} investors (was ${oldInvestors}), ₹${totalFunds.toLocaleString()} funds (was ₹${oldFunds.toLocaleString()})`);
      
      return {
        ...s,
        investors: investorsInSeries.length,
        fundsRaised: totalFunds,
        lastUpdated: new Date().toISOString() // Force React to detect change
      };
    });
    
    // Update series state and localStorage
    setSeries(updatedSeries);
    localStorage.setItem('series', JSON.stringify(updatedSeries));
    console.log('✅ Series state and localStorage updated');
    
    // Force a series refresh trigger to ensure all components re-render
    setSeriesRefreshTrigger(prev => prev + 1);
    console.log('✅ Series refresh trigger updated');
    
    // Dispatch custom event to refresh Dashboard metrics
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('dashboardRefresh'));
      console.log('📊 Dashboard refresh event dispatched');
    }, 100);
  };

  // Audit Log Function
  const addAuditLog = (logEntry) => {
    const newLog = {
      id: auditLogs.length + 1,
      timestamp: new Date().toISOString(),
      ...logEntry
    };
    setAuditLogs([newLog, ...auditLogs]); // Add to beginning (newest first)
  };

  // Investor Satisfaction Tracking Functions
  const trackChurnEvent = (investorData) => {
    const churnEvent = {
      id: Date.now(),
      investorId: investorData.investorId,
      investorName: investorData.name,
      timestamp: new Date().toISOString(),
      totalInvestment: investorData.investment || 0,
      seriesInvolved: investorData.series || [],
      reason: 'account_deletion'
    };
    
    setSatisfactionEvents(prev => ({
      ...prev,
      churnEvents: [...prev.churnEvents, churnEvent]
    }));
  };

  const trackEarlyRedemptionEvent = (investorData, seriesName, amount, penaltyAmount = 0) => {
    const redemptionEvent = {
      id: Date.now(),
      investorId: investorData.investorId,
      investorName: investorData.name,
      seriesName: seriesName,
      timestamp: new Date().toISOString(),
      amount: amount,
      penaltyAmount: penaltyAmount,
      reason: 'early_series_exit'
    };
    
    setSatisfactionEvents(prev => ({
      ...prev,
      earlyRedemptionEvents: [...prev.earlyRedemptionEvents, redemptionEvent]
    }));
  };

  const getSatisfactionMetrics = () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    // Count recent events (last 30 days)
    const recentChurnEvents = satisfactionEvents.churnEvents.filter(
      event => new Date(event.timestamp) >= thirtyDaysAgo
    );
    
    const recentEarlyRedemptionEvents = satisfactionEvents.earlyRedemptionEvents.filter(
      event => new Date(event.timestamp) >= thirtyDaysAgo
    );
    
    const totalInvestors = investors.length;
    const churnRequests = recentChurnEvents.length;
    const earlyRedemptionRequests = recentEarlyRedemptionEvents.length;
    
    // Calculate amounts
    const churnAmount = recentChurnEvents.reduce((sum, event) => sum + (event.totalInvestment || 0), 0);
    const earlyRedemptionAmount = recentEarlyRedemptionEvents.reduce((sum, event) => sum + (event.amount || 0), 0);
    
    // Calculate retention rate
    const totalNegativeEvents = churnRequests + earlyRedemptionRequests;
    const retentionRate = totalInvestors > 0 
      ? Math.max(0, Math.min(100, Math.round(((totalInvestors - totalNegativeEvents) / totalInvestors) * 100)))
      : 100;
    
    return {
      retentionRate,
      churnRequests,
      earlyRedemptionRequests,
      churnAmount,
      earlyRedemptionAmount
    };
  };

  // Complaint management functions
  const addComplaint = (newComplaint) => {
    const complaint = {
      ...newComplaint,
      id: complaints.length + 1,
      timestamp: new Date().toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }),
      status: 'pending',
      grievanceType: newComplaint.grievanceType || 'investor', // Default to investor
      isCompleted: false
    };
    setComplaints([complaint, ...complaints]);
    return complaint;
  };

  const updateComplaint = (id, updates) => {
    setComplaints(complaints.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const updateComplaintStatus = (id, status, resolutionComment = null) => {
    setComplaints(complaints.map(c => 
      c.id === id ? { 
        ...c, 
        status: status,
        isCompleted: status === 'resolved',
        resolutionComment: resolutionComment, // Save resolution comment for all statuses
        resolvedAt: status === 'resolved' ? new Date().toISOString() : null
      } : c
    ));
  };

  // Get complaints for specific investor
  const getInvestorComplaints = (investorId) => {
    return complaints.filter(complaint => complaint.investorId === investorId);
  };

  // Get all pending complaints
  const getPendingComplaints = () => {
    return complaints.filter(complaint => complaint.status === 'pending');
  };

  // Get complaints within date range
  const getComplaintsByDateRange = (fromDate, toDate) => {
    if (!fromDate && !toDate) return complaints;
    
    return complaints.filter(complaint => {
      const complaintDate = new Date(complaint.timestamp);
      const from = fromDate ? new Date(fromDate) : new Date('1900-01-01');
      const to = toDate ? new Date(toDate) : new Date();
      
      return complaintDate >= from && complaintDate <= to;
    });
  };

  // Calculate dashboard metrics
  const getTotalFundsRaised = () => {
    return series.reduce((sum, s) => sum + s.fundsRaised, 0);
  };

  const getTotalInvestors = () => {
    // Only count active investors (exclude deleted ones)
    return investors.filter(inv => inv.status !== 'deleted').length;
  };

  const getCurrentMonthPayout = () => {
    // Calculate based on active series and their interest rates
    let totalPayout = 0;
    series.filter(s => s.status === 'active').forEach(s => {
      const monthlyRate = s.interestRate / 100 / 12; // Always monthly
      totalPayout += s.fundsRaised * monthlyRate;
    });
    return totalPayout;
  };

  // Get Interest Payout Management data for Dashboard
  const getInterestPayoutStats = () => {
    // Load payout status updates from localStorage (same as Interest Payout page)
    const payoutStatusUpdates = JSON.parse(localStorage.getItem('payoutStatusUpdates') || '{}');
    const payoutMetadata = JSON.parse(localStorage.getItem('payoutMetadata') || '{}');
    
    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    const upcomingMonth = nextMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
    
    let totalInterestPaid = 0;
    let upcomingMonthPayout = 0;
    let totalPayouts = 0;
    let upcomingPayouts = 0;
    
    // Only calculate for active series
    const activeSeries = series.filter(s => s.status === 'active');
    
    activeSeries.forEach(s => {
      // Get investors for this series
      const seriesInvestors = investors.filter(inv => inv.series && inv.series.includes(s.name));
      
      seriesInvestors.forEach(investor => {
        // Calculate investment amount for this series
        const investmentPerSeries = investor.investment / investor.series.length;
        
        // Calculate monthly interest
        const interestAmount = (investmentPerSeries * s.interestRate) / 100 / 12;
        
        // Check for current month payout
        const currentPayoutKey = `${investor.investorId}-${s.name}-${currentMonth}`;
        const currentPayoutStatus = payoutStatusUpdates[currentPayoutKey] || 'Paid';
        
        if (currentPayoutStatus === 'Paid') {
          totalInterestPaid += Math.round(interestAmount);
        }
        totalPayouts++;
        
        // Check for upcoming month payout
        const upcomingPayoutKey = `${investor.investorId}-${s.name}-${upcomingMonth}`;
        const upcomingPayoutStatus = payoutStatusUpdates[upcomingPayoutKey] || 'Pending';
        
        upcomingMonthPayout += Math.round(interestAmount);
        upcomingPayouts++;
      });
    });
    
    return {
      totalInterestPaid,
      upcomingMonthPayout,
      totalPayouts,
      upcomingPayouts,
      currentMonth,
      upcomingMonth
    };
  };

  const getPendingKYC = () => {
    return investors.filter(inv => inv.kycStatus === 'Pending').length;
  };

  const getKYCCompleted = () => {
    return investors.filter(inv => inv.kycStatus === 'Completed').length;
  };

  const getKYCRejected = () => {
    return investors.filter(inv => inv.kycStatus === 'Rejected').length;
  };

  const getUpcomingPayouts = () => {
    // Calculate upcoming payouts based on series
    const payouts = [];
    series.filter(s => s.status === 'active').forEach(s => {
      const nextPayoutDate = new Date();
      nextPayoutDate.setMonth(nextPayoutDate.getMonth() + 1); // Always monthly
      const investorsInSeries = investors.filter(inv => inv.series.includes(s.name));
      const totalAmount = investorsInSeries.reduce((sum, inv) => {
        const seriesInvestment = inv.series.includes(s.name) ? inv.investment / inv.series.length : 0;
        return sum + seriesInvestment;
      }, 0);
      
      payouts.push({
        series: s.name,
        investors: investorsInSeries.length,
        amount: totalAmount * (s.interestRate / 100) / 12, // Always monthly
        date: nextPayoutDate.toISOString().split('T')[0]
      });
    });
    return payouts.sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  // Calculate real compliance percentages for each series individually
  const getSeriesComplianceData = (seriesName) => {
    // Find the actual series data
    const actualSeries = series.find(s => `${s.name} NCD` === seriesName || s.name === seriesName.replace(' NCD', ''));
    
    // For new series or series without established compliance, return all zeros
    if (!actualSeries) {
      return { pre: 0, post: 0, recurring: 0 };
    }
    
    // Only established series with significant activity should have any compliance progress
    const isEstablishedSeries = actualSeries.status === 'active' && 
                               actualSeries.fundsRaised > 10000000 && // At least 1 Cr raised
                               actualSeries.investors > 10; // At least 10 investors
    
    if (!isEstablishedSeries) {
      // New or small series start with zero compliance
      return { pre: 0, post: 0, recurring: 0 };
    }
    
    // Only for well-established series, assign some compliance progress
    const seriesComplianceData = {
      'Series A NCD': {
        pre: { completed: 0, total: 26 },
        post: { completed: 3, total: 11 }, // Only 3 basic documents
        recurring: { completed: 0, total: 5 }
      },
      'Series B NCD': {
        pre: { completed: 2, total: 26 },
        post: { completed: 4, total: 11 },
        recurring: { completed: 1, total: 5 }
      },
      'Series C NCD': {
        pre: { completed: 26, total: 26 }, // Only Series C is fully compliant
        post: { completed: 11, total: 11 },
        recurring: { completed: 5, total: 5 }
      },
      'Series D NCD': {
        pre: { completed: 12, total: 26 },
        post: { completed: 4, total: 11 },
        recurring: { completed: 1, total: 5 }
      },
      'Series E NCD': {
        pre: { completed: 10, total: 26 },
        post: { completed: 3, total: 11 },
        recurring: { completed: 1, total: 5 }
      }
    };

    const data = seriesComplianceData[seriesName];
    if (!data) {
      // Any new series not in the hardcoded list starts with zero compliance
      return { pre: 0, post: 0, recurring: 0 };
    }

    // Calculate percentages exactly like ComplianceTracker does
    const prePercentage = Math.round((data.pre.completed / data.pre.total) * 100);
    const postPercentage = Math.round((data.post.completed / data.post.total) * 100);
    const recurringPercentage = Math.round((data.recurring.completed / data.recurring.total) * 100);

    return {
      pre: prePercentage,
      post: postPercentage,
      recurring: recurringPercentage
    };
  };

  // State for tracking compliance status per series - dynamically generated
  const [complianceStatus, setComplianceStatus] = useState(() => {
    const initialStatus = {};
    
    // Initialize compliance status for all existing series
    series.forEach(s => {
      const seriesName = `${s.name} NCD`;
      initialStatus[seriesName] = getSeriesComplianceData(seriesName);
    });
    
    return initialStatus;
  });

  // Update compliance status for a series
  const updateComplianceStatus = (seriesName, statusData) => {
    setComplianceStatus(prev => ({
      ...prev,
      [seriesName]: statusData
    }));
  };

  // Get compliance status for series (for dashboard alerts)
  const getComplianceStatus = (seriesName) => {
    const compliance = complianceStatus[seriesName] || { pre: 0, post: 0, recurring: 0 };
    const averagePercentage = Math.round((compliance.pre + compliance.post + compliance.recurring) / 3);
    
    if (averagePercentage === 100) return 'submitted';
    if (averagePercentage >= 50) return 'pending';
    return 'yet-to-be-submitted';
  };

  // Get series that need compliance attention (for dashboard alerts)
  const getYetToBeSubmittedSeries = () => {
    // Use actual series data instead of hardcoded data
    const complianceSeries = series.filter(s => s.status === 'active').map(s => ({
      id: `comp-${s.id}`,
      name: `${s.name} NCD`,
      interestRate: s.interestRate,
      interestFrequency: s.interestFrequency,
      investors: s.investors, // Use real investor count
      fundsRaised: s.fundsRaised, // Use real funds raised
      targetAmount: s.targetAmount,
      issueDate: s.issueDate,
      maturityDate: s.maturityDate
    }));

    return complianceSeries.filter(s => getComplianceStatus(s.name) === 'yet-to-be-submitted');
  };

  // Check if series is within subscription window
  const isWithinSubscriptionWindow = (series) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const parseDate = (dateStr) => {
      if (!dateStr) return null;
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        return new Date(parts[2], parts[1] - 1, parts[0]);
      }
      return null;
    };
    
    const subscriptionStartDate = parseDate(series.subscriptionStartDate);
    const subscriptionEndDate = parseDate(series.subscriptionEndDate);
    
    if (!subscriptionStartDate || !subscriptionEndDate) {
      return false; // No subscription window defined
    }
    
    return today >= subscriptionStartDate && today <= subscriptionEndDate;
  };

  // Get series status based on subscription window and dates
  const getSeriesStatus = (series) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const parseDate = (dateStr) => {
      if (!dateStr) return null;
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        return new Date(parts[2], parts[1] - 1, parts[0]);
      }
      return null;
    };
    
    // Handle DRAFT status
    if (series.status === 'DRAFT') {
      return 'DRAFT';
    }
    
    const subscriptionStartDate = parseDate(series.subscriptionStartDate);
    const subscriptionEndDate = parseDate(series.subscriptionEndDate);
    const maturityDate = parseDate(series.maturityDate);
    
    // Check if matured
    if (maturityDate && maturityDate < today) {
      return 'matured';
    }
    
    // If no subscription dates, use old logic
    if (!subscriptionStartDate || !subscriptionEndDate) {
      return series.status;
    }
    
    // Subscription window logic
    if (today < subscriptionStartDate) {
      return 'upcoming'; // Before subscription starts
    } else if (today >= subscriptionStartDate && today <= subscriptionEndDate) {
      return 'accepting'; // Within subscription window - accepting investments
    } else if (today > subscriptionEndDate) {
      return 'active'; // After subscription ends - active but no new investments
    }
    
    return series.status;
  };

  // Auto-update series statuses based on subscription dates
  const updateSeriesStatuses = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const parseDate = (dateStr) => {
      if (!dateStr) return null;
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        return new Date(parts[2], parts[1] - 1, parts[0]);
      }
      return null;
    };
    
    let hasUpdates = false;
    const updatedSeries = series.map(s => {
      const currentStatus = getSeriesStatus(s);
      
      // Only update if status has changed
      if (s.status !== currentStatus) {
        hasUpdates = true;
        console.log(`Auto-updating series ${s.name} status from ${s.status} to ${currentStatus}`);
        return { ...s, status: currentStatus };
      }
      
      return s;
    });
    
    if (hasUpdates) {
      setSeries(updatedSeries);
      localStorage.setItem('series', JSON.stringify(updatedSeries));
    }
  }, [series, getSeriesStatus]);

  // Run status updates on component mount and periodically
  useEffect(() => {
    updateSeriesStatuses();
    
    // Update statuses every hour
    const interval = setInterval(updateSeriesStatuses, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [updateSeriesStatuses]);

  // Add transaction to investor's transaction history
  const addTransactionToInvestor = (investorId, transaction) => {
    console.log('Adding transaction to investor:', investorId, transaction);
    
    const updatedInvestors = investors.map(inv => {
      if (inv.investorId === investorId || inv.id === investorId) {
        const currentTransactions = inv.transactions || [];
        const newTransaction = {
          ...transaction,
          date: transaction.date || new Date().toLocaleDateString('en-GB'),
          timestamp: transaction.timestamp || new Date().toISOString()
        };
        
        // Add new transaction and sort by date (newest first)
        const updatedTransactions = [newTransaction, ...currentTransactions]
          .sort((a, b) => new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date));
        
        return {
          ...inv,
          transactions: updatedTransactions
        };
      }
      return inv;
    });
    
    setInvestors(updatedInvestors);
    localStorage.setItem('investors', JSON.stringify(updatedInvestors));
    console.log('Transaction added successfully');
  };

  // Add investment transaction (called when new investment is made)
  const addInvestmentTransaction = (investorId, seriesName, amount, date) => {
    const transaction = {
      type: 'Investment',
      series: seriesName,
      amount: amount,
      description: `Investment in ${seriesName}`,
      date: date || new Date().toLocaleDateString('en-GB'),
      timestamp: new Date().toISOString()
    };
    
    addTransactionToInvestor(investorId, transaction);
  };

  // Add interest payout transaction (called when interest is paid)
  const addInterestPayoutTransaction = (investorId, seriesName, amount, date, month) => {
    const transaction = {
      type: 'Interest Credit',
      series: seriesName,
      amount: amount,
      description: `Monthly interest for ${seriesName}${month ? ` - ${month}` : ''}`,
      date: date || new Date().toLocaleDateString('en-GB'),
      timestamp: new Date().toISOString()
    };
    
    addTransactionToInvestor(investorId, transaction);
  };

  // Document management functions
  const addInvestorDocument = (investorId, document) => {
    console.log('Adding document to investor:', investorId, document);
    
    const updatedInvestors = investors.map(inv => {
      if (inv.investorId === investorId || inv.id === investorId) {
        const currentDocuments = inv.seriesDocuments || [];
        const newDocument = {
          ...document,
          id: Date.now() + Math.random(), // Unique ID
          uploadDate: document.uploadDate || new Date().toLocaleDateString('en-GB'),
          timestamp: document.timestamp || new Date().toISOString()
        };
        
        return {
          ...inv,
          seriesDocuments: [...currentDocuments, newDocument]
        };
      }
      return inv;
    });
    
    setInvestors(updatedInvestors);
    localStorage.setItem('investors', JSON.stringify(updatedInvestors));
    console.log('Document added successfully');
  };

  // Get documents for specific investor
  const getInvestorDocuments = (investorId, seriesName = null) => {
    const investor = investors.find(inv => inv.investorId === investorId || inv.id === investorId);
    if (!investor || !investor.seriesDocuments) {
      return [];
    }
    
    if (seriesName) {
      return investor.seriesDocuments.filter(doc => doc.seriesName === seriesName);
    }
    
    return investor.seriesDocuments;
  };

  // END OF ALL FUNCTIONS - NOW RETURN THE PROVIDER
  return (
    <DataContext.Provider value={{
      investors,
      series,
      complaints,
      auditLogs,
      complianceStatus,
      seriesRefreshTrigger,
      addSeries,
      updateSeries,
      approveSeries,
      rejectSeries,
      deleteSeries,
      addInvestor,
      updateInvestor,
      addAuditLog,
      addComplaint,
      updateComplaint,
      updateComplaintStatus,
      getInvestorComplaints,
      getPendingComplaints,
      getComplaintsByDateRange,
      setInvestors,
      setSeries,
      setComplaints,
      getTotalFundsRaised,
      getTotalInvestors,
      getCurrentMonthPayout,
      getInterestPayoutStats,
      getPendingKYC,
      getKYCCompleted,
      getKYCRejected,
      getUpcomingPayouts,
      getComplianceStatus,
      getYetToBeSubmittedSeries,
      updateComplianceStatus,
      recalculateSeriesMetrics,
      forceRecalculateAllSeries,
      forceSeriesRefresh: () => setSeriesRefreshTrigger(prev => prev + 1),
      addTransactionToInvestor,
      addInvestmentTransaction,
      addInterestPayoutTransaction,
      isWithinSubscriptionWindow,
      getSeriesStatus,
      addInvestorDocument,
      getInvestorDocuments,
      trackChurnEvent,
      trackEarlyRedemptionEvent,
      getSatisfactionMetrics
    }}>
      {children}
    </DataContext.Provider>
  );
};