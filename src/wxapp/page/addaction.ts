import { basename, join } from 'path';
import { TextEditor, Uri, window, workspace } from 'vscode';
import { readdirSync, readFileSync, writeFileSync } from '../../util/fs';
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
	const file_name = join(path, 'p.ts');
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

async function update_s(path: string, a: string) {
	const page_s_path = join(path, 's.ts');
	const txt = await readFileSync(page_s_path);
	const res = txt.match(/{(.|\n)*}/g);
	const str = (() => {
		if (res) {
			const obj_str = res[0].replace(/'/g, '"');
			const obj = JSON.parse(obj_str);
			return JSON.stringify({ ...obj, [a]: a }, null, '\t');
		}
		return JSON.stringify({ [a]: a }, null, '\t');

	})();
	return writeFileSync(page_s_path, `export default ${str.replace(/"/g, "'")};
`);
}

async function create_a(p_path: string) {
	const path = await generate(p_path, 'a', '\\.ts', 3);
	const a = basename(path);
	const tpl = `import awx8 from '@mmstudio/awx000008';

export default async function ${a}(mm: awx8) {
	// todo
}
`;
	await writeFileSync(`${path}.ts`, tpl);
	await update_s(p_path, a);
	return path;
}
