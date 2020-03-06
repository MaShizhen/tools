import { Position, Range, TextEditor, window } from 'vscode';
import { NO_MODIFY } from './blocks';

export default async function replace(editor: TextEditor, flag: string, str: string) {
	const doc = editor.document;
	let start: Position = null as unknown as Position;
	let stop: Position = null as unknown as Position;

	const REGEXP_TOC_START = new RegExp(`/// MM ${flag} BEGIN`);
	const REGEXP_TOC_STOP = new RegExp(`/// MM ${flag} END`);
	for (let index = 0; index < doc.lineCount; index++) {
		const lineText = doc.lineAt(index).text;
		if ((start === null) && (REGEXP_TOC_START.exec(lineText))) {
			start = new Position(index + 1, 0);
		} else if (REGEXP_TOC_STOP.exec(lineText)) {
			stop = new Position(index - 1, 0);
			break;
		}
	}
	if (start === null || stop === null) {
		window.showErrorMessage(`找不到标识:[ // MM ${flag} BEGIN ] 或 [ // MM ${flag} END ]`);
		return;
	}
	if (start.line > stop.line) {
		window.showErrorMessage('在标识之间至少需要一个空行');
		return;
	}
	const rang = new Range(start, stop);
	// const eol = workspace.getConfiguration('files').get<string>('eol');
	const eol = '\n';
	await editor.edit((editor_builder) => {
		editor_builder.replace(rang, `/// ${NO_MODIFY}${eol}${str}${eol}`);
	});
}
