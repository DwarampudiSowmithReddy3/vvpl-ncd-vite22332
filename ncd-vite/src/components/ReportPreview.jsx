import React, { useState, useEffect } from 'react';
import './ReportPreview.css';
import { 
  MdClose, 
  MdDownload, 
  MdTrendingUp,
  MdAccountBalance,
  MdPeople,
  MdAssessment,
  MdSchedule,
  MdCalendarToday,
  MdBarChart,
  MdTimeline,
  MdVerifiedUser,
  MdGavel,
  MdDescription,
  MdHistory,
  MdToday,
  MdInsights,
  MdEventNote,
  MdDateRange,
  MdShowChart,
  MdPieChart,
  MdSecurity
} from 'react-icons/md';
import { 
  FaRupeeSign, 
  FaPercentage, 
  FaUsers, 
  FaFileInvoiceDollar,
  FaShieldAlt,
  FaUserCheck,
  FaUserPlus,
  FaCalendarAlt,
  FaClock,
  FaUniversity,
  FaBalanceScale,
  FaClipboardCheck
} from 'react-icons/fa';

const ReportPreview = ({ reportName, onClose, onDownload }) => {
  const [selectedFormat, setSelectedFormat] = useState('PDF');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // Simulate API call for fetching report data
  const fetchReportData = async (reportType, startDate, endDate) => {
    setLoading(true);
    try {
      // This would be replaced with actual API call
      // const response = await fetch(`/api/reports/${reportType}?startDate=${startDate}&endDate=${endDate}`);
      // const data = await response.json();
      
      // For now, return mock data structure
      const mockData = generateMockData(reportType, startDate, endDate);
      setReportData(mockData);
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate mock data based on report type
  const generateMockData = (reportType, startDate, endDate) => {
    const baseData = {
      reportPeriod: `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`,
      generatedDate: new Date().toLocaleDateString(),
      dateRange: { startDate, endDate }
    };

    switch (reportType) {
      case 'Monthly Collection Report':
        return {
          ...baseData,
          totalCollections: '₹125.4 Cr',
          collectionEfficiency: '94.2%',
          totalAUM: '₹2,450 Cr',
          npaRatio: '1.8%',
          liquidityBuffer: '₹85.2 Cr'
        };
      // Add more mock data structures for other reports
      default:
        return baseData;
    }
  };

  useEffect(() => {
    if (reportName) {
      fetchReportData(reportName, dateRange.startDate, dateRange.endDate);
    }
  }, [reportName, dateRange]);

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDownload = () => {
    onDownload(reportName, selectedFormat);
  };

  const renderReportContent = () => {
    switch (reportName) {
      case 'Monthly Collection Report':
        return renderMonthlyCollectionReport();
      case 'Payout Statement':
        return renderPayoutStatement();
      case 'Series-wise Performance':
        return renderSeriesPerformance();
      case 'Investor Portfolio Summary':
        return renderInvestorPortfolio();
      case 'KYC Status Report':
        return renderKYCStatus();
      case 'New Investor Report':
        return renderNewInvestor();
      case 'RBI Compliance Report':
        return renderRBICompliance();
      case 'SEBI Disclosure Report':
        return renderSEBIDisclosure();
      case 'Audit Trail Report':
        return renderAuditTrail();
      case 'Daily Activity Report':
        return renderDailyActivity();
      case 'Subscription Trend Analysis':
        return renderSubscriptionTrend();
      case 'Series Maturity Report':
        return renderSeriesMaturity();
      default:
        return <div>Report not found</div>;
    }
  };

  const renderMonthlyCollectionReport = () => (
    <div className="report-content">
      {/* Date Range Selector */}
      <div className="report-card">
        <div className="card-header">
          <MdDateRange className="header-icon" />
          <h3>Report Period</h3>
        </div>
        <div className="card-content">
          <div className="date-selector">
            <div className="date-input-group">
              <label>From Date:</label>
              <div className="date-input-wrapper">
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => handleDateChange('startDate', e.target.value)}
                  className="date-input"
                />
                <FaCalendarAlt className="calendar-icon" />
              </div>
            </div>
            <div className="date-input-group">
              <label>To Date:</label>
              <div className="date-input-wrapper">
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => handleDateChange('endDate', e.target.value)}
                  className="date-input"
                />
                <FaCalendarAlt className="calendar-icon" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Header */}
      <div className="report-card">
        <div className="card-header">
          <MdAccountBalance className="header-icon" />
          <h3>Report Header</h3>
        </div>
        <div className="card-content">
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Company/Issuer:</span>
              <span className="value">LOANFRONT</span>
            </div>
            <div className="info-item">
              <span className="label">Report Period:</span>
              <span className="value">{reportData?.reportPeriod || 'December 2025'}</span>
            </div>
            <div className="info-item">
              <span className="label">Generation Date:</span>
              <span className="value">{reportData?.generatedDate || '04-Jan-2026'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="report-card">
        <div className="card-header">
          <MdTrendingUp className="header-icon" />
          <h3>Key Performance Indicators (KPIs)</h3>
        </div>
        <div className="card-content">
          <div className="kpi-grid-optimized">
            <div className="kpi-item">
              <FaRupeeSign className="kpi-icon" />
              <div className="kpi-details">
                <span className="kpi-value">{reportData?.totalCollections || '₹125.4 Cr'}</span>
                <span className="kpi-label">Total Gross Collections</span>
              </div>
            </div>
            <div className="kpi-item">
              <FaPercentage className="kpi-icon" />
              <div className="kpi-details">
                <span className="kpi-value">{reportData?.collectionEfficiency || '94.2%'}</span>
                <span className="kpi-label">Collection Efficiency</span>
              </div>
            </div>
            <div className="kpi-item">
              <MdAccountBalance className="kpi-icon" />
              <div className="kpi-details">
                <span className="kpi-value">{reportData?.totalAUM || '₹2,450 Cr'}</span>
                <span className="kpi-label">Total AUM</span>
              </div>
            </div>
            <div className="kpi-item">
              <MdAssessment className="kpi-icon" />
              <div className="kpi-details">
                <span className="kpi-value">{reportData?.npaRatio || '1.8%'}</span>
                <span className="kpi-label">NPA Ratio (&gt;90 days)</span>
              </div>
            </div>
            <div className="kpi-item">
              <FaShieldAlt className="kpi-icon" />
              <div className="kpi-details">
                <span className="kpi-value">{reportData?.liquidityBuffer || '₹85.2 Cr'}</span>
                <span className="kpi-label">Liquidity Buffer</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPayoutStatement = () => (
    <div className="report-content">
      <div className="report-card">
        <div className="card-header">
          <FaFileInvoiceDollar className="header-icon" />
          <h3>Payout Statement</h3>
        </div>
        <div className="card-content">
          <p>Payout statement content will be displayed here.</p>
        </div>
      </div>
    </div>
  );

  const renderSeriesPerformance = () => (
    <div className="report-content">
      <div className="report-card">
        <div className="card-header">
          <MdAssessment className="header-icon" />
          <h3>Series Performance</h3>
        </div>
        <div className="card-content">
          <p>Series performance content will be displayed here.</p>
        </div>
      </div>
    </div>
  );

  const renderInvestorPortfolio = () => (
    <div className="report-content">
      <div className="report-card">
        <div className="card-header">
          <FaUsers className="header-icon" />
          <h3>Investor Portfolio Summary</h3>
        </div>
        <div className="card-content">
          <p>Investor portfolio content will be displayed here.</p>
        </div>
      </div>
    </div>
  );

  const renderKYCStatus = () => (
    <div className="report-content">
      <div className="report-card">
        <div className="card-header">
          <FaUserCheck className="header-icon" />
          <h3>KYC Status Report</h3>
        </div>
        <div className="card-content">
          <p>KYC status content will be displayed here.</p>
        </div>
      </div>
    </div>
  );

  const renderNewInvestor = () => {
    return (
      <div className="report-content">
        <div className="report-card">
          <div className="card-header">
            <FaUserPlus className="header-icon" />
            <h3>New Investor Report</h3>
          </div>
          <div className="card-content">
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Report Period:</span>
                <span className="value">Dec 01-31, 2025</span>
              </div>
              <div className="info-item">
                <span className="label">Total New Investors:</span>
                <span className="value">1,247</span>
              </div>
              <div className="info-item">
                <span className="label">Total Investment:</span>
                <span className="value">₹85.4 Cr</span>
              </div>
              <div className="info-item">
                <span className="label">Generated On:</span>
                <span className="value">04-Jan-2026</span>
              </div>
            </div>
            <div className="kpi-grid">
              <div className="kpi-item">
                <FaUsers className="kpi-icon" />
                <div className="kpi-details">
                  <span className="kpi-value">1,247</span>
                  <span className="kpi-label">Total New Investors</span>
                </div>
              </div>
              <div className="kpi-item">
                <FaRupeeSign className="kpi-icon" />
                <div className="kpi-details">
                  <span className="kpi-value">₹85.4 Cr</span>
                  <span className="kpi-label">Total Investment</span>
                </div>
              </div>
              <div className="kpi-item">
                <MdAccountBalance className="kpi-icon" />
                <div className="kpi-details">
                  <span className="kpi-value">₹6.85 L</span>
                  <span className="kpi-label">Avg Investment Size</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderRBICompliance = () => {
    return (
      <div className="report-content">
        <div className="report-card">
          <div className="card-header">
            <FaUniversity className="header-icon" />
            <h3>RBI Compliance Report</h3>
          </div>
          <div className="card-content">
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Compliance Period:</span>
                <span className="value">Q4 FY26</span>
              </div>
              <div className="info-item">
                <span className="label">Status:</span>
                <span className="value">Compliant</span>
              </div>
              <div className="info-item">
                <span className="label">Last Updated:</span>
                <span className="value">04-Jan-2026</span>
              </div>
            </div>
            <div className="kpi-grid">
              <div className="kpi-item">
                <MdSecurity className="kpi-icon" />
                <div className="kpi-details">
                  <span className="kpi-value">100%</span>
                  <span className="kpi-label">Compliance Score</span>
                </div>
              </div>
              <div className="kpi-item">
                <FaClipboardCheck className="kpi-icon" />
                <div className="kpi-details">
                  <span className="kpi-value">All Filed</span>
                  <span className="kpi-label">Required Reports</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSEBIDisclosure = () => {
    return (
      <div className="report-content">
        <div className="report-card">
          <div className="card-header">
            <FaBalanceScale className="header-icon" />
            <h3>SEBI Disclosure Report</h3>
          </div>
          <div className="card-content">
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Quarter/Period:</span>
                <span className="value">Q4 FY26 (Oct-Dec 2025)</span>
              </div>
              <div className="info-item">
                <span className="label">As of:</span>
                <span className="value">31-Dec-2025</span>
              </div>
              <div className="info-item">
                <span className="label">Total Listed Series:</span>
                <span className="value">3</span>
              </div>
              <div className="info-item">
                <span className="label">Outstanding NCD Value:</span>
                <span className="value">₹500 Cr</span>
              </div>
            </div>
            <div className="kpi-grid">
              <div className="kpi-item">
                <FaClipboardCheck className="kpi-icon" />
                <div className="kpi-details">
                  <span className="kpi-value">100%</span>
                  <span className="kpi-label">Half-yearly Filings On Time</span>
                </div>
              </div>
              <div className="kpi-item">
                <MdSecurity className="kpi-icon" />
                <div className="kpi-details">
                  <span className="kpi-value">Submitted</span>
                  <span className="kpi-label">Asset Cover Certificates</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAuditTrail = () => (
    <div className="report-content">
      <div className="report-card">
        <div className="card-header">
          <MdHistory className="header-icon" />
          <h3>Audit Trail Report</h3>
        </div>
        <div className="card-content">
          <p>Audit trail content will be displayed here.</p>
        </div>
      </div>
    </div>
  );

  const renderDailyActivity = () => (
    <div className="report-content">
      <div className="report-card">
        <div className="card-header">
          <MdToday className="header-icon" />
          <h3>Daily Activity Report</h3>
        </div>
        <div className="card-content">
          <p>Daily activity content will be displayed here.</p>
        </div>
      </div>
    </div>
  );

  const renderSubscriptionTrend = () => (
    <div className="report-content">
      <div className="report-card">
        <div className="card-header">
          <MdInsights className="header-icon" />
          <h3>Subscription Trend Analysis</h3>
        </div>
        <div className="card-content">
          <p>Subscription trend content will be displayed here.</p>
        </div>
      </div>
    </div>
  );

  const renderSeriesMaturity = () => (
    <div className="report-content">
      <div className="report-card">
        <div className="card-header">
          <MdEventNote className="header-icon" />
          <h3>Series Maturity Report</h3>
        </div>
        <div className="card-content">
          <p>Series maturity content will be displayed here.</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="report-preview-overlay">
      <div className="report-preview-modal">
        <div className="report-preview-header">
          <h2>{reportName}</h2>
          <div className="header-controls">
            <select 
              value={selectedFormat} 
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="format-selector"
            >
              <option value="PDF">PDF</option>
              <option value="Excel">Excel</option>
              <option value="CSV">CSV</option>
            </select>
            <button onClick={handleDownload} className="download-btn">
              <MdDownload /> Download
            </button>
            <button onClick={onClose} className="close-btn">
              <MdClose />
            </button>
          </div>
        </div>
        
        <div className="report-preview-content">
          {loading ? (
            <div className="loading-spinner">Loading report data...</div>
          ) : (
            renderReportContent()
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportPreview;