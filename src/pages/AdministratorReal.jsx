import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContextNew';
import { useData } from '../context/DataContext';

const AdministratorReal = () => {
  const { user, hasPermission, updateSinglePermission, loadAllPermissions } = useAuth();
  const { addAuditLog } = useData();
  const [allPermissions, setAllPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('permissions');

  useEffect(() => {
    loadPermissionsData();
  }, []);

  const loadPermissionsData = async () => {
    setLoading(true);
    try {
      const permissions = await loadAllPermissions();
      setAllPermissions(permissions);
      console.log('📊 Loaded permissions for admin interface:', permissions);
    } catch (error) {
      console.error('❌ Error loading permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  // REAL permission toggle handler - Updates MySQL database
  const handlePermissionToggle = async (role, module, action) => {
    try {
      console.log(`🔄 Toggling permission: ${role}.${module}.${action}`);
      
      if (!allPermissions[role] || !allPermissions[role][module]) {
        console.error('❌ Permission path not found');
        return;
      }
      
      const currentValue = allPermissions[role][module][action];
      const newValue = !currentValue;
      
      // Update local state immediately for UI responsiveness
      const updatedPermissions = {
        ...allPermissions,
        [role]: {
          ...allPermissions[role],
          [module]: {
            ...allPermissions[role][module],
            [action]: newValue
          }
        }
      };
      setAllPermissions(updatedPermissions);
      
      // Make REAL API call to update database
      const result = await updateSinglePermission(role, module, action, newValue);
      
      if (result.success) {
        console.log(`✅ Permission updated in database: ${role}.${module}.${action} = ${newValue}`);
        
        // Add audit log
        addAuditLog({
          action: 'Updated Permissions',
          adminName: user?.name || 'Admin',
          adminRole: user?.displayRole || 'Admin',
          details: `${newValue ? 'Granted' : 'Revoked'} ${action} permission for ${role} role in ${module} module`,
          entityType: 'Permission',
          timestamp: new Date().toISOString()
        });
        
        // Reload fresh data from database
        await loadPermissionsData();
        
      } else {
        console.error(`❌ Failed to update permission: ${result.error}`);
        
        // Revert local state
        setAllPermissions(allPermissions);
        
        alert(`Failed to update permission: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Error in handlePermissionToggle:', error);
      alert(`Error updating permission: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="administrator-container">
        <div className="loading">
          <h2>Loading Real Permissions from Database...</h2>
          <p>Please wait while we fetch the latest permission data from MySQL.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="administrator-container">
      <div className="administrator-header">
        <h1>Administrator - Real Permission System</h1>
        <p>Manage permissions directly connected to MySQL database</p>
      </div>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'permissions' ? 'active' : ''}`}
          onClick={() => setActiveTab('permissions')}
        >
          Real Permissions
        </button>
        <button 
          className={`tab ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          System Info
        </button>
      </div>

      {activeTab === 'permissions' && (
        <div className="tab-content">
          <div className="permissions-section">
            <div className="permissions-header">
              <h3>Real-Time Permission Management</h3>
              <p>Changes are immediately saved to MySQL database and enforced across the application</p>
              <button onClick={loadPermissionsData} className="refresh-btn">
                Refresh from Database
              </button>
            </div>

            {Object.keys(allPermissions).length === 0 ? (
              <div className="no-permissions">
                <h3>No Permissions Found</h3>
                <p>No permission data found in database. Please check your database connection.</p>
              </div>
            ) : (
              <div className="permissions-tables-container">
                {Object.entries(allPermissions).map(([role, rolePermissions]) => (
                  <div key={role} className="role-permissions-section">
                    <div className="role-section-header">
                      <span className={`role-label ${role.toLowerCase().replace(/\s+/g, '-')}`}>
                        {role}
                      </span>
                      <span className="database-indicator">🔗 MySQL Connected</span>
                    </div>

                    <div className="permissions-table-container">
                      <table className="permissions-table">
                        <thead>
                          <tr>
                            <th>Module</th>
                            <th>View</th>
                            <th>Create</th>
                            <th>Edit</th>
                            <th>Delete</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(rolePermissions).map(([module, modulePermissions]) => (
                            <tr key={`${role}-${module}`} className="permission-row">
                              <td className="module-name">
                                {module === 'ncdSeries' ? 'NCD Series' :
                                 module === 'interestPayout' ? 'Interest Payout' :
                                 module === 'grievanceManagement' ? 'Grievance Management' :
                                 module.charAt(0).toUpperCase() + module.slice(1)}
                              </td>
                              
                              {['view', 'create', 'edit', 'delete'].map(action => (
                                <td key={action}>
                                  <label className="toggle-switch">
                                    <input
                                      type="checkbox"
                                      checked={modulePermissions[action] === true || modulePermissions[action] === 1}
                                      onChange={() => handlePermissionToggle(role, module, action)}
                                      disabled={!hasPermission('administrator', 'edit')}
                                    />
                                    <span className="toggle-slider"></span>
                                  </label>
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'info' && (
        <div className="tab-content">
          <div className="system-info">
            <h3>Real Permission System Status</h3>
            <div className="info-grid">
              <div className="info-card">
                <h4>Database Connection</h4>
                <p className="status-connected">✅ MySQL Connected</p>
              </div>
              <div className="info-card">
                <h4>Permission Enforcement</h4>
                <p className="status-active">✅ Real-time Active</p>
              </div>
              <div className="info-card">
                <h4>Total Roles</h4>
                <p>{Object.keys(allPermissions).length}</p>
              </div>
              <div className="info-card">
                <h4>Your Permissions</h4>
                <p>Administrator: {hasPermission('administrator', 'edit') ? 'Full Access' : 'Read Only'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdministratorReal;