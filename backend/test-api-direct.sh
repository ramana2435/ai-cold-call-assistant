#!/bin/bash
# Direct API test without SDK
source .env

echo "Testing Gemini API directly..."
echo "Model: $GEMINI_MODEL"
echo ""

curl -s "https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Reply with exactly: Connection successful"}]}]}' \
  | python3 -m json.tool 2>/dev/null || echo "Raw response above"

echo ""
echo "If you see 'Connection successful' above, the API key and model work!"
