import { promises as fs, statSync } from 'fs';
import { dirname, join } from 'path';
import { exec as node_exec } from 'child_process';
import { homedir, platform } from 'os';
import { Stream } from 'stream';
import { commands, TextEditor, Uri, window, workspace } from 'vscode';
import got from 'got';
import tar from 'tar';
import { NO_MODIFY } from './util/blocks';

type RepoInfo = {
	username?: string
	name: string
	branch?: string
}
export default abstract class Tools {
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
	protected refreshexplorer() {
		return commands.executeCommand('workbench.files.action.refreshFilesExplorer');
	}
	protected set_status_bar_message(msg: string) {
		return window.setStatusBarMessage(msg);
	}
	protected show_doc(path: string) {
		return window.showTextDocument(Uri.file(path));
	}
	protected getdefaultpickoption() {
		return {
			matchOnDescription: true,
			matchOnDetail: true,
			canPickMany: false,
			ignoreFocusOut: true
		};
	}
	//#endregion

	//#region File(name) operate
	protected prefix(pre: string, num: number, len: number) {
		return pre + num.toString().padStart(len, '0');
	}
	protected async generate(path: string, prefix: string, postfix: string, len: number) {
		const files = await this.readdirasync(path);
		const reg = new RegExp(`^${prefix}\\d{${len}}${postfix}$`);
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
		const new_file = prefix + num.toString().padStart(len, '0');
		return join(path, new_file);
	}
	protected async replace(path: string, flag: string, str: string) {
		const content = await this.readfileasync(path);
		const eol = '\n';
		await this.writefileasync(path, content.replace(new RegExp(`(/// MM ${flag} BEGIN)[\\s\\S]*\\n(\\s*/// MM ${flag} END)`), `$1${eol}/// ${NO_MODIFY}${eol}${str}${eol}$2`));
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
			window.showErrorMessage('请打开工程进行操作');
			throw new Error('请打开工程进行操作');
		}
		const dir = wf.uri.fsPath;
		// !!! we should not use async operation here
		if (!this.exists(join(dir, 'package.json'))) {
			window.showErrorMessage('错误的目录');
			throw new Error('错误的目录');
		}
		return dir;
	}
	//#endregion
	// #region File Operation
	protected async writefileasync(path: string, data: string) {
		await this.mkdirasync(dirname(path));
		await fs.writeFile(path, data, 'utf-8');
	}

	protected exists(path: string) {
		try {
			statSync(path);
			return true;
		} catch (error) {
			return false;
		}
	}

	protected async existsasync(path: string) {
		try {
			await fs.stat(path);
			return true;
		} catch (error) {
			return false;
		}
	}

	protected readdirasync(path: string) {
		return fs.readdir(path);
	}

	protected readfileasync(path: string) {
		return fs.readFile(path, 'utf-8');
	}
	protected mkdirasync(dir: string) {
		try {
			return fs.mkdir(dir, { recursive: true });
		} catch {
			return Promise.resolve();	// already exits
		}
	}
	//#endregion
}
