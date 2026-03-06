import { useAuth } from '../context/AuthContext';

export const usePermissions = () => {
  const { hasPermission, canAccessModule } = useAuth();

  // Helper functions for common permission checks
  const canView = (module) => hasPermission(module, 'view');
  const canCreate = (module) => hasPermission(module, 'create');
  const canEdit = (module) => hasPermission(module, 'edit');
  const canDelete = (module) => hasPermission(module, 'delete');

  // Component visibility helpers
  const showCreateButton = (module) => canCreate(module);
  const showEditButton = (module) => canEdit(module);
  const showDeleteButton = (module) => canDelete(module);
  
  // Form field helpers
  const isFieldReadOnly = (module) => !canEdit(module);
  const isFormDisabled = (module) => !canEdit(module) && !canCreate(module);

  return {
    hasPermission,
    canAccessModule,
    canView,
    canCreate,
    canEdit,
    canDelete,
    showCreateButton,
    showEditButton,
    showDeleteButton,
    isFieldReadOnly,
    isFormDisabled
  };
};