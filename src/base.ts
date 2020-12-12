import { basename, dirname } from 'path';
import { TextEditor, Uri, window } from 'vscode';
import generate from './util/generate';
import Tools from './tools';

export default abstract class Base extends Tools {
	public abstract addaction(editor: TextEditor): Promise<void>;
	public abstract addcomponent(editor: TextEditor): Promise<void>;
	public abstract addpage(): Promise<void>;
	protected async baseaddaction(editor: TextEditor) {
		const uri = editor.document.uri;
		const folder = dirname(uri.fsPath);
		const p_path = await generate(folder, 'a', '\\.ts', 3);
		const a = basename(p_path);
		const tpl = `
export default function ${a}() {
	// todo
}
`;
		await this.writefileasync(`${p_path}.ts`, tpl);
		window.showTextDocument(Uri.file(`${p_path}.ts`));
	}
}
