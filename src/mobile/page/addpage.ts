import { basename, join } from 'path';
import { Uri, window, workspace, WorkspaceEdit } from 'vscode';
import { createfile, readdirSync } from '../../util/fs';
import generate from '../../util/generate';
import replace from '../../util/replace';
import { NO_MODIFY } from '../../util/blocks';

export default async function add(rootPath: string) {
	const folder = join(rootPath, 'src');
	const p_path = await generate(folder, 'pg', '', 3);
	await workspace.fs.createDirectory(Uri.file(p_path));

	const we = new WorkspaceEdit();

	create_config(we, p_path);	// 创建页面配置文件
	await create_a(we, p_path);	// 创建事件
	create_s(we, p_path);	// 创建响应
	create_p(we, p_path);	// 创建page

	// 创建页面原生目录
	create_tpl(we, p_path); // 创建tpl.tsx
	create_style(we, p_path); // 创建样式
	await workspace.applyEdit(we);
	await workspace.saveAll();
	await update_component(folder);
	window.setStatusBarMessage('成功添加页面文件');
	window.showTextDocument(Uri.file(join(p_path, 'tpl.tsx')));
}

function create_config(we: WorkspaceEdit, _path: string) {
	const path = join(_path, 'config.ts');
	const tpl = `import { IPageConfig } from '@mmstudio/mobile';

export default {

} as IPageConfig;
`;
	return createfile(we, path, tpl);
}

async function create_a(we: WorkspaceEdit, _path: string) {
	const path = await generate(_path, 'a', '\\.ts', 3);
	const a = basename(path);
	const tpl = `import am1 from '@mmstudio/am000001';

export default function ${a}(mm: am1) {
}
`;
	return createfile(we, `${path}.ts`, tpl);
}

function create_s(we: WorkspaceEdit, _path: string) {
	const tpl = `export default {
	'mm-events-init': 'a001'
};
`;
	return createfile(we, join(_path, 's.ts'), tpl);
}

function create_p(we: WorkspaceEdit, _path: string) {
	const tpl = `import { page } from '@mmstudio/mobile';
import config from './config';
import s from './s';
import css from './styles';
import tpl from './tpl';

/// MM IMPACTIONS BEGIN
/// ${NO_MODIFY}
import a001 from './a001';
/// MM IMPACTIONS END

export default function main(global: { [key: string]: unknown; }, global_css: { [name: string]: {}}) {
	/// MM ACTIONS BEGIN
	/// ${NO_MODIFY}

	const actions = { a001 };
	/// MM ACTIONS END
	return page(global, global_css, actions, s, tpl, config, css);
}
`;
	return createfile(we, join(_path, 'p.ts'), tpl);
}

function create_tpl(we: WorkspaceEdit, _path: string) {
	const tpl = `import am1 from '@mmstudio/am000001';
import React from 'react';
import { View } from 'react-native';

export default function tpl(a: <T>(action: string, ...args: unknown[]) => ((...args: unknown[]) => void), s: (...class_names: string[]) => {}, d: <T>(d: string) => T, mm: am1) {
	return (<View></View>);
}
`;
	return createfile(we, join(_path, 'tpl.tsx'), tpl);
}

function create_style(we: WorkspaceEdit, _path: string) {
	const tpl = `export default {
};
`;
	return createfile(we, join(_path, 'styles.ts'), tpl);
}

async function update_component(folder: string) {
	const files = (await readdirSync(folder)).filter((item) => {
		return /^pg\d+/.test(item);
	});
	const eol = '\n';
	const file_name = join(folder, 'app', 'app.ts');

	const ims = files.map((item) => {
		return `import ${item.replace(/-/g, '_')} from '../${item}/p';`;
	}).join(eol);
	await replace(file_name, 'IMPCOMPONENTS', ims);

	const cs = files.map((item) => {
		return `${item.replace(/-/g, '_')}`;
	}).join(', ');
	if (cs.length > 0) {
		await replace(file_name, 'COMPONENTS', `		${cs}`);
	} else {
		await replace(file_name, 'COMPONENTS', '');
	}
}
