import { basename, dirname, join } from 'path';
import { TextEditor, Uri, window } from 'vscode';
import { readdirasync, writefileasync } from '../../util/fs';
import generate from '../../util/generate';
import replace from '../../util/replace';

export default async function add(editor: TextEditor) {
	const path = editor.document.fileName;
	const folder = dirname(path);
	// 如果当前目录不在某个页面中，则不允许操作
	const r = /[/\\](src[/\\]\w[\w\d-]*)[/\\]?/.exec(folder);
	if (r === null) {
		window.showErrorMessage('请在页面b.ts中进行该操作!');
	} else {
		const p_path = await generate(folder, 'a', '\\.ts', 3);
		await create_a(p_path);
		await update_b(folder);
		window.setStatusBarMessage('成功');
		window.showTextDocument(Uri.file(`${p_path}.ts`));
	}
}

async function update_b(path: string) {
	const file_name = join(path, 'b.ts');
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

function create_a(path: string) {
	const a = basename(path);
	const tpl = `import aw1 from '@mmstudio/aw000001';

export default function ${a}(mm: aw1) {
	// todo
}
`;
	return writefileasync(`${path}.ts`, tpl);
}
