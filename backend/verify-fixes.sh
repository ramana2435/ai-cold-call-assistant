#!/bin/bash

# Verification Script for Both Fixes
# Run with: bash verify-fixes.sh

echo "========================================================"
echo "FIX VERIFICATION SCRIPT"
echo "========================================================"
echo ""

# Check if we're in the backend directory
if [ ! -f "package.json" ]; then
    echo "❌ ERROR: Run this script from the backend/ directory"
    echo "Usage: cd backend && bash verify-fixes.sh"
    exit 1
fi

echo "Step 1: TypeScript Compilation"
echo "----------------------------------------"
echo "Building TypeScript..."
npm run build > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ TypeScript builds successfully (zero errors)"
else
    echo "❌ TypeScript build failed"
    exit 1
fi
echo ""

echo "Step 2: Check Environment Variables"
echo "----------------------------------------"
if [ ! -f ".env" ]; then
    echo "❌ ERROR: .env file not found"
    echo "   Copy .env.example to .env and configure it"
    exit 1
fi

# Check Supabase config
SUPABASE_URL=$(grep "^SUPABASE_URL=" .env | cut -d= -f2)
SUPABASE_KEY=$(grep "^SUPABASE_SERVICE_ROLE_KEY=" .env | cut -d= -f2)
GEMINI_KEY=$(grep "^GEMINI_API_KEY=" .env | cut -d= -f2)

echo "Checking configuration..."

if [ -z "$SUPABASE_URL" ]; then
    echo "⚠️  SUPABASE_URL not set"
else
    echo "✅ SUPABASE_URL configured"
fi

if [ -z "$SUPABASE_KEY" ]; then
    echo "⚠️  SUPABASE_SERVICE_ROLE_KEY not set"
else
    echo "✅ SUPABASE_SERVICE_ROLE_KEY configured"
fi

if [ -z "$GEMINI_KEY" ]; then
    echo "⚠️  GEMINI_API_KEY not set"
elif [[ ! "$GEMINI_KEY" =~ ^AIza ]]; then
    echo "❌ GEMINI_API_KEY format invalid (should start with 'AIza')"
    echo "   Current: ${GEMINI_KEY:0:10}..."
    echo "   Get valid key from: https://aistudio.google.com/app/apikey"
else
    echo "✅ GEMINI_API_KEY format looks valid"
fi
echo ""

echo "Step 3: Test Gemini API Connection"
echo "----------------------------------------"
if [[ "$GEMINI_KEY" =~ ^AIza ]]; then
    echo "Testing Gemini API..."
    node test-gemini-connection.js > /tmp/gemini-test.log 2>&1
    
    if [ $? -eq 0 ]; then
        echo "✅ Gemini API connection successful"
    else
        echo "❌ Gemini API connection failed"
        echo "   See /tmp/gemini-test.log for details"
        cat /tmp/gemini-test.log | grep -A 5 "Troubleshooting"
    fi
else
    echo "⏭️  Skipping (invalid API key)"
fi
echo ""

echo "Step 4: Verify Fix - Stage Persistence Logic"
echo "----------------------------------------"
echo "Checking callService.ts for upsert logic..."

if grep -q "existingStage" src/services/callService.ts; then
    echo "✅ Upsert logic detected in callService.ts"
else
    echo "❌ Upsert logic not found - fix may not be applied"
fi

if grep -q "UPDATE existing record" src/services/callService.ts; then
    echo "✅ UPDATE path exists"
else
    echo "⚠️  UPDATE comment not found"
fi

if grep -q "INSERT new record" src/services/callService.ts; then
    echo "✅ INSERT path exists"
else
    echo "⚠️  INSERT comment not found"
fi
echo ""

echo "Step 5: Verify Fix - Gemini Error Handling"
echo "----------------------------------------"
echo "Checking llmService.ts for enhanced error handling..."

if grep -q "Invalid Gemini API key" src/services/llmService.ts; then
    echo "✅ API key error detection added"
else
    echo "❌ API key error detection missing"
fi

if grep -q "not available or not supported" src/services/llmService.ts; then
    echo "✅ Model not found error detection added"
else
    echo "❌ Model error detection missing"
fi

if grep -q "quota exceeded" src/services/llmService.ts; then
    echo "✅ Quota error detection added"
else
    echo "❌ Quota error detection missing"
fi
echo ""

echo "========================================================"
echo "VERIFICATION COMPLETE"
echo "========================================================"
echo ""
echo "Summary:"
echo "--------"
echo "✅ = Passed"
echo "⚠️  = Warning (may be okay)"
echo "❌ = Failed"
echo "⏭️  = Skipped"
echo ""
echo "Next Steps:"
echo "-----------"
if [[ ! "$GEMINI_KEY" =~ ^AIza ]]; then
    echo "1. Get valid Gemini API key from: https://aistudio.google.com/app/apikey"
    echo "2. Update GEMINI_API_KEY in backend/.env"
    echo "3. Run: node test-gemini-connection.js"
fi

echo "4. Start backend: npm run dev"
echo "5. Start frontend: cd ../frontend && npm run dev"
echo "6. Test Stage 8 persistence manually"
echo "7. Test AI actions in frontend"
echo ""
echo "See FIX_SUMMARY.md for detailed testing instructions."
echo ""
