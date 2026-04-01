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

site_json="$(
  netlify api getSite \
    --data "{\"site_id\":\"${NETLIFY_SITE_ID}\"}" \
    --auth "${NETLIFY_AUTH_TOKEN}" 2>/dev/null || true
)"

if [[ -z "${site_json}" ]]; then
  echo "::error::Unable to read Netlify site '${NETLIFY_SITE_ID}'. Check NETLIFY_SITE_ID and NETLIFY_AUTH_TOKEN."
  exit 1
fi

site_disabled="$(
  printf '%s' "${site_json}" | node -e '
    let input = "";
    process.stdin.on("data", (chunk) => input += chunk);
    process.stdin.on("end", () => {
      const site = JSON.parse(input);
      process.stdout.write(String(Boolean(site.disabled)));
    });
  '
)"

site_lifecycle_state="$(
  printf '%s' "${site_json}" | node -e '
    let input = "";
    process.stdin.on("data", (chunk) => input += chunk);
    process.stdin.on("end", () => {
      const site = JSON.parse(input);
      process.stdout.write(String(site.lifecycle_state || ""));
    });
  '
)"

deploy_hook_url="$(
  printf '%s' "${site_json}" | node -e '
    let input = "";
    process.stdin.on("data", (chunk) => input += chunk);
    process.stdin.on("end", () => {
      const site = JSON.parse(input);
      process.stdout.write(String(site.deploy_hook || ""));
    });
  '
)"

if [[ "${site_disabled}" == "true" || "${site_lifecycle_state}" == "cancelled" ]]; then
  echo "::error::Netlify site '${NETLIFY_SITE_ID}' is disabled (${site_lifecycle_state})."
  echo "::error::Set NETLIFY_SITE_ID to an active Netlify project linked to this repository."
  exit 1
fi

echo "Syncing Netlify production environment variables for site ${NETLIFY_SITE_ID}..."

env_api_supported=true

run_env_command() {
  local label="$1"
  shift

  local output
  if output=$(NETLIFY_SITE_ID="${NETLIFY_SITE_ID}" "$@" 2>&1); then
    return 0
  fi

  if echo "${output}" | grep -Eq "JSONHTTPError: Not Found|TextHTTPError: Not Found"; then
    echo "::warning::Netlify env API returned 404 for '${label}'. Skipping env sync via CLI for this site/account."
    env_api_supported=false
    return 0
  fi

  echo "::error::${label} failed."
  echo "${output}"
  return 1
}

run_env_command "set DATABASE_URL" \
  netlify env:set DATABASE_URL "${DATABASE_URL}" \
  --secret \
  --context production \
  --scope builds runtime functions \
  --force \
  --auth "${NETLIFY_AUTH_TOKEN}"

if [[ "${env_api_supported}" == "true" ]]; then
  run_env_command "set NODE_VERSION" \
    netlify env:set NODE_VERSION "${NODE_VERSION_VALUE}" \
    --context production \
    --scope builds \
    --force \
    --auth "${NETLIFY_AUTH_TOKEN}"

  run_env_command "set NPM_FLAGS" \
    netlify env:set NPM_FLAGS "${NPM_FLAGS_VALUE}" \
    --context production \
    --scope builds \
    --force \
    --auth "${NETLIFY_AUTH_TOKEN}"
fi

if [[ "${env_api_supported}" == "true" ]]; then
  echo "Verifying DATABASE_URL availability in production context..."
  run_env_command "verify DATABASE_URL" \
    netlify env:get DATABASE_URL \
    --context production \
    --scope builds \
    --auth "${NETLIFY_AUTH_TOKEN}" >/dev/null
else
  echo "::warning::Skipping DATABASE_URL verification because env API is unavailable."
  echo "::warning::Ensure DATABASE_URL is set in Netlify UI for production context."
fi

echo "Triggering Netlify production build..."
create_build_output="$(
  netlify api createSiteBuild \
    --data "{\"site_id\":\"${NETLIFY_SITE_ID}\"}" \
    --auth "${NETLIFY_AUTH_TOKEN}" 2>&1 || true
)"

build_response=""
if echo "${create_build_output}" | node -e '
  let input = "";
  process.stdin.on("data", (chunk) => input += chunk);
  process.stdin.on("end", () => {
    try {
      const data = JSON.parse(input);
      process.exit(data && data.id ? 0 : 1);
    } catch {
      process.exit(1);
    }
  });
'; then
  build_response="${create_build_output}"
fi

if [[ -z "${build_response}" && -n "${deploy_hook_url}" ]]; then
  echo "::warning::createSiteBuild failed. Falling back to deploy hook trigger."
  build_response="$(
    curl --silent --show-error --fail \
      -X POST \
      "${deploy_hook_url}" 2>/dev/null || true
  )"
fi

if [[ -z "${build_response}" ]]; then
  echo "::error::Failed to trigger Netlify production build."
  echo "::error::Check that NETLIFY_AUTH_TOKEN has write access to site ${NETLIFY_SITE_ID}."
  if [[ -n "${create_build_output}" ]]; then
    echo "${create_build_output}" | head -n 2
  fi
  exit 1
fi

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
