import { basename, dirname, join } from 'path';
import { TextEditor, Uri, window, workspace, WorkspaceEdit } from 'vscode';
import { mkdirSync, readdirSync, writeFileSync } from '../../util/fs';
import generate from '../../util/generate';
import replace from '../../util/replace';
import { NO_MODIFY } from '../../util/blocks';

export default async function add(editor: TextEditor) {
	try {
		const doc = editor.document;
		const uri = doc.uri;
		// 如果当前目录不在某个页面中，则不允许操作
		const page_name = basename(dirname(uri.path));
		console.warn(page_name);
		const dir = workspace.getWorkspaceFolder(uri)!.uri.fsPath;
		const folder = join(dir, 'src', page_name);
		const content = doc.getText(editor.selection);

		const c = await generate(folder, 'zj-', '', 3);
		const no = c.replace(/.*(zj-\d*)/, '$1');
		// create
		await mkdirSync(c);	// zj-000001
		await create_tpl(c, content);
		await create_tplts(c, content);
		await create_s(c);
		await create_ns(c);
		const id = basename(c);
		await create_n(id, c);
		await create_b(id, c);
		// update b.ts, n.ts
		const files = await readdirSync(folder);
		const cs = files.filter((f) => {
			return /zj-\d{3,6}/.test(f);
		});
		await update_n(folder, cs);
		await update_b(folder, cs);
		await update_html(editor, no);
		await workspace.saveAll();
		window.setStatusBarMessage('创建成功');
		window.showTextDocument(Uri.file(join(c, 'tpl.tpl')));
	} catch (error) {
		console.trace(error);
	}
}

function update_html(editor: TextEditor, no: string) {
	const uri = editor.document.uri;
	const we = new WorkspaceEdit();
	const zj = `<${no}></${no}>`;
	we.replace(uri, editor.selection, zj);
	return workspace.applyEdit(we);
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

function create_b(id: string, path: string) {
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
	return writeFileSync(join(path, 'b.ts'), tpl);
}

function create_n(id: string, path: string) {
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
	return writeFileSync(join(path, 'n.ts'), tpl);
}

function create_ns(path: string) {
	const tpl = `export default {
};
`;
	return writeFileSync(join(path, 'ns.ts'), tpl);
}

function create_s(path: string) {
	const tpl = `export default {
};
`;
	return writeFileSync(join(path, 's.ts'), tpl);
}

function create_tpl(path: string, content: string) {
	return writeFileSync(join(path, 'tpl.tpl'), content);
}

function create_tplts(path: string, content: string) {
	const tpl = `export default \`${content}\`;
`;
	return writeFileSync(join(path, 'tpl.ts'), tpl);
}
