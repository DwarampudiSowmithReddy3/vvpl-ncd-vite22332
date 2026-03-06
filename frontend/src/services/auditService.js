import apiService from './api';

class AuditService {
  // Log user activities to database
  async logActivity(activityData) {
    try {
      // TEMPORARILY DISABLED - audit logging was causing infinite loop and 422 errors
      if (import.meta.env.DEV) { console.log('🔄 AuditService: Audit logging temporarily disabled to prevent infinite loop'); }
      return;
      
      const auditData = {
        action: activityData.action,
        admin_name: activityData.adminName || activityData.userName,
        admin_role: activityData.adminRole || activityData.userRole,
        details: activityData.details,
        entity_type: activityData.entityType || 'System',
        entity_id: activityData.entityId || 'N/A',
        changes: JSON.stringify(activityData.changes || {})
      };
      
      await apiService.createAuditLog(auditData);
      if (import.meta.env.DEV) { console.log('✅ Activity logged to database:', activityData.action); }
    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Failed to log activity:', error); }
      // Don't throw error - audit logging should not break main functionality
    }
  }

  // Dashboard specific logging
  async logDashboardAccess(userData) {
    await this.logPageAccess(userData, 'Dashboard');
  }

  async logDashboardMetricsView(userData, metricsViewed = []) {
    // TEMPORARILY DISABLED - was causing 422 errors due to incorrect data format
    if (import.meta.env.DEV) { console.log('🔄 Dashboard metrics logging temporarily disabled to prevent 422 errors'); }
    return;
    
    await this.logActivity({
      action: 'Dashboard Metrics Viewed',
      userName: userData.name || userData.full_name,
      userRole: userData.role || userData.displayRole,
      details: `User viewed dashboard metrics: ${Array.isArray(metricsViewed) ? metricsViewed.join(', ') : 'general metrics'}`,
      entityType: 'Dashboard',
      entityId: 'Metrics',
      changes: {
        username: userData.username,
        role: userData.role,
        metricsViewed: metricsViewed,
        timestamp: new Date().toISOString(),
        action: 'metrics_view'
      }
    });
  }

  // NCD Series specific logging
  async logSeriesCreate(userData, seriesData) {
    await this.logDataOperation(
      userData,
      'Series Created',
      'NCD Series',
      seriesData.name,
      `Created new NCD series "${seriesData.name}" with target amount ₹${seriesData.targetAmount?.toLocaleString()}`,
      {
        seriesName: seriesData.name,
        seriesCode: seriesData.seriesCode,
        interestRate: seriesData.interestRate,
        targetAmount: seriesData.targetAmount,
        status: seriesData.status,
        action: 'series_create'
      }
    );
  }

  // Alias for logSeriesCreate
  async logSeriesCreated(seriesData, userData) {
    return await this.logSeriesCreate(userData, seriesData);
  }

  async logSeriesUpdate(userData, seriesId, seriesName, oldData, newData) {
    const changes = {};
    Object.keys(newData).forEach(key => {
      if (oldData[key] !== newData[key]) {
        changes[key] = { from: oldData[key], to: newData[key] };
      }
    });

    await this.logDataOperation(
      userData,
      'Series Updated',
      'NCD Series',
      seriesName,
      `Updated NCD series "${seriesName}" - Modified: ${Object.keys(changes).join(', ')}`,
      {
        seriesId: seriesId,
        seriesName: seriesName,
        changes: changes,
        action: 'series_update'
      }
    );
  }

  async logSeriesDelete(userData, seriesData) {
    await this.logDataOperation(
      userData,
      'Series Deleted',
      'NCD Series',
      seriesData.name,
      `Deleted NCD series "${seriesData.name}" (Status: ${seriesData.status})`,
      {
        seriesId: seriesData.id,
        seriesName: seriesData.name,
        status: seriesData.status,
        targetAmount: seriesData.targetAmount,
        action: 'series_delete'
      }
    );
  }

  async logSeriesApproval(userData, seriesData, approvalData) {
    await this.logDataOperation(
      userData,
      'Series Approved',
      'NCD Series',
      seriesData.name,
      `Approved NCD series "${seriesData.name}" for release`,
      {
        seriesId: seriesData.id,
        seriesName: seriesData.name,
        approvalData: approvalData,
        action: 'series_approval'
      }
    );
  }

  async logSeriesRejection(userData, seriesData, rejectionReason) {
    await this.logDataOperation(
      userData,
      'Series Rejected',
      'NCD Series',
      seriesData.name,
      `Rejected NCD series "${seriesData.name}" - Reason: ${rejectionReason}`,
      {
        seriesId: seriesData.id,
        seriesName: seriesData.name,
        rejectionReason: rejectionReason,
        action: 'series_rejection'
      }
    );
  }

