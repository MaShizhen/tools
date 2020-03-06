import { SnippetString, TextEditor } from 'vscode';

export default async function insetSnippet(textEditor: TextEditor, use: string, imp: string) {
	const context = textEditor.document.getText();
	if (!context.includes(imp)) {
		const active = textEditor.selection.active.translate(1);
		await textEditor.insertSnippet(new SnippetString(`${imp }\n`), textEditor.document.positionAt(0), {
			undoStopAfter: true,
			undoStopBefore: false
		});
		await textEditor.insertSnippet(new SnippetString(use), active, {
			undoStopAfter: false,
			undoStopBefore: true
		});
	} else {
		await textEditor.insertSnippet(new SnippetString(use), textEditor.selection.active, {
			undoStopAfter: true,
			undoStopBefore: true
		});
	}
}
