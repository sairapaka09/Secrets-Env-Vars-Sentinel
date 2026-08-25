// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { updateDiagnostics, clearDiagnostics, diagnosticCollection } from './diagnostics';
import { scanWorkspace } from './workspaceScan';
import { createStatusBarItem, updateStatusBar } from './statusBar';
import { SecretsTreeProvider } from './treeView';
import { refreshEnvRegistry } from './envRegistry';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

	context.subscriptions.push(diagnosticCollection);
	context.subscriptions.push(createStatusBarItem());

	const treeProvider = new SecretsTreeProvider();
	context.subscriptions.push(vscode.window.registerTreeDataProvider('secretsEnvScannerView', treeProvider));

	// Build the "defined variables" registry, then scan the whole workspace on startup
	// so findings show up immediately without needing to open every file.
	await refreshEnvRegistry();
	void scanWorkspace({ silent: true });

	// Keep the registry in sync as .env/Terraform files change, then re-validate open documents.
	const registryWatcher = vscode.workspace.createFileSystemWatcher('**/{.env*,*.tf,*.tfvars}');
	const onRegistrySourceChanged = async () => {
		await refreshEnvRegistry();
		vscode.workspace.textDocuments.forEach(updateDiagnostics);
	};
	context.subscriptions.push(
		registryWatcher,
		registryWatcher.onDidChange(onRegistrySourceChanged),
		registryWatcher.onDidCreate(onRegistrySourceChanged),
		registryWatcher.onDidDelete(onRegistrySourceChanged)
	);

	context.subscriptions.push(
		vscode.workspace.onDidOpenTextDocument(updateDiagnostics),
		vscode.workspace.onDidChangeTextDocument(event => updateDiagnostics(event.document)),
		vscode.workspace.onDidSaveTextDocument(updateDiagnostics),
		vscode.workspace.onDidDeleteFiles(event => event.files.forEach(uri => clearDiagnostics(uri))),
		vscode.languages.onDidChangeDiagnostics(() => updateStatusBar())
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('secrets-env-scanner.scanWorkspace', () => {
			void scanWorkspace();
		})
	);
}

// This method is called when your extension is deactivated
export function deactivate() {}
