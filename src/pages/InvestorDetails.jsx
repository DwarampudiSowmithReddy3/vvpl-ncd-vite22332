import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
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
import { MdAccountBalance, MdReportProblem, MdEdit, MdDelete } from 'react-icons/md';
import { FiUpload } from 'react-icons/fi';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const InvestorDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { investors = [], getInvestorComplaints, addAuditLog, updateInvestor, setInvestors, series, setSeries } = useData();
  const { user } = useAuth();
  
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [confirmAction, setConfirmAction] = useState(null); // 'delete' or 'deactivate'

  // Hardcoded default data
  const defaultInvestor = {
    id: id || '1',
    name: 'Rajesh Kumar',
    investorId: 'ABCDE1234F',
    email: 'rajesh.kumar@email.com',
    phone: '+91 98765 43210',
    pan: 'ABCDE1234F',
    dateJoined: '15/6/2023',
    address: '123, MG Road, Bangalore, Karnataka - 560001',
    bankAccount: 'HDFC Bank - ****5678',
    kycStatus: 'Completed', // Changed from 'Verified' to 'Completed'
    totalInvestment: 1500000,
    activeHoldings: 3,
    holdings: [
      {
        series: 'Series A',
        purchaseDate: '25/6/2023',
        investment: 500000,
        nextPayout: '1/2/2024',
        status: 'Active'
      },
      {
        series: 'Series B',
        purchaseDate: '20/9/2023',
        investment: 1000000,
        nextPayout: '5/2/2024',
        status: 'Active'
      }
    ],
    kycDocuments: [
      { name: 'PAN Card', uploadedDate: '20/6/2023', status: 'Completed' }, // Changed from 'Verified'
      { name: 'Aadhaar Card', uploadedDate: '20/6/2023', status: 'Completed' }, // Changed from 'Verified'
      { name: 'Bank Statement', uploadedDate: '20/6/2023', status: 'Completed' }, // Changed from 'Verified'
      { name: 'Cancelled Cheque', uploadedDate: '20/6/2023', status: 'Completed' } // Changed from 'Verified'
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
  
  console.log('Looking for investor with ID:', id, 'type:', typeof id);
  console.log('Available investors:', investors);
  console.log('Investors from localStorage:', localStorage.getItem('investors'));
  
  if (investors && investors.length > 0 && id) {
    const foundInvestor = investors.find(inv => inv.id === parseInt(id) || inv.id === id);
    console.log('Found investor:', foundInvestor);
    console.log('Investor ID type:', foundInvestor ? typeof foundInvestor.id : 'N/A');
    
    if (foundInvestor) {
      // Generate holdings from investments array
      const holdings = [];
      if (foundInvestor.investments && Array.isArray(foundInvestor.investments)) {
        foundInvestor.investments.forEach(investment => {
          holdings.push({
            series: investment.seriesName,
            purchaseDate: investment.date,
            investment: investment.amount,
            nextPayout: 'TBD', // To be determined based on series payout schedule
            status: 'Active'
          });
        });
      }
      
      // Generate KYC documents if not present
      let kycDocuments = foundInvestor.kycDocuments || [];
      if (kycDocuments.length === 0) {
        // Generate default KYC documents based on investor's KYC status
        kycDocuments = [
          { 
            name: 'PAN Card', 
            uploadedDate: foundInvestor.dateJoined, 
            status: foundInvestor.kycStatus,
            fileName: 'pan_card.pdf'
          },
          { 
            name: 'Aadhaar Card', 
            uploadedDate: foundInvestor.dateJoined, 
            status: foundInvestor.kycStatus,
            fileName: 'aadhaar_card.pdf'
          },
          { 
            name: 'Cancelled Cheque', 
            uploadedDate: foundInvestor.dateJoined, 
            status: foundInvestor.kycStatus,
            fileName: 'cancelled_cheque.pdf'
          },
          { 
            name: 'Digital Signature', 
            uploadedDate: foundInvestor.dateJoined, 
            status: foundInvestor.kycStatus,
            fileName: 'digital_signature.png'
          }
        ];
      }
      
      // Generate transactions from investments
      let transactions = foundInvestor.transactions || [];
      if (transactions.length === 0 && foundInvestor.investments && foundInvestor.investments.length > 0) {
        transactions = foundInvestor.investments.map(investment => ({
          type: 'Investment',
          series: investment.seriesName,
          date: investment.date,
          amount: investment.amount,
          description: `Investment in ${investment.seriesName}`
        }));
        
        // Add interest credit transactions for active investments
        foundInvestor.investments.forEach(investment => {
          const investmentDate = new Date(investment.timestamp || investment.date);
          const today = new Date();
          const monthsDiff = Math.floor((today - investmentDate) / (1000 * 60 * 60 * 24 * 30));
          
          // Generate interest transactions for each month since investment
          for (let i = 1; i <= Math.min(monthsDiff, 6); i++) { // Limit to last 6 months
            const interestDate = new Date(investmentDate);
            interestDate.setMonth(interestDate.getMonth() + i);
            
            if (interestDate <= today) {
              // Calculate monthly interest (assuming 10% annual rate)
              const monthlyInterest = Math.round((investment.amount * 0.10) / 12);
              
              transactions.push({
                type: 'Interest Credit',
                series: investment.seriesName,
                date: interestDate.toLocaleDateString('en-GB'),
                amount: monthlyInterest,
                description: `Monthly interest for ${investment.seriesName}`
              });
            }
          }
        });
        
        // Sort transactions by date (newest first)
        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
      }
      
      investor = {
        id: foundInvestor.id, // Use the actual ID from the found investor
        name: foundInvestor.name,
        investorId: foundInvestor.investorId,
        email: foundInvestor.email,
        phone: foundInvestor.phone,
        pan: foundInvestor.pan || defaultInvestor.pan,
        dateJoined: foundInvestor.dateJoined,
        address: foundInvestor.address || defaultInvestor.address,
        bankAccount: foundInvestor.bankAccount || defaultInvestor.bankAccount,
        kycStatus: foundInvestor.kycStatus || 'Pending', // Keep original status without mapping
        totalInvestment: foundInvestor.investment || 0,
        activeHoldings: foundInvestor.series?.length || 0,
        holdings: holdings,
        kycDocuments: kycDocuments,
        transactions: transactions,
        // Include all other fields that might be needed for updates
        dob: foundInvestor.dob,
        dateOfBirth: foundInvestor.dateOfBirth,
        residentialAddress: foundInvestor.residentialAddress,
        correspondenceAddress: foundInvestor.correspondenceAddress,
        aadhaar: foundInvestor.aadhaar,
        aadhaarNumber: foundInvestor.aadhaarNumber,
        bankName: foundInvestor.bankName,
        bankAccountNumber: foundInvestor.bankAccountNumber,
        accountNumber: foundInvestor.accountNumber,
        ifscCode: foundInvestor.ifscCode,
        active: foundInvestor.active,
        occupation: foundInvestor.occupation,
        sourceOfFunds: foundInvestor.sourceOfFunds,
        nomineeName: foundInvestor.nomineeName,
        nomineeRelationship: foundInvestor.nomineeRelationship,
        nomineeMobile: foundInvestor.nomineeMobile,
        nomineeEmail: foundInvestor.nomineeEmail,
        nomineeAddress: foundInvestor.nomineeAddress,
        status: foundInvestor.status,
        series: foundInvestor.series,
        investment: foundInvestor.investment,
        investments: foundInvestor.investments
      };
      
      console.log('Using found investor data:', investor);
    } else {
      console.log('Investor not found, using default data');
    }
  } else {
    console.log('No investors data available or no ID provided, using default data');
  }

  // Filter complaints for this specific investor
  const investorComplaints = getInvestorComplaints(investor.investorId);

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
      addAuditLog({
        action: 'Downloaded Report',
        adminName: user ? user.name : 'User',
        adminRole: user ? user.displayRole : 'User',
        details: `Downloaded investor profile for "${investor.name}" (ID: ${investor.investorId}, PDF format)`,
        entityType: 'Investor',
        entityId: investor.investorId,
        changes: {
          documentType: 'Investor Profile',
          fileName: fileName,
          format: 'PDF',
          investorName: investor.name,
          investorId: investor.investorId
        }
      });
      
      console.log('PDF generated successfully:', fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
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
  const handleEditSubmit = (e) => {
    e.preventDefault();
    
    console.log('Form submitted with data:', editFormData);
    console.log('Current investor:', investor);
    
    // Update investor data
    const updatedInvestor = {
      ...investor,
      name: editFormData.fullName,
      email: editFormData.email,
      phone: editFormData.phone,
      dob: editFormData.dob,
      dateOfBirth: editFormData.dob, // Add both field names
      address: editFormData.residentialAddress,
      residentialAddress: editFormData.residentialAddress, // Add both field names
      correspondenceAddress: editFormData.correspondenceAddress,
      pan: editFormData.pan,
      aadhaar: editFormData.aadhaar,
      aadhaarNumber: editFormData.aadhaar, // Add both field names
      bankName: editFormData.bankName,
      bankAccountNumber: editFormData.accountNumber,
      accountNumber: editFormData.accountNumber, // Add both field names
      ifscCode: editFormData.ifscCode,
      active: editFormData.active,
      occupation: editFormData.occupation,
      kycStatus: editFormData.kycStatus,
      sourceOfFunds: editFormData.sourceOfFunds,
      nomineeName: editFormData.nomineeName,
      nomineeRelationship: editFormData.nomineeRelationship,
      nomineeMobile: editFormData.nomineeMobile,
      nomineeEmail: editFormData.nomineeEmail,
      nomineeAddress: editFormData.nomineeAddress
    };

    console.log('Updated investor data:', updatedInvestor);

    // Update KYC documents if new ones uploaded
    const updatedKycDocuments = [...(investor.kycDocuments || [])];
    const uploadDate = new Date().toLocaleDateString('en-GB');
    
    if (editFormData.panDocument) {
      const existingIndex = updatedKycDocuments.findIndex(doc => doc.name === 'PAN Card');
      const docData = { name: 'PAN Card', uploadedDate: uploadDate, status: editFormData.kycStatus, fileName: editFormData.panDocument.name };
      if (existingIndex >= 0) {
        updatedKycDocuments[existingIndex] = docData;
      } else {
        updatedKycDocuments.push(docData);
      }
    }
    
    if (editFormData.aadhaarDocument) {
      const existingIndex = updatedKycDocuments.findIndex(doc => doc.name === 'Aadhaar Card');
      const docData = { name: 'Aadhaar Card', uploadedDate: uploadDate, status: editFormData.kycStatus, fileName: editFormData.aadhaarDocument.name };
      if (existingIndex >= 0) {
        updatedKycDocuments[existingIndex] = docData;
      } else {
        updatedKycDocuments.push(docData);
      }
    }
    
    if (editFormData.cancelledCheque) {
      const existingIndex = updatedKycDocuments.findIndex(doc => doc.name === 'Cancelled Cheque');
      const docData = { name: 'Cancelled Cheque', uploadedDate: uploadDate, status: editFormData.kycStatus, fileName: editFormData.cancelledCheque.name };
      if (existingIndex >= 0) {
        updatedKycDocuments[existingIndex] = docData;
      } else {
        updatedKycDocuments.push(docData);
      }
    }
    
    if (editFormData.form15G15H) {
      const existingIndex = updatedKycDocuments.findIndex(doc => doc.name === 'Form 15G/15H');
      const docData = { name: 'Form 15G/15H', uploadedDate: uploadDate, status: editFormData.kycStatus, fileName: editFormData.form15G15H.name };
      if (existingIndex >= 0) {
        updatedKycDocuments[existingIndex] = docData;
      } else {
        updatedKycDocuments.push(docData);
      }
    }
    
    if (editFormData.digitalSignature) {
      const existingIndex = updatedKycDocuments.findIndex(doc => doc.name === 'Digital Signature');
      const docData = { name: 'Digital Signature', uploadedDate: uploadDate, status: editFormData.kycStatus, fileName: editFormData.digitalSignature.name };
      if (existingIndex >= 0) {
        updatedKycDocuments[existingIndex] = docData;
      } else {
        updatedKycDocuments.push(docData);
      }
    }
    
    updatedInvestor.kycDocuments = updatedKycDocuments;

    console.log('Calling updateInvestor with ID:', investor.id, 'and data:', updatedInvestor);

    // Update investor using DataContext
    updateInvestor(investor.id, updatedInvestor);

    // Add audit log
    addAuditLog({
      action: 'Updated Investor',
      adminName: user ? user.name : 'Admin',
      adminRole: user ? user.displayRole : 'Admin',
      details: `Updated investor "${editFormData.fullName}" (ID: ${investor.investorId})`,
      entityType: 'Investor',
      entityId: investor.investorId,
      changes: {
        investorName: editFormData.fullName,
        investorId: investor.investorId,
        email: editFormData.email,
        phone: editFormData.phone,
        kycStatus: editFormData.kycStatus,
        active: editFormData.active
      }
    });

    console.log('Update completed, closing modal');
    setShowEditModal(false);
    
    // Show success message
    alert('Investor updated successfully!');
    
    // Instead of reloading, let's update the local investor state
    // The DataContext should handle the global state update
  };

  // Handle delete investor - PERMANENT DELETION WITH LOCK-IN PERIOD CHECK
  const handleDeleteInvestor = () => {
    console.log('=== PERMANENT DELETE FUNCTION CALLED ===');
    console.log('confirmAction:', confirmAction);
    
    if (confirmAction !== 'delete') {
      console.log('Setting confirmAction to delete');
      setConfirmAction('delete');
      return;
    }

    console.log('=== PROCEEDING WITH PERMANENT DELETE ===');
    console.log('Current investor:', investor);

    try {
      // Get current investors and series from localStorage directly
      const currentInvestors = JSON.parse(localStorage.getItem('investors') || '[]');
      const currentSeries = JSON.parse(localStorage.getItem('series') || '[]');
      console.log('Current investors from localStorage:', currentInvestors);
      console.log('Current series from localStorage:', currentSeries);
      
      // Find the investor to delete by multiple methods
      const investorIndex = currentInvestors.findIndex(inv => 
        inv.investorId === investor.investorId || 
        inv.id === investor.id || 
        inv.id === parseInt(id)
      );
      
      console.log('Found investor at index:', investorIndex);
      
      if (investorIndex === -1) {
        console.error('Investor not found for deletion');
        alert('Error: Investor not found');
        return;
      }

      const investorToDelete = currentInvestors[investorIndex];
      
      // 🔒 LOCK-IN PERIOD CHECK (Trial Implementation)
      const lockInViolations = [];
      const eligibleRefunds = [];
      let totalRefundAmount = 0;
      let totalPenaltyAmount = 0;
      
      if (investorToDelete.investments && Array.isArray(investorToDelete.investments)) {
        investorToDelete.investments.forEach(investment => {
          // Find the series details to get lock-in period
          const seriesDetails = currentSeries.find(s => s.name === investment.seriesName);
          const lockInMonths = seriesDetails ? (seriesDetails.lockInPeriod || 12) : 12; // Default 12 months
          
          // Calculate investment age in months
          const investmentDate = new Date(investment.timestamp || investment.date);
          const today = new Date();
          const monthsDiff = Math.floor((today - investmentDate) / (1000 * 60 * 60 * 24 * 30));
          
          const isLockInComplete = monthsDiff >= lockInMonths;
          const remainingLockIn = Math.max(0, lockInMonths - monthsDiff);
          
          if (isLockInComplete) {
            // Full refund - lock-in period completed
            eligibleRefunds.push({
              series: investment.seriesName,
              amount: investment.amount,
              date: investment.date,
              status: 'eligible',
              lockInStatus: 'completed',
              monthsCompleted: monthsDiff,
              lockInRequired: lockInMonths
            });
            totalRefundAmount += investment.amount;
          } else {
            // Early exit penalty - lock-in period not completed
            const penaltyRate = 0.02; // 2% penalty (trial calculation)
            const penaltyAmount = investment.amount * penaltyRate;
            const refundAfterPenalty = investment.amount - penaltyAmount;
            
            lockInViolations.push({
              series: investment.seriesName,
              amount: investment.amount,
              penaltyAmount: penaltyAmount,
              refundAmount: refundAfterPenalty,
              date: investment.date,
              status: 'early_exit',
              lockInStatus: 'incomplete',
              monthsCompleted: monthsDiff,
              monthsRemaining: remainingLockIn,
              lockInRequired: lockInMonths
            });
            totalRefundAmount += refundAfterPenalty;
            totalPenaltyAmount += penaltyAmount;
          }
        });
      }

      console.log('Lock-in analysis:', { eligibleRefunds, lockInViolations, totalRefundAmount, totalPenaltyAmount });

      // Show lock-in period confirmation dialog
      let confirmationMessage = '';
      
      if (lockInViolations.length > 0) {
        confirmationMessage = `⚠️ LOCK-IN PERIOD WARNING ⚠️

Some investments have not completed their lock-in period:

${lockInViolations.map(violation => 
  `🔒 ${violation.series}:
  • Investment: ₹${violation.amount.toLocaleString('en-IN')}
  • Lock-in: ${violation.monthsCompleted}/${violation.lockInRequired} months completed
  • Remaining: ${violation.monthsRemaining} months
  • Early Exit Penalty: ₹${violation.penaltyAmount.toLocaleString('en-IN')} (2%)
  • Refund After Penalty: ₹${violation.refundAmount.toLocaleString('en-IN')}`
).join('\n\n')}

${eligibleRefunds.length > 0 ? `\n✅ ELIGIBLE FOR FULL REFUND:\n${eligibleRefunds.map(refund => 
  `• ${refund.series}: ₹${refund.amount.toLocaleString('en-IN')} (${refund.monthsCompleted} months completed)`
).join('\n')}` : ''}

💰 TOTAL REFUND: ₹${totalRefundAmount.toLocaleString('en-IN')}
💸 TOTAL PENALTY: ₹${totalPenaltyAmount.toLocaleString('en-IN')}

⚠️ WARNING: Early exit from lock-in period will result in penalty charges.

Do you want to proceed with account deletion?`;
      } else {
        confirmationMessage = `✅ LOCK-IN PERIOD COMPLETED

All investments have completed their lock-in period:

${eligibleRefunds.map(refund => 
  `✅ ${refund.series}: ₹${refund.amount.toLocaleString('en-IN')} (${refund.monthsCompleted} months completed)`
).join('\n')}

💰 TOTAL REFUND: ₹${totalRefundAmount.toLocaleString('en-IN')}
💸 NO PENALTIES: All lock-in periods satisfied

The investor is eligible for full refund without penalties.

Proceed with account deletion?`;
      }

      // Show confirmation dialog
      const userConfirmed = confirm(confirmationMessage);
      if (!userConfirmed) {
        console.log('User cancelled deletion due to lock-in period');
        setConfirmAction(null);
        return;
      }

      // Combine all refund details for processing
      const allRefundDetails = [...eligibleRefunds, ...lockInViolations];

      // Update series data - remove investor's funds and reduce investor count
      const updatedSeries = currentSeries.map(s => {
        const investorInThisSeries = allRefundDetails.find(detail => detail.series === s.name);
        if (investorInThisSeries) {
          const amountToRemove = investorInThisSeries.status === 'eligible' 
            ? investorInThisSeries.amount 
            : investorInThisSeries.amount; // Remove full original amount from series
          console.log(`Removing ₹${amountToRemove} from ${s.name}`);
          return {
            ...s,
            fundsRaised: Math.max(0, s.fundsRaised - amountToRemove),
            investors: Math.max(0, s.investors - 1)
          };
        }
        return s;
      });

      // Save updated series to localStorage
      localStorage.setItem('series', JSON.stringify(updatedSeries));
      setSeries(updatedSeries);
      console.log('Updated series data:', updatedSeries);

      // PERMANENT DELETION - Mark as deleted and remove all access
      currentInvestors[investorIndex] = {
        ...currentInvestors[investorIndex],
        active: false,
        status: 'deleted',
        deletedAt: new Date().toISOString(),
        canLogin: false, // Explicitly block login
        canEdit: false,  // Block editing
        accessBlocked: true, // General access block
        refundAmount: totalRefundAmount, // Store net refund amount
        penaltyAmount: totalPenaltyAmount, // Store penalty amount
        refundDetails: allRefundDetails, // Store detailed breakdown
        lockInViolations: lockInViolations, // Store lock-in violations
        eligibleRefunds: eligibleRefunds, // Store eligible refunds
        refundProcessed: true // Mark that refund has been calculated
      };

      console.log('Permanently deleted investor:', currentInvestors[investorIndex]);

      // Save directly to localStorage
      localStorage.setItem('investors', JSON.stringify(currentInvestors));
      console.log('Saved to localStorage');

      // Update the React state
      setInvestors(currentInvestors);
      console.log('Updated React state');

      // Add audit log with lock-in period details
      addAuditLog({
        action: 'PERMANENTLY DELETED Investor with Lock-in Analysis',
        adminName: user ? user.name : 'Admin',
        adminRole: user ? user.displayRole : 'Admin',
        details: `PERMANENTLY DELETED investor "${investor.name}" (ID: ${investor.investorId}) - Net refund: ₹${totalRefundAmount.toLocaleString('en-IN')}, Penalties: ₹${totalPenaltyAmount.toLocaleString('en-IN')}`,
        entityType: 'Investor',
        entityId: investor.investorId,
        changes: {
          investorName: investor.name,
          investorId: investor.investorId,
          status: 'deleted',
          canLogin: false,
          canEdit: false,
          accessBlocked: true,
          netRefundAmount: totalRefundAmount,
          penaltyAmount: totalPenaltyAmount,
          lockInViolations: lockInViolations.length,
          eligibleRefunds: eligibleRefunds.length,
          seriesUpdated: allRefundDetails.map(d => d.series)
        }
      });

      // Show final success message with lock-in details
      const successMessage = `✅ INVESTOR ACCOUNT PERMANENTLY DELETED!

📊 LOCK-IN PERIOD ANALYSIS:
${lockInViolations.length > 0 ? `⚠️ Early Exit Penalties: ${lockInViolations.length} investments
` : ''}${eligibleRefunds.length > 0 ? `✅ Completed Lock-in: ${eligibleRefunds.length} investments
` : ''}
💰 NET REFUND AMOUNT: ₹${totalRefundAmount.toLocaleString('en-IN')}
${totalPenaltyAmount > 0 ? `💸 TOTAL PENALTIES: ₹${totalPenaltyAmount.toLocaleString('en-IN')}` : '🎉 NO PENALTIES APPLIED'}

🔒 Account Status: All access permanently revoked
📋 Data Status: Preserved for reference and audit purposes
💸 Refund Status: Amount calculated with lock-in period considerations

The investor's funds have been processed according to lock-in period rules.`;

      alert(successMessage);
      
      // Navigate back immediately
      navigate('/investors');
      
    } catch (error) {
      console.error('Error permanently deleting investor:', error);
      alert('Error deleting investor: ' + error.message);
    }
  };

  // Handle deactivate/activate investor - SIMPLIFIED VERSION
  const handleToggleActivation = () => {
    console.log('=== TOGGLE ACTIVATION FUNCTION CALLED ===');
    
    const isCurrentlyActive = investor.active !== false && investor.status !== 'deactivated';
    const newAction = isCurrentlyActive ? 'deactivate' : 'activate';
    
    console.log('isCurrentlyActive:', isCurrentlyActive, 'newAction:', newAction, 'confirmAction:', confirmAction);
    
    if (confirmAction !== newAction) {
      console.log('Setting confirmAction to:', newAction);
      setConfirmAction(newAction);
      return;
    }

    console.log('=== PROCEEDING WITH', newAction.toUpperCase(), '===');

    try {
      // Get current investors from localStorage directly
      const currentInvestors = JSON.parse(localStorage.getItem('investors') || '[]');
      console.log('Current investors from localStorage:', currentInvestors);
      
      // Find the investor by investorId (more reliable than id)
      const investorIndex = currentInvestors.findIndex(inv => 
        inv.investorId === investor.investorId || 
        inv.id === investor.id || 
        inv.id === parseInt(id)
      );
      
      console.log('Found investor at index:', investorIndex);
      
      if (investorIndex === -1) {
        console.error('Investor not found for activation toggle');
        alert('Error: Investor not found');
        return;
      }

      // Update status
      currentInvestors[investorIndex] = {
        ...currentInvestors[investorIndex],
        active: !isCurrentlyActive,
        status: isCurrentlyActive ? 'deactivated' : 'active',
        [isCurrentlyActive ? 'deactivatedAt' : 'activatedAt']: new Date().toISOString()
      };

      console.log('Updated investor:', currentInvestors[investorIndex]);

      // Save directly to localStorage
      localStorage.setItem('investors', JSON.stringify(currentInvestors));
      console.log('Saved to localStorage');

      // Update the React state
      setInvestors(currentInvestors);
      console.log('Updated React state');

      // Add audit log
      addAuditLog({
        action: isCurrentlyActive ? 'Deactivated Investor' : 'Activated Investor',
        adminName: user ? user.name : 'Admin',
        adminRole: user ? user.displayRole : 'Admin',
        details: `${isCurrentlyActive ? 'Deactivated' : 'Activated'} investor "${investor.name}" (ID: ${investor.investorId})`,
        entityType: 'Investor',
        entityId: investor.investorId,
        changes: {
          investorName: investor.name,
          investorId: investor.investorId,
          status: isCurrentlyActive ? 'deactivated' : 'active',
          active: !isCurrentlyActive
        }
      });

      setConfirmAction(null);
      alert(`Investor ${isCurrentlyActive ? 'deactivated' : 'activated'} successfully!`);
      
      // Refresh the page to show changes
      window.location.reload();
      
    } catch (error) {
      console.error('Error toggling activation:', error);
      alert('Error updating investor: ' + error.message);
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
              console.log('Edit Investor button clicked!');
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
              console.log('Setting showEditModal to true');
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
            <h2 className="section-title">Active Holdings</h2>
            <div className="table-card">
              {investor.holdings && investor.holdings.length > 0 ? (
                <table className="holdings-table">
                  <thead>
                    <tr>
                      <th>Series</th>
                      <th>Purchase Date</th>
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
                        <td>{holding.purchaseDate}</td>
                        <td className="investment-cell">{formatCurrency(holding.investment)}</td>
                        <td>{holding.nextPayout}</td>
                        <td>
                          <span className="status-pill active">{holding.status}</span>
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
                        </div>
                      </div>
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
                  {investor.transactions.slice(0, 10).map((transaction, index) => (
                    <div key={index} className="transaction-item">
                      <div className="transaction-info">
                        <div className="transaction-type">{transaction.type}</div>
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
                  {investor.transactions.length > 10 && (
                    <div className="transaction-item more-transactions">
                      <span>... and {investor.transactions.length - 10} more transactions</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="empty-state">
                  <p>No transactions available</p>
                  <span>Transactions will appear here once the investor makes investments</span>
                </div>
              )}
            </div>

            {/* All Complaints - Only show if investor has complaints */}
            {investorComplaints.length > 0 && (
              <div className="section-card complaints-section">
                <h2 className="section-title">
                  <MdReportProblem className="section-icon" />
                  All Complaints ({investorComplaints.length})
                </h2>
                <div className="complaints-table-container">
                  <table className="complaints-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Issue</th>
                        <th>Remarks</th>
                        <th>Timestamp</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {investorComplaints.map((complaint, index) => (
                        <tr key={complaint.id} className={complaint.status === 'resolved' ? 'resolved-row' : 'pending-row'}>
                          <td>{index + 1}</td>
                          <td>{complaint.issue}</td>
                          <td>
                            <div className="remarks-cell">{complaint.remarks}</div>
                          </td>
                          <td>{complaint.timestamp}</td>
                          <td>
                            <span className={`status-badge ${complaint.status}`}>
                              {complaint.status === 'resolved' ? 'Resolved' : 'Pending'}
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
      </div>
    </Layout>
  );
};

export default InvestorDetails;
