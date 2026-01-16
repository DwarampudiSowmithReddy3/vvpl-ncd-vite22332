import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import './AuditLog.css';
import { FiSearch, FiFilter } from "react-icons/fi";
import { HiOutlineDocumentText, HiOutlineCalendar, HiOutlineUser } from "react-icons/hi";
import { MdOutlineFileDownload } from "react-icons/md";

const AuditLog = () => {
  const { auditLogs, addAuditLog } = useData();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterAdmin, setFilterAdmin] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  // Get unique admins and actions for filters
  const uniqueAdmins = [...new Set(auditLogs.map(log => log.adminName))];
  const uniqueActions = [...new Set(auditLogs.map(log => log.action))];

  // Filter audit logs
  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const matchesSearch = 
        log.adminName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.entityId && log.entityId.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesAction = filterAction === 'all' || log.action === filterAction;
      const matchesAdmin = filterAdmin === 'all' || log.adminName === filterAdmin;
      
      // Date range filter
      let matchesDateRange = true;
      if (dateRange.from || dateRange.to) {
        const logDate = new Date(log.timestamp);
        const fromDate = dateRange.from ? new Date(dateRange.from) : new Date('1900-01-01');
        const toDate = dateRange.to ? new Date(dateRange.to) : new Date();
        matchesDateRange = logDate >= fromDate && logDate <= toDate;
      }
      
      return matchesSearch && matchesAction && matchesAdmin && matchesDateRange;
    });
  }, [auditLogs, searchTerm, filterAction, filterAdmin, dateRange]);

  const handleExport = () => {
    const headers = ['Date & Time', 'Admin Name', 'Admin Role', 'Action', 'Entity Type', 'Entity ID', 'Details'];
    const rows = filteredLogs.map(log => [
      new Date(log.timestamp).toLocaleString('en-IN'),
      log.adminName,
      log.adminRole,
      log.action,
      log.entityType || 'N/A',
      log.entityId || 'N/A',
      log.details
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileName = `audit_log_${new Date().toISOString().split('T')[0]}.csv`;
    a.download = fileName;
    a.click();
    
    // Add audit log for document download
    addAuditLog({
      action: 'Downloaded Report',
      adminName: user ? user.name : 'Admin',
      adminRole: user ? user.displayRole : 'Admin',
      details: `Downloaded Audit Log (${filteredLogs.length} entries, CSV format)`,
      entityType: 'Audit Log',
      entityId: 'All Logs',
      changes: {
        documentType: 'Audit Log',
        fileName: fileName,
        format: 'CSV',
        recordCount: filteredLogs.length
      }
    });
  };

  const clearFilters = () => {
    setFilterAction('all');
    setFilterAdmin('all');
    setDateRange({ from: '', to: '' });
    setShowFilterDropdown(false);
  };

  const getActionColor = (action) => {
    if (action.includes('Created')) return 'green';
    if (action.includes('Edited')) return 'blue';
    if (action.includes('Deleted') || action.includes('Rejected')) return 'red';
    if (action.includes('Approved')) return 'purple';
    if (action.includes('Investment')) return 'orange';
    return 'gray';
  };

  return (
    <Layout>
      <div className="audit-log-page">
        <div className="audit-header">
          <div>
            <h1 className="page-title">Audit Log</h1>
            <p className="page-subtitle">Complete trail of all changes made by administrators for security and fraud prevention.</p>
          </div>
          <button onClick={handleExport} className="export-button">
            <MdOutlineFileDownload size={18} /> Export Log
          </button>
        </div>

        <div className="audit-summary-cards">
          <div className="summary-card">
            <p className="card-label">Total Entries</p>
            <h2 className="card-value">{auditLogs.length}</h2>
          </div>
          <div className="summary-card blue">
            <p className="card-label">Filtered Results</p>
            <h2 className="card-value">{filteredLogs.length}</h2>
          </div>
          <div className="summary-card green">
            <p className="card-label">Unique Admins</p>
            <h2 className="card-value">{uniqueAdmins.length}</h2>
          </div>
          <div className="summary-card orange">
            <p className="card-label">Action Types</p>
            <h2 className="card-value">{uniqueActions.length}</h2>
          </div>
        </div>

        <div className="audit-table-section">
          <div className="table-header">
            <h3 className="section-title">All Audit Entries</h3>
            <div className="table-actions">
              <div className="search-container">
                <FiSearch size={16} />
                <input
                  type="text"
                  placeholder="Search audit logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              
              <div className="filter-container">
                <button className="filter-button" onClick={() => setShowFilterDropdown(!showFilterDropdown)}>
                  <FiFilter size={16} />
                  {(filterAction !== 'all' || filterAdmin !== 'all' || dateRange.from || dateRange.to) && (
                    <span className="filter-indicator"></span>
                  )}
                </button>
                
                {showFilterDropdown && (
                  <div className="filter-dropdown audit-filter-dropdown">
                    <div className="filter-section">
                      <label>Action Type:</label>
                      <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)}>
                        <option value="all">All Actions</option>
                        {uniqueActions.map(action => (
                          <option key={action} value={action}>{action}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="filter-section">
                      <label>Admin:</label>
                      <select value={filterAdmin} onChange={(e) => setFilterAdmin(e.target.value)}>
                        <option value="all">All Admins</option>
                        {uniqueAdmins.map(admin => (
                          <option key={admin} value={admin}>{admin}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="filter-section">
                      <label>Date Range:</label>
                      <div className="date-range-inputs">
                        <input
                          type="date"
                          value={dateRange.from}
                          onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                          placeholder="From"
                        />
                        <span>to</span>
                        <input
                          type="date"
                          value={dateRange.to}
                          onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                          placeholder="To"
                        />
                      </div>
                    </div>
                    
                    {(filterAction !== 'all' || filterAdmin !== 'all' || dateRange.from || dateRange.to) && (
                      <div className="filter-actions">
                        <button className="clear-filters-btn" onClick={clearFilters}>
                          Clear All Filters
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="table-container">
            {filteredLogs.length === 0 ? (
              <div className="no-logs-message">
                <HiOutlineDocumentText size={48} />
                <h3>No audit logs found</h3>
                <p>No changes have been recorded yet or your filters returned no results.</p>
              </div>
            ) : (
              <table className="audit-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Admin</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id}>
                      <td>
                        <div className="date-time-cell">
                          <div className="date">
                            {new Date(log.timestamp).toLocaleDateString('en-IN')}
                          </div>
                          <div className="time">
                            {new Date(log.timestamp).toLocaleTimeString('en-IN', { 
                              hour: '2-digit', 
                              minute: '2-digit',
                              hour12: true 
                            })}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="admin-cell">
                          <div className="admin-name">{log.adminName}</div>
                          <div className="admin-role">{log.adminRole}</div>
                        </div>
                      </td>
                      <td>
                        <span className={`action-badge ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td>
                        <div className="entity-cell">
                          <div className="entity-type">{log.entityType || 'N/A'}</div>
                          {log.entityId && (
                            <div className="entity-id">{log.entityId}</div>
                          )}
                        </div>
                      </td>
                      <td className="details-cell">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AuditLog;
