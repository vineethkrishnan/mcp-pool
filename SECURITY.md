# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| latest  | Yes       |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do not** open a public issue
2. Email: [security contact via GitHub]
3. Include: description, reproduction steps, and impact assessment

## Scope

### In Scope
- Command injection via tool arguments
- API key exposure or leakage
- Unauthorized Stripe API access beyond declared tool capabilities
- Path traversal in file operations

### Out of Scope
- Third-party dependency vulnerabilities (report upstream)
- Denial of service attacks
- Issues requiring physical access
