# Document Download Tracking - Testing Guide

## Overview
All document downloads are now tracked in the audit log system. Every time an admin downloads or exports any document, it's recorded with complete details.

## What Gets Tracked

### 1. Series Reports (PDF)
**Location**: NCD Series → View Details → Export Report button
**Tracks**:
- Admin name and role
- Series name
- File name (e.g., `Series_A_Report_2026-01-16.pdf`)
- Format: PDF

### 2. Investors List (CSV)
**Location**: Investors page → Export button
**Tracks**:
- Admin name and role
- Number of investors exported
- File name: `investors.csv`
- Format: CSV

### 3. Interest Payouts List (CSV)
**Location**: Interest Payout page → Export Data button
**Tracks**:
- Admin name and role
- Number of payouts exported
- File name: `interest-payouts.csv`
- Format: CSV

### 4. Interest Payout Export (CSV)
**Location**: Interest Payout page → Interest Payout Export button
**Tracks**:
- Admin name and role
- Series selected (or "All Series")
- Month (Current or Upcoming)
- Number of payouts
- Total amount
- File name (e.g., `interest-payout-Series_A-current-2026-01-16.csv`)
- Format: CSV

### 5. All Reports (PDF)
**Location**: Reports page → Any report → Download button
**Tracks**:
- Admin name and role
- Report name (e.g., "Monthly Collection Report", "Payout Statement")
- File name (e.g., `Monthly_Collection_Report_2026-01-16.pdf`)
- Format: PDF

**Available Reports**:
- Monthly Collection Report
- Payout Statement
- Series-wise Performance
- Investor Portfolio Summary
- KYC Status Report
- New Investor Report
- RBI Compliance Report
- SEBI Disclosure Report
- Audit Trail Report
- Daily Activity Report
- Subscription Trend Analysis
- Series Maturity Report

### 6. Audit Log Export (CSV)
**Location**: Audit Log page → Export Log button
**Tracks**:
- Admin name and role
- Number of audit entries exported
- File name (e.g., `audit_log_2026-01-16.csv`)
- Format: CSV

## How to Test

### Step 1: Login
Login as Super Admin:
- Username: `subbireddy`
- Password: `subbireddy`

### Step 2: Download Various Documents

#### Test Series Report Download:
1. Go to **NCD Series** page
2. Click **"View Details"** on any series
3. Click **"Export Report"** button
4. PDF should download
5. ✅ Check Audit Log for entry

#### Test Investors List Export:
1. Go to **Investors** page
2. Click **"Export"** button
3. CSV should download
4. ✅ Check Audit Log for entry

#### Test Interest Payout Export:
1. Go to **Interest Payout** page
2. Click **"Interest Payout Export"** button
3. Select series and month
4. Click **"Download CSV"**
5. CSV should download
6. ✅ Check Audit Log for entry

#### Test Report Download:
1. Go to **Reports** page
2. Click **"Download"** on any report
3. PDF should download
4. ✅ Check Audit Log for entry

#### Test Audit Log Export:
1. Go to **Audit Log** page
2. Click **"Export Log"** button
3. CSV should download
4. ✅ Check Audit Log for entry (yes, it tracks itself!)

### Step 3: Verify in Audit Log

1. Go to **Audit Log** page
2. You should see entries with:
   - **Action**: "Downloaded Report"
   - **Admin**: Your name (e.g., "Subbireddy")
   - **Role**: Your role (e.g., "Super Admin")
   - **Entity Type**: "Series", "Investor", "Payout", "Report", or "Audit Log"
   - **Details**: Description of what was downloaded

### Step 4: Test Filters

1. In Audit Log page, click **Filter** button
2. Select **Action Type**: "Downloaded Report"
3. Should show only download entries
4. Try filtering by date range
5. Try searching for specific document names

## Example Audit Log Entries

### Series Report Download:
```
Date & Time: 16/1/2026 11:45:30 AM
Admin: Subbireddy (Super Admin)
Action: Downloaded Report
Entity: Series / Series A
Details: Downloaded Series Report for "Series A" (PDF format)
```

### Investors List Export:
```
Date & Time: 16/1/2026 11:46:15 AM
Admin: Subbireddy (Super Admin)
Action: Downloaded Report
Entity: Investor / All Investors
Details: Downloaded Investors List (8 investors, CSV format)
```

### Interest Payout Export:
```
Date & Time: 16/1/2026 11:47:00 AM
Admin: Subbireddy (Super Admin)
Action: Downloaded Report
Entity: Payout / Series A
Details: Downloaded Interest Payout Export for Series A - Current Month (15 payouts, CSV format)
```

### Report Download:
```
Date & Time: 16/1/2026 11:48:30 AM
Admin: Subbireddy (Super Admin)
Action: Downloaded Report
Entity: Report / Monthly Collection Report
Details: Downloaded "Monthly Collection Report" report (PDF format)
```

## Security Benefits

### 1. Data Access Tracking
- Know exactly who accessed sensitive investor data
- Track when financial reports were downloaded
- Identify unusual download patterns

### 2. Compliance
- Meet regulatory requirements for data access logging
- Provide audit trail for compliance reviews
- Document who accessed what data and when

### 3. Fraud Prevention
- Detect unauthorized data access
- Identify suspicious download patterns
- Track if someone is downloading excessive data

### 4. Accountability
- Every download is tied to a specific admin
- Cannot deny downloading sensitive documents
- Complete trail for investigations

## What to Look For

### Normal Behavior:
- Admins downloading reports during business hours
- Finance team downloading payout exports monthly
- Compliance team downloading regulatory reports quarterly

### Suspicious Behavior:
- Downloads outside business hours
- Excessive downloads by single admin
- Downloads of all investor data by non-authorized person
- Downloads immediately before admin account termination

## Export Audit Log for Review

1. Go to **Audit Log** page
2. Filter by **Action Type**: "Downloaded Report"
3. Set **Date Range** to review period
4. Click **"Export Log"**
5. Review CSV in Excel for patterns

## Conclusion

All document downloads are now fully tracked. You can:
- ✅ See who downloaded what document
- ✅ See when it was downloaded
- ✅ See what data was included
- ✅ Export audit log for review
- ✅ Filter by admin, date, or document type

This provides complete accountability and helps prevent data theft or unauthorized access.

---

**Status**: ✅ Fully Implemented and Operational  
**Date**: January 16, 2026
