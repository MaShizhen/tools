import { basename, join } from 'path';
import { TextEditor, Uri, window, workspace } from 'vscode';
import { readdirSync, writeFileSync } from '../../util/fs';
import generate from '../../util/generate';
import replace from '../../util/replace';
import reg_in_comment from '../../util/reg-in-component';

export default async function add(editor: TextEditor) {
	const path = editor.document.fileName;
	const uri = editor.document.uri;
	// 如果当前目录不在某个页面中，则不允许操作
	const r = reg_in_comment(path);
	if (r === null) {
		window.showErrorMessage('请在组件n.ts中进行该操作!');
	} else {
		const [, dir] = r;
		const folder = join(workspace.getWorkspaceFolder(uri)!.uri.fsPath, dir);
		const p_path = await create_a(folder);
		await update_n(folder);
		await workspace.saveAll();
		window.showTextDocument(Uri.file(`${p_path}.ts`));
	}
}

async function update_n(path: string) {
	const file_name = join(path, 'n.ts');
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

	await replace(file_name, 'IMPACTIONS', imps);

	const actions = `	const actions = { ${as.join(', ')} };`;
	await replace(file_name, 'ACTIONS', actions);
}

async function create_a(p_path: string) {
	const path = await generate(p_path, 'na', '\\.ts', 3);
	const a = basename(path);
	if (a === 'na001') {
		await update_ns(p_path);
	}
	const tpl = `import an2 from '@mmstudio/an000002';

export default async function ${a}(mm: an2) {
	// todo
}
`;
	await writeFileSync(`${path}.ts`, tpl);
	return path;
}


function update_ns(path: string) {
	const tpl = `export default {
	'mm-events-init': 'na001'
};
`;
	return writeFileSync(join(path, 'ns.ts'), tpl);
}
