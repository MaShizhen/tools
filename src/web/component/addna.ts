import { basename, dirname, join } from 'path';
import { TextEditor, Uri, window, workspace, WorkspaceEdit } from 'vscode';
import { createfile, readdirSync, writeFileSync } from '../../util/fs';
import generate from '../../util/generate';
import replace from '../../util/replace';
import reg_in_comment from '../../util/reg-in-component';

export default async function add(editor: TextEditor) {
	const path = editor.document.fileName;
	const folder = dirname(path);
	// 如果当前目录不在某个页面中，则不允许操作
	const r = reg_in_comment(folder);
	if (r === null) {
		window.showErrorMessage('请在组件n.ts中进行该操作!');
	} else {
		const we = new WorkspaceEdit();
		const p_path = await create_a(we, folder);
		await workspace.applyEdit(we);
		await workspace.saveAll();
		await update_n(folder);
		window.showTextDocument(p_path);
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

async function create_a(we: WorkspaceEdit, p_path: string) {
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
	const uri = Uri.file(`${path}.ts`);
	createfile(we, `${path}.ts`, tpl);
	return uri;
}


function update_ns(path: string) {
	const tpl = `export default {
	'mm-events-init': 'na001'
};
`;
	return writeFileSync(join(path, 'ns.ts'), tpl);
}
