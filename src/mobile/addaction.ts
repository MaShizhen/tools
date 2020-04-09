import { basename, dirname, join } from 'path';
import { TextEditor, Uri, window } from 'vscode';
import { existsasync, readdirasync, writefileasync } from '../util/fs';
import generate from '../util/generate';
import replace from '../util/replace';

export default async function add(editor: TextEditor) {
	const path = editor.document.fileName;
	const folder = dirname(path);
	// 如果当前目录不在某个页面中，则不允许操作
	const r = /[/\\](src[/\\]\w[\w\d-]*)[/\\]?/.exec(folder);
	if (r === null) {
		window.showErrorMessage('警示');
	} else {
		const p_path = await create_a(folder);
		await update_p(folder);
		window.showTextDocument(p_path);
	}
}

async function update_p(path: string) {
	let file_name = join(path, 'p.ts');
	if (!await existsasync(file_name)) {
		file_name = join(path, 'app.ts');
	}
	const eol = '\n';
	const files = await readdirasync(path);
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
	const tpl = `import am1 from '@mmstudio/am000001';

export default function ${a}(mm: am1) {
}
`;
	const uri = Uri.file(`${path}.ts`);
	await writefileasync(`${path}.ts`, tpl);
	return uri;
}
