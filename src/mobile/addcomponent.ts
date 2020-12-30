import { dirname, join } from 'path';
import { window } from 'vscode';
import getpagetype from './page/pagetype';
import Actor from '../actor';
import AddApp from './page/addapp';
import AddContainerInPage from './page/add-container-in-app';
import AddContainer from './page/add-container';
import AddPage from './page/addpage';

export default class AddComponentMobile extends Actor {
	public async do(): Promise<void> {
		const rootPath = this.root();
		const src = join(rootPath, 'src');
		if (!await this.exists(src)) {
			await this.mkdir(src);
		}
		// 1. 查看是否存在app/app.js
		if (await this.isapp(src)) {
			void window.showInformationMessage('该操作会在当前打开的页面中添加子页面');
			// 2. 当前是否位于app下
			const editor = window.activeTextEditor;
			if (!editor) {
				await window.showErrorMessage('请打开任一页面后操作');
				return;
			}
			const dir = dirname(editor.document.fileName);
			const app = join(dir, 'app.ts');	// is app
			if (await this.exists(app)) {
				const type = await getpagetype();
				if (!type) {
					return;	// 取消操作
				}
				if (type === 'page') {
					await new AddApp(dirname(dir)).do();
				} else {
					await new AddContainerInPage(dirname(dir), type).do();
				}
			} else {
				const p = join(dir, 'p.ts');
				if (await this.exists(p)) {
					// 3. 查看当前组件是否为容器页面
					if (await this.iscontainer(dir)) {
						// 3.1 是容器页面，在当前容器页面下添加页面（容器页面或普通页面）
						const type = await getpagetype();
						if (!type) {
							return;	// 取消操作
						}
						if (type === 'page') {
							await new AddPage(dir).do();
						} else {
							await new AddContainer(dir, type).do();
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
			await new AddApp(src).do();
		}
	}
	private async iscontainer(dir: string) {
		const p = join(dir, 'p.ts');
		if (!await this.exists(p)) {
			return false;
		}
		const content = await this.readfile(p);
		return /import\s+{\s+container\s+}\s+from\s+['"]@mmstudio\/mobile['"]/.test(content);
	}
	private async isapp(src: string) {
		const path = join(src, 'app', 'app.ts');
		return this.exists(path);
	}
}
