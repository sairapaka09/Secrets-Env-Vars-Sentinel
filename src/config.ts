import * as vscode from 'vscode';

const SECTION = 'secretsEnvScanner';

export function getConfig() {
	const config = vscode.workspace.getConfiguration(SECTION);
	return {
		disabledPatterns: new Set(config.get<string[]>('disabledPatterns', [])),
		excludeGlob: config.get<string>(
			'excludeGlob',
			'{**/{node_modules,.git,.svn,.hg,out,dist,build,.next,.nuxt,.turbo,coverage,.vscode,.vscode-test,.idea,.vs,vendor,.venv,venv,__pycache__,.pytest_cache,.mypy_cache,.cache,.parcel-cache,.yarn,.pnpm-store,target,bin,obj,.terraform,.serverless,tmp}/**,**/*.{lock,min.js,map,pyc,pyo,so,dll,dylib,exe,woff,woff2,ttf,eot,png,jpg,jpeg,gif,ico,svg,pdf,zip,tar,gz,jar,class},**/{package-lock.json,yarn.lock,pnpm-lock.yaml,npm-shrinkwrap.json,composer.lock,Gemfile.lock,Cargo.lock,poetry.lock,Pipfile.lock}}'
		),
		maxFileSizeBytes: config.get<number>('maxFileSizeKB', 1024) * 1024
	};
}
