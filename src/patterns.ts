export interface SecretPattern {
	id: string;
	label: string;
	regex: RegExp;
}

// Known third-party secret formats, ordered by specificity.
export const secretPatterns: SecretPattern[] = [
	{
		id: 'aws-access-key',
		label: 'AWS Access Key ID',
		regex: /\b(A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}\b/g
	},
	{
		id: 'aws-secret-key',
		label: 'AWS Secret Access Key',
		regex: /\b(?:aws_secret_access_key|aws_secret_key)\s*[:=]\s*["']?[A-Za-z0-9/+=]{40}["']?/gi
	},
	{
		id: 'github-token',
		label: 'GitHub Token',
		regex: /\bgh[pousr]_[A-Za-z0-9]{36,255}\b/g
	},
	{
		id: 'slack-token',
		label: 'Slack Token',
		regex: /\bxox[baprs]-[A-Za-z0-9-]{10,72}\b/g
	},
	{
		id: 'google-api-key',
		label: 'Google API Key',
		regex: /\bAIza[0-9A-Za-z\-_]{35}\b/g
	},
	{
		id: 'stripe-key',
		label: 'Stripe API Key',
		regex: /\b(sk|rk|pk)_(live|test)_[A-Za-z0-9]{16,247}\b/g
	},
	{
		id: 'private-key',
		label: 'Private Key Block',
		regex: /-----BEGIN(?: RSA| EC| OPENSSH| PGP)? PRIVATE KEY-----/g
	},
	{
		id: 'jwt',
		label: 'JSON Web Token',
		regex: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g
	},
	{
		id: 'generic-api-key',
		label: 'Generic API Key/Secret Assignment',
		regex: /\b(api[_-]?key|secret|token|password|passwd|pwd)\s*[:=]\s*["'][A-Za-z0-9_\-/+=]{12,}["']/gi
	},
	{
		id: 'hardcoded-credential',
		label: 'Hardcoded Credential Value',
		// Catches sensitive key names with ANY non-empty value (e.g. JSON/config files), regardless of length.
		regex: /["']?(password|passwd|pwd|secret|api[_-]?key|token|credential)["']?\s*[:=]\s*["'][^"'\s]{1,11}["']/gi
	}
];
