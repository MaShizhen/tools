import { basename,join } from 'path';
import { commands, window } from 'vscode';
import Actor from '../actor';

export default class AddPageTaro extends Actor {
	public async do(d?: string): Promise<void> {
			const pages = join(this.root(), 'src', 'pages');
		const dir = await (async () => {
			const dir = await this.getcurpath(d, pages);
			if (!dir) {
				return pages;
			}
			if (!/pages/.test(dir)) {
				return pages;
			}
			return dir;
		})();
		const tmp = join(dir, await this.generate(dir, 'pg', 3));
		const pagedir = await window.showInputBox({
			prompt: 'type page path(without postfix)',
			placeHolder: 'page path',
			value: tmp
		});
		if (!pagedir) {
			return;
		}
		// create page file
		const name = basename(pagedir);
		await this.mkdir(pagedir);
		const path = await this.createts(pagedir, name);
		await this.createconfig(pagedir, name);
		await this.createcss(pagedir, name);
		await this.updateappconfig( this.getrelativepath(pages, join(pagedir , name)) );
		await this.save();
		this.set_status_bar_message('成功添加页面文件');
		await this.show_doc(path);
		await commands.executeCommand('mm.regeneratepages');
	}

	private async updateappconfig(path: string) {
		const root = this.root();
		const configfile = join(root, 'src', 'app.config.ts');
		const content = await this.readfile(configfile);
		const regarr = /pages:\s*\[([\s\S]*?)\]/.exec(content);
		if (!regarr) {
			this.showerror('Coult not get pages in src/app.config.ts');
			return;
		}
		const pagestext = regarr[1];
		const pages = pagestext.split(',').map((it) => {
			return it.trim();
		});
		const reg = new RegExp(`^(?<quote>'|")pages\\/${path}\\k<quote>$`);
		const page = pages.find((it) => {
			return reg.test(it);
		});
		if (page) {
			// already exists, skip.
			return;
		}
		pages.push(`'pages/${path}'`);
		const newcontent = content.replace(/(pages:\s*\[)[\s\S]*?(\])/, `$1\r\n\t\t${pages.join(',\r\n\t\t')}\r\n\t$2`);
		await this.writefile(configfile, newcontent);
	}

	private async createcss(dir: string, name: string) {
		const file = join(dir, `${name}.css`);
		const tpl = `
`;
		await this.writefile(file, tpl);
		return file;
	}

	private async createconfig(dir: string, name: string) {
		const file = join(dir, `${name}.config.ts`);
		const tpl = `import taro from '@tarojs/taro';

export default {
	navigationBarTitleText: 'mmstudio'
} as taro.PageConfig;
`;
		await this.writefile(file, tpl);
		return file;
	}

	private async createts(dir: string, name: string) {
		const file = join(dir, `${name}.tsx`);
		const tpl = `import React, { useState, useEffect } from 'react';
import { View, Text } from '@tarojs/components';
import * as Taro from '@tarojs/taro';
import './${name}.css';

export default function ${this.str2name(name)}() {
	return (
		<>
			<View>
				<Text>01factory</Text>
			</View>
		</>
	);
}
`;
		await this.writefile(file, tpl);
		return file;
	}
}
