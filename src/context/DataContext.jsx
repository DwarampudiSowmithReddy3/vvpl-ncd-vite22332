import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

// Initial dummy data
const initialComplaints = [
  {
    id: 1,
    investorId: 'ABCDE1234F', // Rajesh Kumar
    issue: 'Delay in interest payment for Series A NCD',
    remarks: 'Interest payment was supposed to be credited on 15th Jan but still not received. Please check and resolve.',
    timestamp: '2024-01-16 10:30 AM',
    status: 'pending',
    isCompleted: false
  },
  {
    id: 2,
    investorId: 'BCDEF2345G', // Priya Sharma
    issue: 'KYC document verification issue',
    remarks: 'My KYC documents were rejected without proper reason. Need clarification on what documents are required.',
    timestamp: '2024-01-15 02:45 PM',
    status: 'resolved',
    isCompleted: true
  },
  {
    id: 3,
    investorId: 'ABCDE1234F', // Rajesh Kumar
    issue: 'Certificate delivery delay',
    remarks: 'Physical certificate was supposed to be delivered within 30 days but has not been received yet.',
    timestamp: '2024-01-10 11:15 AM',
    status: 'resolved',
    isCompleted: true
  },
  {
    id: 4,
    investorId: 'ABCDE1234F', // Rajesh Kumar
    issue: 'Incorrect interest calculation',
    remarks: 'The interest amount credited seems to be calculated incorrectly. Please verify the calculation for Series B investment.',
    timestamp: '2024-01-08 09:20 AM',
    status: 'pending',
    isCompleted: false
  },
  {
    id: 5,
    investorId: 'CDEFG3456H', // Amit Patel
    issue: 'Account statement not received',
    remarks: 'Monthly account statement for December was not received via email. Please resend.',
    timestamp: '2024-01-05 03:15 PM',
    status: 'resolved',
    isCompleted: true
  },
  {
    id: 6,
    investorId: 'EFGHI5678J', // Vikram Singh
    issue: 'Multiple series interest confusion',
    remarks: 'Having difficulty understanding interest calculations across multiple series investments. Need detailed breakdown.',
    timestamp: '2024-01-12 11:45 AM',
    status: 'pending',
    isCompleted: false
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
    series: ['Series A', 'Series B', 'Series C', 'Series D' , 'Series E', 'Series F', 'Series G', 'Series H', 'Series I', 'Series J', 'Series K', 'Series L', 'Series M', 'Series N', 'Series O', 'Series P', 'Series Q', 'Series R', 'Series S', 'Series T'],
    investment: 3500000,
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
    kycStatus: 'Pending',
    dateJoined: '20/5/2024',
    bankAccountNumber: '4567890123456789',
    ifscCode: 'AXIS0005678',
    bankName: 'Axis Bank'
  }
];

