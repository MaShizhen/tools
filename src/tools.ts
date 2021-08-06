import { promises as fs, statSync } from 'fs';
import { basename, dirname, extname, isAbsolute, join, relative } from 'path';
import { exec as node_exec } from 'child_process';
import { homedir, platform } from 'os';
import { Stream } from 'stream';
import { get as base } from 'https';
import { commands, FileType, Position, QuickPickItem, SnippetString, TextEditor, Uri, window, workspace, WorkspaceEdit } from 'vscode';
import got from 'got';
import tar from 'tar';
import { NO_MODIFY } from './util/blocks';

type RepoInfo = {
	username?: string;
	name: string;
	branch?: string;
}
export default abstract class Tools {
	//#region Other
	/**
	 * 转换为第一个字母大写,后面为驼峰式
	 */
	protected str2name(str: string) {
		const [f, ...rest] = str;
		return f.toUpperCase() + this.str2camelcase(rest.join(''));
	}
	protected str2camelcase(str: string) {
		return str.toLowerCase().replace(/-(\w)/g, (_, $1) => {
			return ($1 as string).toUpperCase();
		});
	}
	protected sleep(timeout: number) {
		return new Promise<void>((res) => {
			setTimeout(() => {
				res();
			}, timeout);
		});
	}
	//#endregion
	//#region Http get
	protected gethtml(url: string) {
		return new Promise<string>((resolve, reject) => {
			base(url, (res) => {
				const { statusCode } = res;

				let error;
				if (statusCode !== 200) {
					error = new Error(`Request Failed.\nStatus Code: ${statusCode!}`);
				}
				if (error) {
					console.error(error.message);
					reject(error);
					// Consume response data to free up memory
					res.resume();
					return;
				}

				res.setEncoding('utf8');
				let rawData = '';
				res.on('data', (chunk) => { rawData += chunk; });
				res.on('error', (err) => {
					reject(err.message);
					console.error(err.message);
				});
				res.on('end', () => {
					resolve(rawData);
				});
			});
		});
	}
	protected get<T>(url: string) {
		return new Promise<T>((resolve, reject) => {
			const d = window.setStatusBarMessage('正在从网络获取列表');
			base(url, (res) => {
				const { statusCode } = res;
				const contentType = res.headers['content-type']!;

				let error;
				if (statusCode !== 200) {
					error = new Error(`Request Failed.\nStatus Code: ${statusCode!}`);
				} else if (!contentType.startsWith('application/json')) {
					error = new Error(`Invalid content-type.\n'Expected application/json but received ${contentType}`);
				}
				if (error) {
					console.error(error.message);
					reject(error);
					// Consume response data to free up memory
					res.resume();
					return;
				}

				res.setEncoding('utf8');
				let rawData = '';
				res.on('data', (chunk) => { rawData += chunk; });
				res.on('error', (err) => {
					reject(err.message);
					console.error(err.message);
					d.dispose();
				});
				res.on('end', () => {
					d.dispose();
					try {
						const parsedData = JSON.parse(rawData) as T;
						resolve(parsedData);
					} catch (e) {
						reject(e);
					}
				});
			});
		});
	}
	//#endregion

	//#region repo
	protected downloadandextractrepo(
		cwd: string,
		{ username = 'mm-tpl', name, branch = 'main' }: RepoInfo
	): Promise<void> {
		return new Promise<void>((res, rej) => {
			Stream.pipeline(
				got.stream(
					`https://codeload.github.com/${username}/${name}/tar.gz/${branch}`
				),
				tar.extract(
					{ cwd, strip: 1 },
					[`${name}-${branch}`]
				),
				(err) => {
					if (err) {
						rej(err);
					} else {
						res();
					}
				}
			);
		});
	}
	//#endregion

	//#region Shell
	protected async shellinstall(editor: TextEditor, atom: string) {
		if (!atom) {
			return;
		}
		const version = 'latest';
		const cwd = this.root(editor);
		const dir = join(cwd, 'node_modules', atom);
		if (await this.exists(dir)) {
			// keep old version
			return;
		}
		const package_name = `${atom}@${version}`;
		const msg_install = `正在安装依赖: ${package_name}`;
		const command = `yarn add ${package_name}`;
		const p = this.shellexec(command, cwd);
		window.setStatusBarMessage(msg_install, p);
		await p;
		const msg_installed = `成功安装: ${package_name}`;
		window.setStatusBarMessage(msg_installed);

		const filename = Uri.file(join(dir, 'package.json'));
		const pkg = JSON.parse(Buffer.from(await workspace.fs.readFile(filename)).toString('utf8')) as { peerDependencies: { [name: string]: string; }; };
		const dep = pkg.peerDependencies;
		if (dep) {
			await Promise.all(Object.keys(dep).map(async (name) => {
				await this.shellinstall(editor, name);
			}));
		}
	}

