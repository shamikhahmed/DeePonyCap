#!/usr/bin/env bash
# DeePonyCap release gate — run from repo root OUTSIDE the agent sandbox.
#
# Reproduces CI `run:` steps from:
#   .github/workflows/ci.yml     → jobs verify, finish-matrix
#   .github/workflows/pages.yml  → job deploy (stage allowlisted site only)
# Then: full Playwright --retries=0, ios-behaviour-check (WebKit) on staged
# site, prod-ready audit harness, version coherence @ 4.0.0 / deeponycap-v400.
#
# Usage: bash qa/release/run-checks.sh
# Logs:  qa/release/logs/   Summary: qa/release/SUMMARY.md
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

EXPECTED_VERSION="4.0.0"
EXPECTED_SW="deeponycap-v400"
STAGE_DIR="$ROOT/_site"
STAGE_PORT="8881"
LOG_DIR="$ROOT/qa/release/logs"
SUMMARY="$ROOT/qa/release/SUMMARY.md"
SERVER_PID=""

mkdir -p "$LOG_DIR"

# step|status|detail
RESULTS=()

ts() { date -u +%Y%m%dT%H%M%SZ; }

record() {
  local step="$1" status="$2" detail="${3:-}"
  RESULTS+=("${step}|${status}|${detail}")
  printf '%s  %s  %s\n' "$status" "$step" "$detail"
}

cleanup() {
  if [[ -n "${SERVER_PID}" ]] && kill -0 "$SERVER_PID" 2>/dev/null; then
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
  # orphan python http.server on STAGE_PORT
  if command -v lsof >/dev/null 2>&1; then
    local p
    p="$(lsof -tiTCP:"$STAGE_PORT" -sTCP:LISTEN 2>/dev/null || true)"
    if [[ -n "$p" ]]; then
      kill $p 2>/dev/null || true
    fi
  fi
}
trap cleanup EXIT

run_logged() {
  local name="$1"
  shift
  local log="$LOG_DIR/${name}.log"
  {
    echo "=== ${name} @ $(ts) ==="
    echo "+ $*"
  } >"$log"
  set +e
  "$@" >>"$log" 2>&1
  local rc=$?
  set -e
  echo "exit=$rc" >>"$log"
  return $rc
}

echo "DeePonyCap release gate — expect ${EXPECTED_VERSION} / ${EXPECTED_SW}"
echo "Logs → ${LOG_DIR#"$ROOT"/}"
echo

# ---------------------------------------------------------------------------
# 0) Preconditions (no silent engine fallbacks)
# ---------------------------------------------------------------------------
if [[ ! -d node_modules/@playwright/test ]]; then
  record "pre: node_modules" "FAIL" "missing @playwright/test (npm ci locally; no sandbox)"
  _finish=1
else
  record "pre: node_modules" "PASS" "playwright present"
  _finish=0
fi

# ---------------------------------------------------------------------------
# 1) CI · verify — check-sw-truth (part of npm run verify)
# ---------------------------------------------------------------------------
if [[ "$_finish" -eq 0 ]]; then
  if run_logged "01-sw-truth" node scripts/check-sw-truth.js; then
    record "ci:verify/sw-truth" "PASS" "$(tail -1 "$LOG_DIR/01-sw-truth.log" | tr -d '\r')"
  else
    record "ci:verify/sw-truth" "FAIL" "see 01-sw-truth.log"
    _finish=1
  fi
fi

# ---------------------------------------------------------------------------
# 2) Full Playwright suite — retries=0 (also covers ci.yml verify playwright)
# ---------------------------------------------------------------------------
if [[ "$_finish" -eq 0 ]]; then
  if run_logged "02-playwright" npx playwright test --retries=0; then
    # key number: passed tests from summary line if present
    local_n="$(grep -E 'passed|failed' "$LOG_DIR/02-playwright.log" | tail -1 | tr -d '\r' || true)"
    record "playwright --retries=0" "PASS" "${local_n:-ok}"
  else
    local_n="$(grep -E 'passed|failed|flaky' "$LOG_DIR/02-playwright.log" | tail -1 | tr -d '\r' || true)"
    record "playwright --retries=0" "FAIL" "${local_n:-see 02-playwright.log}"
    _finish=1
  fi
fi

