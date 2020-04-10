import { basename, join } from 'path';
import { Uri, window } from 'vscode';
import { writefileasync } from '../../util/fs';
import { NO_MODIFY } from '../../util/blocks';
import updatechildren from './update-children';
import getno from './getno';

export default async function addpage(dir: string) {
	const no = await getno('pg');
	const folder = join(dir, no);

	await create_config(folder);	// 创建页面配置文件
	await create_a(folder);	// 创建事件
	await create_s(folder);	// 创建响应
	await create_css(folder); // 创建样式
	await create_tpl(folder); // 创建tpl.tsx
	await create_p(folder);	// 创建page

	await updatechildren(dir);
	window.setStatusBarMessage('成功添加页面文件');
	window.showTextDocument(Uri.file(join(folder, 'tpl.tsx')));
}

function create_config(folder: string) {
	const path = join(folder, 'config.ts');
	const tpl = `import { PageConfig } from '@mmstudio/mobile';

export default {

} as PageConfig;
`;
	return writefileasync(path, tpl);
}

function create_a(folder: string) {
	const path = join(folder, 'a001.ts');
	const a = 'a001';
	const tpl = `import am1 from '@mmstudio/am000001';

export default function ${a}(mm: am1) {
}
`;
	return writefileasync(path, tpl);
}

function create_s(folder: string) {
	const tpl = `export default {
	'mm-events-init': 'a001'
};
`;
	return writefileasync(join(folder, 's.ts'), tpl);
}

function create_p(folder: string) {
	const name = basename(folder);
	const tpl = `import { page } from '@mmstudio/mobile';
import config from './config';
import s from './s';
import css from './css';
import tpl from './tpl';

/// MM IMPACTIONS BEGIN
/// ${NO_MODIFY}
import a001 from './a001';
/// MM IMPACTIONS END

export default function Page() {
	/// MM ACTIONS BEGIN
	/// ${NO_MODIFY}
	const actions = { a001 };
	/// MM ACTIONS END
	return page('${name}', actions, s, tpl, config, css);
}
`;
	return writefileasync(join(folder, 'p.ts'), tpl);
}

function create_tpl(folder: string) {
	const tpl = `import am1 from '@mmstudio/am000001';
import React from 'react';
import { } from 'react-native';

export default function tpl(a: <T>(action: string, ...args: unknown[]) => ((...args: unknown[]) => void), s: (...class_names: string[]) => {}, d: <T>(d: string, v: T) => T, mm: am1) {
	return (<></>);
}
`;
	return writefileasync(join(folder, 'tpl.tsx'), tpl);
}

function create_css(folder: string) {
	const tpl = `export default \`\`;
`;
	return writefileasync(join(folder, 'css.ts'), tpl);
}
