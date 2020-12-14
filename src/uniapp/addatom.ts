import { basename, dirname, join } from 'path';
import { commands, Uri, window, workspace } from 'vscode';
import { Package } from '../interfaces';
import Actor from '../actor';

export default class AddAtomUniapp extends Actor {
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

		const folder = container[0];
		const autono = await this.generate(folder.fsPath, 'au', '', 6);
		const no = await window.showInputBox({
			value: basename(autono),
			placeHolder: 'type project name'
		});
		if (!no) {
			return;
		}
		const remote = await window.showInputBox({
			value: `git@github.com:mm-atom/${no}.git`,
			ignoreFocusOut: true,
			placeHolder: '请提供一个可用的空git仓库地址',
			prompt: `示例:如: git@github.com:mm-works/${no}.git没有可跳过,没有可跳过`
		});
		const cwd = join(folder.fsPath, no);
		const uri = Uri.file(cwd);
		try {
			// 如果已经存在，则覆盖
			await workspace.fs.stat(uri);
			await workspace.fs.delete(uri);
		} catch (e) {
			// 目录不存在
		}
		window.showInformationMessage('正在初始化项目，请耐心等待');
		// 创建目录
		await workspace.fs.createDirectory(uri);
		// 进入目录并且拉取代码
		await this.shellexec('git init', cwd);
		// 从码云拉取代码模板
		await this.downloadandextractrepo(cwd, {
			name: 'atom-uniapp'
		});

		// package.json
		const pkg = await this.update_pkg(cwd, no, remote);
		// readme.md
		await this.update_readme(cwd, pkg.description);

		// amd.json
		await this.update_amd(cwd, no);

		await this.shellexec('git add .', cwd);
		await this.shellexec(`git commit -m "init atom ${no}"`, cwd);
		await this.shellexec('git branch -M main', cwd);

		// 推送代码到远程仓库
		if (remote) {
			await this.shellexec(`git remote add origin ${remote}`, cwd);
			await this.shellexec('git push -u origin main', cwd);
		}
		window.showInformationMessage('原子操作初始化已完成，即将安装必要依赖，请耐心等待，安装成功后即将自动重启vscode');
		await this.shellexec('yarn', cwd);
		await commands.executeCommand('vscode.openFolder', uri);
	}

	private async update_amd(folder: string, no: string) {
		const path = join(folder, 'amd.json');

		const content = `[
	{
		"name": "@mmstudio/${no}",
		"location": "@mmstudio/${no}/dist",
		"main": "main"
	}
]
`;
		await this.writefile(path, content);
	}

	private async update_readme(folder: string, description: string) {
		const path = join(folder, 'readme.md');
		await this.writefile(path, `# ${description}\n`);
	}

	private async update_pkg(folder: string, no: string, remote?: string) {
		const path = join(folder, 'package.json');
		const content = await this.readfile(path);
		const pkg = JSON.parse(content) as Package;
		pkg.name = `@mmstudio/${no}`;
		if (remote) {
			const repository = remote.replace(':', '/').replace('git@', 'https://');	// git@github.com:mm-atom/no.git to https://github.com/mm-atom/no.git
			pkg.repository.url = repository;
		}
		const author = pkg.author || {};
		const user = await this.shellexec('git config user.name');
		const email = await this.shellexec('git config user.email');
		author.name = user;
		author.email = email;
		const d = await window.showInputBox({
			prompt: '原子操作简要描述,请尽量控制在8个字以内',
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
