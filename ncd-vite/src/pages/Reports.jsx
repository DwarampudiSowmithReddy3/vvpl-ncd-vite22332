import React, { useState } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import Layout from '../components/Layout';
import ReportPreview from '../components/ReportPreview';
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
      
      console.log('Report PDF generated successfully:', fileName);
    } catch (error) {
      console.error('Error generating report PDF:', error);
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
    
    // KPIs
    doc.setFontSize(12);
    doc.text('Key Performance Indicators:', 20, yPosition);
    yPosition += 10;
    
    const kpiData = [
      ['Total Collections', '₹125.4 Cr'],
      ['Collection Efficiency', '94.2%'],
      ['Total AUM', '₹2,450 Cr'],
      ['NPA Ratio', '1.8%'],
      ['Liquidity Buffer', '₹85.2 Cr']
    ];
    
    kpiData.forEach(([label, value]) => {
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text(label + ': ' + value, 25, yPosition);
      yPosition += 8;
    });
    
    yPosition += 10;
    
    // Series-wise Collection Data
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text('Series-wise Collection Details:', 20, yPosition);
    yPosition += 10;
    
    const seriesData = [
      ['Series A', '₹45.2 Cr', '95.1%', 'Active'],
      ['Series B', '₹38.7 Cr', '92.8%', 'Active'],
      ['Series C', '₹41.5 Cr', '96.3%', 'Active']
    ];
    
    seriesData.forEach(([series, amount, efficiency, status], index) => {
      doc.setFontSize(10);
      doc.text((index + 1) + '. ' + series + ' - ' + amount, 25, yPosition);
      yPosition += 6;
      doc.text('   Efficiency: ' + efficiency + ', Status: ' + status, 30, yPosition);
      yPosition += 10;
    });
    
    return yPosition;
  };

  const generatePayoutStatementPDF = (doc, yPosition, pageWidth, pageHeight) => {
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text('Interest Payout Statement', 20, yPosition);
    yPosition += 15;
    
    // Summary
    doc.setFontSize(12);
    doc.text('Payout Summary:', 20, yPosition);
    yPosition += 10;
    
    const payoutSummary = [
      ['Total Payout Amount', '₹18.5 Cr'],
      ['Number of Investors', '1,247'],
      ['Average Payout per Investor', '₹14,836'],
      ['Payout Frequency', 'Monthly'],
      ['Next Payout Date', '1st February 2026']
    ];
    
    payoutSummary.forEach(([label, value]) => {
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text(label + ': ' + value, 25, yPosition);
      yPosition += 8;
    });
    
    yPosition += 10;
    
    // Series-wise Payout
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text('Series-wise Payout Details:', 20, yPosition);
    yPosition += 10;
    
    const payoutData = [
      ['Series A', '9.5%', '₹6.8 Cr', '425 investors'],
      ['Series B', '10.0%', '₹7.2 Cr', '398 investors'],
      ['Series C', '10.5%', '₹4.5 Cr', '424 investors']
    ];
    
    payoutData.forEach(([series, rate, amount, investors], index) => {
      doc.setFontSize(10);
      doc.text((index + 1) + '. ' + series + ' (' + rate + ' p.a.)', 25, yPosition);
      yPosition += 6;
      doc.text('   Amount: ' + amount + ', Beneficiaries: ' + investors, 30, yPosition);
      yPosition += 10;
    });
    
    return yPosition;
  };

  const generateSeriesPerformancePDF = (doc, yPosition, pageWidth, pageHeight) => {
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text('Series-wise Performance Analysis', 20, yPosition);
    yPosition += 15;
    
    const performanceData = [
      {
        name: 'Series A',
        targetAmount: '₹50 Cr',
        raisedAmount: '₹45.2 Cr',
        subscriptionRatio: '90.4%',
        investors: '425',
        avgTicketSize: '₹1.06 L',
        interestRate: '9.5%',
        maturityDate: '1st June 2028'
      },
      {
        name: 'Series B',
        targetAmount: '₹80 Cr',
        raisedAmount: '₹72.1 Cr',
        subscriptionRatio: '90.1%',
        investors: '398',
        avgTicketSize: '₹1.81 L',
        interestRate: '10.0%',
        maturityDate: '15th September 2028'
      },
      {
        name: 'Series C',
        targetAmount: '₹100 Cr',
        raisedAmount: '₹85.3 Cr',
        subscriptionRatio: '85.3%',
        investors: '424',
        avgTicketSize: '₹2.01 L',
        interestRate: '10.5%',
        maturityDate: '1st January 2029'
      }
    ];
    
    performanceData.forEach((series, index) => {
      if (yPosition > pageHeight - 80) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text(series.name + ' Performance', 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text('Target Amount: ' + series.targetAmount, 25, yPosition);
      yPosition += 6;
      doc.text('Raised Amount: ' + series.raisedAmount, 25, yPosition);
      yPosition += 6;
      doc.text('Subscription Ratio: ' + series.subscriptionRatio, 25, yPosition);
      yPosition += 6;
      doc.text('Total Investors: ' + series.investors, 25, yPosition);
      yPosition += 6;
      doc.text('Average Ticket Size: ' + series.avgTicketSize, 25, yPosition);
      yPosition += 6;
      doc.text('Interest Rate: ' + series.interestRate + ' p.a.', 25, yPosition);
      yPosition += 6;
      doc.text('Maturity Date: ' + series.maturityDate, 25, yPosition);
      yPosition += 15;
    });
    
    return yPosition;
  };

  const generateInvestorPortfolioPDF = (doc, yPosition, pageWidth, pageHeight) => {
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text('Investor Portfolio Summary', 20, yPosition);
    yPosition += 15;
    
    // Portfolio Overview
    doc.setFontSize(12);
    doc.text('Portfolio Overview:', 20, yPosition);
    yPosition += 10;
    
    const portfolioData = [
      ['Total Investors', '1,247'],
      ['Total Portfolio Value', '₹202.6 Cr'],
      ['Average Portfolio Size', '₹1.62 L'],
      ['Active Portfolios', '1,198 (96.1%)'],
      ['Dormant Portfolios', '49 (3.9%)']
    ];
    
    portfolioData.forEach(([label, value]) => {
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text(label + ': ' + value, 25, yPosition);
      yPosition += 8;
    });
    
    yPosition += 10;
    
    // Top Investors
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text('Top 10 Investors by Portfolio Value:', 20, yPosition);
    yPosition += 10;
    
    const topInvestors = [
      ['Rajesh Kumar', '₹15.2 L', 'Series A, B, C'],
      ['Priya Sharma', '₹12.8 L', 'Series B, C'],
      ['Amit Patel', '₹11.5 L', 'Series A, C'],
      ['Sneha Reddy', '₹10.9 L', 'Series A, B'],
      ['Vikram Singh', '₹9.7 L', 'Series C']
    ];
    
    topInvestors.forEach(([name, value, series], index) => {
      doc.setFontSize(10);
      doc.text((index + 1) + '. ' + name + ' - ' + value, 25, yPosition);
      yPosition += 6;
      doc.text('   Holdings: ' + series, 30, yPosition);
      yPosition += 10;
    });
    
    return yPosition;
  };

  const generateKYCStatusPDF = (doc, yPosition, pageWidth, pageHeight) => {
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text('KYC Status Report', 20, yPosition);
    yPosition += 15;
    
    // KYC Summary
    doc.setFontSize(12);
    doc.text('KYC Status Summary:', 20, yPosition);
    yPosition += 10;
    
    const kycSummary = [
      ['Total Investors', '1,247'],
      ['KYC Completed', '1,156 (92.7%)'],
      ['KYC Pending', '67 (5.4%)'],
      ['KYC Rejected', '24 (1.9%)'],
      ['Compliance Rate', '92.7%']
    ];
    
    kycSummary.forEach(([label, value]) => {
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text(label + ': ' + value, 25, yPosition);
      yPosition += 8;
    });
    
    yPosition += 10;
    
    // Pending KYC Details
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text('Pending KYC Cases (Sample):', 20, yPosition);
    yPosition += 10;
    
    const pendingKYC = [
      ['Anjali Verma', 'Document Verification', '5 days'],
      ['Rohit Gupta', 'Address Proof Missing', '12 days'],
      ['Kavya Nair', 'PAN Verification', '3 days'],
      ['Arjun Mehta', 'Bank Statement Required', '8 days']
    ];
    
    pendingKYC.forEach(([name, reason, days], index) => {
      doc.setFontSize(10);
      doc.text((index + 1) + '. ' + name + ' - ' + reason, 25, yPosition);
      yPosition += 6;
      doc.text('   Pending for: ' + days, 30, yPosition);
      yPosition += 10;
    });
    
    return yPosition;
  };

  const generateNewInvestorPDF = (doc, yPosition, pageWidth, pageHeight) => {
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text('New Investor Report', 20, yPosition);
    yPosition += 15;
    
    // New Investor Summary
    doc.setFontSize(12);
    doc.text('New Investor Summary (Last 30 Days):', 20, yPosition);
    yPosition += 10;
    
    const newInvestorSummary = [
      ['New Registrations', '89'],
      ['Completed KYC', '76 (85.4%)'],
      ['First Investment Made', '68 (76.4%)'],
      ['Average First Investment', '₹1.24 L'],
      ['Total New Investment', '₹8.43 Cr']
    ];
    
    newInvestorSummary.forEach(([label, value]) => {
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text(label + ': ' + value, 25, yPosition);
      yPosition += 8;
    });
    
    yPosition += 10;
    
    // Recent New Investors
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text('Recent New Investors (Sample):', 20, yPosition);
    yPosition += 10;
    
    const recentInvestors = [
      ['Deepak Sharma', '₹2.5 L', 'Series C', '02-Jan-2026'],
      ['Meera Patel', '₹1.8 L', 'Series B', '01-Jan-2026'],
      ['Karan Singh', '₹3.2 L', 'Series A', '31-Dec-2025'],
      ['Riya Jain', '₹1.5 L', 'Series B', '30-Dec-2025']
    ];
    
    recentInvestors.forEach(([name, amount, series, date], index) => {
      doc.setFontSize(10);
      doc.text((index + 1) + '. ' + name + ' - ' + amount, 25, yPosition);
      yPosition += 6;
      doc.text('   Series: ' + series + ', Date: ' + date, 30, yPosition);
      yPosition += 10;
    });
    
    return yPosition;
  };

  const generateRBICompliancePDF = (doc, yPosition, pageWidth, pageHeight) => {
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text('RBI Compliance Report', 20, yPosition);
    yPosition += 15;
    
    // Compliance Status
    doc.setFontSize(12);
    doc.text('Regulatory Compliance Status:', 20, yPosition);
    yPosition += 10;
    
    const complianceItems = [
      ['Capital Adequacy Ratio', '14.2%', 'Compliant (Min: 12%)'],
      ['Liquidity Coverage Ratio', '118%', 'Compliant (Min: 100%)'],
      ['Net Stable Funding Ratio', '105%', 'Compliant (Min: 100%)'],
      ['Large Exposure Limits', '18%', 'Compliant (Max: 25%)'],
      ['Credit Risk Management', 'Grade A', 'Compliant']
    ];
    
    complianceItems.forEach(([item, value, status], index) => {
      doc.setFontSize(10);
      doc.text((index + 1) + '. ' + item + ': ' + value, 25, yPosition);
      yPosition += 6;
      doc.text('   Status: ' + status, 30, yPosition);
      yPosition += 10;
    });
    
    return yPosition;
  };

  const generateSEBIDisclosurePDF = (doc, yPosition, pageWidth, pageHeight) => {
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text('SEBI Disclosure Report', 20, yPosition);
    yPosition += 15;
    
    // Disclosure Requirements
    doc.setFontSize(12);
    doc.text('SEBI Disclosure Requirements:', 20, yPosition);
    yPosition += 10;
    
    const disclosureItems = [
      ['Quarterly Financial Results', 'Filed on Time', '15-Jan-2026'],
      ['Annual Report', 'Filed on Time', '30-Sep-2025'],
      ['Material Event Disclosures', '12 Events Disclosed', 'Current Quarter'],
      ['Related Party Transactions', 'Disclosed', 'Quarterly'],
      ['Corporate Governance Report', 'Filed on Time', '15-Jan-2026']
    ];
    
    disclosureItems.forEach(([item, status, date], index) => {
      doc.setFontSize(10);
      doc.text((index + 1) + '. ' + item, 25, yPosition);
      yPosition += 6;
      doc.text('   Status: ' + status + ', Date: ' + date, 30, yPosition);
      yPosition += 10;
    });
    
    return yPosition;
  };

  const generateAuditTrailPDF = (doc, yPosition, pageWidth, pageHeight) => {
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text('Audit Trail Report', 20, yPosition);
    yPosition += 15;
    
    // Audit Summary
    doc.setFontSize(12);
    doc.text('Audit Trail Summary:', 20, yPosition);
    yPosition += 10;
    
    const auditSummary = [
      ['Total Transactions Logged', '15,847'],
      ['User Actions Tracked', '8,923'],
      ['System Events Recorded', '6,924'],
      ['Failed Login Attempts', '23'],
      ['Data Access Events', '2,156']
    ];
    
    auditSummary.forEach(([label, value]) => {
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text(label + ': ' + value, 25, yPosition);
      yPosition += 8;
    });
    
    return yPosition;
  };

  const generateDailyActivityPDF = (doc, yPosition, pageWidth, pageHeight) => {
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text('Daily Activity Report', 20, yPosition);
    yPosition += 15;
    
    // Daily Summary
    doc.setFontSize(12);
    doc.text('Daily Activity Summary:', 20, yPosition);
    yPosition += 10;
    
    const dailyActivity = [
      ['New Registrations', '12'],
      ['New Investments', '₹2.8 Cr'],
      ['Interest Payouts', '₹1.2 Cr'],
      ['KYC Completions', '18'],
      ['Customer Support Tickets', '7']
    ];
    
    dailyActivity.forEach(([label, value]) => {
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text(label + ': ' + value, 25, yPosition);
      yPosition += 8;
    });
    
    return yPosition;
  };

  const generateSubscriptionTrendPDF = (doc, yPosition, pageWidth, pageHeight) => {
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text('Subscription Trend Analysis', 20, yPosition);
    yPosition += 15;
    
    // Trend Summary
    doc.setFontSize(12);
    doc.text('Subscription Trends (Last 6 Months):', 20, yPosition);
    yPosition += 10;
    
    const trendData = [
      ['August 2025', '₹18.5 Cr', '156 investors'],
      ['September 2025', '₹22.1 Cr', '189 investors'],
      ['October 2025', '₹19.8 Cr', '167 investors'],
      ['November 2025', '₹25.3 Cr', '201 investors'],
      ['December 2025', '₹28.7 Cr', '234 investors'],
      ['January 2026', '₹15.2 Cr', '128 investors (MTD)']
    ];
    
    trendData.forEach(([month, amount, investors], index) => {
      doc.setFontSize(10);
      doc.text((index + 1) + '. ' + month + ': ' + amount, 25, yPosition);
      yPosition += 6;
      doc.text('   New Investors: ' + investors, 30, yPosition);
      yPosition += 10;
    });
    
    return yPosition;
  };

  const generateSeriesMaturityPDF = (doc, yPosition, pageWidth, pageHeight) => {
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text('Series Maturity Report', 20, yPosition);
    yPosition += 15;
    
    // Maturity Schedule
    doc.setFontSize(12);
    doc.text('Upcoming Maturities (Next 12 Months):', 20, yPosition);
    yPosition += 10;
    
    const maturityData = [
      ['Series A', '1st June 2028', '₹45.2 Cr', '425 investors'],
      ['Series B', '15th September 2028', '₹72.1 Cr', '398 investors'],
      ['Series C', '1st January 2029', '₹85.3 Cr', '424 investors']
    ];
    
    maturityData.forEach(([series, date, amount, investors], index) => {
      doc.setFontSize(10);
      doc.text((index + 1) + '. ' + series + ' - ' + date, 25, yPosition);
      yPosition += 6;
      doc.text('   Maturity Amount: ' + amount + ', Investors: ' + investors, 30, yPosition);
      yPosition += 10;
    });
    
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
          lastGenerated: '15/1/2024',
          formats: ['PDF', 'Excel']
        },
        {
          name: 'Payout Statement',
          description: 'Interest payout details for all active series',
          lastGenerated: '10/1/2024',
          formats: ['PDF', 'Excel']
        },
        {
          name: 'Series-wise Performance',
          description: 'Detailed performance metrics for each NCD series',
          lastGenerated: '12/1/2024',
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
          lastGenerated: '14/1/2024',
          formats: ['PDF', 'Excel']
        },
        {
          name: 'KYC Status Report',
          description: 'Status of KYC verification for all investors',
          lastGenerated: '16/1/2024',
          formats: ['Excel', 'CSV']
        },
        {
          name: 'New Investor Report',
          description: 'List of investors who joined in the selected period',
          lastGenerated: '13/1/2024',
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
          lastGenerated: '1/1/2024',
          formats: ['PDF']
        },
        {
          name: 'SEBI Disclosure Report',
          description: 'Required disclosures for SEBI compliance',
          lastGenerated: '5/1/2024',
          formats: ['PDF']
        },
        {
          name: 'Audit Trail Report',
          description: 'Complete audit trail of all transactions',
          lastGenerated: '15/1/2024',
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
          lastGenerated: '16/1/2024',
          formats: ['PDF', 'Excel']
        },
        {
          name: 'Subscription Trend Analysis',
          description: 'Trend analysis of subscriptions over time',
          lastGenerated: '14/1/2024',
          formats: ['PDF', 'Excel', 'CSV']
        },
        {
          name: 'Series Maturity Report',
          description: 'Upcoming maturities and renewal schedules',
          lastGenerated: '10/1/2024',
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
    if (format === 'PDF') {
      generateReportPDF(reportName, format);
    } else {
      // For Excel/CSV formats, simulate download
      const element = document.createElement('a');
      const file = new Blob([`${reportName} - Generated on ${new Date().toLocaleDateString()}`], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = `${reportName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.${format.toLowerCase()}`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
    
    // Close preview after download
    setPreviewReport(null);
  };

  const handleGenerate = (reportName) => {
    // Generate PDF directly
    generateReportPDF(reportName, 'PDF');
  };

  return (
    <Layout>
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
                <h2 className="card-value">156</h2>
                <FaFileAlt className="card-icon" id='file-color' />
              </div>
              <p className="card-subtext">This month</p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="summary-card green">
            <div className="card-content">
              <p className="card-label">Scheduled Reports</p>
              <div className="card-value-row">
                <h2 className="card-value">12</h2>
                <MdSchedule className="card-icon" id='clock-color'/>
              </div>
              <p className="card-subtext">Auto-generated</p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="summary-card yellow">
            <div className="card-content">
              <p className="card-label">Last Generated</p>
              <div className="card-value-row">
                <h2 className="card-value">2 hours ago</h2>
                <MdCalendarToday className="card-icon" id='calender-color'/>
              </div>
              <p className="card-subtext">KYC Status Report</p>
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
                        <span className="report-last">Last: {report.lastGenerated}</span>
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
        />
      )}
    </Layout>
  );
};

export default Reports;

