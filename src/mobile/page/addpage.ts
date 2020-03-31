import { basename, join } from 'path';
import { Uri, window, workspace, WorkspaceEdit } from 'vscode';
import { createfile } from '../../util/fs';
import { NO_MODIFY } from '../../util/blocks';
import updatechildren from './update-children';
import getno from './getno';

export default async function addpage(dir: string) {
	const no = await getno('pg');
	const folder = join(dir, no);

	const we = new WorkspaceEdit();

	create_config(we, folder);	// 创建页面配置文件
	create_a(we, folder);	// 创建事件
	create_s(we, folder);	// 创建响应
	create_css(we, folder); // 创建样式
	create_tpl(we, folder); // 创建tpl.tsx
	create_p(we, folder);	// 创建page

	await workspace.applyEdit(we);
	await workspace.saveAll();
	await updatechildren(dir);
	window.setStatusBarMessage('成功添加页面文件');
	window.showTextDocument(Uri.file(join(folder, 'tpl.tsx')));
}

function create_config(we: WorkspaceEdit, folder: string) {
	const path = join(folder, 'config.ts');
	const tpl = `import { PageConfig } from '@mmstudio/mobile';

export default {

} as PageConfig;
`;
	return createfile(we, path, tpl);
}

function create_a(we: WorkspaceEdit, folder: string) {
	const path = join(folder, 'a001.ts');
	const a = 'a001';
	const tpl = `import am1 from '@mmstudio/am000001';

export default function ${a}(mm: am1) {
}
`;
	return createfile(we, path, tpl);
}

function create_s(we: WorkspaceEdit, folder: string) {
	const tpl = `export default {
	'mm-events-init': 'a001'
};
`;
	return createfile(we, join(folder, 's.ts'), tpl);
}

function create_p(we: WorkspaceEdit, folder: string) {
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
	return createfile(we, join(folder, 'p.ts'), tpl);
}

function create_tpl(we: WorkspaceEdit, folder: string) {
	const tpl = `import am1 from '@mmstudio/am000001';
import React from 'react';
import { } from 'react-native';

export default function tpl(a: <T>(action: string, ...args: unknown[]) => ((...args: unknown[]) => void), s: (...class_names: string[]) => {}, d: <T>(d: string) => T, mm: am1) {
	return (<></>);
}
`;
	return createfile(we, join(folder, 'tpl.tsx'), tpl);
}

function create_css(we: WorkspaceEdit, folder: string) {
	const tpl = `export default \`\`;
`;
	return createfile(we, join(folder, 'css.ts'), tpl);
}
