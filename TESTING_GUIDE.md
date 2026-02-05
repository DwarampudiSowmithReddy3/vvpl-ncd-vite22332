# 🧪 Complete Testing Guide for NCD Management System

## 🚀 Quick Start Testing

### 1. Start the Backend Server
```bash
cd backend
python scripts/init_db.py  # Initialize database (first time only)
python run.py              # Start server
```

### 2. Verify Server is Running
```bash
cd backend
python test_server.py      # Basic server health check
```

### 3. Test All APIs
```bash
cd backend
python test_all_apis.py    # Comprehensive API testing
```

## 📱 Frontend Integration Testing

### Method 1: Browser Console Testing (Recommended)

1. **Open your React app** in browser (http://localhost:3000)
2. **Open Developer Tools** (F12)
3. **Go to Console tab**
4. **Copy and paste** the content from `test_frontend_integration.js`
5. **Run tests:**

```javascript
// Test current page only
const tester = new FrontendIntegrationTester();
await tester.testCurrentPage();

// Test all pages
await tester.testAllPages();
```

### Method 2: Page-by-Page Manual Testing

## 🔍 Page-by-Page Testing Checklist

### 1. 🔐 Login Page (`/login`)

**What to Test:**
- [ ] Admin login works
- [ ] Investor login works (if implemented)
- [ ] Error messages display correctly
- [ ] Token is stored properly
- [ ] Redirect after login works

**Browser Console Test:**
```javascript
const tester = new FrontendIntegrationTester();
await tester.testLoginPage();
```

**Manual Test:**
1. Try login with: `username: admin`, `password: admin123`
2. Check if you're redirected to dashboard
3. Verify token is stored in localStorage/sessionStorage

---

### 2. 📊 Dashboard Page (`/dashboard`)

**What to Test:**
- [ ] Dashboard metrics load (series, investors, investments, etc.)
- [ ] Charts and graphs display data
- [ ] Recent activities show
- [ ] Navigation works
- [ ] Real-time data updates

**Browser Console Test:**
```javascript
await tester.testDashboardPage();
```

**Expected API Responses:**
```json
{
  "series": { "total": 0, "active": 0, "draft": 0, "closed": 0 },
  "investors": { "total": 0, "new_this_month": 0 },
  "investments": { "total_amount": 0, "total_count": 0 },
  "payouts": { "pending": 0, "this_month": 0 },
  "grievances": { "open": 0, "resolved_this_month": 0 },
  "compliance": { "overdue": 0, "due_soon": 0 }
}
```

---

### 3. 📈 NCD Series Management (`/series`)

**What to Test:**
- [ ] Series list loads
- [ ] Create new series form works
- [ ] Edit series functionality
- [ ] Series status updates
- [ ] Approval workflow
- [ ] Document upload
- [ ] Search and filters

**Browser Console Test:**
```javascript
await tester.testSeriesPage();
```

**Test Creating a Series:**
1. Click "Add New Series"
2. Fill form with test data
3. Submit and verify it appears in list
4. Check if backend receives correct data

---

### 4. 👥 Investors Management (`/investors`)

**What to Test:**
- [ ] Investors list loads
- [ ] Search functionality works
- [ ] Investor details page
- [ ] KYC document upload
- [ ] Investment history
- [ ] Add/Edit investor

**Browser Console Test:**
```javascript
await tester.testInvestorsPage();
```

---

### 5. 💰 Interest Payout (`/interest`)

**What to Test:**
- [ ] Payout list loads
- [ ] Interest calculation
- [ ] Batch processing
- [ ] Excel import/export
- [ ] Payment status updates
- [ ] Filters and search

**Browser Console Test:**
```javascript
await tester.testInterestPage();
```

---

### 6. 📋 Compliance (`/compliance`)

**What to Test:**
- [ ] Compliance requirements load
- [ ] Status tracking works
- [ ] Document upload
- [ ] Due date alerts
- [ ] Progress updates
- [ ] Regulatory reporting

**Browser Console Test:**
```javascript
await tester.testCompliancePage();
```

---

### 7. 📄 Reports (`/reports`)

**What to Test:**
- [ ] Reports list loads
- [ ] Report generation
- [ ] Download functionality
- [ ] Different report types
- [ ] Export formats (PDF, Excel, CSV)
- [ ] Report parameters

**Browser Console Test:**
```javascript
await tester.testReportsPage();
```

---

### 8. 📧 Communication (`/communication`)

**What to Test:**
- [ ] Communication list loads
- [ ] Create new communication
- [ ] Email/SMS templates
- [ ] Recipient selection
- [ ] Delivery status
- [ ] Communication history

**Browser Console Test:**
```javascript
await tester.testCommunicationPage();
```

---

### 9. 🎫 Grievance Management (`/grievance`)

**What to Test:**
- [ ] Investor grievances load
- [ ] Trustee grievances load
- [ ] Create new grievance
- [ ] Assignment functionality
- [ ] Status updates
- [ ] Resolution tracking
- [ ] SLA monitoring

**Browser Console Test:**
```javascript
await tester.testGrievancePage();
```

---

### 10. ⚙️ Administration (`/admin`)

**What to Test:**
- [ ] User management
- [ ] Role assignments
- [ ] System settings
- [ ] Audit logs
- [ ] System health
- [ ] Backup/restore

**Browser Console Test:**
```javascript
await tester.testAdminPage();
```

## 🔧 Troubleshooting Common Issues

### Backend Not Starting
```bash
# Check if port 8000 is free
netstat -an | grep 8000

# Install missing dependencies
pip install -r backend/requirements.txt

# Check database initialization
python backend/scripts/init_db.py
```

### CORS Issues
If you see CORS errors in browser console:
1. Check `BACKEND_CORS_ORIGINS` in `.env`
2. Ensure it includes your frontend URL
3. Restart backend server

### Authentication Issues
```javascript
// Check if token exists
console.log('Token:', localStorage.getItem('token'));

// Test login manually
fetch('http://localhost:8000/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'admin',
    password: 'admin123',
    user_type: 'admin'
  })
}).then(r => r.json()).then(console.log);
```

### Database Issues
```bash
# Reset database
rm backend/ncd_management.db
python backend/scripts/init_db.py
```

## 📊 Expected Test Results

### ✅ Successful Integration
- All API endpoints return 200 status
- Data loads correctly in frontend
- Forms submit successfully
- Navigation works smoothly
- No console errors

### ⚠️ Partial Success
- Most APIs work but some return errors
- Data loads but formatting issues
- Some forms don't submit
- Minor console warnings

### ❌ Integration Issues
- Multiple 404/500 errors
- Data doesn't load
- Forms fail to submit
- CORS errors
- Authentication failures

## 🎯 Performance Testing

### Load Testing
```bash
# Install Apache Bench
sudo apt-get install apache2-utils

# Test API performance
ab -n 1000 -c 10 http://localhost:8000/api/v1/dashboard/metrics
```

### Frontend Performance
1. Open Chrome DevTools
2. Go to Network tab
3. Reload page and check:
   - API response times
   - Total page load time
   - Number of requests

## 🚀 Production Readiness Checklist

- [ ] All tests pass (>90% success rate)
- [ ] No console errors
- [ ] Authentication works properly
- [ ] All CRUD operations function
- [ ] File uploads work
- [ ] Reports generate correctly
- [ ] Email/SMS integration tested
- [ ] Database performance acceptable
- [ ] Security headers present
- [ ] Error handling works

## 📞 Support

If you encounter issues:
1. Check the console for error messages
2. Verify backend server is running
3. Test individual API endpoints
4. Check network requests in DevTools
5. Review backend logs for errors

**Backend API Documentation:** http://localhost:8000/docs