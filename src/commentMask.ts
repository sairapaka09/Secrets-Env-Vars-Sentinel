/**
 * Blanks out comments (//, #, /* *\/, <!-- -->, Python triple-quoted blocks) with spaces so
 * secret/env-usage scanners ignore commented-out code and example snippets, while keeping
 * every line the same length so line/column positions in findings stay accurate.
 */
export function maskComments(text: string): string {
	const lines = text.split(/\r\n|\r|\n/);
	const masked: string[] = [];

	let blockCommentDelim: string | null = null; // set while inside a multi-line /* */ or <!-- --> block
	let tripleQuoteDelim: string | null = null; // set while inside a Python """ or ''' block

	for (const line of lines) {
		let out = '';
		let i = 0;
		let inString: string | null = null; // '"', "'", or '`' while inside a single-line string literal

		while (i < line.length) {
			if (blockCommentDelim) {
				const end = line.indexOf(blockCommentDelim, i);
				const stop = end === -1 ? line.length : end + blockCommentDelim.length;
				out += ' '.repeat(stop - i);
				i = stop;
				if (end !== -1) {
					blockCommentDelim = null;
				}
				continue;
			}

			if (tripleQuoteDelim) {
				const end = line.indexOf(tripleQuoteDelim, i);
				const stop = end === -1 ? line.length : end + tripleQuoteDelim.length;
				out += ' '.repeat(stop - i);
				i = stop;
				if (end !== -1) {
					tripleQuoteDelim = null;
				}
				continue;
			}

			const ch = line[i];

			if (inString) {
				if (ch === '\\' && i + 1 < line.length) {
					out += line[i] + line[i + 1];
					i += 2;
					continue;
				}
				out += ch;
				if (ch === inString) {
					inString = null;
				}
				i++;
				continue;
			}

			if (line.startsWith('"""', i) || line.startsWith("'''", i)) {
				tripleQuoteDelim = line.substr(i, 3);
				out += line.substr(i, 3);
				i += 3;
				continue;
			}

			if (ch === '"' || ch === "'" || ch === '`') {
				inString = ch;
				out += ch;
				i++;
				continue;
			}

			// Guard against "://" in URLs (http://, https://, ftp://) being mistaken for a comment.
			if (line.startsWith('//', i) && line[i - 1] !== ':') {
				out += ' '.repeat(line.length - i);
				i = line.length;
				continue;
			}

			// Only treat "#" as a comment start at the beginning of the line or after whitespace,
			// so it doesn't swallow real code like private class fields (this.#secret).
			if (ch === '#' && (i === 0 || /\s/.test(line[i - 1]))) {
				out += ' '.repeat(line.length - i);
				i = line.length;
				continue;
			}

			if (line.startsWith('/*', i)) {
				blockCommentDelim = '*/';
				out += '  ';
				i += 2;
				continue;
			}

			if (line.startsWith('<!--', i)) {
				blockCommentDelim = '-->';
				out += '    ';
				i += 4;
				continue;
			}

			out += ch;
			i++;
		}

		masked.push(out);
	}

	return masked.join('\n');
}
