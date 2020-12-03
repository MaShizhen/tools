import { basename, dirname } from 'path';
import { TextEditor, Uri, window } from 'vscode';
import { writefileasync } from '../../util/fs';
import generate from '../../util/generate';

export default async function addactiondefault(editor: TextEditor) {
	const uri = editor.document.uri;
	const folder = dirname(uri.fsPath);
	// 如果当前目录不在某个组件中，则不允许操作
	const p_path = await generate(folder, 'a', '\\.ts', 3);
	await create_a(p_path);
	window.showTextDocument(Uri.file(`${p_path}.ts`));
}

function create_a(p_path: string) {
	const a = basename(p_path);
	const tpl = `
export default function ${a}() {
	// todo
}
`;
	return writefileasync(`${p_path}.ts`, tpl);
}
