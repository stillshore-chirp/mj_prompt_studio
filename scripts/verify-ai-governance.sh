#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

fail() {
  echo "ERROR: $1" >&2
  exit 1
}

require_file() {
  [[ -f "$1" ]] || fail "required file missing: $1"
}

required_files=(
  AGENTS.md
  CLAUDE.md
  .agents/skills/ui-ux-review/SKILL.md
  .github/pull_request_template.md
  .github/ISSUE_TEMPLATE/bug.md
  .github/ISSUE_TEMPLATE/feature.md
  .github/ISSUE_TEMPLATE/investigation.md
  .github/ISSUE_TEMPLATE/operations.md
  docs/security-publication-checklist.md
  docs/ai-governance/00-index.md
  docs/ai-governance/glossary.md
  docs/ai-governance/01-agent-operating-contract.md
  docs/ai-governance/02-uiux-review-framework.md
  docs/ai-governance/03-evidence-and-completion-gates.md
  docs/ai-governance/04-cognitive-psychology-principles.md
  docs/ai-governance/05-accessibility-and-inclusive-design.md
  docs/ai-governance/06-visual-hierarchy-and-information-architecture.md
  docs/ai-governance/07-ui-copy-and-microcopy.md
  docs/ai-governance/08-state-design-and-error-recovery.md
  docs/ai-governance/09-ai-agent-review-protocol.md
  docs/ai-governance/10-utility-user-goal-and-product-fit.md
  docs/ai-governance/11-efficiency-and-expert-use.md
  docs/ai-governance/12-satisfaction-trust-and-emotional-ux.md
  docs/ai-governance/13-maintenance-policy.md
  docs/ai-governance/14-issue-quality-gate.md
  docs/ai-governance/references/canonical-sources.md
  docs/ai-governance/templates/agent-task-prompt.md
  docs/ai-governance/templates/uiux-review-report.md
  docs/ai-governance/templates/state-matrix.md
  docs/ai-governance/templates/novice-simulation.md
  docs/ai-governance/templates/counter-review.md
  docs/ai-governance/templates/completion-gate-report.md
  docs/ai-governance/templates/user-goal-assessment.md
  docs/ai-governance/templates/efficiency-review.md
  docs/ai-governance/templates/trust-satisfaction-review.md
  docs/ai-governance/checklists/p0-p1-p2.md
  docs/ai-governance/checklists/accessibility.md
  docs/ai-governance/checklists/cognitive-walkthrough.md
  docs/ai-governance/checklists/visual-hierarchy.md
  docs/ai-governance/checklists/content-stress.md
  docs/ai-governance/checklists/utility-user-goal.md
  docs/ai-governance/checklists/efficiency.md
  docs/ai-governance/checklists/satisfaction-trust.md
)

for file in "${required_files[@]}"; do
  require_file "$file"
done

if git check-ignore -q docs/ai-governance/references/canonical-sources.md; then
  fail "canonical governance references must not be hidden by the local references/ ignore rule"
fi

agents_bytes="$(wc -c < AGENTS.md | tr -d '[:space:]')"
[[ "$agents_bytes" -lt 32768 ]] || fail "AGENTS.md must stay below 32 KiB: ${agents_bytes} bytes"

claude_content="$(tr -d '\r' < CLAUDE.md | sed '/^[[:space:]]*$/d')"
[[ "$claude_content" == "@AGENTS.md" ]] || fail "CLAUDE.md must contain only @AGENTS.md"

[[ ! -d .cursor ]] || fail ".cursor must not duplicate repository governance"

grep -q "ユーザー価値" AGENTS.md || fail "AGENTS.md must include the user-value gate"
grep -q "熟練者効率" AGENTS.md || fail "AGENTS.md must include the expert-efficiency gate"
grep -q "満足感・信頼感" AGENTS.md || fail "AGENTS.md must include the trust gate"
grep -q "反証レビュー" AGENTS.md || fail "AGENTS.md must require counter-review"
grep -q "14-issue-quality-gate.md" AGENTS.md || fail "AGENTS.md must reference the Issue quality gate"
grep -q "コードレビュー往復は1 PRあたり最大10回" AGENTS.md || fail "AGENTS.md must cap review rounds"
grep -q "P1を含むレビュー結果への修正・再確認は3回まで" AGENTS.md || fail "AGENTS.md must cap P1 review rounds"
grep -q "P0またはP1を含まないレビュー結果が3回連続" AGENTS.md || fail "AGENTS.md must define review convergence"
grep -q "PRをマージ可能な完了状態として報告する" AGENTS.md || fail "AGENTS.md must stop at merge-ready without explicit merge authority"
grep -q "変更前と変更後のスクリーンショット" AGENTS.md || fail "AGENTS.md must require before/after screenshots"
grep -q "security-publication-checklist.md" AGENTS.md || fail "AGENTS.md must reference publication safety"

grep -q "name: ui-ux-review" .agents/skills/ui-ux-review/SKILL.md || fail "UI/UX skill name missing"
grep -q "description:" .agents/skills/ui-ux-review/SKILL.md || fail "UI/UX skill description missing"
grep -q "変更前screenshot" .github/pull_request_template.md || fail "PR template must include the before screenshot field"
grep -q "変更後screenshot" .github/pull_request_template.md || fail "PR template must include the after screenshot field"
grep -q "未解決review thread" .github/pull_request_template.md || fail "PR template must include review-thread status"
grep -q "公開安全性" .github/ISSUE_TEMPLATE/feature.md || fail "Issue templates must include publication safety"

echo "AI governance verification: PASS"
