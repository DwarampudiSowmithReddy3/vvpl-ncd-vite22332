// Global Audit Service for All Pages
// This service will be used by ALL pages to log CRUD operations

import apiService from './api';

class AuditService {
  constructor() {
    this.isEnabled = true;
  }

  // Generic audit log creation
  async logAction(actionData) {
    // TEMPORARILY DISABLED - audit logging was causing infinite loop and 422 errors
    console.log('🔄 AuditService: Audit logging temporarily disabled to prevent infinite loop');
    return;
    
    if (!this.isEnabled) return;

    try {
      console.log('🔄 AuditService: Logging action:', actionData);
      
      // Ensure all required fields are present and properly formatted
      const auditData = {
        action: actionData.action || 'Unknown Action',
        admin_name: actionData.adminName || 'System User',
        admin_role: actionData.adminRole || 'User',
        details: actionData.details || 'No details provided',
        entity_type: actionData.entityType || null,
        entity_id: actionData.entityId || null,
        changes: actionData.changes || {}
      };

      // Validate required fields before sending
      if (!auditData.action || !auditData.admin_name || !auditData.details) {
        console.warn('⚠️ AuditService: Missing required fields, skipping audit log');
        return;
      }

      await apiService.createAuditLog(auditData);
      console.log('✅ AuditService: Action logged successfully');
    } catch (error) {
      console.error('❌ AuditService: Failed to log action:', error);
      // Don't throw error - audit logging should not break operations
    }
  }

  // Generic activity logging method (used by Layout and other components)
  async logActivity(action, details, entityType = null, entityId = null, changes = null) {
    await this.logAction({
      action: action,
      adminName: 'System User',
      adminRole: 'User', 
      details: details,
      entityType: entityType,
      entityId: entityId,
      changes: changes
    });
  }

  // NCD Series Operations
  async logSeriesCreated(seriesData, adminInfo) {
    await this.logAction({
      action: 'Created NCD Series',
      adminName: adminInfo.name,
      adminRole: adminInfo.role,
      details: `Created new NCD series "${seriesData.name}" with amount ₹${seriesData.amount}`,
      entityType: 'NCD Series',
      entityId: seriesData.name,
      changes: {
        seriesName: seriesData.name,
        amount: seriesData.amount,
        maturityPeriod: seriesData.maturityPeriod,
        interestRate: seriesData.interestRate,
        action: 'series_created'
      }
    });
  }

  async logSeriesUpdated(seriesData, changes, adminInfo) {
    await this.logAction({
      action: 'Updated NCD Series',
      adminName: adminInfo.name,
      adminRole: adminInfo.role,
      details: `Updated ${changes.join(', ')} for NCD series "${seriesData.name}"`,
      entityType: 'NCD Series',
      entityId: seriesData.name,
      changes: {
        seriesName: seriesData.name,
        fields: changes,
        action: 'series_updated'
      }
    });
  }

  async logSeriesDeleted(seriesData, adminInfo) {
    await this.logAction({
      action: 'Deleted NCD Series',
      adminName: adminInfo.name,
      adminRole: adminInfo.role,
      details: `Deleted NCD series "${seriesData.name}"`,
      entityType: 'NCD Series',
      entityId: seriesData.name,
      changes: {
        seriesName: seriesData.name,
        action: 'series_deleted'
      }
    });
  }

  // Investor Operations
  async logInvestorCreated(investorData, adminInfo) {
    await this.logAction({
      action: 'Created Investor',
      adminName: adminInfo.name,
      adminRole: adminInfo.role,
      details: `Created new investor "${investorData.name}" (${investorData.email})`,
      entityType: 'Investor',
      entityId: investorData.name,
      changes: {
        investorName: investorData.name,
        email: investorData.email,
        phone: investorData.phone,
        action: 'investor_created'
      }
    });
  }

  async logInvestorUpdated(investorData, changes, adminInfo) {
    await this.logAction({
      action: 'Updated Investor',
      adminName: adminInfo.name,
      adminRole: adminInfo.role,
      details: `Updated ${changes.join(', ')} for investor "${investorData.name}"`,
      entityType: 'Investor',
      entityId: investorData.name,
      changes: {
        investorName: investorData.name,
        fields: changes,
        action: 'investor_updated'
      }
    });
  }

