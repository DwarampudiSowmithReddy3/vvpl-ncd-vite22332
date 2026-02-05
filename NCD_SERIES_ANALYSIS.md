# 📊 NCD Series Page - Comprehensive Analysis & Database Requirements

## 🎯 **Page Overview**

The NCD Series page is the **core module** of the system that manages Non-Convertible Debentures. It handles the complete lifecycle from creation to maturity and feeds data into multiple other pages.

---

## 🏗️ **Current Frontend Structure**

### **Main Pages:**
1. **NCDSeries.jsx** - Main listing page with create/manage functionality
2. **SeriesDetails.jsx** - Detailed view of individual series with analytics

### **Key Functionalities:**

#### **1. Series Management**
- ✅ Create new NCD series with comprehensive form
- ✅ View series in categorized sections (Draft, Rejected, Upcoming, Accepting, Active, Matured)
- ✅ Delete draft/upcoming series
- ✅ Status-based workflow management

#### **2. Series Details & Analytics**
- ✅ Detailed series information display
- ✅ Lock-in period calculations and tracking
- ✅ Maturity period analysis
- ✅ Funds raised tracking with investor breakdown
- ✅ Payout schedule generation
- ✅ Transaction history
- ✅ Document management (15G, 15H, Bond Papers)
- ✅ PDF report generation

#### **3. Data Integration**
- ✅ Connects with Investors page for investment tracking
- ✅ Feeds Interest Payout page with payout calculations
- ✅ Provides data for Reports and Compliance pages
- ✅ Audit logging for all actions

---

## 📋 **Complete Field Analysis**

### **Core Series Information**
| Field | Type | Required | Description | Current DB |
|-------|------|----------|-------------|------------|
| `name` | String | ✅ | Series name (e.g., "Series A NCD") | ✅ series_name |
| `seriesCode` | String | ✅ | Unique code (e.g., "NCD-A-2024") | ✅ series_code |
| `status` | Enum | ✅ | DRAFT/REJECTED/upcoming/accepting/active/matured | ✅ status |
| `description` | Text | ❌ | Series description | ❌ Missing |

### **Financial Details**
| Field | Type | Required | Description | Current DB |
|-------|------|----------|-------------|------------|
| `interestRate` | Decimal | ✅ | Annual interest rate (%) | ✅ interest_rate |
| `couponRate` | Decimal | ❌ | Coupon rate (usually same as interest) | ❌ Missing |
| `interestFrequency` | String | ✅ | Monthly/Quarterly/Semi-Annual/Annual | ✅ interest_frequency |
| `faceValue` | Integer | ✅ | Face value per debenture | ❌ Missing |
| `minInvestment` | Integer | ✅ | Minimum investment amount | ❌ Missing |
| `targetAmount` | Decimal | ✅ | Target fundraising amount | ✅ issue_size |
| `totalIssueSize` | Decimal | ❌ | Total issue size | ❌ Missing |
| `minSubscriptionPercentage` | Decimal | ❌ | Minimum subscription % | ❌ Missing |

### **Date Management**
| Field | Type | Required | Description | Current DB |
|-------|------|----------|-------------|------------|
| `issueDate` | Date | ✅ | Series issue date | ❌ Missing |
| `maturityDate` | Date | ✅ | Series maturity date | ✅ maturity_date |
| `subscriptionStartDate` | Date | ❌ | Subscription window start | ❌ Missing |
| `subscriptionEndDate` | Date | ❌ | Subscription window end | ❌ Missing |
| `lockInDate` | Date | ❌ | Lock-in period end date | ❌ Missing |
| `releaseDate` | Date | ❌ | Actual release date | ❌ Missing |
| `tenure` | Integer | ✅ | Tenure in years | ✅ tenure_years |

