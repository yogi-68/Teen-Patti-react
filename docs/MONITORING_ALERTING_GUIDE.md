# Monitoring & Alerting Configuration Guide

## Overview
Comprehensive monitoring and alerting setup for Teen Patti Bot Management System using industry-standard tools.

## Monitoring Stack

### Recommended Tools
1. **Application Monitoring**: Sentry, New Relic, or DataDog
2. **Infrastructure Monitoring**: Render.com built-in + CloudWatch
3. **Uptime Monitoring**: UptimeRobot or Pingdom
4. **Log Management**: Logtail, Papertrail, or CloudWatch Logs
5. **Performance Monitoring**: Web Vitals, Lighthouse CI

---

## 1. Application Monitoring (Sentry)

### Setup

```bash
cd server
npm install @sentry/node @sentry/tracing
```

### Configuration

**server/src/config/sentry.ts**:
```typescript
import * as Sentry from '@sentry/node';
import * as Tracing from '@sentry/tracing';
import express from 'express';

export function initSentry(app: express.Application) {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
        new Tracing.Integrations.Express({ app }),
        new Tracing.Integrations.Mongo({
          useMongoose: true
        }),
      ],
      beforeSend(event, hint) {
        // Filter out sensitive data
        if (event.request) {
          delete event.request.cookies;
          delete event.request.headers?.authorization;
        }
        return event;
      },
    });

    // RequestHandler must be the first middleware
    app.use(Sentry.Handlers.requestHandler());
    app.use(Sentry.Handlers.tracingHandler());

    console.log('✓ Sentry initialized');
  }
}

export function sentryErrorHandler(app: express.Application) {
  // ErrorHandler must be before any other error middleware
  app.use(Sentry.Handlers.errorHandler());
}
```

### Environment Variables
```env
SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/0
SENTRY_ENVIRONMENT=production
```

### Custom Error Tracking

```typescript
import * as Sentry from '@sentry/node';

// Track bot anomalies
export function trackBotAnomaly(bot: BotInstance, anomaly: Anomaly) {
  Sentry.captureMessage('Bot Anomaly Detected', {
    level: 'warning',
    tags: {
      bot_id: bot.id,
      anomaly_type: anomaly.issue_type,
      severity: anomaly.severity
    },
    extra: {
      win_rate: bot.win_rate,
      games_played: bot.games_played,
      metric_value: anomaly.metric_value
    }
  });
}

// Track API errors
export function trackAPIError(error: Error, context: any) {
  Sentry.captureException(error, {
    tags: {
      endpoint: context.endpoint,
      method: context.method
    },
    extra: context
  });
}
```

---

## 2. Infrastructure Monitoring (Render.com + CloudWatch)

### Render.com Built-in Metrics

