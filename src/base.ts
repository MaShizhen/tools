import { dirname, join, relative, sep } from 'path';
import { Disposable, FileType, QuickPickItem, TextEditor, Uri, window, workspace } from 'vscode';
import Tools from './tools';
import { IAtom, IAtomCatagory } from './interfaces';
import AddAtomLocal from './mm/addatomlocal';

export default abstract class Base extends Tools {
	public abstract addwidgetlocal(): Promise<void>;
	public addatomlocal(): Promise<void> {
		return new AddAtomLocal().do();
	}
	public abstract addwidget(): Promise<void>;
	public abstract addatom(): Promise<void>;

	public abstract addtplwidget(editor: TextEditor): Promise<void>;
	public async addtplatom(editor: TextEditor) {
		const servertype = (() => {
			const doc = editor.document;
			const uri = doc.uri;
			const path = uri.path;
			// s001 na001 atom/anp001/index.ts
			if (/s\d+\.ts$/.test(path) || /atoms[/|\\]anp\d+[/|\\]index\.ts/.test(path)) {
				return 'nodejs-s';
			} else if (/na\d+\.ts$/.test(path)) {
				return 'nodejs-na';
			}
			return false;
		})();
		const catagories_remote = new Map<string, IAtom[]>();
		const all_remote = new Map<string, IAtom>();
		const remote_atoms = await (() => {
			if (servertype === 'nodejs-na') {
				return this.get<IAtomCatagory[]>('https://mmstudio.gitee.io/atom-nodejs/index-a.json');
			} else if (servertype === 'nodejs-s') {
				return this.get<IAtomCatagory[]>('https://mmstudio.gitee.io/atom-nodejs/index.json');
			}
			return this.getremoteatoms();
		})();
		remote_atoms.forEach((it) => {
			catagories_remote.set(it.catagory, it.atoms);
			it.atoms.forEach((atom) => {
				all_remote.set(atom.no, atom);
			});
		});
		const client = !servertype;
		const root_path = this.root(editor);

		const local_atoms = await (async (root, client) => {
			try {
				const atom_dir = join(root, 'src', 'atoms');
				const atoms_dirs = await workspace.fs.readDirectory(Uri.file(atom_dir));
				return atoms_dirs.filter(([ad, type]) => {
					if (type !== FileType.Directory) {
						return false;
					}
					return ad.startsWith(client ? 'ap' : 'anp');
				}).map(([p]) => {
					return {
						name: `项目级原子操作:${p}`,
						no: p,
						local: true
					} as IAtom;
				});
			} catch {
				return [];
			}
		})(root_path, client);

		const catagories = new Map<string, IAtom[]>();
		catagories.set('本地', local_atoms);
		catagories_remote.forEach((v, k) => {
			catagories.set(k, v);
		});
		const all = new Map<string, IAtom>();
		local_atoms.forEach((atom) => {
			all.set(atom.no, atom);
		});
		all_remote.forEach((v, k) => {
			all.set(k, v);
		});
		const selects = Array.from(catagories.keys()).map((catagory) => {
			const item: QuickPickItem = {
				label: catagory
			};
			return item;
		}).concat(Array.from(all.values()).map((atom) => {
			const item: QuickPickItem = {
				detail: atom.name,
				label: atom.no
			};
			return item;
		}));
		const picked = await this.pick(selects, '选择一个分类或直接输入原子操作编号并回车');
		if (!picked) {
			return;
		}
		const atom = await (async () => {
			const pick = all.get(picked.label);
			if (pick) {
				return pick;
			}
			const atoms = catagories.get(picked.label)!;
			const selected_atom = await this.pick(atoms.map((it) => {
				const item: QuickPickItem = {
					detail: it.name,
					label: it.no
				};
				return item;
			}), '选择一个原子操作编号并回车');
			if (!selected_atom) {
				return null;
			}
			return all.get(selected_atom.label);
		})();
		if (!atom) {
			return;
		}
		if (atom.local) {
			const dir = join(root_path, 'src', 'atoms', atom.no);
			const cur = dirname(editor.document.uri.fsPath);
			const imp_path = relative(cur, dir);
			const name = atom.no.replace(/(@.+\/)?([a-z]+)0+(\d+)/, '$2$3');
			const imp = `import ${name} from '${imp_path}/index';`;
			const snippet_use = Uri.file(join(dir, 'use.snippet'));

			try {
				await workspace.fs.stat(snippet_use);
			} catch (error) {
				window.showErrorMessage(`请先编辑'src/atom/${atom.no}/use.snippet'`);
				return;
			}
			const use = Buffer.from(await workspace.fs.readFile(snippet_use)).toString('utf8');

			await this.insetSnippet(editor, use, imp);
			return;
		}
		await this.shellinstall(editor, atom.no, atom.version, client);

		const name = atom.no.replace(/(@.+\/)?([a-z]+)0+(\d+)/, '$2$3');
		const imp = `import ${name} from '${atom.no}';`;
		const dir = join(root_path, 'node_modules', atom.no);
		const snippet_use = Uri.file(join(dir, 'use.snippet'));

		try {
			await workspace.fs.stat(snippet_use);
		} catch (error) {
			window.showErrorMessage('无法自动添加脚本，请联系供应商');
			return;
		}
		const use = Buffer.from(await workspace.fs.readFile(snippet_use)).toString('utf8');

		await this.insetSnippet(editor, use, imp);
	}
	protected abstract getremoteatoms(): Promise<IAtomCatagory[]>;

	public abstract refreshsitemap(): Promise<void>;

	public abstract shellcreate(cwd: string, no: string, desc: string): Promise<void>;
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

	protected async replacefile(path: string, src: Array<{ [Symbol.replace](src: string, rep: string): string; }>, rep: string[]) {
		const uri = Uri.file(path);
		const content = Buffer.from(await workspace.fs.readFile(uri)).toString('utf8');
		const result = src.reduce((pre, cur, i) => {
			return pre.replace(cur, rep[i]);
		}, content);
		if (content !== result) {
			await workspace.fs.writeFile(uri, Buffer.from(result, 'utf-8'));
		}
	}

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
		const picked = await this.pick(['get', 'post', 'put', 'delete', 'all'].map((it) => {
			return {
				label: it
			};
		}));
		if (!picked) {
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
			method: picked.label,
			service,
			url
		});
		conf[name] = routers;
		await this.writefile(config_path, JSON.stringify(conf, null, '\t'));
		await await this.show_doc(config_path);
	}
	private async get_all_service(editor?: TextEditor) {
		const root_dir = this.root(editor);
		const src = join(root_dir, 'src');
		const ss = await this.get_all_s(src, src);
		const picked = await this.pick(ss.map((it) => {
			return {
				label: it
			};
		}), '请选择服务');
		if (!picked) {
			return undefined;
		}
		return picked.label;
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
			await this.mkdir(folder);
		}
		const name = await this.generate(folder, 's', 3);
		const p_path = await this.create_s(folder, name);
		await workspace.saveAll();
		await this.show_doc(p_path);
	}
	private async create_s(folder: string, no: string) {
		const path = join(folder, `${no}.ts`);
		const dir = path.replace(/.*src[/|\\]/, '');
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
		await this.writefile(path, tpl);
		return path;
	}
	protected async baseaddaction(editor: TextEditor) {
		const uri = editor.document.uri;
		const folder = dirname(uri.fsPath);
		const a = await this.generate(folder, 'a', 3);
		const p_path = join(folder, `${a}.ts`);
		const tpl = `
export default function ${a}() {
	// todo
}
`;
		await this.writefile(p_path, tpl);
		window.showTextDocument(Uri.file(p_path));
	}
}
