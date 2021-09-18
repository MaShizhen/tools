import { basename, join } from 'path';
import { window } from 'vscode';
import Actor from '../actor';

export default class AddComponentTaro2 extends Actor {
	public async do(d?: string): Promise<void> {
		const dir = await this.getcurpath(d, join(this.root(), 'src', 'components'));
		if (!dir) {
			this.showerror('不能在当前页面插入组件');
			return;
		}
		const name = await this.generate(dir, 'c', 3);
		const f = await window.showInputBox({
			prompt: 'type path',
			placeHolder: 'component path',
			value: join(dir, name)
		});
		if (!f) {
			return;
		}
		const filepath = f.toLowerCase();
		const fullpath = `${filepath}.tsx`;
		const filename = basename(filepath);
		await this.createcss(`${filepath}.css`);
		const cname = this.str2name(filename);
		const tpl = `import React from 'react';
import { View } from '@tarojs/components';
import './${filename}.css';

export default function ${cname}() {
	return <View></View>;
}
`;
		await this.writefile(fullpath, tpl);
		this.set_status_bar_message('成功添加组件');
		await this.show_doc(fullpath);
	}
	
	private async createcss(file: string) {
		const tpl = `
`;
		await this.writefile(file, tpl);
	}
}
