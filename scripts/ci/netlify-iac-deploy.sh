#!/usr/bin/env bash
set -euo pipefail

required_vars=(
  "NETLIFY_AUTH_TOKEN"
  "NETLIFY_SITE_ID"
  "DATABASE_URL"
)

for var_name in "${required_vars[@]}"; do
  if [[ -z "${!var_name:-}" ]]; then
    echo "::error::Missing required environment variable: ${var_name}"
    exit 1
  fi
done

if ! command -v netlify >/dev/null 2>&1; then
  echo "::error::Netlify CLI is not installed. Install it before running this script."
  exit 1
fi

NODE_VERSION_VALUE="${NODE_VERSION_VALUE:-20}"
NPM_FLAGS_VALUE="${NPM_FLAGS_VALUE:---legacy-peer-deps}"

echo "Syncing Netlify production environment variables for site ${NETLIFY_SITE_ID}..."

netlify env:set DATABASE_URL "${DATABASE_URL}" \
  --secret \
  --context production \
  --scope builds runtime functions \
  --force \
  --auth "${NETLIFY_AUTH_TOKEN}" \
  --site "${NETLIFY_SITE_ID}"

netlify env:set NODE_VERSION "${NODE_VERSION_VALUE}" \
  --context production \
  --scope builds \
  --force \
  --auth "${NETLIFY_AUTH_TOKEN}" \
  --site "${NETLIFY_SITE_ID}"

netlify env:set NPM_FLAGS "${NPM_FLAGS_VALUE}" \
  --context production \
  --scope builds \
  --force \
  --auth "${NETLIFY_AUTH_TOKEN}" \
  --site "${NETLIFY_SITE_ID}"

echo "Verifying DATABASE_URL availability in production context..."
if ! netlify env:get DATABASE_URL \
  --context production \
  --scope builds \
  --auth "${NETLIFY_AUTH_TOKEN}" \
  --site "${NETLIFY_SITE_ID}" >/dev/null; then
  echo "::error::Failed to verify DATABASE_URL in Netlify production context."
  exit 1
fi

echo "Triggering Netlify production build..."
build_response="$(
  curl --silent --show-error --fail-with-body \
    -X POST \
    -H "Authorization: Bearer ${NETLIFY_AUTH_TOKEN}" \
    "https://api.netlify.com/api/v1/sites/${NETLIFY_SITE_ID}/builds"
)"

deploy_id="$(
  printf '%s' "${build_response}" | node -e '
    let input = "";
    process.stdin.on("data", (chunk) => input += chunk);
    process.stdin.on("end", () => {
      try {
        const data = JSON.parse(input);
        process.stdout.write(data.deploy_id || data.id || "");
      } catch {
        process.stdout.write("");
      }
    });
  '
)"

if [[ -n "${deploy_id}" ]]; then
  echo "Netlify build triggered successfully. Deploy ID: ${deploy_id}"
else
  echo "Netlify build triggered successfully."
fi
