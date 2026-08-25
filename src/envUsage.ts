export interface EnvUsage {
	name: string;
	line: number;
	startColumn: number;
	endColumn: number;
}

// Common ways code references environment variables across languages.
const usagePatterns: RegExp[] = [
	/\bprocess\.env\.([A-Za-z_][A-Za-z0-9_]*)/g, // JS/TS: process.env.NAME
	/\bprocess\.env\[["']([A-Za-z0-9_]+)["']\]/g, // JS/TS: process.env["NAME"]
	/\bos\.environ\[["']([A-Za-z0-9_]+)["']\]/g, // Python: os.environ["NAME"]
	/\bos\.environ\.get\(\s*["']([A-Za-z0-9_]+)["']/g, // Python: os.environ.get("NAME")
	/\bos\.getenv\(\s*["']([A-Za-z0-9_]+)["']/g, // Python: os.getenv("NAME")
	/\bvar\.([A-Za-z_][A-Za-z0-9_-]*)/g // Terraform: var.name
];

/** Finds every environment/config variable reference in the given text. */
export function scanEnvUsage(text: string): EnvUsage[] {
	const usages: EnvUsage[] = [];
	const lines = text.split(/\r\n|\r|\n/);

	for (const pattern of usagePatterns) {
		for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
			const line = lines[lineIndex];
			pattern.lastIndex = 0;
			let match: RegExpExecArray | null;

			while ((match = pattern.exec(line)) !== null) {
				usages.push({
					name: match[1],
					line: lineIndex,
					startColumn: match.index,
					endColumn: match.index + match[0].length
				});

				if (match[0].length === 0) {
					pattern.lastIndex++;
				}
			}
		}
	}

	return usages;
}
