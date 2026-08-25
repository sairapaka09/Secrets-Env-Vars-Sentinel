import * as vscode from 'vscode';
import { Finding } from './scanner';
import { getAllFindings, onDidChangeFindings } from './findingsStore';
import { getFriendlyMessage } from './messages';

type TreeNode = FileNode | FindingNode;

class FileNode {
	constructor(public readonly uri: vscode.Uri, public readonly findings: Finding[]) {}
}

class FindingNode {
	constructor(public readonly uri: vscode.Uri, public readonly finding: Finding) {}
}

export class SecretsTreeProvider implements vscode.TreeDataProvider<TreeNode> {
	private readonly _onDidChangeTreeData = new vscode.EventEmitter<void>();
	readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

	constructor() {
		onDidChangeFindings(() => this._onDidChangeTreeData.fire());
	}

	getTreeItem(element: TreeNode): vscode.TreeItem {
		if (element instanceof FileNode) {
			const item = new vscode.TreeItem(
				vscode.workspace.asRelativePath(element.uri),
				vscode.TreeItemCollapsibleState.Expanded
			);
			item.description = `${element.findings.length} issue(s)`;
			item.iconPath = vscode.ThemeIcon.File;
			item.resourceUri = element.uri;
			return item;
		}

		const { finding } = element;
		const item = new vscode.TreeItem(finding.label, vscode.TreeItemCollapsibleState.None);
		item.description = getFriendlyMessage(finding.patternId);
		item.tooltip = `${finding.label} (${finding.redactedValue})\n${getFriendlyMessage(finding.patternId)}`;
		item.iconPath = new vscode.ThemeIcon('warning');
		item.command = {
			command: 'vscode.open',
			title: 'Open',
			arguments: [
				element.uri,
				{
					selection: new vscode.Range(
						finding.line,
						finding.startColumn,
						finding.line,
						finding.endColumn
					)
				}
			]
		};
		return item;
	}

	getChildren(element?: TreeNode): TreeNode[] {
		if (!element) {
			return getAllFindings().map(({ uri, findings }) => new FileNode(uri, findings));
		}
		if (element instanceof FileNode) {
			return element.findings.map(finding => new FindingNode(element.uri, finding));
		}
		return [];
	}
}
