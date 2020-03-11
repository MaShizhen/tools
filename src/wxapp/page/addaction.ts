import { basename, dirname, join } from 'path';
import { TextEditor, Uri, window, workspace, WorkspaceEdit } from 'vscode';
import { createfile, readdirSync, readFileSync } from '../../util/fs';
import generate from '../../util/generate';
import replace from '../../util/replace';

export default async function addactionwxapp(editor: TextEditor) {
	const path = editor.document.fileName;
	const dir = dirname(path);
	// 如果当前目录不在某个页面中，则不允许操作
	const r = /[/\\](src[/\\]\w[\w\d-]*)[/\\]?/.exec(dir);
	if (r === null) {
		window.showErrorMessage('警示');
	} else {
		const we = new WorkspaceEdit();
		const p_path = await create_a(we, dir);
		await update_p(we, dir);
		await workspace.applyEdit(we);
		await workspace.saveAll();
		window.showTextDocument(Uri.file(`${p_path}.ts`));
	}
}

async function update_p(we: WorkspaceEdit, path: string) {
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

	await replace(we, file_name, 'IMPACTIONS', imps);

	const actions = `	const actions = { ${as.join(', ')} };`;
	await replace(we, file_name, 'ACTIONS', actions);
}

async function update_s(we: WorkspaceEdit, path: string, a: string) {
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
	const tpl = `export default ${str.replace(/"/g, "'")};
`;
	createfile(we, page_s_path, tpl);
}

async function create_a(we: WorkspaceEdit, p_path: string) {
	const path = await generate(p_path, 'a', '\\.ts', 3);
	const a = basename(path);
	const tpl = `import awx8 from '@mmstudio/awx000008';

export default async function ${a}(mm: awx8) {
	// todo
}
`;
	const uri = Uri.file(`${path}.ts`);
	createfile(we, `${path}.ts`, tpl);
	await update_s(we, p_path, a);
	return uri;
}
