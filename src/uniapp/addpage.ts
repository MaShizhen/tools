import { basename, join } from 'path';
import { workspace } from 'vscode';
import Tools from '../tools';

interface IPageConfig {
	pages: Array<{
		path: string;
		style: {
			navigationBarTitleText: string;
		}
	}>
}

export default class AddPageUniapp extends Tools {
	public async addaction() {
		const rootPath = await this.root();
		const src = join(rootPath, 'src');
		const pagesjson = join(src, 'pages.json');
		const pagesconfigstr = await this.readfileasync(pagesjson);
		const pagesconfig = JSON.parse(pagesconfigstr.replace(/\/\/.*/g, '')) as IPageConfig;
		if (!pagesconfig.pages) {
			pagesconfig.pages = [];
		}
		const pages = join(src, 'pages');
		if (!await this.existsasync(pages)) {
			await this.mkdirasync(pages);
		}
		const p_path = await this.generate(pages, 'pg', '', 3);
		const name = basename(p_path);
		pagesconfig.pages.push({
			path: `pages/${name}/${name}`,
			style: {
				navigationBarTitleText: name
			}
		});
		if (!await this.existsasync(p_path)) {
			await this.mkdirasync(p_path);
		}
		const page = join(p_path, name);
		// create vue file
		const vue = `${page}.vue`;
		await this.create_page(vue);
		await this.writefileasync(pagesjson, JSON.stringify(pagesconfig, undefined, '\t'));
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
		return this.writefileasync(path, tpl);
	}
}
