import { join } from 'path';
import { TextEditor, Uri, window, workspace } from 'vscode';
import { writeFileSync } from '../../util/fs';
import generate from '../../util/generate';
import reg_in_comment from '../../util/reg-in-component';

export default async function add(editor: TextEditor) {
	const path = editor.document.fileName;
	const uri = editor.document.uri;
	// 如果当前目录不在某个页面中，则不允许操作
	const r = reg_in_comment(path);
	if (r === null) {
		window.showErrorMessage('请在组件中进行该操作!');
	} else {
		const [, dir] = r;
		const folder = join(workspace.getWorkspaceFolder(uri)!.uri.fsPath, dir);
		const p_path = await generate(folder, 's', '\\.ts', 3);
		await create_s(p_path, p_path.replace(/.*src[/|\\]/, ''));
		await workspace.saveAll();
		window.showTextDocument(Uri.file(`${p_path}.ts`));
	}
}

function create_s(path: string, dir: string) {
	const tpl = `import an1 from '@mmstudio/an000001';
import an4 from '@mmstudio/an000004';

interface Message {
	// cookie: {
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

export default async function atom(message: Message, action_id: string): Promise<an4> {
	an1('Service begin path:${dir},action_id:' + action_id);

	an1('Service end path:${dir},action_id:' + action_id);
	return {
		data: '"mmstudio"'
	} as an4;
}
`;
	return writeFileSync(`${path}.ts`, tpl);
}

