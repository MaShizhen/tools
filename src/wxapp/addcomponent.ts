import { basename, join } from 'path';
import Actor from '../actor';

export default class AddComponentWeixin extends Actor {
	public async do(): Promise<void> {
		const rootPath = this.root();
		const src = join(rootPath, 'src');
		if (!await this.exists(src)) {
			await this.mkdir(src);
		}
		const no = await this.generate(src, 'pg', 3);
		const p_path = join(src, no);
		// 创建页面逻辑层目录
		await this.create_a(p_path);		// 创建事件
		await this.create_s(p_path);		// 创建响应
		await this.create_p(p_path);		// 创建page

		// 创建页面原生目录

		const name = p_path.replace(/.*[/\\]/, '');

		await this.create_json(p_path, name);	// 创建page.json
		await this.create_wxml(p_path, name);	// 创建page.wxml
		await this.create_wxss(p_path, name);	// 创建page.wxss

		// 修改app.json和app-debug.json
		await this.updata_app_json(src, name);
		// updata_app_debug_json(folder, name);

		this.set_status_bar_message('成功添加页面文件');
		this.show_doc(join(p_path, 'p.ts'));
	}

	private create_a(dir: string) {
		const path = join(dir, 'a001.ts');
		const a = basename(path, '.ts');
		const tpl = `import awx2 from '@mmstudio/awx000002';

export default function ${a}(mm: awx2) {
	// todo
}
`;
		return this.writefile(path, tpl);
	}

	private create_s(dir: string) {
		const tpl = `export default {
	'mm-events-init': 'a001'
};
`;
		return this.writefile(join(dir, 's.ts'), tpl);
	}

	private create_p(dir: string) {
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
		return this.writefile(join(dir, 'p.ts'), tpl);
	}

	private create_json(dir: string, name: string) {
		const tpl = '{}';
		return this.writefile(join(dir, `${name}.json`), tpl);
	}

	private create_wxml(dir: string, name: string) {
		const tpl = `<!--pages/${name}.wxml-->
<text>pages/${name}.wxml</text>
`;
		return this.writefile(join(dir, `${name}.wxml`), tpl);
	}

	private create_wxss(dir: string, name: string) {
		const tpl = `/* pages/${name}.wxss */`;
		return this.writefile(join(dir, `${name}.wxss`), tpl);
	}

	private async updata_app_json(dir: string, name: string) {
		const app_json_path = join(dir, 'app.json');
		const txt = await this.readfile(app_json_path);
		const obj = JSON.parse(txt) as {
			pages: string[]
		};
		obj.pages.push(`pages/${name}/${name}`);
		const str = JSON.stringify(obj, null, '\t');
		return this.writefile(app_json_path, str);
	}
}
