/**
 * Artillery processor for custom logic and metrics
 */

module.exports = {
  setAuthToken,
  validateResponse,
  logMetrics
};

function setAuthToken(requestParams, context, ee, next) {
  // In production, generate a valid JWT token
  // For testing, use a mock token or set adminToken in config
  return next();
}

function validateResponse(requestParams, response, context, ee, next) {
  if (response.statusCode === 200 || response.statusCode === 201) {
    ee.emit('counter', 'success_responses', 1);
  } else if (response.statusCode >= 400 && response.statusCode < 500) {
    ee.emit('counter', 'client_errors', 1);
  } else if (response.statusCode >= 500) {
    ee.emit('counter', 'server_errors', 1);
  }
  
  // Track response times
  if (response.timings && response.timings.response) {
    const responseTime = response.timings.response;
    if (responseTime > 500) {
      ee.emit('counter', 'slow_responses', 1);
    }
    if (responseTime > 1000) {
      ee.emit('counter', 'very_slow_responses', 1);
    }
  }
  
  return next();
}

function logMetrics(context, events, done) {
  // Custom metrics logging
  console.log('Test completed:', {
    timestamp: new Date().toISOString(),
    requests: events.length
  });
  return done();
}
