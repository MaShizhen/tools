import { dirname, join } from 'path';
import { window } from 'vscode';
import addapp from './addapp';
import { existsasync, mkdirasync } from '../../util/fs';
import getpagetype from './pagetype';
import addcontainerinapp from './add-container-in-app';
import addcontainer from './add-container';
import addpage from './addpage';
import { isapp } from './isapp';
import iscontainer from './iscontainer';

export default async function addpagemobile(rootPath: string) {
	const src = join(rootPath, 'src');
	if (!await existsasync(src)) {
		await mkdirasync(src);
	}
	// 1. 查看是否存在app/app.js
	if (await isapp(src)) {
		window.showInformationMessage('该操作会在当前打开的页面中添加子页面');
		// 2. 当前是否位于app下
		const editor = window.activeTextEditor;
		if (!editor) {
			await window.showErrorMessage('请打开任一页面后操作');
			return;
		}
		const dir = dirname(editor.document.fileName);
		const app = join(dir, 'app.ts');	// is app
		if (await existsasync(app)) {
			const type = await getpagetype();
			if (!type) {
				return;	// 取消操作
			}
			if (type === 'page') {
				await addpage(dirname(dir));
			} else {
				await addcontainerinapp(dirname(dir), type);
			}
		} else {
			const p = join(dir, 'p.ts');
			if (await existsasync(p)) {
				// 3. 查看当前组件是否为容器页面
				if (await iscontainer(dir)) {
					// 3.1 是容器页面，在当前容器页面下添加页面（容器页面或普通页面）
					const type = await getpagetype();
					if (!type) {
						return;	// 取消操作
					}
					if (type === 'page') {
						await addpage(dir);
					} else {
						await addcontainer(dir, type);
					}
				} else {
					await window.showErrorMessage('请在app或容器页面中进行该操作');
				}
			} else {
				await window.showErrorMessage('请在任一页面文件中进行该操作');
			}
		}
	} else {
		// 3. 不存在，创建app
		await addapp(src);
	}
}
