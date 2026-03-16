#!/bin/bash
# Writes .env.local from Codespaces secrets (shell env vars).
# Run once after the Codespace starts: bash scripts/write-env.sh

cat > "$(dirname "$0")/../.env.local" <<EOF
NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_PUBLIC_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_PUBLIC_KEY}
SUPABASE_SERVICE_ROLE_KEY=${SUPBASE_SERVICE_ROLE}
SUPABASE_DB_PASSWORD=${SUPABASE_DB_PW}
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
OPENAI_API_KEY=${OPENAI_API_KEY}
NEXT_PUBLIC_APP_URL=${PUBLIC_APP_URL:-http://localhost:3000}
EOF

echo ".env.local written successfully"
