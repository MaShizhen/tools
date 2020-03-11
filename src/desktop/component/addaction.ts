import { basename, join } from 'path';
import { TextEditor, Uri, window, workspace, WorkspaceEdit } from 'vscode';
import { createfile, readdirSync } from '../../util/fs';
import generate from '../../util/generate';
import replace from '../../util/replace';
import reg_in_comment from '../../util/reg-in-component';
import root from '../../util/root';

export default async function add(editor: TextEditor) {
	const path = workspace.asRelativePath(editor.document.uri);
	// 如果当前目录不在某个页面中，则不允许操作
	const r = reg_in_comment(path);
	if (r === null) {
		window.showErrorMessage('请在组件中进行该操作!');
	} else {
		const folder = basename(path);
		const dir = join(await root(editor), folder);
		const p_path = await generate(dir, 'a', '\\.ts', 3);
		const we = new WorkspaceEdit();
		create_a(we, p_path);
		await update_b(we, dir);
		await workspace.applyEdit(we);
		await workspace.saveAll();
		window.showTextDocument(Uri.file(`${p_path}.ts`));
	}
}

async function update_b(we: WorkspaceEdit, path: string) {
	const file_name = join(path, 'b.ts');
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

function create_a(we: WorkspaceEdit, path: string) {
	const a = basename(path);
	const tpl = `import { IAiDesktopComponent } from '@mmstudio/desktop/interfaces';

export default async function ${a}(mm: IAiDesktopComponent) {
	// todo
}
`;
	createfile(we, `${path}.ts`, tpl);
}
