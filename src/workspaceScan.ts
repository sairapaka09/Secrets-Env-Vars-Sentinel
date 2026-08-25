import * as vscode from 'vscode';
import { diagnosticCollection, computeFindings, publishFindings } from './diagnostics';
import { isRealEnvFile, checkEnvFileIgnored } from './envScanner';
import { getConfig } from './config';
import { clearAllFindings } from './findingsStore';
import { refreshEnvRegistry } from './envRegistry';
import { isDocumentationFile } from './scanPolicy';

let outputChannel: vscode.OutputChannel | undefined;

function getOutputChannel(): vscode.OutputChannel {
	if (!outputChannel) {
		outputChannel = vscode.window.createOutputChannel('Secrets Scanner');
	}
	return outputChannel;
}

/** Scans every file in the workspace and reports findings in an Output channel. */
export async function scanWorkspace(options: { silent?: boolean } = {}): Promise<void> {
	const channel = getOutputChannel();
	channel.clear();
	if (!options.silent) {
		channel.show(true);
	}
	diagnosticCollection.clear();
	clearAllFindings();

	await refreshEnvRegistry();
	const { excludeGlob, maxFileSizeBytes } = getConfig();
	const files = (await vscode.workspace.findFiles('**/*', excludeGlob)).filter(
		uri => !isDocumentationFile(uri.fsPath)
	);
	channel.appendLine(`Scanning ${files.length} files for secrets and exposed env vars...\n`);

	let totalFindings = 0;
	let scannedFiles = 0;

	for (const uri of files) {
		try {
			const stat = await vscode.workspace.fs.stat(uri);
			if (stat.size > maxFileSizeBytes) {
				continue;
			}

			const document = await vscode.workspace.openTextDocument(uri);
			scannedFiles++;
			const findings = computeFindings(document);

			if (isRealEnvFile(uri.fsPath)) {
				const isIgnored = await checkEnvFileIgnored(uri);
				if (!isIgnored) {
					channel.appendLine(
						`WARNING: ${vscode.workspace.asRelativePath(uri)} does not appear to be covered by .gitignore.\n`
					);
				}
			}

			publishFindings(uri, findings);

			if (findings.length > 0) {
				totalFindings += findings.length;
				channel.appendLine(`${vscode.workspace.asRelativePath(uri)}:`);
				for (const finding of findings) {
					channel.appendLine(
						`  Line ${finding.line + 1}: ${finding.label} (${finding.redactedValue})`
					);
				}
				channel.appendLine('');
			}
		} catch {
			// Skip files that can't be read as text (binary, permission errors, etc.).
			continue;
		}
	}

	channel.appendLine(`Scan complete: ${totalFindings} finding(s) across ${scannedFiles} file(s).`);

	if (totalFindings > 0) {
		vscode.window.showWarningMessage(
			`Secrets Scanner found ${totalFindings} potential secret(s). See Output panel and Problems for details.`
		);
	} else if (!options.silent) {
		vscode.window.showInformationMessage('Secrets Scanner: no secrets found.');
	}
}
