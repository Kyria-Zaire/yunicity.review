#!/usr/bin/env python3
"""
Lint cohérence règles agents Yunicity (.cursor / .claude) vs PRD + BMAD.

Usage:
  python scripts/lint-agent-rules.py
  python scripts/lint-agent-rules.py --strict

Exit 0 = OK, 1 = erreurs bloquantes.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

RULES_CURSOR = ROOT / ".cursor" / "rules"
RULES_CLAUDE = ROOT / ".claude" / "rules"
DOCS_CANON = [
    ROOT / "docs" / "workflow" / "YUNICITY-OFFICIAL-WORKFLOW.md",
    ROOT / "docs" / "bmad" / "BMAD.md",
    ROOT / "docs" / "prd" / "PRD-template.md",
    ROOT / "docs" / "ai" / "security-checklist.md",
]

# Fichiers .md de rules uniquement (pas PRD avec --- sections)
RULE_GLOBS = ("*.mdc", "*.md")

FORBIDDEN_PATTERNS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"\byunicity-core\b", re.I), "fichier supprimé — utiliser 00-project-doctrine"),
    (re.compile(r"local\s*→\s*staging", re.I), "utiliser dev → recette → preprod → prod"),
    (re.compile(r"staging\s*→\s*prod", re.I), "utiliser recette → preprod → prod"),
]

# staging interdit sauf formulations explicites d'exception
STAGING_RE = re.compile(r"\bstaging\b", re.I)
STAGING_ALLOW = re.compile(r"not staging|pas staging|no staging|éviter staging", re.I)

FRONTMATTER_KEYS = re.compile(
    r"^(description|globs|alwaysApply|paths)\s*:", re.MULTILINE
)

# Paires parité attendues (sans extension)
PARITY_PAIRS = [
    "00-project-doctrine",
    "01-senior-dev",
    "02-architecte-api",
    "03-ingenieur",
    "04-reviewer-securite-code",
    "05-code-review",
    "06-createur-workflow",
    "07-constructeur-ui",
    "08-ui-ux-pro-max",
    "09-environments",
    "10-payments-webhooks",
    "11-anti-spaghetti",
    "12-bmad",
    "13-official-workflow",
    "backend-fastapi",
    "frontend-next-expo",
]


class Issue:
    def __init__(self, path: Path, message: str, *, severity: str = "error") -> None:
        self.path = path
        self.message = message
        self.severity = severity

    def __str__(self) -> str:
        rel = self.path.relative_to(ROOT) if self.path.is_relative_to(ROOT) else self.path
        return f"[{self.severity}] {rel}: {self.message}"


def iter_rule_files() -> list[Path]:
    files: list[Path] = []
    if RULES_CURSOR.is_dir():
        for ext in RULE_GLOBS:
            files.extend(RULES_CURSOR.glob(ext))
    if RULES_CLAUDE.is_dir():
        for ext in RULE_GLOBS:
            files.extend(RULES_CLAUDE.glob(ext))
    return sorted(files)


def count_frontmatter_blocks(text: str) -> int:
    """Compte les blocs --- ... --- en tête de fichier (max 80 premières lignes)."""
    lines = text.splitlines()[:80]
    blocks = 0
    i = 0
    while i < len(lines):
        if lines[i].strip() != "---":
            break
        j = i + 1
        while j < len(lines) and lines[j].strip() != "---":
            j += 1
        if j < len(lines) and lines[j].strip() == "---":
            blocks += 1
            i = j + 1
        else:
            break
    return blocks


def lint_frontmatter(path: Path, text: str) -> list[Issue]:
    issues: list[Issue] = []
    blocks = count_frontmatter_blocks(text)
    if path.suffix == ".mdc" and blocks > 1:
        issues.append(
            Issue(path, f"double frontmatter détecté ({blocks} blocs) — fusionner en un seul")
        )
    if path.suffix == ".md" and RULES_CLAUDE in path.parents and blocks > 1:
        issues.append(
            Issue(path, f"double frontmatter détecté ({blocks} blocs) — fusionner en un seul")
        )

    # Second --- ... --- with yaml keys after first block (classic merge bug)
    if blocks <= 1 and path.suffix in (".mdc", ".md"):
        rest = text.split("---", 2)[-1] if text.startswith("---") else text
        if re.search(r"\n---\s*\n(?:description|globs|alwaysApply|paths)\s*:", rest):
            issues.append(
                Issue(path, "second bloc YAML après le contenu — fichier fusionné invalide")
            )
    return issues


def lint_forbidden(path: Path, text: str) -> list[Issue]:
    issues: list[Issue] = []
    for pattern, hint in FORBIDDEN_PATTERNS:
        if pattern.search(text):
            issues.append(Issue(path, f"terme interdit ({pattern.pattern}) — {hint}"))

    for i, line in enumerate(text.splitlines(), 1):
        if STAGING_RE.search(line) and not STAGING_ALLOW.search(line):
            issues.append(
                Issue(
                    path,
                    f"ligne {i}: 'staging' — environnements canon: dev, recette, preprod, prod",
                )
            )
    return issues


def lint_parity() -> list[Issue]:
    issues: list[Issue] = []
    for stem in PARITY_PAIRS:
        mdc = RULES_CURSOR / f"{stem}.mdc"
        md = RULES_CLAUDE / f"{stem}.md"
        if not mdc.exists():
            issues.append(Issue(mdc, "fichier Cursor manquant pour parité", severity="warn"))
        if not md.exists():
            issues.append(Issue(md, "fichier Claude manquant pour parité", severity="warn"))
    return issues


def lint_canon_docs() -> list[Issue]:
    issues: list[Issue] = []
    for doc in DOCS_CANON:
        if not doc.exists():
            issues.append(Issue(doc, "document canon manquant", severity="error"))
            continue
        text = doc.read_text(encoding="utf-8")
        if doc.name == "BMAD.md":
            if "§13" not in text and "section 13" not in text.lower():
                issues.append(
                    Issue(doc, "référence PRD §13 (gates BMAD) absente", severity="warn")
                )
        if doc.name == "YUNICITY-OFFICIAL-WORKFLOW.md":
            for token in ("DISCOVER", "RELEASE", "MEASURE", "zones rouges"):
                if token not in text and token.lower() not in text.lower():
                    issues.append(Issue(doc, f"contenu '{token}' manquant", severity="error"))
        if doc.name == "PRD-template.md":
            if "RELEASE" not in text or "§13" not in text:
                issues.append(Issue(doc, "workflow RELEASE / §13 incomplets", severity="error"))
    return issues


def lint_security_pointer() -> list[Issue]:
    issues: list[Issue] = []
    mdc = RULES_CURSOR / "security-checklist.mdc"
    canon = ROOT / "docs" / "ai" / "security-checklist.md"
    if mdc.exists():
        t = mdc.read_text(encoding="utf-8")
        if "docs/ai/security-checklist.md" not in t:
            issues.append(
                Issue(mdc, "doit pointer vers docs/ai/security-checklist.md (source unique)")
            )
        if count_frontmatter_blocks(t) != 1:
            issues.append(Issue(mdc, "frontmatter unique attendu (alwaysApply: false)"))
    if not canon.exists():
        issues.append(Issue(canon, "checklist sécurité canon manquante"))
    return issues


def main() -> int:
    parser = argparse.ArgumentParser(description="Lint règles agents Yunicity")
    parser.add_argument(
        "--strict",
        action="store_true",
        help="traiter les warnings comme des erreurs",
    )
    args = parser.parse_args()

    all_issues: list[Issue] = []
    all_issues.extend(lint_parity())
    all_issues.extend(lint_canon_docs())
    all_issues.extend(lint_security_pointer())

    for path in iter_rule_files():
        text = path.read_text(encoding="utf-8")
        all_issues.extend(lint_frontmatter(path, text))
        all_issues.extend(lint_forbidden(path, text))

    errors = [i for i in all_issues if i.severity == "error"]
    warns = [i for i in all_issues if i.severity == "warn"]

    for issue in errors + warns:
        print(issue)

    print()
    print(f"Résumé: {len(errors)} erreur(s), {len(warns)} avertissement(s)")

    if errors:
        return 1
    if args.strict and warns:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
