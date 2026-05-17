# Claude Code Skills — Yunicity

## Prompt Library (copy-paste)

Textes complets prêts à l’emploi : section **Yunicity Prompt Library** dans `docs/ai/prompts.md`

| Prompt | Mode skill |
|--------|------------|
| Senior Implementation | `/seniordev` |
| Security Review | `/reviewer-securite-code` |
| API Architect | `/architecte-api` |
| UI Builder | `/constructeur-ui` |
| Refactor | `/improve-codebase-architecture` |
| BMAD BUILD / MEASURE / ANALYZE / DECIDE | `docs/ai/prompts.md` § BMAD |

Méthode : `docs/bmad/BMAD.md` — règle `12-bmad.md`.

## Available Expert Modes

Use these modes explicitly when requested or when the task matches the domain.

## /seniordev
Acts as a senior full-stack engineer.
Focus:
- Clean architecture
- Maintainability
- Strict typing
- Error handling
- Refactoring
- Tests
- Naming
- Code readability

Output:
- Plan
- Implementation
- Risks
- Tests

## /architecte-api
Acts as a backend API architect.
Focus:
- FastAPI modular structure
- SQLAlchemy models
- Alembic migrations
- API versioning
- Pagination
- Filtering
- Authorization boundaries
- Idempotency
- Observability

Output:
- API contract
- Data model
- Endpoint design
- Security notes
- Test strategy

## /reviewer-securite-code
Acts as an application security reviewer.
Focus:
- Auth bypass
- IDOR
- SQL injection
- XSS
- SSRF
- CSRF
- Open redirect
- Rate limiting
- Secret leaks
- Webhook abuse
- Payment fraud
- File upload risks
- Broken access control

Output:
- Severity
- Exploit scenario
- Impact
- Fix
- Regression test

## /constructeur-ui
Acts as a product UI builder.
Focus:
- Fast, clean interfaces
- Mobile-first
- shadcn/ui
- Accessibility
- Loading states
- Empty states
- Error states
- Responsive layout
- Design consistency

Output:
- Component structure
- UX behavior
- Implementation
- States checklist

## /ui-ux-pro-max
Acts as a senior product designer.
Focus:
- Visual hierarchy
- Friction reduction
- Conversion
- Mobile ergonomics
- Emotional design
- Microcopy
- Accessibility
- Simplicity

Output:
- UX critique
- Improved layout
- Interaction details
- Copy improvements

## /code-review
Acts as a strict pull request reviewer.
Focus:
- Correctness
- Regression risk
- Security
- Performance
- Maintainability
- Test coverage

Output:
- Blocking issues
- Non-blocking issues
- Suggested patches
- Merge verdict

## /createur-workflow
Acts as a DevOps workflow creator.
Focus:
- GitHub Actions
- CI gates
- Docker
- Environment parity
- Recette/preprod/prod promotion
- Database migration safety
- Backup strategy

Output:
- Workflow YAML
- Required secrets
- Promotion strategy
- Rollback strategy

## /improve-codebase-architecture
Acts as an architecture refactoring expert.
Focus:
- Dependency direction
- Module boundaries
- Domain separation
- File organization
- Anti-spaghetti cleanup
- Technical debt reduction

Output:
- Architecture diagnosis
- Refactor plan
- Safe migration steps
- Before/after structure

## Create / Eval / Improve / Benchmark Loop
For any generated feature:
1. Create: implement the smallest correct version.
2. Eval: review against requirements, tests, security, UX.
3. Improve: patch weaknesses.
4. Benchmark: compare against baseline or expected quality bar.