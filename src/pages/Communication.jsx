import React, { useState } from 'react';
import Layout from '../components/Layout';
import './Communication.css';
import { HiOutlineMail, HiOutlineDeviceMobile } from 'react-icons/hi';
import { MdSend, MdDrafts, MdHistory } from 'react-icons/md';

const Communication = () => {
  const [activeTab, setActiveTab] = useState('sms');

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
                  <p className="coming-soon">
                    SMS functionality will be available soon. This feature will allow you to:
                  </p>
                  <ul className="feature-list">
                    <li>Send bulk SMS to investors</li>
                    <li>Send personalized SMS notifications</li>
                    <li>Schedule SMS campaigns</li>
                    <li>Track SMS delivery status</li>
                    <li>Manage SMS templates</li>
                  </ul>
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
                  <p className="coming-soon">
                    Email functionality will be available soon. This feature will allow you to:
                  </p>
                  <ul className="feature-list">
                    <li>Send bulk emails to investors</li>
                    <li>Create rich HTML email templates</li>
                    <li>Schedule email campaigns</li>
                    <li>Track email open rates and clicks</li>
                    <li>Manage email lists and segments</li>
                    <li>Send automated notifications</li>
                  </ul>
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
                  <p className="coming-soon">
                    Communication history will be available soon. This feature will show:
                  </p>
                  <ul className="feature-list">
                    <li>All sent SMS and email messages</li>
                    <li>Delivery status and timestamps</li>
                    <li>Recipient lists and responses</li>
                    <li>Campaign performance analytics</li>
                    <li>Failed delivery reports</li>
                    <li>Communication logs and audit trail</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h3 className="quick-actions-title">Quick Actions</h3>
          <div className="action-buttons">
            <button className="action-button disabled">
              <MdSend size={20} />
              Send Quick SMS
            </button>
            <button className="action-button disabled">
              <HiOutlineMail size={20} />
              Send Quick Email
            </button>
            <button className="action-button disabled">
              <MdDrafts size={20} />
              Create Template
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Communication;