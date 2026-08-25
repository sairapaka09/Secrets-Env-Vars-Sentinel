import * as vscode from 'vscode';
import { diagnosticCollection } from './diagnostics';

let statusBarItem: vscode.StatusBarItem | undefined;

export function createStatusBarItem(): vscode.StatusBarItem {
	statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
	statusBarItem.command = 'workbench.actions.view.problems';
	updateStatusBar();
	statusBarItem.show();
	return statusBarItem;
}

/** Recomputes the total finding count across all diagnostics and refreshes the status bar. */
export function updateStatusBar(): void {
	if (!statusBarItem) {
		return;
	}

	let total = 0;
	diagnosticCollection.forEach((_uri, diagnostics) => {
		total += diagnostics.length;
	});

	if (total === 0) {
		statusBarItem.text = '$(shield) Secrets: 0';
		statusBarItem.tooltip = 'No secrets detected';
		statusBarItem.backgroundColor = undefined;
	} else {
		statusBarItem.text = `$(shield) Secrets: ${total}`;
		statusBarItem.tooltip = `${total} potential secret(s) found. Click to view in Problems panel.`;
		statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
	}
}