# ---------------------------------------------------------------------------
# 3) CI · finish-matrix (FINISH_MATRIX=1)
# ---------------------------------------------------------------------------
if [[ "$_finish" -eq 0 ]]; then
  if run_logged "03-finish-matrix" env FINISH_MATRIX=1 npx playwright test tests/finish-matrix.spec.mjs --retries=0; then
    record "ci:finish-matrix" "PASS" "FINISH_MATRIX=1"
  else
    record "ci:finish-matrix" "FAIL" "see 03-finish-matrix.log"
    _finish=1
  fi
fi

# ---------------------------------------------------------------------------
# 4) CI · pages stage (C-57 allowlist) — same env as pages.yml
# ---------------------------------------------------------------------------
if [[ "$_finish" -eq 0 ]]; then
  export ALLOW_PATHS="index.html landing.html pitch.html presentation.html privacy.html changelog.html screen-gallery.html sw.js manifest.json VERSION.json css js assets"
  export FORBIDDEN_EXTRA="scripts docs"
  if run_logged "04-stage-pages" bash scripts/stage-pages-site.sh "$STAGE_DIR"; then
    nfiles="$(find "$STAGE_DIR" -type f 2>/dev/null | wc -l | tr -d ' ')"
    record "ci:pages/stage" "PASS" "${nfiles} files → _site"
  else
    record "ci:pages/stage" "FAIL" "see 04-stage-pages.log"
    _finish=1
  fi
fi

# ---------------------------------------------------------------------------
# 5) Serve staged site + ios-behaviour-check (WebKit only — no fallback)
# ---------------------------------------------------------------------------
if [[ "$_finish" -eq 0 ]]; then
  (
    cd "$STAGE_DIR"
    python3 -m http.server "$STAGE_PORT" --bind 127.0.0.1
  ) >"$LOG_DIR/05-stage-server.log" 2>&1 &
  SERVER_PID=$!
  # wait for listen
  for _ in 1 2 3 4 5 6 7 8 9 10; do
    if curl -sf "http://127.0.0.1:${STAGE_PORT}/" >/dev/null 2>&1; then
      break
    fi
    sleep 0.3
  done
  if ! curl -sf "http://127.0.0.1:${STAGE_PORT}/" >/dev/null 2>&1; then
    record "ios:check (staged)" "FAIL" "staged server not up on :${STAGE_PORT}"
    _finish=1
  elif run_logged "05-ios-check" node scripts/ios-behaviour-check.mjs "http://127.0.0.1:${STAGE_PORT}/"; then
    pass_n="$(grep -c '^PASS' "$LOG_DIR/05-ios-check.log" || true)"
    fail_n="$(grep -c '^FAIL' "$LOG_DIR/05-ios-check.log" || true)"
    record "ios:check (staged WebKit)" "PASS" "${pass_n} pass / ${fail_n} fail"
  else
    pass_n="$(grep -c '^PASS' "$LOG_DIR/05-ios-check.log" || true)"
    fail_n="$(grep -c '^FAIL' "$LOG_DIR/05-ios-check.log" || true)"
    record "ios:check (staged WebKit)" "FAIL" "${pass_n} pass / ${fail_n} fail — see 05-ios-check.log"
    _finish=1
  fi
fi

# ---------------------------------------------------------------------------
# 6) Prod-ready audit harness (against staged site)
# ---------------------------------------------------------------------------
if [[ "$_finish" -eq 0 ]]; then
  if run_logged "06-prod-ready-audit" node scripts/prod-ready-audit.mjs "http://127.0.0.1:${STAGE_PORT}/"; then
    :
  else
    # harness may exit non-zero on launch failure; still parse findings if present
    true
  fi
  FINDINGS="$ROOT/qa/prod-ready/audit-findings.json"
  if [[ ! -f "$FINDINGS" ]]; then
    record "prod-ready audit" "FAIL" "missing qa/prod-ready/audit-findings.json"
    _finish=1
  else
    set +e
    node -e "
