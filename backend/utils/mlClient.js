const http = require('http');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

/**
 * Call FastAPI ML Service via HTTP POST.
 * @param {string} path - URL path e.g. '/api/ml/match-jobs'
 * @param {object} body - Request body
 * @returns {Promise<object>} Parsed JSON response
 */
function callMlService(path, body) {
  return new Promise((resolve, reject) => {
    const fullUrl = path.startsWith('http') ? path : `${ML_SERVICE_URL}${path.startsWith('/') ? path : '/' + path}`;
    const url = new URL(fullUrl);
    const postData = JSON.stringify(body);

    const options = {
      hostname: url.hostname,
      port: url.port || 8000,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(parsed.detail || parsed.message || `ML Service returned status ${res.statusCode}`));
          }
        } catch (e) {
          reject(new Error(`ML Service invalid JSON response (status ${res.statusCode}): ${data}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(new Error(`ML Service Connection Error: ${err.message}`));
    });

    req.write(postData);
    req.end();
  });
}

module.exports = {
  ML_SERVICE_URL,
  callMlService
};
