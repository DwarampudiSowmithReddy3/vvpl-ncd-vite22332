import React, { useState, useEffect } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import auditService from '../services/auditService';
import apiService from '../services/api';
import Layout from '../components/Layout';
import ReportPreview from '../components/ReportPreview';
import './Reports.css';
import '../styles/loading.css';
import { TbReportMoney } from "react-icons/tb";
import { BsFillPersonLinesFill } from "react-icons/bs";
import { FaFolderTree } from "react-icons/fa6";
import { MdOutlineTimeline } from "react-icons/md";
import { FaFileAlt } from "react-icons/fa";
import { MdSchedule } from "react-icons/md";
import { MdCalendarToday } from "react-icons/md";
import { FaRegFileAlt } from "react-icons/fa";
import { MdOutlineFileDownload } from "react-icons/md";
import jsPDF from 'jspdf';
import 'jspdf-autotable';






const Reports = () => {
  const { showCreateButton, canEdit } = usePermissions();
  const { user } = useAuth();
  const { addAuditLog } = useData();
  const [previewReport, setPreviewReport] = useState(null);
  const [statistics, setStatistics] = useState({
    reports_generated_this_month: 0,
    reports_generated_lifetime: 0,
    last_generated_date: 'Never'
  });
  const [lastGeneratedDates, setLastGeneratedDates] = useState({});
  const [loading, setLoading] = useState(true);

  // Fetch report statistics on mount
  useEffect(() => {
    fetchStatistics();
    fetchLastGeneratedDates();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const data = await apiService.getReportStatistics();
      setStatistics(data);
      if (import.meta.env.DEV) { console.log('✅ Report statistics loaded:', data); }
    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Error fetching report statistics:', error); }
    } finally {
      setLoading(false);
    }
  };

  const fetchLastGeneratedDates = async () => {
    try {
      const dates = await apiService.getLastGeneratedDates();
      setLastGeneratedDates(dates);
      if (import.meta.env.DEV) { console.log('✅ Last generated dates loaded:', dates); }
    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Error fetching last generated dates:', error); }
    }
  };

  // PDF Generation Functions
  const generateReportPDF = (reportName, format) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      
      // Common header for all reports
      addReportHeader(doc, reportName, pageWidth);
      
      let yPosition = 60;
      
      // Generate specific report content based on report type
      switch (reportName) {
        case 'Monthly Collection Report':
          yPosition = generateMonthlyCollectionPDF(doc, yPosition, pageWidth, pageHeight);
          break;
        case 'Payout Statement':
          yPosition = generatePayoutStatementPDF(doc, yPosition, pageWidth, pageHeight);
          break;
        case 'Series-wise Performance':
          yPosition = generateSeriesPerformancePDF(doc, yPosition, pageWidth, pageHeight);
          break;
        case 'Investor Portfolio Summary':
          yPosition = generateInvestorPortfolioPDF(doc, yPosition, pageWidth, pageHeight);
          break;
        case 'KYC Status Report':
          yPosition = generateKYCStatusPDF(doc, yPosition, pageWidth, pageHeight);
          break;
        case 'New Investor Report':
          yPosition = generateNewInvestorPDF(doc, yPosition, pageWidth, pageHeight);
          break;
        case 'RBI Compliance Report':
          yPosition = generateRBICompliancePDF(doc, yPosition, pageWidth, pageHeight);
          break;
        case 'SEBI Disclosure Report':
          yPosition = generateSEBIDisclosurePDF(doc, yPosition, pageWidth, pageHeight);
          break;
        case 'Audit Trail Report':
          yPosition = generateAuditTrailPDF(doc, yPosition, pageWidth, pageHeight);
          break;
        case 'Daily Activity Report':
          yPosition = generateDailyActivityPDF(doc, yPosition, pageWidth, pageHeight);
          break;
        case 'Subscription Trend Analysis':
          yPosition = generateSubscriptionTrendPDF(doc, yPosition, pageWidth, pageHeight);
          break;
        case 'Series Maturity Report':
          yPosition = generateSeriesMaturityPDF(doc, yPosition, pageWidth, pageHeight);
          break;
        default:
          doc.setFontSize(12);
          doc.text('Report content not available', 20, yPosition);
      }
      
      // Add footer
      addReportFooter(doc, pageWidth, pageHeight);
      
      // Save the PDF
      const fileName = `${reportName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      // Add audit log for document download
      addAuditLog({
        action: 'Downloaded Report',
        adminName: user ? user.name : 'Admin',
        adminRole: user ? user.displayRole : 'Admin',
        details: `Downloaded "${reportName}" report (PDF format)`,
        entityType: 'Report',
        entityId: reportName,
        changes: {
          documentType: reportName,
          fileName: fileName,
          format: 'PDF'
        }
      });
      
      if (import.meta.env.DEV) { console.log('Report PDF generated successfully:', fileName); }
    } catch (error) {
      if (import.meta.env.DEV) { console.error('Error generating report PDF:', error); }
      alert('Error generating PDF: ' + error.message);
    }
  };

  // Common header function
  const addReportHeader = (doc, reportName, pageWidth) => {
    // Company Header
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text('LOANFRONT', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text(reportName, pageWidth / 2, 30, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text('Generated on: ' + new Date().toLocaleDateString('en-GB') + ' at ' + new Date().toLocaleTimeString('en-GB'), pageWidth / 2, 40, { align: 'center' });
    
    // Add line separator
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 45, pageWidth - 20, 45);
  };

  // Common footer function
  const addReportFooter = (doc, pageWidth, pageHeight) => {
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('© 2026 LOANFRONT | All Rights Reserved', pageWidth / 2, pageHeight - 10, { align: 'center' });
      doc.text('Page ' + i + ' of ' + totalPages, pageWidth - 30, pageHeight - 10);
      doc.text('Confidential Report', 20, pageHeight - 10);
    }
  };

  // Individual report generation functions
  const generateMonthlyCollectionPDF = (doc, yPosition, pageWidth, pageHeight) => {
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text('Monthly Collection Summary', 20, yPosition);
    yPosition += 15;
    
    // TODO: Fetch real data from backend API
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text('Report data will be loaded from backend', 20, yPosition);
    yPosition += 10;
    
    return yPosition;
  };

  const generatePayoutStatementPDF = (doc, yPosition, pageWidth, pageHeight) => {
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text('Interest Payout Statement', 20, yPosition);
    yPosition += 15;
    
    // TODO: Fetch real data from backend API
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text('Report data will be loaded from backend', 20, yPosition);
    yPosition += 10;
    
    return yPosition;
  };

  const generateSeriesPerformancePDF = (doc, yPosition, pageWidth, pageHeight) => {
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text('Series-wise Performance Analysis', 20, yPosition);
    yPosition += 15;
    
    // TODO: Fetch real data from backend API
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text('Report data will be loaded from backend', 20, yPosition);
    yPosition += 10;
    
    return yPosition;
  };

  const generateInvestorPortfolioPDF = (doc, yPosition, pageWidth, pageHeight) => {
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text('Investor Portfolio Summary', 20, yPosition);
    yPosition += 15;
    
    // TODO: Fetch real data from backend API
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text('Report data will be loaded from backend', 20, yPosition);
    yPosition += 10;
    
    return yPosition;
  };

  const generateKYCStatusPDF = (doc, yPosition, pageWidth, pageHeight) => {
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text('KYC Status Report', 20, yPosition);
    yPosition += 15;
    
    // TODO: Fetch real data from backend API
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text('Report data will be loaded from backend', 20, yPosition);
    yPosition += 10;
    
    return yPosition;
  };

  const generateNewInvestorPDF = (doc, yPosition, pageWidth, pageHeight) => {
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text('New Investor Report', 20, yPosition);
    yPosition += 15;
    
    // TODO: Fetch real data from backend API
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text('Report data will be loaded from backend', 20, yPosition);
    yPosition += 10;
    
    return yPosition;
  };

  const generateRBICompliancePDF = (doc, yPosition, pageWidth, pageHeight) => {
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text('RBI Compliance Report', 20, yPosition);
    yPosition += 15;
    
    // TODO: Fetch real data from backend API
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text('Report data will be loaded from backend', 20, yPosition);
    yPosition += 10;
    
    return yPosition;
  };

  const generateSEBIDisclosurePDF = (doc, yPosition, pageWidth, pageHeight) => {
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text('SEBI Disclosure Report', 20, yPosition);
    yPosition += 15;
    
    // TODO: Fetch real data from backend API
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text('Report data will be loaded from backend', 20, yPosition);
    yPosition += 10;
    
    return yPosition;
  };

  const generateAuditTrailPDF = (doc, yPosition, pageWidth, pageHeight) => {
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text('Audit Trail Report', 20, yPosition);
    yPosition += 15;
    
    // TODO: Fetch real data from backend API
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text('Report data will be loaded from backend', 20, yPosition);
    yPosition += 10;
    
    return yPosition;
  };

  const generateDailyActivityPDF = (doc, yPosition, pageWidth, pageHeight) => {
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text('Daily Activity Report', 20, yPosition);
    yPosition += 15;
    
    // TODO: Fetch real data from backend API
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text('Report data will be loaded from backend', 20, yPosition);
    yPosition += 10;
    
    return yPosition;
  };

  const generateSubscriptionTrendPDF = (doc, yPosition, pageWidth, pageHeight) => {
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text('Subscription Trend Analysis', 20, yPosition);
    yPosition += 15;
    
    // TODO: Fetch real data from backend API
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text('Report data will be loaded from backend', 20, yPosition);
    yPosition += 10;
    
    return yPosition;
  };

  const generateSeriesMaturityPDF = (doc, yPosition, pageWidth, pageHeight) => {
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text('Series Maturity Report', 20, yPosition);
    yPosition += 15;
    
    // TODO: Fetch real data from backend API
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text('Report data will be loaded from backend', 20, yPosition);
    yPosition += 10;
    
    return yPosition;
  };

  const reportCategories = [
    {
      title: 'Financial Reports',
      icon: <TbReportMoney size={46} color="#fdb436e2" />,
      description: 'Fund collections, payouts, and financial summaries.',
      reports: [
        {
          name: 'Monthly Collection Report',
          description: 'Total funds collected per series for the month',
          formats: ['PDF', 'Excel']
        },
        {
          name: 'Payout Statement',
          description: 'Interest payout details for all active series',
          formats: ['PDF', 'Excel']
        },
        {
          name: 'Series-wise Performance',
          description: 'Detailed performance metrics for each NCD series',
          formats: ['PDF', 'Excel', 'CSV']
        }
      ]
    },
    {
      title: 'Investor Reports',
      icon: <BsFillPersonLinesFill size={40} color="#2563eb" />,
      description: 'Investor analytics and portfolio summaries.',
      reports: [
        {
          name: 'Investor Portfolio Summary',
          description: 'Comprehensive view of all investor holdings',
          formats: ['PDF', 'Excel']
        },
        {
          name: 'KYC Status Report',
          description: 'Status of KYC verification for all investors',
          formats: ['Excel', 'CSV']
        },
        {
          name: 'New Investor Report',
          description: 'List of investors who joined in the selected period',
          formats: ['PDF', 'Excel']
        }
      ]
    },
    {
      title: 'Compliance Reports',
      icon: <FaFolderTree size={48} color="#dabe1eff" />,
      description: 'Regulatory and compliance documentation.',
      reports: [
        {
          name: 'RBI Compliance Report',
          description: 'Regulatory compliance summary for RBI',
          formats: ['PDF']
        },
        {
          name: 'SEBI Disclosure Report',
          description: 'Required disclosures for SEBI compliance',
          formats: ['PDF']
        },
        {
          name: 'Audit Trail Report',
          description: 'Complete audit trail of all transactions',
          formats: ['PDF', 'CSV']
        }
      ]
    },
    {
      title: 'Operational Reports',
      icon: <MdOutlineTimeline size={48} color="#0ea5e9" />,
      description: 'Day-to-day operational metrics and analytics.',
      reports: [
        {
          name: 'Daily Activity Report',
          description: 'Summary of all activities for the selected day',
          formats: ['PDF', 'Excel']
        },
        {
          name: 'Subscription Trend Analysis',
          description: 'Trend analysis of subscriptions over time',
          formats: ['PDF', 'Excel', 'CSV']
        },
        {
          name: 'Series Maturity Report',
          description: 'Upcoming maturities and renewal schedules',
          formats: ['PDF', 'Excel']
        }
      ]
    }
  ];

  const handlePreview = (reportName) => {
    setPreviewReport(reportName);
  };

  const handleClosePreview = () => {
    setPreviewReport(null);
  };

  const handleDownload = (reportName, format) => {
    let recordCount = 0;
    let fileName = '';
    
    if (format === 'PDF') {
      generateReportPDF(reportName, format);
      fileName = `${reportName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      recordCount = getReportRecordCount(reportName);
    } else {
      // For Excel/CSV formats, simulate download
      const element = document.createElement('a');
      const file = new Blob([`${reportName} - Generated on ${new Date().toLocaleDateString()}`], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      fileName = `${reportName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.${format.toLowerCase()}`;
      element.download = fileName;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      recordCount = getReportRecordCount(reportName);
    }
    
    // Log report download using auditService
    auditService.logReportDownloaded({
      type: reportName,
      name: reportName,
      format: format
    }, user).catch(error => {
      if (import.meta.env.DEV) { console.error('Failed to log report download:', error); }
    });
    
    // Also add to local audit log for backward compatibility
    addAuditLog({
      action: 'Downloaded Report',
      adminName: user ? user.name : 'User',
      adminRole: user ? user.displayRole : 'User',
      details: `Downloaded ${reportName} (${recordCount} records, ${format} format)`,
      entityType: 'Report',
      entityId: reportName,
      changes: {
        reportType: reportName,
        format: format,
        fileName: fileName,
        recordCount: recordCount
      }
    });
    
    // Close preview after download
    setPreviewReport(null);
    
    // Refresh statistics after downloading report
    fetchStatistics();
  };

  const handleGenerate = (reportName) => {
    const recordCount = getReportRecordCount(reportName);
    
    // Log report generation using auditService
    auditService.logReportGenerated({
      type: reportName,
      name: reportName,
      dateRange: 'All Time'
    }, user).catch(error => {
      if (import.meta.env.DEV) { console.error('Failed to log report generation:', error); }
    });
    
    // Also add to local audit log for backward compatibility
    addAuditLog({
      action: 'Generated Report',
      adminName: user ? user.name : 'User',
      adminRole: user ? user.displayRole : 'User',
      details: `Generated ${reportName} with ${recordCount} records`,
      entityType: 'Report',
      entityId: reportName,
      changes: {
        reportType: reportName,
        recordCount: recordCount,
        format: 'PDF'
      }
    });
    
    // Generate PDF directly
    generateReportPDF(reportName, 'PDF');
    
    // Refresh statistics after generating report
    fetchStatistics();
  };

  // Helper function to get record count for different report types
  const getReportRecordCount = (reportName) => {
    // This would normally calculate based on actual data
    // For now, return estimated counts
    switch (reportName) {
      case 'Monthly Collection Report':
      case 'Payout Statement':
        return 50; // Estimated based on typical data
      case 'Investor Portfolio Report':
        return 25;
      case 'Series Performance Report':
        return 10;
      default:
        return 0;
    }
  };

  return (
    <Layout>
      {/* Loading Overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading...</p>
          </div>
        </div>
      )}
      
      <div className="reports-page">
        <div className="reports-header">
          <div>
            <h1 className="page-title">Reports</h1>
            <p className="page-subtitle">Generate and download various business reports.</p>
          </div>
        </div>

        <div className="reports-summary-cards">
          {/* Card 1 */}
          <div className="summary-card blue">
            <div className="card-content">
              <p className="card-label">Reports Generated</p>
              <div className="card-value-row">
                <h2 className="card-value">{loading ? '...' : statistics.reports_generated_this_month}</h2>
                <FaFileAlt className="card-icon" id='file-color' />
              </div>
              <p className="card-subtext">This month</p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="summary-card green">
            <div className="card-content">
              <p className="card-label">Reports Generated Lifetime</p>
              <div className="card-value-row">
                <h2 className="card-value">{loading ? '...' : statistics.reports_generated_lifetime}</h2>
                <FaRegFileAlt className="card-icon" id='clock-color'/>
              </div>
              <p className="card-subtext">All time</p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="summary-card yellow">
            <div className="card-content">
              <p className="card-label">Last Generated</p>
              <div className="card-value-row">
                <h2 className="card-value">{loading ? '...' : statistics.last_generated_date}</h2>
                <MdCalendarToday className="card-icon" id='calender-color'/>
              </div>
              <p className="card-subtext">{statistics.last_generated_date === 'Never' ? 'No reports yet' : 'Most recent'}</p>
            </div>
          </div>
        </div>


        <div className="reports-categories">
          {reportCategories.map((category, catIndex) => (
            <div key={catIndex} className="report-category">
              <div className="category-header">
                <div className="category-title-section">
                  <span className="category-icon">{category.icon}</span>
                  <div>
                    <h3 className="category-title">{category.title}</h3>
                    <p className="category-description">{category.description}</p>
                  </div>
                </div>
              </div>
              <div className="reports-list">
                {category.reports.map((report, reportIndex) => (
                  <div key={reportIndex} className="report-item">
                    <div className="report-info">
                      <h4 className="report-name">{report.name}</h4>
                      <p className="report-description">{report.description}</p>
                      <div className="report-meta">
                        <span className="report-last">Last: {lastGeneratedDates[report.name] || 'Never'}</span>
                        <div className="report-formats">
                          {report.formats.map((format, formatIndex) => (
                            <span key={formatIndex} className="format-badge">{format}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="report-actions">
                      <button 
                        className="preview-button"
                        onClick={() => handlePreview(report.name)}
                      >
                        <FaRegFileAlt size={16} /> Preview
                      </button>
                      <button 
                        className="generate-button"
                        onClick={() => handleGenerate(report.name)}
                        disabled={!showCreateButton('reports')}
                        style={{ 
                          opacity: showCreateButton('reports') ? 1 : 0.5,
                          cursor: showCreateButton('reports') ? 'pointer' : 'not-allowed'
                        }}
                      >
                        <MdOutlineFileDownload size={18} /> Generate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {previewReport && (
        <ReportPreview 
          reportName={previewReport}
          onClose={handleClosePreview}
          onDownload={handleDownload}
          onReportGenerated={() => {
            fetchStatistics();
            fetchLastGeneratedDates();
          }}
        />
      )}
    </Layout>
  );
};

export default Reports;

