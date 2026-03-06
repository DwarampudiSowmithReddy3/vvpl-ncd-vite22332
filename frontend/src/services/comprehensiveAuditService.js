// Comprehensive Audit Service for NCD Management System
// This service tracks ALL CRUD operations across the entire application

import apiService from './api';

class ComprehensiveAuditService {
  constructor() {
    this.isEnabled = true;
    this.currentUser = null;
  }

  // Set current user context for audit logging
  setCurrentUser(user) {
    this.currentUser = user;
  }

  // Get current user info for audit logs
  getCurrentUserInfo() {
    if (this.currentUser) {
      return {
        adminName: this.currentUser.name || this.currentUser.username || 'Unknown User',
        adminRole