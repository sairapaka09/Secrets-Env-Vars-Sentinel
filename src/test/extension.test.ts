import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
// import * as myExtension from '../../extension';
import { scanText } from '../scanner';
import { scanEnvFile, isRealEnvFile } from '../envScanner';
import { scanEnvUsage } from '../envUsage';
import { isDocumentationFile } from '../scanPolicy';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Sample test', () => {
		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
		assert.strictEqual(-1, [1, 2, 3].indexOf(0));
	});
});

suite('scanText', () => {
	test('detects an AWS access key', () => {
		const findings = scanText('const key = "AKIAIOSFODNN7EXAMPLE";');
		assert.strictEqual(findings.length, 1);
		assert.strictEqual(findings[0].patternId, 'aws-access-key');
	});

	test('detects a GitHub token', () => {
		const findings = scanText('token: ghp_1234567890abcdefghijklmnopqrstuvwxyz12');
		assert.strictEqual(findings.some(f => f.patternId === 'github-token'), true);
	});

	test('redacts the matched value', () => {
		const findings = scanText('const key = "AKIAIOSFODNN7EXAMPLE";');
		assert.strictEqual(findings[0].redactedValue.includes('AKIAIOSFODNN7EXAMPLE'), false);
	});

	test('returns no findings for plain code', () => {
		const findings = scanText('function add(a, b) { return a + b; }');
		assert.strictEqual(findings.length, 0);
	});

	test('detects a short hardcoded password in JSON', () => {
		const findings = scanText('{\n  "Password": "123"\n}');
		assert.strictEqual(findings.some(f => f.patternId === 'hardcoded-credential'), true);
	});
});

suite('scanPolicy', () => {
	test('identifies prose documentation files', () => {
		assert.strictEqual(isDocumentationFile('/project/README.md'), true);
		assert.strictEqual(isDocumentationFile('/project/docs/setup.rst'), true);
		assert.strictEqual(isDocumentationFile('/project/src/config.ts'), false);
		assert.strictEqual(isDocumentationFile('/project/.env'), false);
	});
});

suite('envScanner', () => {
	test('identifies real .env files but not examples', () => {
		assert.strictEqual(isRealEnvFile('/project/.env'), true);
		assert.strictEqual(isRealEnvFile('/project/.env.local'), true);
		assert.strictEqual(isRealEnvFile('/project/.env.example'), false);
	});

	test('flags empty and placeholder values', () => {
		const findings = scanEnvFile('API_KEY=\nDB_PASSWORD=changeme\nPORT=3000');
		assert.strictEqual(findings.length, 2);
	});
});

suite('scanEnvUsage', () => {
	test('detects process.env dot access', () => {
		const usages = scanEnvUsage('const x = process.env.API_URL;');
		assert.strictEqual(usages.length, 1);
		assert.strictEqual(usages[0].name, 'API_URL');
	});

	test('detects process.env bracket access', () => {
		const usages = scanEnvUsage('const x = process.env["API_URL"];');
		assert.strictEqual(usages.some(u => u.name === 'API_URL'), true);
	});

	test('detects Python os.environ usage', () => {
		const usages = scanEnvUsage('db = os.environ.get("DB_HOST")');
		assert.strictEqual(usages.some(u => u.name === 'DB_HOST'), true);
	});

	test('detects Terraform var usage', () => {
		const usages = scanEnvUsage('resource "aws_instance" "x" {\n  ami = var.ami_id\n}');
		assert.strictEqual(usages.some(u => u.name === 'ami_id'), true);
	});
});
