import { env, TextEditor, window } from 'vscode';

export default async function linebreak(editor: TextEditor) {
	const sel = editor.selection;
	const text = editor.document.getText(sel);
	const d = text.replaceAll('\n\n', '\\n\n');
	await env.clipboard.writeText(d);
	await editor.edit((eb) => {
		eb.replace(sel, d);
	});
	await window.showInformationMessage('Copied');
}
