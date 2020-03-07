import { basename, join } from 'path';
import { TextEditor, Uri, window, workspace } from 'vscode';
import { readdirSync, writeFileSync } from '../../util/fs';
import generate from '../../util/generate';
import replace from '../../util/replace';

export default async function add(editor: TextEditor) {
	const path = editor.document.fileName;
	const uri = editor.document.uri;
	// 如果当前目录不在某个页面中，则不允许操作
	const r = /[/\\](src[/\\]\w[\w\d-]*)[/\\]?/.exec(path);
	if (r === null) {
		window.showErrorMessage('请在页面b.ts中进行该操作!');
	} else {
		const [, dir] = r;
		const folder = join(workspace.getWorkspaceFolder(uri)!.uri.fsPath, dir);
		const p_path = await generate(folder, 'na', '\\.ts', 3);
		await create_a(p_path);
		await update_b(folder);
		await workspace.saveAll();
		window.setStatusBarMessage('成功');
		window.showTextDocument(Uri.file(`${p_path}.ts`));
	}
}

async function update_b(path: string) {
	const file_name = join(path, 'n.ts');
	const editor = await window.showTextDocument(Uri.file(file_name));
	// const eol = workspace.getConfiguration('files').get<string>('eol');
	const eol = '\n';
	const files = await readdirSync(path);
	const as = files.filter((f) => {
		return /^na\d{3}\.ts$/.test(f);
	}).map((f) => {
		return basename(f, '.ts');
	});

	const ims = as.map((a) => {
		return `import ${a} from './${a}';`;
	}).join(eol);

	const imps = `${ims}`;

	await replace(editor, 'IMPACTIONS', imps);

	const actions = `	const actions = { ${as.join(', ')} };`;
	await replace(editor, 'ACTIONS', actions);
}

function create_a(path: string) {
	const a = basename(path);
	const tpl = `import an3 from '@mmstudio/an000003';

export default async function ${a}(mm: an3) {
	// todo
}
`;
	return writeFileSync(`${path}.ts`, tpl);
}
