import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import { commands, TextEditor, Uri, window, workspace } from 'vscode';
import { NO_MODIFY } from './util/blocks';

export default abstract class Tools {
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
	//#endregion

	//#region File(name) operate
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
	protected async root(editor?: TextEditor) {
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
		if (!await this.existsasync(join(dir, 'package.json'))) {
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
