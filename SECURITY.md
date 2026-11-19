# Security Policy

## Reporting a vulnerability

Please do not report vulnerabilities in public issues, discussions, or pull requests. Use [GitHub Private Vulnerability Reporting](https://github.com/PAPA-CHUWE/storebridge/security/advisories/new) to send the maintainers a private report. If private vulnerability reporting is unavailable, contact [@PAPA-CHUWE](https://github.com/PAPA-CHUWE) privately through GitHub and include steps to reproduce, impact, and any suggested remediation.

Please do not include real credentials, customer data, or supplier account details in the report unless the private channel specifically requires them. Redact secrets from screenshots and logs.

## Supported versions

Until versioned releases are published, security fixes are made against the latest code on the default branch. No service-level response time is promised; the maintainers will acknowledge reports as they are able and coordinate disclosure with the reporter.

## Secret handling

- Keep `.env` files, signing keys, API tokens, SMTP credentials, and production endpoints out of Git.
- Rotate any credential that may have been exposed. Removing it from the latest commit does not remove it from Git history.
- Store workflow credentials in GitHub Actions Secrets, with the narrowest permissions needed.
