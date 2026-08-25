import * as vscode from 'vscode';
import { isRealEnvFile } from './envScanner';

let definedVars = new Set<string>();

/** Parses KEY=VALUE lines out of .env-style text, ignoring comments/blank lines. */
function extractKeys(text: string): string[] {
	const keys: string[] = [];
	for (const line of text.split(/\r\n|\r|\n/)) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) {
			continue;
		}
		const separatorIndex = trimmed.indexOf('=');
		if (separatorIndex === -1) {
			continue;
		}
		keys.push(trimmed.slice(0, separatorIndex).trim());
	}
	return keys;
}

/** Parses `variable "name" { ... }` declarations out of Terraform (.tf) source. */
function extractTerraformVariableDeclarations(text: string): string[] {
	const keys: string[] = [];
	const regex = /variable\s+"([A-Za-z0-9_-]+)"\s*\{/g;
	let match: RegExpExecArray | null;
	while ((match = regex.exec(text)) !== null) {
		keys.push(match[1]);
	}
	return keys;
}

/** Rebuilds the set of defined names from .env files, Terraform variable blocks, and .tfvars assignments. */
export async function refreshEnvRegistry(): Promise<void> {
	const next = new Set<string>();
	const exclude = '**/{node_modules,.git,.terraform}/**';

	const envFiles = await vscode.workspace.findFiles('**/{.env*,*.env,*.env.*}', exclude);
	for (const uri of envFiles) {
		if (!isRealEnvFile(uri.fsPath)) {
			continue;
		}
		try {
			const bytes = await vscode.workspace.fs.readFile(uri);
			const text = Buffer.from(bytes).toString('utf8');
			extractKeys(text).forEach(key => next.add(key.toUpperCase()));
		} catch {
			continue;
		}
	}

	const tfFiles = await vscode.workspace.findFiles('**/*.tf', exclude);
	for (const uri of tfFiles) {
		try {
			const bytes = await vscode.workspace.fs.readFile(uri);
			const text = Buffer.from(bytes).toString('utf8');
			extractTerraformVariableDeclarations(text).forEach(key => next.add(key.toUpperCase()));
		} catch {
			continue;
		}
	}

	const tfvarsFiles = await vscode.workspace.findFiles('**/*.tfvars', exclude);
	for (const uri of tfvarsFiles) {
		try {
			const bytes = await vscode.workspace.fs.readFile(uri);
			const text = Buffer.from(bytes).toString('utf8');
			extractKeys(text).forEach(key => next.add(key.toUpperCase()));
		} catch {
			continue;
		}
	}

	definedVars = next;
}

/** Case-insensitive lookup since Terraform vars are typically snake_case, env vars UPPER_CASE. */
export function isEnvVarDefined(name: string): boolean {
	return definedVars.has(name.toUpperCase());
}
