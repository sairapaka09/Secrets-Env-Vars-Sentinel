import * as path from 'node:path';

const documentationExtensions = new Set([
	'.adoc',
	'.asciidoc',
	'.md',
	'.markdown',
	'.mdx',
	'.org',
	'.rst',
	'.tex',
	'.textile',
	'.txt'
]);

const documentationFileNames = new Set(['changelog', 'contributing', 'license', 'readme']);

/** Returns whether a path is conventional prose documentation rather than source or config. */
export function isDocumentationFile(filePath: string): boolean {
	const basename = path.basename(filePath).toLowerCase();
	const extension = path.extname(basename);
	const nameWithoutExtension = path.basename(basename, extension);

	return documentationExtensions.has(extension) || documentationFileNames.has(nameWithoutExtension);
}