  // Investor specific logging
  async logInvestorCreate(userData, investorData) {
    await this.logDataOperation(
      userData,
      'Investor Created',
      'Investor',
      investorData.investorId,
      `Created new investor "${investorData.fullName}" (ID: ${investorData.investorId})`,
      {
        investorId: investorData.investorId,
        fullName: investorData.fullName,
        email: investorData.email,
        phone: investorData.phone,
        kycStatus: investorData.kycStatus,
        action: 'investor_create'
      }
    );
  }

  async logInvestorUpdate(userData, investorId, investorName, oldData, newData) {
    const changes = {};
    Object.keys(newData).forEach(key => {
      if (oldData[key] !== newData[key]) {
        changes[key] = { from: oldData[key], to: newData[key] };
      }
    });

    await this.logDataOperation(
      userData,
      'Investor Updated',
      'Investor',
      investorId,
      `Updated investor "${investorName}" - Modified: ${Object.keys(changes).join(', ')}`,
      {
        investorId: investorId,
        investorName: investorName,
        changes: changes,
        action: 'investor_update'
      }
    );
  }

  async logInvestorDelete(userData, investorData) {
    await this.logDataOperation(
      userData,
      'Investor Deleted',
      'Investor',
      investorData.investorId,
      `Deleted investor "${investorData.fullName}" (ID: ${investorData.investorId})`,
      {
        investorId: investorData.investorId,
        fullName: investorData.fullName,
        totalInvestment: investorData.investment,
        seriesInvolved: investorData.series,
        action: 'investor_delete'
      }
    );
  }

  async logInvestmentCreate(userData, investorData, seriesName, amount) {
    await this.logDataOperation(
      userData,
      'Investment Created',
      'Investment',
      `${investorData.investorId}-${seriesName}`,
      `Created investment of ₹${amount.toLocaleString()} for investor "${investorData.fullName}" in series "${seriesName}"`,
      {
        investorId: investorData.investorId,
        investorName: investorData.fullName,
        seriesName: seriesName,
        amount: amount,
        action: 'investment_create'
      }
    );
  }

  async logKYCStatusUpdate(userData, investorData, oldStatus, newStatus) {
    await this.logDataOperation(
      userData,
      'KYC Status Updated',
      'Investor',
      investorData.investorId,
      `Updated KYC status for investor "${investorData.fullName}" from "${oldStatus}" to "${newStatus}"`,
      {
        investorId: investorData.investorId,
        investorName: investorData.fullName,
        oldStatus: oldStatus,
        newStatus: newStatus,
        action: 'kyc_update'
      }
    );
  }

  // Reports specific logging
  async logReportGeneration(userData, reportType, reportData) {
    await this.logDataOperation(
      userData,
      'Report Generated',
      'Report',
      reportType,
      `Generated ${reportType} report with ${reportData.recordCount || 0} records`,
      {
        reportType: reportType,
        recordCount: reportData.recordCount,
        format: reportData.format,
        filters: reportData.filters,
        action: 'report_generate'
      }
    );
  }

  async logReportDownload(userData, reportType, fileName, recordCount) {
    await this.logDataOperation(
      userData,
      'Report Downloaded',
      'Report',
      reportType,
      `Downloaded ${reportType} report (${recordCount} records, ${fileName})`,
      {
        reportType: reportType,
        fileName: fileName,
        recordCount: recordCount,
        action: 'report_download'
      }
    );
  }

  // Interest Payout specific logging
  async logInterestPayoutUpdate(userData, payoutData) {
    await this.logDataOperation(
      userData,
      'Interest Payout Updated',
      'Interest Payout',
      `${payoutData.investorId}-${payoutData.seriesName}-${payoutData.month}`,
      `Updated interest payout status for investor "${payoutData.investorName}" in series "${payoutData.seriesName}" for ${payoutData.month}`,
      {
        investorId: payoutData.investorId,
        investorName: payoutData.investorName,
        seriesName: payoutData.seriesName,
        month: payoutData.month,
        amount: payoutData.amount,
        status: payoutData.status,
        action: 'payout_update'
      }
    );
  }

  async logBulkPayoutUpdate(userData, payoutUpdates) {
    await this.logDataOperation(
      userData,
      'Bulk Payout Update',
      'Interest Payout',
      'Bulk Operation',
      `Updated ${payoutUpdates.length} interest payout statuses in bulk operation`,
      {
        updateCount: payoutUpdates.length,
        payoutUpdates: payoutUpdates,
        action: 'bulk_payout_update'
      }
    );
  }

  async logPayoutImported(importData, userData) {
    await this.logDataOperation(
      userData,
      'Payout Data Imported',
      'Interest Payout',
      'Import Operation',
      `Imported ${importData.recordCount} payout records from file "${importData.fileName}"`,
      {
        fileName: importData.fileName,
        recordCount: importData.recordCount,
        action: 'payout_import'
      }
    );
  }