	protected workpath() {
		const editor = window.activeTextEditor;
		const wf = (() => {
			if (editor) {
				const w = workspace.getWorkspaceFolder(editor.document.uri);
				if (w) {
					return w;
				}
			}

			const wfs = workspace.workspaceFolders;
			if (!wfs || wfs.length === 0) {
				return null;
			}
			return wfs[0];
		})();
		if (!wf) {
			return homedir();
		}
		const dir = wf.uri.fsPath;
		return dir;
	}
	protected shellexec(cmd: string, cwd?: string) {
		const shell = (() => {
			const shell = workspace.getConfiguration('terminal.integrated.shell');
			switch (platform()) {
				case 'darwin':
					return shell.get<string>('osx');
				case 'win32':
					return shell.get<string>('windows');
				case 'linux':
				default:
					return shell.get<string>('linux');
			}
		})();
		return new Promise<string>((resolve, reject) => {
			// Fix "stdout maxBuffer exceeded" error
			// See https://github.com/DefinitelyTyped/DefinitelyTyped/pull/26545#issuecomment-402274021
			const maxBuffer = 1024 * 1024 * 1024; // Max = 1 MiB, default is 200 KiB

			const handler = window.setStatusBarMessage(`running ${cmd}`);

			node_exec(cmd, {
				cwd,
				encoding: 'utf8',
				maxBuffer,
				shell
			}, (error, stdout, stderr) => {
				handler.dispose();
				if (error === null) {
					resolve(stdout.trim());
				} else {
					reject(new Error(stderr.trim()));
				}
			});
		});
	}
	protected shellrun(command: string, name: string) {
		const named_ternimal = window.terminals.find((t) => {
			return t.name === name;
		});
		if (named_ternimal) {
			named_ternimal.dispose();
		}
		const terminal = window.createTerminal(name);
		terminal.show();
		terminal.sendText(command);
	}
	//#endregion
	//#region vs
	protected save() {
		return workspace.saveAll(false);
	}
	protected showerror(message: string) {
		void window.showErrorMessage(message);
	}
	protected pick<T extends QuickPickItem>(items: T[] | Promise<T[]>, placeHolder = '') {
		return window.showQuickPick(items, {
			placeHolder,
			matchOnDescription: true,
			matchOnDetail: true,
			canPickMany: false,
			ignoreFocusOut: true
		});
	}
	protected async insetSnippet(textEditor: TextEditor, use: string, imp: string) {
		const doc = textEditor.document;
		const max = doc.lineCount;
		let hasimport = false;
		let lastimport = -1;
		for (let i = 0; i < max; i++) {
			const line = doc.lineAt(i);
			const text = line.text;
			if (/^import\s+.+/.test(text)) {
				if (text === imp) {
					hasimport = true;
					break;
				} else {
					lastimport = i;
				}
			}
		}
		const imppos = new Position(lastimport + 1, 0);
		if (!hasimport) {
			const we = new WorkspaceEdit();
			const uri = doc.uri;
			we.insert(uri, imppos, `${imp}\n`);
			await workspace.applyEdit(we);
		}
		const active = textEditor.selection.active;
		// const pos = hasimport ? active : active.translate(1); we do not need translate here, active will auto tranlate after insert importing
		await textEditor.insertSnippet(new SnippetString(use), active, {
			undoStopAfter: true,
			undoStopBefore: true
		});
	}
	protected refreshexplorer() {
		return commands.executeCommand('workbench.files.action.refreshFilesExplorer');
	}
	protected set_status_bar_message(msg: string) {
		return window.setStatusBarMessage(msg);
	}
	protected show_doc(path: string) {
		return window.showTextDocument(Uri.file(path));
	}
	protected getrelativepath(from: string, to: string) {
		if (!isAbsolute(from)) {
			const root = this.root();
			from = join(root, from);
		}
		if (!isAbsolute(to)) {
			const root = this.root();
			to = join(root, to);
		}
		return relative(from, to).replace(/\\/g, '/');
	}
	//#endregion

