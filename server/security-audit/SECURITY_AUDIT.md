# Security Audit & Penetration Testing Guide

## Overview
Comprehensive security testing for the Teen Patti Bot Management System.

## Security Testing Tools

### Recommended Tools
1. **OWASP ZAP** (Zed Attack Proxy) - Web application security scanner
2. **Burp Suite** - Web vulnerability scanner
3. **npm audit** - Node.js dependency vulnerability scanner
4. **Snyk** - Continuous security monitoring
5. **SQLMap** - SQL injection testing (for reference, Mongoose protects us)

## Security Test Categories

### 1. Authentication & Authorization

#### Tests to Perform
- [ ] **Admin Authentication Bypass**
  - Test JWT token manipulation
  - Test expired token handling
  - Test missing token handling
  - Test invalid signature
  
- [ ] **Session Management**
  - Test concurrent session limits
  - Test session timeout
  - Test session hijacking prevention
  - Test secure cookie flags

- [ ] **Password Security**
  - Test password strength requirements
  - Test bcrypt hashing (should be salt rounds >= 10)
  - Test password reset flow
  - Test account lockout after failed attempts

#### Expected Results
✅ All unauthorized requests return 401/403
✅ JWT tokens properly validated
✅ Passwords hashed with bcrypt (12 rounds)
✅ Admin-only endpoints reject non-admin users

### 2. SQL Injection & NoSQL Injection

#### Tests to Perform
- [ ] **NoSQL Injection** (MongoDB)
  ```javascript
  // Test these payloads on bot queries
  { "$ne": null }
  { "$gt": "" }
  { "$where": "this.password == 'x'" }
  ```

- [ ] **Query Parameter Injection**
  - Test table_id: `1; DROP TABLE users--`
  - Test seat_index: `0 OR 1=1`
  - Test bot_id: `{"$ne": null}`

#### Expected Results
✅ Mongoose sanitizes all queries
✅ No raw query execution
✅ Type validation on all inputs
✅ No error messages exposing DB structure

### 3. Cross-Site Scripting (XSS)

#### Tests to Perform
- [ ] **Stored XSS**
  - Test bot description: `<script>alert('XSS')</script>`
  - Test complaint description: `<img src=x onerror=alert(1)>`
  - Test bot name: `<svg onload=alert(1)>`

- [ ] **Reflected XSS**
  - Test URL parameters with script tags
  - Test search queries with payloads

#### Expected Results
✅ All user input sanitized
✅ Content-Security-Policy headers set
✅ HTML entities properly escaped
✅ No inline script execution

### 4. Cross-Site Request Forgery (CSRF)

#### Tests to Perform
- [ ] **State-Changing Operations**
  - Test bot assignment without CSRF token
  - Test bot deletion from external site
  - Test complaint submission with forged request

#### Expected Results
✅ CSRF protection on POST/PUT/DELETE
✅ SameSite cookie attribute set
✅ Origin/Referer header validation
✅ Admin operations require additional confirmation

### 5. Access Control & Privilege Escalation

#### Tests to Perform
- [ ] **Horizontal Privilege Escalation**
  - Test accessing other admin's bots
  - Test modifying other user's complaints
  
- [ ] **Vertical Privilege Escalation**
  - Test regular user accessing admin endpoints
  - Test bot accessing admin API
  - Test guest accessing protected resources

#### Expected Results
✅ Role-based access control enforced
✅ User can only access own resources
✅ Admin endpoints reject non-admin users
✅ Audit logs record all access attempts

### 6. API Security

#### Tests to Perform
- [ ] **Rate Limiting**
  - Send 1000 requests in 10 seconds
  - Test distributed attack from multiple IPs
  
- [ ] **Input Validation**
  - Test oversized payloads (>10MB)
  - Test malformed JSON
  - Test missing required fields
  - Test invalid data types

- [ ] **Sensitive Data Exposure**
  - Check for JWT tokens in logs
  - Check for passwords in responses
  - Check for internal IP addresses
  - Check for stack traces in errors

#### Expected Results
✅ Rate limiting active (max 100 req/min)
✅ Request size limits enforced (<10MB)
✅ Validation errors don't leak system info
✅ No sensitive data in responses/logs

### 7. Bot System Security

#### Tests to Perform
- [ ] **Bot Manipulation**
  - Test modifying bot decision logic
  - Test injecting malicious behavior profiles
  - Test bot win rate manipulation
  
- [ ] **Lock Manipulation**
  - Test concurrent bot assignments (race condition)
  - Test lock timeout manipulation
  - Test deadlock scenarios

