import * as vscode from 'vscode';
import { Finding } from './scanner';

const PLACEHOLDER_VALUES = new Set(['changeme', 'todo', 'xxx', 'your_value_here', 'replace_me', '']);
const EXAMPLE_ENV_SUFFIXES = ['.example', '.sample', '.template', '.dist'];

/** True for files like ".env", ".env.local", "test.env" but not ".env.example". */
export function isRealEnvFile(fileName: string): boolean {
	const base = fileName.split(/[\\/]/).pop() ?? '';
	const looksLikeEnvFile = base.startsWith('.env') || /\.env$/i.test(base) || /\.env\.[^.]+$/i.test(base);
	if (!looksLikeEnvFile) {
		return false;
	}
	return !EXAMPLE_ENV_SUFFIXES.some(suffix => base.endsWith(suffix));
}

/**
 * Parses .env-style text and flags lines with empty/placeholder values.
 * Does not duplicate secret-pattern matching; call scanText() separately for that.
 */
export function scanEnvFile(text: string): Finding[] {
	const findings: Finding[] = [];
	const lines = text.split(/\r\n|\r|\n/);

	lines.forEach((line, lineIndex) => {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) {
			return;
		}

		const separatorIndex = line.indexOf('=');
		if (separatorIndex === -1) {
			return;
		}

		const key = line.slice(0, separatorIndex).trim();
		const rawValue = line.slice(separatorIndex + 1).trim();
		const value = rawValue.replace(/^["']|["']$/g, '');

		if (PLACEHOLDER_VALUES.has(value.toLowerCase())) {
			findings.push({
				patternId: 'env-placeholder-value',
				label: `Empty/placeholder value for "${key}"`,
				line: lineIndex,
				startColumn: 0,
				endColumn: line.length,
				redactedValue: value || '(empty)'
			});
		}
	});

	return findings;
}

/** Checks whether a real .env file is covered by the workspace .gitignore. */
export async function checkEnvFileIgnored(uri: vscode.Uri): Promise<boolean> {
	const fileName = uri.path.split('/').pop() ?? '';
	if (!isRealEnvFile(fileName)) {
		return true;
	}

	const gitignoreFiles = await vscode.workspace.findFiles('**/.gitignore', '**/node_modules/**', 5);
	for (const gitignoreUri of gitignoreFiles) {
		try {
			const bytes = await vscode.workspace.fs.readFile(gitignoreUri);
			const content = Buffer.from(bytes).toString('utf8');
			const patterns = content
				.split(/\r\n|\r|\n/)
				.map(l => l.trim())
				.filter(l => l && !l.startsWith('#'));

			if (patterns.some(p => p === fileName || p === `.env` || p === `.env*` || p === `*.env`)) {
				return true;
			}
		} catch {
			continue;
		}
	}

	return false;
}
