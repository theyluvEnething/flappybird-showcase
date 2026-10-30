#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/release.sh [--dry-run] 1.0.1 "Describe the gameplay change"
# The default creates a DRAFT release. Publishing is a separate final command.
preview=false
if [[ "${1:-}" == "--dry-run" ]]; then preview=true; shift; fi
if [[ $# -ne 2 || -z "${2:-}" ]]; then
  printf 'Usage: %s [--dry-run] VERSION "COMMIT MESSAGE"\n' "$0" >&2
  exit 1
fi
version="$1"
commit_message="$2"
release_tag="v$version"
cd "$(dirname "${BASH_SOURCE[0]}")/.."

# A release ZIP has no .git. Run this script from the actual Git clone.
if [[ ! -e .git ]] || [[ "$(git rev-parse --show-toplevel)" != "$(pwd -P)" ]]; then
  printf 'Run this script from a Git clone of flappybird-showcase.\n' >&2
  exit 1
fi
for tool in node npm git gh; do command -v "$tool" >/dev/null || { printf 'Missing tool: %s\n' "$tool" >&2; exit 1; }; done
if [[ "$(git branch --show-current)" != "main" ]]; then
  printf 'Switch to the main branch before preparing this demo release.\n' >&2
  exit 1
fi
node scripts/version.cjs "$version" --check
if git rev-parse --verify --quiet "refs/tags/$release_tag" >/dev/null; then
  printf 'Tag %s already exists. Choose a new version.\n' "$release_tag" >&2
  exit 1
fi
if [[ "$preview" == false && -z "$(git status --porcelain)" ]]; then
  printf 'Make the gameplay change first. There is nothing new to release.\n' >&2
  exit 1
fi

# Preview prints the same commands without changing files, commits or GitHub.
run() {
  if [[ "$preview" == true ]]; then printf '+ '; printf '%q ' "$@"; printf '\n';
  else "$@"; fi
}

# 1. Check the code, gameplay rules, and the settings you just edited.
run npm test
run npm run check

# 2. Keep package.json and the version displayed by the game synchronized.
run node scripts/version.cjs "$version"

# 3. Stage all non-ignored changes, then record one new local snapshot.
run git add --all
run git diff --cached --check
run git commit -m "$commit_message"

# 4. Share the commit, then label that exact commit with an annotated tag.
run git push
run git tag -a "$release_tag" -m "$commit_message"
run git push origin "$release_tag"

# 5. Build an offline ZIP from the tag, with a SHA-256 checksum.
run node scripts/package.cjs "$release_tag"

# 6. Upload the ZIP and checksum to a draft GitHub release.
run gh release create "$release_tag" "dist/flappybird-showcase-$release_tag.zip" dist/SHA256SUMS.txt \
  --verify-tag --draft --title "Flappy Bird Showcase $version" --notes-from-tag

printf '\nAfter the GitHub checks pass, review the draft and publish with:\n'
printf 'gh release edit %q --draft=false --latest\n' "$release_tag"
