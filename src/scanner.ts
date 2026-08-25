import { secretPatterns } from './patterns';

export interface Finding {
	patternId: string;
	label: string;
	line: number;
	startColumn: number;
	endColumn: number;
	/** Matched value with the middle characters masked, e.g. "AKIA****3F2A". */
	redactedValue: string;
}

/** Masks a secret so it never appears in full within diagnostics, logs, or output. */
function redact(value: string): string {
	if (value.length <= 8) {
		return '*'.repeat(value.length);
	}
	return `${value.slice(0, 4)}${'*'.repeat(value.length - 8)}${value.slice(-4)}`;
}

/**
 * Scans raw text for known secret patterns and returns findings with
 * line/column positions and redacted values (never the raw secret).
 * Pattern IDs in `disabledPatterns` are skipped.
 */
export function scanText(text: string, disabledPatterns?: Set<string>): Finding[] {
	const findings: Finding[] = [];
	const lines = text.split(/\r\n|\r|\n/);

	for (const pattern of secretPatterns) {
		if (disabledPatterns?.has(pattern.id)) {
			continue;
		}

		for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
			const line = lines[lineIndex];
			pattern.regex.lastIndex = 0;
			let match: RegExpExecArray | null;

			while ((match = pattern.regex.exec(line)) !== null) {
				findings.push({
					patternId: pattern.id,
					label: pattern.label,
					line: lineIndex,
					startColumn: match.index,
					endColumn: match.index + match[0].length,
					redactedValue: redact(match[0])
				});

				// Avoid infinite loops on zero-length matches.
				if (match[0].length === 0) {
					pattern.regex.lastIndex++;
				}
			}
		}
	}

	return findings;
}
