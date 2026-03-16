import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import apiService from '../services/api';
import auditService from '../services/auditService';
import jsPDF from 'jspdf';
import { PDFDocument, PDFPage, rgb } from 'pdf-lib';
import Lottie from 'lottie-react';
import documentDownloadAnimation from '../assets/animations/document-download.json';
import './ComplianceTracker.css';
import { 
  HiOutlineDownload,
  HiOutlinePlus,
  HiOutlineX,
  HiOutlineCheck,
  HiOutlineDocumentText,
  HiOutlineUpload,
  HiOutlineShieldCheck,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineInformationCircle
} from 'react-icons/hi';
import { 
  MdNotifications,
  MdTrendingUp,
  MdAccountBalance,
  MdClose,
  MdSecurity,
  MdDateRange
} from 'react-icons/md';

const ComplianceTracker = ({ onClose, seriesData = null }) => {
  const navigate = useNavigate();
  const { updateComplianceStatus, addAuditLog } = useData();
  const { user } = useAuth();
  const toast = useToast();
  
  // State for modals
  const [showExportModal, setShowExportModal] = useState(false);
  const [showAddDocumentModal, setShowAddDocumentModal] = useState(false);
  const [showTimeSheetModal, setShowTimeSheetModal] = useState(false);
  const [showUploadAnimation, setShowUploadAnimation] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [timesheetData, setTimesheetData] = useState({}); // Store timesheet data: {itemId: {year: {month: status}}}
  
  // Load timesheet data when modal opens
  useEffect(() => {
    const loadTimesheetData = async () => {
      if (!showTimeSheetModal || !seriesData?.seriesId) return;
      
      try {
        
        const monthlyData = {};
        const prePostSubmissionDates = {}; // Store submission dates for pre/post items
        
        // Load pre/post items (one-time, but need submission date)
        const prePostResponse = await apiService.getSeriesCompliance(
          seriesData.seriesId,
          null,
          null
        );
        
        prePostResponse.items
          .filter(item => item.section === 'pre' || item.section === 'post')
          .forEach(item => {
            if (item.submitted_at) {
              // Store the submission date
              prePostSubmissionDates[item.item_id] = new Date(item.submitted_at);
            }
          });
        
        // For recurring items, load data for all 12 months of selected year
        for (let month = 1; month <= 12; month++) {
          const response = await apiService.getSeriesCompliance(
            seriesData.seriesId,
            selectedYear,
            month
          );
          
          // Store data for recurring items in this month
          response.items
            .filter(item => item.section === 'recurring')
            .forEach(item => {
              if (!monthlyData[item.item_id]) {
                monthlyData[item.item_id] = {};
              }
              if (!monthlyData[item.item_id][selectedYear]) {
                monthlyData[item.item_id][selectedYear] = {};
              }
              monthlyData[item.item_id][selectedYear][month] = 
                item.status === 'received' || item.status === 'submitted';
            });
        }
        
        setTimesheetData({ monthly: monthlyData, prePostDates: prePostSubmissionDates });
        
      } catch (error) {
      }
    };
    
    loadTimesheetData();
  }, [showTimeSheetModal, selectedYear, seriesData?.seriesId]);
  
  // Get valid years for timesheet (from series issue date to maturity date OR current year)
  const getValidYears = () => {
    const currentYear = new Date().getFullYear();
    const issueYear = seriesData?.issueDate ? new Date(seriesData.issueDate).getFullYear() : currentYear;
    const maturityYear = seriesData?.maturityDate ? new Date(seriesData.maturityDate).getFullYear() : currentYear;
    
    // Show years from issue year to maturity year (or current year if series hasn't matured yet)
    const endYear = Math.min(maturityYear, currentYear);
    
    const years = [];
    for (let year = issueYear; year <= endYear; year++) {
      years.push(year);
    }
    return years;
  };
  const [timeSheetData, setTimeSheetData] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [historicalComplianceData, setHistoricalComplianceData] = useState({});
  const [exportFormat, setExportFormat] = useState('pdf');
  const [exportSections, setExportSections] = useState({
    preCompliance: true,
    postCompliance: true,
    recurringCompliances: true,
    statistics: true
  });
  const [documentForm, setDocumentForm] = useState({
    title: '',
    category: 'pre-compliance',
    file: null,
    description: '',
    legalReference: ''
  });
  // State for compliance items with radio button functionality
  const [complianceItems, setComplianceItems] = useState([
    // Pre-Compliance Documents (26 items)
    { id: 1, section: 'pre', title: 'Acceptance copy of consent letter', completed: false, checked: false },
    { id: 2, section: 'pre', title: 'CTC of Memorandum and Articles of Association of the company', completed: false, checked: false },
    { id: 3, section: 'pre', title: 'CTC of Board Resolution appointing Debenture Trustee along with authority to create documents', completed: false, checked: false },
    { id: 4, section: 'pre', title: 'Certified True Copy of resolution passed by the Board of Directors under Section 179 (3) (c) of the Companies Act, 2013 for the issue of debentures', completed: false, checked: false },
    { id: 5, section: 'pre', title: 'CTC of Special Resolution passed under Section 180 (1) (c) of the Companies Act 2013 authorizing the BOD to borrow money', completed: false, checked: false },
    { id: 6, section: 'pre', title: 'CTC of Special Resolution passed under Section 180 (1) (a) of the Companies Act 2013 authorizing the BOD to charge the security against borrowings', completed: false, checked: false },
    { id: 7, section: 'pre', title: 'CTC of Capital Structure certificate (Authorized, Paid-up and Subscribed Capital) certified by Chartered Accountant of the Company', completed: false, checked: false },
    { id: 8, section: 'pre', title: 'CTC of Authorized capital classified & paid up on the effective of the issue date/allotment party specifically mentioned', completed: false, checked: false },
    { id: 9, section: 'pre', title: 'A copy of the latest annual Report of the company for last 3 years', completed: false, checked: false },
    { id: 10, section: 'pre', title: 'Certified copy of half of acceptance / Memorandum like terms of the Debenture/Bond arrangement', completed: false, checked: false },
    { id: 11, section: 'pre', title: 'Certified copy of Board Resolution for appointment of Lead Manager and other intermediaries', completed: false, checked: false },
    { id: 12, section: 'pre', title: 'The application for listing eligibility as Issuer (First time listing eligibility)', completed: false, checked: false },
    { id: 13, section: 'pre', title: 'Debenture Trust Deed (to be executed on or before the Issue opening date)', completed: false, checked: false },
    { id: 14, section: 'pre', title: 'Tripartite Agreement between Company, Debenture Trustee and Registrar', completed: false, checked: false },
    { id: 15, section: 'pre', title: 'Agreement for Registrar Services', completed: false, checked: false },
    { id: 16, section: 'pre', title: 'Registrar and Transfer Agent Agreement', completed: false, checked: false },
    { id: 17, section: 'pre', title: 'In-principle approval / NOC from Stock Exchange for listing', completed: false, checked: false },
    { id: 18, section: 'pre', title: 'Approval from SEBI for Public Issue (if applicable)', completed: false, checked: false },
    { id: 19, section: 'pre', title: 'Credit Rating Certificate from approved Credit Rating Agency', completed: false, checked: false },
    { id: 20, section: 'pre', title: 'Banker to the Issue Agreement', completed: false, checked: false },
    { id: 21, section: 'pre', title: 'Escrow Agreement', completed: false, checked: false },
    { id: 22, section: 'pre', title: 'Cash Escrow and Monitoring Agency Agreement', completed: false, checked: false },
    { id: 23, section: 'pre', title: 'Security Creation Documents (if applicable)', completed: false, checked: false },
    { id: 24, section: 'pre', title: 'Insurance Policy for the assets (if applicable)', completed: false, checked: false },
    { id: 25, section: 'pre', title: 'Environmental Clearance (if applicable)', completed: false, checked: false },
    { id: 26, section: 'pre', title: 'Any other regulatory approvals as may be required', completed: false, checked: false },

    // Post-Compliance Documents (11 items)
    { id: 27, section: 'post', title: 'Execution of Debenture Trust Deed (within 2 months from closure of Issue)', completed: false, checked: false },
    { id: 28, section: 'post', title: 'Security Document (within 3 months from closure of Issue)', completed: false, checked: false },
    { id: 29, section: 'post', title: 'Form CHG-9 to be filed with MCA (within 30 days after execution of Security documents)', completed: false, checked: false },
    { id: 30, section: 'post', title: 'E-form PAS-3 (Return of Allotment) under Companies (Prospectus and Allotment of Securities) Rules, 2014', completed: false, checked: false },
    { id: 31, section: 'post', title: 'CERSAI registration on charged assets (within 30 days after execution of Security documents)', completed: false, checked: false },
    { id: 32, section: 'post', title: 'List of allottees / Debenture holders (Benpos)', completed: false, checked: false },
    { id: 33, section: 'post', title: 'Credit corporate action (NSDL & CDSL)', completed: false, checked: false },
    { id: 34, section: 'post', title: 'Copy of allotment letters / Resolution', completed: false, checked: false },
    { id: 35, section: 'post', title: 'Confirmation on payment of stamp duty on the Issue of Bonds', completed: false, checked: false },
    { id: 36, section: 'post', title: 'E-form PAS-4 and PAS-5 under Rule 14(3) of the Companies (Prospectus and Allotment of Securities) Rules, 2014', completed: false, checked: false },
    { id: 37, section: 'post', title: 'Utilization certificate from practicing chartered accountant', completed: false, checked: false },

    // Recurring Compliances (5 items)
    { id: 38, section: 'recurring', title: 'Interest payment confirmation along with proof (applicable for every Tranche)', frequency: 'Per Tranche', completed: false, checked: false },
    { id: 39, section: 'recurring', title: 'Redemption payment confirmation along with proof (applicable for every Tranche)', frequency: 'Per Tranche', completed: false, checked: false },
    { id: 40, section: 'recurring', title: 'Quarterly report to Trustee (format shared by Trustee)', frequency: 'Quarterly', completed: false, checked: false },
    { id: 41, section: 'recurring', title: 'Calendar of Interest and Redemptions (within 7 days of starting of every Financial Year)', frequency: 'Annually', completed: false, checked: false },
    { id: 42, section: 'recurring', title: 'Confirmation on creation of Debenture/Bond Redemption Reserve - Annually (certified by Statutory Auditor)', frequency: 'Annually', completed: false, checked: false }
  ]);

  // State for active tab
  const [activeTab, setActiveTab] = useState('post');
  
  // Loading state
  const [loading, setLoading] = useState(true);
  
  // Load compliance data from backend
  useEffect(() => {
    const loadData = async () => {
      if (!seriesData?.seriesId) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // For recurring items: load data for selected month
        // For pre/post items: load data without month (year=null, month=null)
        let year = null;
        let month = null;
        
        if (activeTab === 'recurring') {
          year = selectedDate.getFullYear();
          month = selectedDate.getMonth() + 1;
        }
        
        const response = await apiService.getSeriesCompliance(seriesData.seriesId, year, month);
        
        // Filter items by active tab
        const items = response.items
          .filter(item => item.section === activeTab)
          .map(item => ({
            id: item.item_id,
            section: item.section,
            title: item.title,
            frequency: item.frequency,
            completed: item.status === 'received' || item.status === 'submitted',
            checked: item.status === 'received' || item.status === 'submitted'
          }));
        
        setComplianceItems(items);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [seriesData?.seriesId, activeTab, selectedDate]);

  // Calculate stats based on current state
  const getStats = () => {
    const total = complianceItems.length;
    const completed = complianceItems.filter(item => item.completed).length;
    const pending = total - completed;
    
    return {
      totalRequirements: total,
      receivedCompleted: completed,
      pendingActions: pending,
      notApplicable: 0
    };
  };

  const handleItemToggle = (itemId) => {
    setComplianceItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const handleItemSubmit = async (itemId) => {
    try {
      const item = complianceItems.find(i => i.id === itemId);
      if (!item) return;
      
      // For recurring items: use selected date
      // For pre/post items: year=null, month=null
      let year = null;
      let month = null;
      
      if (item.section === 'recurring') {
        year = selectedDate.getFullYear();
        month = selectedDate.getMonth() + 1;
      } else {
      }
      
      // Save to backend
      await apiService.updateComplianceStatus(
        seriesData.seriesId,
        itemId,
        {
          year: year,
          month: month,
          status: 'received',
          notes: 'Submitted'
        }
      );
      
      // Add audit log for status update
      auditService.logComplianceStatusUpdated({
        seriesId: seriesData.seriesId,
        seriesName: seriesData.seriesName,
        itemId: itemId,
        itemTitle: item.title,
        section: item.section,
        oldStatus: 'pending',
        newStatus: 'received',
        year: year,
        month: month
      }, user).catch(error => {
      });
      
      // Reload data for current view
      const response = await apiService.getSeriesCompliance(
        seriesData.seriesId,
        activeTab === 'recurring' ? year : null,
        activeTab === 'recurring' ? month : null
      );
      
      const items = response.items
        .filter(item => item.section === activeTab)
        .map(item => ({
          id: item.item_id,
          section: item.section,
          title: item.title,
          frequency: item.frequency,
          completed: item.status === 'received' || item.status === 'submitted',
          checked: item.status === 'received' || item.status === 'submitted'
        }));
      
      setComplianceItems(items);
      
      toast.success('Compliance status updated successfully!', 'Status Updated');
    } catch (error) {
      toast.error('Failed to update compliance status. Please try again.', 'Update Failed');
    }
  };

  // OLD FUNCTION BELOW - KEEPING FOR REFERENCE
  const handleItemSubmit_OLD = (itemId) => {
    const currentDate = new Date();
    const isCurrentMonth = selectedDate.getMonth() === currentDate.getMonth() && 
                          selectedDate.getFullYear() === currentDate.getFullYear();
    
    if (isCurrentMonth) {
      // Update current compliance items
      setComplianceItems(prev => {
        const updated = prev.map(item => 
          item.id === itemId ? { ...item, completed: true, checked: true } : item
        );
        
        // Find the item that was updated for audit logging
        const updatedItem = prev.find(item => item.id === itemId);
        
        // Add audit log for compliance status change
        if (updatedItem && addAuditLog) {
          addAuditLog({
            action: 'Updated Compliance Status',
            adminName: user ? user.name : 'Admin',
            adminRole: user ? user.displayRole : 'Admin',
            details: `Changed compliance status from PENDING to RECEIVED for "${updatedItem.title}" in ${seriesData?.seriesName || 'Series A NCD'}`,
            entityType: 'Compliance',
            entityId: seriesData?.seriesName || 'Series A NCD',
            changes: {
              complianceItem: updatedItem.title,
              section: updatedItem.section,
              previousStatus: 'PENDING',
              newStatus: 'RECEIVED',
              seriesName: seriesData?.seriesName || 'Series A NCD',
              trusteeCompany: seriesData?.trusteeCompany || 'SBICAP Trustee Co. Ltd.',
              itemId: itemId
            }
          });
        }
        
        // Update compliance status in DataContext
        updateComplianceStatusInContext(updated);
        
        return updated;
      });
    } else {
      // Update historical data
      const selectedMonth = selectedDate.getMonth();
      const selectedYear = selectedDate.getFullYear();
      const dateKey = `${selectedYear}-${selectedMonth}`;
      const itemKey = `${dateKey}-${itemId}`;
      
      setHistoricalComplianceData(prev => {
        const updated = {
          ...prev,
          [itemKey]: {
            checked: true,
            completed: true
          }
        };
        
        // Find the item that was updated for audit logging
        const updatedItem = complianceItems.find(item => item.id === itemId);
        
        // Add audit log for historical compliance status change
        if (updatedItem && addAuditLog) {
          addAuditLog({
            action: 'Updated Historical Compliance Status',
            adminName: user ? user.name : 'Admin',
            adminRole: user ? user.displayRole : 'Admin',
            details: `Changed historical compliance status from PENDING to RECEIVED for "${updatedItem.title}" in ${seriesData?.seriesName || 'Series A NCD'} (${selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})`,
            entityType: 'Compliance',
            entityId: seriesData?.seriesName || 'Series A NCD',
            changes: {
              complianceItem: updatedItem.title,
              section: updatedItem.section,
              previousStatus: 'PENDING',
              newStatus: 'RECEIVED',
              seriesName: seriesData?.seriesName || 'Series A NCD',
              trusteeCompany: seriesData?.trusteeCompany || 'SBICAP Trustee Co. Ltd.',
              historicalDate: selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
              itemId: itemId
            }
          });
        }
        
        // Update compliance status in DataContext for historical data
        updateComplianceStatusInContextHistorical(updated);
        
        return updated;
      });
    }
  };

  // Function to update compliance status in DataContext
  const updateComplianceStatusInContext = (items) => {
    const seriesName = seriesData?.seriesName || 'Series A NCD';
    
    const preItems = items.filter(item => item.section === 'pre');
    const postItems = items.filter(item => item.section === 'post');
    const recurringItems = items.filter(item => item.section === 'recurring');
    
    const prePercentage = Math.round((preItems.filter(item => item.completed).length / preItems.length) * 100);
    const postPercentage = Math.round((postItems.filter(item => item.completed).length / postItems.length) * 100);
    const recurringPercentage = Math.round((recurringItems.filter(item => item.completed).length / recurringItems.length) * 100);
    
    updateComplianceStatus(seriesName, {
      pre: prePercentage,
      post: postPercentage,
      recurring: recurringPercentage
    });
  };

  // Function to update compliance status for historical data
  const updateComplianceStatusInContextHistorical = (historicalData) => {
    const seriesName = seriesData?.seriesName || 'Series A NCD';
    
    // Calculate percentages based on current items + historical overrides
    const preItems = complianceItems.filter(item => item.section === 'pre');
    const postItems = complianceItems.filter(item => item.section === 'post');
    const recurringItems = complianceItems.filter(item => item.section === 'recurring');
    
    const selectedMonth = selectedDate.getMonth();
    const selectedYear = selectedDate.getFullYear();
    const dateKey = `${selectedYear}-${selectedMonth}`;
    
    // Count completed items including historical overrides
    const preCompleted = preItems.filter(item => {
      const itemKey = `${dateKey}-${item.id}`;
      return historicalData[itemKey]?.completed || item.completed;
    }).length;
    
    const postCompleted = postItems.filter(item => {
      const itemKey = `${dateKey}-${item.id}`;
      return historicalData[itemKey]?.completed || item.completed;
    }).length;
    
    const recurringCompleted = recurringItems.filter(item => {
      const itemKey = `${dateKey}-${item.id}`;
      return historicalData[itemKey]?.completed || item.completed;
    }).length;
    
    const prePercentage = Math.round((preCompleted / preItems.length) * 100);
    const postPercentage = Math.round((postCompleted / postItems.length) * 100);
    const recurringPercentage = Math.round((recurringCompleted / recurringItems.length) * 100);
    
    updateComplianceStatus(seriesName, {
      pre: prePercentage,
      post: postPercentage,
      recurring: recurringPercentage
    });
  };

  const getComplianceBySection = (section) => {
    return complianceItems.filter(item => item.section === section);
  };

  const getSectionTitle = (section) => {
    switch (section) {
      case 'pre': return 'Pre-Compliance Documents';
      case 'post': return 'Post-Compliance Documents';
      case 'recurring': return 'Recurring Compliances';
      default: return 'Documents';
    }
  };

  const getSectionDescription = (section) => {
    switch (section) {
      case 'pre': return 'Documents required before NCD issue launch';
      case 'post': return 'Documents and filings required after NCD issue closure';
      case 'recurring': return 'Ongoing compliance requirements throughout the NCD tenure';
      default: return 'Compliance requirements';
    }
  };

  // Calculate compliance percentage for a section
  const getCompliancePercentage = (section) => {
    const sectionItems = getComplianceBySection(section);
    if (sectionItems.length === 0) return 0;
    const completed = sectionItems.filter(item => item.completed).length;
    return Math.round((completed / sectionItems.length) * 100);
  };

  // Get overall compliance status for the series
  const getOverallComplianceStatus = () => {
    const prePercentage = getCompliancePercentage('pre');
    const postPercentage = getCompliancePercentage('post');
    const recurringPercentage = getCompliancePercentage('recurring');
    
    // Calculate average percentage
    const averagePercentage = Math.round((prePercentage + postPercentage + recurringPercentage) / 3);
    
    if (averagePercentage === 100) return 'submitted';
    if (averagePercentage >= 50) return 'pending';
    return 'yet-to-be-submitted';
  };

  // Get status badge class and text
  const getStatusBadge = (percentage) => {
    if (percentage === 100) return { class: 'submitted', text: 'Submitted' };
    if (percentage >= 50) return { class: 'pending', text: 'Pending' };
    return { class: 'yet-to-be-submitted', text: 'Yet to be Submitted' };
  };

  // Handler functions
  const handleExportReport = () => {
    setShowExportModal(true);
  };

  const handleAddDocument = () => {
    setShowAddDocumentModal(true);
  };

  const handleTimeSheetToggle = (docIndex, month) => {
    const key = `${selectedYear}-${docIndex}-${month}`;
    setTimeSheetData(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getTimeSheetValue = (docIndex, month, section) => {
    const monthIndex = months.indexOf(month);
    const monthNumber = monthIndex + 1; // Convert to 1-based (1 = January)
    
    // Get the actual compliance items for the section
    const sectionItems = getComplianceBySection(section);
    const docItem = sectionItems[docIndex - 1]; // docIndex is 1-based
    
    if (!docItem) return false;
    
    // For pre/post items: one-time submission, but only show from submission month onwards
    if (section === 'pre' || section === 'post') {
      // Check if item is completed
      if (!docItem.completed) {
        return false; // Not submitted yet
      }
      
      // Check if we have submission date
      const submissionDate = timesheetData?.prePostDates?.[docItem.id];
      if (!submissionDate) {
        // No submission date available, show as completed for all months
        return true;
      }
      
      // Only show as completed from submission month onwards
      const submissionYear = submissionDate.getFullYear();
      const submissionMonth = submissionDate.getMonth() + 1; // 1-based
      
      // Compare with the month being displayed in timesheet
      if (selectedYear > submissionYear) {
        return true; // Future year, definitely submitted
      } else if (selectedYear < submissionYear) {
        return false; // Past year, not submitted yet
      } else {
        // Same year, check month
        return monthNumber >= submissionMonth;
      }
    }
    
    // For recurring items: EACH MONTH HAS SEPARATE STATUS
    // Check the loaded timesheet data for this specific item, year, and month
    if (timesheetData?.monthly?.[docItem.id]?.[selectedYear]?.[monthNumber] !== undefined) {
      return timesheetData.monthly[docItem.id][selectedYear][monthNumber];
    }
    
    // If no data loaded yet, show as pending
    return false;
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  // Get valid months to display in timesheet
  // TIMESHEET shows ALL months for planning purposes
  const getValidMonths = () => {
    const issueDate = seriesData?.issueDate ? new Date(seriesData.issueDate) : new Date('2026-01-15');
    const issueYear = issueDate.getFullYear();
    const issueMonth = issueDate.getMonth(); // 0-based
    const maturityDate = seriesData?.maturityDate ? new Date(seriesData.maturityDate) : null;
    const maturityYear = maturityDate ? maturityDate.getFullYear() : null;
    const maturityMonth = maturityDate ? maturityDate.getMonth() : 11; // 0-based
    
    // If viewing issue year
    if (selectedYear === issueYear) {
      // Show months from issue month to December
      return months.slice(issueMonth);
    }
    
    // If viewing maturity year
    if (maturityYear && selectedYear === maturityYear) {
      // Show months from January to maturity month
      return months.slice(0, maturityMonth + 1);
    }
    
    // For all other years (between issue and maturity), show all 12 months
    return months;
  };

  // Get historical compliance status based on selected date
  const getHistoricalComplianceStatus = (item, selectedDate, type = 'completed') => {
    const currentDate = new Date();
    const selectedMonth = selectedDate.getMonth();
    const selectedYear = selectedDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    const dateKey = `${selectedYear}-${selectedMonth}`;
    const itemKey = `${dateKey}-${item.id}`;
    
    // If selected date is current month/year, use actual status
    if (selectedYear === currentYear && selectedMonth === currentMonth) {
      return type === 'completed' ? item.completed : item.checked;
    }
    
    // Check if we have stored historical data for this item and date
    if (historicalComplianceData[itemKey]) {
      return type === 'completed' ? historicalComplianceData[itemKey].completed : historicalComplianceData[itemKey].checked;
    }
    
    // For past dates without stored data, show some default historical completion patterns
    if (selectedDate < currentDate) {
      const monthsSinceSelected = (currentYear - selectedYear) * 12 + (currentMonth - selectedMonth);
      const completionProbability = Math.max(0.2, 0.8 - (monthsSinceSelected * 0.05));
      
      // Use item ID as seed for consistent results
      const seed = item.id * 7 + selectedMonth * 3 + selectedYear;
      const random = (seed % 100) / 100;
      
      const isCompleted = random < completionProbability;
      return type === 'completed' ? isCompleted : isCompleted;
    }
    
    // For future dates, nothing is completed
    return false;
  };

  const getDisplayedComplianceItems = () => {
    return complianceItems.map(item => ({
      ...item,
      completed: getHistoricalComplianceStatus(item, selectedDate, 'completed'),
      checked: getHistoricalComplianceStatus(item, selectedDate, 'checked')
    }));
  };

  const handleHistoricalItemToggle = (itemId) => {
    const selectedMonth = selectedDate.getMonth();
    const selectedYear = selectedDate.getFullYear();
    const dateKey = `${selectedYear}-${selectedMonth}`;
    const itemKey = `${dateKey}-${itemId}`;
    
    const currentItem = complianceItems.find(item => item.id === itemId);
    const currentChecked = getHistoricalComplianceStatus(currentItem, selectedDate, 'checked');
    const currentCompleted = getHistoricalComplianceStatus(currentItem, selectedDate, 'completed');
    
    // Don't allow toggling if already completed (submitted)
    if (currentCompleted) return;
    
    setHistoricalComplianceData(prev => ({
      ...prev,
      [itemKey]: {
        checked: !currentChecked,
        completed: prev[itemKey]?.completed || false
      }
    }));
  };

  const handleHistoricalItemSubmit = (itemId) => {
    const selectedMonth = selectedDate.getMonth();
    const selectedYear = selectedDate.getFullYear();
    const dateKey = `${selectedYear}-${selectedMonth}`;
    const itemKey = `${dateKey}-${itemId}`;
    
    setHistoricalComplianceData(prev => {
      const updated = {
        ...prev,
        [itemKey]: {
          checked: true,
          completed: true
        }
      };
      
      // Find the item that was updated for audit logging
      const updatedItem = complianceItems.find(item => item.id === itemId);
      
      // Add audit log for historical compliance status change
      if (updatedItem && addAuditLog) {
        addAuditLog({
          action: 'Updated Historical Compliance Status',
          adminName: user ? user.name : 'Admin',
          adminRole: user ? user.displayRole : 'Admin',
          details: `Changed historical compliance status from PENDING to RECEIVED for "${updatedItem.title}" in ${seriesData?.seriesName || 'Series A NCD'} (${selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})`,
          entityType: 'Compliance',
          entityId: seriesData?.seriesName || 'Series A NCD',
          changes: {
            complianceItem: updatedItem.title,
            section: updatedItem.section,
            previousStatus: 'PENDING',
            newStatus: 'RECEIVED',
            seriesName: seriesData?.seriesName || 'Series A NCD',
            trusteeCompany: seriesData?.trusteeCompany || 'SBICAP Trustee Co. Ltd.',
            historicalDate: selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
            itemId: itemId
          }
        });
      }
      
      // Update compliance status in DataContext for historical data
      updateComplianceStatusInContextHistorical(updated);
      
      return updated;
    });
  };

  const handleExportSubmit = async () => {
    try {
      // Get selected sections
      const selectedSections = Object.keys(exportSections)
        .filter(key => exportSections[key])
        .map(key => {
          if (key === 'preCompliance') return 'pre';
          if (key === 'postCompliance') return 'post';
          if (key === 'recurringCompliances') return 'recurring';
          if (key === 'statistics') return 'statistics';
          return key;
        });
      
      const seriesName = seriesData?.seriesName || 'Series A NCD';
      
      if (import.meta.env.DEV) {
        // Log removed
      }
      
      // Load ALL compliance data for all sections (not just current tab)
      const allComplianceData = {
        pre: [],
        post: [],
        recurring: []
      };
      
      try {
        // Load all compliance data in one call
        const allResponse = await apiService.getSeriesCompliance(seriesData.seriesId, null, null);
        
        // Filter by section
        allComplianceData.pre = allResponse.items.filter(item => item.section === 'pre').map(item => ({
          id: item.item_id,
          title: item.title,
          completed: item.status === 'received' || item.status === 'submitted'
        }));
        
        allComplianceData.post = allResponse.items.filter(item => item.section === 'post').map(item => ({
          id: item.item_id,
          title: item.title,
          completed: item.status === 'received' || item.status === 'submitted'
        }));
        
        allComplianceData.recurring = allResponse.items.filter(item => item.section === 'recurring').map(item => ({
          id: item.item_id,
          title: item.title,
          completed: item.status === 'received' || item.status === 'submitted'
        }));
      } catch (error) {
      }
      
      if (exportFormat === 'pdf') {
        try {
          // Helper function to convert 0-255 RGB to 0-1 range for pdf-lib
          const rgbNormalized = (r, g, b) => rgb(r / 255, g / 255, b / 255);
          
          // Load the template PDF
          const templateResponse = await fetch('/reports.pdf');
          const templateArrayBuffer = await templateResponse.arrayBuffer();
          const pdfDoc = await PDFDocument.load(templateArrayBuffer);
          
          // Get the first page to use as template
          const pages = pdfDoc.getPages();
          const firstPage = pages[0];
          const { width, height } = firstPage.getSize();
          
          // Add new pages for compliance content
          let currentPage = firstPage;
          let yPosition = height - 180; // Start lower to avoid template header
          const bottomMargin = 100; // Reserve space for footer
          
          // Add title
          currentPage.drawText('COMPLIANCE REPORT', {
            x: 50,
            y: yPosition,
            size: 20,
            color: rgbNormalized(40, 40, 40),
          });
          yPosition -= 35;
          
          // Add series info
          currentPage.drawText(`Series: ${seriesName}`, {
            x: 50,
            y: yPosition,
            size: 11,
            color: rgbNormalized(100, 100, 100),
          });
          yPosition -= 18;
          
          currentPage.drawText(`Generated: ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString('en-GB')}`, {
            x: 50,
            y: yPosition,
            size: 9,
            color: rgbNormalized(120, 120, 120),
          });
          yPosition -= 25;
          
          // Statistics section
          if (selectedSections.includes('statistics')) {
            currentPage.drawText('Compliance Summary', {
              x: 50,
              y: yPosition,
              size: 13,
              color: rgbNormalized(40, 40, 40),
            });
            yPosition -= 18;
            
            const prePercentage = allComplianceData.pre.length > 0 ? Math.round((allComplianceData.pre.filter(i => i.completed).length / allComplianceData.pre.length) * 100) : 0;
            const postPercentage = allComplianceData.post.length > 0 ? Math.round((allComplianceData.post.filter(i => i.completed).length / allComplianceData.post.length) * 100) : 0;
            const recurringPercentage = allComplianceData.recurring.length > 0 ? Math.round((allComplianceData.recurring.filter(i => i.completed).length / allComplianceData.recurring.length) * 100) : 0;
            
            const statsText = [
              `Pre-Compliance: ${prePercentage}%`,
              `Post-Compliance: ${postPercentage}%`,
              `Recurring Compliance: ${recurringPercentage}%`
            ];
            
            statsText.forEach(text => {
              currentPage.drawText(text, {
                x: 50,
                y: yPosition,
                size: 9,
                color: rgbNormalized(60, 60, 60),
              });
              yPosition -= 12;
            });
            yPosition -= 12;
          }
          
          // Pre-Compliance section
          if (selectedSections.includes('pre') && allComplianceData.pre.length > 0) {
            if (yPosition < bottomMargin) {
              currentPage = pdfDoc.addPage([width, height]);
              yPosition = height - 50;
            }
            
            currentPage.drawText('Pre-Compliance Documents', {
              x: 50,
              y: yPosition,
              size: 11,
              color: rgbNormalized(40, 40, 40),
            });
            yPosition -= 18;
            
            allComplianceData.pre.forEach((item, index) => {
              if (yPosition < bottomMargin) {
                currentPage = pdfDoc.addPage([width, height]);
                yPosition = height - 50;
              }
              
              const statusColor = item.completed ? rgbNormalized(22, 163, 74) : rgbNormalized(180, 83, 9);
              currentPage.drawText(`${index + 1}. ${item.title}`, {
                x: 50,
                y: yPosition,
                size: 9,
                color: statusColor,
              });
              yPosition -= 12;
            });
            yPosition -= 12;
          }
          
          // Post-Compliance section
          if (selectedSections.includes('post') && allComplianceData.post.length > 0) {
            if (yPosition < bottomMargin) {
              currentPage = pdfDoc.addPage([width, height]);
              yPosition = height - 50;
            }
            
            currentPage.drawText('Post-Compliance Documents', {
              x: 50,
              y: yPosition,
              size: 11,
              color: rgbNormalized(40, 40, 40),
            });
            yPosition -= 18;
            
            allComplianceData.post.forEach((item, index) => {
              if (yPosition < bottomMargin) {
                currentPage = pdfDoc.addPage([width, height]);
                yPosition = height - 50;
              }
              
              const statusColor = item.completed ? rgbNormalized(22, 163, 74) : rgbNormalized(180, 83, 9);
              currentPage.drawText(`${index + 1}. ${item.title}`, {
                x: 50,
                y: yPosition,
                size: 9,
                color: statusColor,
              });
              yPosition -= 12;
            });
            yPosition -= 12;
          }
          
          // Recurring Compliance section
          if (selectedSections.includes('recurring') && allComplianceData.recurring.length > 0) {
            if (yPosition < bottomMargin) {
              currentPage = pdfDoc.addPage([width, height]);
              yPosition = height - 50;
            }
            
            currentPage.drawText('Recurring Compliances', {
              x: 50,
              y: yPosition,
              size: 11,
              color: rgbNormalized(40, 40, 40),
            });
            yPosition -= 18;
            
            allComplianceData.recurring.forEach((item, index) => {
              if (yPosition < bottomMargin) {
                currentPage = pdfDoc.addPage([width, height]);
                yPosition = height - 50;
              }
              
              const statusColor = item.completed ? rgbNormalized(22, 163, 74) : rgbNormalized(180, 83, 9);
              currentPage.drawText(`${index + 1}. ${item.title}`, {
                x: 50,
                y: yPosition,
                size: 9,
                color: statusColor,
              });
              yPosition -= 12;
            });
          }
          
          // Save the PDF
          const pdfBytes = await pdfDoc.save();
          const blob = new Blob([pdfBytes], { type: 'application/pdf' });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          const fileName = `Compliance_Report_${seriesName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(link);
        } catch (error) {
          throw error;
        }
      } else if (exportFormat === 'excel') {
        toast.info('Excel export coming soon', 'Feature Coming Soon');
        return;
      }
      
      // Add audit log for compliance report export
      auditService.logComplianceReportExported(user, {
        seriesId: seriesData.seriesId,
        seriesName: seriesName,
        format: exportFormat,
        sections: selectedSections,
        recordCount: selectedSections.reduce((sum, section) => {
          if (section === 'pre') return sum + allComplianceData.pre.length;
          if (section === 'post') return sum + allComplianceData.post.length;
          if (section === 'recurring') return sum + allComplianceData.recurring.length;
          return sum;
        }, 0)
      }).catch(error => {
      });
      
      toast.success(`${exportFormat.toUpperCase()} report exported successfully!`, 'Export Complete');
      setShowExportModal(false);
    } catch (error) {
      toast.error('Failed to export compliance report. Please try again.', 'Export Failed');
    }
  };

  const handleTimeSheetExport = async () => {
    try {

      // Helper function to convert 0-255 RGB to 0-1 range for pdf-lib
      const rgbNormalized = (r, g, b) => rgb(r / 255, g / 255, b / 255);

      // Load the template PDF
      const templateResponse = await fetch('/reports.pdf');
      const templateArrayBuffer = await templateResponse.arrayBuffer();
      const pdfDoc = await PDFDocument.load(templateArrayBuffer);

      // Get the first page to use as template
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width, height } = firstPage.getSize();

      // Add new pages for timesheet content
      let currentPage = firstPage;
      let yPosition = height - 180; // Start lower to avoid template header
      const bottomMargin = 100; // Reserve space for footer

      // Add title
      currentPage.drawText('COMPLIANCE TIMESHEET', {
        x: 50,
        y: yPosition,
        size: 20,
        color: rgbNormalized(40, 40, 40),
      });
      yPosition -= 35;

      // Add series and year info
      const seriesName = seriesData?.seriesName || 'Series A NCD';
      currentPage.drawText(`Series: ${seriesName}`, {
        x: 50,
        y: yPosition,
        size: 11,
        color: rgbNormalized(100, 100, 100),
      });
      yPosition -= 18;

      currentPage.drawText(`Year: ${selectedYear}`, {
        x: 50,
        y: yPosition,
        size: 11,
        color: rgbNormalized(100, 100, 100),
      });
      yPosition -= 18;

      currentPage.drawText(`Generated: ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString('en-GB')}`, {
        x: 50,
        y: yPosition,
        size: 9,
        color: rgbNormalized(120, 120, 120),
      });
      yPosition -= 25;

      // Get the current section's items - filter by activeTab section
      const sectionMap = {
        'pre': 'pre',
        'post': 'post',
        'recurring': 'recurring'
      };
      const currentSection = sectionMap[activeTab] || 'post';
      const sectionItems = complianceItems.filter(item => item.section === currentSection);
      const months = getValidMonths();

      if (sectionItems.length > 0) {
        // Add section title
        currentPage.drawText(`${getSectionTitle(activeTab)} - ${selectedYear}`, {
          x: 50,
          y: yPosition,
          size: 13,
          color: rgbNormalized(40, 40, 40),
        });
        yPosition -= 25;

        // Table format with proper borders and layout
        const tableStartY = yPosition;
        const leftMargin = 50;
        const tableWidth = width - 100;
        const itemColWidth = 180; // Item name column
        const monthColWidth = (tableWidth - itemColWidth) / 12; // Divide remaining space by 12 months
        
        // Draw table header background
        const headerHeight = 15;
        currentPage.drawRectangle({
          x: leftMargin,
          y: yPosition - headerHeight,
          width: tableWidth,
          height: headerHeight,
          borderColor: rgbNormalized(200, 200, 200),
          borderWidth: 0.5,
          color: rgbNormalized(240, 240, 240),
        });

        // Header - Item column
        currentPage.drawText('Item', {
          x: leftMargin + 5,
          y: yPosition - 12,
          size: 9,
          color: rgbNormalized(40, 40, 40),
        });

        // Header - Month columns with full names
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        monthNames.forEach((monthName, idx) => {
          const monthX = leftMargin + itemColWidth + (idx * monthColWidth);
          currentPage.drawText(monthName.substring(0, 3), {
            x: monthX + (monthColWidth / 2) - 5,
            y: yPosition - 12,
            size: 8,
            color: rgbNormalized(40, 40, 40),
          });
        });
        yPosition -= headerHeight + 5;

        // Add items with month status
        sectionItems.forEach((item, itemIndex) => {
          const rowHeight = 12;
          
          if (yPosition - rowHeight < bottomMargin) {
            currentPage = pdfDoc.addPage([width, height]);
            yPosition = height - 50;
          }

          // Draw row border
          currentPage.drawRectangle({
            x: leftMargin,
            y: yPosition - rowHeight,
            width: tableWidth,
            height: rowHeight,
            borderColor: rgbNormalized(220, 220, 220),
            borderWidth: 0.5,
          });

          // Item name - truncate to fit
          const itemTitle = item.title.length > 40 ? item.title.substring(0, 37) + '...' : item.title;
          currentPage.drawText(itemTitle, {
            x: leftMargin + 5,
            y: yPosition - 10,
            size: 7,
            color: rgbNormalized(60, 60, 60),
          });

          // Month status indicators
          months.forEach((month, monthIdx) => {
            const isCompleted = getTimeSheetValue(itemIndex + 1, month, activeTab);
            const statusColor = isCompleted ? rgbNormalized(22, 163, 74) : rgbNormalized(180, 83, 9);
            const monthX = leftMargin + itemColWidth + (monthIdx * monthColWidth);
            
            // Draw vertical separator
            currentPage.drawLine({
              start: { x: monthX, y: yPosition },
              end: { x: monthX, y: yPosition - rowHeight },
              color: rgbNormalized(220, 220, 220),
              thickness: 0.5,
            });
            
            currentPage.drawText(isCompleted ? 'Y' : 'N', {
              x: monthX + (monthColWidth / 2) - 3,
              y: yPosition - 10,
              size: 8,
              color: statusColor,
            });
          });

          // Draw right border for December column
          const decemberRightX = leftMargin + itemColWidth + (12 * monthColWidth);
          currentPage.drawLine({
            start: { x: decemberRightX, y: yPosition },
            end: { x: decemberRightX, y: yPosition - rowHeight },
            color: rgbNormalized(220, 220, 220),
            thickness: 0.5,
          });

          yPosition -= rowHeight;
        });

        // Draw final bottom border
        currentPage.drawLine({
          start: { x: leftMargin, y: yPosition },
          end: { x: leftMargin + tableWidth, y: yPosition },
          color: rgbNormalized(200, 200, 200),
          thickness: 1,
        });
      } else {
        // No items message
        currentPage.drawText('No items to display for this section.', {
          x: 50,
          y: yPosition,
          size: 10,
          color: rgbNormalized(150, 150, 150),
        });
      }

      // Save the PDF
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const fileName = `TimeSheet_${seriesName.replace(/\s+/g, '_')}_${selectedYear}_${new Date().toISOString().split('T')[0]}.pdf`;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      // Log the export
      auditService.logComplianceTimeSheetExported(user, {
        seriesId: seriesData.seriesId,
        seriesName: seriesName,
        year: selectedYear,
        format: 'pdf',
        recordCount: sectionItems.length
      }).catch(error => {
      });

      toast.success('TimeSheet exported successfully!', 'Export Complete');
      setShowTimeSheetModal(false);
    } catch (error) {
      toast.error('Failed to export timesheet. Please try again.', 'Export Failed');
    }
  };

const handleDocumentSubmit = async (e) => {
    e.preventDefault();
    if (!documentForm.title || !documentForm.file) {
      toast.warning('Please fill in all required fields and select a file.', 'Missing Information');
      return;
    }

    try {
      // Show upload animation
      setShowUploadAnimation(true);
      
      // Upload document to S3 via backend API
      const result = await apiService.uploadComplianceDocument(
        seriesData?.seriesId,
        documentForm.title,
        documentForm.category,
        documentForm.description,
        documentForm.file
      );
      
      // Add audit log for compliance document upload
      auditService.logComplianceDocumentAdded({
        seriesId: seriesData?.seriesId,
        seriesName: seriesData?.seriesName,
        documentTitle: documentForm.title,
        category: documentForm.category,
        fileName: documentForm.file.name,
        fileSize: documentForm.file.size
      }, user).catch(error => {
      });
      
      toast.success(`Document "${documentForm.title}" uploaded successfully!`, 'Document Uploaded');
      
      // Reset form
      setDocumentForm({
        title: '',
        category: 'pre-compliance',
        file: null,
        description: '',
        legalReference: ''
      });
      
      // Close animation after 1 second, then close modal
      setTimeout(() => {
        setShowUploadAnimation(false);
        setShowAddDocumentModal(false);
      }, 1000);
      
    } catch (error) {
      // Hide animation on error
      setShowUploadAnimation(false);
      toast.error(error.message || 'Failed to upload document', 'Upload Error');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setDocumentForm({ ...documentForm, file });
  };

  const handleSeriesClick = () => {
    // Map compliance series names to actual series IDs that SeriesDetails expects
    const seriesNameToIdMap = {
      'Series A NCD': '1',
      'Series B NCD': '2', 
      'Series C NCD': '3',
      'Series D NCD': '4',
      'Series E NCD': '1', // Map to existing series for demo
      'Series F NCD': '2',
      'Series G NCD': '3',
      'Series H NCD': '4',
      'Series I NCD': '1',
      'Series J NCD': '2',
      'Series K NCD': '3',
      'Series L NCD': '4',
      'Series M NCD': '1'
    };
    
    // Get the series ID from the mapping, default to '1' if not found
    const seriesName = seriesData?.seriesName || 'Series A NCD';
    const seriesId = seriesNameToIdMap[seriesName] || '1';
    
    navigate(`/ncd-series/${seriesId}`);
    onClose(); // Close the compliance tracker
  };

  // Show loading state
  if (loading) {
    return (
      <div className="compliance-tracker-overlay">
        <div className="compliance-tracker">
          <div style={{padding: '40px', textAlign: 'center'}}>
            <p>Loading compliance data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="compliance-tracker-overlay">
      <div className="compliance-tracker">
        {/* Navigation Header */}
        <nav className="compliance-nav">
          <div className="nav-left">
            <div className="nav-icon-blue">
              <MdSecurity size={18} />
            </div>
          </div>
          <div className="nav-center">
            <button className="series-name-box" onClick={handleSeriesClick}>
              <span className="series-name-text">{seriesData?.seriesName || 'Series A NCD'}</span>
            </button>
            <span className="nav-separator">|</span>
            <span className="nav-text-dark">{seriesData?.trusteeCompany || 'SBICAP Trustee Co. Ltd.'}</span>
          </div>
          <button className="close-tracker" onClick={onClose}>
            <HiOutlineX size={18} />
          </button>
        </nav>

        {/* Main Content */}
        <div className="tracker-content">
          {/* Hero Section */}
          <div className="hero-section">
            <div className="hero-left">
              <h1>Compliance Checklist</h1>
              <p>Secured Unlisted Debenture/Bond Issue Tracking</p>
            </div>
            <div className="hero-actions">
              <button className="btn-timesheet" onClick={() => setShowTimeSheetModal(true)}>
                <HiOutlineDocumentText size={16} />
                Time Sheet
              </button>
              <button className="btn-outlined" onClick={handleExportReport}>
                <HiOutlineDownload size={16} />
                Export Report
              </button>
              <button className="btn-solid" onClick={handleAddDocument}>
                <HiOutlinePlus size={16} />
                Add Document
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="stats-section">
            <div className="stat-card">
              <div className="stat-label">Total Requirements</div>
              <div className="stat-number">{complianceItems.length}</div>
            </div>
            <div className="stat-card with-green-border">
              <div className="stat-label">Received / Completed</div>
              <div className="stat-number green">{complianceItems.filter(item => item.completed).length}</div>
            </div>
            <div className="stat-card with-yellow-border">
              <div className="stat-label">Pending Actions</div>
              <div className="stat-number yellow">{complianceItems.filter(item => !item.completed).length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Not Applicable</div>
              <div className="stat-number gray">0</div>
            </div>
          </div>

          {/* Phase Section with integrated buttons */}
          <div className="phase-section">
            <div className="compliance-table">
              <div className="table-header-with-buttons">
                {/* Phase Buttons integrated with table */}
                <div className="phase-buttons-row">
                  <button 
                    className={`phase-button ${activeTab === 'pre' ? 'active' : ''}`}
                    onClick={() => setActiveTab('pre')}
                  >
                    <span className="phase-number blue">1</span>
                    <span className="phase-title">Pre-Compliance Phase</span>
                  </button>
                  <button 
                    className={`phase-button ${activeTab === 'post' ? 'active' : ''}`}
                    onClick={() => setActiveTab('post')}
                  >
                    <span className="phase-number orange">2</span>
                    <span className="phase-title">Post-Compliance Phase</span>
                  </button>
                  <button 
                    className={`phase-button ${activeTab === 'recurring' ? 'active' : ''}`}
                    onClick={() => setActiveTab('recurring')}
                  >
                    <span className="phase-number purple">3</span>
                    <span className="phase-title">Recurring Compliances</span>
                  </button>
                </div>
                
                {/* Date Navigation Section - Only show for recurring tab */}
                {activeTab === 'recurring' && (
                  <div className="date-navigation-section-center">
                    <button 
                      className="date-picker-button"
                      onClick={() => setShowDatePicker(!showDatePicker)}
                    >
                      <MdDateRange size={16} />
                      {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </button>
                    
                    {showDatePicker && (
                      <div className="date-picker-dropdown">
                        <input
                          type="month"
                          value={`${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`}
                          min={seriesData?.issueDate ? `${new Date(seriesData.issueDate).getFullYear()}-${String(new Date(seriesData.issueDate).getMonth() + 1).padStart(2, '0')}` : '2026-01'}
                          max={seriesData?.maturityDate ? `${new Date(seriesData.maturityDate).getFullYear()}-${String(new Date(seriesData.maturityDate).getMonth() + 1).padStart(2, '0')}` : `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`}
                          onChange={(e) => {
                            const [year, month] = e.target.value.split('-');
                            const selectedDateValue = new Date(parseInt(year), parseInt(month) - 1, 1);
                            const issueDate = seriesData?.issueDate ? new Date(seriesData.issueDate) : new Date('2026-01-15');
                            const maturityDate = seriesData?.maturityDate ? new Date(seriesData.maturityDate) : new Date();
                            
                            // Allow dates from issue date to maturity date
                            if (selectedDateValue >= issueDate && selectedDateValue <= maturityDate) {
                              setSelectedDate(selectedDateValue);
                            }
                            setShowDatePicker(false);
                          }}
                          className="month-picker-input"
                        />
                      </div>
                    )}
                  </div>
                )}
                
                {/* Table Header */}
                <div className="table-header">
                  <div className="header-cell">Document / Compliance Requirement</div>
                  <div className="header-cell">Legal Reference</div>
                  <div className="header-cell">Status</div>
                </div>
              </div>
              
              <div className="compliance-table-content">
                {getDisplayedComplianceItems().filter(item => item.section === activeTab).map((item, index) => (
                  <div key={item.id} className="table-row">
                    <div className="table-cell">
                      <div className="document-cell">
                        <span className="document-number">{index + 1}.</span>
                        <input
                          type="checkbox"
                          id={`item-${item.id}`}
                          checked={item.checked}
                          onChange={() => {
                            const currentDate = new Date();
                            const isCurrentMonth = selectedDate.getMonth() === currentDate.getMonth() && 
                                                 selectedDate.getFullYear() === currentDate.getFullYear();
                            
                            if (isCurrentMonth) {
                              handleItemToggle(item.id);
                            } else {
                              handleHistoricalItemToggle(item.id);
                            }
                          }}
                          className="compliance-checkbox"
                          disabled={item.completed}
                        />
                        <label htmlFor={`item-${item.id}`} className="document-text">
                          {item.title}
                        </label>
                      </div>
                    </div>
                    <div className="table-cell legal-ref">
                      {item.frequency ? (
                        <div className="frequency-info">
                          <span className="frequency-badge">{item.frequency}</span>
                          <span className="frequency-note">On each interest payment date</span>
                        </div>
                      ) : (
                        'Internal Protocol'
                      )}
                    </div>
                    <div className="table-cell">
                      <div className="status-actions">
                        <span className={`status-badge ${item.completed ? 'received' : 'pending'}`}>
                          {item.completed ? 'RECEIVED' : 'PENDING'}
                        </span>
                        {!item.completed && item.checked && (
                          <span 
                            className="submit-text"
                            onClick={() => {
                              const currentDate = new Date();
                              const isCurrentMonth = selectedDate.getMonth() === currentDate.getMonth() && 
                                                   selectedDate.getFullYear() === currentDate.getFullYear();
                              
                              if (isCurrentMonth) {
                                handleItemSubmit(item.id);
                              } else {
                                handleHistoricalItemSubmit(item.id);
                              }
                            }}
                          >
                            Submit
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Export Report Modal */}
        {showExportModal && (
          <div className="modal-overlay">
            <div className="modal-content export-modal">
              <div className="modal-header">
                <h3>Export Compliance Report</h3>
                <button className="modal-close" onClick={() => setShowExportModal(false)}>
                  <HiOutlineX size={20} />
                </button>
              </div>
              
              <div className="modal-body">
                <div className="form-group">
                  <label>Export Format</label>
                  <select 
                    value={exportFormat} 
                    onChange={(e) => setExportFormat(e.target.value)}
                    className="form-select"
                  >
                    <option value="pdf">PDF Document</option>
                    <option value="excel">Excel Spreadsheet</option>
                    <option value="word">Word Document</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Include Sections</label>
                  <table className="export-sections-table">
                    <tbody>
                      <tr>
                        <td>
                          <input
                            type="checkbox"
                            checked={exportSections.statistics}
                            onChange={(e) => setExportSections({...exportSections, statistics: e.target.checked})}
                          />
                        </td>
                        <td>Statistics Summary</td>
                      </tr>
                      <tr>
                        <td>
                          <input
                            type="checkbox"
                            checked={exportSections.preCompliance}
                            onChange={(e) => setExportSections({...exportSections, preCompliance: e.target.checked})}
                          />
                        </td>
                        <td>Pre-Compliance Phase</td>
                      </tr>
                      <tr>
                        <td>
                          <input
                            type="checkbox"
                            checked={exportSections.postCompliance}
                            onChange={(e) => setExportSections({...exportSections, postCompliance: e.target.checked})}
                          />
                        </td>
                        <td>Post-Compliance Phase</td>
                      </tr>
                      <tr>
                        <td>
                          <input
                            type="checkbox"
                            checked={exportSections.recurringCompliances}
                            onChange={(e) => setExportSections({...exportSections, recurringCompliances: e.target.checked})}
                          />
                        </td>
                        <td>Recurring Compliances</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="export-info">
                  <HiOutlineDocumentText size={16} />
                  <span>Report will be generated for {seriesData?.seriesName || 'Series A NCD'}</span>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setShowExportModal(false)}>
                  Cancel
                </button>
                <button className="btn-primary" onClick={handleExportSubmit}>
                  <HiOutlineDownload size={16} />
                  Export Report
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Document Modal */}
        {showAddDocumentModal && (
          <div className="modal-overlay">
            <div className="modal-content add-document-modal">
              <div className="modal-header">
                <h3>Add Compliance Document</h3>
                <button className="modal-close" onClick={() => setShowAddDocumentModal(false)}>
                  <HiOutlineX size={20} />
                </button>
              </div>
              
              <form onSubmit={handleDocumentSubmit} className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Document Title *</label>
                    <input
                      type="text"
                      value={documentForm.title}
                      onChange={(e) => setDocumentForm({...documentForm, title: e.target.value})}
                      placeholder="Enter document title"
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Category *</label>
                    <select 
                      value={documentForm.category} 
                      onChange={(e) => setDocumentForm({...documentForm, category: e.target.value})}
                      className="form-select"
                      required
                    >
                      <option value="pre-compliance">Pre-Compliance</option>
                      <option value="post-compliance">Post-Compliance</option>
                      <option value="recurring">Recurring Compliance</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Legal Reference</label>
                  <input
                    type="text"
                    value={documentForm.legalReference}
                    onChange={(e) => setDocumentForm({...documentForm, legalReference: e.target.value})}
                    placeholder="e.g., Companies Act 2013, Section 42"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={documentForm.description}
                    onChange={(e) => setDocumentForm({...documentForm, description: e.target.value})}
                    placeholder="Brief description of the document"
                    className="form-textarea"
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label>Upload Document *</label>
                  <div 
                    className="file-upload-area"
                    onClick={() => document.getElementById('document-file').click()}
                  >
                    <input
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      className="file-input"
                      id="document-file"
                      required
                      style={{ display: 'none' }}
                    />
                    <div className="file-upload-label">
                      <HiOutlineUpload size={24} />
                      <span>
                        {documentForm.file ? documentForm.file.name : 'Click to upload or drag and drop'}
                      </span>
                      <small>PDF, DOC, DOCX, JPG, PNG (Max 10MB)</small>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn-cancel" onClick={() => setShowAddDocumentModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    <HiOutlinePlus size={16} />
                    Add Document
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Upload Animation Overlay */}
        {showUploadAnimation && (
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
                  animationData={documentDownloadAnimation}
                  loop={false}
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
                  Uploading Document...
                </h2>
                <p style={{
                  fontSize: '16px',
                  fontWeight: 400,
                  color: '#64748b',
                  margin: 0
                }}>
                  Please wait while we upload your document
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Time Sheet Modal */}
        {showTimeSheetModal && (
          <div className="modal-overlay">
            <div className="modal-content timesheet-modal">
              <div className="modal-header">
                <h3>{getSectionTitle(activeTab)} Time Sheet - {selectedYear}</h3>
                <button className="modal-close" onClick={() => setShowTimeSheetModal(false)}>
                  <HiOutlineX size={20} />
                </button>
              </div>
              
              <div className="modal-body">
                {/* Year Picker */}
                <div className="year-picker-section">
                  <label>Select Year:</label>
                  <select 
                    value={selectedYear} 
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="year-select"
                  >
                    {getValidYears().map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                {/* Time Sheet Table */}
                <div className="timesheet-table-container">
                  <table className="timesheet-table">
                    <thead>
                      <tr>
                        <th className="sno-header">S.No</th>
                        {getValidMonths().map(month => (
                          <th key={month} className="month-header">{month.substring(0, 3)}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {getComplianceBySection(activeTab).map((doc, index) => (
                        <tr key={doc.id}>
                          <td className="sno-cell">{index + 1}</td>
                          {getValidMonths().map(month => (
                            <td key={month} className="month-cell">
                              <div className={`status-indicator ${getTimeSheetValue(index + 1, month, activeTab) ? 'completed' : 'pending'}`}>
                                {getTimeSheetValue(index + 1, month, activeTab) ? 'âœ“' : 'â€”'}
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Document Reference */}
                <div className="document-reference">
                  <h4>Document Reference - {getSectionTitle(activeTab)}:</h4>
                  <div className="reference-list">
                    {getComplianceBySection(activeTab).map((doc, index) => (
                      <div key={doc.id} className="reference-item">
                        <span className="ref-number">{index + 1}.</span>
                        <span className="ref-title">{doc.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setShowTimeSheetModal(false)}>
                  Close
                </button>
                <button className="btn-primary" onClick={handleTimeSheetExport}>
                  <HiOutlineDownload size={16} />
                  Export Time Sheet
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplianceTracker;
