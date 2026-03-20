source .env.local
curl -s -X POST "https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${GEMINI_API_KEY}" \
-H 'Content-Type: application/json' \
-d '{"instances": [{"prompt": "A scenic mountain"}],"parameters": {"sampleCount": 1}}' > test-output.json
cat test-output.json | grep -o "bytesBase64Encoded"
