import { basename, dirname, join } from 'path';
import { TextEditor, Uri, window, workspace } from 'vscode';
import generate from './util/generate';
import Tools from './tools';

export default abstract class Base extends Tools {
	public abstract addpresentation(editor: TextEditor): Promise<void>;
	public abstract addaction(editor: TextEditor): Promise<void>;
	public abstract addcomponent(editor: TextEditor): Promise<void>;
	public abstract addpage(): Promise<void>;
	public abstract addservice(): Promise<void>;
	protected async baseaddservice() {
		const path = (() => {
			const editor = window.activeTextEditor;
			if (!editor) {
				const wfs = workspace.workspaceFolders;
				if (!wfs || wfs.length === 0) {
					throw new Error('Please make sure you have a project opend');
				}
				return join(wfs[0].uri.fsPath, 'src');
			}
			return editor.document.fileName;
		})();
		let folder = dirname(path);
		if (!folder.includes('src')) {
			folder = join(folder, 'src');
			await this.mkdirasync(folder);
		}
		const p_path = await generate(folder, 's', '\\.ts', 3);
		await this.create_s(p_path, p_path.replace(/.*src[/|\\]/, ''));
		await workspace.saveAll();
		this.show_doc(`${p_path}.ts`);
	}
	private create_s(path: string, dir: string) {
		const no = basename(path, '.ts');
		const tpl = `import an1 from '@mmstudio/an000001';
import an4 from '@mmstudio/an000004';

interface Message {
	// cookies: {
	// 	uk: string;
	// 	[key: string]: string
	// };
	// urls: {
	// 	base: string;
	// 	origin: string;
	// 	url: string;
	// };
	// query: {};
	// params: {};
	// headers: {};
	// captcha: string;
}

export default async function ${no}(msg: Message, actionid: string): Promise<an4> {
	an1(\`Service begin path:${dir},actionid:$\{actionid}\`);

	an1(\`Service end path:${dir},actionid:$\{actionid}\`);
	return {
		data: '"mm"'
	} as an4;
}
`;
		return this.writefileasync(`${path}.ts`, tpl);
	}
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