### **Regulatory & Compliance**
| Field | Type | Required | Description | Current DB |
|-------|------|----------|-------------|------------|
| `creditRating` | String | ❌ | Credit rating (AAA, AA+, etc.) | ❌ Missing |
| `securityType` | Enum | ✅ | Secured/Unsecured | ❌ Missing |
| `debentureTrusteeName` | String | ✅ | Trustee name | ❌ Missing |
| `investorsSize` | Integer | ❌ | Maximum number of investors | ❌ Missing |

### **Document Management**
| Field | Type | Required | Description | Current DB |
|-------|------|----------|-------------|------------|
| `termSheet` | File | ✅ | Term sheet document | ❌ Missing |
| `offerDocument` | File | ✅ | Offer document | ❌ Missing |
| `boardResolution` | File | ✅ | Board resolution | ❌ Missing |

### **Calculated/Runtime Fields**
| Field | Type | Description | Source |
|-------|------|-------------|---------|
| `fundsRaised` | Decimal | Total funds raised | Calculated from investments |
| `investors` | Integer | Number of investors | Calculated from investor_series table |
| `progress` | Percentage | Fundraising progress | fundsRaised / targetAmount * 100 |
| `transactions` | Array | Investment transactions | From investments table |

### **Status Management Fields**
| Field | Type | Description | Current DB |
|-------|------|-------------|------------|
| `rejectionReason` | Text | Reason for rejection | ❌ Missing |
| `rejectedAt` | DateTime | Rejection timestamp | ❌ Missing |
| `rejectedBy` | String | Who rejected | ❌ Missing |
| `approvedAt` | DateTime | Approval timestamp | ❌ Missing |
| `approvedBy` | String | Who approved | ❌ Missing |

---

## 🗄️ **Required Database Schema Changes**

### **1. Enhanced ncd_series Table**
```sql
CREATE TABLE ncd_series (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Core Information
    series_name VARCHAR(100) NOT NULL,
    series_code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    status ENUM('DRAFT', 'REJECTED', 'APPROVED', 'ACTIVE', 'MATURED') DEFAULT 'DRAFT',
    
    -- Financial Details
    interest_rate DECIMAL(5,2) NOT NULL,
    coupon_rate DECIMAL(5,2),
    interest_frequency VARCHAR(30) NOT NULL,
    face_value DECIMAL(15,2) NOT NULL,
    min_investment DECIMAL(15,2) NOT NULL,
    target_amount DECIMAL(15,2) NOT NULL,
    total_issue_size DECIMAL(15,2),
    min_subscription_percentage DECIMAL(5,2),
    
    -- Date Management
    issue_date DATE NOT NULL,
    maturity_date DATE NOT NULL,
    subscription_start_date DATE,
    subscription_end_date DATE,
    lock_in_date DATE,
    release_date DATE,
    tenure_years INT NOT NULL,
    
    -- Regulatory & Compliance
    credit_rating VARCHAR(10),
    security_type ENUM('Secured', 'Unsecured') DEFAULT 'Secured',
    debenture_trustee_name VARCHAR(100) NOT NULL,
    max_investors INT,
    
    -- Status Management
    rejection_reason TEXT,
    rejected_at TIMESTAMP NULL,
    rejected_by VARCHAR(50),
    approved_at TIMESTAMP NULL,
    approved_by VARCHAR(50),
    
    -- Audit Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by VARCHAR(50),
    
    -- Indexes for performance
    INDEX idx_status (status),
    INDEX idx_issue_date (issue_date),
    INDEX idx_maturity_date (maturity_date),
    INDEX idx_series_code (series_code)
);
```

### **2. Series Documents Table**
```sql
CREATE TABLE series_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    series_id INT NOT NULL,
    document_type ENUM('term_sheet', 'offer_document', 'board_resolution') NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    file_size BIGINT,
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploaded_by VARCHAR(50),
    
    FOREIGN KEY (series_id) REFERENCES ncd_series(id) ON DELETE CASCADE,
    INDEX idx_series_documents (series_id, document_type)
);
```

