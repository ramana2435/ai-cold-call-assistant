/**
 * Network Diagnostic Tool for Gemini API
 * Diagnoses DNS, TLS, proxy, timeout, and HTTP issues
 * Does NOT print or log API keys
 */

require('dotenv').config();
const https = require('https');
const dns = require('dns').promises;

const API_HOSTNAME = 'generativelanguage.googleapis.com';
const API_PORT = 443;

async function runDiagnostics() {
  console.log('='.repeat(70));
  console.log('GEMINI API NETWORK DIAGNOSTICS');
  console.log('='.repeat(70));
  
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
  
  if (!apiKey) {
    console.error('\n❌ GEMINI_API_KEY not found in .env');
    process.exit(1);
  }
  
  console.log(`\n✓ API key loaded (${apiKey.substring(0, 3)}... format)`);
  console.log(`✓ Model configured: ${model}`);
  
  // Test 1: DNS Resolution
  console.log('\n' + '─'.repeat(70));
  console.log('TEST 1: DNS Resolution');
  console.log('─'.repeat(70));
  
  try {
    const addresses = await dns.resolve4(API_HOSTNAME);
    console.log(`✅ DNS Resolution: SUCCESS`);
    console.log(`   Hostname: ${API_HOSTNAME}`);
    console.log(`   IP Addresses: ${addresses.join(', ')}`);
  } catch (error) {
    console.error(`❌ DNS Resolution: FAILED`);
    console.error(`   Error: ${error.message}`);
    console.error(`   → Check network connectivity and DNS settings`);
    process.exit(1);
  }
  
  // Test 2: TLS Connection (without API call)
  console.log('\n' + '─'.repeat(70));
  console.log('TEST 2: TLS/HTTPS Connection');
  console.log('─'.repeat(70));
  
  try {
    await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: API_HOSTNAME,
        port: API_PORT,
        path: '/',
        method: 'HEAD',
        timeout: 10000,
      }, (res) => {
        console.log(`✅ TLS Connection: SUCCESS`);
        console.log(`   Status: ${res.statusCode} ${res.statusMessage}`);
        console.log(`   TLS Version: ${res.socket.getProtocol ? res.socket.getProtocol() : 'N/A'}`);
        resolve();
      });
      
      req.on('error', (error) => {
        if (error.code === 'ECONNREFUSED') {
          console.error(`❌ TLS Connection: REFUSED`);
          console.error(`   → Port ${API_PORT} blocked or service unavailable`);
        } else if (error.code === 'ETIMEDOUT') {
          console.error(`❌ TLS Connection: TIMEOUT`);
          console.error(`   → Check firewall or proxy settings`);
        } else if (error.code === 'CERT_HAS_EXPIRED' || error.message.includes('certificate')) {
          console.error(`❌ TLS Connection: CERTIFICATE ERROR`);
          console.error(`   Error: ${error.message}`);
          console.error(`   → System certificate store may need update`);
        } else {
          console.error(`❌ TLS Connection: FAILED`);
          console.error(`   Error: ${error.message}`);
        }
        reject(error);
      });
      
      req.on('timeout', () => {
        req.destroy();
        console.error(`❌ TLS Connection: TIMEOUT`);
        console.error(`   → Request exceeded 10 second timeout`);
        reject(new Error('Connection timeout'));
      });
      
      req.end();
    });
  } catch (error) {
    console.error(`   → TLS handshake failed`);
    process.exit(1);
  }
  
  // Test 3: HTTPS Module API Call
  console.log('\n' + '─'.repeat(70));
  console.log('TEST 3: HTTPS Module API Request');
  console.log('─'.repeat(70));
  
  try {
    const result = await new Promise((resolve, reject) => {
      const path = `/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const requestBody = JSON.stringify({
        contents: [{ parts: [{ text: 'Test' }] }]
      });
      
      const options = {
        hostname: API_HOSTNAME,
        port: API_PORT,
        path: path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(requestBody)
        },
        timeout: 15000
      };
      
      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ statusCode: res.statusCode, data: parsed });
          } catch (e) {
            reject(new Error(`Invalid JSON response: ${data.substring(0, 100)}`));
          }
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout (15s)'));
      });
      
      req.write(requestBody);
      req.end();
    });
    
    if (result.statusCode === 200) {
      console.log(`✅ HTTPS Module: SUCCESS`);
      console.log(`   Status: ${result.statusCode}`);
      console.log(`   Response: Valid Gemini API response received`);
      if (result.data.candidates?.[0]?.content?.parts?.[0]?.text) {
        console.log(`   Generated text: "${result.data.candidates[0].content.parts[0].text.substring(0, 50)}..."`);
      }
    } else if (result.statusCode === 401) {
      console.error(`❌ HTTPS Module: AUTHENTICATION FAILED`);
      console.error(`   Status: ${result.statusCode}`);
      console.error(`   → API key may be invalid or expired`);
      process.exit(1);
    } else if (result.statusCode === 404) {
      console.error(`❌ HTTPS Module: MODEL NOT FOUND`);
      console.error(`   Status: ${result.statusCode}`);
      console.error(`   Model: ${model}`);
      console.error(`   → Try GEMINI_MODEL=gemini-3.5-flash`);
      process.exit(1);
    } else {
      console.error(`❌ HTTPS Module: HTTP ERROR`);
      console.error(`   Status: ${result.statusCode}`);
      console.error(`   Response: ${JSON.stringify(result.data).substring(0, 200)}`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`❌ HTTPS Module: FAILED`);
    console.error(`   Error: ${error.message}`);
    console.error(`   → ${error.code || 'Unknown error code'}`);
    process.exit(1);
  }
  
  // Test 4: Native fetch() API Call
  console.log('\n' + '─'.repeat(70));
  console.log('TEST 4: Native fetch() API Request');
  console.log('─'.repeat(70));
  
  try {
    const url = `https://${API_HOSTNAME}/v1beta/models/${model}:generateContent?key=${apiKey}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Test' }] }]
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Native fetch(): SUCCESS`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Response: Valid Gemini API response received`);
      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        console.log(`   Generated text: "${data.candidates[0].content.parts[0].text.substring(0, 50)}..."`);
      }
    } else {
      const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
      console.error(`❌ Native fetch(): HTTP ERROR`);
      console.error(`   Status: ${response.status}`);
      console.error(`   Message: ${errorData.error?.message || response.statusText}`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Native fetch(): FAILED`);
    console.error(`   Error: ${error.message}`);
    
    if (error.name === 'AbortError') {
      console.error(`   → Request timeout (15s)`);
    } else if (error.cause) {
      console.error(`   Cause: ${error.cause.message || error.cause}`);
      console.error(`   Code: ${error.cause.code || 'N/A'}`);
      
      if (error.cause.code === 'ENOTFOUND') {
        console.error(`   → DNS resolution failed in fetch() context`);
      } else if (error.cause.code === 'ECONNREFUSED') {
        console.error(`   → Connection refused`);
      } else if (error.cause.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
        console.error(`   → Certificate verification failed`);
        console.error(`   → Windows may need certificate store update`);
      }
    }
    
    console.error(`\n   DIAGNOSIS:`);
    console.error(`   - HTTPS module works: YES (Test 3 passed)`);
    console.error(`   - Native fetch() works: NO (Test 4 failed)`);
    console.error(`   - Root cause: fetch() implementation issue in Node ${process.version}`);
    console.error(`   - Solution: Use HTTPS module instead of fetch() in llmService.ts`);
    process.exit(1);
  }
  
  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('DIAGNOSTIC SUMMARY');
  console.log('='.repeat(70));
  console.log('✅ DNS Resolution: WORKING');
  console.log('✅ TLS Connection: WORKING');
  console.log('✅ HTTPS Module: WORKING');
  console.log('✅ Native fetch(): WORKING');
  console.log('\n✓ All network layers functional');
  console.log('✓ Gemini API accessible from Node.js');
  console.log('✓ Backend LLM services should work correctly');
  console.log('='.repeat(70));
}

runDiagnostics().catch((error) => {
  console.error('\n💥 Diagnostic script crashed:');
  console.error(error);
  process.exit(1);
});
