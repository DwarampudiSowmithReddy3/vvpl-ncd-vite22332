import React, { useState, useRef } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import Layout from '../components/Layout';
import './Communication.css';
import { HiOutlineMail, HiOutlineDeviceMobile, HiOutlineDownload, HiOutlineUpload } from 'react-icons/hi';
import { MdSend, MdHistory, MdAdd, MdClose } from 'react-icons/md';
import * as XLSX from 'xlsx';
import { sendSMS, sendEmail } from '../utils/communicationService';

const Communication = () => {
  const { showCreateButton, canEdit } = usePermissions();
  const { user } = useAuth();
  const { addAuditLog } = useData();
  const [activeTab, setActiveTab] = useState('sms');
  const [investorData, setInvestorData] = useState([]);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [showTemplateSection, setShowTemplateSection] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [customMessage, setCustomMessage] = useState(''); // Custom message for bulk contacts
  const [isSending, setIsSending] = useState(false);
  const [communicationHistory, setCommunicationHistory] = useState([]);
  const [historyFilter, setHistoryFilter] = useState('all'); // 'all', 'sms', 'email'
  const [manualContacts, setManualContacts] = useState(''); // Changed to string for bulk input
  const [selectedTemplateManual, setSelectedTemplateManual] = useState(''); // Template for manual contacts
  const fileInputRef = useRef(null);

  // Default templates
  const smsTemplates = [
    {
      id: 'default',
      name: 'Default SMS Template',
      content: 'Dear {InvestorName}, your interest for the month of {InterestMonth} totaling {Amount} regarding {SeriesName} {Status} been processed from our end to your bank account {BankAccountNumber}.'
    }
  ];

  const emailTemplates = [
    {
      id: 'default',
      name: 'Default Email Template',
      content: 'Dear {InvestorName}, your interest for the month of {InterestMonth} totaling {Amount} regarding {SeriesName} {Status} been processed from our end to your bank account {BankAccountNumber}.'
    }
  ];

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    
    if (!file) return;

    // Validate file type
    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (fileExtension !== 'xlsx' && fileExtension !== 'xls') {
      alert('Please upload only Excel files (.xlsx or .xls)');
      return;
    }

    setUploadedFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        // Map Excel columns to our data structure
        const mappedData = jsonData.map((row, index) => {
          // Handle different possible column names
          const investorName = row['Investor Name'] || row['investor name'] || row['InvestorName'] || row['investorName'] || row['Name'] || '';
          const investorId = row['Investor ID'] || row['investor id'] || row['InvestorID'] || row['investorId'] || row['ID'] || '';
          const seriesName = row['Series Name'] || row['series name'] || row['SeriesName'] || row['seriesName'] || row['Series'] || '';
          const amountProcessed = row['Amount Processed'] || row['amount processed'] || row['AmountProcessed'] || row['amountProcessed'] || row['Amount'] || '';
          const status = row['Status'] || row['status'] || '';
          const interestMonth = row['Interest Month'] || row['interest month'] || row['InterestMonth'] || row['interestMonth'] || row['Month'] || '';
          const bankAccountNumber = row['Bank Account Number'] || row['bank account number'] || row['BankAccountNumber'] || row['bankAccountNumber'] || row['Account'] || '';
          const mobileNumber = row['Mobile Number'] || row['mobile number'] || row['MobileNumber'] || row['mobileNumber'] || row['Mobile'] || row['Phone'] || '';
          const emailId = row['Email ID'] || row['email id'] || row['EmailID'] || row['emailId'] || row['Email'] || row['Email Id'] || '';

          return {
            investorName,
            investorId,
            seriesName,
            amountProcessed,
            status,
            interestMonth,
            bankAccountNumber,
            mobileNumber,
            emailId
          };
        }).filter(row => row.investorName); // Filter out empty rows

        if (mappedData.length === 0) {
          alert('No valid data found in the Excel file. Please check the column headers.');
          return;
        }

        setInvestorData(mappedData);
        setShowTemplateSection(true); // Show template section after file upload
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        alert('Error reading Excel file. Please make sure it is a valid Excel file.');
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleDownloadSample = () => {
    // Create sample Excel data
    const sampleData = [
      {
        'Investor Name': 'Sowmith',
        'Investor ID': 'INV001',
        'Series Name': 'A',
        'Amount Processed': '1500000',
        'Status': 'had been',
        'Interest Month': 'January, 2026',
        'Bank Account Number': 'xxxxx789',
        'Mobile Number': '9063761569',
        'Email ID': 'dsowmithreddy@gmail.com'
      },
      {
        'Investor Name': 'Subbireddy',
        'Investor ID': 'INV002',
        'Series Name': 'B',
        'Amount Processed': '1700000',
        'Status': 'had been',
        'Interest Month': 'January, 2026',
        'Bank Account Number': 'xxxxx709',
        'Mobile Number': '9063761568',
        'Email ID': 'subbireddy@gmail.com'
      }
    ];

    // Create workbook
    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Investors');

    // Download file
    const fileName = 'sample_investor_data.xlsx';
    XLSX.writeFile(wb, fileName);
    
    // Add audit log for sample template download
    addAuditLog({
      action: 'Downloaded Report',
      adminName: user ? user.name : 'User',
      adminRole: user ? user.displayRole : 'User',
      details: `Downloaded sample investor data template (Excel format)`,
      entityType: 'Communication',
      entityId: 'Sample Template',
      changes: {
        documentType: 'Sample Template',
        fileName: fileName,
        format: 'Excel'
      }
    });
  };

  const replaceTemplateVariables = (template, investor) => {
    let message = template;
    
    // Format amount with currency
    const formattedAmount = `RS${investor.amountProcessed}`;
    
    // Replace all variables
    message = message.replace(/{InvestorName}/g, investor.investorName);
    message = message.replace(/{InvestorID}/g, investor.investorId);
    message = message.replace(/{SeriesName}/g, investor.seriesName);
    message = message.replace(/{Amount}/g, formattedAmount);
    message = message.replace(/{Status}/g, investor.status);
    message = message.replace(/{InterestMonth}/g, investor.interestMonth);
    message = message.replace(/{BankAccountNumber}/g, investor.bankAccountNumber);
    message = message.replace(/{MobileNumber}/g, investor.mobileNumber);
    message = message.replace(/{EmailID}/g, investor.emailId);
    
    return message;
  };

  const handleSendMessages = async () => {
    if (!selectedTemplate) {
      alert('Please select a template first.');
      return;
    }

    if (investorData.length === 0) {
      alert('Please upload an Excel file with investor data first.');
      return;
    }

    setIsSending(true);

    try {
      const templates = activeTab === 'sms' ? smsTemplates : emailTemplates;
      const template = templates.find(t => t.id === selectedTemplate);

      if (!template) {
        alert('Selected template not found.');
        setIsSending(false);
        return;
      }

      // Process each investor
      const results = [];
      const newHistoryEntries = [];
      
      for (const investor of investorData) {
        const personalizedMessage = replaceTemplateVariables(template.content, investor);
        
        // In a real application, you would call an API here to send SMS/Email
        // For now, we'll simulate the sending
        const contactInfo = activeTab === 'sms' ? investor.mobileNumber : investor.emailId;
        const messageType = activeTab === 'sms' ? 'SMS' : 'Email';
        
        if (!contactInfo) {
          results.push({
            investor: investor.investorName,
            status: 'Failed',
            reason: `No ${activeTab === 'sms' ? 'mobile number' : 'email ID'} provided`
          });
          
          // Add failed entry to history
          newHistoryEntries.push({
            id: Date.now() + Math.random(),
            timestamp: new Date().toISOString(),
            type: messageType,
            recipient: investor.investorName,
            contact: contactInfo || 'N/A',
            investorId: investor.investorId,
            message: personalizedMessage,
            status: 'Failed',
            error: `No ${activeTab === 'sms' ? 'mobile number' : 'email ID'} provided`,
            seriesName: investor.seriesName,
            amount: investor.amountProcessed,
            interestMonth: investor.interestMonth
          });
          continue;
        }

        // Send actual SMS or Email
        let sendResult;
        if (activeTab === 'sms') {
          sendResult = await sendSMS(contactInfo, personalizedMessage);
        } else {
          const subject = `Interest Payment Notification - ${investor.seriesName} Series`;
          const htmlContent = `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2 style="color: #2563eb;">Interest Payment Notification</h2>
              <p>${personalizedMessage}</p>
              <hr style="margin: 20px 0; border: none; border-top: 1px solid #e2e8f0;">
              <p style="font-size: 12px; color: #64748b;">
                This is an automated message from NCD System. Please do not reply to this email.
              </p>
            </div>
          `;
          sendResult = await sendEmail(contactInfo, subject, personalizedMessage, htmlContent);
        }

        if (sendResult.success) {
          results.push({
            investor: investor.investorName,
            status: 'Success',
            message: personalizedMessage
          });

          // Add successful entry to history
          newHistoryEntries.push({
            id: Date.now() + Math.random(),
            timestamp: new Date().toISOString(),
            type: messageType,
            recipient: investor.investorName,
            contact: contactInfo,
            investorId: investor.investorId,
            message: personalizedMessage,
            status: 'Success',
            messageId: sendResult.messageId,
            seriesName: investor.seriesName,
            amount: investor.amountProcessed,
            interestMonth: investor.interestMonth,
            bankAccount: investor.bankAccountNumber
          });
        } else {
          // Failed to send
          results.push({
            investor: investor.investorName,
            status: 'Failed',
            reason: sendResult.error || 'Unknown error'
          });

          // Add failed entry to history
          newHistoryEntries.push({
            id: Date.now() + Math.random(),
            timestamp: new Date().toISOString(),
            type: messageType,
            recipient: investor.investorName,
            contact: contactInfo,
            investorId: investor.investorId,
            message: personalizedMessage,
            status: 'Failed',
            error: sendResult.error || 'Failed to send message',
            seriesName: investor.seriesName,
            amount: investor.amountProcessed,
            interestMonth: investor.interestMonth
          });
        }
      }

      // Add all new entries to history (most recent first)
      setCommunicationHistory(prev => [...newHistoryEntries.reverse(), ...prev]);
      
      const successCount = results.filter(r => r.status === 'Success').length;
      const failedCount = results.filter(r => r.status === 'Failed').length;
      
      // Add audit log for bulk message sending
      addAuditLog({
        action: activeTab === 'sms' ? 'Sent SMS' : 'Sent Email',
        adminName: user ? user.name : 'User',
        adminRole: user ? user.displayRole : 'User',
        details: `Sent ${successCount} ${activeTab.toUpperCase()} message(s) to investors (${failedCount} failed). Template: ${template.name}`,
        entityType: 'Communication',
        entityId: `Bulk ${activeTab.toUpperCase()}`,
        changes: {
          messageType: activeTab.toUpperCase(),
          template: template.name,
          totalRecipients: investorData.length,
          successCount: successCount,
          failedCount: failedCount,
          uploadedFile: uploadedFileName
        }
      });
      
      alert(`Successfully sent ${successCount} ${activeTab.toUpperCase()} message(s)!`);
      
      // Clear the data after sending (optional)
      // setInvestorData([]);
      // setUploadedFileName('');
      
    } catch (error) {
      console.error('Error sending messages:', error);
      alert('Error sending messages. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Bulk contact handlers
  const formatPhoneNumbers = (input) => {
    // Remove all non-digit characters
    const digitsOnly = input.replace(/\D/g, '');
    
    // Split into groups of 10 digits and join with commas
    const phoneNumbers = [];
    for (let i = 0; i < digitsOnly.length; i += 10) {
      const phoneNumber = digitsOnly.substr(i, 10);
      if (phoneNumber.length === 10) {
        phoneNumbers.push(phoneNumber);
      } else if (phoneNumber.length > 0) {
        // Handle partial numbers at the end
        phoneNumbers.push(phoneNumber);
      }
    }
    
    return phoneNumbers.join(', ');
  };

  const formatEmails = (input) => {
    // If input is empty, return empty
    if (!input.trim()) return '';
    
    // Always try to extract emails using regex first
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = input.match(emailPattern) || [];
    
    if (emails.length > 1) {
      // Multiple emails found - join with commas
      return emails.join(', ');
    } else if (emails.length === 1) {
      // Single email found - return as is
      return emails[0];
    }
    
    // If no emails found by regex, try manual splitting
    const manualEmails = input
      .split(/[,;\s\n]+/)
      .map(email => email.trim())
      .filter(email => email.length > 0);
    
    return manualEmails.join(', ');
  };

  const handleBulkContactChange = (value) => {
    if (activeTab === 'sms') {
      // Auto-format phone numbers
      const formatted = formatPhoneNumbers(value);
      setManualContacts(formatted);
    } else {
      // Auto-format emails
      const formatted = formatEmails(value);
      setManualContacts(formatted);
    }
  };

  const getValidBulkContacts = () => {
    if (!manualContacts.trim()) return [];
    
    if (activeTab === 'sms') {
      // Extract phone numbers
      return manualContacts
        .split(',')
        .map(phone => phone.trim())
        .filter(phone => phone.length === 10 && /^\d{10}$/.test(phone));
    } else {
      // For emails, first try to extract using regex (handles concatenated emails)
      const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const regexEmails = manualContacts.match(emailPattern) || [];
      
      if (regexEmails.length > 0) {
        // Validate each email found by regex
        return regexEmails.filter(email => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(email.trim());
        });
      }
      
      // Fallback: split by commas for manually separated emails
      return manualContacts
        .split(',')
        .map(email => email.trim())
        .filter(email => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(email);
        });
    }
  };

  // Manual contact handlers (keeping for backward compatibility but not used)
  const handleManualContactChange = (index, value) => {
    // This function is no longer used but kept for compatibility
  };

  const handleAddManualContact = () => {
    // This function is no longer used but kept for compatibility
  };

  const handleRemoveManualContact = (index) => {
    // This function is no longer used but kept for compatibility
  };

  const getValidManualContacts = () => {
    // Updated to use bulk contacts
    return getValidBulkContacts();
  };

  const handleSendManualMessages = async () => {
    if (!selectedTemplateManual) {
      alert('Please select a template first.');
      return;
    }

    const validContacts = getValidManualContacts();
    if (validContacts.length === 0) {
      alert('Please enter at least one contact.');
      return;
    }

    setIsSending(true);

    try {
      const templates = activeTab === 'sms' ? smsTemplates : emailTemplates;
      const template = templates.find(t => t.id === selectedTemplateManual);

      if (!template) {
        alert('Selected template not found.');
        setIsSending(false);
        return;
      }

      const results = [];
      const newHistoryEntries = [];
      const messageType = activeTab === 'sms' ? 'SMS' : 'Email';

      // For manual contacts, we'll send the template as-is without variable replacement
      // since we don't have investor data
      const message = template.content;

      for (const contact of validContacts) {
        let sendResult;
        if (activeTab === 'sms') {
          sendResult = await sendSMS(contact, message);
        } else {
          const subject = `Interest Payment Notification`;
          const htmlContent = `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2 style="color: #2563eb;">Interest Payment Notification</h2>
              <p>${message}</p>
              <hr style="margin: 20px 0; border: none; border-top: 1px solid #e2e8f0;">
              <p style="font-size: 12px; color: #64748b;">
                This is an automated message from NCD System. Please do not reply to this email.
              </p>
            </div>
          `;
          sendResult = await sendEmail(contact, subject, message, htmlContent);
        }

        if (sendResult.success) {
          results.push({
            contact: contact,
            status: 'Success',
          });

          newHistoryEntries.push({
            id: Date.now() + Math.random(),
            timestamp: new Date().toISOString(),
            type: messageType,
            recipient: contact,
            contact: contact,
            message: message,
            status: 'Success',
            messageId: sendResult.messageId,
          });
        } else {
          results.push({
            contact: contact,
            status: 'Failed',
            reason: sendResult.error || 'Unknown error',
          });

          newHistoryEntries.push({
            id: Date.now() + Math.random(),
            timestamp: new Date().toISOString(),
            type: messageType,
            recipient: contact,
            contact: contact,
            message: message,
            status: 'Failed',
            error: sendResult.error || 'Failed to send message',
          });
        }
      }

      setCommunicationHistory(prev => [...newHistoryEntries.reverse(), ...prev]);
      alert(`Successfully sent ${results.filter(r => r.status === 'Success').length} ${messageType} message(s)!`);
      
      // Clear manual contacts after sending
      setManualContacts('');
      setSelectedTemplateManual('');

    } catch (error) {
      console.error('Error sending messages:', error);
      alert('Error sending messages. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Layout>
      <div className="communication">
        <div className="communication-header">
          <h1 className="communication-title">Communication Center</h1>
          <p className="communication-subtitle">
            Send SMS and Email notifications to investors and manage communication history.
          </p>
        </div>

        {/* Communication Type Tabs */}
        <div className="communication-tabs">
          <button 
            className={`tab-button ${activeTab === 'sms' ? 'active' : ''}`}
            onClick={() => setActiveTab('sms')}
          >
            <HiOutlineDeviceMobile size={20} />
            SMS Messages
          </button>
          <button 
            className={`tab-button ${activeTab === 'email' ? 'active' : ''}`}
            onClick={() => setActiveTab('email')}
          >
            <HiOutlineMail size={20} />
            Email Messages
          </button>
          <button 
            className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <MdHistory size={20} />
            Communication History
          </button>
        </div>

        {/* Tab Content */}
        <div className="communication-content">
          {activeTab === 'sms' && (
            <div className="communication-section">
              <div className="section-card">
                <div className="card-header">
                  <HiOutlineDeviceMobile size={24} />
                  <h3>SMS Communication</h3>
                </div>
                <div className="card-content">
                  {/* Upload Section */}
                  <div className="upload-section">
                    <div className="button-group">
                      <button className="action-btn download-btn" onClick={handleDownloadSample}>
                        <HiOutlineDownload size={20} />
                        Download Sample
                      </button>
                      <button className="action-btn upload-btn" onClick={handleUploadClick}>
                        <HiOutlineUpload size={20} />
                        Upload File
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                      />
                    </div>
                    {uploadedFileName && (
                      <div className="uploaded-file-info">
                        <span className="file-name">📄 {uploadedFileName}</span>
                        <span className="file-count">{investorData.length} investor(s) loaded</span>
                      </div>
                    )}

                    {/* Manual Contact Input Section */}
                    {!uploadedFileName && (
                      <div className="manual-contact-section">
                        <label className="manual-contact-label">
                          Enter Mobile Numbers (Bulk Input)
                        </label>
                        <div className="bulk-input-container">
                          <textarea
                            placeholder="Paste mobile numbers here. They'll be auto-formatted with commas every 10 digits.&#10;Example: 98765432109876543210 → 9876543210, 9876543210"
                            value={manualContacts}
                            onChange={(e) => handleBulkContactChange(e.target.value)}
                            className="bulk-contact-textarea"
                            rows="3"
                          />
                          <div className="input-info">
                            <span className="contact-count">
                              {getValidBulkContacts().length} valid phone number(s) detected
                            </span>
                            <span className="format-hint">
                              Tip: Just paste numbers - they'll be auto-formatted with commas
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Template Section for Manual Contacts (shown when at least one contact is entered) */}
                    {!uploadedFileName && getValidManualContacts().length > 0 && (
                      <div className="template-section">
                        <div className="template-selector">
                          <label htmlFor="template-select-manual-sms">Select Template:</label>
                          <select
                            id="template-select-manual-sms"
                            value={selectedTemplateManual}
                            onChange={(e) => setSelectedTemplateManual(e.target.value)}
                            className="template-select"
                          >
                            <option value="">-- Select a template --</option>
                            {smsTemplates.map((template) => (
                              <option key={template.id} value={template.id}>
                                {template.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        {selectedTemplateManual && (
                          <div className="template-preview">
                            <label>Template Preview:</label>
                            <div className="preview-box">
                              {smsTemplates.find(t => t.id === selectedTemplateManual)?.content}
                            </div>
                          </div>
                        )}
                        <button
                          className="send-button"
                          onClick={handleSendManualMessages}
                          disabled={!showCreateButton('communication') || !selectedTemplateManual || getValidManualContacts().length === 0 || isSending}
                          style={{ 
                            opacity: showCreateButton('communication') ? 1 : 0.5,
                            cursor: showCreateButton('communication') ? 'pointer' : 'not-allowed'
                          }}
                        >
                          <MdSend size={20} />
                          {isSending ? 'Sending...' : 'Send Quick SMS'}
                        </button>
                      </div>
                    )}

                    {/* Extended Template Section (shown after file upload) */}
                    {showTemplateSection && investorData.length > 0 && (
                      <div className="template-section">
                        <div className="template-selector">
                          <label htmlFor="template-select">Select Template:</label>
                          <select
                            id="template-select"
                            value={selectedTemplate}
                            onChange={(e) => setSelectedTemplate(e.target.value)}
                            className="template-select"
                          >
                            <option value="">-- Select a template --</option>
                            {smsTemplates.map((template) => (
                              <option key={template.id} value={template.id}>
                                {template.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        {selectedTemplate && (
                          <div className="template-preview">
                            <label>Template Preview:</label>
                            <div className="preview-box">
                              {smsTemplates.find(t => t.id === selectedTemplate)?.content}
                            </div>
                          </div>
                        )}
                        <button
                          className="send-button"
                          onClick={handleSendMessages}
                          disabled={!selectedTemplate || investorData.length === 0 || isSending}
                        >
                          <MdSend size={20} />
                          {isSending ? 'Sending...' : 'Send Quick SMS'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'email' && (
            <div className="communication-section">
              <div className="section-card">
                <div className="card-header">
                  <HiOutlineMail size={24} />
                  <h3>Email Communication</h3>
                </div>
                <div className="card-content">
                  {/* Upload Section */}
                  <div className="upload-section">
                    <div className="button-group">
                      <button className="action-btn download-btn" onClick={handleDownloadSample}>
                        <HiOutlineDownload size={20} />
                        Download Sample
                      </button>
                      <button className="action-btn upload-btn" onClick={handleUploadClick}>
                        <HiOutlineUpload size={20} />
                        Upload File
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                      />
                    </div>
                    {uploadedFileName && (
                      <div className="uploaded-file-info">
                        <span className="file-name">📄 {uploadedFileName}</span>
                        <span className="file-count">{investorData.length} investor(s) loaded</span>
                      </div>
                    )}

                    {/* Manual Contact Input Section */}
                    {!uploadedFileName && (
                      <div className="manual-contact-section">
                        <label className="manual-contact-label">
                          Enter Email Addresses (Bulk Input)
                        </label>
                        <div className="bulk-input-container">
                          <textarea
                            placeholder="Paste email addresses here. They'll be auto-separated with commas.&#10;Example: john@gmail.comjane@yahoo.com → john@gmail.com, jane@yahoo.com"
                            value={manualContacts}
                            onChange={(e) => handleBulkContactChange(e.target.value)}
                            className="bulk-contact-textarea"
                            rows="3"
                          />
                          <div className="input-info">
                            <span className="contact-count">
                              {getValidBulkContacts().length} valid email address(es) detected
                            </span>
                            <span className="format-hint">
                              Tip: Just paste emails - they'll be auto-separated with commas
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Message Section for Manual Contacts (shown when at least one contact is entered) */}
                    {getValidManualContacts().length > 0 && (
                      <div className="template-section">
                        <div className="template-selector">
                          <label htmlFor="template-select-manual-email">Select Template:</label>
                          <select
                            id="template-select-manual-email"
                            value={selectedTemplateManual}
                            onChange={(e) => setSelectedTemplateManual(e.target.value)}
                            className="template-select"
                          >
                            <option value="">-- Select a template --</option>
                            {emailTemplates.map((template) => (
                              <option key={template.id} value={template.id}>
                                {template.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        {selectedTemplateManual && (
                          <div className="template-preview">
                            <label>Template Preview:</label>
                            <div className="preview-box">
                              {emailTemplates.find(t => t.id === selectedTemplateManual)?.content}
                            </div>
                          </div>
                        )}
                        <button
                          className="send-button"
                          onClick={handleSendManualMessages}
                          disabled={!selectedTemplateManual || getValidManualContacts().length === 0 || isSending}
                        >
                          <MdSend size={20} />
                          {isSending ? 'Sending...' : 'Send Quick Email'}
                        </button>
                      </div>
                    )}

                    {/* Extended Template Section (shown after file upload) */}
                    {showTemplateSection && investorData.length > 0 && (
                      <div className="template-section">
                        <div className="template-selector">
                          <label htmlFor="template-select-email">Select Template:</label>
                          <select
                            id="template-select-email"
                            value={selectedTemplate}
                            onChange={(e) => setSelectedTemplate(e.target.value)}
                            className="template-select"
                          >
                            <option value="">-- Select a template --</option>
                            {emailTemplates.map((template) => (
                              <option key={template.id} value={template.id}>
                                {template.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        {selectedTemplate && (
                          <div className="template-preview">
                            <label>Template Preview:</label>
                            <div className="preview-box">
                              {emailTemplates.find(t => t.id === selectedTemplate)?.content}
                            </div>
                          </div>
                        )}
                        <button
                          className="send-button"
                          onClick={handleSendMessages}
                          disabled={!selectedTemplate || investorData.length === 0 || isSending}
                        >
                          <MdSend size={20} />
                          {isSending ? 'Sending...' : 'Send Quick Email'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="communication-section">
              <div className="section-card">
                <div className="card-header">
                  <MdHistory size={24} />
                  <h3>Communication History</h3>
                </div>
                <div className="card-content">
                  {/* Filter Buttons */}
                  <div className="history-filters">
                    <button
                      className={`filter-btn ${historyFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setHistoryFilter('all')}
                    >
                      All ({communicationHistory.length})
                    </button>
                    <button
                      className={`filter-btn ${historyFilter === 'SMS' ? 'active' : ''}`}
                      onClick={() => setHistoryFilter('SMS')}
                    >
                      SMS ({communicationHistory.filter(h => h.type === 'SMS').length})
                    </button>
                    <button
                      className={`filter-btn ${historyFilter === 'Email' ? 'active' : ''}`}
                      onClick={() => setHistoryFilter('Email')}
                    >
                      Email ({communicationHistory.filter(h => h.type === 'Email').length})
                    </button>
                  </div>

                  {/* History Table */}
                  {communicationHistory.length === 0 ? (
                    <div className="empty-history">
                      <p>No communication history yet. Messages sent will appear here.</p>
                    </div>
                  ) : (
                    <div className="history-table-container">
                      <table className="history-table">
                        <thead>
                          <tr>
                            <th>Date & Time</th>
                            <th>Type</th>
                            <th>Recipient</th>
                            <th>Contact</th>
                            <th>Series</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Message</th>
                          </tr>
                        </thead>
                        <tbody>
                          {communicationHistory
                            .filter(entry => historyFilter === 'all' || entry.type === historyFilter)
                            .map((entry) => (
                              <tr key={entry.id}>
                                <td className="timestamp-cell">
                                  {new Date(entry.timestamp).toLocaleString()}
                                </td>
                                <td>
                                  <span className={`type-badge ${entry.type.toLowerCase()}`}>
                                    {entry.type === 'SMS' ? <HiOutlineDeviceMobile size={16} /> : <HiOutlineMail size={16} />}
                                    {entry.type}
                                  </span>
                                </td>
                                <td className="recipient-cell">
                                  <div className="recipient-name">{entry.recipient}</div>
                                  {entry.investorId && (
                                    <div className="recipient-id">ID: {entry.investorId}</div>
                                  )}
                                </td>
                                <td className="contact-cell">{entry.contact}</td>
                                <td>{entry.seriesName || '-'}</td>
                                <td>{entry.amount ? `RS${entry.amount}` : '-'}</td>
                                <td>
                                  <span className={`status-badge ${entry.status.toLowerCase()}`}>
                                    {entry.status}
                                  </span>
                                </td>
                                <td className="message-cell">
                                  <div className="message-preview" title={entry.message}>
                                    {entry.message.length > 50 
                                      ? `${entry.message.substring(0, 50)}...` 
                                      : entry.message}
                                  </div>
                                  {entry.error && (
                                    <div className="error-message">{entry.error}</div>
                                  )}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Communication;