### **3. Investor Series Relationship Table**
```sql
CREATE TABLE investor_series (
    id INT AUTO_INCREMENT PRIMARY KEY,
    investor_id INT NOT NULL,
    series_id INT NOT NULL,
    investment_amount DECIMAL(15,2) NOT NULL,
    investment_date DATE NOT NULL,
    investment_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active', 'exited', 'matured') DEFAULT 'active',
    exit_date DATE NULL,
    exit_amount DECIMAL(15,2) NULL,
    
    FOREIGN KEY (investor_id) REFERENCES investors(id) ON DELETE CASCADE,
    FOREIGN KEY (series_id) REFERENCES ncd_series(id) ON DELETE CASCADE,
    UNIQUE KEY unique_investor_series (investor_id, series_id),
    INDEX idx_series_investments (series_id),
    INDEX idx_investor_investments (investor_id)
);
```

### **4. Investor Documents Table**
```sql
CREATE TABLE investor_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    investor_id INT NOT NULL,
    series_id INT NOT NULL,
    document_type ENUM('form_15g', 'form_15h', 'bond_paper') NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    file_data LONGTEXT, -- Base64 encoded file data
    file_size BIGINT,
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploaded_by VARCHAR(50),
    
    FOREIGN KEY (investor_id) REFERENCES investors(id) ON DELETE CASCADE,
    FOREIGN KEY (series_id) REFERENCES ncd_series(id) ON DELETE CASCADE,
    INDEX idx_investor_docs (investor_id, series_id),
    INDEX idx_series_docs (series_id)
);
```

---

## 🔄 **Data Flow Integration**

### **Pages That Depend on NCD Series Data:**

1. **Dashboard** - Series metrics, active series count, total funds
2. **Investors** - Investment tracking per series
3. **Interest Payout** - Payout calculations based on series interest rates
4. **Reports** - Series performance reports
5. **Compliance** - Series compliance status
6. **Communication** - Series-specific communications

### **Key Calculations:**
- **Funds Raised**: `SUM(investor_series.investment_amount) WHERE series_id = X`
- **Investor Count**: `COUNT(DISTINCT investor_id) FROM investor_series WHERE series_id = X`
- **Progress**: `(funds_raised / target_amount) * 100`
- **Lock-in Status**: Based on `issue_date + 1 year` vs current date
- **Maturity Status**: Based on `maturity_date` vs current date

---

## 🚨 **Critical Requirements**

### **Must Have:**
1. ✅ **Complete database schema** with all fields
2. ✅ **File upload handling** for documents (Base64 storage)
3. ✅ **Status workflow management** (Draft → Approved → Active → Matured)
4. ✅ **Investment tracking** per series
5. ✅ **Audit logging** for all changes
6. ✅ **Date-based calculations** for lock-in and maturity
7. ✅ **Document management** for investor documents

### **API Endpoints Needed:**
- `GET /api/v1/series` - List all series
- `POST /api/v1/series` - Create new series
- `GET /api/v1/series/{id}` - Get series details
- `PUT /api/v1/series/{id}` - Update series
- `DELETE /api/v1/series/{id}` - Delete series
- `POST /api/v1/series/{id}/documents` - Upload series documents
- `POST /api/v1/series/{id}/investors/{investor_id}/documents` - Upload investor documents
- `GET /api/v1/series/{id}/investments` - Get series investments
- `POST /api/v1/series/{id}/investments` - Add investment to series

---

## ✅ **Next Steps**

1. **Review this analysis** and confirm all requirements
2. **Update MySQL database schema** with new tables
3. **Create FastAPI endpoints** for all series operations
4. **Implement file upload handling** for documents
5. **Update frontend** to use new API endpoints
6. **Test integration** with other pages (Investors, Interest Payout, etc.)

This analysis covers **100% of the current frontend functionality** and provides a complete database schema to support all features. The NCD Series module will be the foundation for the entire investment management system.