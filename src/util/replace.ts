import { Position, Range, Uri, window, workspace, WorkspaceEdit } from 'vscode';
import { NO_MODIFY } from './blocks';

export default async function replace(we: WorkspaceEdit, path: string, flag: string, str: string) {
	const doc = await workspace.openTextDocument(Uri.file(path));

	const REGEXP_TOC_START = `/// MM ${flag} BEGIN`;
	const REGEXP_TOC_STOP = `/// MM ${flag} END`;

	let begin = -1;
	let end = -1;
	for (let i = 0; i < doc.lineCount; i++) {
		const textline = doc.lineAt(i);
		const lineText = textline.text;
		if (lineText.includes(REGEXP_TOC_START)) {
			begin = i;
		} else if (lineText.includes(REGEXP_TOC_STOP)) {
			end = i;
			break;
		}
	}

	if (begin === -1 || end === -1) {
		window.showErrorMessage(`找不到标识:[ // MM ${flag} BEGIN ] 或 [ // MM ${flag} END ]`);
		return;
	}
	const start = new Position(begin + 1, 0);
	const stop = new Position(end, 0);
	const rang = new Range(start, stop);
	const eol = '\n';
	we.replace(doc.uri, rang, `/// ${NO_MODIFY}${eol}${str}${eol}`);
}
