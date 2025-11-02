# Teen Patti React - Documentation

## 📚 Documentation Structure

This directory contains comprehensive documentation for the Teen Patti React application, organized by category for easy navigation.

## 📁 Directory Structure

```
docs/
├── README.md                           (This file)
├── security/                           Security & Authentication
│   ├── AUTH_SYSTEM.md                 Complete authentication system documentation
│   ├── ROUTE_PROTECTION.md            Route guards and navigation protection
│   └── SESSION_PERSISTENCE.md         Session management and localStorage persistence
├── features/                           Feature Documentation
│   └── DUAL_CURRENCY_SYSTEM.md        Practice coins & real money system
└── architecture/                       System Architecture
    └── (Future architecture docs)
```

## 🔐 Security Documentation

### [Authentication System](./security/AUTH_SYSTEM.md)
Complete guide to the authentication system including:
- User registration and login
- Admin authentication
- Token management
- Session handling

### [Route Protection](./security/ROUTE_PROTECTION.md)
Comprehensive route protection system:
- AuthRoute component (authentication guard)
- AdminRoute component (admin-only access)
- ProtectedRoute component (balance requirements)
- Route guards configuration
- Navigation security

### [Session Persistence](./security/SESSION_PERSISTENCE.md)
Session management and data persistence:
- localStorage implementation
- State restoration on refresh
- Secure logout
- Data persistence strategies

## 💰 Features Documentation

### [Dual Currency System](./features/DUAL_CURRENCY_SYSTEM.md)
Practice and real money currency system:
- Practice coins (virtual currency)
- Real money system (cash)
- Wallet management
- Transactions (deposits/withdrawals)
- Subscription system

## 🏗️ Architecture Documentation

### Coming Soon
- System architecture overview
- Database schema
- API documentation
- Component hierarchy
- State management

## 📖 Quick Reference

### For New Developers
1. Start with [Authentication System](./security/AUTH_SYSTEM.md) to understand login flow
2. Read [Route Protection](./security/ROUTE_PROTECTION.md) to understand navigation guards
3. Review [Dual Currency System](./features/DUAL_CURRENCY_SYSTEM.md) for wallet/coins logic

### For Security Review
1. [Authentication System](./security/AUTH_SYSTEM.md) - Login/Register security
2. [Route Protection](./security/ROUTE_PROTECTION.md) - Access control
3. [Session Persistence](./security/SESSION_PERSISTENCE.md) - Data security

### For Feature Development
1. [Dual Currency System](./features/DUAL_CURRENCY_SYSTEM.md) - Currency implementation
2. Component documentation in respective feature folders
3. API utilities documentation

## 🔗 Related Documentation

### Root Directory
- `README.md` - Project overview and setup
- `.gitignore` - Git ignore configuration

### Client Directory
- `client/README.md` - Frontend setup and scripts
- Component-specific documentation in component folders

### Server Directory
- `server/MONGODB_SETUP.md` - Database setup
- `server/MONGOOSE_GUIDE.md` - Database models guide

## 📝 Documentation Standards

### File Naming Convention
- Use `SCREAMING_SNAKE_CASE.md` for documentation files
- Be descriptive: `ROUTE_PROTECTION.md` not `ROUTES.md`
- Include system/feature name when applicable

### Content Structure
Each documentation file should include:
1. **Overview** - Brief description
2. **Implementation Details** - Technical details
3. **Usage Examples** - Code examples
4. **Testing** - How to test the feature
5. **Troubleshooting** - Common issues and solutions

### Updating Documentation
When adding new features:
1. Create documentation in appropriate subfolder
2. Update this README with links
3. Add to Quick Reference if needed
4. Cross-reference related docs

## 🤝 Contributing to Documentation

### Adding New Documentation
1. Choose appropriate subfolder (security/features/architecture)
2. Follow naming convention
3. Use markdown formatting
4. Include code examples
5. Add to this README

### Improving Existing Documentation
1. Keep documentation up-to-date with code changes
2. Add clarifications where needed
3. Update examples if APIs change
4. Fix typos and improve clarity

## 📊 Documentation Status

| Category | Status | Last Updated |
|----------|--------|--------------|
| Security | ✅ Complete | Nov 2, 2025 |
| Features | 🟡 In Progress | Nov 2, 2025 |
| Architecture | ⏳ Planned | - |

## 🔍 Search Tips

### Finding Specific Information
- **Authentication**: Check `security/AUTH_SYSTEM.md`
- **Routes**: Check `security/ROUTE_PROTECTION.md`
- **Coins/Money**: Check `features/DUAL_CURRENCY_SYSTEM.md`
- **Database**: Check `server/MONGODB_SETUP.md`
- **Components**: Check respective component folders

### Keywords by Topic
- **Login/Register**: AUTH_SYSTEM.md
- **Permissions**: ROUTE_PROTECTION.md
- **localStorage**: SESSION_PERSISTENCE.md
- **Wallet**: DUAL_CURRENCY_SYSTEM.md
- **Admin**: AUTH_SYSTEM.md, ROUTE_PROTECTION.md

## 📞 Support

For questions about:
- **Code Implementation**: Check component source files
- **System Design**: Check architecture documentation
- **Features**: Check features documentation
- **Security**: Check security documentation

## 🎯 Future Documentation Plans

### Planned Additions
- [ ] API Documentation
- [ ] Component Library Documentation
- [ ] Testing Guide
- [ ] Deployment Guide
- [ ] Performance Optimization Guide
- [ ] Troubleshooting Guide
- [ ] FAQ

### Improvement Areas
- [ ] Add more diagrams
- [ ] Add video tutorials
- [ ] Add interactive examples
- [ ] Add API playground
- [ ] Add troubleshooting flowcharts

---

**Last Updated:** November 2, 2025  
**Version:** 1.0.0  
**Maintained By:** Development Team
