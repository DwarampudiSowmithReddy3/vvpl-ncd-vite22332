import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useToast } from '../components/Toast';
import apiService from '../services/api';
import auditService from '../services/auditService';
import Layout from '../components/Layout';
import './InvestorDetails.css';
import '../styles/loading.css';
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
import { MdAccountBalance, MdReportProblem, MdEdit, MdDelete, MdInfo, MdAdd } from 'react-icons/md';
import { FiUpload } from 'react-icons/fi';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const InvestorDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const { loadAuditLogs } = useData();
  const toast = useToast();
  
  // State for investor data from backend
  const [investor, setInvestor] = useState(null);
  const [series, setSeries] = useState([]);
  const [investorGrievances, setInvestorGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [confirmAction, setConfirmAction] = useState(null); // 'delete' or 'deactivate'
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [selectedSeriesDocuments, setSelectedSeriesDocuments] = useState([]);
  const [showPartialExitInfo, setShowPartialExitInfo] = useState(false); // For collapsible info tooltip
  const tooltipRef = useRef(null); // Ref for click-outside detection
  
  // Exit Series Confirmation Modal State
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);
  const [exitSeriesData, setExitSeriesData] = useState(null);

  // Load investor data from backend
  useEffect(() => {
    loadInvestorData();
    loadSeriesData();
    loadInvestorGrievances();
  }, [id]);

  const loadInvestorData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (import.meta.env.DEV) { console.log('🔄 Loading investor details from backend for ID:', id); }
      const data = await apiService.getInvestor(id);
      if (import.meta.env.DEV) { console.log('✅ Investor data loaded:', data); }
      
      // Backend now returns data in BOTH formats (snake_case AND camelCase)
      // We can use it directly without any transformation!
      // ALL business logic and formatting is done in the backend
      setInvestor(data);
      
    } catch (err) {
      if (import.meta.env.DEV) { console.error('❌ Error loading investor:', err); }
      setError(err.message || 'Failed to load investor details');
    } finally {
      setLoading(false);
    }
  };

  const loadSeriesData = async () => {
    try {
      const data = await apiService.getSeries();
      setSeries(data);
    } catch (err) {
      if (import.meta.env.DEV) { console.error('❌ Error loading series:', err); }
    }
  };

  const loadInvestorGrievances = async () => {
    try {
      if (import.meta.env.DEV) { console.log('🔄 Loading grievances for investor:', id); }
      const data = await apiService.getInvestorGrievances(id);
      if (import.meta.env.DEV) { console.log('✅ Investor grievances loaded:', data); }
      setInvestorGrievances(data || []);
    } catch (err) {
      if (import.meta.env.DEV) { console.error('❌ Error loading investor grievances:', err); }
      // Don't show error to user, just log it - grievances are optional
      setInvestorGrievances([]);
    }
  };

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
        setShowPartialExitInfo(false);
      }
    };

    if (showPartialExitInfo) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPartialExitInfo]);

  // Show loading state
  if (loading) {
    return (
      <Layout>
        <div className="loading-overlay">
          <div className="loading-spinner-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Show error state
  if (error) {
    return (
      <Layout>
        <div className="investor-details-container">
          <div className="error-message">
            <div className="error-icon">
              <MdReportProblem size={48} />
            </div>
            <h2>Error Loading Investor</h2>
            <p>{error}</p>
            <button 
              className="btn-back"
              onClick={() => navigate('/investors')}
            >
              <HiArrowLeft size={16} />
              Back to Investors
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // Show not found state
  if (!investor) {
    return (
      <Layout>
        <div className="investor-details-container">
          <div className="no-investor-message">
            <div className="no-investor-content">
              <div className="no-investor-icon">
                <MdInfo size={48} />
              </div>
              <h2>Investor Not Found</h2>
              <p>The investor you are looking for does not exist.</p>
              <div className="no-investor-actions">
                <button 
                  className="btn-back"
                  onClick={() => navigate('/investors')}
                >
                  <HiArrowLeft size={16} />
                  Back to Investors
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const generatePDF = async () => {
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
      const kycText = investor.kycStatus === 'Completed' ? 'KYC COMPLETED' : 
                     investor.kycStatus === 'Rejected' ? 'KYC REJECTED' : 'KYC PENDING';
      const kycColor = investor.kycStatus === 'Completed' ? [29, 78, 216] : 
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
          doc.text('   Purchase Date: ' + holding.purchaseDate, 25, yPosition);
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
      
      // Add audit log for investor profile download
      await auditService.logDataOperation(
        user,
        'Downloaded Report',
        'Investor',
        investor.investorId,
        `Downloaded investor profile for "${investor.name}" (ID: ${investor.investorId}, PDF format)`,
        {
          documentType: 'Investor Profile',
          fileName: fileName,
          format: 'PDF',
          investorName: investor.name,
          action: 'report_download'
        }
      );
      
      if (import.meta.env.DEV) { console.log('PDF generated successfully:', fileName); }
    } catch (error) {
      if (import.meta.env.DEV) { console.error('Error generating PDF:', error); }
      alert('Error generating PDF: ' + error.message);
    }
  };

  // Handle file upload for edit modal
  const handleFileUpload = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      setEditFormData({ ...editFormData, [field]: file });
    }
  };

  // Handle edit form submission
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (import.meta.env.DEV) { console.log('Form submitted with data:', editFormData); }
      
      // Prepare update data for backend
      const updateData = {
        full_name: editFormData.fullName,
        email: editFormData.email,
        phone: editFormData.phone,
        dob: editFormData.dob,
        residential_address: editFormData.residentialAddress,
        correspondence_address: editFormData.correspondenceAddress,
        pan: editFormData.pan,
        aadhaar: editFormData.aadhaar,
        bank_name: editFormData.bankName,
        account_number: editFormData.accountNumber,
        ifsc_code: editFormData.ifscCode,
        occupation: editFormData.occupation,
        kyc_status: editFormData.kycStatus,
        source_of_funds: editFormData.sourceOfFunds,
        nominee_name: editFormData.nomineeName,
        nominee_relationship: editFormData.nomineeRelationship,
        nominee_mobile: editFormData.nomineeMobile,
        nominee_email: editFormData.nomineeEmail,
        nominee_address: editFormData.nomineeAddress,
        is_active: editFormData.active,
        status: editFormData.active ? 'active' : 'inactive'
      };

      if (import.meta.env.DEV) { console.log('Updating investor with ID:', investor.id, 'data:', updateData); }

      // Update investor via backend API
      await apiService.updateInvestor(investor.id, updateData);

      // Log audit event
      await auditService.logInvestorUpdate(
        user,
        investor.investorId,
        editFormData.fullName,
        investor,
        editFormData
      );

      if (import.meta.env.DEV) { console.log('Update completed, closing modal'); }
      setShowEditModal(false);
      
      // Show success message
      toast.success('Investor details have been updated successfully', 'Update Successful');
      
      // Reload investor data from backend
      await loadInvestorData();
      
    } catch (error) {
      if (import.meta.env.DEV) { console.error('Error updating investor:', error); }
      toast.error(error.message || 'Failed to update investor. Please try again.', 'Update Failed');
    }
  };

  // Handle checking documents for a specific series
  const handleCheckDocuments = (seriesName) => {
    // TODO: Implement backend API for investor documents
    if (import.meta.env.DEV) { console.log('Check documents for series:', seriesName); }
    toast.info('Document viewing feature is coming soon. Backend API integration is pending.', 'Feature Coming Soon');
    // const documents = getInvestorDocuments(investor.investorId, seriesName);
    // setSelectedSeriesDocuments(documents);
    // setShowDocumentsModal(true);
  };

  // Handle document download
  const handleDocumentDownload = async (document) => {
    try {
      let blob;
      let fileName = document.fileName || `${document.type.replace(/\s+/g, '_')}_${investor.name.replace(/\s+/g, '_')}.txt`;
      
      if (document.fileData) {
        // If we have the actual file data (base64), convert it back to blob
        const base64Data = document.fileData.split(',')[1]; // Remove data:type;base64, prefix
        const mimeType = document.fileType || 'application/octet-stream';
        
        // Convert base64 to binary
        const binaryString = window.atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        blob = new Blob([bytes], { type: mimeType });
      } else {
        // Fallback: Create a mock document
        const mockFileContent = `Document: ${document.type}
Investor: ${investor.name}
Investor ID: ${investor.investorId}
Series: ${document.seriesName}
Upload Date: ${document.uploadDate}
Uploaded By: ${document.uploadedBy}

This is a mock document file for demonstration purposes.
The original file data was not stored in this demo version.`;

        blob = new Blob([mockFileContent], { type: 'text/plain' });
        fileName = fileName.replace(/\.[^/.]+$/, '') + '.txt'; // Change extension to .txt for mock files
      }
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      window.URL.revokeObjectURL(url);
      
      if (import.meta.env.DEV) { console.log(`Downloaded: ${fileName}`); }
      
      // Add audit log for document download
      await auditService.logDataOperation(
        user,
        'Downloaded Document',
        'Document',
        investor.investorId,
        `Downloaded document "${document.type}" (${fileName}) for investor "${investor.name}" (ID: ${investor.investorId}) from series "${document.seriesName}"`,
        {
          documentType: document.type,
          fileName: fileName,
          originalFileName: document.fileName,
          seriesName: document.seriesName,
          investorName: investor.name,
          investorId: investor.investorId,
          downloadMethod: document.fileData ? 'Actual File' : 'Mock File',
          fileSize: document.fileSize || 'Unknown',
          action: 'document_download'
        }
      );
      
      // Show success message
      if (document.fileData) {
        toast.success(`Document "${fileName}" has been downloaded successfully`, 'Download Complete');
      } else {
        toast.info(`Mock document "${fileName}" downloaded (original file data not available in demo)`, 'Demo Mode');
      }
      
    } catch (error) {
      if (import.meta.env.DEV) { console.error('Error downloading document:', error); }
      toast.error('Failed to download document. Please try again.', 'Download Failed');
    }
  };

  // Handle partial series exit - Exit from specific series only
  const handlePartialSeriesExit = async (seriesName) => {
    if (import.meta.env.DEV) { console.log('=== PARTIAL SERIES EXIT FUNCTION CALLED ==='); }
    if (import.meta.env.DEV) { console.log('Series to exit:', seriesName); }
    if (import.meta.env.DEV) { console.log('Current investor:', investor); }

    try {
      // Find the series ID from the series name
      const holding = investor.holdings.find(h => h.series === seriesName);
      if (!holding) {
        toast.error('Series not found in investor holdings', 'Error');
        return;
      }

      // Check if series is matured (should not happen as button is hidden, but double-check)
      if (holding.isMatured) {
        toast.error('Cannot exit from matured series. Series has already ended.', 'Series Matured');
        return;
      }

      // Check lock-in period (should not happen as button is hidden, but double-check)
      if (!holding.isLockInCompleted) {
        const lockInDate = holding.lockInDate ? new Date(holding.lockInDate).toLocaleDateString('en-GB') : 'N/A';
        toast.error(`Cannot exit during lock-in period. Lock-in ends on ${lockInDate}`, 'Lock-in Active');
        return;
      }

      // Find series ID from series list
      const seriesData = series.find(s => s.name === seriesName);
      if (!seriesData) {
        toast.error('Series details not found', 'Error');
        return;
      }

      // Show custom confirmation modal instead of window.confirm
      setExitSeriesData({
        seriesName,
        seriesId: seriesData.id,
        holding
      });
      setShowExitConfirmModal(true);

    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Error in partial series exit:', error); }
      toast.error(error.message || 'Failed to process series exit. Please try again.', 'Exit Failed');
    }
  };

  // Confirm exit from series (called when user clicks "Yes, Exit" in modal)
  const confirmExitSeries = async () => {
    if (!exitSeriesData) return;

    try {
      const { seriesName, seriesId, holding } = exitSeriesData;

      if (import.meta.env.DEV) { console.log('🚪 Calling exit API for investor:', investor.id, 'series:', seriesId); }

      // Call backend API
      const response = await apiService.exitInvestorFromSeries(investor.id, seriesId);
      
      if (import.meta.env.DEV) { console.log('✅ Exit successful:', response); }
      
      // Add audit log for series exit
      await auditService.logDataOperation(
        user,
        'Investor Series Exit',
        'Investment',
        `${investor.investorId}-${seriesName}`,
        `Investor "${investor.name}" (ID: ${investor.investorId}) exited from series "${seriesName}" with investment amount ₹${holding.investment?.toLocaleString('en-IN') || 'N/A'}`,
        {
          investorId: investor.investorId,
          investorName: investor.name,
          seriesName: seriesName,
          seriesId: seriesId,
          exitAmount: holding.investment,
          exitDate: new Date().toISOString().split('T')[0],
          action: 'series_exit'
        }
      ).catch(error => {
        if (import.meta.env.DEV) { console.error('Failed to log series exit:', error); }
      });
      
      // Close modal
      setShowExitConfirmModal(false);
      setExitSeriesData(null);
      
      toast.success(`Successfully exited from ${seriesName}`, 'Exit Successful');
      
      // Reload investor data
      await loadInvestorData();
      
      // Reload audit logs so Administrator page shows the exit log
      if (loadAuditLogs) {
        if (import.meta.env.DEV) { console.log('🔄 Reloading audit logs after series exit...'); }
        await loadAuditLogs();
      }
      
    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Error in confirm exit series:', error); }
      setShowExitConfirmModal(false);
      setExitSeriesData(null);
      toast.error(error.message || 'Failed to process series exit. Please try again.', 'Exit Failed');
    }
  };

  // Cancel exit from series
  const cancelExitSeries = () => {
    setShowExitConfirmModal(false);
    setExitSeriesData(null);
  };

  // Handle delete investor - PERMANENT DELETION WITH LOCK-IN PERIOD CHECK
  const handleDeleteInvestor = async () => {
    if (import.meta.env.DEV) { console.log('=== PERMANENT DELETE FUNCTION CALLED ==='); }
    if (import.meta.env.DEV) { console.log('confirmAction:', confirmAction); }
    
    if (confirmAction !== 'delete') {
      if (import.meta.env.DEV) { console.log('Setting confirmAction to delete'); }
      setConfirmAction('delete');
      return;
    }

    if (import.meta.env.DEV) { console.log('=== PROCEEDING WITH PERMANENT DELETE ==='); }

    try {
      const userConfirmed = confirm(
        `⚠️ PERMANENT DELETE WARNING\n\n` +
        `This will permanently delete investor "${investor.name}" (ID: ${investor.investorId}).\n\n` +
        `This action cannot be undone.\n\n` +
        `Do you want to proceed?`
      );
      
      if (!userConfirmed) {
        setConfirmAction(null);
        return;
      }

      // Delete investor via backend API
      await apiService.deleteInvestor(investor.id);

      // Log audit event
      await auditService.logInvestorDelete(user, investor);

      toast.success(`Investor "${investor.name}" has been permanently deleted from the system`, 'Account Deleted');
      
      // Navigate back to investors list after a short delay
      setTimeout(() => {
        navigate('/investors');
      }, 1500);
      
    } catch (error) {
      if (import.meta.env.DEV) { console.error('Error permanently deleting investor:', error); }
      toast.error(error.message || 'Failed to delete investor. Please try again.', 'Delete Failed');
      setConfirmAction(null);
    }
  };

  // Handle deactivate/activate investor - SIMPLIFIED VERSION
  const handleToggleActivation = async () => {
    if (import.meta.env.DEV) { console.log('=== TOGGLE ACTIVATION FUNCTION CALLED ==='); }
    
    const isCurrentlyActive = investor.active !== false && investor.status !== 'deactivated';
    const newAction = isCurrentlyActive ? 'deactivate' : 'activate';
    
    if (import.meta.env.DEV) { console.log('isCurrentlyActive:', isCurrentlyActive, 'newAction:', newAction, 'confirmAction:', confirmAction); }
    
    if (confirmAction !== newAction) {
      if (import.meta.env.DEV) { console.log('Setting confirmAction to:', newAction); }
      setConfirmAction(newAction);
      return;
    }

    if (import.meta.env.DEV) {


      if (import.meta.env.DEV) { console.log('=== PROCEEDING WITH', newAction.toUpperCase(), '==='); }


    }

    try {
      const userConfirmed = confirm(
        `Are you sure you want to ${newAction} investor "${investor.name}"?`
      );
      
      if (!userConfirmed) {
        setConfirmAction(null);
        return;
      }

      // Update investor status via backend API
      await apiService.updateInvestor(investor.id, {
        is_active: !isCurrentlyActive,
        status: isCurrentlyActive ? 'deactivated' : 'active'
      });

      // Log audit event
      await auditService.logDataOperation(
        user,
        isCurrentlyActive ? 'Deactivated Investor' : 'Activated Investor',
        'Investor',
        investor.investorId,
        `${isCurrentlyActive ? 'Deactivated' : 'Activated'} investor "${investor.name}" (ID: ${investor.investorId})`,
        {
          investorName: investor.name,
          investorId: investor.investorId,
          status: isCurrentlyActive ? 'deactivated' : 'active',
          active: !isCurrentlyActive,
          action: isCurrentlyActive ? 'investor_deactivate' : 'investor_activate'
        }
      );

      setConfirmAction(null);
      toast.success(
        `Investor "${investor.name}" has been ${isCurrentlyActive ? 'deactivated' : 'activated'} successfully`,
        isCurrentlyActive ? 'Account Deactivated' : 'Account Activated'
      );
      
      // Reload investor data from backend
      await loadInvestorData();
      
    } catch (error) {
      if (import.meta.env.DEV) { console.error('Error toggling activation:', error); }
      toast.error(error.message || 'Failed to update investor status. Please try again.', 'Update Failed');
      setConfirmAction(null);
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
                  {investor.kycStatus === 'Completed' && (
                    <span className="kyc-badge verified">
                      <HiCheckCircle size={12} /> kyc completed
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
          {/* Conditional Edit Button - Only show for active investors */}
          {investor.status !== 'deleted' ? (
            <button className="edit-user-button" onClick={() => {
              if (import.meta.env.DEV) { console.log('Edit Investor button clicked!'); }
              // Initialize edit form with current investor data
              setEditFormData({
                fullName: investor.name || '',
                email: investor.email || '',
                phone: investor.phone || '',
                dob: investor.dob || investor.dateOfBirth || '',
                residentialAddress: investor.address || investor.residentialAddress || '',
                correspondenceAddress: investor.correspondenceAddress || investor.address || '',
                pan: investor.pan || '',
                aadhaar: investor.aadhaar || investor.aadhaarNumber || '',
                bankName: investor.bankName || '',
                accountNumber: investor.bankAccountNumber || investor.accountNumber || '',
                ifscCode: investor.ifscCode || '',
                active: investor.active !== false,
                occupation: investor.occupation || '',
                kycStatus: investor.kycStatus || 'Pending',
                sourceOfFunds: investor.sourceOfFunds || '',
                nomineeName: investor.nomineeName || '',
                nomineeRelationship: investor.nomineeRelationship || '',
                nomineeMobile: investor.nomineeMobile || '',
                nomineeEmail: investor.nomineeEmail || '',
                nomineeAddress: investor.nomineeAddress || '',
                panDocument: null,
                aadhaarDocument: null,
                cancelledCheque: null,
                form15G15H: null,
                digitalSignature: null
              });
              if (import.meta.env.DEV) { console.log('Setting showEditModal to true'); }
              setShowEditModal(true);
            }}>
              <MdEdit size={18} /> Edit Investor
            </button>
          ) : (
            <div className="deleted-notice">
              <span className="deleted-text">
                🚫 DELETED ACCOUNT - View Only
              </span>
              <p className="deleted-subtext">
                This investor account has been permanently deleted. Data is preserved for reference only.
              </p>
              {investor.refundAmount && (
                <div className="refund-info">
                  <p className="refund-amount">
                    💰 Net Refund: ₹{investor.refundAmount.toLocaleString('en-IN')}
                  </p>
                  {investor.penaltyAmount > 0 && (
                    <p className="penalty-amount">
                      ⚠️ Penalties Applied: ₹{investor.penaltyAmount.toLocaleString('en-IN')}
                    </p>
                  )}
                  {investor.refundDetails && investor.refundDetails.length > 0 && (
                    <div className="refund-breakdown">
                      <p className="refund-breakdown-title">Investment Breakdown:</p>
                      {investor.refundDetails.map((detail, index) => (
                        <div key={index} className="refund-detail">
                          <p className="refund-series">• {detail.series}: ₹{(detail.refundAmount || detail.amount).toLocaleString('en-IN')}</p>
                          {detail.lockInStatus && (
                            <p className="lockin-status">
                              {detail.lockInStatus === 'completed' ? (
                                <span className="lockin-completed">
                                  ✅ Lock-in completed ({detail.monthsCompleted}/{detail.lockInRequired} months)
                                </span>
                              ) : (
                                <span className="lockin-violation">
                                  ⚠️ Early exit penalty ({detail.monthsCompleted}/{detail.lockInRequired} months, ₹{detail.penaltyAmount?.toLocaleString('en-IN')} penalty)
                                </span>
                              )}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
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
                  {investor.kycStatus === 'Completed' && (
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
            <div className="holdings-header">
              <h2 className="section-title">Active Holdings</h2>
              {investor.series && investor.series.length > 1 && (
                <div className="info-tooltip-container" ref={tooltipRef}>
                  <button 
                    className="info-toggle-button"
                    onClick={() => setShowPartialExitInfo(!showPartialExitInfo)}
                    title="Information about partial series exit"
                  >
                    ℹ️
                  </button>
                  {showPartialExitInfo && (
                    <div className="info-tooltip-popup">
                      <div className="tooltip-arrow"></div>
                      <p className="tooltip-text">
                        You can exit from individual series using the "Exit Series" button. 
                        This allows you to withdraw from specific investments while keeping others active.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="table-card">
              {investor.holdings && investor.holdings.length > 0 ? (
                <table className="holdings-table">
                  <thead>
                    <tr>
                      <th>Series</th>
                      <th>Investment Amount</th>
                      <th>Purchase Date</th>
                      <th>Next Payout</th>
                      <th>Status</th>
                      <th>Documents</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {investor.holdings.map((holding, index) => (
                      <tr key={index}>
                        <td className="series-cell">
                          <button 
                            className="series-link"
                            onClick={() => {
                              // Create a dynamic mapping function for series names to IDs
                              const getSeriesId = (seriesName) => {
                                // First try to find the series in the actual series data
                                const foundSeries = series.find(s => s.name === seriesName);
                                if (foundSeries) {
                                  return foundSeries.id.toString();
                                }
                                
                                // Fallback to static mapping for initial series
                                const seriesMap = {
                                  'Series A': '1',
                                  'Series B': '2',
                                  'Series C': '3',
                                  'Series D': '4',
                                  'Series E': '5'
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
                        <td className="investment-cell">{formatCurrency(holding.investment)}</td>
                        <td>{holding.purchaseDate}</td>
                        <td>{holding.nextPayout}</td>
                        <td>
                          <span className={`status-pill ${holding.status.toLowerCase()}`}>{holding.status}</span>
                        </td>
                        <td>
                          <button 
                            className="check-documents-button"
                            onClick={() => handleCheckDocuments(holding.series)}
                          >
                            Check Documents
                          </button>
                        </td>
                        <td>
                          {(() => {
                            // Count only active (non-matured) holdings for exit logic
                            const activeHoldings = investor.holdings.filter(h => !h.isMatured);
                            const isMatured = holding.isMatured;
                            const isLockInCompleted = holding.isLockInCompleted;
                            
                            // Show "Matured" if series has matured
                            if (isMatured) {
                              return (
                                <span className="matured-series" title="Series has matured - no exit option available">
                                  Matured
                                </span>
                              );
                            }
                            
                            // Show "Lock-in Active" if lock-in period is not completed
                            if (!isLockInCompleted) {
                              const lockInDate = holding.lockInDate ? new Date(holding.lockInDate).toLocaleDateString('en-GB') : 'N/A';
                              return (
                                <span className="lockin-active" title={`Lock-in period active until ${lockInDate}`}>
                                  Lock-in Active
                                </span>
                              );
                            }
                            
                            // Show "Exit Series" button only after lock-in and before maturity
                            return (
                              <button 
                                className="exit-series-button"
                                onClick={() => handlePartialSeriesExit(holding.series)}
                                title={`Exit from ${holding.series}`}
                              >
                                Exit Series
                              </button>
                            );
                          })()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">
                  <p>No active holdings available</p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Sections */}
          <div className="bottom-sections">
            {/* KYC Documents */}
            <div className="section-card">
              <h2 className="section-title">KYC Documents</h2>
              {investor.kycDocuments && investor.kycDocuments.length > 0 ? (
                <div className="documents-list">
                  {investor.kycDocuments.map((doc, index) => (
                    <div key={index} className="document-item">
                      <div className="document-info">
                        <HiOutlineDocumentText className="document-icon" />
                        <div>
                          <div className="document-name">{doc.name}</div>
                          <div className="document-date">Uploaded: {doc.uploadedDate}</div>
                          {doc.fileName && (
                            <div className="document-filename">{doc.fileName}</div>
                          )}
                        </div>
                      </div>
                      <div className="document-actions">
                        {doc.status === 'Completed' ? (
                          <span className="verified-badge">
                            <HiCheckCircle size={14} /> Completed
                          </span>
                        ) : doc.status === 'Rejected' ? (
                          <span className="rejected-badge">
                            <HiCheckCircle size={14} /> Rejected
                          </span>
                        ) : (
                          <span className="pending-badge">
                            <HiCheckCircle size={14} /> Pending
                          </span>
                        )}
                        {doc.download_url && (
                          <a 
                            href={doc.download_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="download-doc-btn"
                            onClick={async () => {
                              // Log download action
                              await auditService.logDataOperation(
                                user,
                                'Downloaded Document',
                                'Document',
                                investor.investorId,
                                `Downloaded ${doc.name} for investor "${investor.name}" (ID: ${investor.investorId})`,
                                {
                                  documentType: doc.name,
                                  fileName: doc.fileName,
                                  action: 'document_download'
                                }
                              );
                            }}
                          >
                            Download
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <p>No KYC documents uploaded</p>
                </div>
              )}
            </div>

            {/* Recent Transactions */}
            <div className="section-card">
              <h2 className="section-title">Recent Transactions</h2>
              {investor.transactions && investor.transactions.length > 0 ? (
                <div className="transactions-list">
                  {investor.transactions.map((transaction, index) => (
                    <div key={index} className="transaction-item">
                      <div className="transaction-info">
                        <div className="transaction-type">Investment</div>
                        <div className="transaction-details">
                          {transaction.series} • {transaction.date}
                        </div>
                        {transaction.description && (
                          <div className="transaction-description">{transaction.description}</div>
                        )}
                      </div>
                      <span className={`transaction-amount ${transaction.type === 'Interest Credit' ? 'positive' : 'neutral'}`}>
                        {transaction.type === 'Interest Credit' ? '+' : ''} {formatCurrency(transaction.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <p>No transactions available</p>
                  <span>Transactions will appear here once the investor makes investments</span>
                </div>
              )}
            </div>

            {/* All Grievances - Only show if investor has grievances */}
            {investorGrievances.length > 0 && (
              <div className="section-card complaints-section">
                <h2 className="section-title">
                  <MdReportProblem className="section-icon" />
                  All Grievances ({investorGrievances.length})
                </h2>
                <div className="complaints-list">
                  {investorGrievances.map((grievance, index) => (
                    <div key={grievance.id} className={`complaint-item ${grievance.status === 'resolved' ? 'resolved' : grievance.status === 'in-progress' ? 'in-progress' : 'pending'}`}>
                      <div className="complaint-header">
                        <div className="complaint-number">{grievance.grievance_id}</div>
                        <div className="complaint-main-info">
                          <div className="complaint-subject">{grievance.subject}</div>
                          <div className="complaint-timestamp">
                            {new Date(grievance.created_at).toLocaleString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                        <span className={`status-badge ${grievance.status}`}>
                          {grievance.status === 'resolved' ? 'Resolved' : grievance.status === 'in-progress' ? 'In Progress' : 'Pending'}
                        </span>
                      </div>
                      <div className="complaint-body">
                        <div className="complaint-description">{grievance.description}</div>
                        {grievance.series_name && (
                          <div className="complaint-series">
                            <span className="series-label">Series:</span> {grievance.series_name}
                          </div>
                        )}
                        <div className="complaint-meta">
                          <span className="meta-item">Category: {grievance.category}</span>
                          <span className="meta-item">Priority: {grievance.priority}</span>
                        </div>
                        {grievance.resolution_comment && (
                          <div className="complaint-resolution">
                            <div className="resolution-label">Resolution:</div>
                            <div className="resolution-text">{grievance.resolution_comment}</div>
                            {grievance.resolved_at && (
                              <div className="resolved-date">
                                Resolved: {new Date(grievance.resolved_at).toLocaleString('en-GB', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            )}
                            {grievance.resolved_by && (
                              <div className="resolved-by">By: {grievance.resolved_by}</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Edit User Modal */}
        {showEditModal && (
          <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
            <div className="modal-content investor-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Edit Investor</h2>
                <button 
                  className="close-button"
                  onClick={() => setShowEditModal(false)}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="investor-form">
                {/* Personal Information */}
                <div className="form-section">
                  <h3 className="section-title">Personal Information</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Full Name*</label>
                      <input
                        type="text"
                        value={editFormData.fullName || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                        onFocus={(e) => {
                          e.target.value = '';
                          setEditFormData({ ...editFormData, fullName: '' });
                        }}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Email ID*</label>
                      <input
                        type="email"
                        value={editFormData.email || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                        onFocus={(e) => {
                          e.target.value = '';
                          setEditFormData({ ...editFormData, email: '' });
                        }}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Date of Birth</label>
                      <input
                        type="date"
                        value={editFormData.dob || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, dob: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Mobile Number*</label>
                      <input
                        type="tel"
                        value={editFormData.phone || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                        onFocus={(e) => {
                          e.target.value = '';
                          setEditFormData({ ...editFormData, phone: '' });
                        }}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group full-width">
                      <label>Residential Address*</label>
                      <textarea
                        value={editFormData.residentialAddress || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, residentialAddress: e.target.value })}
                        onFocus={(e) => {
                          e.target.value = '';
                          setEditFormData({ ...editFormData, residentialAddress: '' });
                        }}
                        required
                        rows="3"
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group full-width">
                      <label>Correspondence Address (if different)</label>
                      <textarea
                        value={editFormData.correspondenceAddress || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, correspondenceAddress: e.target.value })}
                        onFocus={(e) => {
                          e.target.value = '';
                          setEditFormData({ ...editFormData, correspondenceAddress: '' });
                        }}
                        rows="3"
                      />
                    </div>
                  </div>
                </div>

                {/* Identity Information */}
                <div className="form-section">
                  <h3 className="section-title">Identity Information</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>PAN (Permanent Account Number)*</label>
                      <input
                        type="text"
                        value={editFormData.pan || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, pan: e.target.value.toUpperCase() })}
                        onFocus={(e) => {
                          e.target.value = '';
                          setEditFormData({ ...editFormData, pan: '' });
                        }}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Aadhaar Number*</label>
                      <input
                        type="text"
                        value={editFormData.aadhaar || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, aadhaar: e.target.value })}
                        onFocus={(e) => {
                          e.target.value = '';
                          setEditFormData({ ...editFormData, aadhaar: '' });
                        }}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Bank Information */}
                <div className="form-section">
                  <h3 className="section-title">Bank Information</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Bank Name*</label>
                      <input
                        type="text"
                        value={editFormData.bankName || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, bankName: e.target.value })}
                        onFocus={(e) => {
                          e.target.value = '';
                          setEditFormData({ ...editFormData, bankName: '' });
                        }}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Account Number*</label>
                      <input
                        type="text"
                        value={editFormData.accountNumber || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, accountNumber: e.target.value })}
                        onFocus={(e) => {
                          e.target.value = '';
                          setEditFormData({ ...editFormData, accountNumber: '' });
                        }}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>IFSC Code*</label>
                      <input
                        type="text"
                        value={editFormData.ifscCode || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, ifscCode: e.target.value.toUpperCase() })}
                        onFocus={(e) => {
                          e.target.value = '';
                          setEditFormData({ ...editFormData, ifscCode: '' });
                        }}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Occupation</label>
                      <input
                        type="text"
                        value={editFormData.occupation || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, occupation: e.target.value })}
                        onFocus={(e) => {
                          e.target.value = '';
                          setEditFormData({ ...editFormData, occupation: '' });
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Account Status */}
                <div className="form-section">
                  <h3 className="section-title">Account Status</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>KYC Status*</label>
                      <select
                        value={editFormData.kycStatus || 'Pending'}
                        onChange={(e) => setEditFormData({ ...editFormData, kycStatus: e.target.value })}
                        required
                      >
                        <option value="Pending">Pending</option>
                        <option value="Completed">Completed</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Source of Funds</label>
                      <input
                        type="text"
                        value={editFormData.sourceOfFunds || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, sourceOfFunds: e.target.value })}
                        onFocus={(e) => {
                          e.target.value = '';
                          setEditFormData({ ...editFormData, sourceOfFunds: '' });
                        }}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group checkbox-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={editFormData.active !== false}
                          onChange={(e) => setEditFormData({ ...editFormData, active: e.target.checked })}
                        />
                        <span className="checkbox-text">Active Account</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Nomination */}
                <div className="form-section">
                  <h3 className="section-title">Nomination (Optional)</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Name of Nominee</label>
                      <input
                        type="text"
                        value={editFormData.nomineeName || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, nomineeName: e.target.value })}
                        onFocus={(e) => {
                          e.target.value = '';
                          setEditFormData({ ...editFormData, nomineeName: '' });
                        }}
                      />
                    </div>
                    <div className="form-group">
                      <label>Relationship with Subscriber</label>
                      <select
                        value={editFormData.nomineeRelationship || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, nomineeRelationship: e.target.value })}
                      >
                        <option value="">Select relationship</option>
                        <option value="Spouse">Spouse</option>
                        <option value="Father">Father</option>
                        <option value="Mother">Mother</option>
                        <option value="Son">Son</option>
                        <option value="Daughter">Daughter</option>
                        <option value="Brother">Brother</option>
                        <option value="Sister">Sister</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Mobile No</label>
                      <input
                        type="tel"
                        value={editFormData.nomineeMobile || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, nomineeMobile: e.target.value })}
                        onFocus={(e) => {
                          e.target.value = '';
                          setEditFormData({ ...editFormData, nomineeMobile: '' });
                        }}
                      />
                    </div>
                    <div className="form-group">
                      <label>Email Id</label>
                      <input
                        type="email"
                        value={editFormData.nomineeEmail || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, nomineeEmail: e.target.value })}
                        onFocus={(e) => {
                          e.target.value = '';
                          setEditFormData({ ...editFormData, nomineeEmail: '' });
                        }}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group full-width">
                      <label>Address</label>
                      <textarea
                        value={editFormData.nomineeAddress || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, nomineeAddress: e.target.value })}
                        onFocus={(e) => {
                          e.target.value = '';
                          setEditFormData({ ...editFormData, nomineeAddress: '' });
                        }}
                        rows="3"
                      />
                    </div>
                  </div>
                </div>

                {/* Attachments */}
                <div className="upload-section">
                  <h3 className="section-title">Update Attachments (Optional)</h3>
                  <div className="upload-grid">
                    <div className="upload-item">
                      <label>PAN Document</label>
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={(e) => handleFileUpload(e, 'panDocument')}
                      />
                      {editFormData.panDocument && (
                        <div className="file-selected">{editFormData.panDocument.name}</div>
                      )}
                    </div>

                    <div className="upload-item">
                      <label>Aadhaar Document</label>
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={(e) => handleFileUpload(e, 'aadhaarDocument')}
                      />
                      {editFormData.aadhaarDocument && (
                        <div className="file-selected">{editFormData.aadhaarDocument.name}</div>
                      )}
                    </div>

                    <div className="upload-item">
                      <label>Cancelled Cheque</label>
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={(e) => handleFileUpload(e, 'cancelledCheque')}
                      />
                      {editFormData.cancelledCheque && (
                        <div className="file-selected">{editFormData.cancelledCheque.name}</div>
                      )}
                    </div>

                    <div className="upload-item">
                      <label>Form 15G/15H</label>
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={(e) => handleFileUpload(e, 'form15G15H')}
                      />
                      {editFormData.form15G15H && (
                        <div className="file-selected">{editFormData.form15G15H.name}</div>
                      )}
                    </div>

                    <div className="upload-item">
                      <label>Digital Signature</label>
                      <input
                        type="file"
                        accept=".png,.jpg,.jpeg"
                        onChange={(e) => handleFileUpload(e, 'digitalSignature')}
                      />
                      {editFormData.digitalSignature && (
                        <div className="file-selected">{editFormData.digitalSignature.name}</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="form-actions">
                  <div className="action-buttons-row">
                    <button type="submit" className="submit-button update-button">
                      Update
                    </button>
                    
                    <button 
                      type="button" 
                      className={`action-button ${confirmAction === 'delete' ? 'confirm-delete' : 'delete-button'}`}
                      onClick={handleDeleteInvestor}
                    >
                      <MdDelete size={18} />
                      {confirmAction === 'delete' ? 'Confirm Delete' : 'Delete'}
                    </button>
                    
                    <button 
                      type="button" 
                      className={`action-button ${
                        investor.active === false || investor.status === 'deactivated' 
                          ? (confirmAction === 'activate' ? 'confirm-activate' : 'activate-button')
                          : (confirmAction === 'deactivate' ? 'confirm-deactivate' : 'deactivate-button')
                      }`}
                      onClick={handleToggleActivation}
                    >
                      {investor.active === false || investor.status === 'deactivated' 
                        ? (confirmAction === 'activate' ? 'Confirm Activate' : 'Activate Account')
                        : (confirmAction === 'deactivate' ? 'Confirm Deactivate' : 'Deactivate')
                      }
                    </button>
                  </div>
                  
                  <button type="button" className="cancel-button" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Documents Viewer Modal */}
        {showDocumentsModal && (
          <div className="modal-overlay" onClick={() => setShowDocumentsModal(false)}>
            <div className="modal-content documents-viewer-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Documents - {investor.name}</h2>
                <button 
                  className="close-button"
                  onClick={() => setShowDocumentsModal(false)}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <div className="documents-info">
                  <p><strong>Investor:</strong> {investor.name}</p>
                  <p><strong>Investor ID:</strong> {investor.investorId}</p>
                </div>
                
                {selectedSeriesDocuments && selectedSeriesDocuments.length > 0 ? (
                  <div className="documents-list">
                    {selectedSeriesDocuments.map((document, index) => (
                      <div key={index} className="document-card">
                        <div className="document-info">
                          <div className="document-icon">📄</div>
                          <div className="document-details">
                            <div className="document-name">{document.type}</div>
                            <div className="document-meta">
                              <span className="document-filename">{document.fileName}</span>
                              <span className="document-date">Uploaded: {document.uploadDate}</span>
                              <span className="document-series">Series: {document.seriesName}</span>
                              {document.uploadedBy && (
                                <span className="document-uploader">By: {document.uploadedBy}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <button 
                          className="download-document-button"
                          onClick={() => handleDocumentDownload(document)}
                        >
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-documents-found">
                    <div className="no-docs-icon">📄</div>
                    <p>No documents uploaded for this series yet</p>
                    <span>Documents will appear here once they are uploaded from the Series Details page.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Exit Series Confirmation Modal */}
        {showExitConfirmModal && exitSeriesData && (
          <div className="modal-overlay" onClick={cancelExitSeries}>
            <div className="modal-content exit-confirm-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header exit-warning">
                <div className="warning-icon">⚠️</div>
                <h2>Confirm Series Exit</h2>
                <button className="close-button" onClick={cancelExitSeries}>×</button>
              </div>
              <div className="modal-body">
                <div className="exit-warning-message">
                  <p className="warning-title">Are you sure you want to exit from this series?</p>
                  <p className="warning-subtitle">This action cannot be undone.</p>
                </div>
                
                <div className="exit-details-box">
                  <div className="exit-detail-row">
                    <span className="exit-label">Series Name:</span>
                    <span className="exit-value">{exitSeriesData.seriesName}</span>
                  </div>
                  <div className="exit-detail-row">
                    <span className="exit-label">Investment Amount:</span>
                    <span className="exit-value exit-amount">₹{exitSeriesData.holding.investment?.toLocaleString('en-IN') || 'N/A'}</span>
                  </div>
                  <div className="exit-detail-row">
                    <span className="exit-label">Investor:</span>
                    <span className="exit-value">{investor?.name}</span>
                  </div>
                </div>

                <div className="exit-consequences">
                  <p className="consequences-title">What happens when you exit:</p>
                  <ul className="consequences-list">
                    <li>✓ Investment will be marked as exited</li>
                    <li>✓ No further interest payouts will be processed</li>
                    <li>✓ Principal amount settlement will be initiated</li>
                    <li>✗ This action cannot be reversed</li>
                  </ul>
                </div>
              </div>
              <div className="modal-actions exit-actions">
                <button className="cancel-button" onClick={cancelExitSeries}>
                  Cancel
                </button>
                <button className="confirm-exit-button" onClick={confirmExitSeries}>
                  Yes, Exit Series
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default InvestorDetails;
