/** Plain-English guidance shown to users for each finding type, keyed by pattern ID. */
export const friendlyMessages: Record<string, string> = {
	'aws-access-key':
		'This looks like an AWS Access Key hardcoded in source. Move it to an environment variable and rotate the key.',
	'aws-secret-key':
		'This looks like an AWS Secret Access Key in source. Move it to an environment variable and rotate the key immediately.',
	'github-token':
		'This looks like a GitHub token in source. Revoke it and load it from an environment variable instead.',
	'slack-token':
		'This looks like a Slack token in source. Revoke it and load it from an environment variable instead.',
	'google-api-key':
		'This looks like a Google API key in source. Restrict its usage and move it to an environment variable.',
	'stripe-key':
		'This looks like a Stripe API key in source. Move it to an environment variable and rotate it if it is a live key.',
	'private-key':
		'A private key block was found in source. Private keys should never be committed — remove and rotate it.',
	jwt:
		'This looks like a JSON Web Token in source. Tokens can carry sensitive claims — avoid hardcoding them.',
	'generic-api-key':
		'This looks like a hardcoded secret/credential. Move it to an environment variable or a secrets manager.',
	'hardcoded-credential':
		'A credential-like value is hardcoded here. Even short/test values should come from an environment variable, not source code.',
	'env-placeholder-value':
		'This environment variable has an empty or placeholder value and is likely not configured yet.',
	'undefined-env-var':
		'This variable is referenced in code but was not found in any .env, .tf, or .tfvars file in the workspace. Make sure it is defined somewhere before deploying.'
};

export function getFriendlyMessage(patternId: string): string {
	return friendlyMessages[patternId] ?? 'Potential secret detected.';
}
