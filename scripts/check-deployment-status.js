#!/usr/bin/env node

/**
 * Check deployment status script
 * This script checks if the deployment has completed and the new code is active
 */

const https = require('https');
const http = require('http');

const BACKEND_URL = process.env.BACKEND_URL || 'https://mnemine-backend-7b4y.onrender.com';

console.log(`[STATUS] Checking deployment status on: ${BACKEND_URL}`);

async function checkHealth() {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(`${BACKEND_URL}/health`);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname,
      method: 'GET',
      headers: {
        'User-Agent': 'Deployment-Checker/1.0'
      }
    };
    
    console.log(`[STATUS] Checking health endpoint...`);
    
    const req = client.request(options, (res) => {
      let responseData = '';
      
      console.log(`[STATUS] Health check response: ${res.statusCode}`);
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            data: parsed
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            data: responseData
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

async function checkDeploymentStatus() {
  console.log('\n=== Checking Deployment Status ===\n');
  
  try {
    const healthResponse = await checkHealth();
    
    if (healthResponse.statusCode === 200) {
      console.log('✅ Server is running and healthy');
      console.log('📊 Server info:', healthResponse.data);
      
      // Check if the server has been restarted recently
      if (healthResponse.data.uptime) {
        const uptimeMinutes = Math.floor(healthResponse.data.uptime / 60);
        console.log(`⏰ Server uptime: ${uptimeMinutes} minutes`);
        
        if (uptimeMinutes < 5) {
          console.log('🔄 Server was recently restarted - deployment likely completed');
        } else {
          console.log('⚠️  Server has been running for a while - deployment may not have completed yet');
        }
      }
      
    } else {
      console.log('❌ Server health check failed');
      console.log('   Status:', healthResponse.statusCode);
      console.log('   Response:', healthResponse.data);
    }
    
  } catch (error) {
    console.error('❌ Error checking deployment status:', error.message);
  }
  
  console.log('\n=== Status Check Complete ===');
  console.log('\n💡 If the deployment is still in progress, wait a few more minutes and try again.');
  console.log('   Render deployments typically take 2-5 minutes to complete.');
}

// Run the status check
checkDeploymentStatus().catch((error) => {
  console.error('Status check failed:', error);
  process.exit(1);
});