  async logInvestorDeleted(investorData, adminInfo) {
    await this.logAction({
      action: 'Deleted Investor',
      adminName: adminInfo.name,
      adminRole: adminInfo.role,
      details: `Deleted investor "${investorData.name}"`,
      entityType: 'Investor',
      entityId: investorData.name,
      changes: {
        investorName: investorData.name,
        action: 'investor_deleted'
      }
    });
  }

  // Interest Payout Operations
  async logPayoutProcessed(payoutData, adminInfo) {
    await this.logAction({
      action: 'Processed Interest Payout',
      adminName: adminInfo.name,
      adminRole: adminInfo.role,
      details: `Processed interest payout of ₹${payoutData.amount} for ${payoutData.investorCount} investors`,
      entityType: 'Interest Payout',
      entityId: payoutData.batchId,
      changes: {
        amount: payoutData.amount,
        investorCount: payoutData.investorCount,
        payoutDate: payoutData.date,
        action: 'payout_processed'
      }
    });
  }

  async logPayoutImported(importData, adminInfo) {
    await this.logAction({
      action: 'Imported Payout Data',
      adminName: adminInfo.name,
      adminRole: adminInfo.role,
      details: `Imported payout data for ${importData.recordCount} records`,
      entityType: 'Interest Payout',
      entityId: importData.fileName,
      changes: {
        fileName: importData.fileName,
        recordCount: importData.recordCount,
        action: 'payout_imported'
      }
    });
  }

  // Report Operations
  async logReportGenerated(reportData, adminInfo) {
    await this.logAction({
      action: 'Generated Report',
      adminName: adminInfo?.name || 'System User',
      adminRole: adminInfo?.role || 'User',
      details: `Generated ${reportData.type} report "${reportData.name}"`,
      entityType: 'Report',
      entityId: reportData.name,
      changes: {
        reportType: reportData.type,
        reportName: reportData.name,
        dateRange: reportData.dateRange,
        action: 'report_generated'
      }
    });
  }

  async logReportDownloaded(reportData, adminInfo) {
    await this.logAction({
      action: 'Downloaded Report',
      adminName: adminInfo?.name || 'System User',
      adminRole: adminInfo?.role || 'User',
      details: `Downloaded ${reportData.type} report "${reportData.name}" (${reportData.format})`,
      entityType: 'Report',
      entityId: reportData.name,
      changes: {
        reportType: reportData.type,
        reportName: reportData.name,
        format: reportData.format,
        action: 'report_downloaded'
      }
    });
  }

  // Communication Operations
  async logMessageSent(messageData, adminInfo) {
    await this.logAction({
      action: 'Sent Message',
      adminName: adminInfo?.name || 'System User',
      adminRole: adminInfo?.role || 'User',
      details: `Sent ${messageData.type} message to ${messageData.recipientCount} recipients: "${messageData.subject}"`,
      entityType: 'Communication',
      entityId: messageData.subject,
      changes: {
        messageType: messageData.type,
        subject: messageData.subject,
        recipientCount: messageData.recipientCount,
        action: 'message_sent'
      }
    });
  }

  // Compliance Operations
  async logComplianceCheck(complianceData, adminInfo) {
    await this.logAction({
      action: 'Compliance Check',
      adminName: adminInfo?.name || 'System User',
      adminRole: adminInfo?.role || 'User',
      details: `Performed compliance check for ${complianceData.entityType}: ${complianceData.result}`,
      entityType: 'Compliance',
      entityId: complianceData.entityId,
      changes: {
        entityType: complianceData.entityType,
        result: complianceData.result,
        checkType: complianceData.checkType,
        action: 'compliance_check'
      }
    });
  }

  // Approval Operations
  async logApprovalAction(approvalData, adminInfo) {
    await this.logAction({
      action: `${approvalData.action} Request`,
      adminName: adminInfo?.name || 'System User',
      adminRole: adminInfo?.role || 'User',
      details: `${approvalData.action} ${approvalData.requestType} request for ${approvalData.entityName}`,
      entityType: 'Approval',
      entityId: approvalData.entityName,
      changes: {
        requestType: approvalData.requestType,
        action: approvalData.action.toLowerCase(),
        entityName: approvalData.entityName,
        reason: approvalData.reason
      }
    });
  }

