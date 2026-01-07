import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import Layout from '../components/Layout';
import './InvestorDetails.css';
import { 
  HiArrowLeft, 
  HiOutlineMail, 
  HiOutlinePhone, 
  HiOutlineCreditCard,
  HiOutlineCalendar,
  HiOutlineLocationMarker,
  HiOutlineDocumentText,
  HiCheckCircle
} from 'react-icons/hi';
import { MdAccountBalance } from 'react-icons/md';
import { MdOutlineFileDownload } from 'react-icons/md';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const InvestorDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { investors = [] } = useData();

  // Hardcoded default data
  const defaultInvestor = {
    id: id || '1',
    name: 'Rajesh Kumar',
    investorId: 'INV-001',
    email: 'rajesh.kumar@email.com',
    phone: '+91 98765 43210',
    pan: 'ABCDE1234F',
    dateJoined: '15/6/2023',
    address: '123, MG Road, Bangalore, Karnataka - 560001',
    bankAccount: 'HDFC Bank - ****5678',
    kycStatus: 'Verified',
    totalInvestment: 1500000,
    activeHoldings: 3,
    holdings: [
      {
        series: 'Series A',
        purchaseDate: '25/6/2023',
        units: '500',
        investment: 500000,
        nextPayout: '1/2/2024',
        status: 'Active'
      },
      {
        series: 'Series B',
        purchaseDate: '20/9/2023',
        units: '1000',
        investment: 1000000,
        nextPayout: '5/2/2024',
        status: 'Active'
      }
    ],
    kycDocuments: [
      { name: 'PAN Card', uploadedDate: '20/6/2023', status: 'Verified' },
      { name: 'Aadhaar Card', uploadedDate: '20/6/2023', status: 'Verified' },
      { name: 'Bank Statement', uploadedDate: '20/6/2023', status: 'Verified' },
      { name: 'Cancelled Cheque', uploadedDate: '20/6/2023', status: 'Verified' }
    ],
    transactions: [
      { type: 'Interest Credit', series: 'Series A', date: '2024-01-10', amount: 11875 },
      { type: 'Interest Credit', series: 'Series B', date: '2024-01-05', amount: 25000 },
      { type: 'Interest Credit', series: 'Series A', date: '2023-11-01', amount: 11875 },
      { type: 'Interest Credit', series: 'Series B', date: '2023-10-05', amount: 25000 }
    ]
  };

  // Find investor by ID, or use default data
  let investor = defaultInvestor;
  
  if (investors && investors.length > 0 && id) {
    const foundInvestor = investors.find(inv => inv.id === parseInt(id));
    if (foundInvestor) {
      investor = {
        id: foundInvestor.id,
        name: foundInvestor.name,
        investorId: foundInvestor.investorId || `INV-${String(foundInvestor.id).padStart(3, '0')}`,
        email: foundInvestor.email,
        phone: foundInvestor.phone,
        pan: foundInvestor.pan || defaultInvestor.pan,
        dateJoined: foundInvestor.dateJoined,
        address: foundInvestor.address || defaultInvestor.address,
        bankAccount: foundInvestor.bankAccount || defaultInvestor.bankAccount,
        kycStatus: foundInvestor.kycStatus === 'Completed' ? 'Verified' : (foundInvestor.kycStatus === 'Rejected' ? 'Rejected' : 'Pending'),
        totalInvestment: foundInvestor.investment || defaultInvestor.totalInvestment,
        activeHoldings: foundInvestor.series?.length || defaultInvestor.activeHoldings,
        holdings: defaultInvestor.holdings,
        kycDocuments: defaultInvestor.kycDocuments,
        transactions: defaultInvestor.transactions
      };
    }
  }

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const generatePDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      
      // Company Header
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.text('LOANFRONT', pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text('Investor Profile Report', pageWidth / 2, 30, { align: 'center' });
      
      // Add line separator
      doc.setDrawColor(200, 200, 200);
      doc.line(20, 35, pageWidth - 20, 35);
      
      let yPosition = 50;
      
      // Investor Name and KYC Status
      doc.setFontSize(18);
      doc.setTextColor(40, 40, 40);
      doc.text(investor.name, 20, yPosition);
      
      // KYC Badge
      const kycText = investor.kycStatus === 'Verified' ? 'KYC VERIFIED' : 
                     investor.kycStatus === 'Rejected' ? 'KYC REJECTED' : 'KYC PENDING';
      const kycColor = investor.kycStatus === 'Verified' ? [29, 78, 216] : 
                      investor.kycStatus === 'Rejected' ? [220, 38, 38] : [245, 158, 11];
      
      doc.setFontSize(10);
      doc.setTextColor(kycColor[0], kycColor[1], kycColor[2]);
      doc.text(kycText, 20, yPosition + 8);
      
      yPosition += 20;
      
      // Investor ID
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text('Investor ID: ' + investor.investorId, 20, yPosition);
      
      yPosition += 20;
      
      // Contact Information Section
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text('Contact Information', 20, yPosition);
      yPosition += 15;
      
      // Contact details
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text('Email: ' + (investor.email || 'N/A'), 20, yPosition);
      yPosition += 8;
      doc.text('Phone: ' + (investor.phone || 'N/A'), 20, yPosition);
      yPosition += 8;
      doc.text('PAN: ' + (investor.pan || 'N/A'), 20, yPosition);
      yPosition += 8;
      doc.text('Date Joined: ' + (investor.dateJoined || 'N/A'), 20, yPosition);
      yPosition += 8;
      doc.text('Address: ' + (investor.address || 'N/A'), 20, yPosition);
      yPosition += 8;
      doc.text('Bank Account: ' + (investor.bankAccount || 'N/A'), 20, yPosition);
      
      yPosition += 20;
      
      // Investment Summary Section
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text('Investment Summary', 20, yPosition);
      yPosition += 15;
      
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text('Total Investment: ' + formatCurrency(investor.totalInvestment), 20, yPosition);
      yPosition += 8;
      doc.text('Active Holdings: ' + investor.activeHoldings, 20, yPosition);
      yPosition += 8;
      doc.text('KYC Status: ' + investor.kycStatus, 20, yPosition);
      
      yPosition += 20;
      
      // Active Holdings Section
      if (yPosition > pageHeight - 100) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text('Active Holdings', 20, yPosition);
      yPosition += 15;
      
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      
      if (investor.holdings && investor.holdings.length > 0) {
        investor.holdings.forEach((holding, index) => {
          if (yPosition > pageHeight - 30) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text((index + 1) + '. ' + holding.series + ' - ' + formatCurrency(holding.investment), 20, yPosition);
          yPosition += 6;
          doc.text('   Purchase Date: ' + holding.purchaseDate + ', Units: ' + holding.units, 25, yPosition);
          yPosition += 6;
          doc.text('   Next Payout: ' + holding.nextPayout + ', Status: ' + holding.status, 25, yPosition);
          yPosition += 10;
        });
      } else {
        doc.text('No active holdings', 20, yPosition);
        yPosition += 10;
      }
      
      yPosition += 10;
      
      // KYC Documents Section
      if (yPosition > pageHeight - 80) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text('KYC Documents', 20, yPosition);
      yPosition += 15;
      
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      
      if (investor.kycDocuments && investor.kycDocuments.length > 0) {
        investor.kycDocuments.forEach((document, index) => {
          if (yPosition > pageHeight - 20) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text((index + 1) + '. ' + document.name + ' - ' + document.status, 20, yPosition);
          yPosition += 6;
          doc.text('   Uploaded: ' + document.uploadedDate, 25, yPosition);
          yPosition += 10;
        });
      } else {
        doc.text('No KYC documents', 20, yPosition);
        yPosition += 10;
      }
      
      yPosition += 10;
      
      // Recent Transactions Section
      if (yPosition > pageHeight - 80) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text('Recent Transactions', 20, yPosition);
      yPosition += 15;
      
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      
      if (investor.transactions && investor.transactions.length > 0) {
        investor.transactions.forEach((transaction, index) => {
          if (yPosition > pageHeight - 20) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text((index + 1) + '. ' + transaction.type + ' - ' + formatCurrency(transaction.amount), 20, yPosition);
          yPosition += 6;
          doc.text('   Series: ' + transaction.series + ', Date: ' + transaction.date, 25, yPosition);
          yPosition += 10;
        });
      } else {
        doc.text('No recent transactions', 20, yPosition);
        yPosition += 10;
      }
      
      // Footer
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        const currentDate = new Date();
        const dateStr = currentDate.toLocaleDateString('en-GB');
        const timeStr = currentDate.toLocaleTimeString('en-GB');
        doc.text('Generated on: ' + dateStr + ' at ' + timeStr, 20, pageHeight - 10);
        doc.text('Page ' + i + ' of ' + totalPages, pageWidth - 30, pageHeight - 10);
        doc.text('© 2026 LOANFRONT | All Rights Reserved', pageWidth / 2, pageHeight - 10, { align: 'center' });
      }
      
      // Save the PDF
      const fileName = investor.name.replace(/\s+/g, '_') + '_Profile_' + new Date().toISOString().split('T')[0] + '.pdf';
      doc.save(fileName);
      
      console.log('PDF generated successfully:', fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF: ' + error.message);
    }
  };

  return (
    <Layout>
      <div className="investor-details-page">
        {/* Header Section */}
        <div className="investor-header">
          <div className="header-left">
            <button className="back-button" onClick={() => navigate('/investors')}>
              <HiArrowLeft size={24} />
            </button>
            <div className="investor-title-section">
              <div className="investor-name-container">
                <div className="name-with-badge">
                  <h1 className="investor-name">{investor.name}</h1>
                  {investor.kycStatus === 'Verified' && (
                    <span className="kyc-badge verified">
                      <HiCheckCircle size={12} /> kyc verified
                    </span>
                  )}
                  {investor.kycStatus === 'Rejected' && (
                    <span className="kyc-badge Rejected">
                      <HiCheckCircle size={12} /> kyc rejected
                    </span>
                  )}
                  {investor.kycStatus === 'Pending' && (
                    <span className="kyc-badge Pending">
                      <HiCheckCircle size={12} /> kyc pending
                    </span>
                  )}
                </div>
                <span className="investor-id">Investor ID: {investor.investorId}</span>
              </div>
            </div>
          </div>
          <button className="download-button" onClick={generatePDF}>
            <MdOutlineFileDownload size={18} /> Download Profile
          </button>
        </div>

        {/* Main Content */}
        <div className="investor-content">
          {/* Two Column Layout */}
          <div className="investor-info-grid">
            {/* Left Column - Contact Information */}
            <div className="info-card contact-info">
              <h2 className="card-title">Contact Information</h2>
              <div className="info-list">
                <div className="info-item">
                  <HiOutlineMail className="info-icon" />
                  <div className="info-content">
                    <span className="info-label">Email</span>
                    <span className="info-value">{investor.email}</span>
                  </div>
                </div>
                <div className="info-divider"></div>
                <div className="info-item">
                  <HiOutlinePhone className="info-icon" />
                  <div className="info-content">
                    <span className="info-label">Phone</span>
                    <span className="info-value">{investor.phone}</span>
                  </div>
                </div>
                <div className="info-divider"></div>
                <div className="info-item">
                  <HiOutlineCreditCard className="info-icon" />
                  <div className="info-content">
                    <span className="info-label">PAN</span>
                    <span className="info-value">{investor.pan}</span>
                  </div>
                </div>
                <div className="info-divider"></div>
                <div className="info-item">
                  <HiOutlineCalendar className="info-icon" />
                  <div className="info-content">
                    <span className="info-label">Joined On</span>
                    <span className="info-value">{investor.dateJoined}</span>
                  </div>
                </div>
                <div className="info-divider"></div>
                <div className="info-item">
                  <HiOutlineLocationMarker className="info-icon" />
                  <div className="info-content">
                    <span className="info-label">Address</span>
                    <span className="info-value">{investor.address}</span>
                  </div>
                </div>
                <div className="info-divider"></div>
                <div className="info-item">
                  <MdAccountBalance className="info-icon" />
                  <div className="info-content">
                    <span className="info-label">Bank Account</span>
                    <span className="info-value">{investor.bankAccount}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Investment Summary */}
            <div className="info-card investment-summary">
              <h2 className="card-title">Investment Summary</h2>
              <div className="summary-cards">
                <div className="summary-card-large">
                  <span className="summary-label">Total Investment</span>
                  <span className="summary-value-large">{formatCurrency(investor.totalInvestment)}</span>
                </div>
                <div className="summary-card-small">
                  <span className="summary-label">Active Holdings</span>
                  <span className="summary-value">{investor.activeHoldings}</span>
                </div>
                <div className="summary-card-small">
                  <span className="summary-label">KYC Status</span>
                  {investor.kycStatus === 'Verified' && (
                    <span className="kyc-status-badge verified">
                      <HiCheckCircle size={14} /> Completed
                    </span>
                  )}
                  {investor.kycStatus === 'Rejected' && (
                    <span className="kyc-status-badge rejected">
                      <HiCheckCircle size={14} /> Rejected
                    </span>
                  )}
                  {investor.kycStatus === 'Pending' && (
                    <span className="kyc-status-badge pending">
                      <HiCheckCircle size={14} /> Pending
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Active Holdings Table */}
          <div className="holdings-section">
            <h2 className="section-title">Active Holdings</h2>
            <div className="table-card">
              <table className="holdings-table">
                <thead>
                  <tr>
                    <th>Series</th>
                    <th>Purchase Date</th>
                    <th>Units</th>
                    <th>Investment</th>
                    <th>Next Payout</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {investor.holdings.map((holding, index) => (
                    <tr key={index}>
                      <td className="series-cell">
                        <button 
                          className="series-link"
                          onClick={() => {
                            // Create a mapping function for series names to IDs
                            const getSeriesId = (seriesName) => {
                              const seriesMap = {
                                'Series A': '1',
                                'Series B': '2',
                                'Series C': '3',
                                'Series D': '4'
                              };
                              return seriesMap[seriesName] || '1'; // Default to '1' if not found
                            };
                            
                            const seriesId = getSeriesId(holding.series);
                            navigate(`/ncd-series/${seriesId}`);
                          }}
                        >
                          {holding.series}
                        </button>
                      </td>
                      <td>{holding.purchaseDate}</td>
                      <td>{holding.units}</td>
                      <td className="investment-cell">{formatCurrency(holding.investment)}</td>
                      <td>{holding.nextPayout}</td>
                      <td>
                        <span className="status-pill active">{holding.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Sections */}
          <div className="bottom-sections">
            {/* KYC Documents */}
            <div className="section-card">
              <h2 className="section-title">KYC Documents</h2>
              <div className="documents-list">
                {investor.kycDocuments.map((doc, index) => (
                  <div key={index} className="document-item">
                    <div className="document-info">
                      <HiOutlineDocumentText className="document-icon" />
                      <div>
                        <div className="document-name">{doc.name}</div>
                        <div className="document-date">Uploaded: {doc.uploadedDate}</div>
                      </div>
                    </div>
                    <span className="verified-badge">
                      <HiCheckCircle size={14} /> Verified
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="section-card">
              <h2 className="section-title">Recent Transactions</h2>
              <div className="transactions-list">
                {investor.transactions.map((transaction, index) => (
                  <div key={index} className="transaction-item">
                    <div className="transaction-info">
                      <div className="transaction-type">{transaction.type}</div>
                      <div className="transaction-details">
                        {transaction.series} {transaction.date}
                      </div>
                    </div>
                    <span className="transaction-amount positive">
                      + {formatCurrency(transaction.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default InvestorDetails;
