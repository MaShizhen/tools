import { join } from 'path';
import { workspace } from 'vscode';
import Actor from '../actor';

interface IPageConfig {
	pages: Array<{
		path: string;
		style: {
			navigationBarTitleText: string;
		}
	}>
}

export default class AddPageUniapp extends Actor {
	public async do(): Promise<void> {
		const rootPath = this.root();
		const src = join(rootPath, 'src');
		const pagesjson = join(src, 'pages.json');
		const pagesconfigstr = await this.readfile(pagesjson);
		const pagesconfig = JSON.parse(pagesconfigstr.replace(/\/\/.*/g, '')) as IPageConfig;
		if (!pagesconfig.pages) {
			pagesconfig.pages = [];
		}
		const pages = join(src, 'pages');
		if (!await this.exists(pages)) {
			await this.mkdir(pages);
		}
		const name = await this.generate(pages, 'pg', 3);
		const p_path = join(pages, name);
		pagesconfig.pages.push({
			path: `pages/${name}/${name}`,
			style: {
				navigationBarTitleText: name
			}
		});
		if (!await this.exists(p_path)) {
			await this.mkdir(p_path);
		}
		const page = join(p_path, name);
		// create vue file
		const vue = `${page}.vue`;
		await this.create_page(vue);
		await this.writefile(pagesjson, JSON.stringify(pagesconfig, undefined, '\t'));
		await workspace.saveAll();
		this.set_status_bar_message('成功添加页面文件');
		this.show_doc(vue);
	}

	private create_page(path: string) {
		const tpl = `<template>
	<view></view>
</template>
<script lang="ts">
import vue from 'vue';

export default vue.extend({
	data() {
		return {};
	}
});
</script>
<style lang="css"></style>
`;
		return this.writefile(path, tpl);
	}
}
