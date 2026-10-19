# Windows Certificate Setup for Gemini API

## Issue
Node.js on Windows may fail to verify SSL certificates for the Gemini API with error:
```
unable to verify the first certificate
```

This happens because Windows Node.js installations may not have the complete Google CA certificate chain.

## ✅ Solution Implemented

The backend now uses the **win-ca** package with fallback mode to automatically load Windows certificates and inject them into Node.js.

### What was done:
1. Installed `win-ca` package: `npm install win-ca`
2. Added win-ca initialization in `backend/src/server.ts`:
   ```typescript
   require('win-ca')({ fallback: true, inject: '+' });
   ```
3. Configuration options:
   - `fallback: true` - Use Node's built-in CAs as backup
   - `inject: '+'` - Add Windows certs to existing CA list (don't replace)

### Testing:
```bash
cd backend
node test-gemini-connection.js
```

Expected output:
```
✓ Windows certificate store loaded with fallback
✅ SUCCESS! Gemini API responded:
   "Connection successful"
```

## Current Status
- ✅ API Key: Valid (AQ. format)
- ✅ Model: gemini-3.5-flash available
- ✅ Network: DNS and routing working
- ✅ Certificates: win-ca with fallback mode **WORKING**
- ✅ All 4 LLM endpoints should now work

## Alternative Solutions (if win-ca doesn't work)

### Option 2: Update Node.js
Ensure you're using the latest Node.js LTS version:
- Download from: https://nodejs.org/
- Current version: v20.18.1 ✓

### Option 3: Development-Only Workaround
**⚠️ NOT for production!** Disable certificate verification:

```bash
# Windows Command Prompt
set NODE_TLS_REJECT_UNAUTHORIZED=0
node test-gemini-connection.js

# PowerShell
$env:NODE_TLS_REJECT_UNAUTHORIZED="0"
node test-gemini-connection.js

# Git Bash
NODE_TLS_REJECT_UNAUTHORIZED=0 node test-gemini-connection.js
```

## Production Deployment
For production:
- ✅ The win-ca package is safe for production use
- ✅ It only loads certificates from the Windows certificate store
- ✅ No security compromise - it enhances security by using system CAs
- ❌ Never use NODE_TLS_REJECT_UNAUTHORIZED=0 in production

## Package Details
- Package: `win-ca`
- Version: Latest (installed via npm)
- GitHub: https://github.com/ukoloff/win-ca
- Purpose: Inject Windows certificate authority (CA) certificates into Node.js

