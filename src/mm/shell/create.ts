import { dirname, join } from 'path';
import { commands, FileType, Uri, window, workspace } from 'vscode';
import exec from '../../util/exec';
import prefix from '../../util/prefix';
import workpath from '../../util/workpath';
import { PrjType } from '../../util/prj-type';

async function exists(uri: Uri) {
	try {
		await workspace.fs.stat(uri);
		return true;
	} catch (error) {
		return false;
	}
}

const pro_types = new Map<PrjType, string>();
pro_types.set(PrjType.web, 'web');
pro_types.set(PrjType.mobile, 'mobile');
pro_types.set(PrjType.wxapp, 'wxapp');

export default function create_project() {
	return commands.registerCommand('mm.shell.create', async () => {
		window.showInformationMessage('进行此操作之前,请确保git已安装并配置好权限,且有一个可用的没有任何提交的git仓库');
		const def = dirname(await workpath());
		const picked = await window.showQuickPick([
			{
				description: '1.web/h5网站应用',
				label: 'web/h5',
				type: PrjType.web
			},
			{
				description: '2.移动端app',
				label: 'mobile',
				type: PrjType.mobile
			},
			{
				description: '3.微信小程序',
				label: 'wxapp',
				type: PrjType.wxapp
			},
			{
				description: '4.桌面应用程序',
				label: 'desktop',
				type: PrjType.desktop
			}
		], {
			placeHolder: '请选择项目端点类型',
			matchOnDescription: true,
			matchOnDetail: true
		});
		if (!picked) {
			return;
		}
		const desc = await window.showInputBox({
			placeHolder: '请用简单语言描述一下这个项目',
			validateInput(val) {
				if (!val) {
					return '不能为空';
				}
				return null;
			}
		});
		if (!desc) {
			return;
		}
		const num = await window.showInputBox({
			placeHolder: '请输入项目编号',
			validateInput(val) {
				if (!/^\d{1,6}$/.test(val)) {
					return '项目编号必须为一个小于六位数的数字';
				}
				return null;
			}
		});
		if (!num) {
			return;
		}
		const no = prefix('p', parseInt(num, 10), 6);
		const uri = await window.showSaveDialog({
			defaultUri: Uri.file(join(def, no))
		});
		if (!uri) {
			return;
		}
		if (await exists(uri)) {
			window.showErrorMessage('路径非空');
			return;
		}
		const remote = await window.showInputBox({
			placeHolder: `git@gitee.com:mm-works/${no}.git`,
			validateInput(val) {
				if (!val) {
					return '请输入Git远程仓库地址';
				}
				return null;
			}
		});
		await workspace.fs.createDirectory(uri);
		const cwd = uri.fsPath;
		await exec('git init', cwd);
		const proj_type = pro_types.get(picked.type);
		await exec(`git pull git@github.com:mm-tpl/${proj_type}.git`, cwd);
		await exec(`git remote add origin ${remote}`, cwd);
		await replace(join(cwd, 'package.json'), [/prj000001/g], [no]);
		if (picked.label.includes('mobile')) {
			await replace_mobile(join(cwd, 'android'), no);
			await replace_mobile(join(cwd, 'ios'), no);
			await replace(join(cwd, 'app.json'), [/prj000001/g], [no]);
			await replace(join(cwd, 'src', 'app', 'app.ts'), [/prj000001/g], [no]);
		}
		await exec('git add .', cwd);
		await exec('git commit -m "init project"', cwd);
		await exec('git push origin master:master', cwd);
		await exec('git branch --set-upstream-to=origin/master master', cwd);
		await commands.executeCommand('vscode.openFolder', uri);
	});
}

async function replace_mobile(cwd: string, no: string) {
	const files = await workspace.fs.readDirectory(Uri.file(cwd));
	return Promise.all(files.map(async ([path, type]) => {
		const fullpath = join(cwd, path);
		const newpath = join(cwd, path.replace(/webtest/, no));
		if (path.includes('webtest')) {
			await workspace.fs.rename(Uri.file(fullpath), Uri.file(newpath));
		}
		if (type === FileType.Directory) {
			await replace_mobile(newpath, no);
		} else if (type === FileType.File) {
			await replace(newpath, [/webtest/g], [no]);
		}
	}));
}

async function replace(path: string, src: Array<{ [Symbol.replace](src: string, rep: string): string; }>, rep: string[]) {
	const uri = Uri.file(path);
	const content = Buffer.from(await workspace.fs.readFile(uri)).toString('utf8');
	const result = src.reduce((pre, cur, i) => {
		return pre.replace(cur, rep[i]);
	}, content);
	if (content !== result) {
		await workspace.fs.writeFile(uri, Buffer.from(result, 'utf-8'));
	}
}
