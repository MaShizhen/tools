import { join } from 'path';
import { promises } from 'fs';
import { window } from 'vscode';
import exec from '../../util/exec';
import root from '../../util/root';
import { Package } from '../../interfaces';
import prefix from '../../util/prefix';
import tplatomusage from '../../util/tpl-atom-useage';

const { readFile, writeFile } = promises;

export default async function reno() {
	const cwd = await root();
	const pkg = await get_pkg(cwd);

	// 旧编号
	const old = pkg.name.replace(/[@a-zA-Z/0]/g, '');
	if (!old) {
		window.showErrorMessage('不是一个合法的原子操作项目');
		return;
	}
	// 重新设置编号
	const newno = await window.showInputBox({
		prompt: '请重新设置一个编号',
		validateInput(s) {
			if (!s) {
				return '编号不能为空';
			}
			if (/^\d+$/.test(s)) {
				if (old === s) {
					return '与原编号相同';
				}
				return null;
			}
			return '请输入数字';
		}
	});
	if (!newno) {
		return;
	}
	const no = prefix('aw', parseInt(newno, 10), 6);

	// package.json
	await update_pkg(cwd, pkg, no);

	// use.snippet
	await update_usage(cwd, pkg.description, no);

	await exec(`git commit -am "rename ${no} from ${old}"`, cwd);

	window.showInformationMessage('重命名已完成');
}

async function get_pkg(folder: string) {
	const path = join(folder, 'package.json');
	const content = await readFile(path, 'utf-8');
	return JSON.parse(content) as Package;
}

async function update_usage(folder: string, description: string, no: string) {
	const path = join(folder, 'use.snippet');
	const s = await window.showInputBox({
		value: '2',
		prompt: '请设置参数个数，该操作为初始操作，后期仍需要修改use.snippet和src/index.ts文件',
		validateInput(v) {
			try {
				const n = parseInt(v, 10);
				if (n >= 0) {
					return null;
				}
				return '参数个数不能小于0';
			} catch (error) {
				return '不能为空';
			}
		}
	});
	if (s) {
		const n = parseInt(s || '1', 10);
		const content = tplatomusage(description, no, n);
		await writeFile(path, content);
	}
}

async function update_pkg(folder: string, pkg: Package, no: string) {
	const path = join(folder, 'package.json');
	pkg.name = `@mmstudio/${no}`;
	await writeFile(path, JSON.stringify(pkg, null, '\t'));
}