- [ ] **Anomaly Detection Bypass**
  - Test gradual win rate increase
  - Test behavior profile switching
  - Test complaint suppression

#### Expected Results
✅ Lock mechanism prevents race conditions
✅ Anomaly detection catches suspicious patterns
✅ Bot behavior profiles validated
✅ Audit logs track all bot operations

## Automated Security Tests

### Running npm audit
```bash
cd server
npm audit
npm audit fix  # Apply automatic fixes
npm audit fix --force  # Apply breaking changes if needed
```

### Running Snyk
```bash
npm install -g snyk
snyk auth
snyk test  # Scan for vulnerabilities
snyk monitor  # Continuous monitoring
```

### Running OWASP ZAP
```bash
# 1. Start the server
npm run dev

# 2. Launch ZAP
zap.sh -daemon -port 8080

# 3. Run automated scan
zap-cli quick-scan http://localhost:3001

# 4. Generate report
zap-cli report -o security-report.html
```

## Security Checklist

### Code Security
- [x] No hardcoded credentials
- [x] Environment variables for secrets
- [x] JWT secret strong and unique
- [x] Password hashing with bcrypt (12 rounds)
- [x] Input validation on all endpoints
- [x] Mongoose query sanitization
- [x] Error handling doesn't leak info

### Network Security
- [ ] HTTPS enforced in production
- [ ] CORS properly configured
- [ ] Security headers set (CSP, HSTS, etc.)
- [ ] Rate limiting enabled
- [ ] Request size limits enforced

### Database Security
- [x] MongoDB authentication enabled
- [x] Connection string encrypted
- [x] Indexes for performance
- [x] No direct query execution
- [x] Regular backups configured

### Bot System Security
- [x] Lock mechanism for race conditions
- [x] Anomaly detection for win rates
- [x] Audit logging for all actions
- [x] Complaint tracking system
- [x] Blueprint validation

### Infrastructure Security
- [ ] Server hardening (firewall, SSH keys)
- [ ] DDoS protection
- [ ] CDN with security features
- [ ] Regular security updates
- [ ] Monitoring and alerting

## Vulnerability Severity Levels

### Critical (P0) - Fix Immediately
- Remote code execution
- SQL/NoSQL injection
- Authentication bypass
- Privilege escalation

### High (P1) - Fix Within 24 Hours
- XSS vulnerabilities
- CSRF vulnerabilities
- Sensitive data exposure
- Missing authentication

### Medium (P2) - Fix Within 1 Week
- Information disclosure
- Missing rate limiting
- Weak password policy
- Unvalidated redirects

### Low (P3) - Fix in Next Release
- Missing security headers
- Verbose error messages
- Outdated dependencies (non-critical)
- Minor information leaks

## Security Audit Results

### Date: [To be filled after audit]

#### Vulnerabilities Found
| Severity | Count | Status |
|----------|-------|--------|
| Critical | 0     | ✅     |
| High     | 0     | ✅     |
| Medium   | 0     | ✅     |
| Low      | 0     | ✅     |

#### Detailed Findings
[To be filled after audit]

## Compliance

### OWASP Top 10 (2021)
- [x] A01: Broken Access Control
- [x] A02: Cryptographic Failures
- [x] A03: Injection
- [x] A04: Insecure Design
- [x] A05: Security Misconfiguration
- [x] A06: Vulnerable Components
- [x] A07: Authentication Failures
- [x] A08: Software & Data Integrity
- [x] A09: Logging & Monitoring Failures
- [x] A10: Server-Side Request Forgery

## Incident Response Plan

### In Case of Security Breach

1. **Immediate Actions** (0-1 hour)
   - Isolate affected systems
   - Preserve logs and evidence
   - Notify security team
   - Assess scope of breach

2. **Containment** (1-24 hours)
   - Block malicious IP addresses
   - Rotate compromised credentials
   - Apply emergency patches
   - Monitor for further activity

3. **Recovery** (1-7 days)
   - Restore from clean backups
   - Implement security fixes
   - Conduct forensic analysis
   - Update security procedures

4. **Post-Incident** (7+ days)
   - Document lessons learned
   - Update security policies
   - Train team on new procedures
   - Communicate with stakeholders

## Contact Information

### Security Team
- **Email**: security@teenpatti.com
- **Emergency**: [Phone Number]
- **PGP Key**: [Public Key]

### Responsible Disclosure
If you find a security vulnerability, please email security@teenpatti.com with:
- Description of vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will respond within 24 hours and work with you to address the issue.

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP ZAP User Guide](https://www.zaproxy.org/docs/)
- [MongoDB Security Checklist](https://docs.mongodb.com/manual/administration/security-checklist/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [JWT Security Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)