	//#region File(name) operate
	protected async getallfiles(dir: string): Promise<string[]> {
		const subs = await workspace.fs.readDirectory(Uri.file(dir));
		const files = subs.filter(([_d, type]) => {
			return type === FileType.File;
		}).map(([d]) => {
			return join(dir, d);
		});
		const subdirs = subs.filter(([_d, type]) => {
			return type === FileType.Directory;
		}).map(([d]) => {
			return join(dir, d);
		});
		const ps = subdirs.map((d) => {
			return this.getallfiles(d);
		});
		const allsubdirfiles = await Promise.all(ps);
		return allsubdirfiles.reduce((pre, cur) => {
			return pre.concat(cur);
		}, files).sort((a, b) => {
			// return a - b;
			if (a > b) {
				return 1;
			}
			if (a < b) {
				return -1;
			}
			return 0;
		});
	}
	/**
	 * Read default export function doc
	 */
	protected async readdoc(path: string) {
		const content = await this.readfile(path);
		const ext = extname(path);
		const name = basename(path, ext);
		// a001 c001 s001
		if (/^a|c|s\d{3,}$/.test(name)) {
			const regexparr = /(?<=\/\*\*\s*\n)(\s*\*\s*(.*)\s*\n)(\s*\*.*\n)*(?=\s*\*\/\s*\n\s*export\s*default\s*)/.exec(content);
			if (!regexparr || !regexparr[2]) {
				// s001
				if (/^s\d{3,}$/.test(name)) {
					const regexparr = /(?<=\/\*\*\s*\n)(\s*\*\s*(.*)\s*\n)(\s*\*.*\n)*\s*\*\/\s*\n(?=(\s*const\s*handler\s*=)|(\s*handler\.))/.exec(content);
					if (!regexparr || !regexparr[2]) {
						return name;
					}
					return regexparr[2];
				}
				return name;
			}
			return regexparr[2];
		}
		// pg001 or [xxx]
		if (/^pg\d{3,}$/.test(name) || /^\[.+]$/.test(name)) {
			const regexparr = /(?<=\/\*\*\s*\n)(\s*\*\s*(.*)\s*\n)(\s*\*.*\n)*\s*\*\/\s*\n(?=\s*const\s*pg\d{3,}\s*)/.exec(content);
			if (!regexparr || !regexparr[2]) {
				return name;
			}
			return regexparr[2];
		}
		return name;
	}
	protected prefix(pre: string, num: number, len: number) {
		return pre + num.toString().padStart(len, '0');
	}
	protected async generate(path: string, prefix: string, len: number) {
		const files = await this.readdir(path);
		const reg = new RegExp(`^${prefix}\\d*(\\.\\w+)*$`);
		const l = prefix.length;
		const as = files.filter((f) => {
			return reg.test(f);
		}).map((f) => {
			return parseInt(f.substr(l), 10);
		});
		if (as.length === 0) {
			as.push(0);
		}
		const num = Math.max(...as) + 1;
		return prefix + num.toString().padStart(len, '0');
	}
	protected async replace(path: string, flag: string, str: string) {
		const content = await this.readfile(path);
		const eol = '\n';
		await this.writefile(path, content.replace(new RegExp(`(/// MM ${flag} BEGIN)[\\s\\S]*\\n(\\s*/// MM ${flag} END)`), `$1${eol}/// ${NO_MODIFY}${eol}${str}${eol}$2`));
	}
	protected reg_in_comment(path: string) {
		return /[/\\](src[/\\]\w[\w\d-]*[/\\](zj-\d{3,6}))[/\\]?/.exec(path);
	}
	protected root(editor?: TextEditor) {
		editor = editor || window.activeTextEditor;
		const wf = (() => {
			if (editor) {
				const w = workspace.getWorkspaceFolder(editor.document.uri);
				if (w) {
					return w;
				}
			}

			const wfs = workspace.workspaceFolders;
			if (!wfs || wfs.length === 0) {
				return null;
			}
			return wfs[0];
		})();
		if (!wf) {
			return '';
		}
		const dir = wf.uri.fsPath;
		// !!! we should not use async operation here
		// if (!this.existssync(join(dir, 'package.json'))) {
		// 	this.showerror('错误的目录');
		// 	throw new Error('错误的目录');
		// }
		return dir;
	}
	//#endregion
	// #region File Operation
	protected async writefile(path: string, data: string) {
		await this.mkdir(dirname(path));
		await fs.writeFile(path, data, 'utf-8');
	}

	protected existssync(path: string) {
		try {
			statSync(path);
			return true;
		} catch (error) {
			return false;
		}
	}

	protected async exists(path: string) {
		try {
			await fs.stat(path);
			return true;
		} catch (error) {
			return false;
		}
	}

	protected readdir(path: string) {
		return fs.readdir(path);
	}

	protected readfile(path: string) {
		return fs.readFile(path, 'utf-8');
	}
	protected mkdir(dir: string) {
		try {
			return fs.mkdir(dir, { recursive: true });
		} catch {
			return Promise.resolve();	// already exits
		}
	}
	protected async isfile(pathlike: string) {
		try {
			const stat = await fs.stat(pathlike);
			return stat.isFile();
		} catch (e) {
			return false;
		}
	}

	protected getdir(path: string) {
		return dirname(path);
	}

	protected async getfilepath(pathlike: string) {
		if (await this.isfile(pathlike)) {
			return dirname(pathlike);
		}
		return pathlike;
	}

	/**
	 * 获取路径
	 */
	protected async getcurpath(pathlike: string | undefined | null, defaultvalue: string) {
		if (pathlike) {
			return this.getfilepath(pathlike);
		}
		const editor = window.activeTextEditor;
		if (editor) {
			return dirname(editor.document.fileName);
		}
		return defaultvalue;
	}

	/**
	 * 获取文件路径,如果传入为目录,直接返回,如果传入为文件名,返回文件所在目录,如果未传,返回当前打开编辑器文件的路径
	 */
	protected async getdirorbypath(pathlike?: string) {
		if (pathlike) {
			return this.getfilepath(pathlike);
		}
		const editor = window.activeTextEditor;
		if (editor) {
			return dirname(editor.document.fileName);
		}
		const s = await window.showOpenDialog({
			canSelectMany: false,
			canSelectFiles: false,
			canSelectFolders: true
		});
		if (s && s.length > 0) {
			return s[0].fsPath;
		}
		return null;
	}
	//#endregion
}