  // Grievance Operations
  async logGrievanceCreated(grievanceData, adminInfo) {
    await this.logAction({
      action: 'Created Grievance',
      adminName: adminInfo?.name || 'System User',
      adminRole: adminInfo?.role || 'User',
      details: `New grievance created: "${grievanceData.subject}" by ${grievanceData.investorName}`,
      entityType: 'Grievance',
      entityId: grievanceData.id,
      changes: {
        grievanceId: grievanceData.id,
        subject: grievanceData.subject,
        investorName: grievanceData.investorName,
        priority: grievanceData.priority,
        action: 'grievance_created'
      }
    });
  }

  async logGrievanceUpdated(grievanceData, changes, adminInfo) {
    await this.logAction({
      action: 'Updated Grievance',
      adminName: adminInfo?.name || 'System User',
      adminRole: adminInfo?.role || 'User',
      details: `Updated grievance "${grievanceData.subject}" - ${changes.join(', ')}`,
      entityType: 'Grievance',
      entityId: grievanceData.id,
      changes: {
        grievanceId: grievanceData.id,
        subject: grievanceData.subject,
        fields: changes,
        action: 'grievance_updated'
      }
    });
  }

  // File Operations
  async logFileUploaded(fileData, adminInfo) {
    await this.logAction({
      action: 'Uploaded File',
      adminName: adminInfo?.name || 'System User',
      adminRole: adminInfo?.role || 'User',
      details: `Uploaded file "${fileData.fileName}" (${fileData.fileSize}) to ${fileData.module}`,
      entityType: 'File',
      entityId: fileData.fileName,
      changes: {
        fileName: fileData.fileName,
        fileSize: fileData.fileSize,
        module: fileData.module,
        action: 'file_uploaded'
      }
    });
  }

  async logFileDeleted(fileData, adminInfo) {
    await this.logAction({
      action: 'Deleted File',
      adminName: adminInfo?.name || 'System User',
      adminRole: adminInfo?.role || 'User',
      details: `Deleted file "${fileData.fileName}" from ${fileData.module}`,
      entityType: 'File',
      entityId: fileData.fileName,
      changes: {
        fileName: fileData.fileName,
        module: fileData.module,
        action: 'file_deleted'
      }
    });
  }

  // Generic Operations for any page
  async logGenericAction(action, details, entityType, entityId, changes = null) {
    await this.logAction({
      action: action,
      adminName: 'System User',
      adminRole: 'User',
      details: details,
      entityType: entityType,
      entityId: entityId,
      changes: changes
    });
  }

  // Page access logging (used by Layout.jsx)
  async logPageAccess(pageName, userInfo = null) {
    // TEMPORARILY DISABLED - was causing infinite loop and 422 errors
    // await this.logAction({
    //   action: 'Page Access',
    //   adminName: userInfo?.name || 'System User',
    //   adminRole: userInfo?.role || 'User',
    //   details: `Accessed ${pageName} page`,
    //   entityType: 'Page',
    //   entityId: pageName,
    //   changes: { page: pageName, timestamp: new Date().toISOString() }
    // });
    console.log('📄 Page access logged (disabled):', pageName);
  }

  // Dashboard metrics view logging (used by Dashboard.jsx)
  async logDashboardMetricsView(userInfo = null) {
    // TEMPORARILY DISABLED - was causing infinite loop and 422 errors
    // await this.logAction({
    //   action: 'Dashboard Metrics View',
    //   adminName: userInfo?.name || 'System User', 
    //   adminRole: userInfo?.role || 'User',
    //   details: 'Viewed dashboard metrics and statistics',
    //   entityType: 'Dashboard',
    //   entityId: 'metrics',
    //   changes: { action: 'metrics_viewed', timestamp: new Date().toISOString() }
    // });
    console.log('📊 Dashboard metrics view logged (disabled)');
  }
}

// Export singleton instance
const auditService = new AuditService();
export default auditService;