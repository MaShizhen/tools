import { basename, dirname, join } from 'path';
import { TextEditor, Uri, window, workspace, WorkspaceEdit } from 'vscode';
import { createfile, readdirSync } from '../../util/fs';
import generate from '../../util/generate';
import replace from '../../util/replace';
import { NO_MODIFY } from '../../util/blocks';

export default async function add(editor: TextEditor) {
	try {
		const doc = editor.document;
		const uri = doc.uri;
		// 如果当前目录不在某个页面中，则不允许操作
		const folder = dirname(uri.path);
		const content = doc.getText(editor.selection);

		const component_dir = await generate(folder, 'zj-', '', 3);
		const no = component_dir.replace(/.*(zj-\d*)/, '$1');

		const we = new WorkspaceEdit();
		create_tpl(we, component_dir, content);
		create_tplts(we, component_dir, content);
		create_s(we, component_dir);
		create_ns(we, component_dir);
		const id = basename(component_dir);
		create_n(we, id, component_dir);
		create_b(we, id, component_dir);
		update_html(we, editor, no);
		// update b.ts, n.ts
		await workspace.applyEdit(we);
		await workspace.saveAll();
		const files = await readdirSync(folder);
		const cs = files.filter((f) => {
			return /zj-\d{3,6}/.test(f);
		});
		await workspace.applyEdit(we);
		await workspace.saveAll();

		await update_n(folder, cs);
		await update_b(folder, cs);
		window.setStatusBarMessage('创建成功');
		window.showTextDocument(Uri.file(join(component_dir, 'tpl.tpl')));
	} catch (error) {
		console.trace(error);
	}
}

function update_html(we: WorkspaceEdit, editor: TextEditor, no: string) {
	const uri = editor.document.uri;
	const zj = `<${no}></${no}>`;
	we.replace(uri, editor.selection, zj);
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
	const tpl = `import { bc } from '@mmstudio/web';

import s from './s';

/// MM IMPACTIONS BEGIN
/// ${NO_MODIFY}
/// MM IMPACTIONS END

/// MM IMPWIDGETS BEGIN
/// ${NO_MODIFY}
/// MM IMPWIDGETS END

export default function main(url: string, query: {}) {
	/// MM ACTIONS BEGIN
	/// ${NO_MODIFY}
	const actions = {};
	/// MM ACTIONS END
	return bc('${id}', s, actions, url, query);
}
`;
	createfile(we, join(path, 'b.ts'), tpl);
}

function create_n(we: WorkspaceEdit, id: string, path: string) {
	const tpl = `import { nc } from '@mmstudio/web';
import { HTMLElement } from 'node-html-parser';
import s from './ns';
import tpl from './tpl';

/// MM IMPACTIONS BEGIN
/// ${NO_MODIFY}
/// MM IMPACTIONS END

export default function main(html: HTMLElement, url: string, msg: unknown, headers: object, query: {}) {

	/// MM ACTIONS BEGIN
	/// ${NO_MODIFY}
	const actions = {};
	/// MM ACTIONS END


	return nc('${id}', tpl, s, actions, html, url, msg, headers, query);
}

`;
	createfile(we, join(path, 'n.ts'), tpl);
}

function create_ns(we: WorkspaceEdit, path: string) {
	const tpl = `export default {
};
`;
	createfile(we, join(path, 'ns.ts'), tpl);
}

function create_s(we: WorkspaceEdit, path: string) {
	const tpl = `export default {
};
`;
	createfile(we, join(path, 's.ts'), tpl);
}

function create_tpl(we: WorkspaceEdit, path: string, content: string) {
	createfile(we, join(path, 'tpl.tpl'), content);
}

function create_tplts(we: WorkspaceEdit, path: string, content: string) {
	const tpl = `export default \`${content}\`;
`;
	createfile(we, join(path, 'tpl.ts'), tpl);
}
