import { basename, join } from 'path';
import { Uri, window, workspace } from 'vscode';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from '../../util/fs';
import generate from '../../util/generate';

export default async function add(rootPath: string) {
	const folder = join(rootPath, 'src');

	if (!await existsSync(folder)) {
		await mkdirSync(folder);
	}

	const p_path = await generate(folder, 'pg', '', 3);
	// 创建页面逻辑层目录
	await mkdirSync(p_path);
	await create_a(p_path);		// 创建事件
	await create_s(p_path);		// 创建响应
	await create_p(p_path);		// 创建page

	// 创建页面原生目录

	const name = p_path.replace(/.*[/\\]/, '');

	await create_json(p_path, name);	// 创建page.json
	await create_wxml(p_path, name);	// 创建page.wxml
	await create_wxss(p_path, name);	// 创建page.wxss

	// 修改app.json和app-debug.json
	await updata_app_json(folder, name);
	// updata_app_debug_json(folder, name);

	window.setStatusBarMessage('成功添加页面文件');
	window.showTextDocument(Uri.file(join(p_path, 'p.ts')));

	workspace.saveAll();
}

async function create_a(_path: string) {
	const path = await generate(_path, 'a', '\\.ts', 3);
	const a = basename(path);
	const tpl = `import awx8 from '@mmstudio/awx000008';

export default function ${a}(mm: awx8) {
	// todo
}
`;
	return writeFileSync(`${path}.ts`, tpl);
}

function create_s(_path: string) {
	const tpl = `export default {
	'mm-events-init': 'a001'
};
`;
	return writeFileSync(join(_path, 's.ts'), tpl);
}

function create_p(_path: string) {
	const tpl = `import init from '@mmstudio/wxapp/page';

import s from './s';

/// MM IMPACTIONS BEGIN
/// 请不要修改下面的代码哟(๑•ω•๑)
import a001 from './a001';
/// MM IMPACTIONS END

(() => {
	/// MM ACTIONS BEGIN
	/// 请不要修改下面的代码哟(๑•ω•๑)
	const actions = { a001 };
	/// MM ACTIONS END

	init(s, actions);
})();
`;
	return writeFileSync(join(_path, 'p.ts'), tpl);
}

function create_json(_path: string, name: string) {
	const tpl = '{}';
	return writeFileSync(join(_path, `${name}.json`), tpl);
}

function create_wxml(_path: string, name: string) {
	const tpl = `<!--pages/${name}.wxml-->
<text>pages/${name}.wxml</text>
`;
	return writeFileSync(join(_path, `${name}.wxml`), tpl);
}

function create_wxss(_path: string, name: string) {
	const tpl = `/* pages/${name}.wxss */`;
	return writeFileSync(join(_path, `${name}.wxss`), tpl);
}

async function updata_app_json(_folder: string, name: string) {
	const app_json_path = join(_folder, 'app.json');
	const txt = await readFileSync(app_json_path);
	const obj = JSON.parse(txt) as {
		pages: string[]
	};
	obj.pages.push(`pages/${name}/${name}`);
	const str = JSON.stringify(obj, null, '\t');
	return writeFileSync(app_json_path, str);
}
