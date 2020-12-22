import { dirname, join } from 'path';
import { commands, Uri, window, workspace } from 'vscode';
import { Package } from '../interfaces';
import Actor from '../actor';
import TplWX from './tpl';

export default class AddWidgetWx extends Actor {
	private tpl = new TplWX();
	public async do(): Promise<void> {
		const def = dirname(this.workpath());
		const container = await window.showOpenDialog({
			defaultUri: Uri.file(def),
			canSelectFiles: false,
			canSelectFolders: true,
			canSelectMany: false
		});
		if (!container || container.length !== 1) {
			return;
		}

		const user = await this.shellexec('git config user.name');

		const folder = container[0];
		let no = await this.generate(folder.fsPath, 'wwx', 6);
		let cwd = join(folder.fsPath, no);
		const remote = await window.showInputBox({
			value: `git@github.com:mm-widgets/${no}.git`,
			ignoreFocusOut: true,
			placeHolder: `请提供一个可用的空git仓库地址,如: git@github.com:${user}/${no}.git`
		});
		if (!remote) {
			return;
		}
		const m = /\/(\w+\d+)(\.git)?$/.exec(remote);
		if (m) {
			no = m[1];
			cwd = join(folder.fsPath, no);
		}
		const uri = Uri.file(cwd);
		try {
			// 如果已经存在，则覆盖
			await workspace.fs.stat(uri);
			await workspace.fs.delete(uri);
		} catch (e) {
			// 目录不存在
		}
		// 创建目录
		await workspace.fs.createDirectory(uri);
		// 进入目录并且拉取代码
		await this.shellexec('git init', cwd);
		// 从码云拉取代码模板
		await this.shellexec('git pull git@github.com:mm-tpl/widgets-wxapp.git', cwd);

		// package.json
		const pkg = await this.update_pkg(cwd, no, user, remote);
		// readme.md
		await this.update_readme(cwd, pkg.description);

		// use.snippet
		await this.update_usage(cwd, no);
		// src/index.ts
		await this.update_ts(cwd, pkg.description);

		await this.shellexec(`git commit -am "init widget ${no}"`, cwd);
		// 推送代码到远程仓库
		await this.shellexec(`git remote add origin ${remote}`, cwd);
		await this.shellexec('git branch -M main', cwd);
		await this.shellexec('git push -u origin main', cwd);
		window.showInformationMessage('控件初始化已完成，即将安装必要依赖，请耐心等待，安装成功后即将自动重启vscode');
		await this.shellexec('yarn', cwd);
		await commands.executeCommand('vscode.openFolder', uri);
	}

	private async update_ts(folder: string, desc: string) {
		const content = this.tpl.widget(desc);
		const path = join(folder, 'src', 'index.ts');
		await this.writefile(path, content);
	}

	private async update_usage(folder: string, no: string) {
		const path = join(folder, 'use.snippet');
		const content = this.tpl.widgetusage(no, false);
		await this.writefile(path, content);
	}

	private async update_readme(folder: string, description: string) {
		const path = join(folder, 'readme.md');
		await this.writefile(path, `# ${description}\n`);
	}

	private async update_pkg(folder: string, no: string, user: string, remote: string) {
		const path = join(folder, 'package.json');
		const email = await this.shellexec('git config user.email');
		const content = await this.readfile(path);
		const pkg = JSON.parse(content) as Package;
		pkg.name = `@mmstudio/${no}`;
		pkg.scripts.up = 'git pull git@github.com:mm-tpl/widgets-wxapp.git master';
		const repository = remote.replace(':', '/').replace('git@', 'https://');	// git@github.com:mm-atom/no.git to https://github.com/mm-atom/no.git
		pkg.repository.url = repository;
		const author = pkg.author || {};
		author.name = user;
		author.email = email;
		const d = await window.showInputBox({
			prompt: '控件简要描述,请尽量控制在8个字以内',
			ignoreFocusOut: true,
			validateInput(v) {
				if (!v) {
					return '不能为空';
				}
				return null;
			}
		});
		if (d) {
			pkg.description = d;
		}
		await this.writefile(path, JSON.stringify(pkg, null, '\t'));
		return pkg;
	}
}
