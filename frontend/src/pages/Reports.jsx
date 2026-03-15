import React, { useState, useEffect } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import auditService from '../services/auditService';
import apiService from '../services/api';
import Layout from '../components/Layout';
import LoadingOverlay from '../components/LoadingOverlay';
import ReportPreview from '../components/ReportPreview';
import Lottie from 'lottie-react';
import businessGoalsAnimation from '../assets/animations/business-goals.json';
import loadingDotsAnimation from '../assets/animations/loading-dots-blue.json';
import './Reports.css';
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
  const [showReportAnimation, setShowReportAnimation] = useState(false);
  const [pendingReportName, setPendingReportName] = useState(null);
  const [statistics, setStatistics] = useState({
    reports_generated_this_month: 0,
    reports_generated_lifetime: 0,
    last_generated_date: 'Never'
  });
  const [lastGeneratedDates, setLastGeneratedDates] = useState({});
  const [loading, setLoading] = useState(true);
  const [showFormatModal, setShowFormatModal] = useState(false);
  const [selectedReportForDownload, setSelectedReportForDownload] = useState(null);
  const [downloadingFormat, setDownloadingFormat] = useState(null);

  // Fetch report statistics on mount
  useEffect(() => {
    fetchStatistics();
    fetchLastGeneratedDates();
  }, []);

  // Minimum loading time of 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1401);
    return () => clearTimeout(timer);
  }, []);

  const fetchStatistics = async () => {
    try {
      const data = await apiService.getReportStatistics();
      setStatistics(data);
      if (import.meta.env.DEV) { console.log('✅ Report statistics loaded:', data); }
    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Error fetching report statistics:', error); }
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
      
      // Add audit log for report download directly to backend
      try {
        apiService.createAuditLog({
          action: 'Report Downloaded',
          admin_name: user?.full_name || user?.name || user?.username || 'Unknown User',
          admin_role: user?.role || user?.displayRole || 'Unknown Role',
          details: `Downloaded "${reportName}" report (PDF format)`,
          entity_type: 'Report',
          entity_id: reportName,
          changes: {
            document_type: reportName,
            file_name: fileName,
            format: 'PDF',
            action: 'report_download',
            timestamp: new Date().toISOString(),
            username: user?.username,
            user_role: user?.role || user?.displayRole
          }
        });
        if (import.meta.env.DEV) { console.log('✅ Report PDF download logged'); }
      } catch (error) {
        if (import.meta.env.DEV) { console.error('❌ Failed to log report PDF download:', error); }
      }
      
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
    // Show animation first
    setPendingReportName(reportName);
    setShowReportAnimation(true);
    
    // After 5 seconds, hide animation and show report
    setTimeout(() => {
      setShowReportAnimation(false);
      setPreviewReport(reportName);
      setPendingReportName(null);
    }, 5000);
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
    
    // Log report download directly to backend
    try {
      apiService.createAuditLog({
        action: 'Report Downloaded',
        admin_name: user?.full_name || user?.name || user?.username || 'Unknown User',
        admin_role: user?.role || user?.displayRole || 'Unknown Role',
        details: `Downloaded "${reportName}" report (${recordCount} records, ${format} format)`,
        entity_type: 'Report',
        entity_id: reportName,
        changes: {
          report_type: reportName,
          format: format,
          file_name: fileName,
          record_count: recordCount,
          action: 'report_download',
          timestamp: new Date().toISOString(),
          username: user?.username,
          user_role: user?.role || user?.displayRole
        }
      }).catch(error => {
        if (import.meta.env.DEV) { console.error('❌ Failed to log report download:', error); }
      });
      if (import.meta.env.DEV) { console.log('✅ Report download logged'); }
    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Error logging report download:', error); }
    }
    
    // Close preview after download
    setPreviewReport(null);
    
    // Refresh statistics after downloading report
    fetchStatistics();
  };

  const handleGenerateClick = (reportName) => {
    // Show format selection modal
    setSelectedReportForDownload(reportName);
    setShowFormatModal(true);
  };

  const handleFormatSelected = async (format) => {
    if (!selectedReportForDownload) return;
    
    setDownloadingFormat(format);
    
    try {
      let blob;
      const reportName = selectedReportForDownload;
      
      // Call appropriate download endpoint based on report type
      switch (reportName) {
        case 'Monthly Collection Report':
          blob = await apiService.downloadMonthlyCollectionReport(format.toLowerCase());
          break;
        case 'Payout Statement':
          blob = await apiService.downloadPayoutStatementReport(format.toLowerCase());
          break;
        case 'Series-wise Performance':
          blob = await apiService.downloadSeriesPerformanceReport(format.toLowerCase());
          break;
        default:
          // For other reports, show preview instead
          handlePreview(reportName);
          setShowFormatModal(false);
          return;
      }
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Determine file extension
      let extension = format.toLowerCase();
      if (format === 'PDF') extension = 'pdf';
      else if (format === 'Excel') extension = 'xlsx';
      else if (format === 'CSV') extension = 'csv';
      
      link.download = `${reportName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // Log download
      try {
        apiService.createAuditLog({
          action: 'Report Downloaded',
          admin_name: user?.full_name || user?.name || user?.username || 'Unknown User',
          admin_role: user?.role || user?.displayRole || 'Unknown Role',
          details: `Downloaded "${reportName}" report (${format} format)`,
          entity_type: 'Report',
          entity_id: reportName,
          changes: {
            report_type: reportName,
            format: format,
            file_name: link.download,
            action: 'report_download',
            timestamp: new Date().toISOString(),
            username: user?.username,
            user_role: user?.role || user?.displayRole
          }
        }).catch(error => {
          if (import.meta.env.DEV) { console.error('Failed to log report download:', error); }
        });
      } catch (error) {
        if (import.meta.env.DEV) { console.error('Error logging report download:', error); }
      }
      
      // Refresh statistics
      fetchStatistics();
      
      // Close modal
      setShowFormatModal(false);
      setSelectedReportForDownload(null);
      
    } catch (error) {
      if (import.meta.env.DEV) { console.error('Error downloading report:', error); }
      alert(`Error downloading report: ${error.message}`);
    } finally {
      setDownloadingFormat(null);
    }
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
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{ width: '200px', height: '200px' }}>
            <Lottie animationData={loadingDotsAnimation} loop={true} />
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
                        onClick={() => handleGenerateClick(report.name)}
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

      {/* Format Selection Modal */}
      {showFormatModal && (
        <>
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 99998
          }} onClick={() => setShowFormatModal(false)} />
          
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 99999,
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
            padding: '32px',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h2 style={{
              margin: '0 0 8px 0',
              fontSize: '24px',
              fontWeight: 600,
              color: '#0f172a'
            }}>
              Select Download Format
            </h2>
            <p style={{
              margin: '0 0 24px 0',
              fontSize: '14px',
              color: '#64748b'
            }}>
              Choose the format you want to download {selectedReportForDownload} in
            </p>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              marginBottom: '24px'
            }}>
              {['PDF', 'Excel', 'CSV'].map((format) => (
                <button
                  key={format}
                  onClick={() => handleFormatSelected(format)}
                  disabled={downloadingFormat !== null}
                  style={{
                    padding: '12px 16px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    background: downloadingFormat === format ? '#2563eb' : 'white',
                    color: downloadingFormat === format ? 'white' : '#374151',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: downloadingFormat === null ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s ease',
                    opacity: downloadingFormat === null ? 1 : 0.6
                  }}
                  onMouseEnter={(e) => {
                    if (downloadingFormat === null) {
                      e.target.style.borderColor = '#2563eb';
                      e.target.style.background = '#f0f9ff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (downloadingFormat === null) {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.background = 'white';
                    }
                  }}
                >
                  {downloadingFormat === format ? 'Downloading...' : `Download as ${format}`}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setShowFormatModal(false)}
              disabled={downloadingFormat !== null}
              style={{
                width: '100%',
                padding: '10px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                background: 'white',
                color: '#374151',
                fontSize: '14px',
                fontWeight: 500,
                cursor: downloadingFormat === null ? 'pointer' : 'not-allowed',
                opacity: downloadingFormat === null ? 1 : 0.6
              }}
            >
              Cancel
            </button>
          </div>
        </>
      )}

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

      {/* Lottie Animation Overlay for Report Generation */}
      {showReportAnimation && (
        <>
          {/* Background Blur Overlay */}
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 99998
          }} />
          
          {/* Animation Card */}
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 99999,
            background: 'white',
            borderRadius: '20px',
            boxShadow: '0 25px 80px rgba(0, 0, 0, 0.4)',
            border: '1px solid #e2e8f0',
            width: '550px',
            overflow: 'hidden',
            animation: 'greetingEnter 0.5s ease-out'
          }}>
            <div style={{
              padding: '32px 48px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px'
            }}>
              {/* Lottie Animation */}
              <div style={{ width: '240px', height: '240px' }}>
                <Lottie
                  animationData={businessGoalsAnimation}
                  loop={true}
                  autoplay={true}
                  style={{ 
                    width: '100%', 
                    height: '100%'
                  }}
                />
              </div>
              
              {/* Text Content */}
              <div style={{
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: 600,
                  color: '#000000',
                  margin: 0
                }}>
                  Generating Report
                </h2>
                <p style={{
                  fontSize: '16px',
                  fontWeight: 400,
                  color: '#64748b',
                  margin: 0
                }}>
                  {pendingReportName}
                </p>
              </div>
              
              {/* Loading Dots */}
              <div style={{
                display: 'flex',
                gap: '8px',
                justifyContent: 'center',
                marginTop: '8px'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#3b82f6',
                  animation: 'pulse 1.5s ease-in-out infinite',
                  animationDelay: '0s'
                }}></div>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#3b82f6',
                  animation: 'pulse 1.5s ease-in-out infinite',
                  animationDelay: '0.2s'
                }}></div>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#3b82f6',
                  animation: 'pulse 1.5s ease-in-out infinite',
                  animationDelay: '0.4s'
                }}></div>
              </div>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
};

export default Reports;

