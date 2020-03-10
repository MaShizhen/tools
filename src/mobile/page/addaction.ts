import { basename, join } from 'path';
import { TextEditor, Uri, window, workspace } from 'vscode';
import { existsSync, readdirSync, writeFileSync } from '../../util/fs';
import generate from '../../util/generate';
import replace from '../../util/replace';

export default async function add(editor: TextEditor) {
	const path = editor.document.fileName;
	const uri = editor.document.uri;
	// 如果当前目录不在某个页面中，则不允许操作
	const r = /[/\\](src[/\\]\w[\w\d-]*)[/\\]?/.exec(path);
	if (r === null) {
		window.showErrorMessage('警示');

	} else {
		const [, dir] = r;
		const folder = join(workspace.getWorkspaceFolder(uri)!.uri.fsPath, dir);
		const p_path = await create_a(folder);
		await update_p(folder);
		await workspace.saveAll();
		window.showTextDocument(Uri.file(`${p_path}.ts`));
	}
}

async function update_p(path: string) {
	let file_name = join(path, 'p.ts');
	if (!await existsSync(file_name)) {
		file_name = join(path, 'app.ts');
	}
	const eol = '\n';
	const files = await readdirSync(path);
	const as = files.filter((f) => {
		return /^a\d{3}\.ts$/.test(f);
	}).map((f) => {
		return basename(f, '.ts');
	});

	const ims = as.map((a) => {
		return `import ${a} from './${a}';`;
	}).join(eol);

	const imps = `${ims}`;

	await replace(file_name, 'IMPACTIONS', imps);

	const actions = `	const actions = { ${as.join(', ')} };`;
	await replace(file_name, 'ACTIONS', actions);
}

async function create_a(p_path: string) {
	const path = await generate(p_path, 'a', '\\.ts', 3);
	const a = basename(path);
	const tpl = `import am0 from '@mmstudio/am000000';

export default function ${a}(mm: am0) {
}
`;
	await writeFileSync(`${path}.ts`, tpl);
	return path;
}
