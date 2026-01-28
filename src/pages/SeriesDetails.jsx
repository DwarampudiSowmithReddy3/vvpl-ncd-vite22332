import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import './SeriesDetails.css';
import { 
  HiArrowLeft,
  HiOutlineCalendar,
  HiCheckCircle
} from 'react-icons/hi';
import { 
  MdOutlineFileDownload,
  MdCurrencyRupee,
  MdAccountBalance
} from 'react-icons/md';
import { 
  FiUsers,
  FiPercent,
  FiTrendingUp,
  FiLock,
  FiCalendar
} from 'react-icons/fi';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const SeriesDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { series = [], investors = [], addAuditLog, addInvestorDocument, getInvestorDocuments } = useData();
  const { user } = useAuth();
  const [showFundsModal, setShowFundsModal] = useState(false);
  const [showInvestorsModal, setShowInvestorsModal] = useState(false);
  const [showDocumentUploadModal, setShowDocumentUploadModal] = useState(false);
  const [selectedInvestorForUpload, setSelectedInvestorForUpload] = useState(null);
  const [uploadDocuments, setUploadDocuments] = useState({
    form15G: null,
    form15H: null,
    bondPaper: null
  });

  // Check if we came from investor details by looking at the referrer or state
  const handleBackNavigation = () => {
    // Check if there's a previous page in history
    if (window.history.length > 1) {
      navigate(-1); // Go back to previous page
    } else {
      navigate('/ncd-series'); // Default fallback
    }
  };

  // Generate upcoming month payout data for this specific series (same as Interest Payout Export - Upcoming Month)
  const getUpcomingPayoutData = useMemo(() => {
    if (!id || !series || !investors) return [];
    
    // Get current series data
    const currentSeries = series.find(s => s.id === parseInt(id));
    if (!currentSeries || currentSeries.status !== 'active') return [];
    
    // Load payout status updates from localStorage (same as Interest Payout page)
    const payoutStatusUpdates = JSON.parse(localStorage.getItem('payoutStatusUpdates') || '{}');
    
    // Calculate upcoming month (same logic as Interest Payout Export)
    const currentDate = new Date();
    const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    const upcomingMonth = nextMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
    
    // Helper function to parse date string (DD/MM/YYYY) - same as Interest Payout
    const parseDate = (dateStr) => {
      if (!dateStr) return null;
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        return new Date(parts[2], parts[1] - 1, parts[0]);
      }
      return null;
    };
    
    // Helper function to check if payout is due - same as Interest Payout
    const isPayoutDue = (issueDate, frequency) => {
      const issue = parseDate(issueDate);
      if (!issue) return false;
      
      const today = new Date();
      const daysDiff = Math.floor((today - issue) / (1000 * 60 * 60 * 24));
      
      // At least 30 days must have passed for monthly payouts
      return daysDiff >= 30;
    };
    
    // Check if this series has any due payouts
    if (!isPayoutDue(currentSeries.issueDate, currentSeries.interestFrequency)) {
      return [];
    }
    
    // Get investors for this series
    const seriesInvestors = investors.filter(inv => 
      inv.series && Array.isArray(inv.series) && inv.series.includes(currentSeries.name)
    );
    
    if (seriesInvestors.length === 0) return [];
    
    // Generate upcoming month payout data (exact same logic as Interest Payout Export)
    const upcomingPayouts = [];
    
    seriesInvestors.forEach(investor => {
      const investmentPerSeries = investor.investment / investor.series.length;
      const interestAmount = (investmentPerSeries * currentSeries.interestRate) / 100 / 12;
      
      const upcomingPayoutKey = `${investor.investorId}-${currentSeries.name}-${upcomingMonth}`;
      const upcomingPayoutStatus = payoutStatusUpdates[upcomingPayoutKey] || 'Scheduled';
      
      upcomingPayouts.push({
        id: upcomingPayouts.length + 1,
        investorId: investor.investorId,
        investorName: investor.name,
        seriesName: currentSeries.name,
        interestMonth: upcomingMonth,
        interestDate: `15-${nextMonth.toLocaleString('default', { month: 'short' })}-${nextMonth.getFullYear()}`,
        amount: Math.round(interestAmount),
        status: upcomingPayoutStatus,
        bankAccountNumber: investor.bankAccountNumber || 'N/A',
        ifscCode: investor.ifscCode || 'N/A',
        bankName: investor.bankName || 'N/A'
      });
    });
    
    return upcomingPayouts;
  }, [id, series, investors]);



  // Hardcoded data for now - different series based on ID
  const getDefaultSeriesData = (seriesId) => {
    const seriesData = {
      '1': {
        id: '1',
        name: 'Series A',
        status: 'Active',
        fundsRaised: 35000000,
        investors: 95,
        interestRate: 9.5,
        progress: 70,
        issueDate: '1/6/2023',
        maturityDate: '1/6/2028',
        interestFrequency: 'Monthly',
        faceValue: 1000,
        minInvestment: 10000,
        targetAmount: 50000000
      },
      '2': {
        id: '2',
        name: 'Series B',
        status: 'Active',
        fundsRaised: 42000000,
        investors: 120,
        interestRate: 10.2,
        progress: 84,
        issueDate: '15/9/2023',
        maturityDate: '15/9/2028',
        interestFrequency: 'Monthly',
        faceValue: 1000,
        minInvestment: 15000,
        targetAmount: 50000000
      }
    };
    
    return seriesData[seriesId] || seriesData['1'];
  };

  const defaultSeries = {
    ...getDefaultSeriesData(id),
    // Remove hardcoded payouts - will use real data from getSeriesPayoutData
    transactions: [
      {
        date: '15/1/2024',
        investor: 'Rajesh Kumar',
        type: 'subscription',
        amount: 500000
      },
      {
        date: '14/1/2024',
        investor: 'Amit Patel',
        type: 'subscription',
        amount: 750000
      },
      {
        date: '10/1/2024',
        investor: 'Vikram Singh',
        type: 'interest',
        amount: 47500
      },
      {
        date: '8/1/2024',
        investor: 'Suresh Iyer',
        type: 'subscription',
        amount: 300000
      }
    ]
  };

  // Find series by ID, or use default data
  let seriesData = defaultSeries;
  
  if (series && series.length > 0 && id) {
    const foundSeries = series.find(s => s.id === parseInt(id));
    if (foundSeries) {
      seriesData = {
        ...foundSeries,
        status: foundSeries.status === 'DRAFT' ? 'Yet to be approved' : 
                foundSeries.status === 'upcoming' ? 'Releasing soon' :
                foundSeries.status === 'active' ? 'Active' : foundSeries.status,
        progress: Math.round((foundSeries.fundsRaised / foundSeries.targetAmount) * 100),
        transactions: [] // Will be populated from actual investments
      };
    }
  }

  // Get actual investors for this series
  const seriesInvestors = investors.filter(inv => 
    inv.series && Array.isArray(inv.series) && inv.series.includes(seriesData.name)
  );

  // Generate real transactions from investments array
  const realTransactions = [];
  seriesInvestors.forEach(inv => {
    if (inv.investments && Array.isArray(inv.investments)) {
      const seriesInvestments = inv.investments.filter(investment => investment.seriesName === seriesData.name);
      seriesInvestments.forEach(investment => {
        realTransactions.push({
          date: investment.date,
          timestamp: investment.timestamp,
          investor: inv.name,
          investorId: inv.investorId,
          type: 'subscription',
          amount: investment.amount,
          addedBy: investment.addedBy || 'Admin',
          addedByRole: investment.addedByRole || 'Admin'
        });
      });
    }
  });

  // Sort transactions by timestamp (newest first)
  realTransactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Update seriesData with real transactions only
  if (realTransactions.length > 0) {
    seriesData.transactions = realTransactions;
  } else {
    // No transactions for new series - set empty array
    seriesData.transactions = [];
  }

  // Calculate investment per investor for this series using investments array
  const investorDetails = seriesInvestors.map(inv => {
    let investmentInThisSeries = 0;
    
    // Use investments array if available (per-series tracking)
    if (inv.investments && Array.isArray(inv.investments)) {
      const seriesInvestments = inv.investments.filter(investment => investment.seriesName === seriesData.name);
      investmentInThisSeries = seriesInvestments.reduce((sum, investment) => sum + investment.amount, 0);
    } else {
      // Fallback to old calculation
      investmentInThisSeries = inv.series.length > 0 ? inv.investment / inv.series.length : 0;
    }
    
    return {
      name: inv.name,
      investorId: inv.investorId,
      amount: Math.round(investmentInThisSeries),
      kycStatus: inv.kycStatus
    };
  });

  // Recalculate actual funds raised from investors
  const actualFundsRaised = investorDetails.reduce((sum, inv) => sum + inv.amount, 0);
  
  // Update seriesData with actual calculated values
  if (seriesInvestors.length > 0) {
    seriesData.fundsRaised = actualFundsRaised;
    seriesData.investors = seriesInvestors.length;
    seriesData.progress = Math.round((actualFundsRaised / seriesData.targetAmount) * 100);
  }

  // Calculate Lock-in and Maturity Details
  const getSeriesInsights = useMemo(() => {
    if (!seriesData || !seriesData.issueDate || !seriesData.maturityDate) return null;

    const today = new Date();
    
    // Helper function to parse date string (DD/MM/YYYY or D/M/YYYY)
    const parseDate = (dateStr) => {
      if (!dateStr) return null;
      try {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          return new Date(parts[2], parts[1] - 1, parts[0]);
        }
        return null;
      } catch (error) {
        console.error('Error parsing date:', dateStr, error);
        return null;
      }
    };

    // Calculate lock-in details (assuming 1 year lock-in period from issue date)
    const issueDate = parseDate(seriesData.issueDate);
    const maturityDate = parseDate(seriesData.maturityDate);
    
    let lockInDetails = null;
    let maturityDetails = null;

    if (issueDate) {
      try {
        // Lock-in period is typically 1 year from issue date
        const lockInEndDate = new Date(issueDate);
        lockInEndDate.setFullYear(lockInEndDate.getFullYear() + 1);
        
        const lockInDaysLeft = Math.ceil((lockInEndDate - today) / (1000 * 60 * 60 * 24));
        const isLockInActive = lockInDaysLeft > 0;
        
        // For demo purposes, assume some investors left after lock-in
        // TODO: In real implementation, this should come from actual investor exit data
        // Check for investors with status 'exited' or similar in the investors array
        const exitedInvestors = seriesInvestors.filter(inv => inv.status === 'exited' || inv.status === 'deleted');
        const investorsLeftAfterLockIn = exitedInvestors.length;
        
        // Calculate actual amount returned to exited investors
        let amountAfterLockIn = 0;
        exitedInvestors.forEach(inv => {
          if (inv.investments && Array.isArray(inv.investments)) {
            const seriesInvestments = inv.investments.filter(investment => investment.seriesName === seriesData.name);
            amountAfterLockIn += seriesInvestments.reduce((sum, investment) => sum + investment.amount, 0);
          } else {
            // Fallback calculation
            amountAfterLockIn += inv.series.length > 0 ? inv.investment / inv.series.length : 0;
          }
        });
        
        // Calculate remaining investors (active investors still in the series)
        const activeInvestorsInSeries = seriesInvestors.filter(inv => inv.status !== 'exited' && inv.status !== 'deleted');
        const remainingInvestors = activeInvestorsInSeries.length;
        
        lockInDetails = {
          lockInEndDate: lockInEndDate.toLocaleDateString('en-GB'),
          daysLeft: lockInDaysLeft,
          isActive: isLockInActive,
          investorsLeft: investorsLeftAfterLockIn,
          amountAfterLockIn: Math.round(amountAfterLockIn),
          remainingInvestors: remainingInvestors
        };
      } catch (error) {
        console.error('Error calculating lock-in details:', error);
        lockInDetails = null;
      }
    }

    if (maturityDate) {
      try {
        const maturityDaysLeft = Math.ceil((maturityDate - today) / (1000 * 60 * 60 * 24));
        const isMatured = maturityDaysLeft <= 0;
        
        // Calculate remaining funds for active investors at maturity
        const activeInvestorsCount = seriesInvestors ? seriesInvestors.length : 0;
        const remainingFundsAtMaturity = seriesData.fundsRaised; // Total amount to be returned to active investors
        
        // Get real series status from seriesData
        const realSeriesStatus = seriesData.status === 'active' ? 'Active' : 
                                seriesData.status === 'ACCEPTING' ? 'Accepting' :
                                seriesData.status === 'upcoming' ? 'Upcoming' :
                                seriesData.status === 'DRAFT' ? 'Draft' :
                                isMatured ? 'Matured' : 'Active';
        
        maturityDetails = {
          maturityDate: maturityDate.toLocaleDateString('en-GB'),
          daysLeft: maturityDaysLeft,
          isMatured: isMatured,
          activeInvestorsCount: activeInvestorsCount,
          remainingFundsAtMaturity: remainingFundsAtMaturity,
          realSeriesStatus: realSeriesStatus
        };
      } catch (error) {
        console.error('Error calculating maturity details:', error);
        maturityDetails = null;
      }
    }

    return {
      lockIn: lockInDetails,
      maturity: maturityDetails
    };
  }, [seriesData, seriesInvestors]);

  const formatCurrency = (amount) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)} Cr`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatCurrencyFull = (amount) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const generateSeriesPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      
      // Company Header
      doc.setFontSize(22);
      doc.setTextColor(40, 40, 40);
      doc.text('LOANFRONT', pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(16);
      doc.setTextColor(100, 100, 100);
      doc.text(seriesData.name + ' - Detailed Report', pageWidth / 2, 30, { align: 'center' });
      
      doc.setFontSize(10);
      doc.text('Generated on: ' + new Date().toLocaleDateString('en-GB') + ' at ' + new Date().toLocaleTimeString('en-GB'), pageWidth / 2, 40, { align: 'center' });
      
      // Add line separator
      doc.setDrawColor(200, 200, 200);
      doc.line(20, 45, pageWidth - 20, 45);
      
      let yPosition = 60;
      
      // Series Overview
      doc.setFontSize(18);
      doc.setTextColor(40, 40, 40);
      doc.text('Series Overview', 20, yPosition);
      yPosition += 15;
      
      // Key Metrics
      doc.setFontSize(14);
      doc.text('Key Performance Metrics:', 20, yPosition);
      yPosition += 10;
      
      const keyMetrics = [
        ['Series Name', seriesData.name],
        ['Status', seriesData.status],
        ['Funds Raised', formatCurrency(seriesData.fundsRaised)],
        ['Target Amount', formatCurrency(seriesData.targetAmount)],
        ['Progress', seriesData.progress + '%'],
        ['Total Investors', seriesData.investors.toString()],
        ['Interest Rate', seriesData.interestRate + '% p.a.'],
        ['Interest Frequency', seriesData.interestFrequency]
      ];
      
      keyMetrics.forEach(([label, value]) => {
        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);
        doc.text(label + ': ' + value, 25, yPosition);
        yPosition += 8;
      });
      
      yPosition += 10;
      
      // Series Details
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text('Series Details:', 20, yPosition);
      yPosition += 10;
      
      const seriesDetails = [
        ['Issue Date', seriesData.issueDate],
        ['Maturity Date', seriesData.maturityDate],
        ['Face Value', formatCurrencyFull(seriesData.faceValue)],
        ['Minimum Investment', formatCurrencyFull(seriesData.minInvestment)],
        ['Tenor', calculateTenor(seriesData.issueDate, seriesData.maturityDate)]
      ];
      
      seriesDetails.forEach(([label, value]) => {
        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);
        doc.text(label + ': ' + value, 25, yPosition);
        yPosition += 8;
      });
      
      yPosition += 15;
      
      // Payout Schedule
      if (yPosition > pageHeight - 100) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(16);
      doc.setTextColor(40, 40, 40);
      doc.text('Upcoming Payout Schedule', 20, yPosition);
      yPosition += 15;
      
      if (getUpcomingPayoutData && getUpcomingPayoutData.length > 0) {
        doc.setFontSize(12);
        doc.text('Next Month Interest Payout Details:', 20, yPosition);
        yPosition += 10;
        
        // Summary information
        const totalAmount = getUpcomingPayoutData.reduce((sum, p) => sum + p.amount, 0);
        const upcomingMonth = getUpcomingPayoutData[0]?.interestMonth;
        const payoutDate = getUpcomingPayoutData[0]?.interestDate;
        
        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);
        doc.text('Payout Month: ' + upcomingMonth, 25, yPosition);
        yPosition += 6;
        doc.text('Payout Date: ' + payoutDate, 25, yPosition);
        yPosition += 6;
        doc.text('Total Amount: ' + formatCurrencyFull(totalAmount), 25, yPosition);
        yPosition += 6;
        doc.text('Total Investors: ' + getUpcomingPayoutData.length, 25, yPosition);
        yPosition += 12;
        
        // Individual investor details
        doc.setFontSize(12);
        doc.text('Individual Investor Payouts:', 20, yPosition);
        yPosition += 10;
        
        getUpcomingPayoutData.forEach((payout, index) => {
          if (yPosition > pageHeight - 25) {
            doc.addPage();
            yPosition = 20;
          }
          
          doc.setFontSize(9);
          doc.setTextColor(60, 60, 60);
          doc.text((index + 1) + '. ' + payout.investorName + ' (' + payout.investorId + ')', 25, yPosition);
          yPosition += 5;
          doc.text('   Amount: ₹' + payout.amount.toLocaleString('en-IN') + ', Status: ' + payout.status, 30, yPosition);
          yPosition += 5;
          doc.text('   Bank: ' + payout.bankName + ' | A/C: ' + payout.bankAccountNumber + ' | IFSC: ' + payout.ifscCode, 30, yPosition);
          yPosition += 8;
        });
      } else {
        doc.setFontSize(12);
        doc.setTextColor(100, 100, 100);
        if (seriesData.status === 'Yet to be approved') {
          doc.text('No payout schedule available - Series pending board approval', 20, yPosition);
        } else if (seriesData.status === 'Releasing soon') {
          doc.text('No payout schedule available - Series not yet released', 20, yPosition);
        } else {
          doc.text('No upcoming payout data available - Series may be too new or have no investors', 20, yPosition);
        }
        yPosition += 15;
      }
      
      yPosition += 10;
      
      // Recent Transactions
      if (yPosition > pageHeight - 100) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(16);
      doc.setTextColor(40, 40, 40);
      doc.text('Recent Transactions', 20, yPosition);
      yPosition += 15;
      
      if (seriesData.transactions && seriesData.transactions.length > 0) {
        doc.setFontSize(12);
        doc.text('Latest Transaction Activity:', 20, yPosition);
        yPosition += 10;
        
        seriesData.transactions.forEach((transaction, index) => {
          if (yPosition > pageHeight - 25) {
            doc.addPage();
            yPosition = 20;
          }
          
          doc.setFontSize(10);
          doc.setTextColor(60, 60, 60);
          doc.text((index + 1) + '. ' + transaction.date + ' - ' + transaction.investor, 25, yPosition);
          yPosition += 6;
          doc.text('   Type: ' + transaction.type + ', Amount: ₹' + transaction.amount.toLocaleString('en-IN'), 30, yPosition);
          yPosition += 12;
        });
      } else {
        doc.setFontSize(12);
        doc.setTextColor(100, 100, 100);
        if (seriesData.status === 'Yet to be approved') {
          doc.text('No transactions available - Series pending board approval', 20, yPosition);
        } else if (seriesData.status === 'Releasing soon') {
          doc.text('No transactions available - Series not yet released', 20, yPosition);
        } else {
          doc.text('No transactions available', 20, yPosition);
        }
        yPosition += 15;
      }
      
      yPosition += 15;
      
      // Investment Analysis
      if (yPosition > pageHeight - 80) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(16);
      doc.setTextColor(40, 40, 40);
      doc.text('Investment Analysis', 20, yPosition);
      yPosition += 15;
      
      doc.setFontSize(12);
      doc.text('Performance Analysis:', 20, yPosition);
      yPosition += 10;
      
      const analysisData = [
        ['Subscription Ratio', seriesData.progress + '%'],
        ['Average Investment per Investor', formatCurrency(seriesData.fundsRaised / seriesData.investors)],
        ['Monthly Interest per Investor', formatCurrency((seriesData.fundsRaised / seriesData.investors) * (seriesData.interestRate / 100) / 12)],
        ['Annual Interest Payout', formatCurrency(seriesData.fundsRaised * (seriesData.interestRate / 100))],
        ['Remaining Target', formatCurrency(seriesData.targetAmount - seriesData.fundsRaised)],
        ['Days to Maturity', calculateDaysToMaturity(seriesData.maturityDate)]
      ];
      
      analysisData.forEach(([label, value]) => {
        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);
        doc.text(label + ': ' + value, 25, yPosition);
        yPosition += 8;
      });
      
      // Risk Factors
      yPosition += 15;
      
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text('Risk Factors & Disclaimers:', 20, yPosition);
      yPosition += 10;
      
      const riskFactors = [
        'Interest rate risk due to market fluctuations',
        'Credit risk associated with the issuer',
        'Liquidity risk as NCDs may not be easily tradeable',
        'Early redemption may not be available',
        'Tax implications as per prevailing tax laws'
      ];
      
      riskFactors.forEach((risk, index) => {
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.text((index + 1) + '. ' + risk, 25, yPosition);
        yPosition += 7;
      });
      
      // Footer
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('© 2026 LOANFRONT | All Rights Reserved', pageWidth / 2, pageHeight - 10, { align: 'center' });
        doc.text('Page ' + i + ' of ' + totalPages, pageWidth - 30, pageHeight - 10);
        doc.text('Confidential Series Report', 20, pageHeight - 10);
      }
      
      // Save the PDF
      const fileName = seriesData.name.replace(/\s+/g, '_') + '_Report_' + new Date().toISOString().split('T')[0] + '.pdf';
      doc.save(fileName);
      
      // Add audit log for document download
      addAuditLog({
        action: 'Downloaded Report',
        adminName: user ? user.name : 'Admin',
        adminRole: user ? user.displayRole : 'Admin',
        details: `Downloaded Series Report for "${seriesData.name}" (PDF format)`,
        entityType: 'Series',
        entityId: seriesData.name,
        changes: {
          documentType: 'Series Report',
          fileName: fileName,
          format: 'PDF'
        }
      });
      
      console.log('Series PDF generated successfully:', fileName);
    } catch (error) {
      console.error('Error generating series PDF:', error);
      alert('Error generating PDF: ' + error.message);
    }
  };

  // Helper functions
  const calculateTenor = (issueDate, maturityDate) => {
    const issue = new Date(issueDate.split('/').reverse().join('-'));
    const maturity = new Date(maturityDate.split('/').reverse().join('-'));
    const diffTime = Math.abs(maturity - issue);
    const diffYears = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 365));
    return diffYears + ' years';
  };

  const calculateDaysToMaturity = (maturityDate) => {
    const maturity = new Date(maturityDate.split('/').reverse().join('-'));
    const today = new Date();
    const diffTime = maturity - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays + ' days' : 'Matured';
  };

  // Document upload functions
  const handleDocumentUpload = (investorId, investorName) => {
    setSelectedInvestorForUpload({ id: investorId, name: investorName });
    setShowDocumentUploadModal(true);
    setUploadDocuments({
      form15G: null,
      form15H: null,
      bondPaper: null
    });
  };

  const handleFileUpload = (documentType, file) => {
    if (file) {
      console.log(`Uploading ${documentType}:`, file.name);
      
      // Read the file as base64 for storage
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileData = {
          name: file.name,
          type: file.type,
          size: file.size,
          data: e.target.result, // This contains the base64 data
          lastModified: file.lastModified
        };
        
        setUploadDocuments(prev => ({
          ...prev,
          [documentType]: fileData
        }));
      };
      
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = (inputId) => {
    const fileInput = document.getElementById(inputId);
    if (fileInput) {
      fileInput.click();
    }
  };

  const handleUploadSubmit = () => {
    if (!selectedInvestorForUpload) return;

    const uploadedDocs = [];
    const timestamp = new Date().toISOString();
    const uploadDate = new Date().toLocaleDateString('en-GB');

    // Process each document type
    Object.entries(uploadDocuments).forEach(([docType, fileData]) => {
      if (fileData) {
        const documentName = docType === 'form15G' ? '15G Document' : 
                           docType === 'form15H' ? '15H Document' : 
                           'Bond Paper Document';
        
        const documentRecord = {
          type: documentName,
          fileName: fileData.name,
          fileType: fileData.type,
          fileSize: fileData.size,
          fileData: fileData.data, // Store the base64 data
          uploadDate: uploadDate,
          timestamp: timestamp,
          seriesName: seriesData.name,
          uploadedBy: user ? user.name : 'Admin',
          uploadedByRole: user ? user.displayRole : 'Admin'
        };
        
        uploadedDocs.push(documentRecord);

        // Add document to investor's record
        if (addInvestorDocument) {
          addInvestorDocument(selectedInvestorForUpload.id, documentRecord);
        }
      }
    });

    if (uploadedDocs.length > 0) {
      // Add audit log for document uploads
      addAuditLog({
        action: 'Uploaded Documents',
        adminName: user ? user.name : 'Admin',
        adminRole: user ? user.displayRole : 'Admin',
        details: `Uploaded ${uploadedDocs.length} document(s) for investor "${selectedInvestorForUpload.name}" (ID: ${selectedInvestorForUpload.id}) in series "${seriesData.name}": ${uploadedDocs.map(doc => doc.type).join(', ')}`,
        entityType: 'Document',
        entityId: selectedInvestorForUpload.id,
        changes: {
          investorName: selectedInvestorForUpload.name,
          investorId: selectedInvestorForUpload.id,
          seriesName: seriesData.name,
          documentsUploaded: uploadedDocs.map(doc => ({
            type: doc.type,
            fileName: doc.fileName,
            fileSize: doc.fileSize
          })),
          uploadCount: uploadedDocs.length
        }
      });

      alert(`Successfully uploaded ${uploadedDocs.length} document(s) for ${selectedInvestorForUpload.name}`);
      setShowDocumentUploadModal(false);
      setSelectedInvestorForUpload(null);
      setUploadDocuments({
        form15G: null,
        form15H: null,
        bondPaper: null
      });
    } else {
      alert('Please select at least one document to upload.');
    }
  };

  return (
    <Layout>
      <div className="series-details-page">
        {/* Header Section */}
        <div className="series-header-section">
          <div className="header-left">
            <button className="back-button" onClick={handleBackNavigation}>
              <HiArrowLeft size={24} />
            </button>
            <div className="series-title-section">
              <h1 className="series-name">{seriesData.name}</h1>
              <div className="series-meta">
                <span className={`status-badge ${seriesData.status.toLowerCase().replace(/\s+/g, '-')}`}>
                  {seriesData.status}
                </span>
              </div>
            </div>
          </div>
          <button className="export-button" onClick={generateSeriesPDF}>
            <MdOutlineFileDownload size={18} /> Export Report
          </button>
        </div>

        {/* Series Insights Cards - Lock-in and Maturity Details */}
        {getSeriesInsights && seriesData && (
          <div className="series-insights-grid">
            {/* Lock-in Details Card */}
            {getSeriesInsights.lockIn && (
              <div className="insight-card lock-in-card">
                <div className="insight-header">
                  <h3 className="insight-title">Lock-in Period Details</h3>
                  <div className="insight-icon lock-in-icon">
                    <FiLock size={18} />
                  </div>
                </div>
                <div className="insight-content">
                  <div className="insight-main-info">
                    <div className="insight-date">
                      <span className="insight-label">Lock-in End Date</span>
                      <span className="insight-value">{getSeriesInsights.lockIn.lockInEndDate}</span>
                    </div>
                    <div className="insight-days">
                      <span className="insight-label">Days</span>
                      <span className={`insight-days-value ${getSeriesInsights.lockIn.isActive ? 'active' : 'completed'}`}>
                        {getSeriesInsights.lockIn.isActive ? `+${getSeriesInsights.lockIn.daysLeft}` : `-${Math.abs(getSeriesInsights.lockIn.daysLeft)}`}
                      </span>
                    </div>
                  </div>
                  <div className="insight-details">
                    <div className="insight-detail-item">
                      <span className="detail-label">Investors Left After Lock-in</span>
                      <span className="detail-value">{getSeriesInsights.lockIn.investorsLeft}</span>
                    </div>
                    <div className="insight-detail-item">
                      <span className="detail-label">Amount After Lock-in</span>
                      <span className="detail-value">{formatCurrency(getSeriesInsights.lockIn.amountAfterLockIn)}</span>
                    </div>
                    <div className="insight-detail-item">
                      <span className="detail-label">Remaining Investors</span>
                      <span className="detail-value">{getSeriesInsights.lockIn.remainingInvestors}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Maturity Details Card */}
            {getSeriesInsights.maturity && (
              <div className="insight-card maturity-card">
                <div className="insight-header">
                  <h3 className="insight-title">Maturity Period Details</h3>
                  <div className="insight-icon maturity-icon">
                    <FiCalendar size={18} />
                  </div>
                </div>
                <div className="insight-content">
                  <div className="insight-main-info">
                    <div className="insight-date">
                      <span className="insight-label">Maturity Date</span>
                      <span className="insight-value">{getSeriesInsights.maturity.maturityDate}</span>
                    </div>
                    <div className="insight-days">
                      <span className="insight-label">Days</span>
                      <span className={`insight-days-value ${getSeriesInsights.maturity.isMatured ? 'matured' : 'active'}`}>
                        {getSeriesInsights.maturity.isMatured ? `-${Math.abs(getSeriesInsights.maturity.daysLeft)}` : `+${getSeriesInsights.maturity.daysLeft}`}
                      </span>
                    </div>
                  </div>
                  <div className="insight-details">
                    <div className="insight-detail-item">
                      <span className="detail-label">Active Investors Count</span>
                      <span className="detail-value">{getSeriesInsights.maturity.activeInvestorsCount}</span>
                    </div>
                    <div className="insight-detail-item">
                      <span className="detail-label">Remaining Funds</span>
                      <span className="detail-value remaining-funds">{formatCurrency(getSeriesInsights.maturity.remainingFundsAtMaturity)}</span>
                    </div>
                    <div className="insight-detail-item">
                      <span className="detail-label">Series Status</span>
                      <span className="detail-value">{getSeriesInsights.maturity.realSeriesStatus}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Key Metrics Cards */}
        <div className="metrics-grid">
          <div className="metric-card clickable-card" onClick={() => setShowFundsModal(true)}>
            <div className="metric-icon green">
              <MdCurrencyRupee size={24} />
            </div>
            <div className="metric-content">
              <span className="metric-label">Funds Raised</span>
              <span className="metric-value">{formatCurrency(seriesData.fundsRaised)}</span>
            </div>
          </div>
          <div className="metric-card clickable-card" onClick={() => setShowInvestorsModal(true)}>
            <div className="metric-icon grey">
              <FiUsers size={24} />
            </div>
            <div className="metric-content">
              <span className="metric-label">Investors</span>
              <span className="metric-value">{seriesData.investors}</span>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon yellow">
              <FiPercent size={24} />
            </div>
            <div className="metric-content">
              <span className="metric-label">Interest Rate</span>
              <span className="metric-value">{seriesData.interestRate}%</span>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon blue">
              <FiTrendingUp size={24} />
            </div>
            <div className="metric-content">
              <span className="metric-label">Progress</span>
              <span className="metric-value">{seriesData.progress}%</span>
            </div>
          </div>
        </div>

        {/* Series Details and Payout Schedule - Side by Side, Fixed Height, No Scrolling */}
        <div className="details-payout-container">
          <div className="series-details-card">
            <h2 className="card-title">Series Details</h2>
            <div className="details-list">
              <div className="detail-row">
                <div className="detail-item">
                  <div className="detail-content">
                    <div className="detail-label-with-icon">
                      <HiOutlineCalendar className="detail-icon" />
                      <span className="detail-label">Issue Date</span>
                    </div>
                    <span className="detail-value">{seriesData.issueDate}</span>
                  </div>
                </div>
              </div>
              <div className="detail-row">
                <div className="detail-item">
                  <div className="detail-content">
                    <div className="detail-label-with-icon">
                      <HiOutlineCalendar className="detail-icon" />
                      <span className="detail-label">Maturity Date</span>
                    </div>
                    <span className="detail-value">{seriesData.maturityDate}</span>
                  </div>
                </div>
              </div>
              <div className="detail-row">
                <div className="detail-item">
                  <div className="detail-content">
                    <span className="detail-label">Interest Frequency</span>
                    <span className="frequency-badge">{seriesData.interestFrequency}</span>
                  </div>
                </div>
              </div>
              <div className="detail-row">
                <div className="detail-item">
                  <div className="detail-content">
                    <span className="detail-label">Face Value</span>
                    <span className="detail-value">{formatCurrencyFull(seriesData.faceValue)}</span>
                  </div>
                </div>
              </div>
              <div className="detail-row">
                <div className="detail-item">
                  <div className="detail-content">
                    <span className="detail-label">Minimum Investment</span>
                    <span className="detail-value">{formatCurrencyFull(seriesData.minInvestment)}</span>
                  </div>
                </div>
              </div>
              <div className="detail-row">
                <div className="detail-item">
                  <div className="detail-content">
                    <span className="detail-label">Target Amount</span>
                    <span className="detail-value">{formatCurrency(seriesData.targetAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="payout-schedule-card">
            <h2 className="card-title">Payout Schedule</h2>
            <div className="payout-schedule-content">
              {getUpcomingPayoutData && getUpcomingPayoutData.length > 0 ? (
                <>
                  <div className="payout-schedule-header">
                    <div className="schedule-info">
                      <span className="schedule-month">Upcoming Month: {getUpcomingPayoutData[0]?.interestMonth}</span>
                      <span className="schedule-date">Payout Date: {getUpcomingPayoutData[0]?.interestDate}</span>
                    </div>
                    <div className="schedule-summary">
                      <span className="total-amount">
                        Total: {formatCurrency(getUpcomingPayoutData.reduce((sum, p) => sum + p.amount, 0))}
                      </span>
                      <span className="total-investors">
                        {getUpcomingPayoutData.length} Investors
                      </span>
                    </div>
                  </div>
                  
                  <div className="payout-schedule-table-container">
                    <table className="payout-schedule-table">
                      <thead>
                        <tr>
                          <th>Investor</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Bank Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getUpcomingPayoutData.map((payout) => (
                          <tr key={payout.id}>
                            <td>
                              <div className="investor-info">
                                <div className="investor-name">{payout.investorName}</div>
                                <div className="investor-id">{payout.investorId}</div>
                              </div>
                            </td>
                            <td className="amount-cell">
                              ₹{payout.amount.toLocaleString('en-IN')}
                            </td>
                            <td>
                              <span className={`status-badge ${payout.status.toLowerCase()}`}>
                                {payout.status}
                              </span>
                            </td>
                            <td>
                              <div className="bank-info">
                                <div className="bank-name">{payout.bankName}</div>
                                <div className="bank-details">
                                  {payout.bankAccountNumber} | {payout.ifscCode}
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="no-payouts">
                  <p>No upcoming payout data available</p>
                  {seriesData.status === 'Yet to be approved' && (
                    <p className="draft-message">Payout schedule will be generated after series approval.</p>
                  )}
                  {seriesData.status === 'Releasing soon' && (
                    <p className="draft-message">Payout schedule will be available after series release.</p>
                  )}
                  {seriesData.status === 'Active' && (
                    <p className="draft-message">
                      No upcoming payouts available. This may be because:
                      <br />• Series is too new (less than 30 days old)
                      <br />• No investors have been added to this series yet
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Rejection Reason Section - Only show for rejected series */}
        {seriesData.status === 'REJECTED' && seriesData.rejectionReason && (
          <div className="rejection-section">
            <div className="rejection-card">
              <h2 className="rejection-title">Rejection Details</h2>
              <div className="rejection-content">
                <div className="rejection-info">
                  <span className="rejection-label">Rejected On:</span>
                  <span className="rejection-date">
                    {seriesData.rejectedAt ? new Date(seriesData.rejectedAt).toLocaleDateString('en-GB') : 'N/A'}
                  </span>
                </div>
                <div className="rejection-reason-box">
                  <h3 className="reason-title">Reason for Rejection:</h3>
                  <p className="reason-text">{seriesData.rejectionReason}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Investor Documents */}
        <div className="documents-section">
          <h2 className="section-title">Investor Documents</h2>
          <div className="documents-table-card">
            {investorDetails && investorDetails.length > 0 ? (
              <table className="documents-table">
                <thead>
                  <tr>
                    <th>Investor Name</th>
                    <th>Investor ID</th>
                    <th>Amount Invested</th>
                    <th>Investment Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {investorDetails.map((inv, index) => {
                    // Find the investment timestamp for this investor in this series
                    const investorData = seriesInvestors.find(investor => investor.investorId === inv.investorId);
                    const seriesInvestment = investorData?.investments?.find(investment => investment.seriesName === seriesData.name);
                    const investmentDate = seriesInvestment?.date || 'N/A';
                    const investmentTimestamp = seriesInvestment?.timestamp;
                    
                    return (
                      <tr key={index}>
                        <td>{inv.name}</td>
                        <td>
                          <span className="investor-id-badge">{inv.investorId}</span>
                        </td>
                        <td className="amount-cell">₹{inv.amount.toLocaleString('en-IN')}</td>
                        <td>
                          <div className="date-time-cell">
                            <div className="date">{investmentDate}</div>
                            {investmentTimestamp && (
                              <div className="time">
                                {new Date(investmentTimestamp).toLocaleTimeString('en-IN', { 
                                  hour: '2-digit', 
                                  minute: '2-digit',
                                  hour12: true 
                                })}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <button 
                            className="upload-button"
                            onClick={() => handleDocumentUpload(inv.investorId, inv.name)}
                          >
                            Upload
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="no-documents">
                <p>No investors in this series yet</p>
                <p className="draft-message">Investor documents will appear here once investments are made in this series.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="transactions-section">
          <h2 className="section-title">Recent Transactions</h2>
          <div className="transactions-table-card">
            {seriesData.transactions && seriesData.transactions.length > 0 ? (
              <div className="recent-transactions-table-container">
                <table className="transactions-table">
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>Investor Name</th>
                      <th>Investor ID</th>
                      <th>Type</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seriesData.transactions.map((transaction, index) => (
                      <tr key={index}>
                        <td>
                          <div className="date-time-cell">
                            <div className="date">{transaction.date}</div>
                            {transaction.timestamp && (
                              <div className="time">
                                {new Date(transaction.timestamp).toLocaleTimeString('en-IN', { 
                                  hour: '2-digit', 
                                  minute: '2-digit',
                                  hour12: true 
                                })}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>{transaction.investor}</td>
                        <td>
                          <span className="investor-id-badge">{transaction.investorId}</span>
                        </td>
                        <td>
                          <span className={`type-badge ${transaction.type}`}>
                            {transaction.type}
                          </span>
                        </td>
                        <td className="amount-cell">{formatCurrencyFull(transaction.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="no-transactions">
                <p>No transactions available</p>
                {seriesData.status === 'Yet to be approved' && (
                  <p className="draft-message">Series is pending board approval. Transactions will appear after release.</p>
                )}
                {seriesData.status === 'Releasing soon' && (
                  <p className="draft-message">Series is approved but not yet released. Transactions will appear after release date.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Funds Raised Modal */}
        {showFundsModal && (
          <div className="modal-overlay" onClick={() => setShowFundsModal(false)}>
            <div className="modal-content funds-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Funds Raised - {seriesData.name}</h2>
                <button className="close-button" onClick={() => setShowFundsModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="modal-summary">
                  <p><strong>Total Funds Raised:</strong> {formatCurrency(seriesData.fundsRaised)}</p>
                  <p><strong>Total Investors:</strong> {investorDetails.length}</p>
                </div>
                <table className="modal-table">
                  <thead>
                    <tr>
                      <th>Investor Name</th>
                      <th>Investor ID</th>
                      <th>Amount Invested</th>
                    </tr>
                  </thead>
                  <tbody>
                    {investorDetails.map((inv, index) => (
                      <tr key={index}>
                        <td>{inv.name}</td>
                        <td>{inv.investorId}</td>
                        <td>₹{inv.amount.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                    {investorDetails.length === 0 && (
                      <tr>
                        <td colSpan="3" style={{textAlign: 'center', padding: '20px', color: '#64748b'}}>
                          No investors yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Investors Modal */}
        {showInvestorsModal && (
          <div className="modal-overlay" onClick={() => setShowInvestorsModal(false)}>
            <div className="modal-content investors-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Investors - {seriesData.name}</h2>
                <button className="close-button" onClick={() => setShowInvestorsModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="modal-summary">
                  <p><strong>Total Investors:</strong> {investorDetails.length}</p>
                </div>
                <table className="modal-table">
                  <thead>
                    <tr>
                      <th>Investor Name</th>
                      <th>Investor ID</th>
                      <th>KYC Status</th>
                      <th>Investment Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {investorDetails.map((inv, index) => (
                      <tr key={index}>
                        <td>{inv.name}</td>
                        <td>{inv.investorId}</td>
                        <td>
                          <span className={`status-badge ${inv.kycStatus.toLowerCase()}`}>
                            {inv.kycStatus}
                          </span>
                        </td>
                        <td>₹{inv.amount.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                    {investorDetails.length === 0 && (
                      <tr>
                        <td colSpan="4" style={{textAlign: 'center', padding: '20px', color: '#64748b'}}>
                          No investors yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {/* Document Upload Modal */}
        {showDocumentUploadModal && selectedInvestorForUpload && (
          <div className="modal-overlay" onClick={() => setShowDocumentUploadModal(false)}>
            <div className="modal-content document-upload-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Upload Documents - {selectedInvestorForUpload.name}</h2>
                <button className="close-button" onClick={() => setShowDocumentUploadModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="upload-info">
                  <p><strong>Investor:</strong> {selectedInvestorForUpload.name}</p>
                  <p><strong>Investor ID:</strong> {selectedInvestorForUpload.id}</p>
                  <p><strong>Series:</strong> {seriesData.name}</p>
                </div>
                
                <div className="upload-sections">
                  {/* 15G Document Upload */}
                  <div className="upload-section">
                    <h3>15G Document</h3>
                    <div className="file-upload-area" onClick={() => triggerFileInput('form15G-upload')}>
                      <input
                        type="file"
                        id="form15G-upload"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={(e) => {
                          console.log('15G file selected:', e.target.files[0]);
                          handleFileUpload('form15G', e.target.files[0]);
                        }}
                        style={{ display: 'none' }}
                      />
                      <div className="upload-content">
                        <div className="upload-icon">📄</div>
                        <div className="upload-text">
                          {uploadDocuments.form15G ? (
                            <span style={{ color: '#10b981', fontWeight: '600' }}>
                              ✓ {uploadDocuments.form15G.name}
                            </span>
                          ) : (
                            'Click to upload 15G document'
                          )}
                        </div>
                        <div className="upload-hint">PDF, JPG, PNG, DOC files supported</div>
                      </div>
                    </div>
                  </div>

                  {/* 15H Document Upload */}
                  <div className="upload-section">
                    <h3>15H Document</h3>
                    <div className="file-upload-area" onClick={() => triggerFileInput('form15H-upload')}>
                      <input
                        type="file"
                        id="form15H-upload"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={(e) => {
                          console.log('15H file selected:', e.target.files[0]);
                          handleFileUpload('form15H', e.target.files[0]);
                        }}
                        style={{ display: 'none' }}
                      />
                      <div className="upload-content">
                        <div className="upload-icon">📄</div>
                        <div className="upload-text">
                          {uploadDocuments.form15H ? (
                            <span style={{ color: '#10b981', fontWeight: '600' }}>
                              ✓ {uploadDocuments.form15H.name}
                            </span>
                          ) : (
                            'Click to upload 15H document'
                          )}
                        </div>
                        <div className="upload-hint">PDF, JPG, PNG, DOC files supported</div>
                      </div>
                    </div>
                  </div>

                  {/* Bond Paper Document Upload */}
                  <div className="upload-section">
                    <h3>Bond Paper Document</h3>
                    <div className="file-upload-area" onClick={() => triggerFileInput('bondPaper-upload')}>
                      <input
                        type="file"
                        id="bondPaper-upload"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={(e) => {
                          console.log('Bond Paper file selected:', e.target.files[0]);
                          handleFileUpload('bondPaper', e.target.files[0]);
                        }}
                        style={{ display: 'none' }}
                      />
                      <div className="upload-content">
                        <div className="upload-icon">📄</div>
                        <div className="upload-text">
                          {uploadDocuments.bondPaper ? (
                            <span style={{ color: '#10b981', fontWeight: '600' }}>
                              ✓ {uploadDocuments.bondPaper.name}
                            </span>
                          ) : (
                            'Click to upload bond paper document'
                          )}
                        </div>
                        <div className="upload-hint">PDF, JPG, PNG, DOC files supported</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-actions">
                  <button className="cancel-button" onClick={() => setShowDocumentUploadModal(false)}>
                    Cancel
                  </button>
                  <button className="upload-submit-button" onClick={handleUploadSubmit}>
                    Upload Documents
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SeriesDetails;

