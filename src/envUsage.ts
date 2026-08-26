import { maskComments } from './commentMask';

export interface EnvUsage {
	name: string;
	line: number;
	startColumn: number;
	endColumn: number;
	/** True when the code already supplies a fallback value, so a missing var is not an error. */
	hasDefault: boolean;
}

// Common ways code references environment variables across languages.
// Patterns with a trailing "," group detect a second (default-value) argument.
const usagePatterns: RegExp[] = [
	/\bprocess\.env\.([A-Za-z_][A-Za-z0-9_]*)/g, // JS/TS: process.env.NAME
	/\bprocess\.env\[["']([A-Za-z0-9_]+)["']\]/g, // JS/TS: process.env["NAME"]
	/\bos\.environ\[["']([A-Za-z0-9_]+)["']\]/g, // Python: os.environ["NAME"]
	/\bos\.environ\.get\(\s*["']([A-Za-z0-9_]+)["']\s*(,)?/g, // Python: os.environ.get("NAME"[, default])
	/\bos\.getenv\(\s*["']([A-Za-z0-9_]+)["']\s*(,)?/g, // Python: os.getenv("NAME"[, default])
	/\bvar\.([A-Za-z_][A-Za-z0-9_-]*)/g // Terraform: var.name
];

// After a bare process.env access, a fallback is commonly chained with || or ??.
const jsFallbackAfterMatch = /^\s*(\|\||\?\?)\s*\S/;

/** Finds every environment/config variable reference in the given text. */
export function scanEnvUsage(text: string): EnvUsage[] {
	const usages: EnvUsage[] = [];
	const lines = maskComments(text).split(/\r\n|\r|\n/);

	for (const pattern of usagePatterns) {
		for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
			const line = lines[lineIndex];
			pattern.lastIndex = 0;
			let match: RegExpExecArray | null;

			while ((match = pattern.exec(line)) !== null) {
				const matchEnd = match.index + match[0].length;
				const hasDefault = Boolean(match[2]) || jsFallbackAfterMatch.test(line.slice(matchEnd));

				usages.push({
					name: match[1],
					line: lineIndex,
					startColumn: match.index,
					endColumn: matchEnd,
					hasDefault
				});

				if (match[0].length === 0) {
					pattern.lastIndex++;
				}
			}
		}
	}

	return usages;
}
