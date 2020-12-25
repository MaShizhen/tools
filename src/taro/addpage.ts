import { join } from 'path';
import { window, workspace } from 'vscode';
import Actor from '../actor';

export default class AddPageTaro extends Actor {
	public async do(): Promise<void> {
		const root = this.root();
		const dir = join(root, 'src', 'pages');
		const name = await this.generate(dir, 'pg', 3);
		// create page file
		const pagedir = join(dir, name);
		await this.mkdir(pagedir);
		const path = await this.createts(pagedir, name);
		await this.createconfig(pagedir, name);
		await this.createcss(pagedir, name);
		await this.updateappconfig(root, name);
		await workspace.saveAll();
		this.set_status_bar_message('成功添加页面文件');
		this.show_doc(path);
	}

	private async updateappconfig(root: string, name: string) {
		const configfile = join(root, 'src', 'app.config.ts');
		const content = await this.readfile(configfile);
		const regarr = /pages:\s*\[([\s\S]*?)\]/.exec(content);
		if (!regarr) {
			window.showErrorMessage('Coult not get pages in src/app.config.ts');
			return;
		}
		const [, pagestext] = regarr;
		const pages = pagestext.split(',').map((it) => {
			return it.trim();
		});
		const reg = new RegExp(`^(?<quote>'|")pages\\/${name}\\/${name}\\k<quote>$`);
		const page = pages.find((it) => {
			return reg.test(it);
		});
		if (page) {
			// already exists, skip.
			return;
		}
		pages.push(`'pages/${name}/${name}'`);
		const newcontent = content.replace(/(pages:\s*\[)[\s\S]*?(\])/, `$1\r\n\t\t${pages.join(',\r\n\t\t')}\r\n\t$2`);
		await this.writefile(configfile, newcontent);
	}

	private async createcss(dir: string, name: string) {
		const file = join(dir, `${name}.scss`);
		const tpl = `
`;
		await this.writefile(file, tpl);
		return file;
	}

	private async createconfig(dir: string, name: string) {
		const file = join(dir, `${name}.config.ts`);
		const tpl = `export default {
	// navigationBarTitleText: ''
}
`;
		await this.writefile(file, tpl);
		return file;
	}

	private async createts(dir: string, name: string) {
		const file = join(dir, `${name}.tsx`);
		const tpl = `import React from 'react';
import { View, Text } from '@tarojs/components';
import { } from 'taro-ui';

// import 'taro-ui/dist/style/components/button.scss'; // 按需引入
import './${name}.scss';

export default function ${name}() {
	return (
		<>
			<View>
				<Text>mmstudio!</Text>
			</View>
		</>
	);
}
`;
		await this.writefile(file, tpl);
		return file;
	}
}
