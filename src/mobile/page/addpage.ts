import { basename, join } from 'path';
import { Uri, window, workspace } from 'vscode';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from '../../util/fs';
import generate from '../../util/generate';
import replace from '../../util/replace';
import { NO_MODIFY } from '../../util/blocks';

export default async function add(rootPath: string) {
	const folder = join(rootPath, 'src');
	const p_path = await generate(folder, 'pg', '', 3);

	if (!await existsSync(folder)) {
		await mkdirSync(folder);
	}
	// 创建页面逻辑层目录
	await mkdirSync(p_path);
	await create_config(p_path);	// 创建页面配置文件
	await create_a(p_path);	// 创建事件
	await create_s(p_path);	// 创建响应
	await create_p(p_path);	// 创建page

	// 创建页面原生目录
	await create_tpl(p_path); // 创建page.tsx
	await create_style(p_path); // 创建样式
	const files = (await readdirSync(folder)).filter((item) => {
		return item !== 'app' && item !== 'atom';
	});
	await updata_component(folder, files);
	window.setStatusBarMessage('成功添加页面文件');
	window.showTextDocument(Uri.file(join(p_path, 'p.ts')));

	workspace.saveAll();
}

function create_config(_path: string) {
	const path = join(_path, 'config.ts');
	const tpl = `import { IPageConfig } from '@mmstudio/mobile/page';
export default {

} as IPageConfig;
`;
	return writeFileSync(path, tpl);
}

async function create_a(_path: string) {
	const path = await generate(_path, 'a', '\\.ts', 3);
	const a = basename(path);
	const tpl = `import am0 from '@mmstudio/am000000';

export default function ${a}(mm: am0) {
}
`;
	return writeFileSync(`${path}.ts`, tpl);
}

function create_s(_path: string) {
	const tpl = `export default {
	mm-events-init': 'a001'
};
`;
	return writeFileSync(join(_path, 's.ts'), tpl);
}

function create_p(_path: string) {
	const tpl = `import init from '@mmstudio/mobile/page';
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
	return init(global, global_css, actions, s, tpl, config, css);
}
`;
	return writeFileSync(join(_path, 'p.ts'), tpl);
}

function create_tpl(_path: string) {
	const tpl = `import am0 from '@mmstudio/am000000';
import React from 'react';
import { View } from 'react-native';

export default function tpl(a: <T>(action: string, ...args: unknown[]) => ((...args: unknown[]) => void), s: (...class_names: string[]) => {}, d: <T>(d: string) => T, mm: am0) {
	return (<View></View>);
}
`;
	return writeFileSync(join(_path, 'tpl.tsx'), tpl);
}

function create_style(_path: string) {
	const tpl = `export default {
};
`;
	return writeFileSync(join(_path, 'styles.ts'), tpl);
}

async function updata_component(folder: string, files: string[]) {
	const eol = '\n';
	const file_name = join(folder, 'app', 'app.ts');
	const editor = await window.showTextDocument(Uri.file(file_name));

	const ims = files.map((item) => {
		return `import ${item.replace(/-/g, '_')} from '../${item}/p';`;
	}).join(eol);
	await replace(editor, 'IMPCOMPONENTS', ims);

	const cs = files.map((item) => {
		return `${item.replace(/-/g, '_')}`;
	}).join(', ');
	if (cs.length > 0) {
		await replace(editor, 'COMPONENTS', `		${cs}`);
	} else {
		await replace(editor, 'COMPONENTS', '');
	}
}