const fs=require('fs');
const j=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));
const f=j.findings||[];
const axeBad=f.filter(x=>x.area==='G'&&(x.severity==='critical'||x.severity==='high')&&/axe/i.test(x.message||'')).length;
const consoleN=j.consoleErrorCount||0;
const httpN=j.httpBadCount||0;
const offlineBad=f.filter(x=>x.area==='H'&&/offline/i.test((x.screen||'')+' '+(x.message||''))&&(x.severity==='critical'||x.severity==='high')).length;
const ok=axeBad===0&&consoleN===0&&httpN===0&&offlineBad===0;
const out={ok,axeBad,consoleN,httpN,offlineBad,shots:j.shotCount||0};
fs.writeFileSync(process.argv[2], JSON.stringify(out)+'\n');
console.log(JSON.stringify(out));
process.exit(ok?0:1);
" "$FINDINGS" "$LOG_DIR/06-prod-ready-gate.json" | tee -a "$LOG_DIR/06-prod-ready-audit.log"
    gate_rc=$?
    set -e
    gate="$(cat "$LOG_DIR/06-prod-ready-gate.json" 2>/dev/null || echo '{"ok":false}')"
    if [[ "$gate_rc" -eq 0 ]]; then
      record "prod-ready audit" "PASS" "$gate"
    else
      record "prod-ready audit" "FAIL" "$gate — see 06-prod-ready-audit.log + audit-findings.json"
      _finish=1
    fi
  fi
fi

# ---------------------------------------------------------------------------
# 7) Version coherence — 4.0.0 + SW cache match
# ---------------------------------------------------------------------------
if EXPECT_V="$EXPECTED_VERSION" EXPECT_SW="$EXPECTED_SW" run_logged "07-version-coherence" node -e "
const fs=require('fs');
const path=require('path');
const expectV=process.env.EXPECT_V;
const expectSW=process.env.EXPECT_SW;
const ver=JSON.parse(fs.readFileSync('VERSION.json','utf8'));
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const vj=fs.readFileSync('js/version.js','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const fails=[];
if (ver.version!==expectV) fails.push('VERSION.json.version='+ver.version);
if (ver.swCache!==expectSW) fails.push('VERSION.json.swCache='+ver.swCache);
if (pkg.version!==expectV) fails.push('package.json.version='+pkg.version);
if (!vj.includes(\"APP_VERSION = '\"+expectV+\"'\") && !vj.includes('APP_VERSION = \"'+expectV+'\"')) fails.push('js/version.js APP_VERSION');
if (!vj.includes(\"SW_CACHE = '\"+expectSW+\"'\") && !vj.includes('SW_CACHE = \"'+expectSW+'\"')) fails.push('js/version.js SW_CACHE');
const m=sw.match(/const\\s+CACHE\\s*=\\s*self\\.SW_CACHE\\s*\\|\\|\\s*['\"]([^'\"]+)['\"]/);
if (!m||m[1]!==expectSW) fails.push('sw.js CACHE fallback='+(m&&m[1]));
// staged copy if present
const staged=path.join('_site','VERSION.json');
if (fs.existsSync(staged)) {
  const sv=JSON.parse(fs.readFileSync(staged,'utf8'));
  if (sv.version!==expectV||sv.swCache!==expectSW) fails.push('staged VERSION.json mismatch');
}
if (fails.length) { console.error(fails.join('; ')); process.exit(1); }
console.log(expectV, expectSW, 'coherent');
" ; then
  record "version coherence" "PASS" "${EXPECTED_VERSION} / ${EXPECTED_SW}"
else
  record "version coherence" "FAIL" "$(tail -5 "$LOG_DIR/07-version-coherence.log" | tr '\n' ' ')"
  _finish=1
fi

# ---------------------------------------------------------------------------
# Summary table + SUMMARY.md
# ---------------------------------------------------------------------------
{
  echo "# DeePonyCap release gate — SUMMARY"
  echo
  echo "- **When:** $(ts)"
  echo "- **Expect:** ${EXPECTED_VERSION} / ${EXPECTED_SW}"
  echo "- **Result:** $([[ $_finish -eq 0 ]] && echo PASS || echo FAIL)"
  echo
  echo "| Step | Status | Detail |"
  echo "|---|---|---|"
  for row in "${RESULTS[@]}"; do
    IFS='|' read -r s st d <<<"$row"
    # escape pipes in detail
    d="${d//|/\\|}"
    echo "| ${s} | ${st} | ${d} |"
  done
  echo
  echo "Logs: \`qa/release/logs/\`"
} >"$SUMMARY"

echo
echo "======== SUMMARY ========"
printf '%-36s %-6s %s\n' "STEP" "STATUS" "DETAIL"
printf '%-36s %-6s %s\n' "----" "------" "------"
for row in "${RESULTS[@]}"; do
  IFS='|' read -r s st d <<<"$row"
  printf '%-36s %-6s %s\n' "$s" "$st" "$d"
done
echo "========================="
echo "Wrote ${SUMMARY#"$ROOT"/}"

exit "$_finish"
