import { homedir } from 'os';
import { dirname, join } from 'path';
import { commands, FileType, Uri, window, workspace } from 'vscode';
import exec from '../../util/exec';
import prefix from '../../util/prefix';
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
pro_types.set(PrjType.web, 'tpl-web');
pro_types.set(PrjType.mobile, 'tpl-mobile');
pro_types.set(PrjType.wxapp, 'tpl-wxapp');

export default function create_project() {
	return commands.registerCommand('mm.shell.create', async () => {
		window.showInformationMessage('进行此操作之前,请确保git已安装并配置好权限,另外,你需要联系管理员为你分配统一的项目编号及spaceid');
		const def = (() => {
			const projs = workspace.workspaceFolders;
			if (projs && projs.length > 0) {
				return dirname(projs[0].uri.fsPath);
			}
			return homedir();

		})();
		const type = await window.showQuickPick([
			{
				alwaysShow: true,
				description: 'web/h5网站应用',
				label: 'web/h5'
			},
			{
				alwaysShow: true,
				description: '移动端app',
				label: 'mobile'
			},
			{
				alwaysShow: true,
				description: '微信小程序',
				label: 'wxapp'
			}
		], {
			placeHolder: '请选择项目端点类型'
		});
		if (!type) {
			return;
		}
		const t = await window.showInputBox({
			placeHolder: '请输入spaceid',
			validateInput(val) {
				if (!val.trim()) {
					return '不能为空';
				}
				return null;
			}
		});
		if (!t) {
			return;
		}
		const spaceid = t.trim();
		if (!spaceid) {
			return;
		}
		// type in mmjson and package.json
		const p = await window.showInputBox({
			placeHolder: '请输入项目类型,通常它跟端点类型一致',
			value: type.label,
			validateInput(val) {
				if (/\s/.test(val)) {
					return '不能为空且不能包含空格';
				}
				return null;
			}
		});
		if (!p) {
			return;
		}
		const desc = await window.showInputBox({
			placeHolder: '请用简单语言描述一下这个项目',
			validateInput(val) {
				if (/\s/.test(val)) {
					return '不能为空且不能包含空格';
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
		const proj_type = pro_types.get(type.label as PrjType);
		await exec(`git pull git@gitee.com:mmstudio/${proj_type}.git`, cwd);
		await exec(`git remote add origin ${remote}`, cwd);
		await replace_tpl(cwd, spaceid, p, desc);
		if (type.label.includes('mobile')) {
			await replace_mobile(join(cwd, 'android'), spaceid);
			await replace_mobile(join(cwd, 'ios'), spaceid);
			await replace(join(cwd, 'app.json'), [/webtest/g], [spaceid]);
			await replace(join(cwd, 'src', 'app', 'app.ts'), [/webtest/g], [spaceid]);
		}
		await exec('git add .', cwd);
		await exec('git commit -m "init project"', cwd);
		await exec('git push origin master:master', cwd);
		await exec('git branch --set-upstream-to=origin/master master', cwd);
		await commands.executeCommand('vscode.openFolder', uri);
	});
}

async function replace_mobile(cwd: string, spaceid: string) {
	const files = await workspace.fs.readDirectory(Uri.file(cwd));
	return Promise.all(files.map(async ([path, type]) => {
		const fullpath = join(cwd, path);
		const newpath = join(cwd, path.replace(/webtest/, spaceid));
		if (path.includes('webtest')) {
			await workspace.fs.rename(Uri.file(fullpath), Uri.file(newpath));
		}
		if (type === FileType.Directory) {
			await replace_mobile(newpath, spaceid);
		} else if (type === FileType.File) {
			await replace(newpath, [/webtest/g], [spaceid]);
		}
	}));
}

async function replace_tpl(cwd: string, spaceid: string, type: string, desc: string) {
	await replace(join(cwd, 'package.json'), [/webtest-(web|wxapp|mobile)/, /示例项目/], [`${spaceid}-${type}`, desc]);
	await replace(join(cwd, 'mm.json'), [/webtest/, /web|wxapp|mobile/], [spaceid, type]);
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
