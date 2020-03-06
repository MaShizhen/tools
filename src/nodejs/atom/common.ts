import { basename, join } from 'path';
import { promises } from 'fs';
import { commands, Uri, window, workspace } from 'vscode';
import workpath from '../../util/workpath';
import generate from '../../util/generate';
import exec from '../../util/exec';

const { readFile, writeFile } = promises;

export default async function common() {
	const def = workpath();
	const container = await window.showOpenDialog({
		defaultUri: Uri.file(def),
		canSelectFiles: false,
		canSelectFolders: true,
		canSelectMany: false
	});
	if (!container || container.length !== 1) {
		return;
	}

	const user = await exec('git config user.name');

	const folder = container[0];
	const cwd = await generate(folder.fsPath, 'an', '', 6);
	const no = basename(cwd);
	const remote = await window.showInputBox({
		placeHolder: `请提供一个可用的空git仓库地址,如: git@gitee.com/${user}/${no}.git`
	});
	const uri = Uri.file(cwd);
	try {
		// 如果已经存在，则覆盖
		await workspace.fs.stat(uri);
		await workspace.fs.delete(uri);
	} catch (e) {
		// 目录不存在
		console.error(e);
	}
	// 创建目录
	await workspace.fs.createDirectory(uri);
	// 进入目录并且拉取代码
	await exec('git init', cwd);
	// 从码云拉取代码模板
	await exec('git pull git@gitee.com:mm-edu/atom-nodejs.git', cwd);

	// package.json
	const pkg = await update_pkg(cwd, no, user);
	// readme.md
	await update_readme(cwd, pkg.description);

	// use.snippet
	const n = await update_usage(cwd, pkg.description, no);
	// src/index.ts
	if (n > 0) {
		await update_ts(cwd, no, n);
	}
	await exec(`git commit -am "init atom ${no}"`, cwd);
	// 推送代码到远程仓库
	if (remote) {
		await exec(`git remote add origin ${remote}`, cwd);
		await exec('git push -u origin master', cwd);
	}
	await commands.executeCommand('vscode.openFolder', uri);
}

async function update_ts(folder: string, no: string, n: number) {
	const path = join(folder, 'src', 'index.ts');
	const arr = new Array<number>(n).fill(0).map((_it, i) => {
		return i + 1;
	});
	const ps = arr.map((i) => {
		return `param${i}: string`;
	});
	const content = `
export default function ${no.replace(/0/g, '')}(${ps.join(', ')}) {
}
`;
	await writeFile(path, content);
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
		const arr = new Array<number>(n).fill(0).map((_it, i) => {
			return i + 1;
		});
		const params = arr.map((i) => {
			return `\t\tconst param${i} = $${i};	// todo add param description`;
		});
		const ps = arr.map((i) => {
			return `param${i}`;
		});
		const t1 = `\t// ${description}`;
		const t2 = '\tconst r$CURRENT_SECONDS_UNIX = await(() => {';
		const t3 = `\t\treturn ${no.replace(/0/g, '')}(${ps.join(', ')})`;
		const t4 = '\t})();';
		const content = [t1, t2, ...params, t3, t4].join('\n');
		await writeFile(path, content);
		return n;
	}
	return 0;
}

async function update_readme(folder: string, description: string) {
	const path = join(folder, 'readme.md');
	const d = await window.showInputBox({
		value: description,
		prompt: '原子操作描述，可以详细一些，后期请修改readme.md文件',
		validateInput(v) {
			if (!v) {
				return '不能为空';
			}
			return null;
		}
	});
	if (d) {
		await writeFile(path, `# ${d}`);
	}
}

async function update_pkg(folder: string, no: string, user: string) {
	const path = join(folder, 'package.json');
	const email = await exec('git config user.email');
	const content = await readFile(path, 'utf-8');
	const pkg = JSON.parse(content) as Package;
	pkg.name = `@mmstudio/${no}`;
	const author = pkg.author || {};
	const u = await window.showInputBox({
		value: user,
		prompt: '用户名',
		validateInput(v) {
			if (!v) {
				return '不能为空';
			}
			return null;
		}
	});
	if (u) {
		author.name = u;
	}
	const e = await window.showInputBox({
		value: email,
		prompt: '用户邮箱',
		validateInput(v) {
			if (!v) {
				return '不能为空';
			}
			return null;
		}
	});
	if (e) {
		author.email = e;
	}
	const d = await window.showInputBox({
		value: pkg.description,
		prompt: '原子操作简要描述,请尽量控制在8个字以内',
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
	await writeFile(path, JSON.stringify(pkg, null, '\t'));
	return pkg;
}

interface Dependence {
	[key: string]: string;
}

interface User {
	'name': string;
	'email': string;
}

interface Package {
	name: string;
	version: string;
	description: string;
	scripts: {
		test: string;
		watch: string;
		clean: string;
		lint: string;
		compile: string;
		build: string;
		up: string;
	};
	repository: {
		type: string;
		url: string;
	};
	main: string;
	keywords: string[];
	author: User,
	maintainers: User[];
	license: string;
	dependencies: Dependence;
	devDependencies: Dependence;
}
