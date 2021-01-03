import { promises as fs, statSync } from 'fs';
import { dirname, isAbsolute, join, relative } from 'path';
import { exec as node_exec } from 'child_process';
import { homedir, platform } from 'os';
import { Stream } from 'stream';
import { get as base } from 'https';
import { commands, Position, QuickPickItem, SnippetString, TextEditor, Uri, window, workspace, WorkspaceEdit } from 'vscode';
import got from 'got';
import tar from 'tar';
import { NO_MODIFY } from './util/blocks';

type RepoInfo = {
	username?: string
	name: string
	branch?: string
}
export default abstract class Tools {
	//#region Http get
	protected get<T>(url: string) {
		return new Promise<T>((resolve, reject) => {
			const d = window.setStatusBarMessage('正在从网络获取列表');
			base(url, (res) => {
				const { statusCode } = res;
				const contentType = res.headers['content-type']!;

				let error;
				if (statusCode !== 200) {
					error = new Error('Request Failed.\n' +
						`Status Code: ${statusCode!}`);
				} else if (!contentType.startsWith('application/json')) {
					error = new Error('Invalid content-type.\n' +
						`Expected application/json but received ${contentType}`);
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
	protected async shellinstall(editor: TextEditor, atom: string, version: string) {
		if (!atom) {
			return;
		}
		if (!version || version === '*') {
			version = 'latest';
		}
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
		const pkg = JSON.parse(Buffer.from(await workspace.fs.readFile(filename)).toString('utf8')) as { peerDependencies: { [name: string]: string; } };
		const dep = pkg.peerDependencies;
		if (dep) {
			await Promise.all(Object.keys(dep).map(async (name) => {
				const ver = dep[name];
				await this.shellinstall(editor, name, ver);
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
	protected showerror(message: string) {
		void window.showErrorMessage(message);
	}
	protected pick<T extends QuickPickItem>(items: T[] | Thenable<T[]>, placeHolder = '') {
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
		const root = this.root();
		if (!isAbsolute(from)) {
			from = join(root, from);
		}
		if (!isAbsolute(to)) {
			to = join(root, to);
		}
		return relative(from, to);
	}
	//#endregion

	//#region File(name) operate
	protected prefix(pre: string, num: number, len: number) {
		return pre + num.toString().padStart(len, '0');
	}
	protected async generate(path: string, prefix: string, len: number) {
		const files = await this.readdir(path);
		const reg = new RegExp(`^${prefix}\\d*(\\.\\w+)?$`);
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
	//#endregion
}
