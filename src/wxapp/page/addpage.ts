import { basename, join } from 'path';
import { Uri, window, workspace, WorkspaceEdit } from 'vscode';
import { createfile, readFileSync, writeFileSync } from '../../util/fs';
import generate from '../../util/generate';

export default async function addwxapppage(rootPath: string) {
	const folder = join(rootPath, 'src');

	const p_path = await generate(folder, 'pg', '', 3);
	const we = new WorkspaceEdit();
	// 创建页面逻辑层目录
	create_a(we, p_path);		// 创建事件
	create_s(we, p_path);		// 创建响应
	create_p(we, p_path);		// 创建page

	// 创建页面原生目录

	const name = p_path.replace(/.*[/\\]/, '');

	create_json(we, p_path, name);	// 创建page.json
	create_wxml(we, p_path, name);	// 创建page.wxml
	create_wxss(we, p_path, name);	// 创建page.wxss

	await workspace.applyEdit(we);
	await workspace.saveAll();

	// 修改app.json和app-debug.json
	await updata_app_json(folder, name);
	// updata_app_debug_json(folder, name);

	window.setStatusBarMessage('成功添加页面文件');
	window.showTextDocument(Uri.file(join(p_path, 'p.ts')));
}

function create_a(we: WorkspaceEdit, dir: string) {
	const path = join(dir, 'a001.ts');
	const a = basename(path, '.ts');
	const tpl = `import awx2 from '@mmstudio/awx000002';

export default function ${a}(mm: awx2) {
	// todo
}
`;
	return createfile(we, path, tpl);
}

function create_s(we: WorkspaceEdit, dir: string) {
	const tpl = `export default {
	'mm-events-init': 'a001'
};
`;
	return createfile(we, join(dir, 's.ts'), tpl);
}

function create_p(we: WorkspaceEdit, dir: string) {
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
	return createfile(we, join(dir, 'p.ts'), tpl);
}

function create_json(we: WorkspaceEdit, dir: string, name: string) {
	const tpl = '{}';
	return createfile(we, join(dir, `${name}.json`), tpl);
}

function create_wxml(we: WorkspaceEdit, dir: string, name: string) {
	const tpl = `<!--pages/${name}.wxml-->
<text>pages/${name}.wxml</text>
`;
	return createfile(we, join(dir, `${name}.wxml`), tpl);
}

function create_wxss(we: WorkspaceEdit, dir: string, name: string) {
	const tpl = `/* pages/${name}.wxss */`;
	return createfile(we, join(dir, `${name}.wxss`), tpl);
}

async function updata_app_json(dir: string, name: string) {
	const app_json_path = join(dir, 'app.json');
	const txt = await readFileSync(app_json_path);
	const obj = JSON.parse(txt) as {
		pages: string[]
	};
	obj.pages.push(`pages/${name}/${name}`);
	const str = JSON.stringify(obj, null, '\t');
	return writeFileSync(app_json_path, str);
}