  async logDocumentDownloaded(documentData, userData) {
    await this.logDataOperation(
      userData,
      'Document Downloaded',
      documentData.documentType || 'Document',
      documentData.fileName,
      `Downloaded ${documentData.documentType || 'document'}: ${documentData.fileName} (${documentData.recordCount || 0} records)`,
      {
        documentType: documentData.documentType,
        fileName: documentData.fileName,
        format: documentData.format,
        recordCount: documentData.recordCount,
        series: documentData.series,
        month: documentData.month,
        action: 'document_download'
      }
    );
  }

  // Communication specific logging
  async logCommunicationSent(userData, communicationData) {
    await this.logDataOperation(
      userData,
      'Communication Sent',
      'Communication',
      communicationData.id,
      `Sent ${communicationData.type} communication "${communicationData.subject}" to ${communicationData.recipientCount} recipients`,
      {
        communicationType: communicationData.type,
        subject: communicationData.subject,
        recipientCount: communicationData.recipientCount,
        recipients: communicationData.recipients,
        action: 'communication_send'
      }
    );
  }

  // Compliance specific logging
  async logComplianceUpdate(userData, seriesName, complianceType, oldValue, newValue) {
    await this.logDataOperation(
      userData,
      'Compliance Updated',
      'Compliance',
      `${seriesName}-${complianceType}`,
      `Updated ${complianceType} compliance for series "${seriesName}" from ${oldValue}% to ${newValue}%`,
      {
        seriesName: seriesName,
        complianceType: complianceType,
        oldValue: oldValue,
        newValue: newValue,
        action: 'compliance_update'
      }
    );
  }

  // Grievance Management specific logging
  async logGrievanceCreate(userData, grievanceData) {
    await this.logDataOperation(
      userData,
      'Grievance Created',
      'Grievance',
      grievanceData.id,
      `Created new grievance "${grievanceData.subject}" for investor "${grievanceData.investorName}"`,
      {
        grievanceId: grievanceData.id,
        investorId: grievanceData.investorId,
        investorName: grievanceData.investorName,
        subject: grievanceData.subject,
        priority: grievanceData.priority,
        action: 'grievance_create'
      }
    );
  }

  async logGrievanceStatusUpdate(userData, grievanceData, oldStatus, newStatus) {
    await this.logDataOperation(
      userData,
      'Grievance Status Updated',
      'Grievance',
      grievanceData.id,
      `Updated grievance status from "${oldStatus}" to "${newStatus}" for grievance "${grievanceData.subject}"`,
      {
        grievanceId: grievanceData.id,
        subject: grievanceData.subject,
        oldStatus: oldStatus,
        newStatus: newStatus,
        action: 'grievance_status_update'
      }
    );
  }

  // Specific logging methods for different activities
  async logLogin(userData) {
    await this.logActivity({
      action: 'User Login',
      userName: userData.name || userData.full_name,
      userRole: userData.role || userData.displayRole,
      details: `User ${userData.username} logged into the system`,
      entityType: 'Authentication',
      entityId: userData.username,
      changes: {
        username: userData.username,
        role: userData.role,
        loginTime: new Date().toISOString(),
        action: 'login'
      }
    });
  }

  async logLogout(userData) {
    await this.logActivity({
      action: 'User Logout',
      userName: userData.name || userData.full_name,
      userRole: userData.role || userData.displayRole,
      details: `User ${userData.username} logged out of the system`,
      entityType: 'Authentication',
      entityId: userData.username,
      changes: {
        username: userData.username,
        role: userData.role,
        logoutTime: new Date().toISOString(),
        action: 'logout'
      }
    });
  }

  async logPageAccess(userData, pageName) {
    await this.logActivity({
      action: 'Page Access',
      userName: userData.name || userData.full_name,
      userRole: userData.role || userData.displayRole,
      details: `User ${userData.username} accessed ${pageName} page`,
      entityType: 'Navigation',
      entityId: pageName,
      changes: {
        username: userData.username,
        role: userData.role,
        page: pageName,
        accessTime: new Date().toISOString(),
        action: 'page_access'
      }
    });
  }

  async logDataOperation(userData, operation, entityType, entityId, details, changes = {}) {
    await this.logActivity({
      action: operation,
      userName: userData.name || userData.full_name,
      userRole: userData.role || userData.displayRole,
      details: details,
      entityType: entityType,
      entityId: entityId,
      changes: {
        username: userData.username,
        role: userData.role,
        operation: operation,
        timestamp: new Date().toISOString(),
        ...changes
      }
    });
  }
}

// Create and export a singleton instance
const auditService = new AuditService();
export default auditService;