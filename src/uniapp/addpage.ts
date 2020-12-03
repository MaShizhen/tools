import { basename, join } from 'path';
import { Uri, window, workspace } from 'vscode';
import { existsasync, mkdirasync, readfileasync, writefileasync } from '../util/fs';
import generate from '../util/generate';

interface IPageConfig {
	pages: Array<{
		path: string;
		style: {
			navigationBarTitleText: string;
		}
	}>
}

export default async function addpageuniapp(rootPath: string) {
	const src = join(rootPath, 'src');
	const pagesjson = join(src, 'pages.json');
	if (!await existsasync(pagesjson)) {
		return false;
	}
	if (!await existsasync(pagesjson)) {
		return false;
	}
	const pagesconfigstr = await readfileasync(pagesjson);
	const pagesconfig = JSON.parse(pagesconfigstr.replace(/\/\/.*/g, '')) as IPageConfig;
	if (!pagesconfig.pages) {
		pagesconfig.pages = [];
	}
	const pages = join(src, 'pages');
	if (!await existsasync(pages)) {
		await mkdirasync(pages);
	}
	const p_path = await generate(pages, 'pg', '', 3);
	const name = basename(p_path);
	pagesconfig.pages.push({
		path: `pages/${name}/${name}`,
		style: {
			navigationBarTitleText: name
		}
	});
	if (!await existsasync(p_path)) {
		await mkdirasync(p_path);
	}
	const page = join(p_path, name);
	// create vue file
	const vue = `${page}.vue`;
	await create_page(vue);
	await writefileasync(pagesjson, JSON.stringify(pagesconfig, undefined, '\t'));
	await workspace.saveAll();
	window.setStatusBarMessage('成功添加页面文件');
	window.showTextDocument(Uri.file(vue));
	return true;
}

function create_page(path: string) {
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
	return writefileasync(path, tpl);
}
