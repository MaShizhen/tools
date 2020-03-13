import { basename, dirname, join } from 'path';
import { TextEditor, Uri, window, workspace, WorkspaceEdit } from 'vscode';
import { createfile, readdirSync } from '../../util/fs';
import generate from '../../util/generate';
import replace from '../../util/replace';
import { NO_MODIFY } from '../../util/blocks';

export default async function add(editor: TextEditor) {
	try {
		const path = editor.document.fileName;
		const folder = dirname(path);
		// 如果当前目录不在某个页面中，则不允许操作
		const r = /[/\\](src[/\\]\w[\w\d-]*)[/\\]?/.exec(path);
		if (r === null) {
			window.showErrorMessage('您必须在某个页面文件夹下进行该操作！');
		} else {
			const c = await generate(folder, 'zj-', '', 3);
			const we = new WorkspaceEdit();
			// create
			create_tpl(we, c);
			create_s(we, c);
			const id = basename(c);
			create_n(we, id, c);
			create_b(we, id, c);
			// update b.ts, n.ts
			const files = await readdirSync(folder);
			const cs = files.filter((f) => {
				return /zj-\d{3,6}/.test(f);
			});
			await workspace.applyEdit(we);
			await workspace.saveAll();
			await update_n(folder, cs);
			await update_b(folder, cs);
			window.setStatusBarMessage('创建成功');
			window.showTextDocument(Uri.file(join(c, 'b.ts')));
		}
	} catch (error) {
		console.trace(error);
	}
}

async function update_b(path: string, components: string[]) {
	// const eol = workspace.getConfiguration('files').get<string>('eol');
	const eol = '\n';
	const file_name = join(path, 'b.ts');

	const ims = components.map((c, i) => {
		return `import c${i} from './${c}/b';`;
	}).join(eol);
	await replace(file_name, 'IMPCOMPONENTS', ims);

	const cs = components.map((_c, i) => {
		return `c${i}`;
	}).join(', ');
	if (cs.length > 0) {
		await replace(file_name, 'COMPONENTS', `		,${cs}`);
	} else {
		await replace(file_name, 'COMPONENTS', '');
	}
}

async function update_n(path: string, components: string[]) {
	// const eol = workspace.getConfiguration('files').get<string>('eol');
	const eol = '\n';
	const file_name = join(path, 'n.ts');

	const ims = components.map((c, i) => {
		return `import c${i} from './${c}/n';`;
	}).join(eol);
	await replace(file_name, 'IMPCOMPONENTS', ims);

	const cs = components.map((_c, i) => {
		return `c${i}`;
	}).join(', ');
	if (cs.length > 0) {
		await replace(file_name, 'COMPONENTS', `		,${cs}`);
	} else {
		await replace(file_name, 'COMPONENTS', '');
	}
}

function create_b(we: WorkspaceEdit, id: string, path: string) {
	const tpl = `import init from '@mmstudio/desktop/component';

import s from './s';

/// MMSTUDIO IMPACTIONS BEGIN
/// ${NO_MODIFY}
/// MMSTUDIO IMPACTIONS END

export default function main(url: string, query: {}) {
	/// MMSTUDIO ACTIONS BEGIN
	/// ${NO_MODIFY}
	const actions = {};
	/// MMSTUDIO ACTIONS END
	return init('${id}', s, actions, url, query);
}
`;
	return createfile(we, join(path, 'b.ts'), tpl);
}

function create_n(we: WorkspaceEdit, id: string, path: string) {
	const tpl = `
import init from '@mmstudio/desktop/init-component';
import { HTMLElement } from 'node-html-parser';
import tpl from './tpl';


export default function main(html: HTMLElement) {
	return init('${id}', tpl, html);
}

`;
	return createfile(we, join(path, 'n.ts'), tpl);
}

function create_s(we: WorkspaceEdit, path: string) {
	const tpl = `export default {
};
`;
	return createfile(we, join(path, 's.ts'), tpl);
}

function create_tpl(we: WorkspaceEdit, path: string) {
	const tpl = `export default \`
\`;
`;
	return createfile(we, join(path, 'tpl.ts'), tpl);
}
