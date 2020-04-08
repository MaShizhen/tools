import { Position, SnippetString, TextEditor, workspace, WorkspaceEdit } from 'vscode';

export default async function insetSnippet(textEditor: TextEditor, use: string, imp: string) {
	const doc = textEditor.document;
	const max = doc.lineCount;
	let hasimport = false;
	let lastimport = -1;
	for (let i = 0; i < max; i++) {
		const line = doc.lineAt(i);
		const text = line.text;
		if (/^import\s+.+/.test(text)) {
			if (text === imp) {
				hasimport = true;
				break;
			} else {
				lastimport = i;
			}
		}
	}
	const imppos = new Position(lastimport + 1, 0);
	if (!hasimport) {
		const we = new WorkspaceEdit();
		const uri = doc.uri;
		we.insert(uri, imppos, `${imp}\n`);
		await workspace.applyEdit(we);
	}
	const active = textEditor.selection.active;
	// const pos = hasimport ? active : active.translate(1); we do not need translate here, active will auto tranlate after insert importing
	await textEditor.insertSnippet(new SnippetString(use), active, {
		undoStopAfter: true,
		undoStopBefore: true
	});
}
