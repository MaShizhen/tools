import { join } from 'path';
import { commands, TextEditor, Uri, window, workspace } from 'vscode';
import check_file from '../util/check-file';
import { writeFileSync } from '../util/fs';
import generate from '../util/generate';
import root_path from '../util/root';
import prj_type, { PrjType } from '../util/prj-type';

export default function add() {
	return commands.registerTextEditorCommand('mm.service.add', async (editor) => {
		const rootPath = root_path();
		if (!await check_file(rootPath)) {
			return;
		}
		const type = prj_type();
		switch (type) {
			case PrjType.web:
				await web(editor);
				break;
			case PrjType.wxapp:
				await app(editor);
				break;
			case PrjType.desktop:
				await web(editor);
				break;
			case PrjType.mobile:
				await app(editor);
				break;
		}
		commands.executeCommand('workbench.files.action.refreshFilesExplorer');
	});
}

function app(editor: TextEditor) {
	return add_s(editor, /[/\\](src[/\\]\w[\w\d-]*)[/\\]?/);
}

function web(editor: TextEditor) {
	return add_s(editor, /[/\\](src[/\\]\w[\w\d-]*[/\\](zj-\d{3,6}))[/\\]?/);
}

async function add_s(editor: TextEditor, checker: RegExp) {
	const path = editor.document.fileName;
	const uri = editor.document.uri;
	// 如果当前目录不在某个页面中，则不允许操作
	const r = checker.exec(path);
	if (r === null) {
		window.showErrorMessage('当前目录下不能进行该操作!');
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

export default async function atom(msg: Message, action_id: string): Promise<an4> {
	an1('Service begin path:${dir},action_id:' + action_id);

	an1('Service end path:${dir},action_id:' + action_id);
	return {
		data: '"mm"'
	} as an4;
}
`;
	return writeFileSync(`${path}.ts`, tpl);
}
