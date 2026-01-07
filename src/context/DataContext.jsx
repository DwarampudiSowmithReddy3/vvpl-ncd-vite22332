import React, { createContext, useContext, useState, useEffect } from 'react';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

// Initial dummy data
const initialInvestors = [
  {
    id: 1,
    name: 'Rajesh Kumar',
    investorId: 'ABCDE1234F',
    email: 'rajesh.kumar@email.com',
    phone: '+91 98765 43210',
    series: ['Series A', 'Series B'],
    investment: 1500000,
    kycStatus: 'Completed',
    dateJoined: '15/6/2023'
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
    dateJoined: '20/9/2023'
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
    dateJoined: '10/7/2023'
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
    dateJoined: '5/1/2024'
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
    dateJoined: '1/6/2023'
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
    dateJoined: '15/10/2023'
  }
];

const initialSeries = [
  {
    id: 1,
    name: 'Series A',
    status: 'active',
    interestFrequency: 'Quarterly Interest',
    interestRate: 9.5,
    investors: 95,
    fundsRaised: 35000000,
    targetAmount: 50000000,
    issueDate: '1/6/2023',
    maturityDate: '1/6/2028',
    faceValue: 1000,
    minInvestment: 10000,
    releaseDate: '1/6/2023'
  },
  {
    id: 2,
    name: 'Series B',
    status: 'active',
    interestFrequency: 'Monthly Interest',
    interestRate: 10,
    investors: 124,
    fundsRaised: 62000000,
    targetAmount: 80000000,
    issueDate: '15/9/2023',
    maturityDate: '15/9/2028',
    faceValue: 1000,
    minInvestment: 25000,
    releaseDate: '15/9/2023'
  },
  {
    id: 3,
    name: 'Series C',
    status: 'active',
    interestFrequency: 'Quarterly Interest',
    interestRate: 10.5,
    investors: 29,
    fundsRaised: 28000000,
    targetAmount: 100000000,
    issueDate: '1/1/2024',
    maturityDate: '1/1/2029',
    faceValue: 1000,
    minInvestment: 50000,
    releaseDate: '1/1/2024'
  },
  {
    id: 4,
    name: 'Series D',
    status: 'upcoming',
    interestFrequency: 'Quarterly Interest',
    interestRate: 11,
    investors: 0,
    fundsRaised: 0,
    targetAmount: 150000000,
    issueDate: '1/3/2024',
    maturityDate: '1/3/2029',
    faceValue: 1000,
    minInvestment: 100000,
    releaseDate: '1/3/2024'
  }
];

export const DataProvider = ({ children }) => {
  const [investors, setInvestors] = useState(() => {
    const saved = localStorage.getItem('investors');
    return saved ? JSON.parse(saved) : initialInvestors;
  });

  const [series, setSeries] = useState(() => {
    const saved = localStorage.getItem('series');
    return saved ? JSON.parse(saved) : initialSeries;
  });

  useEffect(() => {
    localStorage.setItem('investors', JSON.stringify(investors));
  }, [investors]);

  useEffect(() => {
    localStorage.setItem('series', JSON.stringify(series));
  }, [series]);

  const addSeries = (newSeries) => {
    const seriesToAdd = {
      ...newSeries,
      id: series.length + 1,
      investors: 0,
      fundsRaised: 0,
      status: newSeries.releaseDate === 'now' || new Date(newSeries.releaseDate) <= new Date() 
        ? 'active' 
        : 'upcoming'
    };
    setSeries([...series, seriesToAdd]);
  };

  const updateSeries = (id, updates) => {
    setSeries(series.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const addInvestor = (newInvestor) => {
    setInvestors([...investors, { ...newInvestor, id: investors.length + 1 }]);
  };

  const updateInvestor = (id, updates) => {
    setInvestors(investors.map(inv => inv.id === id ? { ...inv, ...updates } : inv));
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

  return (
    <DataContext.Provider value={{
      investors,
      series,
      addSeries,
      updateSeries,
      addInvestor,
      updateInvestor,
      setInvestors,
      setSeries,
      getTotalFundsRaised,
      getTotalInvestors,
      getCurrentMonthPayout,
      getPendingKYC,
      getKYCCompleted,
      getKYCRejected,
      getUpcomingPayouts
    }}>
      {children}
    </DataContext.Provider>
  );
};

