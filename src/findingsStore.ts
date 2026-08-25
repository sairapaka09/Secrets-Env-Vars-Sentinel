import * as vscode from 'vscode';
import { Finding } from './scanner';

const store = new Map<string, Finding[]>();
const emitter = new vscode.EventEmitter<void>();
export const onDidChangeFindings = emitter.event;

export function setFindings(uri: vscode.Uri, findings: Finding[]): void {
	if (findings.length === 0) {
		store.delete(uri.toString());
	} else {
		store.set(uri.toString(), findings);
	}
	emitter.fire();
}

export function clearFindings(uri: vscode.Uri): void {
	store.delete(uri.toString());
	emitter.fire();
}

export function clearAllFindings(): void {
	store.clear();
	emitter.fire();
}

export function getAllFindings(): { uri: vscode.Uri; findings: Finding[] }[] {
	return [...store.entries()].map(([uriString, findings]) => ({
		uri: vscode.Uri.parse(uriString),
		findings
	}));
}
