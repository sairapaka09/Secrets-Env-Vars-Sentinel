import * as vscode from 'vscode';
import { scanText, Finding } from './scanner';
import { scanEnvFile, isRealEnvFile } from './envScanner';
import { getConfig } from './config';
import { getFriendlyMessage } from './messages';
import { setFindings, clearFindings } from './findingsStore';
import { scanEnvUsage } from './envUsage';
import { isEnvVarDefined } from './envRegistry';
import { isDocumentationFile } from './scanPolicy';

export const diagnosticCollection = vscode.languages.createDiagnosticCollection('secrets-scanner');

/** Runs all applicable scanners (secrets, .env checks, undefined-var checks) against a document. */
export function computeFindings(document: vscode.TextDocument): Finding[] {
	const text = document.getText();
	const { disabledPatterns } = getConfig();
	const findings = scanText(text, disabledPatterns);

	if (isRealEnvFile(document.uri.fsPath)) {
		findings.push(...scanEnvFile(text));
	} else if (!disabledPatterns.has('undefined-env-var')) {
		for (const usage of scanEnvUsage(text)) {
			if (isEnvVarDefined(usage.name)) {
				continue;
			}
			findings.push({
				patternId: 'undefined-env-var',
				label: `Undefined variable "${usage.name}"`,
				line: usage.line,
				startColumn: usage.startColumn,
				endColumn: usage.endColumn,
				redactedValue: usage.name
			});
		}
	}

	return findings;
}

/** Publishes precomputed findings as diagnostics for a document (avoids re-scanning). */
export function publishFindings(uri: vscode.Uri, findings: Finding[]): void {
	const diagnostics: vscode.Diagnostic[] = findings.map(finding => {
		const range = new vscode.Range(
			finding.line,
			finding.startColumn,
			finding.line,
			finding.endColumn
		);

		const diagnostic = new vscode.Diagnostic(
			range,
			`${finding.label} (${finding.redactedValue}): ${getFriendlyMessage(finding.patternId)}`,
			vscode.DiagnosticSeverity.Warning
		);
		diagnostic.source = 'Secrets Scanner';
		diagnostic.code = finding.patternId;
		return diagnostic;
	});

	diagnosticCollection.set(uri, diagnostics);
	setFindings(uri, findings);
}

/** Runs the scanner against a document and publishes results as diagnostics. */
export function updateDiagnostics(document: vscode.TextDocument): void {
	if (document.uri.scheme !== 'file') {
		return;
	}
	if (isDocumentationFile(document.uri.fsPath)) {
		clearDiagnostics(document.uri);
		return;
	}

	publishFindings(document.uri, computeFindings(document));
}

export function clearDiagnostics(uri: vscode.Uri): void {
	diagnosticCollection.delete(uri);
	clearFindings(uri);
}
