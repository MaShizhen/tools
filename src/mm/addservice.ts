import { basename, dirname, join } from 'path';
import { commands, Uri, window, workspace } from 'vscode';
import { mkdirasync, writefileasync } from '../util/fs';
import generate from '../util/generate';

export default function add() {
	return commands.registerCommand('mm.service.add', async () => {
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
			await mkdirasync(folder);
		}
		// 如果当前目录不在某个页面中，则不允许操作
		const p_path = await generate(folder, 's', '\\.ts', 3);
		await create_s(p_path, p_path.replace(/.*src[/|\\]/, ''));
		await workspace.saveAll();
		window.showTextDocument(Uri.file(`${p_path}.ts`));
	});
}

function create_s(path: string, dir: string) {
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
	return writefileasync(`${path}.ts`, tpl);
}
