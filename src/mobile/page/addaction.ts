import { basename, dirname, join } from 'path';
import { TextEditor, Uri, window, workspace, WorkspaceEdit } from 'vscode';
import { createfile, existsSync, readdirSync } from '../../util/fs';
import generate from '../../util/generate';
import replace from '../../util/replace';

export default async function add(editor: TextEditor) {
	const path = editor.document.fileName;
	const folder = dirname(path);
	// 如果当前目录不在某个页面中，则不允许操作
	const r = /[/\\](src[/\\]\w[\w\d-]*)[/\\]?/.exec(folder);
	if (r === null) {
		window.showErrorMessage('警示');
	} else {
		const we = new WorkspaceEdit();
		const p_path = await create_a(we, folder);
		await update_p(we, folder);
		await workspace.applyEdit(we);
		await workspace.saveAll();
		window.showTextDocument(p_path);
	}
}

async function update_p(we: WorkspaceEdit, path: string) {
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

	await replace(we, file_name, 'IMPACTIONS', imps);

	const actions = `	const actions = { ${as.join(', ')} };`;
	await replace(we, file_name, 'ACTIONS', actions);
}

async function create_a(we: WorkspaceEdit, p_path: string) {
	const path = await generate(p_path, 'a', '\\.ts', 3);
	const a = basename(path);
	const tpl = `import am0 from '@mmstudio/am000000';

export default function ${a}(mm: am0) {
}
`;
	const uri = Uri.file(`${path}.ts`);
	createfile(we, `${path}.ts`, tpl);
	return uri;
}