const initialSeries = [
  {
    id: 1,
    name: 'Series A',
    status: 'active',
    interestFrequency: 'Quarterly Interest',
    interestRate: 9.5,
    investors: 0, // Will be calculated from actual investor data
    fundsRaised: 35000000,
    targetAmount: 50000000,
    issueDate: '1/6/2023',
    maturityDate: '1/6/2028',
    faceValue: 1000,
    minInvestment: 10000,
    releaseDate: '1/6/2023',
    lockInPeriod: 12 // 12 months lock-in period
  },
  {
    id: 2,
    name: 'Series B',
    status: 'active',
    interestFrequency: 'Monthly Interest',
    interestRate: 10,
    investors: 0, // Will be calculated from actual investor data
    fundsRaised: 62000000,
    targetAmount: 80000000,
    issueDate: '15/9/2023',
    maturityDate: '15/9/2028',
    faceValue: 1000,
    minInvestment: 25000,
    releaseDate: '15/9/2023',
    lockInPeriod: 18 // 18 months lock-in period
  },
  {
    id: 3,
    name: 'Series C',
    status: 'active',
    interestFrequency: 'Quarterly Interest',
    interestRate: 10.5,
    investors: 0, // Will be calculated from actual investor data
    fundsRaised: 28000000,
    targetAmount: 100000000,
    issueDate: '1/1/2024',
    maturityDate: '1/1/2029',
    faceValue: 1000,
    minInvestment: 50000,
    releaseDate: '1/1/2024',
    lockInPeriod: 24 // 24 months lock-in period
  },
  {
    id: 4,
    name: 'Series D',
    status: 'active',
    interestFrequency: 'Quarterly Interest',
    interestRate: 11,
    investors: 0, // Will be calculated from actual investor data
    fundsRaised: 45000000,
    targetAmount: 150000000,
    issueDate: '1/3/2024',
    maturityDate: '1/3/2029',
    faceValue: 1000,
    minInvestment: 100000,
    releaseDate: '1/3/2024',
    lockInPeriod: 15 // 15 months lock-in period
  },
  {
    id: 5,
    name: 'Series E',
    status: 'active',
    interestFrequency: 'Monthly Interest',
    interestRate: 11.5,
    investors: 0, // Will be calculated from actual investor data
    fundsRaised: 32000000,
    targetAmount: 120000000,
    issueDate: '15/5/2024',
    maturityDate: '15/5/2029',
    faceValue: 1000,
    minInvestment: 75000,
    releaseDate: '15/5/2024',
    lockInPeriod: 36 // 36 months lock-in period
  },
  {
    id: 6,
    name: 'Series Z',
    status: 'matured',
    interestFrequency: 'Quarterly Interest',
    interestRate: 8.5,
    investors: 0, // Will be calculated from actual investor data
    fundsRaised: 75000000,
    targetAmount: 75000000,
    issueDate: '1/1/2020',
    maturityDate: '1/1/2025',
    faceValue: 1000,
    minInvestment: 10000,
    releaseDate: '1/1/2020',
    lockInPeriod: 12 // 12 months lock-in period
  }
];

