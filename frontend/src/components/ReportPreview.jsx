import React, { useState, useEffect } from 'react';
import './ReportPreview.css';
import apiService from '../services/api';
import pdfTemplateService from '../utils/pdfTemplateService';
import excelExportService from '../utils/excelExportService';
import html2canvas from 'html2canvas';
import { 
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
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
  MdSecurity,
  MdPending,
  MdPayment,
  MdWarning,
  MdCheckCircle
} from 'react-icons/md';
import { 
  HiCheckCircle
} from 'react-icons/hi';
import { 
  FaRupeeSign, 
  FaPercentage, 
  FaPercent,
  FaUsers, 
  FaFileInvoiceDollar,
  FaShieldAlt,
  FaUserCheck,
  FaUserPlus,
  FaCalendarAlt,
  FaClock,
  FaUniversity,
  FaBalanceScale,
  FaClipboardCheck,
  FaClipboardList,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaMoneyCheckAlt,
  FaChartLine,
  FaUserTag,
  FaUserClock,
  FaChartPie
} from 'react-icons/fa';

const ReportPreview = ({ reportName, onClose, onDownload, onReportGenerated }) => {
  const [selectedFormat, setSelectedFormat] = useState('PDF');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [seriesList, setSeriesList] = useState([]);
  const [selectedSeries, setSelectedSeries] = useState('all');
  const [loadingSeries, setLoadingSeries] = useState(false);
  
  // Payout Statement specific states
  const [dateSelectionType, setDateSelectionType] = useState('range'); // 'range' or 'month'
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM format
  
  // New Investor Report specific state
  const [selectedInvestorId, setSelectedInvestorId] = useState('');

  // RBI Compliance Report specific state
  const [selectedSecurityType, setSelectedSecurityType] = useState('all');

  // Fetch series list from backend
  const fetchSeriesList = async () => {
    try {
      setLoadingSeries(true);
      const data = await apiService.getSeries({ status: 'active' });
      if (import.meta.env.DEV) { console.log('✅ Series list fetched:', data); }
      setSeriesList(data || []);
    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Error fetching series list:', error); }
      setSeriesList([]);
    } finally {
      setLoadingSeries(false);
    }
  };

  // Fetch report data from backend API
  const fetchReportData = async (reportType, startDate, endDate) => {
    setLoading(true);
    try {
      let data = null;
      
      // Call appropriate backend API based on report type
      switch (reportType) {
        case 'Monthly Collection Report':
          // Get series ID if specific series selected
          const seriesId = selectedSeries !== 'all' ? 
            seriesList.find(s => s.series_code === selectedSeries)?.id : null;
          
          // Pass actual date range to backend
          data = await apiService.getMonthlyCollectionReport(startDate, endDate, seriesId);
          
          // Transform backend data to frontend format
          data = {
            ...data,
            reportPeriod: `${new Date(startDate).toLocaleDateString('en-GB')} - ${new Date(endDate).toLocaleDateString('en-GB')}`,
            generatedDate: new Date().toLocaleDateString('en-GB'),
            dateRange: { startDate, endDate }
          };
          break;
        
        case 'Payout Statement':
          // Get series ID if specific series selected
          const payoutSeriesId = selectedSeries !== 'all' ? 
            seriesList.find(s => s.series_code === selectedSeries)?.id : null;
          
          if (import.meta.env.DEV) { console.log('📊 Payout Statement - Date Selection Type:', dateSelectionType); }
          if (import.meta.env.DEV) { console.log('📊 Payout Statement - Selected Month:', selectedMonth); }
          if (import.meta.env.DEV) { console.log('📊 Payout Statement - Date Range:', dateRange); }
          
          // Determine parameters based on date selection type
          if (dateSelectionType === 'month') {
            // Use month parameter
            if (import.meta.env.DEV) { console.log('📊 Fetching by MONTH:', selectedMonth); }
            data = await apiService.getPayoutStatementReport(null, null, selectedMonth, payoutSeriesId);
          } else {
            // Use date range
            if (import.meta.env.DEV) { console.log('📊 Fetching by DATE RANGE:', startDate, 'to', endDate); }
            data = await apiService.getPayoutStatementReport(startDate, endDate, null, payoutSeriesId);
          }
          
          // Transform backend data to frontend format
          data = {
            ...data,
            reportPeriod: dateSelectionType === 'month' 
              ? new Date(selectedMonth + '-01').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
              : `${new Date(startDate).toLocaleDateString('en-GB')} - ${new Date(endDate).toLocaleDateString('en-GB')}`,
            generatedDate: new Date().toLocaleDateString('en-GB'),
            dateRange: { startDate, endDate }
          };
          break;
        
        case 'Series-wise Performance':
          if (import.meta.env.DEV) { console.log('📊 Fetching Series-wise Performance Report'); }
          data = await apiService.getSeriesPerformanceReport();
          
          // Transform backend data to frontend format
          data = {
            ...data,
            reportPeriod: 'All Time',
            generatedDate: new Date().toLocaleDateString('en-GB')
          };
          break;
        
        case 'Investor Portfolio Summary':
          if (import.meta.env.DEV) { console.log('📊 Fetching Investor Portfolio Summary Report'); }
          data = await apiService.getInvestorPortfolioReport(null, null, null, null);
          
          // Transform backend data to frontend format
          data = {
            ...data,
            reportPeriod: 'All Time',
            generatedDate: new Date().toLocaleDateString('en-GB')
          };
          break;
        
        case 'KYC Status Report':
          if (import.meta.env.DEV) { console.log('📊 Fetching KYC Status Report'); }
          data = await apiService.getKYCStatusReport();
          
          // Transform backend data to frontend format
          data = {
            ...data,
            reportPeriod: 'All Time',
            generatedDate: new Date().toLocaleDateString('en-GB')
          };
          break;
        
        case 'New Investor Report':
          if (import.meta.env.DEV) { console.log('📊 Fetching New Investor Report'); }
          const investorIdFilter = selectedInvestorId.trim() || null;
          data = await apiService.getNewInvestorsReport(startDate, endDate, investorIdFilter);
          
          // Transform backend data to frontend format
          data = {
            ...data,
            reportPeriod: `${new Date(startDate).toLocaleDateString('en-GB')} - ${new Date(endDate).toLocaleDateString('en-GB')}`,
            generatedDate: new Date().toLocaleDateString('en-GB')
          };
          break;
        
        case 'RBI Compliance Report':
          if (import.meta.env.DEV) { console.log('📊 Fetching RBI Compliance Report'); }
          const rbiSeriesId = selectedSeries !== 'all' ? 
            seriesList.find(s => s.series_code === selectedSeries)?.id : null;
          data = await apiService.getRBIComplianceReport(rbiSeriesId, selectedSecurityType);
          
          // Transform backend data to frontend format
          data = {
            ...data,
            reportPeriod: 'Current Status',
            generatedDate: new Date().toLocaleDateString('en-GB')
          };
          break;
        
        case 'SEBI Disclosure Report':
          if (import.meta.env.DEV) { console.log('📊 Fetching SEBI Disclosure Report'); }
          const sebiSeriesId = selectedSeries !== 'all' ? 
            seriesList.find(s => s.series_code === selectedSeries)?.id : null;
          data = await apiService.getSEBIDisclosureReport(sebiSeriesId);
          
          // Transform backend data to frontend format
          data = {
            ...data,
            reportPeriod: 'Current Status',
            generatedDate: new Date().toLocaleDateString('en-GB')
          };
          break;
        
        case 'Audit Trail Report':
          if (import.meta.env.DEV) { console.log('📊 Fetching Audit Trail Report'); }
          const auditSeriesId = selectedSeries !== 'all' ? 
            seriesList.find(s => s.series_code === selectedSeries)?.id : null;
          data = await apiService.getAuditTrailReport(startDate, endDate, auditSeriesId);
          
          // LOG THE ACTUAL DATA TO DEBUG
          if (import.meta.env.DEV) { console.log('🔍 AUDIT TRAIL DATA RECEIVED:'); }
          if (import.meta.env.DEV) { console.log('  - Investments:', data?.investments?.length || 0); }
          if (import.meta.env.DEV) { console.log('  - Completed Payouts:', data?.completed_payouts?.length || 0); }
          if (import.meta.env.DEV) { console.log('  - Pending Payouts:', data?.pending_payouts?.length || 0); }
          if (import.meta.env.DEV) { console.log('  - Upcoming Payouts:', data?.upcoming_payouts?.length || 0); }
          
          if (data?.completed_payouts && data.completed_payouts.length > 0) {
            if (import.meta.env.DEV) { console.log('🔍 SAMPLE COMPLETED PAYOUT:', data.completed_payouts[0]); }
            if (import.meta.env.DEV) { console.log('  - paid_timestamp:', data.completed_payouts[0].paid_timestamp); }
            if (import.meta.env.DEV) { console.log('  - paid_timestamp type:', typeof data.completed_payouts[0].paid_timestamp); }
            if (import.meta.env.DEV) { console.log('  - paid_timestamp length:', data.completed_payouts[0].paid_timestamp?.length); }
          }
          
          if (data?.investments && data.investments.length > 0) {
            if (import.meta.env.DEV) { console.log('🔍 SAMPLE INVESTMENT:', data.investments[0]); }
            if (import.meta.env.DEV) { console.log('  - created_at:', data.investments[0].created_at); }
            if (import.meta.env.DEV) { console.log('  - created_at type:', typeof data.investments[0].created_at); }
            if (import.meta.env.DEV) { console.log('  - created_at length:', data.investments[0].created_at?.length); }
          }
          
          // Transform backend data to frontend format
          data = {
            ...data,
            reportPeriod: `${new Date(startDate).toLocaleDateString('en-GB')} - ${new Date(endDate).toLocaleDateString('en-GB')}`,
            generatedDate: new Date().toLocaleDateString('en-GB'),
            dateRange: { startDate, endDate }
          };
          break;
        
        case 'Daily Activity Report':
          if (import.meta.env.DEV) { console.log('📊 Fetching Daily Activity Report'); }
          const activityRole = selectedSeries !== 'all' ? selectedSeries : null;
          data = await apiService.getDailyActivityReport(startDate, endDate, activityRole);
          
          // Transform backend data to frontend format
          data = {
            ...data,
            reportPeriod: `${new Date(startDate).toLocaleDateString('en-GB')} - ${new Date(endDate).toLocaleDateString('en-GB')}`,
            generatedDate: new Date().toLocaleDateString('en-GB'),
            dateRange: { startDate, endDate }
          };
          break;
        
        case 'Subscription Trend Analysis':
          if (import.meta.env.DEV) { console.log('📊 Fetching Subscription Trend Analysis'); }
          data = await apiService.getSubscriptionTrendAnalysis();
          
          // Transform backend data to frontend format
          data = {
            ...data,
            generatedDate: new Date().toLocaleDateString('en-GB')
          };
          break;
        
        case 'Series Maturity Report':
          if (import.meta.env.DEV) { console.log('📊 Fetching Series Maturity Report'); }
          data = await apiService.getSeriesMaturityReport();
          
          // Transform backend data to frontend format
          data = {
            ...data,
            generatedDate: new Date().toLocaleDateString('en-GB')
          };
          break;
          
        default:
          // For other reports, return base data structure
          data = {
            reportPeriod: `${new Date(startDate).toLocaleDateString('en-GB')} - ${new Date(endDate).toLocaleDateString('en-GB')}`,
            generatedDate: new Date().toLocaleDateString('en-GB'),
            dateRange: { startDate, endDate }
          };
      }
      
      if (import.meta.env.DEV) { console.log('✅ Report data fetched:', data); }
      if (import.meta.env.DEV) { console.log('✅ Investment details:', data?.investment_details); }
      if (import.meta.env.DEV) { console.log('✅ Investment details length:', data?.investment_details?.length); }
      setReportData(data);
    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Error fetching report data:', error); }
      // Set error state but keep basic structure
      setReportData({
        reportPeriod: `${new Date(startDate).toLocaleDateString('en-GB')} - ${new Date(endDate).toLocaleDateString('en-GB')}`,
        generatedDate: new Date().toLocaleDateString('en-GB'),
        dateRange: { startDate, endDate },
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (reportName) {
      // Fetch series list when component mounts
      fetchSeriesList();
      // Fetch report data
      fetchReportData(reportName, dateRange.startDate, dateRange.endDate);
    }
  }, [reportName, dateRange, selectedSeries, dateSelectionType, selectedMonth, selectedInvestorId, selectedSecurityType]);

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDownload = async () => {
    try {
      if (import.meta.env.DEV) { console.log('📥 Starting download for:', reportName); }
      if (import.meta.env.DEV) { console.log('📄 Selected format:', selectedFormat); }
      if (import.meta.env.DEV) { console.log('📊 Report data being passed:', reportData); }
      if (import.meta.env.DEV) {

        if (import.meta.env.DEV) { console.log('📊 Report data keys:', reportData ? Object.keys(reportData) : 'null'); }

      }
      if (import.meta.env.DEV) { console.log('📊 Series breakdown:', reportData?.series_breakdown); }
      if (import.meta.env.DEV) { console.log('📊 Investment details:', reportData?.investment_details); }
      
      // DEBUG: Log actual payout data to see timestamp values
      if (reportName === 'Audit Trail Report') {
        if (import.meta.env.DEV) { console.log('🔍 DEBUG - Completed Payouts:', reportData?.completed_payouts); }
        if (reportData?.completed_payouts && reportData.completed_payouts.length > 0) {
          if (import.meta.env.DEV) { console.log('🔍 DEBUG - First completed payout:', reportData.completed_payouts[0]); }
          if (import.meta.env.DEV) { console.log('🔍 DEBUG - paid_timestamp:', reportData.completed_payouts[0].paid_timestamp); }
        }
        if (import.meta.env.DEV) { console.log('🔍 DEBUG - Pending Payouts:', reportData?.pending_payouts); }
        if (reportData?.pending_payouts && reportData.pending_payouts.length > 0) {
          if (import.meta.env.DEV) { console.log('🔍 DEBUG - First pending payout:', reportData.pending_payouts[0]); }
          if (import.meta.env.DEV) { console.log('🔍 DEBUG - scheduled_timestamp:', reportData.pending_payouts[0].scheduled_timestamp); }
        }
        if (import.meta.env.DEV) { console.log('🔍 DEBUG - Investments:', reportData?.investments); }
        if (reportData?.investments && reportData.investments.length > 0) {
          if (import.meta.env.DEV) { console.log('🔍 DEBUG - First investment:', reportData.investments[0]); }
          if (import.meta.env.DEV) { console.log('🔍 DEBUG - created_at:', reportData.investments[0].created_at); }
        }
      }
      
      if (!reportData) {
        alert('No report data available. Please wait for the report to load.');
        return;
      }
      
      if (reportName === 'Monthly Collection Report') {
        if (selectedFormat === 'PDF') {
          // Use PDF template service for Monthly Collection Report
          if (import.meta.env.DEV) { console.log('📄 Using PDF template service...'); }
          const pdfBytes = await pdfTemplateService.fillMonthlyCollectionReport(reportData);
          const filename = `Monthly_Collection_Report_${new Date().toISOString().split('T')[0]}.pdf`;
          pdfTemplateService.downloadPDF(pdfBytes, filename);
          if (import.meta.env.DEV) { console.log('✅ PDF downloaded successfully'); }
        } else if (selectedFormat === 'Excel') {
          // Use Excel export service for Monthly Collection Report
          if (import.meta.env.DEV) { console.log('📊 Using Excel export service...'); }
          excelExportService.exportMonthlyCollectionReport(reportData);
          if (import.meta.env.DEV) { console.log('✅ Excel downloaded successfully'); }
        } else if (selectedFormat === 'CSV') {
          // Use CSV export service for Monthly Collection Report
          if (import.meta.env.DEV) { console.log('📊 Using CSV export service...'); }
          excelExportService.exportMonthlyCollectionReportCSV(reportData);
          if (import.meta.env.DEV) { console.log('✅ CSV downloaded successfully'); }
        } else {
          // For other formats, use default handler
          onDownload(reportName, selectedFormat);
        }
      } else if (reportName === 'Payout Statement') {
        if (selectedFormat === 'PDF') {
          // Capture chart images before generating PDF
          if (import.meta.env.DEV) { console.log('📸 Capturing chart images...'); }
          const html2canvas = (await import('html2canvas')).default;
          
          const chartImages = {};
          
          // Wait a bit for charts to fully render
          await new Promise(resolve => setTimeout(resolve, 500));
          
          try {
            // Find chart containers by looking for specific parent divs
            const visualAnalyticsSection = document.querySelector('.report-card');
            
            if (visualAnalyticsSection) {
              // Get all recharts-wrapper elements within the visual analytics section
              const allChartWrappers = Array.from(document.querySelectorAll('.recharts-wrapper'));
              
              if (import.meta.env.DEV) { console.log(`📊 Found ${allChartWrappers.length} total chart wrappers`); }
              
              // The last 3 charts should be from Payout Statement (Pie, Bar, Line)
              const payoutCharts = allChartWrappers.slice(-3);
              
              if (payoutCharts.length >= 3) {
                if (import.meta.env.DEV) { console.log('📊 Capturing Payout Statement charts...'); }
                
                // Capture Pie Chart (Status Distribution)
                const pieCanvas = await html2canvas(payoutCharts[0], {
                  backgroundColor: '#ffffff',
                  scale: 2,
                  logging: false,
                  useCORS: true
                });
                chartImages.pieChart = pieCanvas.toDataURL('image/png');
                if (import.meta.env.DEV) { console.log('✅ Captured Pie chart'); }
                
                // Capture Bar Chart (Series-wise Comparison)
                const barCanvas = await html2canvas(payoutCharts[1], {
                  backgroundColor: '#ffffff',
                  scale: 2,
                  logging: false,
                  useCORS: true
                });
                chartImages.barChart = barCanvas.toDataURL('image/png');
                if (import.meta.env.DEV) { console.log('✅ Captured Bar chart'); }
                
                // Capture Line Chart (Monthly Trend)
                const lineCanvas = await html2canvas(payoutCharts[2], {
                  backgroundColor: '#ffffff',
                  scale: 2,
                  logging: false,
                  useCORS: true
                });
                chartImages.lineChart = lineCanvas.toDataURL('image/png');
                if (import.meta.env.DEV) { console.log('✅ Captured Line chart'); }
              } else {
                if (import.meta.env.DEV) { console.log('⚠️ Not enough charts found'); }
              }
            } else {
              if (import.meta.env.DEV) { console.log('⚠️ Visual analytics section not found'); }
            }
          } catch (chartError) {
            if (import.meta.env.DEV) { console.warn('⚠️ Could not capture charts:', chartError); }
          }
          
          // Use PDF template service for Payout Statement with chart images
          if (import.meta.env.DEV) { console.log('📄 Using PDF template service for Payout Statement...'); }
          const pdfBytes = await pdfTemplateService.fillPayoutStatementReport(reportData, chartImages);
          const filename = `Payout_Statement_Report_${new Date().toISOString().split('T')[0]}.pdf`;
          pdfTemplateService.downloadPDF(pdfBytes, filename);
          if (import.meta.env.DEV) { console.log('✅ PDF downloaded successfully'); }
        } else if (selectedFormat === 'Excel') {
          // Use Excel export service for Payout Statement
          if (import.meta.env.DEV) { console.log('📊 Using Excel export service for Payout Statement...'); }
          excelExportService.exportPayoutStatementReport(reportData);
          if (import.meta.env.DEV) { console.log('✅ Excel downloaded successfully'); }
        } else if (selectedFormat === 'CSV') {
          // Use CSV export service for Payout Statement
          if (import.meta.env.DEV) { console.log('📊 Using CSV export service for Payout Statement...'); }
          excelExportService.exportPayoutStatementReportCSV(reportData);
          if (import.meta.env.DEV) { console.log('✅ CSV downloaded successfully'); }
        }
      } else if (reportName === 'Series-wise Performance') {
        if (selectedFormat === 'PDF') {
          // Capture chart images before generating PDF
          if (import.meta.env.DEV) { console.log('📸 Capturing chart images for Series-wise Performance...'); }
          const html2canvas = (await import('html2canvas')).default;
          
          const chartImages = {
            seriesCharts: [] // Array to hold charts for each series
          };
          
          // Wait a bit for charts to fully render
          await new Promise(resolve => setTimeout(resolve, 500));
          
          try {
            // Find all chart containers
            const allChartWrappers = Array.from(document.querySelectorAll('.recharts-wrapper'));
            if (import.meta.env.DEV) { console.log(`📊 Found ${allChartWrappers.length} total chart wrappers`); }
            
            // First chart should be the Series Comparison Bar Chart
            if (allChartWrappers.length > 0) {
              if (import.meta.env.DEV) { console.log('📊 Capturing Series Comparison Bar Chart...'); }
              const comparisonCanvas = await html2canvas(allChartWrappers[0], {
                backgroundColor: '#ffffff',
                scale: 2,
                logging: false,
                useCORS: true
              });
              chartImages.comparisonChart = comparisonCanvas.toDataURL('image/png');
              if (import.meta.env.DEV) { console.log('✅ Captured Series Comparison chart'); }
            }
            
            // Remaining charts are per-series (2 charts per series: Line + Pie)
            // Skip the first chart (comparison) and process pairs
            const seriesChartWrappers = allChartWrappers.slice(1);
            if (import.meta.env.DEV) {

              if (import.meta.env.DEV) { console.log(`📊 Processing ${seriesChartWrappers.length} series charts (${seriesChartWrappers.length / 2} series)`); }

            }
            
            for (let i = 0; i < seriesChartWrappers.length; i += 2) {
              const seriesChartData = {};
              
              // Line Chart (Monthly Trend)
              if (seriesChartWrappers[i]) {
                if (import.meta.env.DEV) {

                  if (import.meta.env.DEV) { console.log(`📊 Capturing series ${Math.floor(i / 2) + 1} - Line Chart...`); }

                }
                const lineCanvas = await html2canvas(seriesChartWrappers[i], {
                  backgroundColor: '#ffffff',
                  scale: 2,
                  logging: false,
                  useCORS: true
                });
                seriesChartData.lineChart = lineCanvas.toDataURL('image/png');
                if (import.meta.env.DEV) {

                  if (import.meta.env.DEV) { console.log(`✅ Captured series ${Math.floor(i / 2) + 1} Line chart`); }

                }
              }
              
              // Pie Chart (Ticket Distribution)
              if (seriesChartWrappers[i + 1]) {
                if (import.meta.env.DEV) {

                  if (import.meta.env.DEV) { console.log(`📊 Capturing series ${Math.floor(i / 2) + 1} - Pie Chart...`); }

                }
                const pieCanvas = await html2canvas(seriesChartWrappers[i + 1], {
                  backgroundColor: '#ffffff',
                  scale: 2,
                  logging: false,
                  useCORS: true
                });
                seriesChartData.pieChart = pieCanvas.toDataURL('image/png');
                if (import.meta.env.DEV) {

                  if (import.meta.env.DEV) { console.log(`✅ Captured series ${Math.floor(i / 2) + 1} Pie chart`); }

                }
              }
              
              chartImages.seriesCharts.push(seriesChartData);
            }
            
            if (import.meta.env.DEV) {

            
              if (import.meta.env.DEV) { console.log(`✅ Total charts captured: 1 comparison + ${chartImages.seriesCharts.length} series (${chartImages.seriesCharts.length * 2} charts)`); }

            
            }
          } catch (chartError) {
            if (import.meta.env.DEV) { console.warn('⚠️ Could not capture charts:', chartError); }
          }
          
          // Use PDF template service for Series-wise Performance Report with chart images
          if (import.meta.env.DEV) { console.log('📄 Using PDF template service for Series-wise Performance...'); }
          const pdfBytes = await pdfTemplateService.fillSeriesPerformanceReport(reportData, chartImages);
          const filename = `Series_Performance_Report_${new Date().toISOString().split('T')[0]}.pdf`;
          pdfTemplateService.downloadPDF(pdfBytes, filename);
          if (import.meta.env.DEV) { console.log('✅ PDF downloaded successfully'); }
        } else if (selectedFormat === 'Excel') {
          // Use Excel export service for Series-wise Performance
          if (import.meta.env.DEV) { console.log('📊 Using Excel export service for Series-wise Performance...'); }
          excelExportService.exportSeriesPerformanceReport(reportData);
          if (import.meta.env.DEV) { console.log('✅ Excel downloaded successfully'); }
        } else if (selectedFormat === 'CSV') {
          // Use CSV export service for Series-wise Performance
          if (import.meta.env.DEV) { console.log('📊 Using CSV export service for Series-wise Performance...'); }
          excelExportService.exportSeriesPerformanceReportCSV(reportData);
          if (import.meta.env.DEV) { console.log('✅ CSV downloaded successfully'); }
        }
      } else if (reportName === 'Investor Portfolio Summary') {
        if (selectedFormat === 'PDF') {
          // Capture chart images before generating PDF
          if (import.meta.env.DEV) { console.log('📸 Capturing chart images for Investor Portfolio Summary...'); }
          const html2canvas = (await import('html2canvas')).default;
          
          const chartImages = {
            investorCharts: [] // Array to hold charts for each investor
          };
          
          // Wait a bit for charts to fully render
          await new Promise(resolve => setTimeout(resolve, 500));
          
          try {
            // Find all chart containers
            const allChartWrappers = Array.from(document.querySelectorAll('.recharts-wrapper'));
            if (import.meta.env.DEV) { console.log(`📊 Found ${allChartWrappers.length} total chart wrappers for Investor Portfolio`); }
            
            // Process charts in pairs (2 charts per investor: Pie + Line)
            if (import.meta.env.DEV) {

              if (import.meta.env.DEV) { console.log(`📊 Processing ${allChartWrappers.length} investor charts (${allChartWrappers.length / 2} investors)`); }

            }
            
            for (let i = 0; i < allChartWrappers.length; i += 2) {
              const investorChartData = {};
              
              // Pie Chart (Investment Distribution by Series)
              if (allChartWrappers[i]) {
                if (import.meta.env.DEV) {

                  if (import.meta.env.DEV) { console.log(`📊 Capturing investor ${Math.floor(i / 2) + 1} - Pie Chart...`); }

                }
                const pieCanvas = await html2canvas(allChartWrappers[i], {
                  backgroundColor: '#ffffff',
                  scale: 2,
                  logging: false,
                  useCORS: true
                });
                investorChartData.pieChart = pieCanvas.toDataURL('image/png');
                if (import.meta.env.DEV) {

                  if (import.meta.env.DEV) { console.log(`✅ Captured investor ${Math.floor(i / 2) + 1} Pie chart`); }

                }
              }
              
              // Line Chart (Yearly Investment Trend)
              if (allChartWrappers[i + 1]) {
                if (import.meta.env.DEV) {

                  if (import.meta.env.DEV) { console.log(`📊 Capturing investor ${Math.floor(i / 2) + 1} - Line Chart...`); }

                }
                const lineCanvas = await html2canvas(allChartWrappers[i + 1], {
                  backgroundColor: '#ffffff',
                  scale: 2,
                  logging: false,
                  useCORS: true
                });
                investorChartData.lineChart = lineCanvas.toDataURL('image/png');
                if (import.meta.env.DEV) {

                  if (import.meta.env.DEV) { console.log(`✅ Captured investor ${Math.floor(i / 2) + 1} Line chart`); }

                }
              }
              
              chartImages.investorCharts.push(investorChartData);
            }
            
            if (import.meta.env.DEV) {

            
              if (import.meta.env.DEV) { console.log(`✅ Total charts captured: ${chartImages.investorCharts.length} investors (${chartImages.investorCharts.length * 2} charts)`); }

            
            }
          } catch (chartError) {
            if (import.meta.env.DEV) { console.warn('⚠️ Could not capture charts:', chartError); }
          }
          
          // Use PDF template service for Investor Portfolio Summary Report with chart images
          if (import.meta.env.DEV) { console.log('📄 Using PDF template service for Investor Portfolio Summary...'); }
          const pdfBytes = await pdfTemplateService.fillInvestorPortfolioReport(reportData, chartImages);
          const filename = `Investor_Portfolio_Summary_${new Date().toISOString().split('T')[0]}.pdf`;
          pdfTemplateService.downloadPDF(pdfBytes, filename);
          if (import.meta.env.DEV) { console.log('✅ PDF downloaded successfully'); }
        } else if (selectedFormat === 'Excel') {
          // Use Excel export service for Investor Portfolio Summary
          if (import.meta.env.DEV) { console.log('📊 Using Excel export service for Investor Portfolio Summary...'); }
          excelExportService.exportInvestorPortfolioReport(reportData);
          if (import.meta.env.DEV) { console.log('✅ Excel downloaded successfully'); }
        } else if (selectedFormat === 'CSV') {
          // Use CSV export service for Investor Portfolio Summary
          if (import.meta.env.DEV) { console.log('📊 Using CSV export service for Investor Portfolio Summary...'); }
          excelExportService.exportInvestorPortfolioReportCSV(reportData);
          if (import.meta.env.DEV) { console.log('✅ CSV downloaded successfully'); }
        }
      } else if (reportName === 'KYC Status Report') {
        if (selectedFormat === 'PDF') {
          // Use PDF template service for KYC Status Report
          if (import.meta.env.DEV) { console.log('📄 Using PDF template service for KYC Status Report...'); }
          const pdfBytes = await pdfTemplateService.fillKYCStatusReport(reportData);
          const filename = `KYC_Status_Report_${new Date().toISOString().split('T')[0]}.pdf`;
          pdfTemplateService.downloadPDF(pdfBytes, filename);
          if (import.meta.env.DEV) { console.log('✅ PDF downloaded successfully'); }
        } else if (selectedFormat === 'Excel') {
          // Use Excel export service for KYC Status Report
          if (import.meta.env.DEV) { console.log('📊 Using Excel export service for KYC Status Report...'); }
          excelExportService.exportKYCStatusReport(reportData);
          if (import.meta.env.DEV) { console.log('✅ Excel downloaded successfully'); }
        } else if (selectedFormat === 'CSV') {
          // Use CSV export service for KYC Status Report
          if (import.meta.env.DEV) { console.log('📊 Using CSV export service for KYC Status Report...'); }
          excelExportService.exportKYCStatusReportCSV(reportData);
          if (import.meta.env.DEV) { console.log('✅ CSV downloaded successfully'); }
        }
      } else if (reportName === 'New Investor Report') {
        if (selectedFormat === 'PDF') {
          // Use PDF template service for New Investor Report
          if (import.meta.env.DEV) { console.log('📄 Using PDF template service for New Investor Report...'); }
          const pdfBytes = await pdfTemplateService.fillNewInvestorReport(reportData);
          const filename = `New_Investor_Report_${new Date().toISOString().split('T')[0]}.pdf`;
          pdfTemplateService.downloadPDF(pdfBytes, filename);
          if (import.meta.env.DEV) { console.log('✅ PDF downloaded successfully'); }
        } else if (selectedFormat === 'Excel') {
          // Use Excel export service for New Investor Report
          if (import.meta.env.DEV) { console.log('📊 Using Excel export service for New Investor Report...'); }
          excelExportService.exportNewInvestorReport(reportData);
          if (import.meta.env.DEV) { console.log('✅ Excel downloaded successfully'); }
        } else if (selectedFormat === 'CSV') {
          // Use CSV export service for New Investor Report
          if (import.meta.env.DEV) { console.log('📊 Using CSV export service for New Investor Report...'); }
          excelExportService.exportNewInvestorReportCSV(reportData);
          if (import.meta.env.DEV) { console.log('✅ CSV downloaded successfully'); }
        }
      } else if (reportName === 'RBI Compliance Report') {
        if (selectedFormat === 'PDF') {
          // Use PDF template service for RBI Compliance Report
          if (import.meta.env.DEV) { console.log('📄 Using PDF template service for RBI Compliance Report...'); }
          const pdfBytes = await pdfTemplateService.fillRBIComplianceReport(reportData);
          const filename = 'reports.pdf';
          pdfTemplateService.downloadPDF(pdfBytes, filename);
          if (import.meta.env.DEV) { console.log('✅ PDF downloaded successfully'); }
        } else if (selectedFormat === 'Excel') {
          // Use Excel export service for RBI Compliance Report
          if (import.meta.env.DEV) { console.log('📊 Using Excel export service for RBI Compliance Report...'); }
          excelExportService.exportRBIComplianceReport(reportData);
          if (import.meta.env.DEV) { console.log('✅ Excel downloaded successfully'); }
        } else if (selectedFormat === 'CSV') {
          // Use CSV export service for RBI Compliance Report
          if (import.meta.env.DEV) { console.log('📊 Using CSV export service for RBI Compliance Report...'); }
          excelExportService.exportRBIComplianceReportCSV(reportData);
          if (import.meta.env.DEV) { console.log('✅ CSV downloaded successfully'); }
        }
      } else if (reportName === 'SEBI Disclosure Report') {
        if (selectedFormat === 'PDF') {
          // Use PDF template service for SEBI Disclosure Report
          if (import.meta.env.DEV) { console.log('📄 Using PDF template service for SEBI Disclosure Report...'); }
          const pdfBytes = await pdfTemplateService.fillSEBIDisclosureReport(reportData);
          const filename = `SEBI_Disclosure_Report_${new Date().toISOString().split('T')[0]}.pdf`;
          pdfTemplateService.downloadPDF(pdfBytes, filename);
          if (import.meta.env.DEV) { console.log('✅ PDF downloaded successfully'); }
        } else if (selectedFormat === 'Excel') {
          // Use Excel export service for SEBI Disclosure Report
          if (import.meta.env.DEV) { console.log('📊 Using Excel export service for SEBI Disclosure Report...'); }
          excelExportService.exportSEBIDisclosureReport(reportData);
          if (import.meta.env.DEV) { console.log('✅ Excel downloaded successfully'); }
        } else if (selectedFormat === 'CSV') {
          // Use CSV export service for SEBI Disclosure Report
          if (import.meta.env.DEV) { console.log('📊 Using CSV export service for SEBI Disclosure Report...'); }
          excelExportService.exportSEBIDisclosureReportCSV(reportData);
          if (import.meta.env.DEV) { console.log('✅ CSV downloaded successfully'); }
        }
      } else if (reportName === 'Audit Trail Report') {
        if (selectedFormat === 'PDF') {
          // Use PDF template service for Audit Trail Report
          if (import.meta.env.DEV) { console.log('📄 Using PDF template service for Audit Trail Report...'); }
          const pdfBytes = await pdfTemplateService.fillAuditTrailReport(reportData);
          const filename = `Audit_Trail_Report_${new Date().toISOString().split('T')[0]}.pdf`;
          pdfTemplateService.downloadPDF(pdfBytes, filename);
          if (import.meta.env.DEV) { console.log('✅ PDF downloaded successfully'); }
        } else if (selectedFormat === 'Excel') {
          // Use Excel export service for Audit Trail Report
          if (import.meta.env.DEV) { console.log('📊 Using Excel export service for Audit Trail Report...'); }
          excelExportService.exportAuditTrailReport(reportData);
          if (import.meta.env.DEV) { console.log('✅ Excel downloaded successfully'); }
        } else if (selectedFormat === 'CSV') {
          // Use CSV export service for Audit Trail Report
          if (import.meta.env.DEV) { console.log('📊 Using CSV export service for Audit Trail Report...'); }
          excelExportService.exportAuditTrailReportCSV(reportData);
          if (import.meta.env.DEV) { console.log('✅ CSV downloaded successfully'); }
        }
      } else if (reportName === 'Daily Activity Report') {
        if (selectedFormat === 'PDF') {
          // Capture pie chart as image
          if (import.meta.env.DEV) { console.log('📄 Using PDF template service for Daily Activity Report...'); }
          if (import.meta.env.DEV) { console.log('📸 Capturing pie chart...'); }
          
          let chartImageDataUrl = null;
          const chartElement = document.getElementById('daily-activity-pie-chart');
          
          if (chartElement) {
            try {
              const canvas = await html2canvas(chartElement, {
                backgroundColor: '#ffffff',
                scale: 2,
                logging: false,
                useCORS: true
              });
              chartImageDataUrl = canvas.toDataURL('image/png');
              if (import.meta.env.DEV) { console.log('✅ Pie chart captured successfully'); }
            } catch (error) {
              if (import.meta.env.DEV) { console.error('❌ Error capturing pie chart:', error); }
            }
          } else {
            if (import.meta.env.DEV) { console.warn('⚠️ Pie chart element not found'); }
          }
          
          const pdfBytes = await pdfTemplateService.fillDailyActivityReport(reportData, chartImageDataUrl);
          const filename = `Daily_Activity_Report_${new Date().toISOString().split('T')[0]}.pdf`;
          pdfTemplateService.downloadPDF(pdfBytes, filename);
          if (import.meta.env.DEV) { console.log('✅ PDF downloaded successfully'); }
        } else if (selectedFormat === 'Excel') {
          // Use Excel export service for Daily Activity Report
          if (import.meta.env.DEV) { console.log('📊 Using Excel export service for Daily Activity Report...'); }
          excelExportService.exportDailyActivityReport(reportData);
          if (import.meta.env.DEV) { console.log('✅ Excel downloaded successfully'); }
        } else if (selectedFormat === 'CSV') {
          // Use CSV export service for Daily Activity Report
          if (import.meta.env.DEV) { console.log('📊 Using CSV export service for Daily Activity Report...'); }
          excelExportService.exportDailyActivityReportCSV(reportData);
          if (import.meta.env.DEV) { console.log('✅ CSV downloaded successfully'); }
        }
      } else if (reportName === 'Subscription Trend Analysis') {
        if (selectedFormat === 'PDF') {
          // Capture bar chart as image
          if (import.meta.env.DEV) { console.log('📄 Using PDF template service for Subscription Trend Analysis...'); }
          if (import.meta.env.DEV) { console.log('📸 Capturing bar chart...'); }
          
          let chartImageDataUrl = null;
          const chartElement = document.getElementById('subscription-trend-bar-chart');
          
          if (chartElement) {
            try {
              const canvas = await html2canvas(chartElement, {
                backgroundColor: '#ffffff',
                scale: 2,
                logging: false,
                useCORS: true
              });
              chartImageDataUrl = canvas.toDataURL('image/png');
              if (import.meta.env.DEV) { console.log('✅ Bar chart captured successfully'); }
            } catch (error) {
              if (import.meta.env.DEV) { console.error('❌ Error capturing bar chart:', error); }
            }
          } else {
            if (import.meta.env.DEV) { console.warn('⚠️ Bar chart element not found'); }
          }
          
          const pdfBytes = await pdfTemplateService.fillSubscriptionTrendAnalysis(reportData, chartImageDataUrl);
          const filename = `Subscription_Trend_Analysis_${new Date().toISOString().split('T')[0]}.pdf`;
          pdfTemplateService.downloadPDF(pdfBytes, filename);
          if (import.meta.env.DEV) { console.log('✅ PDF downloaded successfully'); }
        } else if (selectedFormat === 'Excel') {
          // Use Excel export service for Subscription Trend Analysis
          if (import.meta.env.DEV) { console.log('📊 Using Excel export service for Subscription Trend Analysis...'); }
          excelExportService.exportSubscriptionTrendAnalysis(reportData);
          if (import.meta.env.DEV) { console.log('✅ Excel downloaded successfully'); }
        } else if (selectedFormat === 'CSV') {
          // Use CSV export service for Subscription Trend Analysis
          if (import.meta.env.DEV) { console.log('📊 Using CSV export service for Subscription Trend Analysis...'); }
          excelExportService.exportSubscriptionTrendAnalysisCSV(reportData);
          if (import.meta.env.DEV) { console.log('✅ CSV downloaded successfully'); }
        }
      } else if (reportName === 'Series Maturity Report') {
        if (selectedFormat === 'PDF') {
          // Use PDF template service for Series Maturity Report
          if (import.meta.env.DEV) { console.log('📄 Using PDF template service for Series Maturity Report...'); }
          const pdfBytes = await pdfTemplateService.fillSeriesMaturityReport(reportData);
          const filename = `Series_Maturity_Report_${new Date().toISOString().split('T')[0]}.pdf`;
          pdfTemplateService.downloadPDF(pdfBytes, filename);
          if (import.meta.env.DEV) { console.log('✅ PDF downloaded successfully'); }
        } else if (selectedFormat === 'Excel') {
          // Use Excel export service for Series Maturity Report
          if (import.meta.env.DEV) { console.log('📊 Using Excel export service for Series Maturity Report...'); }
          excelExportService.exportSeriesMaturityReport(reportData);
          if (import.meta.env.DEV) { console.log('✅ Excel downloaded successfully'); }
        } else if (selectedFormat === 'CSV') {
          // Use CSV export service for Series Maturity Report
          if (import.meta.env.DEV) { console.log('📊 Using CSV export service for Series Maturity Report...'); }
          excelExportService.exportSeriesMaturityReportCSV(reportData);
          if (import.meta.env.DEV) { console.log('✅ CSV downloaded successfully'); }
        }
      } else {
        // Use default download handler for other reports/formats
        onDownload(reportName, selectedFormat);
      }
      
      // Log the report download to backend
      try {
        if (import.meta.env.DEV) { console.log('📝 Logging report download to backend...'); }
        await apiService.request('/reports/log-download', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            report_name: reportName,
            report_type: selectedFormat,
            record_count: getRecordCount(reportData)
          })
        });
        if (import.meta.env.DEV) { console.log('✅ Report download logged successfully'); }
        
        // Notify parent to refresh statistics
        if (onReportGenerated) {
          onReportGenerated();
        }
      } catch (logError) {
        if (import.meta.env.DEV) {

          if (import.meta.env.DEV) { console.error('⚠️ Error logging report download (non-critical):', logError); }

        }
        // Don't fail the download if logging fails
      }
      
    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Error downloading report:', error); }
      alert(`Error generating ${selectedFormat}: ${error.message}`);
    }
  };
  
  // Helper function to count records in report data
  const getRecordCount = (data) => {
    if (!data) return 0;
    
    // Try to count records based on report type
    if (data.investment_details) return data.investment_details.length;
    if (data.investor_details) return data.investor_details.length;
    if (data.series_maturing_90_days) return data.series_maturing_90_days.length;
    if (data.user_activities) return data.user_activities.length;
    if (data.audit_logs) return data.audit_logs.length;
    
    return 0;
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
      {/* Report Filters */}
      <div className="report-card">
        <div className="card-header">
          <MdDateRange className="header-icon" />
          <h3>Report Filters</h3>
        </div>
        <div className="card-content">
          <div className="date-selector">
            <div className="date-input-group">
              <label>From Date:</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
                className="date-input"
              />
            </div>
            <div className="date-input-group">
              <label>To Date:</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => handleDateChange('endDate', e.target.value)}
                className="date-input"
              />
            </div>
            <div className="date-input-group">
              <label>Series:</label>
              <select
                value={selectedSeries}
                onChange={(e) => setSelectedSeries(e.target.value)}
                className="date-input"
                disabled={loadingSeries}
              >
                <option value="all">All Series</option>
                {seriesList.map((series) => (
                  <option key={series.id} value={series.series_code}>
                    {series.name} ({series.series_code})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {reportData?.summary && (
        <div className="report-card">
          <div className="card-header">
            <MdAssessment className="header-icon" />
            <h3>Collection Summary</h3>
          </div>
          <div className="card-content">
            <div className="kpi-grid">
              <div className="kpi-item">
                <FaRupeeSign className="kpi-icon" />
                <div className="kpi-details">
                  <span className="kpi-value">
                    ₹{reportData.summary.total_funds_raised?.toLocaleString('en-IN') || '0'}
                  </span>
                  <span className="kpi-label">Total Funds Raised</span>
                </div>
              </div>
              <div className="kpi-item">
                <MdAccountBalance className="kpi-icon" />
                <div className="kpi-details">
                  <span className="kpi-value">
                    ₹{reportData.summary.total_investment_this_month?.toLocaleString('en-IN') || '0'}
                  </span>
                  <span className="kpi-label">Investment This Month</span>
                </div>
              </div>
              <div className="kpi-item">
                <MdTrendingUp className="kpi-icon" />
                <div className="kpi-details">
                  <span className="kpi-value">
                    {reportData.summary.fulfillment_percentage?.toFixed(2) || '0'}%
                  </span>
                  <span className="kpi-label">Collection Rate</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Series-wise Breakdown */}
      {reportData?.series_breakdown && reportData.series_breakdown.length > 0 && (
        <div className="report-card">
          <div className="card-header">
            <MdShowChart className="header-icon" />
            <h3>Series-wise Collection Breakdown</h3>
          </div>
          <div className="card-content">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Series</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Target Amount</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Collected Amount</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Achievement</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Investors</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Transactions</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Avg Investment</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.series_breakdown.map((series, index) => {
                    const achievement = series.achievement_percentage || 0;
                    const barColor = achievement >= 100 
                      ? '#22c55e'  // Green for 100%+
                      : achievement >= 75 
                        ? '#3b82f6'  // Blue for 75%+
                        : achievement >= 50 
                          ? '#eab308'  // Yellow for 50%+
                          : '#f97316';  // Orange for <50%
                    
                    return (
                      <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: '600' }}>{series.series_code}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>{series.series_name}</div>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          ₹{series.target_amount?.toLocaleString('en-IN') || '0'}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>
                          ₹{series.collected_amount?.toLocaleString('en-IN') || '0'}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: '600', minWidth: '50px' }}>
                              {achievement.toFixed(1)}%
                            </span>
                            <div style={{ 
                              width: '100px', 
                              height: '8px', 
                              backgroundColor: '#e5e7eb', 
                              borderRadius: '4px',
                              overflow: 'hidden'
                            }}>
                              <div style={{ 
                                width: `${Math.min(achievement, 100)}%`, 
                                height: '100%', 
                                backgroundColor: barColor,
                                transition: 'width 0.3s ease'
                              }} />
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          {series.investor_count || 0}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          {series.transaction_count || 0}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          ₹{series.average_investment?.toLocaleString('en-IN') || '0'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Investment Details Table */}
      {reportData?.investment_details && reportData.investment_details.length > 0 && (
        <div className="report-card">
          <div className="card-header">
            <MdBarChart className="header-icon" />
            <h3>Investment Details ({reportData.total_records} Records)</h3>
          </div>
          <div className="card-content">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Investor ID</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Investor Name</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Series Code</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Series Name</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Investment Amount</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Date Received</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Date Transferred</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.investment_details.map((investment, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px' }}>{investment.investor_id}</td>
                      <td style={{ padding: '12px' }}>{investment.investor_name}</td>
                      <td style={{ padding: '12px' }}>{investment.series_code}</td>
                      <td style={{ padding: '12px' }}>{investment.series_name}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>
                        ₹{investment.amount?.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {investment.date_received || '-'}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {investment.date_transferred || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Investor Statistics */}
      {reportData?.investor_statistics && (
        <div className="report-card">
          <div className="card-header">
            <FaUsers className="header-icon" />
            <h3>Investor Analytics</h3>
          </div>
          <div className="card-content">
            <div className="kpi-grid">
              <div className="kpi-item">
                <FaUserPlus className="kpi-icon" />
                <div className="kpi-details">
                  <span className="kpi-value">
                    {reportData.investor_statistics.new_investors || 0}
                  </span>
                  <span className="kpi-label">New Investors</span>
                </div>
              </div>
              <div className="kpi-item">
                <FaUsers className="kpi-icon" />
                <div className="kpi-details">
                  <span className="kpi-value">
                    {reportData.investor_statistics.returning_investors || 0}
                  </span>
                  <span className="kpi-label">Returning Investors</span>
                </div>
              </div>
              <div className="kpi-item">
                <MdTrendingUp className="kpi-icon" />
                <div className="kpi-details">
                  <span className="kpi-value">
                    {reportData.investor_statistics.retention_rate?.toFixed(2) || '0'}%
                  </span>
                  <span className="kpi-label">Retention Rate</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Data Message */}
      {reportData?.investment_details && reportData.investment_details.length === 0 && (
        <div className="report-card">
          <div className="card-content" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            <p>No investment data found for the selected filters.</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderPayoutStatement = () => (
    <div className="report-content">
      {/* Report Filters */}
      <div className="report-card">
        <div className="card-header">
          <MdDateRange className="header-icon" />
          <h3>Report Filters</h3>
        </div>
        <div className="card-content">
          {/* Date Selection Type Toggle */}
          <div className="date-selector">
            <div className="date-input-group" style={{ gridColumn: '1 / -1', marginBottom: '15px' }}>
              <label>Date Selection Type:</label>
              <div style={{ display: 'flex', gap: '15px', marginTop: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="dateSelectionType"
                    value="range"
                    checked={dateSelectionType === 'range'}
                    onChange={(e) => setDateSelectionType(e.target.value)}
                  />
                  <span>Date Range (From - To)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="dateSelectionType"
                    value="month"
                    checked={dateSelectionType === 'month'}
                    onChange={(e) => setDateSelectionType(e.target.value)}
                  />
                  <span>Select Month</span>
                </label>
              </div>
            </div>

            {/* Date Range Selection */}
            {dateSelectionType === 'range' && (
              <>
                <div className="date-input-group">
                  <label>From Date:</label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => handleDateChange('startDate', e.target.value)}
                    className="date-input"
                  />
                </div>
                <div className="date-input-group">
                  <label>To Date:</label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => handleDateChange('endDate', e.target.value)}
                    className="date-input"
                  />
                </div>
              </>
            )}

            {/* Month Selection */}
            {dateSelectionType === 'month' && (
              <div className="date-input-group">
                <label>Select Month:</label>
                <input
                  type="month"
                  value={selectedMonth}
                  max={new Date().toISOString().slice(0, 7)}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="date-input"
                />
              </div>
            )}

            {/* Series Selection */}
            <div className="date-input-group">
              <label>Series:</label>
              <select
                value={selectedSeries}
                onChange={(e) => setSelectedSeries(e.target.value)}
                className="date-input"
                disabled={loadingSeries}
              >
                <option value="all">All Series</option>
                {seriesList.map((series) => (
                  <option key={series.id} value={series.series_code}>
                    {series.name} ({series.series_code})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Payout Summary Cards */}
      {reportData?.summary && (
        <div className="report-card">
          <div className="card-header">
            <FaFileInvoiceDollar className="header-icon" />
            <h3>Payout Summary</h3>
          </div>
          <div className="card-content">
            <div className="kpi-grid">
              <div className="kpi-item">
                <FaRupeeSign className="kpi-icon" />
                <div className="kpi-details">
                  <span className="kpi-value">
                    ₹{reportData.summary.total_payout?.toLocaleString('en-IN') || '0'}
                  </span>
                  <span className="kpi-label">Total Payout Amount</span>
                </div>
              </div>
              <div className="kpi-item">
                <FaUserCheck className="kpi-icon" style={{ color: '#22c55e' }} />
                <div className="kpi-details">
                  <span className="kpi-value">
                    ₹{reportData.summary.paid_amount?.toLocaleString('en-IN') || '0'}
                  </span>
                  <span className="kpi-label">Amount Paid</span>
                </div>
              </div>
              <div className="kpi-item">
                <FaClock className="kpi-icon" style={{ color: '#f59e0b' }} />
                <div className="kpi-details">
                  <span className="kpi-value">
                    ₹{reportData.summary.to_be_paid_amount?.toLocaleString('en-IN') || '0'}
                  </span>
                  <span className="kpi-label">Amount To Be Paid</span>
                </div>
              </div>
              <div className="kpi-item">
                <MdTrendingUp className="kpi-icon" style={{ color: '#3b82f6' }} />
                <div className="kpi-details">
                  <span className="kpi-value">
                    {(() => {
                      const total = reportData.summary.total_payout || 0;
                      const paid = reportData.summary.paid_amount || 0;
                      const completionRate = total > 0 ? (paid / total * 100) : 0;
                      return completionRate.toFixed(2);
                    })()}%
                  </span>
                  <span className="kpi-label">Payout Completion Rate</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payout Details Table */}
      {reportData?.payout_details && reportData.payout_details.length > 0 && (
        <div className="report-card">
          <div className="card-header">
            <MdBarChart className="header-icon" />
            <h3>Payout Details ({reportData.total_records} Records)</h3>
          </div>
          <div className="card-content">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Investor ID</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Investor Name</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Series Code</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Series Name</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Amount</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Bank Name</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Account Number</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>IFSC Code</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.payout_details.map((payout, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px' }}>{payout.investor_id}</td>
                      <td style={{ padding: '12px' }}>{payout.investor_name}</td>
                      <td style={{ padding: '12px' }}>{payout.series_code}</td>
                      <td style={{ padding: '12px' }}>{payout.series_name}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>
                        ₹{payout.amount?.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: 
                            payout.status === 'Paid' ? '#dcfce7' :
                            payout.status === 'Processing' ? '#dbeafe' :
                            payout.status === 'Scheduled' ? '#fef3c7' : '#fee2e2',
                          color:
                            payout.status === 'Paid' ? '#166534' :
                            payout.status === 'Processing' ? '#1e40af' :
                            payout.status === 'Scheduled' ? '#92400e' : '#991b1b'
                        }}>
                          {payout.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>{payout.bank_name || '-'}</td>
                      <td style={{ padding: '12px' }}>{payout.account_number || '-'}</td>
                      <td style={{ padding: '12px' }}>{payout.ifsc_code || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Series-wise Breakdown Section */}
      {reportData?.series_breakdown && reportData.series_breakdown.length > 0 && (
        <div className="report-card">
          <div className="card-header">
            <MdBarChart className="header-icon" />
            <h3>Series-wise Breakdown</h3>
          </div>
          <div className="card-content">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Series Code</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Series Name</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Total Payout</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Paid Amount</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Pending Amount</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Number of Investors</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.series_breakdown.map((series, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px', fontWeight: '600' }}>{series.series_code}</td>
                      <td style={{ padding: '12px' }}>{series.series_name}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>
                        ₹{series.total_payout?.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#22c55e' }}>
                        ₹{series.paid_amount?.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#f59e0b' }}>
                        ₹{series.pending_amount?.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {series.investor_count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Visual Charts Section */}
      {reportData?.status_breakdown && reportData.status_breakdown.length > 0 && (
        <div className="report-card">
          <div className="card-header">
            <MdPieChart className="header-icon" />
            <h3>Visual Analytics</h3>
          </div>
          <div className="card-content">
            {/* Status Distribution Pie Chart */}
            <div style={{ marginBottom: '40px' }}>
              <h4 style={{ marginBottom: '20px', color: '#334155', fontSize: '16px' }}>Status Distribution</h4>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={reportData.status_breakdown.map(item => ({
                      name: item.status,
                      value: item.total_amount,
                      count: item.count
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={140}
                    innerRadius={0}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {reportData.status_breakdown.map((entry, index) => {
                      const colors = {
                        'Paid': '#22c55e',
                        'Processing': '#3b82f6',
                        'Scheduled': '#f59e0b',
                        'Pending': '#ef4444'
                      };
                      return <Cell key={`cell-${index}`} fill={colors[entry.status] || '#94a3b8'} />;
                    })}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name, props) => [
                      `₹${value.toLocaleString('en-IN')} (${props.payload.count} payouts)`,
                      props.payload.name
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Series-wise Comparison Bar Chart */}
            {reportData?.series_breakdown && reportData.series_breakdown.length > 0 && (
              <div style={{ marginBottom: '40px' }}>
                <h4 style={{ marginBottom: '20px', color: '#334155', fontSize: '16px' }}>Series-wise Payout Comparison</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={reportData.series_breakdown.map(item => ({
                      name: item.series_code,
                      'Total Payout': item.total_payout,
                      'Paid': item.paid_amount,
                      'Pending': item.pending_amount
                    }))}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => `₹${value.toLocaleString('en-IN')}`}
                    />
                    <Legend />
                    <Bar dataKey="Total Payout" fill="#8b5cf6" />
                    <Bar dataKey="Paid" fill="#22c55e" />
                    <Bar dataKey="Pending" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Monthly Trend Line Chart */}
            {reportData?.monthly_trend && reportData.monthly_trend.length > 0 && (
              <div>
                <h4 style={{ marginBottom: '20px', color: '#334155', fontSize: '16px' }}>Payout Trend Over Months</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={reportData.monthly_trend.map(item => ({
                      month: item.month,
                      'Total Amount': item.total_amount,
                      'Paid Amount': item.paid_amount
                    }))}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => `₹${value.toLocaleString('en-IN')}`}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="Total Amount" stroke="#8b5cf6" strokeWidth={2} />
                    <Line type="monotone" dataKey="Paid Amount" stroke="#22c55e" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {/* No Data Message */}
      {reportData?.payout_details && reportData.payout_details.length === 0 && (
        <div className="report-card">
          <div className="card-content" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            <p>No payout data found for the selected filters.</p>
          </div>
        </div>
      )}

    </div>
  );

  const renderSeriesPerformance = () => (
    <div className="report-content">
      {/* Summary Cards */}
      {reportData?.summary && (
        <div className="report-card">
          <div className="card-header">
            <MdAssessment className="header-icon" />
            <h3>Performance Summary</h3>
          </div>
          <div className="card-content">
            <div className="kpi-grid">
              <div className="kpi-item">
                <MdAssessment className="kpi-icon" />
                <div className="kpi-details">
                  <span className="kpi-value">
                    {reportData.summary.total_series || 0}
                  </span>
                  <span className="kpi-label">Total Series</span>
                </div>
              </div>
              <div className="kpi-item">
                <HiCheckCircle className="kpi-icon" />
                <div className="kpi-details">
                  <span className="kpi-value">
                    {reportData.summary.active_series || 0}
                  </span>
                  <span className="kpi-label">Active Series</span>
                </div>
              </div>
              <div className="kpi-item">
                <MdTrendingUp className="kpi-icon" />
                <div className="kpi-details">
                  <span className="kpi-value">
                    ₹{(reportData.summary.total_investments || 0).toLocaleString('en-IN')}
                  </span>
                  <span className="kpi-label">Total Investments</span>
                </div>
              </div>
              <div className="kpi-item">
                <FaUsers className="kpi-icon" />
                <div className="kpi-details">
                  <span className="kpi-value">
                    {reportData.summary.total_investors || 0}
                  </span>
                  <span className="kpi-label">Total Investors</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Series Comparison Table */}
      {reportData?.series_comparison && reportData.series_comparison.length > 0 && (
        <div className="report-card">
          <div className="card-header">
            <MdBarChart className="header-icon" />
            <h3>Series Comparison Table</h3>
          </div>
          <div className="card-content">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Series Code</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Series Name</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Target Amount</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Funds Raised</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Subscription %</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Total Investments</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Total Investors</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Repeated Investors</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Interest Rate</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Avg Ticket Size</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.series_comparison.map((series, index) => {
                    const subscriptionRatio = series.subscription_ratio || 0;
                    const barColor = subscriptionRatio >= 100 
                      ? '#22c55e'
                      : subscriptionRatio >= 75 
                        ? '#3b82f6'
                        : subscriptionRatio >= 50 
                          ? '#eab308'
                          : '#f97316';
                    
                    return (
                      <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '12px', fontWeight: '600' }}>{series.series_code}</td>
                        <td style={{ padding: '12px' }}>{series.name}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600',
                            backgroundColor: 
                              series.status === 'accepting' ? '#dbeafe' :
                              series.status === 'active' ? '#dcfce7' :
                              series.status === 'upcoming' ? '#fef3c7' :
                              series.status === 'DRAFT' ? '#e0e7ff' :
                              series.status === 'REJECTED' ? '#fee2e2' :
                              series.status === 'matured' ? '#f3f4f6' : '#f3f4f6',
                            color:
                              series.status === 'accepting' ? '#1e40af' :
                              series.status === 'active' ? '#166534' :
                              series.status === 'upcoming' ? '#92400e' :
                              series.status === 'DRAFT' ? '#3730a3' :
                              series.status === 'REJECTED' ? '#991b1b' :
                              series.status === 'matured' ? '#475569' : '#475569'
                          }}>
                            {series.status_display}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          ₹{series.target_amount?.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>
                          ₹{series.funds_raised?.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: '600', minWidth: '50px' }}>
                              {subscriptionRatio.toFixed(1)}%
                            </span>
                            <div style={{ 
                              width: '100px', 
                              height: '8px', 
                              backgroundColor: '#e5e7eb', 
                              borderRadius: '4px',
                              overflow: 'hidden'
                            }}>
                              <div style={{ 
                                width: `${Math.min(subscriptionRatio, 100)}%`, 
                                height: '100%', 
                                backgroundColor: barColor,
                                transition: 'width 0.3s ease'
                              }} />
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          {series.total_investments}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          {series.total_investors}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <div>
                            <span style={{ fontWeight: '600' }}>{series.repeated_investors}</span>
                            <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '4px' }}>
                              ({series.repeated_investor_percentage}%)
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          {series.interest_rate}% p.a.
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          ₹{series.avg_ticket_size?.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Series Comparison Graph */}
      {reportData?.series_comparison && reportData.series_comparison.length > 0 && (
        <div className="report-card">
          <div className="card-header">
            <MdShowChart className="header-icon" />
            <h3>Series Comparison - Subscription Rate</h3>
          </div>
          <div className="card-content">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart 
                data={reportData.series_comparison}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="series_code" />
                <YAxis label={{ value: 'Subscription %', angle: -90, position: 'insideLeft' }} />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'subscription_ratio') return [`${value}%`, 'Subscription Rate'];
                    return [value, name];
                  }}
                  labelFormatter={(label) => `Series: ${label}`}
                />
                <Legend />
                <Bar dataKey="subscription_ratio" fill="#3b82f6" name="Subscription Rate (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Detailed Series Breakdown */}
      {reportData?.detailed_series_data && reportData.detailed_series_data.length > 0 && (
        reportData.detailed_series_data.map((seriesDetail, index) => {
          const seriesInfo = reportData.series_comparison.find(s => s.id === seriesDetail.series_id);
          
          return (
            <div key={index} className="report-card">
              <div className="card-header">
                <MdPieChart className="header-icon" />
                <h3>
                  {seriesDetail.series_code} - {seriesDetail.series_name}
                  <span style={{
                    display: 'inline-block',
                    marginLeft: '12px',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    backgroundColor: 
                      seriesInfo?.status === 'accepting' ? '#dbeafe' :
                      seriesInfo?.status === 'active' ? '#dcfce7' :
                      seriesInfo?.status === 'upcoming' ? '#fef3c7' :
                      seriesInfo?.status === 'DRAFT' ? '#e0e7ff' :
                      seriesInfo?.status === 'REJECTED' ? '#fee2e2' :
                      seriesInfo?.status === 'matured' ? '#f3f4f6' : '#f3f4f6',
                    color:
                      seriesInfo?.status === 'accepting' ? '#1e40af' :
                      seriesInfo?.status === 'active' ? '#166534' :
                      seriesInfo?.status === 'upcoming' ? '#92400e' :
                      seriesInfo?.status === 'DRAFT' ? '#3730a3' :
                      seriesInfo?.status === 'REJECTED' ? '#991b1b' :
                      seriesInfo?.status === 'matured' ? '#475569' : '#475569'
                  }}>
                    {seriesInfo?.status_display}
                  </span>
                </h3>
              </div>
              <div className="card-content">
                {/* Payout Statistics */}
                <div style={{ marginBottom: '30px' }}>
                  <h4 style={{ marginBottom: '15px', color: '#334155', fontSize: '16px' }}>Payout Statistics</h4>
                  <div className="kpi-grid">
                    <div className="kpi-item">
                      <MdPayment className="kpi-icon" />
                      <div className="kpi-details">
                        <span className="kpi-value">
                          {seriesDetail.payout_stats.total_payouts}
                        </span>
                        <span className="kpi-label">Total Payouts</span>
                      </div>
                    </div>
                    <div className="kpi-item">
                      <FaRupeeSign className="kpi-icon" />
                      <div className="kpi-details">
                        <span className="kpi-value">
                          ₹{seriesDetail.payout_stats.total_payout_amount?.toLocaleString('en-IN')}
                        </span>
                        <span className="kpi-label">Total Amount</span>
                      </div>
                    </div>
                    <div className="kpi-item">
                      <HiCheckCircle className="kpi-icon" />
                      <div className="kpi-details">
                        <span className="kpi-value" style={{ color: '#22c55e' }}>
                          {seriesDetail.payout_stats.paid_count}
                        </span>
                        <span className="kpi-label">Paid</span>
                      </div>
                    </div>
                    <div className="kpi-item">
                      <MdPending className="kpi-icon" />
                      <div className="kpi-details">
                        <span className="kpi-value" style={{ color: '#f59e0b' }}>
                          {seriesDetail.payout_stats.pending_count}
                        </span>
                        <span className="kpi-label">Pending</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Investor Details Table */}
                {(() => {
                  if (import.meta.env.DEV) { console.log(`📊 Series ${seriesDetail.series_code} - investor_details:`, seriesDetail.investor_details); }
                  if (import.meta.env.DEV) { console.log(`📊 Series ${seriesDetail.series_code} - investor_details length:`, seriesDetail.investor_details?.length); }
                  return null;
                })()}
                {seriesDetail.investor_details && seriesDetail.investor_details.length > 0 && (
                  <div style={{ marginBottom: '30px' }}>
                    <h4 style={{ marginBottom: '15px', color: '#334155', fontSize: '16px' }}>
                      Investor Details ({seriesDetail.investor_details.length} Investors)
                    </h4>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Investor ID</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Name</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Email</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Phone</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>PAN</th>
                            <th style={{ padding: '12px', textAlign: 'right' }}>Investment Amount</th>
                            <th style={{ padding: '12px', textAlign: 'center' }}>Date Received</th>
                            <th style={{ padding: '12px', textAlign: 'center' }}>Date Transferred</th>
                          </tr>
                        </thead>
                        <tbody>
                          {seriesDetail.investor_details.map((investor, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                              <td style={{ padding: '12px', fontWeight: '600' }}>{investor.investor_id}</td>
                              <td style={{ padding: '12px' }}>{investor.investor_name}</td>
                              <td style={{ padding: '12px', fontSize: '13px' }}>{investor.email}</td>
                              <td style={{ padding: '12px' }}>{investor.phone}</td>
                              <td style={{ padding: '12px', fontFamily: 'monospace' }}>{investor.pan}</td>
                              <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#059669' }}>
                                ₹{investor.investment_amount?.toLocaleString('en-IN')}
                              </td>
                              <td style={{ padding: '12px', textAlign: 'center' }}>{investor.date_received || '-'}</td>
                              <td style={{ padding: '12px', textAlign: 'center' }}>{investor.date_transferred || '-'}</td>
                            </tr>
                          ))}
                          <tr style={{ borderTop: '2px solid #334155', backgroundColor: '#f8fafc', fontWeight: '600' }}>
                            <td colSpan="5" style={{ padding: '12px', textAlign: 'right' }}>Total:</td>
                            <td style={{ padding: '12px', textAlign: 'right', color: '#059669', fontSize: '15px' }}>
                              ₹{seriesDetail.investor_details.reduce((sum, inv) => sum + (inv.investment_amount || 0), 0).toLocaleString('en-IN')}
                            </td>
                            <td colSpan="2" style={{ padding: '12px' }}></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Compliance Summary Cards */}
                {seriesDetail.compliance_stats && (
                  <div style={{ marginBottom: '30px' }}>
                    <h4 style={{ marginBottom: '15px', color: '#334155', fontSize: '16px' }}>Compliance Status</h4>
                    <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                      <div className="kpi-item">
                        <div className="kpi-label">Total Requirements</div>
                        <div className="kpi-value" style={{ color: '#64748b' }}>
                          {seriesDetail.compliance_stats.total_requirements}
                        </div>
                        <div className="kpi-sublabel">Compliance Items</div>
                      </div>
                      
                      <div className="kpi-item">
                        <div className="kpi-label">Completed</div>
                        <div className="kpi-value" style={{ color: '#22c55e' }}>
                          {seriesDetail.compliance_stats.completed}
                        </div>
                        <div className="kpi-sublabel">Received/Submitted</div>
                      </div>
                      
                      <div className="kpi-item">
                        <div className="kpi-label">Pending Actions</div>
                        <div className="kpi-value" style={{ color: '#f59e0b' }}>
                          {seriesDetail.compliance_stats.pending_actions}
                        </div>
                        <div className="kpi-sublabel">Awaiting Submission</div>
                      </div>
                      
                      <div className="kpi-item">
                        <div className="kpi-label">Completion Rate</div>
                        <div className="kpi-value" style={{ 
                          color: seriesDetail.compliance_stats.completion_percentage >= 90 ? '#22c55e' : 
                                 seriesDetail.compliance_stats.completion_percentage >= 50 ? '#f59e0b' : '#ef4444'
                        }}>
                          {seriesDetail.compliance_stats.completion_percentage}%
                        </div>
                        <div className="kpi-sublabel">
                          {seriesDetail.compliance_stats.completion_percentage >= 90 ? 'Excellent' : 
                           seriesDetail.compliance_stats.completion_percentage >= 50 ? 'In Progress' : 'Needs Attention'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Monthly Investment Trend */}
                {seriesDetail.monthly_trend && seriesDetail.monthly_trend.length > 0 && (
                  <div style={{ marginBottom: '30px' }}>
                    <h4 style={{ marginBottom: '15px', color: '#334155', fontSize: '16px' }}>Monthly Investment Trend</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart 
                        data={seriesDetail.monthly_trend}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value, name) => {
                            if (name === 'total_amount') return [`₹${value.toLocaleString('en-IN')}`, 'Amount'];
                            if (name === 'investment_count') return [value, 'Investments'];
                            return [value, name];
                          }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="total_amount" stroke="#3b82f6" strokeWidth={2} name="Amount (₹)" />
                        <Line type="monotone" dataKey="investment_count" stroke="#22c55e" strokeWidth={2} name="Count" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Ticket Size Distribution */}
                {seriesDetail.ticket_distribution && seriesDetail.ticket_distribution.length > 0 && (
                  <div>
                    <h4 style={{ marginBottom: '15px', color: '#334155', fontSize: '16px' }}>Investment Ticket Size Distribution</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={seriesDetail.ticket_distribution}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ category, count }) => `${category}: ${count}`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {seriesDetail.ticket_distribution.map((entry, idx) => (
                            <Cell key={`cell-${idx}`} fill={['#3b82f6', '#22c55e', '#f59e0b', '#ef4444'][idx % 4]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value, name, props) => [
                            `${value} investments (₹${props.payload.total_amount.toLocaleString('en-IN')})`,
                            props.payload.category
                          ]}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  const renderInvestorPortfolio = () => {
    if (import.meta.env.DEV) { console.log('🎨 Rendering Investor Portfolio'); }
    if (import.meta.env.DEV) { console.log('📊 Loading state:', loading); }
    if (import.meta.env.DEV) { console.log('📊 Report data:', reportData); }
    if (import.meta.env.DEV) { console.log('📊 Summary:', reportData?.summary); }
    if (import.meta.env.DEV) { console.log('📊 Investor breakdown:', reportData?.investor_breakdown); }
    
    if (loading) {
      return (
        <div className="report-content">
          <div className="report-card">
            <div className="card-content">
              <p>Loading report data...</p>
            </div>
          </div>
        </div>
      );
    }
    
    if (!reportData) {
      return (
        <div className="report-content">
          <div className="report-card">
            <div className="card-content">
              <p>No report data available. Please try refreshing.</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="report-content">
        {/* Summary */}
        {reportData?.summary ? (
          <div className="report-card">
            <div className="card-header"><MdAssessment className="header-icon" /><h3>Portfolio Overview</h3></div>
            <div className="card-content">
              {console.log('📊 Summary data:', reportData.summary)}
              <div className="kpi-grid">
                <div className="kpi-item">
                  <FaUsers className="kpi-icon" />
                  <div className="kpi-details">
                    <span className="kpi-value">{reportData.summary.total_investors || 0}</span>
                    <span className="kpi-label">Total Investors</span>
                  </div>
                </div>
                <div className="kpi-item">
                  <MdPending className="kpi-icon" style={{ color: '#f97316' }} />
                  <div className="kpi-details">
                    <span className="kpi-value">{reportData.summary.kyc_rejected_count || 0}</span>
                    <span className="kpi-label">KYC Rejected</span>
                  </div>
                </div>
                <div className="kpi-item">
                  <FaRupeeSign className="kpi-icon" />
                  <div className="kpi-details">
                    <span className="kpi-value">₹{(reportData.summary.total_funds_raised || 0).toLocaleString('en-IN')}</span>
                    <span className="kpi-label">Total Funds Raised</span>
                  </div>
                </div>
                <div className="kpi-item">
                  <MdPayment className="kpi-icon" />
                  <div className="kpi-details">
                    <span className="kpi-value">₹{(reportData.summary.total_payouts || 0).toLocaleString('en-IN')}</span>
                    <span className="kpi-label">Total Payouts</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="report-card">
            <div className="card-content">
              <p>No summary data available. Please restart the backend server.</p>
            </div>
          </div>
        )}

        {/* NEW TABLE: Investor Investments Summary - Shows each investor's investments per series */}
        {reportData?.investor_breakdown && reportData.investor_breakdown.length > 0 && (
          <div className="report-card">
            <div className="card-header">
              <FaRupeeSign className="header-icon" />
              <h3>Investor Investments Summary</h3>
            </div>
            <div className="card-content">
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Investor ID</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Investor Name</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Email</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Phone</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Total Investment</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Series Count</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>First Investment</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Last Investment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.investor_breakdown.map((inv, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '12px', fontWeight: '600' }}>{inv.investor_id}</td>
                        <td style={{ padding: '12px' }}>{inv.investor_name}</td>
                        <td style={{ padding: '12px', fontSize: '12px' }}>{inv.email || '-'}</td>
                        <td style={{ padding: '12px' }}>{inv.phone || '-'}</td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#059669' }}>
                          ₹{inv.total_investment?.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>{inv.series_count}</td>
                        <td style={{ padding: '12px', textAlign: 'center', fontSize: '12px' }}>{inv.first_investment_date || '-'}</td>
                        <td style={{ padding: '12px', textAlign: 'center', fontSize: '12px' }}>{inv.last_investment_date || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '2px solid #334155', backgroundColor: '#f8fafc', fontWeight: '600' }}>
                      <td colSpan="4" style={{ padding: '12px', textAlign: 'right' }}>Total:</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#059669', fontSize: '15px' }}>
                        ₹{reportData.investor_breakdown.reduce((sum, inv) => sum + (inv.total_investment || 0), 0).toLocaleString('en-IN')}
                      </td>
                      <td colSpan="3" style={{ padding: '12px' }}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Investors Details Table - All Personal Information */}
        {reportData?.investors_details && reportData.investors_details.length > 0 && (
          <div className="report-card">
            <div className="card-header">
              <FaUserCheck className="header-icon" />
              <h3>Investors Details ({reportData.investors_details.length} Investors)</h3>
            </div>
            <div className="card-content">
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                      <th style={{ padding: '10px', textAlign: 'left', whiteSpace: 'nowrap' }}>Investor ID</th>
                      <th style={{ padding: '10px', textAlign: 'left', whiteSpace: 'nowrap' }}>Full Name</th>
                      <th style={{ padding: '10px', textAlign: 'left', whiteSpace: 'nowrap' }}>Email</th>
                      <th style={{ padding: '10px', textAlign: 'left', whiteSpace: 'nowrap' }}>Phone</th>
                      <th style={{ padding: '10px', textAlign: 'left', whiteSpace: 'nowrap' }}>PAN</th>
                      <th style={{ padding: '10px', textAlign: 'left', whiteSpace: 'nowrap' }}>Bank Name</th>
                      <th style={{ padding: '10px', textAlign: 'left', whiteSpace: 'nowrap' }}>Account Number</th>
                      <th style={{ padding: '10px', textAlign: 'left', whiteSpace: 'nowrap' }}>IFSC Code</th>
                      <th style={{ padding: '10px', textAlign: 'left', whiteSpace: 'nowrap' }}>KYC Status</th>
                      <th style={{ padding: '10px', textAlign: 'left', whiteSpace: 'nowrap' }}>Date Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.investors_details.map((inv, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '10px', fontWeight: '600' }}>{inv.investor_id}</td>
                        <td style={{ padding: '10px', whiteSpace: 'nowrap' }}>{inv.full_name}</td>
                        <td style={{ padding: '10px', fontSize: '12px' }}>{inv.email}</td>
                        <td style={{ padding: '10px', whiteSpace: 'nowrap' }}>{inv.phone}</td>
                        <td style={{ padding: '10px', fontFamily: 'monospace' }}>{inv.pan}</td>
                            <td style={{ padding: '10px', whiteSpace: 'nowrap' }}>{inv.bank_name}</td>
                            <td style={{ padding: '10px', fontFamily: 'monospace' }}>{inv.account_number}</td>
                            <td style={{ padding: '10px', fontFamily: 'monospace' }}>{inv.ifsc_code}</td>
                            <td style={{ padding: '10px', textAlign: 'center' }}>
                              <span style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: '600',
                                backgroundColor: 
                                  inv.kyc_status === 'verified' ? '#dcfce7' :
                                  inv.kyc_status === 'pending' ? '#fef3c7' :
                                  inv.kyc_status === 'rejected' ? '#fee2e2' : '#f3f4f6',
                                color:
                                  inv.kyc_status === 'verified' ? '#166534' :
                                  inv.kyc_status === 'pending' ? '#92400e' :
                                  inv.kyc_status === 'rejected' ? '#991b1b' : '#64748b'
                              }}>
                                {inv.kyc_status}
                              </span>
                            </td>
                            <td style={{ padding: '10px', whiteSpace: 'nowrap' }}>{inv.date_joined}</td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Nominee Details Table - Separate table for nominee information */}
        {reportData?.nominee_details && reportData.nominee_details.length > 0 && (
          <div className="report-card">
            <div className="card-header">
              <FaUserCheck className="header-icon" />
              <h3>Nominee Details ({reportData.nominee_details.length} Nominees)</h3>
            </div>
            <div className="card-content">
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                      <th style={{ padding: '10px', textAlign: 'left', whiteSpace: 'nowrap' }}>Investor ID</th>
                      <th style={{ padding: '10px', textAlign: 'left', whiteSpace: 'nowrap' }}>Investor Name</th>
                      <th style={{ padding: '10px', textAlign: 'left', whiteSpace: 'nowrap' }}>Nominee Name</th>
                      <th style={{ padding: '10px', textAlign: 'left', whiteSpace: 'nowrap' }}>Relationship</th>
                      <th style={{ padding: '10px', textAlign: 'left', whiteSpace: 'nowrap' }}>Mobile</th>
                      <th style={{ padding: '10px', textAlign: 'left', whiteSpace: 'nowrap' }}>Email</th>
                      <th style={{ padding: '10px', textAlign: 'left', whiteSpace: 'nowrap' }}>Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.nominee_details.map((nominee, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '10px', fontWeight: '600' }}>{nominee.investor_id}</td>
                        <td style={{ padding: '10px', whiteSpace: 'nowrap' }}>{nominee.investor_name}</td>
                        <td style={{ padding: '10px', whiteSpace: 'nowrap' }}>{nominee.nominee_name || '-'}</td>
                        <td style={{ padding: '10px' }}>{nominee.nominee_relationship || '-'}</td>
                        <td style={{ padding: '10px', whiteSpace: 'nowrap' }}>{nominee.nominee_mobile || '-'}</td>
                        <td style={{ padding: '10px', fontSize: '12px' }}>{nominee.nominee_email || '-'}</td>
                        <td style={{ padding: '10px', maxWidth: '250px' }}>{nominee.nominee_address || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Payouts Table - Aggregated payout summary per investor per series */}
        {reportData?.payouts_table && reportData.payouts_table.length > 0 && (
          <div className="report-card">
            <div className="card-header">
              <MdPayment className="header-icon" />
              <h3>All Payouts ({reportData.payouts_table.length} Records)</h3>
            </div>
            <div className="card-content">
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                      <th style={{ padding: '10px', textAlign: 'left', whiteSpace: 'nowrap' }}>Investor ID</th>
                      <th style={{ padding: '10px', textAlign: 'left', whiteSpace: 'nowrap' }}>Investor Name</th>
                      <th style={{ padding: '10px', textAlign: 'left', whiteSpace: 'nowrap' }}>Series Code</th>
                      <th style={{ padding: '10px', textAlign: 'left', whiteSpace: 'nowrap' }}>Series Name</th>
                      <th style={{ padding: '10px', textAlign: 'right', whiteSpace: 'nowrap' }}>Total Amount</th>
                      <th style={{ padding: '10px', textAlign: 'center', whiteSpace: 'nowrap' }}>Last Payout Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.payouts_table.map((payout, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '10px', fontWeight: '600' }}>{payout.investor_id}</td>
                        <td style={{ padding: '10px', whiteSpace: 'nowrap' }}>{payout.investor_name}</td>
                        <td style={{ padding: '10px', fontWeight: '600', color: '#3b82f6' }}>{payout.series_code}</td>
                        <td style={{ padding: '10px' }}>{payout.series_name}</td>
                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: '600', color: '#059669' }}>
                          ₹{payout.total_amount?.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center', whiteSpace: 'nowrap' }}>{payout.last_payout_date || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '2px solid #334155', backgroundColor: '#f8fafc', fontWeight: '600' }}>
                      <td colSpan="4" style={{ padding: '12px', textAlign: 'right' }}>Total:</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#059669', fontSize: '15px' }}>
                        ₹{reportData.payouts_table.reduce((sum, payout) => sum + (payout.total_amount || 0), 0).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '12px' }}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Grievance Management Summary */}
        {reportData?.grievance_summary && (
          <div className="report-card">
            <div className="card-header">
              <MdAssessment className="header-icon" />
              <h3>Grievance Management Summary</h3>
            </div>
            <div className="card-content">
              <div className="kpi-grid">
                <div className="kpi-item">
                  <MdAssessment className="kpi-icon" style={{ color: '#3b82f6' }} />
                  <div className="kpi-details">
                    <span className="kpi-value">{reportData.grievance_summary.total_complaints || 0}</span>
                    <span className="kpi-label">Total Complaints</span>
                  </div>
                </div>
                <div className="kpi-item">
                  <MdPending className="kpi-icon" style={{ color: '#f59e0b' }} />
                  <div className="kpi-details">
                    <span className="kpi-value">{reportData.grievance_summary.pending_complaints || 0}</span>
                    <span className="kpi-label">Pending Complaints</span>
                  </div>
                </div>
                <div className="kpi-item">
                  <HiCheckCircle className="kpi-icon" style={{ color: '#22c55e' }} />
                  <div className="kpi-details">
                    <span className="kpi-value">{reportData.grievance_summary.resolved_complaints || 0}</span>
                    <span className="kpi-label">Resolved Complaints</span>
                  </div>
                </div>
                <div className="kpi-item">
                  <MdShowChart className="kpi-icon" style={{ color: '#8b5cf6' }} />
                  <div className="kpi-details">
                    <span className="kpi-value">{reportData.grievance_summary.resolution_rate || 0}%</span>
                    <span className="kpi-label">Resolution Rate</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Investor Grievances Table - Detailed complaints per investor */}
        {reportData?.investor_grievances_table && reportData.investor_grievances_table.length > 0 && (
          <div className="report-card">
            <div className="card-header">
              <MdAssessment className="header-icon" />
              <h3>Investor-wise Grievances ({reportData.investor_grievances_table.length} Records)</h3>
            </div>
            <div className="card-content">
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                      <th style={{ padding: '10px', textAlign: 'left', whiteSpace: 'nowrap' }}>Investor ID</th>
                      <th style={{ padding: '10px', textAlign: 'left', whiteSpace: 'nowrap' }}>Investor Name</th>
                      <th style={{ padding: '10px', textAlign: 'left', whiteSpace: 'nowrap' }}>Series Code</th>
                      <th style={{ padding: '10px', textAlign: 'left', whiteSpace: 'nowrap' }}>Series Name</th>
                      <th style={{ padding: '10px', textAlign: 'center', whiteSpace: 'nowrap' }}>Total Complaints</th>
                      <th style={{ padding: '10px', textAlign: 'center', whiteSpace: 'nowrap' }}>Resolved</th>
                      <th style={{ padding: '10px', textAlign: 'center', whiteSpace: 'nowrap' }}>Unresolved</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.investor_grievances_table.map((grievance, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '10px', fontWeight: '600' }}>{grievance.investor_id}</td>
                        <td style={{ padding: '10px', whiteSpace: 'nowrap' }}>{grievance.investor_name}</td>
                        <td style={{ padding: '10px', fontWeight: '600', color: grievance.series_code === 'General' ? '#64748b' : '#3b82f6' }}>
                          {grievance.series_code}
                        </td>
                        <td style={{ padding: '10px', fontStyle: grievance.series_name === 'Not Series Specific' ? 'italic' : 'normal', color: grievance.series_name === 'Not Series Specific' ? '#64748b' : '#000' }}>
                          {grievance.series_name}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center', fontWeight: '600' }}>
                          {grievance.total_complaints}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            backgroundColor: '#dcfce7',
                            color: '#166534',
                            fontWeight: '600'
                          }}>
                            {grievance.resolved_complaints}
                          </span>
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            backgroundColor: grievance.unresolved_complaints > 0 ? '#fee2e2' : '#f3f4f6',
                            color: grievance.unresolved_complaints > 0 ? '#991b1b' : '#64748b',
                            fontWeight: '600'
                          }}>
                            {grievance.unresolved_complaints}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '2px solid #334155', backgroundColor: '#f8fafc', fontWeight: '600' }}>
                      <td colSpan="4" style={{ padding: '12px', textAlign: 'right' }}>Total:</td>
                      <td style={{ padding: '12px', textAlign: 'center', fontSize: '15px' }}>
                        {reportData.investor_grievances_table.reduce((sum, g) => sum + (g.total_complaints || 0), 0)}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', fontSize: '15px', color: '#166534' }}>
                        {reportData.investor_grievances_table.reduce((sum, g) => sum + (g.resolved_complaints || 0), 0)}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', fontSize: '15px', color: '#991b1b' }}>
                        {reportData.investor_grievances_table.reduce((sum, g) => sum + (g.unresolved_complaints || 0), 0)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Investor Data */}
        {reportData?.detailed_investor_data && reportData.detailed_investor_data.map((investor, invIdx) => (
          <div key={invIdx}>
            <div className="report-card">
              <div className="card-header"><FaUserCheck className="header-icon" /><h3>{investor.investor_name} ({investor.investor_id})</h3></div>
              <div className="card-content">
                <div className="kpi-grid">
                  <div className="kpi-item"><FaRupeeSign className="kpi-icon" /><div className="kpi-details"><span className="kpi-value">₹{investor.investment_summary?.total_invested?.toLocaleString('en-IN')}</span><span className="kpi-label">Total Invested</span></div></div>
                  <div className="kpi-item"><MdShowChart className="kpi-icon" /><div className="kpi-details"><span className="kpi-value">{investor.investment_summary?.number_of_series}</span><span className="kpi-label">Series Count</span></div></div>
                  <div className="kpi-item"><MdBarChart className="kpi-icon" /><div className="kpi-details"><span className="kpi-value">{investor.investment_summary?.number_of_investments}</span><span className="kpi-label">Investments</span></div></div>
                  <div className="kpi-item"><FaFileInvoiceDollar className="kpi-icon" /><div className="kpi-details"><span className="kpi-value">₹{investor.investment_summary?.average_investment_size?.toLocaleString('en-IN')}</span><span className="kpi-label">Avg Investment</span></div></div>
                </div>
              </div>
            </div>

            {/* Charts */}
            {investor.investment_distribution && investor.investment_distribution.length > 0 && (
              <div className="report-card">
                <div className="card-header"><MdPieChart className="header-icon" /><h3>Investment Distribution by Series</h3></div>
                <div className="card-content">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={investor.investment_distribution} dataKey="amount" nameKey="series_code" cx="50%" cy="50%" outerRadius={100} label={(entry) => `${entry.series_code}: ₹${entry.amount.toLocaleString('en-IN')}`}>
                        {investor.investment_distribution.map((entry, index) => (<Cell key={`cell-${index}`} fill={['#3b82f6', '#22c55e', '#eab308', '#f97316', '#ef4444', '#8b5cf6'][index % 6]} />))}
                      </Pie>
                      <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {investor.yearly_investment_trend && investor.yearly_investment_trend.length > 0 && (
              <div className="report-card">
                <div className="card-header"><MdTimeline className="header-icon" /><h3>Yearly Investment Trend</h3></div>
                <div className="card-content">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={investor.yearly_investment_trend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis />
                      <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
                      <Legend />
                      <Bar dataKey="total_amount" fill="#3b82f6" name="Investment Amount (₹)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderKYCStatus = () => {
    if (import.meta.env.DEV) { console.log('🎨 Rendering KYC Status Report'); }
    if (import.meta.env.DEV) { console.log('📊 Loading state:', loading); }
    if (import.meta.env.DEV) { console.log('📊 Report data:', reportData); }
    if (import.meta.env.DEV) { console.log('📊 Summary:', reportData?.summary); }
    if (import.meta.env.DEV) { console.log('📊 Banking details:', reportData?.banking_details); }
    if (import.meta.env.DEV) { console.log('📊 KYC details:', reportData?.kyc_details); }
    if (import.meta.env.DEV) { console.log('📊 Personal details:', reportData?.personal_details); }
    
    return (
      <div className="report-content">
        {/* Summary Cards */}
        {reportData?.summary && (
          <div className="report-card">
            <div className="card-header">
              <FaUserCheck className="header-icon" />
              <h3>KYC Status Summary</h3>
            </div>
            <div className="card-content">
              <div className="kpi-grid">
                <div className="kpi-item">
                  <FaUsers className="kpi-icon" />
                  <div className="kpi-details">
                    <span className="kpi-value">
                      {reportData.summary.total_investors || 0}
                    </span>
                    <span className="kpi-label">Total Investors</span>
                  </div>
                </div>
                <div className="kpi-item">
                  <MdPending className="kpi-icon" style={{ color: '#f59e0b' }} />
                  <div className="kpi-details">
                    <span className="kpi-value">
                      {reportData.summary.pending_kyc || 0}
                    </span>
                    <span className="kpi-label">Pending KYC</span>
                  </div>
                </div>
                <div className="kpi-item">
                  <HiCheckCircle className="kpi-icon" style={{ color: '#10b981' }} />
                  <div className="kpi-details">
                    <span className="kpi-value">
                      {reportData.summary.completed_kyc || 0}
                    </span>
                    <span className="kpi-label">Completed KYC</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Banking Details Table */}
        {reportData?.banking_details && reportData.banking_details.length > 0 && (
          <div className="report-card">
            <div className="card-header">
              <FaUniversity className="header-icon" />
              <h3>Banking Details ({reportData.banking_details.length} Investors)</h3>
            </div>
            <div className="card-content">
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Investor ID</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Investor Name</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Bank Name</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Account Number</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>IFSC Code</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.banking_details.map((investor, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '12px' }}>{investor.investor_id}</td>
                        <td style={{ padding: '12px', fontWeight: '600' }}>{investor.investor_name}</td>
                        <td style={{ padding: '12px' }}>{investor.bank_name}</td>
                        <td style={{ padding: '12px' }}>{investor.account_number}</td>
                        <td style={{ padding: '12px' }}>{investor.ifsc_code}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* KYC Details Table */}
        {reportData?.kyc_details && reportData.kyc_details.length > 0 && (
          <div className="report-card">
            <div className="card-header">
              <MdVerifiedUser className="header-icon" />
              <h3>KYC Details ({reportData.kyc_details.length} Investors)</h3>
            </div>
            <div className="card-content">
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Investor ID</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Investor Name</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>PAN</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Aadhaar</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>KYC Status</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Yet to Submit Documents</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.kyc_details.map((investor, index) => {
                      const statusColor = 
                        investor.kyc_status === 'Completed' ? '#10b981' :
                        investor.kyc_status === 'Pending' ? '#f59e0b' :
                        investor.kyc_status === 'Rejected' ? '#ef4444' : '#64748b';
                      
                      return (
                        <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '12px' }}>{investor.investor_id}</td>
                          <td style={{ padding: '12px', fontWeight: '600' }}>{investor.investor_name}</td>
                          <td style={{ padding: '12px' }}>{investor.pan}</td>
                          <td style={{ padding: '12px' }}>{investor.aadhaar}</td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <span style={{
                              padding: '4px 12px',
                              borderRadius: '12px',
                              backgroundColor: `${statusColor}20`,
                              color: statusColor,
                              fontSize: '12px',
                              fontWeight: '600'
                            }}>
                              {investor.kyc_status}
                            </span>
                          </td>
                          <td style={{ 
                            padding: '12px',
                            color: investor.yet_to_submit_documents === 'All Submitted' ? '#10b981' : '#ef4444',
                            fontWeight: investor.yet_to_submit_documents === 'All Submitted' ? '600' : '400'
                          }}>
                            {investor.yet_to_submit_documents}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Personal Details Table */}
        {reportData?.personal_details && reportData.personal_details.length > 0 && (
          <div className="report-card">
            <div className="card-header">
              <MdPeople className="header-icon" />
              <h3>Investors Personal Details ({reportData.personal_details.length} Investors)</h3>
            </div>
            <div className="card-content">
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Investor ID</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Investor Name</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Email</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Phone</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Date of Birth</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Source of Funds</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.personal_details.map((investor, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '12px' }}>{investor.investor_id}</td>
                        <td style={{ padding: '12px', fontWeight: '600' }}>{investor.investor_name}</td>
                        <td style={{ padding: '12px' }}>{investor.email}</td>
                        <td style={{ padding: '12px' }}>{investor.phone}</td>
                        <td style={{ padding: '12px' }}>{investor.dob}</td>
                        <td style={{ padding: '12px' }}>{investor.source_of_funds}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderNewInvestor = () => {
    if (import.meta.env.DEV) { console.log('🎨 Rendering New Investor Report'); }
    if (import.meta.env.DEV) { console.log('📊 Loading state:', loading); }
    if (import.meta.env.DEV) { console.log('📊 Report data:', reportData); }
    
    return (
      <div className="report-content">
        {/* Report Filters */}
        <div className="report-card">
          <div className="card-header">
            <MdDateRange className="header-icon" />
            <h3>Report Filters</h3>
          </div>
          <div className="card-content">
            <div className="date-selector">
              <div className="date-input-group">
                <label>From Date:</label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => handleDateChange('startDate', e.target.value)}
                  className="date-input"
                />
              </div>
              <div className="date-input-group">
                <label>To Date:</label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => handleDateChange('endDate', e.target.value)}
                  className="date-input"
                />
              </div>
              <div className="date-input-group">
                <label>Investor ID (Optional):</label>
                <input
                  type="text"
                  placeholder="e.g., INV001"
                  value={selectedInvestorId}
                  onChange={(e) => setSelectedInvestorId(e.target.value)}
                  className="date-input"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Investment Details Table */}
        {reportData?.investment_details && reportData.investment_details.length > 0 && (
          <div className="report-card">
            <div className="card-header">
              <FaFileInvoiceDollar className="header-icon" />
              <h3>Investor Investment Details ({reportData.investment_details.length} Investors)</h3>
            </div>
            <div className="card-content">
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Investor ID</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Investor Name</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>All Series Invested In</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Total Amount Invested</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Total Payouts Received</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.investment_details.map((investor, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '12px' }}>{investor.investor_id}</td>
                        <td style={{ padding: '12px', fontWeight: '600' }}>{investor.investor_name}</td>
                        <td style={{ padding: '12px' }}>{investor.series_invested}</td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#10b981' }}>
                          ₹{investor.total_invested?.toLocaleString('en-IN') || '0'}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#3b82f6' }}>
                          ₹{investor.total_payouts?.toLocaleString('en-IN') || '0'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Banking Details Table */}
        {reportData?.banking_details && reportData.banking_details.length > 0 && (
          <div className="report-card">
            <div className="card-header">
              <FaUniversity className="header-icon" />
              <h3>Investors Bank Details ({reportData.banking_details.length} Investors)</h3>
            </div>
            <div className="card-content">
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Investor ID</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Investor Name</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Bank Name</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Account Number</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>IFSC Code</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.banking_details.map((investor, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '12px' }}>{investor.investor_id}</td>
                        <td style={{ padding: '12px', fontWeight: '600' }}>{investor.investor_name}</td>
                        <td style={{ padding: '12px' }}>{investor.bank_name}</td>
                        <td style={{ padding: '12px' }}>{investor.account_number}</td>
                        <td style={{ padding: '12px' }}>{investor.ifsc_code}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* KYC Details Table */}
        {reportData?.kyc_details && reportData.kyc_details.length > 0 && (
          <div className="report-card">
            <div className="card-header">
              <MdVerifiedUser className="header-icon" />
              <h3>Investor KYC Details ({reportData.kyc_details.length} Investors)</h3>
            </div>
            <div className="card-content">
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Investor ID</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Investor Name</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>PAN</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Aadhaar</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>KYC Status</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Yet to Submit Documents</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.kyc_details.map((investor, index) => {
                      const statusColor = 
                        investor.kyc_status === 'Completed' ? '#10b981' :
                        investor.kyc_status === 'Pending' ? '#f59e0b' :
                        investor.kyc_status === 'Rejected' ? '#ef4444' : '#64748b';
                      
                      return (
                        <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '12px' }}>{investor.investor_id}</td>
                          <td style={{ padding: '12px', fontWeight: '600' }}>{investor.investor_name}</td>
                          <td style={{ padding: '12px' }}>{investor.pan}</td>
                          <td style={{ padding: '12px' }}>{investor.aadhaar}</td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <span style={{
                              padding: '4px 12px',
                              borderRadius: '12px',
                              backgroundColor: `${statusColor}20`,
                              color: statusColor,
                              fontSize: '12px',
                              fontWeight: '600'
                            }}>
                              {investor.kyc_status}
                            </span>
                          </td>
                          <td style={{ 
                            padding: '12px',
                            color: investor.yet_to_submit_documents === 'All Submitted' ? '#10b981' : '#ef4444',
                            fontWeight: investor.yet_to_submit_documents === 'All Submitted' ? '600' : '400'
                          }}>
                            {investor.yet_to_submit_documents}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Personal Details Table */}
        {reportData?.personal_details && reportData.personal_details.length > 0 && (
          <div className="report-card">
            <div className="card-header">
              <MdPeople className="header-icon" />
              <h3>Investor Personal Details ({reportData.personal_details.length} Investors)</h3>
            </div>
            <div className="card-content">
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Investor ID</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Investor Name</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Email</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Phone</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Date of Birth</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Source of Funds</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Date Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.personal_details.map((investor, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '12px' }}>{investor.investor_id}</td>
                        <td style={{ padding: '12px', fontWeight: '600' }}>{investor.investor_name}</td>
                        <td style={{ padding: '12px' }}>{investor.email}</td>
                        <td style={{ padding: '12px' }}>{investor.phone}</td>
                        <td style={{ padding: '12px' }}>{investor.dob}</td>
                        <td style={{ padding: '12px' }}>{investor.source_of_funds}</td>
                        <td style={{ padding: '12px', fontWeight: '600', color: '#3b82f6' }}>{investor.date_joined}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderRBICompliance = () => {
    const summary = reportData?.summary || {};
    const seriesCompliance = reportData?.series_compliance || [];
    const investorSummary = reportData?.investor_summary || {};
    const paymentCompliance = reportData?.payment_compliance || [];
    const attentionItems = reportData?.attention_items || [];

    const formatCurrency = (amount) => {
      if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
      if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
      return `₹${amount.toFixed(2)}`;
    };

    return (
      <div className="report-content">
        {/* Summary Card */}
        <div className="report-card">
          <div className="card-header">
            <FaUniversity className="header-icon" />
            <h3>RBI Compliance Summary</h3>
          </div>
          <div className="card-content">
            <div className="kpi-grid">
              <div className="kpi-item">
                <MdAccountBalance className="kpi-icon" />
                <div className="kpi-details">
                  <span className="kpi-value">{formatCurrency(summary.total_aum || 0)}</span>
                  <span className="kpi-label">Total AUM</span>
                </div>
              </div>
              <div className="kpi-item">
                <MdSecurity className="kpi-icon" />
                <div className="kpi-details">
                  <span className="kpi-value">{summary.compliance_score || 0}%</span>
                  <span className="kpi-label">Compliance Score</span>
                </div>
              </div>
              <div className="kpi-item">
                <FaExclamationTriangle className="kpi-icon" />
                <div className="kpi-details">
                  <span className="kpi-value">{summary.kyc_pending || 0}</span>
                  <span className="kpi-label">KYC Pending</span>
                </div>
              </div>
              <div className="kpi-item">
                <FaCalendarAlt className="kpi-icon" />
                <div className="kpi-details">
                  <span className="kpi-value">{formatCurrency(summary.upcoming_payouts || 0)}</span>
                  <span className="kpi-label">Upcoming Payouts (30d)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Attention Items */}
        {attentionItems.length > 0 && (
          <div className="report-card">
            <div className="card-header">
              <FaExclamationTriangle className="header-icon" />
              <h3>Items Requiring Attention ({attentionItems.length})</h3>
            </div>
            <div className="card-content">
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Series</th>
                      <th>Pre-Compliance Phase</th>
                      <th>Post-Compliance Phase</th>
                      <th>Recurring Compliances</th>
                      <th>KYC Pending</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attentionItems.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.series_code}</td>
                        <td>
                          <span className={item.pre_compliance_pending > 0 ? 'text-danger' : 'text-success'}>
                            {item.pre_compliance_pending > 0 
                              ? `${item.pre_compliance_pending} pending` 
                              : 'Complete'}
                          </span>
                        </td>
                        <td>
                          <span className={item.post_compliance_pending > 0 ? 'text-danger' : 'text-success'}>
                            {item.post_compliance_pending > 0 
                              ? `${item.post_compliance_pending} pending` 
                              : 'Complete'}
                          </span>
                        </td>
                        <td>
                          <span className={item.recurring_compliance_pending > 0 ? 'text-danger' : 'text-success'}>
                            {item.recurring_compliance_pending > 0 
                              ? `${item.recurring_compliance_pending} pending` 
                              : 'Complete'}
                          </span>
                        </td>
                        <td>
                          <span className={item.kyc_pending > 0 ? 'text-warning' : 'text-success'}>
                            {item.kyc_pending > 0 
                              ? `${item.kyc_pending} investor(s)` 
                              : 'Complete'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Series Compliance Details */}
        <div className="report-card">
          <div className="card-header">
            <FaClipboardCheck className="header-icon" />
            <h3>Series Compliance Details ({seriesCompliance.length})</h3>
          </div>
          <div className="card-content">
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Series Code</th>
                    <th>Security Type</th>
                    <th>Credit Rating</th>
                    <th>Trustee</th>
                    <th>KYC Status</th>
                  </tr>
                </thead>
                <tbody>
                  {seriesCompliance.map((series, idx) => (
                    <tr key={idx}>
                      <td>{series.series_code}</td>
                      <td>{series.security_type}</td>
                      <td>
                        <span className={series.has_rating ? 'text-success' : 'text-danger'}>
                          {series.credit_rating}
                        </span>
                      </td>
                      <td>
                        <span className={series.has_trustee ? 'text-success' : 'text-danger'}>
                          {series.trustee_name}
                        </span>
                      </td>
                      <td>
                        <span className={series.kyc_complete ? 'text-success' : 'text-warning'}>
                          {series.kyc_completed_count}/{series.kyc_total_count} ({series.kyc_completion_percent}%)
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Investor Summary */}
        <div className="report-card">
          <div className="card-header">
            <FaUsers className="header-icon" />
            <h3>Investor KYC Summary</h3>
          </div>
          <div className="card-content">
            <div className="kpi-grid">
              <div className="kpi-item">
                <FaUsers className="kpi-icon" />
                <div className="kpi-details">
                  <span className="kpi-value">{investorSummary.total_investors || 0}</span>
                  <span className="kpi-label">Total Investors</span>
                </div>
              </div>
              <div className="kpi-item">
                <FaCheckCircle className="kpi-icon" />
                <div className="kpi-details">
                  <span className="kpi-value">{investorSummary.kyc_completed || 0}</span>
                  <span className="kpi-label">KYC Completed</span>
                </div>
              </div>
              <div className="kpi-item">
                <FaClock className="kpi-icon" />
                <div className="kpi-details">
                  <span className="kpi-value">{investorSummary.kyc_pending || 0}</span>
                  <span className="kpi-label">KYC Pending</span>
                </div>
              </div>
              <div className="kpi-item">
                <FaTimesCircle className="kpi-icon" />
                <div className="kpi-details">
                  <span className="kpi-value">{investorSummary.kyc_rejected || 0}</span>
                  <span className="kpi-label">KYC Rejected</span>
                </div>
              </div>
            </div>

            {/* Top Holdings */}
            {investorSummary.top_holdings && investorSummary.top_holdings.length > 0 && (
              <>
                <h4 style={{ marginTop: '20px', marginBottom: '10px' }}>Investor Holdings - Concentration Risk ({investorSummary.top_holdings.length})</h4>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Investor ID</th>
                        <th>Investor Name</th>
                        <th>Series</th>
                        <th>Amount Invested</th>
                        <th>% of Series</th>
                      </tr>
                    </thead>
                    <tbody>
                      {investorSummary.top_holdings.map((holding, idx) => (
                        <tr key={idx}>
                          <td>{holding.investor_id}</td>
                          <td>{holding.investor_name}</td>
                          <td>{holding.series_code}</td>
                          <td>{formatCurrency(holding.amount_invested)}</td>
                          <td>
                            <span className={holding.percent_of_series > 10 ? 'text-warning' : ''}>
                              {holding.percent_of_series}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    );
  };

  const renderSEBIDisclosure = () => {
    const summary = reportData?.summary || {};
    const seriesDetails = reportData?.series_details || [];
    const paymentComplianceSummary = reportData?.payment_compliance_summary || {};
    const upcomingObligations = reportData?.upcoming_obligations || [];
    const paymentRecords = reportData?.payment_records || [];
    const complianceTrackingSummary = reportData?.compliance_tracking_summary || {};
    const complianceAttentionItems = reportData?.compliance_attention_items || [];

    const formatCurrency = (amount) => {
      if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
      if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
      return `₹${amount.toFixed(2)}`;
    };

    return (
      <div className="report-content">
        {/* Summary Card */}
        <div className="report-card">
          <div className="card-header">
            <FaBalanceScale className="header-icon" />
            <h3>SEBI Disclosure Summary</h3>
          </div>
          <div className="card-content">
            <div className="kpi-grid">
              <div className="kpi-item">
                <MdAccountBalance className="kpi-icon" />
                <div className="kpi-details">
                  <span className="kpi-value">{summary.total_series || 0}</span>
                  <span className="kpi-label">Total Series</span>
                </div>
              </div>
              <div className="kpi-item">
                <FaCheckCircle className="kpi-icon" />
                <div className="kpi-details">
                  <span className="kpi-value">{summary.active_series || 0}</span>
                  <span className="kpi-label">Active Series</span>
                </div>
              </div>
              <div className="kpi-item">
                <FaPercent className="kpi-icon" />
                <div className="kpi-details">
                  <span className="kpi-value">{summary.avg_interest_rate || 0}%</span>
                  <span className="kpi-label">Avg Interest Rate</span>
                </div>
              </div>
              <div className="kpi-item">
                <FaRupeeSign className="kpi-icon" />
                <div className="kpi-details">
                  <span className="kpi-value">{formatCurrency(summary.avg_investment_per_series || 0)}</span>
                  <span className="kpi-label">Avg Investment/Series</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Series Details Table */}
        <div className="report-card">
          <div className="card-header">
            <MdDescription className="header-icon" />
            <h3>Issue & Series Details ({seriesDetails.length})</h3>
          </div>
          <div className="card-content">
            {seriesDetails.length > 0 ? (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Series Code</th>
                      <th>Series Name</th>
                      <th>Status</th>
                      <th>Issue Date</th>
                      <th>Allotment Date</th>
                      <th>Maturity Date</th>
                      <th>Tenure (Days)</th>
                      <th>Target Amount</th>
                      <th>Funds Raised</th>
                      <th>Subscription %</th>
                      <th>Outstanding Amount</th>
                      <th>Interest Rate</th>
                      <th>Payment Frequency</th>
                      <th>Credit Rating</th>
                      <th>Security Type</th>
                      <th>Debenture Trustee</th>
                      <th>Investors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seriesDetails.map((series, idx) => (
                      <tr key={idx}>
                        <td><strong>{series.series_code}</strong></td>
                        <td>{series.series_name}</td>
                        <td>
                          <span className={`status-badge status-${series.status?.toLowerCase()}`}>
                            {series.status}
                          </span>
                        </td>
                        <td>{series.issue_date}</td>
                        <td>{series.allotment_date || 'N/A'}</td>
                        <td>{series.maturity_date}</td>
                        <td>{series.tenure_days}</td>
                        <td>{formatCurrency(series.target_amount)}</td>
                        <td>{formatCurrency(series.funds_raised)}</td>
                        <td>
                          <span className={series.subscription_percentage >= 100 ? 'text-success' : 'text-warning'}>
                            {series.subscription_percentage}%
                          </span>
                        </td>
                        <td>{formatCurrency(series.outstanding_amount)}</td>
                        <td>{series.interest_rate}%</td>
                        <td>{series.interest_frequency}</td>
                        <td><strong>{series.credit_rating}</strong></td>
                        <td>{series.security_type}</td>
                        <td>{series.debenture_trustee_name || 'N/A'}</td>
                        <td>{series.investor_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="no-data">No series data available</p>
            )}
          </div>
        </div>

        {/* Upcoming Obligations */}
        {upcomingObligations.length > 0 && (
          <div className="report-card">
            <div className="card-header">
              <FaCalendarAlt className="header-icon" />
              <h3>Upcoming Obligations (Next 90 Days) - Reg 57(4)</h3>
            </div>
            <div className="card-content">
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Series Code</th>
                      <th>Series Name</th>
                      <th>Payout Date</th>
                      <th>Payout Month</th>
                      <th>Amount</th>
                      <th>Investors</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingObligations.map((obligation, idx) => (
                      <tr key={idx}>
                        <td><strong>{obligation.series_code}</strong></td>
                        <td>{obligation.series_name}</td>
                        <td>{obligation.payout_date}</td>
                        <td>{obligation.payout_month}</td>
                        <td>{formatCurrency(obligation.amount)}</td>
                        <td>{obligation.investor_count}</td>
                        <td>
                          <span className="status-badge status-pending">
                            {obligation.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Payment Records */}
        {paymentRecords.length > 0 && (
          <div className="report-card">
            <div className="card-header">
              <MdHistory className="header-icon" />
              <h3>Payment Certificates - Scheduled vs Actual (Reg 57(1))</h3>
            </div>
            <div className="card-content">
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Series Code</th>
                      <th>Series Name</th>
                      <th>Payout Month</th>
                      <th>Scheduled Date</th>
                      <th>Actual Paid Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Payment Status</th>
                      <th>Delay (Days)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentRecords.map((record, idx) => (
                      <tr key={idx} className={record.payment_status === 'Overdue' || record.payment_status === 'Failed' ? 'row-danger' : ''}>
                        <td><strong>{record.series_code}</strong></td>
                        <td>{record.series_name}</td>
                        <td>{record.payout_month}</td>
                        <td>{record.payout_date}</td>
                        <td>{record.paid_date}</td>
                        <td>{formatCurrency(record.amount)}</td>
                        <td>
                          <span className={`status-badge status-${record.status?.toLowerCase()}`}>
                            {record.status}
                          </span>
                        </td>
                        <td>
                          <span 
                            className={`status-badge ${
                              record.payment_status === 'On-Time' ? 'status-success' :
                              record.payment_status === 'Delayed' ? 'status-warning' :
                              record.payment_status === 'Overdue' ? 'status-danger' :
                              record.payment_status === 'Failed' ? 'status-danger' :
                              'status-pending'
                            }`}
                            style={record.payment_status === 'Overdue' || record.payment_status === 'Failed' ? { fontWeight: 'bold', color: '#d32f2f' } : {}}
                          >
                            {record.payment_status}
                          </span>
                        </td>
                        <td>
                          <span style={record.delay_days > 0 ? { color: '#d32f2f', fontWeight: 'bold' } : {}}>
                            {record.delay_days > 0 ? `+${record.delay_days}` : record.delay_days}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Investor Grievance Mechanism */}
        <div className="report-card">
          <div className="card-header">
            <MdGavel className="header-icon" />
            <h3>Investor Grievance Mechanism (LODR Regulation 13)</h3>
          </div>
          <div className="card-content">
            <div className="kpi-grid">
              <div className="kpi-item">
                <MdAssessment className="kpi-icon" style={{ color: '#2196f3' }} />
                <div className="kpi-details">
                  <span className="kpi-value">{reportData?.grievance_summary?.total_grievances || 0}</span>
                  <span className="kpi-label">Total Grievances</span>
                </div>
              </div>
              <div className="kpi-item">
                <MdPending className="kpi-icon" style={{ color: '#ff9800' }} />
                <div className="kpi-details">
                  <span className="kpi-value">{reportData?.grievance_summary?.open_grievances || 0}</span>
                  <span className="kpi-label">Open Grievances</span>
                </div>
              </div>
              <div className="kpi-item">
                <FaCheckCircle className="kpi-icon" style={{ color: '#4caf50' }} />
                <div className="kpi-details">
                  <span className="kpi-value">{reportData?.grievance_summary?.resolved_grievances || 0}</span>
                  <span className="kpi-label">Resolved Grievances</span>
                </div>
              </div>
              <div className="kpi-item">
                <FaExclamationTriangle className="kpi-icon" style={{ color: '#f44336' }} />
                <div className="kpi-details">
                  <span className="kpi-value">{reportData?.grievance_summary?.high_priority_grievances || 0}</span>
                  <span className="kpi-label">High Priority Open</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Grievance Records Table */}
        {reportData?.grievance_records && reportData.grievance_records.length > 0 && (
          <div className="report-card">
            <div className="card-header">
              <MdDescription className="header-icon" />
              <h3>Grievance Records (Recent 50)</h3>
            </div>
            <div className="card-content">
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Grievance ID</th>
                      <th>Investor ID</th>
                      <th>Investor Name</th>
                      <th>Series</th>
                      <th>Category</th>
                      <th>Type</th>
                      <th>Description</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Filed Date</th>
                      <th>Resolved Date</th>
                      <th>Days Pending</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.grievance_records.map((record, idx) => (
                      <tr key={idx} className={record.status === 'pending' || record.days_pending > 30 ? 'row-warning' : ''}>
                        <td><strong>{record.grievance_id}</strong></td>
                        <td>{record.investor_id}</td>
                        <td>{record.investor_name}</td>
                        <td>{record.series_code}</td>
                        <td>{record.category}</td>
                        <td>{record.grievance_type}</td>
                        <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {record.description}
                        </td>
                        <td>
                          <span className={`status-badge ${
                            record.priority === 'High' || record.priority === 'Critical' ? 'status-danger' :
                            record.priority === 'Medium' ? 'status-warning' :
                            'status-success'
                          }`}>
                            {record.priority}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${
                            record.status === 'resolved' || record.status === 'closed' ? 'status-success' :
                            record.status === 'in-progress' ? 'status-warning' :
                            'status-pending'
                          }`}>
                            {record.status}
                          </span>
                        </td>
                        <td>{record.filed_date}</td>
                        <td>{record.resolved_date}</td>
                        <td>
                          <span style={record.days_pending > 30 ? { color: '#f44336', fontWeight: 'bold' } : {}}>
                            {record.days_pending}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Section 4: Continuous Compliance Tracking */}
        {(complianceTrackingSummary && Object.keys(complianceTrackingSummary).length > 0) || complianceAttentionItems.length > 0 ? (
          <div className="report-card">
            <div className="card-header">
              <FaClipboardCheck className="header-icon" />
              <h3>4. Continuous Compliance Tracking (LODR Regulation 46)</h3>
            </div>
            
            {/* Summary Cards */}
            {complianceTrackingSummary && Object.keys(complianceTrackingSummary).length > 0 && (
              <div className="card-content">
                <div className="summary-grid">
                  <div className="summary-card">
                    <div className="summary-icon" style={{ backgroundColor: '#e3f2fd' }}>
                      <FaClipboardList style={{ color: '#1976d2' }} />
                    </div>
                    <div className="summary-details">
                      <div className="summary-label">Total Compliance Items</div>
                      <div className="summary-value">{complianceTrackingSummary.total_compliance_items || 0}</div>
                      <div className="summary-sublabel">Per Series</div>
                    </div>
                  </div>

                  <div className="summary-card">
                    <div className="summary-icon" style={{ backgroundColor: '#e8f5e9' }}>
                      <FaCheckCircle style={{ color: '#388e3c' }} />
                    </div>
                    <div className="summary-details">
                      <div className="summary-label">Completed</div>
                      <div className="summary-value" style={{ color: '#388e3c' }}>
                        {complianceTrackingSummary.total_completed || 0}
                      </div>
                      <div className="summary-sublabel">Across All Series</div>
                    </div>
                  </div>

                  <div className="summary-card">
                    <div className="summary-icon" style={{ backgroundColor: '#fff3e0' }}>
                      <FaClock style={{ color: '#f57c00' }} />
                    </div>
                    <div className="summary-details">
                      <div className="summary-label">Pending</div>
                      <div className="summary-value" style={{ color: '#f57c00' }}>
                        {complianceTrackingSummary.total_pending || 0}
                      </div>
                      <div className="summary-sublabel">Across All Series</div>
                    </div>
                  </div>

                  <div className="summary-card">
                    <div className="summary-icon" style={{ backgroundColor: '#f3e5f5' }}>
                      <FaPercentage style={{ color: '#7b1fa2' }} />
                    </div>
                    <div className="summary-details">
                      <div className="summary-label">Compliance Rate</div>
                      <div className="summary-value" style={{ color: '#7b1fa2' }}>
                        {complianceTrackingSummary.compliance_rate || 0}%
                      </div>
                      <div className="summary-sublabel">Overall Completion</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Compliance Attention Items Table */}
            {complianceAttentionItems.length > 0 && (
              <div className="card-content">
                <h4 style={{ marginBottom: '15px', color: '#d32f2f' }}>
                  <FaExclamationTriangle style={{ marginRight: '8px' }} />
                  Items Requiring Attention ({complianceAttentionItems.length})
                </h4>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Series</th>
                        <th>Pre-Compliance Phase</th>
                        <th>Post-Compliance Phase</th>
                        <th>Recurring Compliances</th>
                      </tr>
                    </thead>
                    <tbody>
                      {complianceAttentionItems.map((item, idx) => (
                        <tr key={idx}>
                          <td><strong>{item.series_code}</strong></td>
                          <td>
                            <span className={item.pre_compliance_pending > 0 ? 'text-danger' : 'text-success'}>
                              {item.pre_compliance_pending > 0 
                                ? `${item.pre_compliance_pending} pending` 
                                : 'Complete'}
                            </span>
                          </td>
                          <td>
                            <span className={item.post_compliance_pending > 0 ? 'text-danger' : 'text-success'}>
                              {item.post_compliance_pending > 0 
                                ? `${item.post_compliance_pending} pending` 
                                : 'Complete'}
                            </span>
                          </td>
                          <td>
                            <span className={item.recurring_compliance_pending > 0 ? 'text-danger' : 'text-success'}>
                              {item.recurring_compliance_pending > 0 
                                ? `${item.recurring_compliance_pending} pending` 
                                : 'Complete'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    );
  };

  const renderAuditTrail = () => {
    const summary = reportData?.summary || {};
    const investments = reportData?.investments || [];
    const completedPayouts = reportData?.completed_payouts || [];
    const pendingPayouts = reportData?.pending_payouts || [];
    const upcomingPayouts = reportData?.upcoming_payouts || [];
    const filters = reportData?.filters || {};

    const formatCurrency = (amount) => {
      if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
      if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
      return `₹${amount.toFixed(2)}`;
    };

    return (
      <div className="report-content">
        {/* Filters Section with Controls */}
        <div className="report-card">
          <div className="card-header">
            <MdHistory className="header-icon" />
            <h3>Audit Trail Report - Filters</h3>
          </div>
          <div className="card-content">
            <div className="date-filter-section">
              {/* From Date */}
              <div className="date-input-group">
                <label>From Date:</label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  max={dateRange.endDate}
                  onChange={(e) => handleDateChange('startDate', e.target.value)}
                  className="date-input"
                />
              </div>

              {/* To Date */}
              <div className="date-input-group">
                <label>To Date:</label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  min={dateRange.startDate}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => handleDateChange('endDate', e.target.value)}
                  className="date-input"
                />
              </div>

              {/* Series Selection */}
              <div className="date-input-group">
                <label>Series:</label>
                <select
                  value={selectedSeries}
                  onChange={(e) => setSelectedSeries(e.target.value)}
                  className="date-input"
                  disabled={loadingSeries}
                >
                  <option value="all">All Series</option>
                  {seriesList.map((series) => (
                    <option key={series.id} value={series.series_code}>
                      {series.name} ({series.series_code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="report-card">
          <div className="card-header">
            <FaChartLine className="header-icon" />
            <h3>Summary</h3>
          </div>
          <div className="card-content">
            <div className="summary-grid">
              <div className="summary-card">
                <div className="summary-icon" style={{ backgroundColor: '#e3f2fd', margin: '0 auto 15px' }}>
                  <FaRupeeSign style={{ color: '#1976d2' }} />
                </div>
                <div className="summary-details" style={{ textAlign: 'center' }}>
                  <div className="summary-label" style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Total Investments</div>
                  <div className="summary-value" style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976d2', marginBottom: '5px' }}>{formatCurrency(summary.total_investments || 0)}</div>
                  <div className="summary-sublabel" style={{ fontSize: '12px', color: '#999' }}>Received in Date Range</div>
                </div>
              </div>

              <div className="summary-card">
                <div className="summary-icon" style={{ backgroundColor: '#fff3e0', margin: '0 auto 15px' }}>
                  <FaMoneyCheckAlt style={{ color: '#f57c00' }} />
                </div>
                <div className="summary-details" style={{ textAlign: 'center' }}>
                  <div className="summary-label" style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Total Payouts Till Date</div>
                  <div className="summary-value" style={{ fontSize: '24px', fontWeight: 'bold', color: '#f57c00', marginBottom: '5px' }}>{formatCurrency(summary.total_payouts || 0)}</div>
                  <div className="summary-sublabel" style={{ fontSize: '12px', color: '#999' }}>All Time</div>
                </div>
              </div>

              <div className="summary-card">
                <div className="summary-icon" style={{ backgroundColor: '#e8f5e9', margin: '0 auto 15px' }}>
                  <FaCalendarAlt style={{ color: '#388e3c' }} />
                </div>
                <div className="summary-details" style={{ textAlign: 'center' }}>
                  <div className="summary-label" style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Upcoming Payouts</div>
                  <div className="summary-value" style={{ fontSize: '24px', fontWeight: 'bold', color: '#388e3c', marginBottom: '5px' }}>{formatCurrency(summary.upcoming_payouts || 0)}</div>
                  <div className="summary-sublabel" style={{ fontSize: '12px', color: '#999' }}>Next Month</div>
                </div>
              </div>

              <div className="summary-card">
                <div className="summary-icon" style={{ backgroundColor: '#f3e5f5', margin: '0 auto 15px' }}>
                  <FaPercentage style={{ color: '#7b1fa2' }} />
                </div>
                <div className="summary-details" style={{ textAlign: 'center' }}>
                  <div className="summary-label" style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Payout Rate</div>
                  <div className="summary-value" style={{ fontSize: '24px', fontWeight: 'bold', color: '#7b1fa2', marginBottom: '5px' }}>{summary.payout_rate || 0}%</div>
                  <div className="summary-sublabel" style={{ fontSize: '12px', color: '#999' }}>Completion Rate</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Investment Transactions Table */}
        {investments.length > 0 && (
          <div className="report-card">
            <div className="card-header">
              <FaFileInvoiceDollar className="header-icon" />
              <h3>Investment Transactions ({investments.length})</h3>
            </div>
            <div className="card-content">
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Date Received</th>
                      <th>Investor ID</th>
                      <th>Investor Name</th>
                      <th>Series Code</th>
                      <th>Series Name</th>
                      <th>Amount (₹)</th>
                      <th>Date Transferred</th>
                      <th>Status</th>
                      <th>Created At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {investments.map((investment, idx) => (
                      <tr key={idx}>
                        <td><strong>{investment.id}</strong></td>
                        <td>{investment.date_received}</td>
                        <td>{investment.investor_id}</td>
                        <td>{investment.investor_name}</td>
                        <td><strong>{investment.series_code}</strong></td>
                        <td>{investment.series_name}</td>
                        <td style={{ textAlign: 'right' }}>
                          <strong>{investment.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                        </td>
                        <td>{investment.date_transferred || 'N/A'}</td>
                        <td>
                          <span className={`status-badge ${
                            investment.status === 'confirmed' ? 'status-success' :
                            investment.status === 'pending' ? 'status-warning' :
                            'status-secondary'
                          }`}>
                            {investment.status}
                          </span>
                        </td>
                        <td>{investment.created_at}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {investments.length === 0 && (
          <div className="report-card">
            <div className="card-content">
              <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                No investment transactions found for the selected date range.
              </p>
            </div>
          </div>
        )}

        {/* TABLE 1: Completed Payouts */}
        {completedPayouts.length > 0 && (
          <div className="report-card">
            <div className="card-header">
              <FaCheckCircle className="header-icon" style={{ color: '#4caf50' }} />
              <h3>Completed Payouts ({completedPayouts.length})</h3>
            </div>
            <div className="card-content">
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Series ID</th>
                      <th>Series Name</th>
                      <th>Investor ID</th>
                      <th>Investor Name</th>
                      <th>Invested Amount (₹)</th>
                      <th>Payout Month</th>
                      <th>Payout Date</th>
                      <th>Paid Timestamp</th>
                      <th>Payout Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedPayouts.map((payout, idx) => (
                      <tr key={idx}>
                        <td><strong>{payout.series_id}</strong></td>
                        <td>{payout.series_name}</td>
                        <td>{payout.investor_id}</td>
                        <td>{payout.investor_name}</td>
                        <td style={{ textAlign: 'right' }}>
                          {payout.invested_amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td>{payout.payout_month}</td>
                        <td>{payout.payout_date}</td>
                        <td>{payout.paid_timestamp}</td>
                        <td style={{ textAlign: 'right' }}>
                          <strong style={{ color: '#4caf50' }}>
                            {payout.payout_amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {completedPayouts.length === 0 && (
          <div className="report-card">
            <div className="card-header">
              <FaCheckCircle className="header-icon" style={{ color: '#4caf50' }} />
              <h3>Completed Payouts</h3>
            </div>
            <div className="card-content">
              <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                No completed payouts found.
              </p>
            </div>
          </div>
        )}

        {/* TABLE 2: Pending Payouts */}
        {pendingPayouts.length > 0 && (
          <div className="report-card">
            <div className="card-header">
              <FaClock className="header-icon" style={{ color: '#ff9800' }} />
              <h3>Pending Payouts ({pendingPayouts.length})</h3>
            </div>
            <div className="card-content">
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Series ID</th>
                      <th>Series Name</th>
                      <th>Investor ID</th>
                      <th>Investor Name</th>
                      <th>Invested Amount (₹)</th>
                      <th>Payout Month</th>
                      <th>Payout Date</th>
                      <th>Scheduled Timestamp</th>
                      <th>To Be Paid Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingPayouts.map((payout, idx) => (
                      <tr key={idx}>
                        <td><strong>{payout.series_id}</strong></td>
                        <td>{payout.series_name}</td>
                        <td>{payout.investor_id}</td>
                        <td>{payout.investor_name}</td>
                        <td style={{ textAlign: 'right' }}>
                          {payout.invested_amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td>{payout.payout_month}</td>
                        <td>{payout.payout_date}</td>
                        <td>{payout.scheduled_timestamp}</td>
                        <td style={{ textAlign: 'right' }}>
                          <strong style={{ color: '#ff9800' }}>
                            {payout.payout_amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {pendingPayouts.length === 0 && (
          <div className="report-card">
            <div className="card-header">
              <FaClock className="header-icon" style={{ color: '#ff9800' }} />
              <h3>Pending Payouts</h3>
            </div>
            <div className="card-content">
              <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                No pending payouts found.
              </p>
            </div>
          </div>
        )}

        {/* TABLE 3: Upcoming Payouts (Next Month) */}
        {upcomingPayouts.length > 0 && (
          <div className="report-card">
            <div className="card-header">
              <FaCalendarAlt className="header-icon" style={{ color: '#2196f3' }} />
              <h3>Upcoming Payouts - Next Month ({upcomingPayouts.length})</h3>
            </div>
            <div className="card-content">
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Series ID</th>
                      <th>Series Name</th>
                      <th>Investor ID</th>
                      <th>Investor Name</th>
                      <th>Payout Month</th>
                      <th>Payout Date</th>
                      <th>To Be Paid Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingPayouts.map((payout, idx) => (
                      <tr key={idx}>
                        <td><strong>{payout.series_id}</strong></td>
                        <td>{payout.series_name}</td>
                        <td>{payout.investor_id}</td>
                        <td>{payout.investor_name}</td>
                        <td>{payout.payout_month}</td>
                        <td>{payout.payout_date}</td>
                        <td style={{ textAlign: 'right' }}>
                          <strong style={{ color: '#2196f3' }}>
                            {payout.payout_amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {upcomingPayouts.length === 0 && (
          <div className="report-card">
            <div className="card-header">
              <FaCalendarAlt className="header-icon" style={{ color: '#2196f3' }} />
              <h3>Upcoming Payouts - Next Month</h3>
            </div>
            <div className="card-content">
              <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                No upcoming payouts scheduled for next month.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderDailyActivity = () => {
    const summary = reportData?.summary || {};
    const userActivities = reportData?.user_activities || [];
    const roleBreakdown = reportData?.role_breakdown || [];
    const allRoles = reportData?.all_roles || [];
    const filters = reportData?.filters || {};

    const formatTime = (minutes) => {
      const hours = Math.floor(minutes / 60);
      const mins = Math.floor(minutes % 60);
      return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    };

    // Prepare data for pie chart
    const chartData = roleBreakdown.map(role => ({
      name: role.role,
      value: role.total_time_minutes,
      percentage: role.percentage
    }));

    // Colors for pie chart
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

    return (
      <div className="report-content">
        {/* Filters Section with Controls */}
        <div className="report-card">
          <div className="card-header">
            <MdToday className="header-icon" />
            <h3>Daily Activity Report - Filters</h3>
          </div>
          <div className="card-content">
            <div className="date-filter-section">
              {/* From Date */}
              <div className="date-input-group">
                <label>From Date:</label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  max={dateRange.endDate}
                  onChange={(e) => handleDateChange('startDate', e.target.value)}
                  className="date-input"
                />
              </div>

              {/* To Date */}
              <div className="date-input-group">
                <label>To Date:</label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  min={dateRange.startDate}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => handleDateChange('endDate', e.target.value)}
                  className="date-input"
                />
              </div>

              {/* Role Selection */}
              <div className="date-input-group">
                <label>Role:</label>
                <select
                  value={selectedSeries}
                  onChange={(e) => setSelectedSeries(e.target.value)}
                  className="date-input"
                >
                  <option value="all">All Roles</option>
                  {allRoles.map((role, idx) => (
                    <option key={idx} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="report-card">
          <div className="card-header">
            <FaChartLine className="header-icon" />
            <h3>Summary</h3>
          </div>
          <div className="card-content">
            <div className="summary-grid">
              <div className="summary-card">
                <div className="summary-icon" style={{ backgroundColor: '#e3f2fd', margin: '0 auto 15px' }}>
                  <FaUsers style={{ color: '#1976d2' }} />
                </div>
                <div className="summary-details" style={{ textAlign: 'center' }}>
                  <div className="summary-label" style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Total Users</div>
                  <div className="summary-value" style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976d2', marginBottom: '5px' }}>{summary.total_users || 0}</div>
                  <div className="summary-sublabel" style={{ fontSize: '12px', color: '#999' }}>Active in Period</div>
                </div>
              </div>

              <div className="summary-card">
                <div className="summary-icon" style={{ backgroundColor: '#fff3e0', margin: '0 auto 15px' }}>
                  <FaClock style={{ color: '#f57c00' }} />
                </div>
                <div className="summary-details" style={{ textAlign: 'center' }}>
                  <div className="summary-label" style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Avg Time Spent</div>
                  <div className="summary-value" style={{ fontSize: '24px', fontWeight: 'bold', color: '#f57c00', marginBottom: '5px' }}>{formatTime(summary.avg_time_spent_minutes || 0)}</div>
                  <div className="summary-sublabel" style={{ fontSize: '12px', color: '#999' }}>Per User</div>
                </div>
              </div>

              <div className="summary-card">
                <div className="summary-icon" style={{ backgroundColor: '#e8f5e9', margin: '0 auto 15px' }}>
                  <FaUserTag style={{ color: '#388e3c' }} />
                </div>
                <div className="summary-details" style={{ textAlign: 'center' }}>
                  <div className="summary-label" style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Total Roles</div>
                  <div className="summary-value" style={{ fontSize: '24px', fontWeight: 'bold', color: '#388e3c', marginBottom: '5px' }}>{summary.total_roles || 0}</div>
                  <div className="summary-sublabel" style={{ fontSize: '12px', color: '#999' }}>Active Roles</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Activity Table */}
        {userActivities.length > 0 && (
          <div className="report-card">
            <div className="card-header">
              <FaUserClock className="header-icon" />
              <h3>User Activity ({userActivities.length})</h3>
            </div>
            <div className="card-content">
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>User ID</th>
                      <th>User Name</th>
                      <th>Role</th>
                      <th>Login Count</th>
                      <th>Total Time Spent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userActivities.map((activity, idx) => (
                      <tr key={idx}>
                        <td><strong>{activity.user_id}</strong></td>
                        <td>{activity.user_name}</td>
                        <td>
                          <span className="status-badge status-info">
                            {activity.role}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>{activity.login_count}</td>
                        <td style={{ textAlign: 'right' }}>
                          <strong>{activity.time_spent_formatted}</strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {userActivities.length === 0 && (
          <div className="report-card">
            <div className="card-content">
              <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                No user activity found for the selected date range.
              </p>
            </div>
          </div>
        )}

        {/* Role-wise Time Spent Pie Chart */}
        {roleBreakdown.length > 0 && (
          <div className="report-card">
            <div className="card-header">
              <FaChartPie className="header-icon" />
              <h3>Time Spent by Role</h3>
            </div>
            <div className="card-content">
              <div id="daily-activity-pie-chart" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '450px', backgroundColor: '#fff' }}>
                <ResponsiveContainer width="100%" height={450}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={false}
                      outerRadius={130}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => formatTime(value)}
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px', padding: '10px' }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      formatter={(value, entry) => `${value}: ${entry.payload.percentage}%`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              {/* Role Breakdown Table */}
              <div style={{ marginTop: '30px' }}>
                <h4 style={{ marginBottom: '15px', color: '#333' }}>Detailed Breakdown</h4>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', width: '40%' }}>Role</th>
                      <th style={{ textAlign: 'right', width: '30%' }}>Total Time</th>
                      <th style={{ textAlign: 'right', width: '30%' }}>Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roleBreakdown.map((role, idx) => (
                      <tr key={idx}>
                        <td style={{ textAlign: 'left' }}>
                          <span className="status-badge status-info">
                            {role.role}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <strong>{formatTime(role.total_time_minutes)}</strong>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <strong>{role.percentage}%</strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSubscriptionTrend = () => {
    const summaryTop = reportData?.summary_top || {};
    const investorDetails = reportData?.investor_details || [];
    const summaryRetention = reportData?.summary_retention || {};
    const seriesTrend = reportData?.series_trend || [];
    const topPerformingSeries = reportData?.top_performing_series || [];

    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
      }).format(amount);
    };

    // Calculate normalized performance (relative to highest investment)
    const maxInvestment = Math.max(...topPerformingSeries.map(s => s.total_invested), 1);
    const normalizedSeriesData = topPerformingSeries.map(series => ({
      ...series,
      normalized_percentage: ((series.total_invested / maxInvestment) * 100).toFixed(2)
    }));

    return (
      <div className="report-content">
        {/* SECTION 1: Top Summary Cards */}
        <div className="report-card">
          <div className="card-header">
            <MdInsights className="header-icon" />
            <h3>Overview Summary</h3>
          </div>
          <div className="card-content">
            <div className="kpi-grid">
              <div className="kpi-item">
                <MdBarChart className="kpi-icon" />
                <div className="kpi-details">
                  <span className="kpi-value">{summaryTop.total_series || 0}</span>
                  <span className="kpi-label">Total Series</span>
                </div>
              </div>
              <div className="kpi-item">
                <MdTrendingUp className="kpi-icon" />
                <div className="kpi-details">
                  <span className="kpi-value">{summaryTop.active_series || 0}</span>
                  <span className="kpi-label">Active Series</span>
                </div>
              </div>
              <div className="kpi-item">
                <FaUsers className="kpi-icon" />
                <div className="kpi-details">
                  <span className="kpi-value">{summaryTop.total_investors || 0}</span>
                  <span className="kpi-label">Total Investors</span>
                </div>
              </div>
              <div className="kpi-item">
                <FaUserCheck className="kpi-icon" />
                <div className="kpi-details">
                  <span className="kpi-value">{summaryTop.active_investors || 0}</span>
                  <span className="kpi-label">Active Investors</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Investor Details Table */}
        {investorDetails.length > 0 && (
          <div className="report-card">
            <div className="card-header">
              <FaUsers className="header-icon" />
              <h3>Investor Details ({investorDetails.length})</h3>
            </div>
            <div className="card-content">
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Investor ID</th>
                      <th>Investor Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th style={{ textAlign: 'right' }}>Total Investment</th>
                      <th style={{ textAlign: 'center' }}>Series Count</th>
                      <th style={{ textAlign: 'right' }}>Avg Investment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {investorDetails.map((investor, idx) => (
                      <tr key={idx}>
                        <td><strong>{investor.investor_id}</strong></td>
                        <td>{investor.investor_name}</td>
                        <td>{investor.email}</td>
                        <td>{investor.phone}</td>
                        <td style={{ textAlign: 'right' }}><strong>{formatCurrency(investor.total_investment)}</strong></td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="status-badge status-info">{investor.series_count}</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(investor.avg_investment)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: Retention Summary Cards */}
        <div className="report-card">
          <div className="card-header">
            <MdShowChart className="header-icon" />
            <h3>Retention & Growth Metrics</h3>
          </div>
          <div className="card-content">
            <div className="kpi-grid">
              <div className="kpi-item">
                <FaUserCheck className="kpi-icon" />
                <div className="kpi-details">
                  <span className="kpi-value">{summaryRetention.retained_investors || 0}</span>
                  <span className="kpi-label">Retained Investors</span>
                </div>
              </div>
              <div className="kpi-item">
                <MdTrendingUp className="kpi-icon" />
                <div className="kpi-details">
                  <span className="kpi-value">{summaryRetention.retention_rate || 0}%</span>
                  <span className="kpi-label">Retention Rate</span>
                </div>
              </div>
              <div className="kpi-item">
                <FaChartLine className="kpi-icon" />
                <div className="kpi-details">
                  <span className="kpi-value">{summaryRetention.avg_investors_increase || 0}</span>
                  <span className="kpi-label">Avg Investors Increase</span>
                </div>
              </div>
              <div className="kpi-item">
                <MdAccountBalance className="kpi-icon" />
                <div className="kpi-details">
                  <span className="kpi-value">{formatCurrency(summaryRetention.avg_investment_increase || 0)}</span>
                  <span className="kpi-label">Avg Investment Increase</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: Series Trend Table */}
        {seriesTrend.length > 0 && (
          <div className="report-card">
            <div className="card-header">
              <MdTimeline className="header-icon" />
              <h3>Series Trend Analysis ({seriesTrend.length})</h3>
            </div>
            <div className="card-content">
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Series ID</th>
                      <th>Series Name</th>
                      <th style={{ textAlign: 'center' }}>Total Investors</th>
                      <th style={{ textAlign: 'center' }}>Investor Change %</th>
                      <th style={{ textAlign: 'right' }}>Total Investment</th>
                      <th style={{ textAlign: 'center' }}>Investment Change %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seriesTrend.map((series, idx) => (
                      <tr key={idx}>
                        <td><strong>{series.series_id}</strong></td>
                        <td>{series.series_name}</td>
                        <td style={{ textAlign: 'center' }}>{series.total_investors}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={series.investor_change_pct >= 0 ? 'text-success' : 'text-danger'}>
                            {series.investor_change_pct >= 0 ? '+' : ''}{series.investor_change_pct}%
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}><strong>{formatCurrency(series.total_investment)}</strong></td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={series.investment_change_pct >= 0 ? 'text-success' : 'text-danger'}>
                            {series.investment_change_pct >= 0 ? '+' : ''}{series.investment_change_pct}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 5: Top Performing Series Chart & Table */}
        {topPerformingSeries.length > 0 && (
          <>
            {/* Bar Chart */}
            <div className="report-card">
              <div className="card-header">
                <MdAssessment className="header-icon" />
                <h3>Top Performing Series - Relative Performance Comparison</h3>
              </div>
              <div className="card-content">
                <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px', fontSize: '13px', color: '#666' }}>
                  <strong>Note:</strong> Chart shows relative performance where 100% = highest invested series. All other series are shown as a percentage of the top performer.
                </div>
                <div id="subscription-trend-bar-chart" style={{ width: '100%', height: '400px', minHeight: '400px', backgroundColor: '#ffffff' }}>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={normalizedSeriesData}
                      layout="vertical"
                      margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis 
                        type="number" 
                        domain={[0, 100]}
                        label={{ value: 'Relative Performance (%)', position: 'insideBottom', offset: -10 }}
                        ticks={[0, 20, 40, 60, 80, 100]}
                      />
                      <YAxis 
                        type="category" 
                        dataKey="series_name" 
                        width={90}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip 
                        formatter={(value, name, props) => {
                          const invested = formatCurrency(props.payload.total_invested);
                          return [`${parseFloat(value).toFixed(2)}% (${invested})`, 'Performance'];
                        }}
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}
                      />
                      <Bar 
                        dataKey="normalized_percentage" 
                        fill="#8884d8"
                        radius={[0, 8, 8, 0]}
                      >
                        {normalizedSeriesData.map((entry, index) => {
                          const percentage = parseFloat(entry.normalized_percentage);
                          let color;
                          if (percentage >= 90) {
                            color = '#4caf50'; // Green - Top performers
                          } else if (percentage >= 70) {
                            color = '#8bc34a'; // Light Green
                          } else if (percentage >= 50) {
                            color = '#ffc107'; // Amber
                          } else if (percentage >= 30) {
                            color = '#ff9800'; // Orange
                          } else {
                            color = '#f44336'; // Red
                          }
                          return <Cell key={`cell-${index}`} fill={color} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Legend */}
                <div style={{ marginTop: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <div style={{ width: '20px', height: '12px', backgroundColor: '#4caf50', borderRadius: '2px' }}></div>
                      <span style={{ fontSize: '12px' }}>90-100% (Top Performers)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <div style={{ width: '20px', height: '12px', backgroundColor: '#8bc34a', borderRadius: '2px' }}></div>
                      <span style={{ fontSize: '12px' }}>70-89%</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <div style={{ width: '20px', height: '12px', backgroundColor: '#ffc107', borderRadius: '2px' }}></div>
                      <span style={{ fontSize: '12px' }}>50-69%</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <div style={{ width: '20px', height: '12px', backgroundColor: '#ff9800', borderRadius: '2px' }}></div>
                      <span style={{ fontSize: '12px' }}>30-49%</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <div style={{ width: '20px', height: '12px', backgroundColor: '#f44336', borderRadius: '2px' }}></div>
                      <span style={{ fontSize: '12px' }}>&lt;30%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Table */}
            <div className="report-card">
              <div className="card-header">
                <MdAssessment className="header-icon" />
                <h3>Top Performing Series - Detailed View ({topPerformingSeries.length})</h3>
              </div>
              <div className="card-content">
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Series ID</th>
                        <th>Series Name</th>
                        <th style={{ textAlign: 'center' }}>Interest Rate</th>
                        <th>Trustee</th>
                        <th>Security Type</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th style={{ textAlign: 'center' }}>Investment %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topPerformingSeries.map((series, idx) => (
                        <tr key={idx}>
                          <td><strong>{series.series_id}</strong></td>
                          <td>{series.series_name}</td>
                          <td style={{ textAlign: 'center' }}><strong>{series.interest_rate}%</strong></td>
                          <td>{series.trustee}</td>
                          <td>
                            <span className="status-badge status-info">{series.security_type}</span>
                          </td>
                          <td>{new Date(series.start_date).toLocaleDateString('en-GB')}</td>
                          <td>{new Date(series.end_date).toLocaleDateString('en-GB')}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span className={series.investment_percentage >= 100 ? 'text-success' : series.investment_percentage >= 50 ? 'text-warning' : 'text-danger'}>
                              {series.investment_percentage}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderSeriesMaturity = () => {
    const summary = reportData?.summary || {};
    const seriesMaturing90Days = reportData?.series_maturing_90_days || [];
    const investorsBySeries90Days = reportData?.investors_by_series_90_days || {};
    const seriesMaturing90To180Days = reportData?.series_maturing_90_to_180_days || [];
    const seriesMaturingAfter6Months = reportData?.series_maturing_after_6_months || [];

    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
      }).format(amount);
    };

    return (
      <div className="report-content">
        {/* SECTION 1: Summary Cards */}
        <div className="report-card">
          <div className="card-header">
            <MdEventNote className="header-icon" />
            <h3>Maturity Overview</h3>
          </div>
          <div className="card-content">
            <div className="kpi-grid">
              <div className="kpi-item">
                <MdBarChart className="kpi-icon" />
                <div className="kpi-details">
                  <span className="kpi-value">{summary.total_series || 0}</span>
                  <span className="kpi-label">Total Series</span>
                </div>
              </div>
              <div className="kpi-item">
                <MdWarning className="kpi-icon" style={{ color: '#ff9800' }} />
                <div className="kpi-details">
                  <span className="kpi-value">{summary.series_maturing_soon || 0}</span>
                  <span className="kpi-label">Maturing Within 90 Days</span>
                </div>
              </div>
              <div className="kpi-item">
                <FaUsers className="kpi-icon" />
                <div className="kpi-details">
                  <span className="kpi-value">{summary.total_investors || 0}</span>
                  <span className="kpi-label">Total Investors</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Series Maturing Within 90 Days */}
        {seriesMaturing90Days.length > 0 && (
          <div className="report-card">
            <div className="card-header">
              <MdWarning className="header-icon" style={{ color: '#ff9800' }} />
              <h3>Series Maturing Within 90 Days ({seriesMaturing90Days.length})</h3>
            </div>
            <div className="card-content">
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Series ID</th>
                      <th>Series Name</th>
                      <th style={{ textAlign: 'center' }}>No. of Investors</th>
                      <th>Maturity Date</th>
                      <th style={{ textAlign: 'right' }}>Amount to Return</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seriesMaturing90Days.map((series, idx) => (
                      <tr key={idx}>
                        <td><strong>{series.series_id}</strong></td>
                        <td>{series.series_name}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="status-badge status-info">{series.investor_count}</span>
                        </td>
                        <td>{new Date(series.maturity_date).toLocaleDateString('en-GB')}</td>
                        <td style={{ textAlign: 'right' }}><strong>{formatCurrency(series.total_amount_to_return)}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: Investor Details for Each Series (≤90 Days) */}
        {seriesMaturing90Days.map((series, seriesIdx) => {
          const investors = investorsBySeries90Days[series.series_id] || [];
          
          if (investors.length === 0) return null;
          
          return (
            <div key={`investors-${seriesIdx}`} className="report-card">
              <div className="card-header">
                <FaUsers className="header-icon" />
                <h3>Investors in {series.series_name} ({investors.length})</h3>
              </div>
              <div className="card-content">
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Investor ID</th>
                        <th>Investor Name</th>
                        <th style={{ textAlign: 'center' }}>Active in Series</th>
                        <th style={{ textAlign: 'right' }}>Amount to Receive</th>
                      </tr>
                    </thead>
                    <tbody>
                      {investors.map((investor, idx) => (
                        <tr key={idx}>
                          <td><strong>{investor.investor_id}</strong></td>
                          <td>{investor.investor_name}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span className="status-badge status-success">{investor.active_series_count}</span>
                          </td>
                          <td style={{ textAlign: 'right' }}><strong>{formatCurrency(investor.amount_to_receive)}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })}

        {/* SECTION 4: Series Maturing Between 90 Days and 6 Months */}
        {seriesMaturing90To180Days.length > 0 && (
          <div className="report-card">
            <div className="card-header">
              <MdSchedule className="header-icon" style={{ color: '#2196f3' }} />
              <h3>Series Maturing in 90-180 Days ({seriesMaturing90To180Days.length})</h3>
            </div>
            <div className="card-content">
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Series ID</th>
                      <th>Series Name</th>
                      <th style={{ textAlign: 'center' }}>No. of Investors</th>
                      <th>Maturity Date</th>
                      <th style={{ textAlign: 'right' }}>Amount to Return</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seriesMaturing90To180Days.map((series, idx) => (
                      <tr key={idx}>
                        <td><strong>{series.series_id}</strong></td>
                        <td>{series.series_name}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="status-badge status-info">{series.investor_count}</span>
                        </td>
                        <td>{new Date(series.maturity_date).toLocaleDateString('en-GB')}</td>
                        <td style={{ textAlign: 'right' }}><strong>{formatCurrency(series.total_amount_to_return)}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 5: Series Maturing After 6 Months */}
        {seriesMaturingAfter6Months.length > 0 && (
          <div className="report-card">
            <div className="card-header">
              <MdCheckCircle className="header-icon" style={{ color: '#4caf50' }} />
              <h3>Series Maturing After 6 Months ({seriesMaturingAfter6Months.length})</h3>
            </div>
            <div className="card-content">
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Series ID</th>
                      <th>Series Name</th>
                      <th style={{ textAlign: 'center' }}>No. of Investors</th>
                      <th>Maturity Date</th>
                      <th style={{ textAlign: 'right' }}>Amount to Return</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seriesMaturingAfter6Months.map((series, idx) => (
                      <tr key={idx}>
                        <td><strong>{series.series_id}</strong></td>
                        <td>{series.series_name}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="status-badge status-info">{series.investor_count}</span>
                        </td>
                        <td>{new Date(series.maturity_date).toLocaleDateString('en-GB')}</td>
                        <td style={{ textAlign: 'right' }}><strong>{formatCurrency(series.total_amount_to_return)}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="report-preview-overlay">
      <div className="report-preview-modal">
        <div className="report-preview-header">
          <h2>{reportName}</h2>
          <div className="header-controls">
            {/* Security Type Filter for RBI Compliance Report */}
            {reportName === 'RBI Compliance Report' && (
              <select 
                value={selectedSecurityType} 
                onChange={(e) => setSelectedSecurityType(e.target.value)}
                className="format-selector"
                style={{ marginRight: '10px' }}
              >
                <option value="all">All Security Types</option>
                <option value="Secured">Secured</option>
                <option value="Unsecured">Unsecured</option>
              </select>
            )}
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