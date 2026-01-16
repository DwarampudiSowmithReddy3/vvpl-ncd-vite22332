import React, { useState } from 'react';
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
  FiTrendingUp
} from 'react-icons/fi';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const SeriesDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { series = [], investors = [], addAuditLog } = useData();
  const { user } = useAuth();
  const [showFundsModal, setShowFundsModal] = useState(false);
  const [showInvestorsModal, setShowInvestorsModal] = useState(false);

  // Check if we came from investor details by looking at the referrer or state
  const handleBackNavigation = () => {
    // Check if there's a previous page in history
    if (window.history.length > 1) {
      navigate(-1); // Go back to previous page
    } else {
      navigate('/ncd-series'); // Default fallback
    }
  };

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
        interestFrequency: 'Quarterly',
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
        interestFrequency: 'Quarterly',
        faceValue: 1000,
        minInvestment: 15000,
        targetAmount: 50000000
      }
    };
    
    return seriesData[seriesId] || seriesData['1'];
  };

  const defaultSeries = {
    ...getDefaultSeriesData(id),
    payouts: [
      {
        id: 1,
        date: '1/2/2024',
        investors: 95,
        status: 'scheduled',
        amount: 831250
      },
      {
        id: 2,
        date: '1/5/2024',
        investors: 95,
        status: 'scheduled',
        amount: 831250
      },
      {
        id: 3,
        date: '1/8/2024',
        investors: 95,
        status: 'scheduled',
        amount: 831250
      },
      {
        id: 4,
        date: '1/11/2023',
        investors: 89,
        status: 'completed',
        amount: 787500
      }
    ],
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
        payouts: [], // No fake payouts - will be calculated from real data
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
      doc.text('Payout Schedule', 20, yPosition);
      yPosition += 15;
      
      doc.setFontSize(12);
      doc.text('Scheduled Interest Payouts:', 20, yPosition);
      yPosition += 10;
      
      seriesData.payouts.forEach((payout, index) => {
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);
        doc.text((index + 1) + '. Payout Date: ' + payout.date, 25, yPosition);
        yPosition += 6;
        doc.text('   Amount: ' + formatCurrencyFull(payout.amount) + ', Investors: ' + payout.investors, 30, yPosition);
        yPosition += 6;
        doc.text('   Status: ' + payout.status.charAt(0).toUpperCase() + payout.status.slice(1), 30, yPosition);
        yPosition += 12;
      });
      
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
        ['Quarterly Interest per Investor', formatCurrency((seriesData.fundsRaised / seriesData.investors) * (seriesData.interestRate / 100) / 4)],
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

        {/* Main Content Grid */}
        <div className="details-grid">
          {/* Left Column - Series Details */}
          <div className="details-card">
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

          {/* Right Column - Payout Schedule */}
          <div className="details-card">
            <h2 className="card-title">Payout Schedule</h2>
            <div className="payouts-list">
              {seriesData.payouts && seriesData.payouts.length > 0 ? (
                seriesData.payouts.map((payout) => (
                  <div key={payout.id} className="payout-card">
                    <div className="payout-header">
                      <div className="payout-title">
                        <HiOutlineCalendar className="payout-icon" />
                        <span>Payout {payout.id}</span>
                      </div>
                      <span className={`payout-status ${payout.status}`}>
                        {payout.status}
                      </span>
                    </div>
                    <div className="payout-date">{payout.date}</div>
                    <div className="payout-details">{payout.investors} investors</div>
                    <div className="payout-amount">{formatCurrencyFull(payout.amount)}</div>
                  </div>
                ))
              ) : (
                <div className="no-payouts">
                  <HiOutlineCalendar size={48} style={{ opacity: 0.3 }} />
                  <p>No payout schedule available</p>
                  {seriesData.status === 'Yet to be approved' && (
                    <p className="draft-message">Series is pending board approval. Payout schedule will be generated after release.</p>
                  )}
                  {seriesData.status === 'Releasing soon' && (
                    <p className="draft-message">Series is approved but not yet released. Payout schedule will be generated after release date.</p>
                  )}
                  {seriesData.status === 'Active' && seriesData.fundsRaised === 0 && (
                    <p className="draft-message">No investments yet. Payout schedule will be generated once investments are made.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="transactions-section">
          <h2 className="section-title">Recent Transactions</h2>
          <div className="transactions-table-card">
            {seriesData.transactions && seriesData.transactions.length > 0 ? (
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
      </div>
    </Layout>
  );
};

export default SeriesDetails;

