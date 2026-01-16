# Series Data Usage Analysis - Complete Application Audit

## Overview
This document lists all pages/components that rely on or display series data in the application.

---

## 📊 Pages Using Series Data

### 1. **Dashboard** (`src/pages/Dashboard.jsx`)
**Location**: Main dashboard page
**Series Usage**:
- ✅ Displays NCD Series Performance section
- ✅ Shows series progress bars with funds raised
- ✅ Displays series investors count
- ✅ Shows compliance alerts carousel for yet-to-be-submitted series
- ✅ Upcoming payout calendar filtered by active/upcoming series
- ✅ Recent investments showing series names

**Data Accessed**:
```javascript
const { series, getYetToBeSubmittedSeries } = useData();
```

**Display Elements**:
- Series name
- Funds raised
- Target amount
- Progress percentage
- Investor count
- Interest rate
- Interest frequency
- Maturity date
- Status (active/upcoming)

---

### 2. **NCD Series** (`src/pages/NCDSeries.jsx`)
**Location**: `/ncd-series`
**Series Usage**:
- ✅ Main series management page
- ✅ Lists all series (DRAFT, upcoming, active)
- ✅ Create new series
- ✅ Delete series
- ✅ View series details
- ✅ Navigate to series details page

**Data Accessed**:
```javascript
const { series, addSeries, deleteSeries } = useData();
```

**Display Elements**:
- All series information
- Series cards with status
- Create series form
- Delete confirmation

---

### 3. **Series Details** (`src/pages/SeriesDetails.jsx`)
**Location**: `/ncd-series/:id`
**Series Usage**:
- ✅ Detailed view of individual series
- ✅ Shows series metrics
- ✅ Displays payout schedule
- ✅ Shows recent transactions
- ✅ Lists investors in series
- ✅ Shows funds raised breakdown
- ✅ Generates series PDF report

**Data Accessed**:
```javascript
const { series = [], investors = [] } = useData();
```

**Display Elements**:
- Complete series information
- Key metrics cards
- Payout schedule
- Recent transactions table
- Investor list
- Funds raised modal
- PDF report generation

---

### 4. **Investors** (`src/pages/Investors.jsx`)
**Location**: `/investors`
**Series Usage**:
- ✅ Shows series tags for each investor
- ✅ Filter investors by series
- ✅ Add investment to series
- ✅ Series selection in investment flow
- ✅ Update series data when investment added

**Data Accessed**:
```javascript
const { investors, series, updateSeries } = useData();
```

**Display Elements**:
- Series tags on investor cards
- Series filter dropdown
- Series selection modal (for investments)
- Available series list

---

### 5. **Investor Details** (`src/pages/InvestorDetails.jsx`)
**Location**: `/investors/:id`
**Series Usage**:
- ✅ Shows investor's series holdings
- ✅ Displays series-specific investments
- ✅ Links to series details pages

**Data Accessed**:
```javascript
// Uses investor.series array
```

**Display Elements**:
- Series holdings list
- Investment per series
- Clickable series links

---

### 6. **Approval** (`src/pages/Approval.jsx`)
**Location**: `/approval`
**Series Usage**:
- ✅ Lists DRAFT series pending approval
- ✅ Approve series (changes status to upcoming)
- ✅ Reject/delete series
- ✅ Edit series before approval
- ✅ View series details

**Data Accessed**:
```javascript
const { series, approveSeries, deleteSeries, updateSeries } = useData();
```

**Display Elements**:
- DRAFT series list
- Series details for approval
- Edit series form
- Approve/reject buttons

---

### 7. **Interest Payout** (`src/pages/InterestPayout.jsx`)
**Location**: `/interest-payout`
**Series Usage**:
- ✅ Filter payouts by series
- ✅ Display series name in payout table
- ✅ Calculate interest based on series rate
- ✅ Show series interest frequency

**Data Accessed**:
```javascript
const { series, investors } = useData();
```

**Display Elements**:
- Series filter dropdown
- Series name in payout rows
- Interest rate per series
- Interest frequency

---

### 8. **Compliance** (`src/pages/Compliance.jsx`)
**Location**: `/compliance`
**Series Usage**:
- ✅ Lists compliance series (hardcoded + real)
- ✅ Shows series compliance status
- ✅ Opens compliance tracker for series
- ✅ Displays series metrics

**Data Accessed**:
```javascript
const { series } = useData();
```

**Display Elements**:
- Compliance series cards
- Series name
- Interest rate
- Interest frequency
- Investors count
- Funds raised
- Compliance status

---

### 9. **Investor Dashboard** (`src/pages/InvestorDashboard.jsx`)
**Location**: `/investor/dashboard` (Investor Portal)
**Series Usage**:
- ✅ Shows investor's series holdings
- ✅ Displays series performance
- ✅ Shows investment per series

**Data Accessed**:
```javascript
const { investors, series } = useData();
```

**Display Elements**:
- Series holdings
- Investment amounts per series
- Series names

---

### 10. **Investor Series** (`src/pages/InvestorSeries.jsx`)
**Location**: `/investor/series` (Investor Portal)
**Series Usage**:
- ✅ Lists all available series
- ✅ Shows series details
- ✅ Allows investment in series
- ✅ Displays series metrics

**Data Accessed**:
```javascript
const { series, investors, updateInvestor, updateSeries } = useData();
```

**Display Elements**:
- All series list
- Series cards
- Investment form
- Series details

---

### 11. **Investor Account** (`src/pages/InvestorAccount.jsx`)
**Location**: `/investor/account` (Investor Portal)
**Series Usage**:
- ✅ Shows investor's series holdings
- ✅ Displays investment per series

**Data Accessed**:
```javascript
const { investors, series } = useData();
```

**Display Elements**:
- Series holdings list
- Investment amounts

---

## 📍 Components Using Series Data

### 1. **UpcomingPayoutCalendar** (`src/components/UpcomingPayoutCalendar.jsx`)
**Usage**:
- Receives series as prop
- Displays upcoming payouts for series
- Shows maturity dates

**Props**:
```javascript
series={series.filter(s => s.status === 'active' || s.status === 'upcoming')}
```

---

### 2. **ComplianceTracker** (`src/components/ComplianceTracker.jsx`)
**Usage**:
- Receives series data as prop
- Displays compliance status for series
- Shows series name and details

**Props**:
```javascript
seriesData={{ seriesName: selectedSeries.name, ... }}
```

---

## 📊 Summary Statistics

**Total Pages Using Series**: 11
- Admin Pages: 7
- Investor Portal Pages: 3
- Shared: 1 (Dashboard)

**Total Components Using Series**: 2

**Series Data Fields Used**:
- id
- name
- status (DRAFT, upcoming, active)
- fundsRaised
- targetAmount
- investors (count)
- interestRate
- interestFrequency
- issueDate
- maturityDate
- faceValue
- minInvestment
- releaseDate
- approvalStatus

---

## 🔍 Critical Dependencies

### Pages that CANNOT function without series data:
1. **NCD Series** - Core series management
2. **Series Details** - Individual series view
3. **Approval** - Series approval workflow
4. **Investor Series** - Investor portal series view

### Pages that use series for filtering/display:
1. **Dashboard** - Performance metrics
2. **Investors** - Series tags and filters
3. **Interest Payout** - Series-based filtering
4. **Compliance** - Series compliance tracking

### Pages that reference series indirectly:
1. **Investor Details** - Through investor.series array
2. **Investor Dashboard** - Through investor holdings
3. **Investor Account** - Through investor holdings

---

## ✅ Analysis Complete

All pages and components that rely on or display series data have been identified and documented with their specific usage patterns and locations.
