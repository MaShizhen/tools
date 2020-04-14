import { basename, join } from 'path';
import { Uri, window } from 'vscode';
import { existsasync, mkdirasync, readfileasync, writefileasync } from '../../util/fs';
import generate from '../../util/generate';

export default async function addwxapppage(rootPath: string) {
	const src = join(rootPath, 'src');
	if (!await existsasync(src)) {
		await mkdirasync(src);
	}
	const p_path = await generate(src, 'pg', '', 3);
	// 创建页面逻辑层目录
	await create_a(p_path);		// 创建事件
	await create_s(p_path);		// 创建响应
	await create_p(p_path);		// 创建page

	// 创建页面原生目录

	const name = p_path.replace(/.*[/\\]/, '');

	await create_json(p_path, name);	// 创建page.json
	await create_wxml(p_path, name);	// 创建page.wxml
	await create_wxss(p_path, name);	// 创建page.wxss

	// 修改app.json和app-debug.json
	await updata_app_json(src, name);
	// updata_app_debug_json(folder, name);

	window.setStatusBarMessage('成功添加页面文件');
	window.showTextDocument(Uri.file(join(p_path, 'p.ts')));
}

function create_a(dir: string) {
	const path = join(dir, 'a001.ts');
	const a = basename(path, '.ts');
	const tpl = `import awx2 from '@mmstudio/awx000002';

export default function ${a}(mm: awx2) {
	// todo
}
`;
	return writefileasync(path, tpl);
}

function create_s(dir: string) {
	const tpl = `export default {
	'mm-events-init': 'a001'
};
`;
	return writefileasync(join(dir, 's.ts'), tpl);
}

function create_p(dir: string) {
	const tpl = `import { page } from '@mmstudio/wxapp';

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

	page(s, actions);
})();
`;
	return writefileasync(join(dir, 'p.ts'), tpl);
}

function create_json(dir: string, name: string) {
	const tpl = '{}';
	return writefileasync(join(dir, `${name}.json`), tpl);
}

function create_wxml(dir: string, name: string) {
	const tpl = `<!--pages/${name}.wxml-->
<text>pages/${name}.wxml</text>
`;
	return writefileasync(join(dir, `${name}.wxml`), tpl);
}

function create_wxss(dir: string, name: string) {
	const tpl = `/* pages/${name}.wxss */`;
	return writefileasync(join(dir, `${name}.wxss`), tpl);
}

async function updata_app_json(dir: string, name: string) {
	const app_json_path = join(dir, 'app.json');
	const txt = await readfileasync(app_json_path);
	const obj = JSON.parse(txt) as {
		pages: string[]
	};
	obj.pages.push(`pages/${name}/${name}`);
	const str = JSON.stringify(obj, null, '\t');
	return writefileasync(app_json_path, str);
}
