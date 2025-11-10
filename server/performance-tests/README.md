# Performance Testing Guide

## Overview
This directory contains performance testing scripts and configurations for the Teen Patti Bot Management System.

## Tools Used
- **Artillery**: HTTP load testing and benchmarking
- **k6**: Modern load testing for developers

## Test Scenarios

### 1. Bot Management API Load Test (30% weight)
- Tests bot blueprint retrieval
- Tests bot instance queries
- Tests bot assignment operations
- **Target**: < 200ms response time at 100 req/sec

### 2. Analytics API Load Test (20% weight)
- Tests system analytics endpoint
- Tests table-specific analytics
- Tests win rate analysis
- Tests anomaly detection
- **Target**: < 300ms response time at 50 req/sec

### 3. Bot Decision Engine Load Test (30% weight)
- Tests bot instance queries with filters
- Simulates real-time decision making load
- **Target**: < 150ms response time at 100 req/sec

### 4. Complaint API Load Test (20% weight)
- Tests complaint retrieval
- Tests complaint creation
- **Target**: < 200ms response time at 50 req/sec

## Running Tests

### Prerequisites
```bash
npm install --save-dev artillery k6
```

### Run Artillery Tests
```bash
# Run load test
npm run test:performance

# Run with custom config
artillery run performance-tests/artillery-config.yml

# Generate HTML report
artillery run --output report.json performance-tests/artillery-config.yml
artillery report report.json --output report.html
```

### Run Database Optimization
```bash
# Create indexes for better query performance
npm run db:optimize
```

## Performance Metrics

### Target Response Times
- **Bot API Endpoints**: < 200ms (p95)
- **Analytics Endpoints**: < 300ms (p95)
- **Decision Engine**: < 150ms (p95)
- **Complaint API**: < 200ms (p95)

### Target Throughput
- **Sustained Load**: 100 requests/second
- **Peak Load**: 150 requests/second
- **Success Rate**: > 99%
- **Error Rate**: < 1%

### Database Performance
- **Query Time**: < 50ms (p95)
- **Index Usage**: > 90% of queries
- **Connection Pool**: 10-50 connections

## Database Indexes

The `optimize-database.ts` script creates the following indexes:

### bot_instances
- `is_active` (single)
- `blueprint_id` (single)
- `created_at` (descending)
- `is_active + blueprint_id` (compound)

### bot_blueprints
- `is_active` (single)
- `name` (single)
- `behavior_profile` (single)

### table_seats
- `table_id` (single)
- `seat_index` (single)
- `bot_id` (single)
- `is_occupied` (single)
- `table_id + seat_index` (compound, unique)
- `table_id + is_occupied` (compound)

### bot_complaints
- `table_id` (single)
- `seat_index` (single)
- `status` (single)
- `severity` (single)
- `reported_at` (descending)
- `table_id + seat_index` (compound)
- `status + severity` (compound)

### bot_action_logs
- `bot_id` (single)
- `action_type` (single)
- `timestamp` (descending)
- `bot_id + timestamp` (compound)

### bot_seat_assignments
- `bot_id` (single)
- `table_id` (single)
- `assigned_at` (descending)
- `bot_id + table_id` (compound)

## Redis Caching Strategy

### Blueprint Cache
- **Key Pattern**: `blueprint:{id}`
- **TTL**: 1 hour
- **Invalidation**: On blueprint update/delete

### Active Bots Cache
- **Key Pattern**: `bots:active`
- **TTL**: 5 minutes
- **Invalidation**: On bot status change

### Table Stats Cache
- **Key Pattern**: `table:{id}:stats`
- **TTL**: 1 minute
- **Invalidation**: On game end

### Analytics Cache
- **Key Pattern**: `analytics:system`
- **TTL**: 5 minutes
- **Invalidation**: On significant bot activity

## Optimization Checklist

- [x] Database indexes created
- [x] Query optimization verified
- [ ] Redis caching implemented
- [ ] Connection pooling configured
- [ ] Response compression enabled
- [ ] API rate limiting configured
- [ ] Load balancing tested
- [ ] CDN for static assets
- [ ] Database query profiling
- [ ] Memory leak detection

## Performance Test Results

### Baseline (Before Optimization)
- Average Response Time: TBD
- Requests/Second: TBD
- Success Rate: TBD

### After Optimization
- Average Response Time: TBD
- Requests/Second: TBD
- Success Rate: TBD

## Monitoring

### Key Metrics to Monitor
1. **Response Times**: p50, p95, p99
2. **Throughput**: Requests per second
3. **Error Rate**: 4xx and 5xx errors
4. **Database Performance**: Query time, connection count
5. **Memory Usage**: Heap size, garbage collection
6. **CPU Usage**: Per process and system-wide

### Alert Thresholds
- Response time p95 > 500ms
- Error rate > 1%
- Database query time > 100ms
- Memory usage > 80%
- CPU usage > 80%

## Troubleshooting

### Slow Queries
1. Check if indexes are being used: `db.collection.explain()`
2. Analyze query patterns
3. Add missing indexes
4. Consider denormalization for frequently accessed data

### High Memory Usage
1. Check for memory leaks
2. Review connection pool size
3. Enable garbage collection logging
4. Profile memory usage with heap snapshots

### High Error Rate
1. Check database connection limits
2. Verify rate limiting configuration
3. Review application logs for errors
4. Check server resources (CPU, memory, disk)

## Next Steps

1. Run performance tests with realistic load
2. Implement Redis caching layer
3. Configure CDN for static assets
4. Set up monitoring and alerting
5. Perform stress testing with 2x expected load
6. Document performance optimization results
