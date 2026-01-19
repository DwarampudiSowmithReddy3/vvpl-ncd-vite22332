import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
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
  
  // State for modals
  const [showExportModal, setShowExportModal] = useState(false);
  const [showAddDocumentModal, setShowAddDocumentModal] = useState(false);
  const [showTimeSheetModal, setShowTimeSheetModal] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
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
    { id: 30, section: 'post', title: 'E-form PAS-3 (Return of Allotment) under Companies (Prospectus and Allotment of Securities) Rules, 2014', completed: true, checked: true },
    { id: 31, section: 'post', title: 'CERSAI registration on charged assets (within 30 days after execution of Security documents)', completed: false, checked: false },
    { id: 32, section: 'post', title: 'List of allottees / Debenture holders (Benpos)', completed: true, checked: true },
    { id: 33, section: 'post', title: 'Credit corporate action (NSDL & CDSL)', completed: false, checked: false },
    { id: 34, section: 'post', title: 'Copy of allotment letters / Resolution', completed: true, checked: true },
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

  const handleItemSubmit = (itemId) => {
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
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth(); // 0-based (0 = January)
    const monthIndex = months.indexOf(month);
    
    // Get the actual compliance items for the section
    const sectionItems = getComplianceBySection(section);
    const docItem = sectionItems[docIndex - 1]; // docIndex is 1-based
    
    if (!docItem) return false;
    
    // For current year and current month, use actual completion status from current state
    if (selectedYear === currentYear && monthIndex === currentMonth) {
      // Check if this item has been updated in the current session
      const currentItem = complianceItems.find(item => item.id === docItem.id);
      return currentItem ? currentItem.completed : docItem.completed;
    }
    
    // Check historical data for other months
    const dateKey = `${selectedYear}-${monthIndex}`;
    const itemKey = `${dateKey}-${docItem.id}`;
    
    if (historicalComplianceData[itemKey]) {
      return historicalComplianceData[itemKey].completed;
    }
    
    // For past years, show mostly completed data (fallback)
    if (selectedYear < currentYear) {
      const completionPatterns = {
        pre: {
          1: [true, true, true, true, true, true, true, true, true, true, true, true],
          2: [true, true, true, true, true, true, true, true, true, true, true, false],
          3: [true, true, true, true, true, true, true, true, true, true, false, false],
          4: [true, true, true, true, true, true, true, true, true, false, false, false],
          5: [true, true, true, true, true, true, true, true, false, false, false, false]
        },
        post: {
          1: [true, true, true, true, true, true, true, true, true, true, true, true],
          2: [true, true, true, true, true, true, true, true, true, true, false, false],
          3: [true, true, true, true, true, true, true, true, false, false, false, false],
          4: [true, true, true, true, true, true, false, false, false, false, false, false],
          5: [true, true, true, true, false, false, false, false, false, false, false, false]
        },
        recurring: {
          1: [true, true, true, true, true, true, true, true, true, true, true, true],
          2: [true, true, true, true, true, true, true, true, true, true, true, false],
          3: [true, true, true, true, true, true, true, true, true, true, false, false],
          4: [true, true, true, true, true, true, true, true, true, false, false, false],
          5: [true, true, true, true, true, true, true, true, false, false, false, false]
        }
      };
      return completionPatterns[section]?.[docIndex]?.[monthIndex] || false;
    }
    
    // For current year past months, show some completion based on current status
    if (selectedYear === currentYear && monthIndex < currentMonth) {
      const currentItem = complianceItems.find(item => item.id === docItem.id);
      if (currentItem && currentItem.completed) {
        return monthIndex >= currentMonth - 2; // Completed in last 2 months
      }
      return false;
    }
    
    // For future months/years, all pending
    return false;
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

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

  const handleExportSubmit = () => {
    // Simulate export process
    const selectedSections = Object.keys(exportSections).filter(key => exportSections[key]);
    const seriesName = seriesData?.seriesName || 'Series A NCD';
    console.log(`Exporting ${exportFormat.toUpperCase()} report for ${seriesName}`);
    console.log('Selected sections:', selectedSections);
    
    // In real implementation, this would trigger actual export
    alert(`Exporting ${exportFormat.toUpperCase()} report for ${seriesName}...`);
    setShowExportModal(false);
  };

  const handleDocumentSubmit = (e) => {
    e.preventDefault();
    if (!documentForm.title || !documentForm.file) {
      alert('Please fill in all required fields and select a file.');
      return;
    }

    // Simulate document upload
    console.log('Uploading document:', documentForm);
    alert(`Document "${documentForm.title}" uploaded successfully!`);
    
    // Reset form
    setDocumentForm({
      title: '',
      category: 'pre-compliance',
      file: null,
      description: '',
      legalReference: ''
    });
    setShowAddDocumentModal(false);
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
                
                {/* Date Navigation Section - Moved to separate row */}
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
                        max={`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`}
                        onChange={(e) => {
                          const [year, month] = e.target.value.split('-');
                          const selectedDateValue = new Date(parseInt(year), parseInt(month) - 1, 1);
                          const currentDate = new Date();
                          
                          // Only allow past and current dates
                          if (selectedDateValue <= currentDate) {
                            setSelectedDate(selectedDateValue);
                          }
                          setShowDatePicker(false);
                        }}
                        className="month-picker-input"
                      />
                    </div>
                  )}
                </div>
                
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
                  <div className="checkbox-group">
                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={exportSections.statistics}
                        onChange={(e) => setExportSections({...exportSections, statistics: e.target.checked})}
                      />
                      <span>Statistics Summary</span>
                    </label>
                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={exportSections.preCompliance}
                        onChange={(e) => setExportSections({...exportSections, preCompliance: e.target.checked})}
                      />
                      <span>Pre-Compliance Phase</span>
                    </label>
                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={exportSections.postCompliance}
                        onChange={(e) => setExportSections({...exportSections, postCompliance: e.target.checked})}
                      />
                      <span>Post-Compliance Phase</span>
                    </label>
                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={exportSections.recurringCompliances}
                        onChange={(e) => setExportSections({...exportSections, recurringCompliances: e.target.checked})}
                      />
                      <span>Recurring Compliances</span>
                    </label>
                  </div>
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
                  <div className="file-upload-area">
                    <input
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      className="file-input"
                      id="document-file"
                      required
                    />
                    <label htmlFor="document-file" className="file-upload-label">
                      <HiOutlineUpload size={24} />
                      <span>
                        {documentForm.file ? documentForm.file.name : 'Click to upload or drag and drop'}
                      </span>
                      <small>PDF, DOC, DOCX, JPG, PNG (Max 10MB)</small>
                    </label>
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
                    {Array.from({length: 10}, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
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
                        {months.map(month => (
                          <th key={month} className="month-header">{month.substring(0, 3)}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {getComplianceBySection(activeTab).map((doc, index) => (
                        <tr key={doc.id}>
                          <td className="sno-cell">{index + 1}</td>
                          {months.map(month => (
                            <td key={month} className="month-cell">
                              <div className={`status-indicator ${getTimeSheetValue(index + 1, month, activeTab) ? 'completed' : 'pending'}`}>
                                {getTimeSheetValue(index + 1, month, activeTab) ? '✓' : '—'}
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
                <button className="btn-primary">
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