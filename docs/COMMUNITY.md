# Community activity notifications

StoreBridge includes optional GitHub Actions workflows that notify the maintainer by email about repository activity. They do not add tracking code to the application or collect activity from private local clones.

## Configure repository secrets

In **Settings → Secrets and variables → Actions**, add these repository secrets:

| Secret | Purpose |
| --- | --- |
| `COMMUNITY_NOTIFY_TO` | Notification recipient email address |
| `SMTP_HOST` | SMTP server hostname |
| `SMTP_PORT` | SMTP TLS port, normally `587` or `465` |
| `SMTP_USERNAME` | SMTP account username |
| `SMTP_PASSWORD` | SMTP account password or app password |
| `SMTP_FROM` | Sender address permitted by the SMTP account |
| `TRAFFIC_API_TOKEN` | Fine-grained PAT or GitHub App token with **Administration: read** on this repository, used only for aggregate clone statistics |

The standard `GITHUB_TOKEN` is used for public repository/fork API calls and the private workflow-state branch. Both workflows declare the minimum repository permission they need (`contents: write` for persistent state). Confirm that the repository's Actions settings allow this token permission. No credential should be placed in workflow YAML or committed files.

Email delivery uses Python's standard SMTP library with TLS (implicit TLS on port 465, STARTTLS on other ports). A misconfigured or rejected SMTP connection fails the workflow rather than silently reporting success.

## What is monitored

`.github/workflows/repository-events.yml` sends event-driven notices for new forks, stars, pushes, opened/reopened pull requests, merged pull requests, and opened issues. It uses `pull_request_target` for pull requests so notices can be sent for fork-originated requests. The workflow checks out only the base repository's default branch; it never checks out or runs contributor-controlled pull request code.

`.github/workflows/community-monitor.yml` runs daily and on manual dispatch. It compares aggregate clone totals from GitHub's traffic API and checks the default-branch head of up to the 500 most recently created **public** forks. The traffic API exposes aggregate counts for a rolling 14-day window, not the identity of people who cloned. Fork monitoring compares commit SHAs; it does not see private forks, local clones, or pushes to non-default branches that do not update the fork's default branch. The first scan seeds the known fork heads and clone count without sending a catch-up alert.

## Persistent deduplication

The workflows store notification fingerprints, recent fork heads, and the last aggregate clone count in `state.json` on the `community-monitor-state` branch. The state is metadata only and contains no SMTP credentials or API tokens. Workflow concurrency and state updates reduce duplicate notices on retries. Entries are pruned after 180 days; rerunning an event after that retention window may send it again. Delete this branch to reset the monitoring baseline; the next scheduled run will establish a new baseline without historical alerts.

If the state branch cannot be read or updated, or SMTP delivery fails, the workflow run fails so the failure is visible in Actions. GitHub Actions does not guarantee that third-party services remain available; check the workflow run history if an expected email does not arrive.

## Repository collaboration settings

Public visibility and collaborator permissions are repository-level settings, not code. For a community release:

1. Review the security audit and then change visibility under **Settings → General → Danger Zone**.
2. Add only trusted collaborators with **Write** access. Forks and pull requests remain available to everyone when the repository is public.
3. Protect `main` with a branch ruleset that blocks force pushes and branch deletion. Do not require pull requests or restrict pushes if trusted collaborators should be able to push directly without owner approval. This preserves direct pushes for authorized writers while guarding against destructive history changes.
4. Enable private vulnerability reporting under **Settings → Security** if the repository plan offers it.

Repository activity notifications are not a substitute for GitHub's account-level notifications or a branch backup.

## Suggested GitHub About description

Set the repository's About description to:

> Open-source AI-powered ecommerce and dropshipping platform featuring multimodal LLM integration, intelligent supplier data ingestion, AI-assisted product generation and automation. Built with Next.js, FastAPI, Saleor, PostgreSQL, Redis and Docker. Community contributions welcome.

Treat this as a project description, not a claim that every listed capability is complete. In particular, the current AI workflow supports text and product-image input with supplier-page extraction; it does not yet provide RAG, autonomous workflows, or a general provider/model selection interface.
