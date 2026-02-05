# 🏦 NCD Management System

A comprehensive **Non-Convertible Debentures (NCD) Management System** built with modern React technology. This enterprise-grade application provides complete investor management, series tracking, communication tools, and compliance features.

## ✨ Features

### 🎯 **Core Modules**
- **📊 Dashboard** - Real-time analytics and KPIs
- **💰 NCD Series Management** - Create and manage investment series
- **👥 Investor Management** - Complete investor lifecycle management
- **📈 Reports** - Comprehensive reporting and analytics
- **📋 Compliance** - Regulatory compliance tracking
- **💸 Interest Payout** - Automated interest calculations and payments
- **📱 Communication** - Advanced SMS/Email communication system
- **⚙️ Administration** - User and system management
- **✅ Approval Workflow** - Multi-level approval system
- **🎫 Grievance Management** - Customer complaint handling

### 🚀 **Advanced Features**
- **🔍 Smart Search & Filtering** - Find anything instantly
- **📱 Fully Responsive** - Works on all devices and zoom levels (125%-200%)
- **🎨 Professional UI** - Enterprise-grade design
- **🔒 Role-Based Access** - Granular permission system
- **📝 Audit Logging** - Complete activity tracking
- **📊 Real-time Analytics** - Live data updates
- **💾 Data Export** - Excel, PDF, CSV exports
- **🌐 Multi-platform** - Deploy anywhere

## 🛠️ Technology Stack

- **Frontend:** React 19, Vite, React Router
- **Styling:** Modern CSS with responsive design
- **Icons:** React Icons
- **Charts:** Built-in analytics
- **Export:** XLSX, jsPDF
- **State Management:** React Context API
- **Build Tool:** Vite (Lightning fast)

## 🚀 Quick Start

### **1. Clone & Install**
```bash
git clone <repository-url>
cd ncd-management-system
npm install
```

### **2. Configure Environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

### **3. Run Development Server**
```bash
npm run dev
```

### **4. Build for Production**
```bash
npm run build
```

## 🌐 Deployment

### **Option 1: Vercel (Recommended)**
```bash
npx vercel --prod
```

### **Option 2: Docker**
```bash
docker build -t ncd-system .
docker run -p 80:80 ncd-system
```

### **Option 3: Traditional Hosting**
```bash
npm run build
# Upload dist/ folder to your web server
```

## 📋 System Requirements

### **Minimum Requirements**
- **Browser:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Server:** Any static hosting or VPS with 1GB RAM
- **Network:** HTTPS enabled, CDN recommended

### **Recommended Setup**
- **Hosting:** Vercel, Netlify, or AWS S3 + CloudFront
- **Database:** PostgreSQL 13+ (for backend integration)
- **Cache:** Redis 6+ (optional)
- **Monitoring:** Sentry for error tracking

## 🔧 Configuration

### **Environment Variables**
```env
# API Configuration
VITE_API_BASE_URL=https://your-api.com/api

# SMS Configuration
VITE_SMS_PROVIDER=twilio
VITE_SMS_API_KEY=your_twilio_sid
VITE_SMS_API_SECRET=your_twilio_token

# Email Configuration
VITE_EMAIL_PROVIDER=sendgrid
VITE_EMAIL_API_KEY=your_sendgrid_key
VITE_EMAIL_FROM=noreply@yourcompany.com
```

### **Default Users**
```javascript
// Login credentials for testing
Admin: admin@example.com / admin123
Finance Manager: fm@example.com / sowmith
Compliance Manager: cm@example.com / sowmith
Board Member: bmb@example.com / sowmith
```

## 📱 Communication System

### **Advanced Features**
- **🎯 Series-Based Targeting** - Select investors by series
- **🔍 Smart Search** - Find series and investors instantly
- **✅ Multi-Selection** - Send to multiple series at once
- **🗑️ Individual Removal** - Remove specific investors
- **📝 Template System** - Pre-built message templates
- **📊 Delivery Tracking** - Monitor message status
- **📈 History Management** - Complete communication logs

### **Supported Providers**
- **SMS:** Twilio, TextLocal, Custom API
- **Email:** SendGrid, AWS SES, Custom SMTP

## 🔒 Security Features

- **🔐 JWT Authentication** - Secure token-based auth
- **👤 Role-Based Access** - Granular permissions
- **🛡️ HTTPS Enforcement** - Secure data transmission
- **📝 Audit Logging** - Complete activity tracking
- **🔒 Data Encryption** - Secure data storage
- **🚫 XSS Protection** - Security headers implemented

## 📊 Performance

- **⚡ Lightning Fast** - Vite build system
- **📱 Mobile Optimized** - 60fps animations
- **🗜️ Optimized Bundle** - Code splitting implemented
- **🌐 CDN Ready** - Global content delivery
- **📈 Scalable** - Handles 1000+ concurrent users

## 🎨 UI/UX Features

- **📱 Responsive Design** - Works on all screen sizes
- **🔍 Zoom Support** - 125%, 150%, 200% browser zoom
- **🎨 Professional Theme** - Enterprise-grade design
- **⚡ Smooth Animations** - 60fps interactions
- **♿ Accessibility** - WCAG 2.1 compliant
- **🌙 Dark Mode Ready** - Easy theme switching

## 📈 Analytics & Reporting

- **📊 Real-time Dashboard** - Live KPIs and metrics
- **📈 Investment Tracking** - Series performance analytics
- **👥 Investor Analytics** - User behavior insights
- **💰 Financial Reports** - Revenue and payout tracking
- **📋 Compliance Reports** - Regulatory compliance status
- **📱 Communication Analytics** - Message delivery stats

## 🔄 Integration Ready

### **Backend APIs**
- RESTful API architecture
- JWT authentication endpoints
- CRUD operations for all entities
- File upload handling
- Real-time notifications

### **Third-party Services**
- SMS providers (Twilio, TextLocal)
- Email services (SendGrid, AWS SES)
- Payment gateways (ready for integration)
- Document storage (AWS S3, Google Cloud)
- Analytics (Google Analytics, Mixpanel)

## 📚 Documentation

- **📖 [Deployment Guide](DEPLOYMENT_GUIDE.md)** - Complete deployment instructions
- **🖥️ [System Requirements](SYSTEM_REQUIREMENTS.md)** - Technical specifications
- **🔧 [API Documentation](API_DOCS.md)** - Backend integration guide
- **👨‍💻 [Developer Guide](DEVELOPER_GUIDE.md)** - Development setup and guidelines

## 🆘 Support

- **📧 Email:** support@yourcompany.com
- **📞 Phone:** +1-XXX-XXX-XXXX
- **💬 Chat:** Available in application
- **📖 Documentation:** Comprehensive guides provided
- **🎥 Video Tutorials:** Available on request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🎉 Acknowledgments

- Built with ❤️ using React 19 and Vite
- Icons by React Icons
- UI inspired by modern enterprise applications
- Responsive design following mobile-first principles

---

## 🚀 **Ready to Deploy!**

This NCD Management System is **production-ready** and can be deployed to any platform in minutes. Whether you're running a small investment firm or a large financial institution, this system scales to meet your needs.

**Get started today and transform your NCD management process!**

---

*For technical support or custom development, please contact our team.*