**Available Metrics**:
- CPU usage (%)
- Memory usage (MB)
- Network I/O (MB/s)
- HTTP requests (#/min)
- Response times (ms)

**Alert Configuration**:
1. Go to Render Dashboard → Your Service → Metrics
2. Click "Create Alert"
3. Configure thresholds:
   - CPU > 80% for 5 minutes
   - Memory > 400MB for 5 minutes
   - Response time > 1000ms for 3 minutes
   - Error rate > 1% for 2 minutes

### CloudWatch Logs (if using AWS)

**Log Groups to Create**:
- `/teen-patti/application` - Application logs
- `/teen-patti/bot-decisions` - Bot decision logs
- `/teen-patti/anomalies` - Anomaly detection logs
- `/teen-patti/errors` - Error logs

**Metric Filters**:
```json
{
  "filterName": "BotAnomalyCount",
  "filterPattern": "[time, request_id, level=WARNING, msg=\"Bot*Anomaly*\"]",
  "metricTransformations": [{
    "metricName": "BotAnomalies",
    "metricNamespace": "TeenPatti/Bots",
    "metricValue": "1"
  }]
}
```

---

## 3. Custom Monitoring Endpoints

### Health Check Endpoint

**server/src/routes/health.ts**:
```typescript
import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

router.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: 'unknown',
      memory: 'unknown',
      cpu: 'unknown'
    }
  };

  // Database check
  try {
    if (mongoose.connection.readyState === 1) {
      health.checks.database = 'connected';
    } else {
      health.checks.database = 'disconnected';
      health.status = 'unhealthy';
    }
  } catch (error) {
    health.checks.database = 'error';
    health.status = 'unhealthy';
  }

  // Memory check
  const memUsage = process.memoryUsage();
  const memUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  health.checks.memory = memUsagePercent > 90 ? 'critical' : 'healthy';
  if (memUsagePercent > 90) health.status = 'degraded';

  // CPU check (simple approximation)
  const cpuUsage = process.cpuUsage();
  health.checks.cpu = 'healthy'; // More complex CPU monitoring needed

  res.status(health.status === 'healthy' ? 200 : 503).json(health);
});

router.get('/health/detailed', async (req, res) => {
  const detailed = {
    ...await getBasicHealth(),
    bot_stats: await getBotStats(),
    database_stats: await getDatabaseStats(),
    performance: await getPerformanceMetrics()
  };

  res.json(detailed);
});

export default router;
```

### Metrics Endpoint

**server/src/routes/metrics.ts**:
```typescript
import express from 'express';

const router = express.Router();

let metrics = {
  requests_total: 0,
  errors_total: 0,
  response_times: [] as number[],
  active_bots: 0,
  games_played: 0,
  anomalies_detected: 0
};

// Middleware to track requests
export function metricsMiddleware(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    metrics.requests_total++;
    if (res.statusCode >= 400) {
      metrics.errors_total++;
    }
    
    const duration = Date.now() - start;
    metrics.response_times.push(duration);
    
    // Keep only last 1000 response times
    if (metrics.response_times.length > 1000) {
      metrics.response_times = metrics.response_times.slice(-1000);
    }
  });
  
  next();
}

router.get('/metrics', (req, res) => {
  const avgResponseTime = metrics.response_times.length > 0
    ? metrics.response_times.reduce((a, b) => a + b, 0) / metrics.response_times.length
    : 0;

  res.json({
    requests_total: metrics.requests_total,
    errors_total: metrics.errors_total,
    error_rate: metrics.requests_total > 0 
      ? (metrics.errors_total / metrics.requests_total) * 100 
      : 0,
    avg_response_time: avgResponseTime,
    active_bots: metrics.active_bots,
    games_played: metrics.games_played,
    anomalies_detected: metrics.anomalies_detected
  });
});

export function updateBotMetrics(active: number) {
  metrics.active_bots = active;
}

export function incrementGamesPlayed() {
  metrics.games_played++;
}

export function incrementAnomaliesDetected() {
  metrics.anomalies_detected++;
}

export default router;
```

---

## 4. Alerting Rules

### Critical Alerts (Immediate Action Required)

#### Database Connection Lost
```yaml
alert: DatabaseDown
condition: database_connection_status == 0
duration: 1 minute
severity: critical
notification: 
  - PagerDuty
  - SMS
  - Email
message: "Database connection lost! Application cannot function."
```

#### High Error Rate
```yaml
alert: HighErrorRate
condition: error_rate > 5%
duration: 2 minutes
severity: critical
notification:
  - Slack
  - Email
message: "Error rate above 5% for 2+ minutes"
```

#### Memory Leak
```yaml
alert: MemoryLeak
condition: memory_usage > 90%
duration: 5 minutes
severity: critical
notification:
  - PagerDuty
  - Slack
message: "Memory usage above 90% for 5+ minutes. Possible memory leak."
```

### High Priority Alerts (Action Within 1 Hour)

#### Bot Win Rate Anomaly
```yaml
alert: BotWinRateAnomaly
condition: bot_win_rate > 70% AND games_played > 100
duration: 10 minutes
severity: high
notification:
  - Slack
  - Email
message: "Bot {{ bot_id }} has unusual win rate: {{ win_rate }}%"
```

#### Slow Response Times
```yaml
alert: SlowResponseTimes
condition: p95_response_time > 1000ms
duration: 5 minutes
severity: high
notification:
  - Slack
message: "API response times degraded: P95 > 1000ms"
```

#### High CPU Usage
```yaml
alert: HighCPUUsage
condition: cpu_usage > 80%
duration: 10 minutes
severity: high
notification:
  - Slack
  - Email
message: "CPU usage above 80% for 10+ minutes"
```

### Medium Priority Alerts (Action Within 24 Hours)

#### Inactive Bots
```yaml
alert: InactiveBots
condition: bot_last_activity > 24 hours
duration: 1 hour
severity: medium
notification:
  - Email
message: "{{ bot_count }} bots have been inactive for 24+ hours"
```

#### Disk Space Low
```yaml
alert: DiskSpaceLow
condition: disk_usage > 80%
duration: 30 minutes
severity: medium
notification:
  - Email
message: "Disk space usage above 80%"
```

---

## 5. Uptime Monitoring (UptimeRobot)

### Setup

1. Sign up at [UptimeRobot.com](https://uptimerobot.com/)
2. Create monitors for:
   - **Main API**: `https://your-api.onrender.com/health`
   - **Frontend**: `https://your-app.vercel.app/`
   - **WebSocket**: Custom monitor for Socket.IO

### Monitor Configuration

```yaml
monitors:
  - name: "Backend API Health"
    type: HTTP(S)
    url: https://teen-patti-server.onrender.com/health
    interval: 5 minutes
    timeout: 30 seconds
    http_method: GET
    expected_status: 200
    
  - name: "Frontend"
    type: HTTP(S)
    url: https://your-app.vercel.app/
    interval: 5 minutes
    timeout: 30 seconds
    keyword_exists: "Teen Patti"
    
  - name: "Bot Analytics API"
    type: HTTP(S)
    url: https://teen-patti-server.onrender.com/api/admin/analytics/system
    interval: 10 minutes
    http_auth: "Bearer YOUR_TOKEN"
    expected_status: 200
```

### Notification Channels
- Email
- Slack webhook
- SMS (for critical alerts)
- Discord webhook
- Telegram bot

---

## 6. Log Management

### Structured Logging

**server/src/utils/logger.ts**:
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'teen-patti-server' },
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

export default logger;
```

### Log Events to Track

```typescript
// Bot decision logging
logger.info('Bot decision made', {
  bot_id: bot.id,
  action: decision.action,
  confidence: decision.confidence,
  table_id: gameState.table_id,
  pot_size: gameState.pot
});

// Anomaly detection logging
logger.warn('Bot anomaly detected', {
  bot_id: bot.id,
  anomaly_type: 'high_win_rate',
  win_rate: bot.win_rate,
  games_played: bot.games_played,
  threshold: 0.70
});

// Error logging
logger.error('Bot assignment failed', {
  bot_id: bot.id,
  table_id: table_id,
  seat_index: seat_index,
  error: error.message,
  stack: error.stack
});

// Performance logging
logger.info('API request completed', {
  method: req.method,
  path: req.path,
  status: res.statusCode,
  duration: responseTime,
  user_id: req.user?.id
});
```

---

## 7. Dashboard Configuration

### Grafana Dashboard (Optional)

**Panels to Include**:
1. **System Health**
   - CPU Usage (gauge)
   - Memory Usage (gauge)
   - Disk Usage (gauge)
   - Active Connections (time series)

2. **Application Metrics**
   - Requests per minute (graph)
   - Error rate (graph)
   - Response times (p50, p95, p99)
   - Active users (stat)

3. **Bot Metrics**
   - Total active bots (stat)
   - Bots per table (bar chart)
   - Win rate distribution (histogram)
   - Anomalies detected (counter)

4. **Game Metrics**
   - Games played per hour (graph)
   - Average game duration (stat)
   - Total pot size (stat)
   - Bot participation rate (gauge)

### Simple HTML Dashboard

```html
<!DOCTYPE html>
<html>
<head>
  <title>Teen Patti Monitoring</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .metric { display: inline-block; margin: 10px; padding: 20px; 
              background: #f0f0f0; border-radius: 8px; }
    .metric-value { font-size: 2em; font-weight: bold; }
    .metric-label { color: #666; }
    .status-healthy { color: green; }
    .status-warning { color: orange; }
    .status-critical { color: red; }
  </style>
</head>
<body>
  <h1>🎮 Teen Patti Bot Management - Live Monitoring</h1>
  
  <div id="health-status"></div>
  
  <div class="metrics">
    <div class="metric">
      <div class="metric-value" id="active-bots">-</div>
      <div class="metric-label">Active Bots</div>
    </div>
    <div class="metric">
      <div class="metric-value" id="error-rate">-</div>
      <div class="metric-label">Error Rate</div>
    </div>
    <div class="metric">
      <div class="metric-value" id="response-time">-</div>
      <div class="metric-label">Avg Response Time</div>
    </div>
    <div class="metric">
      <div class="metric-value" id="anomalies">-</div>
      <div class="metric-label">Anomalies Today</div>
    </div>
  </div>
  
  <canvas id="metrics-chart" width="800" height="400"></canvas>
  
  <script>
    async function fetchMetrics() {
      const response = await fetch('/api/metrics');
      const data = await response.json();
      
      document.getElementById('active-bots').textContent = data.active_bots;
      document.getElementById('error-rate').textContent = data.error_rate.toFixed(2) + '%';
      document.getElementById('response-time').textContent = data.avg_response_time.toFixed(0) + 'ms';
      document.getElementById('anomalies').textContent = data.anomalies_detected;
    }
    
    // Refresh every 30 seconds
    setInterval(fetchMetrics, 30000);
    fetchMetrics();
  </script>
</body>
</html>
```

---

## 8. Notification Channels

### Slack Integration

```typescript
import axios from 'axios';

export async function sendSlackAlert(alert: Alert) {
  const webhook = process.env.SLACK_WEBHOOK_URL;
  if (!webhook) return;

  const color = alert.severity === 'critical' ? 'danger' 
    : alert.severity === 'high' ? 'warning' 
    : 'good';

  await axios.post(webhook, {
    text: alert.title,
    attachments: [{
      color,
      fields: [
        { title: 'Severity', value: alert.severity, short: true },
        { title: 'Time', value: new Date().toISOString(), short: true },
        { title: 'Details', value: alert.message, short: false }
      ]
    }]
  });
}
```

### Email Notifications

```typescript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export async function sendEmailAlert(alert: Alert) {
  await transporter.sendMail({
    from: 'alerts@teenpatti.com',
    to: process.env.ALERT_EMAIL,
    subject: `[${alert.severity.toUpperCase()}] ${alert.title}`,
    html: `
      <h2>${alert.title}</h2>
      <p><strong>Severity:</strong> ${alert.severity}</p>
      <p><strong>Time:</strong> ${new Date().toISOString()}</p>
      <p><strong>Details:</strong> ${alert.message}</p>
    `
  });
}
```

---

## 9. Alert Response Procedures

### Critical Alerts
1. **Acknowledge** within 5 minutes
2. **Assess** impact and scope
3. **Escalate** to on-call engineer if needed
4. **Mitigate** immediately (rollback, scale up, etc.)
5. **Document** incident in log
6. **Post-mortem** within 48 hours

### High Priority Alerts
1. **Acknowledge** within 30 minutes
2. **Investigate** root cause
3. **Plan** fix or workaround
4. **Implement** within 4 hours
5. **Monitor** for recurrence

### Medium Priority Alerts
1. **Review** within 24 hours
2. **Add to backlog** if fix needed
3. **Schedule** for next sprint
4. **Document** findings

---

## 10. Monitoring Checklist

### Daily Monitoring
- [ ] Check error logs
- [ ] Review anomaly alerts
- [ ] Verify bot performance
- [ ] Monitor response times
- [ ] Check database performance

### Weekly Monitoring
- [ ] Review performance trends
- [ ] Analyze bot win rates
- [ ] Check disk space usage
- [ ] Review security logs
- [ ] Update alert thresholds if needed

### Monthly Monitoring
- [ ] Performance report
- [ ] Cost analysis
- [ ] Capacity planning
- [ ] Alert effectiveness review
- [ ] Monitoring tool updates

---

## Environment Variables

Add to both Render.com and .env:

```env
# Monitoring
SENTRY_DSN=https://key@sentry.io/project
LOG_LEVEL=info
ENABLE_METRICS=true

# Alerts
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx
ALERT_EMAIL=alerts@yourdomain.com

# Email (for alerts)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Thresholds
CPU_ALERT_THRESHOLD=80
MEMORY_ALERT_THRESHOLD=90
ERROR_RATE_THRESHOLD=1
RESPONSE_TIME_THRESHOLD=1000
```

---

## Success Metrics

### Availability
- **Target**: 99.9% uptime (43 minutes downtime/month)
- **Measure**: Uptime monitoring tools

### Performance
- **Target**: 95% of requests < 200ms
- **Measure**: APM tools, custom metrics

### Reliability
- **Target**: < 0.1% error rate
- **Measure**: Error tracking, logs

### Bot Health
- **Target**: < 5% anomalies detected
- **Measure**: Anomaly detection system

---

**Monitoring Setup Complete** ✅

For questions or issues, contact the DevOps team.
