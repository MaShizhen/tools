import { basename, dirname, join, sep } from 'path';
import { Disposable, FileType, TextEditor, Uri, window, workspace } from 'vscode';
import generate from './util/generate';
import Tools from './tools';

export default abstract class Base extends Tools {
	public abstract shellbuild(): void;
	public abstract shelldebug(): void;

	public abstract completion(): Disposable;

	public abstract addpage(): Promise<void>;
	public abstract addcomponent(editor: TextEditor): Promise<void>;
	public abstract addservice(): Promise<void>;
	public abstract addaction(editor: TextEditor): Promise<void>;
	public abstract addpresentation(editor: TextEditor): Promise<void>;

	public abstract addwebfilter(): Promise<void>;
	public abstract addwebrouter(): Promise<void>;

	protected async baseaddwebrouter(name: 'routers' | 'filters') {
		const rootPath = this.root();
		const config_path = join(rootPath, 'mm.json');
		const doc = await workspace.openTextDocument(Uri.file(config_path));
		const raw = doc.getText();
		const conf = JSON.parse(raw);
		const routers = (conf[name] || []) as Array<{
			method: 'get' | 'post' | 'all' | string;
			service: string;
			url: string;
			data: {}
		}>;
		const service = await this.get_all_service();
		if (!service) {
			return;
		}
		const method = await window.showQuickPick(['get', 'post', 'put', 'delete', 'all']);
		if (!method) {
			return;
		}
		const url = (() => {
			if (name === 'routers') {
				const rs = routers.map((r) => {
					return parseInt(r.url.replace(/[^\d]/g, ''), 10);
				}).filter((v) => {
					return v > 0;
				});
				if (rs.length === 0) {
					rs.push(0);
				}
				return this.prefix('/r', Math.max(...rs) + 1, 3);
			}
			return '/*';
		})();
		routers.push({
			data: {},
			method,
			service,
			url
		});
		conf[name] = routers;
		await this.writefileasync(config_path, JSON.stringify(conf, null, '\t'));
		await this.show_doc(config_path);
	}
	private async get_all_service(editor?: TextEditor) {
		const root_dir = this.root(editor);
		const src = join(root_dir, 'src');
		const ss = await this.get_all_s(src, src);
		return window.showQuickPick(ss, {
			...this.getdefaultpickoption(),
			placeHolder: '请选择服务'
		});
	}
	private async get_all_s(cwd: string, root: string): Promise<string[]> {
		const files = await workspace.fs.readDirectory(Uri.file(cwd));
		const ss = await Promise.all(files.map(async ([path, type]) => {
			const fullpath = join(cwd, path);
			if (type === FileType.Directory) {
				return this.get_all_s(fullpath, root);
			} else if (type === FileType.File) {
				if (/^s\d{3}\.ts/.test(path)) {
					return [fullpath.replace(`${root}${sep}`, '').replace(/\\/g, '/').replace(/\.ts/, '')];
				}
			}
			return [];
		}));
		return ss.reduce((pre, cur) => {
			return pre.concat(cur);
		}, []);
	}

	protected async baseaddservice() {
		const path = (() => {
			const editor = window.activeTextEditor;
			if (!editor) {
				const wfs = workspace.workspaceFolders;
				if (!wfs || wfs.length === 0) {
					throw new Error('Please make sure you have a project opend');
				}
				return join(wfs[0].uri.fsPath, 'src');
			}
			return editor.document.fileName;
		})();
		let folder = dirname(path);
		if (!folder.includes('src')) {
			folder = join(folder, 'src');
			await this.mkdirasync(folder);
		}
		const p_path = await generate(folder, 's', '\\.ts', 3);
		await this.create_s(p_path, p_path.replace(/.*src[/|\\]/, ''));
		await workspace.saveAll();
		this.show_doc(`${p_path}.ts`);
	}
	private create_s(path: string, dir: string) {
		const no = basename(path, '.ts');
		const tpl = `import an1 from '@mmstudio/an000001';
import an4 from '@mmstudio/an000004';

interface Message {
	// cookies: {
	// 	uk: string;
	// 	[key: string]: string
	// };
	// urls: {
	// 	base: string;
	// 	origin: string;
	// 	url: string;
	// };
	// query: {};
	// params: {};
	// headers: {};
	// captcha: string;
}

export default async function ${no}(msg: Message, actionid: string): Promise<an4> {
	an1(\`Service begin path:${dir},actionid:$\{actionid}\`);

	an1(\`Service end path:${dir},actionid:$\{actionid}\`);
	return {
		data: '"mm"'
	} as an4;
}
`;
		return this.writefileasync(`${path}.ts`, tpl);
	}
	protected async baseaddaction(editor: TextEditor) {
		const uri = editor.document.uri;
		const folder = dirname(uri.fsPath);
		const p_path = await generate(folder, 'a', '\\.ts', 3);
		const a = basename(p_path);
		const tpl = `
export default function ${a}() {
	// todo
}
`;
		await this.writefileasync(`${p_path}.ts`, tpl);
		window.showTextDocument(Uri.file(`${p_path}.ts`));
	}
}