export const DataProvider = ({ children }) => {
  // Cleanup code removed - Series AB is now a valid series
  // No automatic deletion of any series

  const [investors, setInvestors] = useState(() => {
    const saved = localStorage.getItem('investors');
    if (saved) {
      const parsedInvestors = JSON.parse(saved);
      
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
        
        return cleaned;
      });
      
      // Save the migrated data back to localStorage
      localStorage.setItem('investors', JSON.stringify(cleanedInvestors));
      
      return cleanedInvestors;
    }
    return initialInvestors;
  });

  const [series, setSeries] = useState(() => {
    const savedSeries = localStorage.getItem('series');
    const savedInvestors = localStorage.getItem('investors');
    
    // Load all series from localStorage (no filtering)
    let parsedSeries = savedSeries ? JSON.parse(savedSeries) : initialSeries;
    
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
          fundsRaised: calculatedFunds // Only funds from active investors
        };
      });
      
      // Save the recalculated series back to localStorage
      localStorage.setItem('series', JSON.stringify(parsedSeries));
    }
    
    return parsedSeries;
  });

  const [complaints, setComplaints] = useState(() => {
    const saved = localStorage.getItem('complaints');
    return saved ? JSON.parse(saved) : initialComplaints;
  });

  // Audit Log State
  const [auditLogs, setAuditLogs] = useState(() => {
    const saved = localStorage.getItem('auditLogs');
    return saved ? JSON.parse(saved) : [];
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
    
    // Parse issue date to determine status
    const parseDate = (dateStr) => {
      if (!dateStr) return null;
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        return new Date(parts[2], parts[1] - 1, parts[0]);
      }
      return null;
    };
    
    const issueDate = parseDate(approvedData.issueDate);
    
    // Determine status based on issue date
    let status = 'upcoming'; // Default to upcoming
    if (issueDate) {
      if (issueDate <= today) {
        // If issue date is today or in the past, make it active immediately
        status = 'active';
      } else {
        // If issue date is in the future, keep it as upcoming
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
    setSeries(currentSeries => 
      currentSeries.map(s => {
        // If seriesName is provided, only recalculate that series
        if (seriesName && s.name !== seriesName) {
          return s;
        }
        
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
        
        return {
          ...s,
          investors: investorsInSeries.length, // Only count active investors
          fundsRaised: baseFunds + Math.round(totalFundsFromInvestors) // Only funds from active investors
        };
      })
    );
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

  // Recalculate series metrics whenever investors change
  useEffect(() => {
    // Debounce the recalculation to avoid too many updates
    const timer = setTimeout(() => {
      recalculateSeriesMetrics();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [investors]);

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
    console.log('DataContext updateInvestor called with ID:', id, 'type:', typeof id, 'updates:', updates);
    
    // Handle both string and number IDs
    const targetId = typeof id === 'string' ? parseInt(id) : id;
    const oldInvestor = investors.find(inv => inv.id === targetId || inv.id === id);
    console.log('Found old investor:', oldInvestor);
    
    if (!oldInvestor) {
      console.error('Investor not found with ID:', id);
      console.log('Available investors:', investors.map(inv => ({ id: inv.id, name: inv.name, type: typeof inv.id })));
      return;
    }
    
    const updatedInvestors = investors.map(inv => 
      (inv.id === targetId || inv.id === id) ? { ...inv, ...updates } : inv
    );
    console.log('Setting updated investors:', updatedInvestors);
    setInvestors(updatedInvestors);
    
    // Force save to localStorage immediately
    localStorage.setItem('investors', JSON.stringify(updatedInvestors));
    console.log('Saved updated investors to localStorage');
    
    // Recalculate metrics for affected series
    const affectedSeries = new Set();
    if (oldInvestor?.series) {
      oldInvestor.series.forEach(s => affectedSeries.add(s));
    }
    if (updates.series) {
      updates.series.forEach(s => affectedSeries.add(s));
    }
    
    affectedSeries.forEach(seriesName => {
      setTimeout(() => recalculateSeriesMetrics(seriesName), 100);
    });
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
      isCompleted: false
    };
    setComplaints([complaint, ...complaints]);
    return complaint;
  };

  const updateComplaint = (id, updates) => {
    setComplaints(complaints.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const updateComplaintStatus = (id, isCompleted) => {
    setComplaints(complaints.map(c => 
      c.id === id ? { ...c, isCompleted, status: isCompleted ? 'resolved' : 'pending' } : c
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
    return investors.length;
  };

  const getCurrentMonthPayout = () => {
    // Calculate based on active series and their interest rates
    let totalPayout = 0;
    series.filter(s => s.status === 'active').forEach(s => {
      const monthlyRate = s.interestFrequency === 'Monthly Interest' 
        ? s.interestRate / 100 / 12
        : s.interestRate / 100 / 4 / 3; // Quarterly divided by 3 months
      totalPayout += s.fundsRaised * monthlyRate;
    });
    return totalPayout;
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
      nextPayoutDate.setMonth(nextPayoutDate.getMonth() + (s.interestFrequency === 'Monthly Interest' ? 1 : 3));
      const investorsInSeries = investors.filter(inv => inv.series.includes(s.name));
      const totalAmount = investorsInSeries.reduce((sum, inv) => {
        const seriesInvestment = inv.series.includes(s.name) ? inv.investment / inv.series.length : 0;
        return sum + seriesInvestment;
      }, 0);
      
      payouts.push({
        series: s.name,
        investors: investorsInSeries.length,
        amount: totalAmount * (s.interestRate / 100) / (s.interestFrequency === 'Monthly Interest' ? 12 : 4),
        date: nextPayoutDate.toISOString().split('T')[0]
      });
    });
    return payouts.sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  // State for tracking compliance status per series
  const [complianceStatus, setComplianceStatus] = useState({
    'Series A NCD': { pre: 30, post: 27, recurring: 0 },
    'Series B NCD': { pre: 25, post: 35, recurring: 20 },
    'Series C NCD': { pre: 100, post: 100, recurring: 100 },
    'Series D NCD': { pre: 45, post: 36, recurring: 20 },
    'Series E NCD': { pre: 40, post: 30, recurring: 25 }
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

  return (
    <DataContext.Provider value={{
      investors,
      series,
      complaints,
      auditLogs,
      addSeries,
      updateSeries,
      approveSeries,
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
      getPendingKYC,
      getKYCCompleted,
      getKYCRejected,
      getUpcomingPayouts,
      getComplianceStatus,
      getYetToBeSubmittedSeries,
      updateComplianceStatus,
      recalculateSeriesMetrics,
      forceRecalculateAllSeries
    }}>
      {children}
    </DataContext.Provider>
  );
};

