import { basename, dirname, join, relative } from 'path';
import { CompletionItem, CompletionItemKind, Disposable, FileType, languages, Position, QuickPickItem, SnippetString, TextDocument, TextEditor, Uri, window, workspace } from 'vscode';
import Base from './base';
import { IAtom, IAtomCatagory } from './interfaces';
import get from './util/get';
import AddActionWeixinPage from './wxapp/addaction/page';
import AddComponentWeixin from './wxapp/addcomponent';

interface Link {
	name: string;
	addr: string;
}

interface Section extends Link {
	sub: Link[];
}

export default class WeiXin extends Base {
	private remotewidgets = [] as IAtomCatagory[];
	public async addtplwidget(editor: TextEditor): Promise<void> {
		if (!this.remotewidgets) {
			this.remotewidgets = await get<IAtomCatagory[]>('https://mmstudio.gitee.io/widgets-wxapp/index.json');
		}
		const atoms = this.remotewidgets;
		const all = new Map<string, IAtom>();
		const catagories = new Map<string, IAtom[]>();
		atoms.forEach((it) => {
			catagories.set(it.catagory, it.atoms);
			it.atoms.forEach((atom) => {
				all.set(atom.no, atom);
			});
		});
		await this.insert_widget_snippet(editor, all, catagories);
	}
	private async insert_widget_snippet(editor: TextEditor, all_remote: Map<string, IAtom>, catagories_remote: Map<string, IAtom[]>) {
		const root_path = this.root(editor);
		const local_atoms = await this.load_local(root_path);
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

		const pickoption = this.getdefaultpickoption();
		const picked = await window.showQuickPick(selects, {
			...pickoption,
			placeHolder: '选择一个分类或直接输入控件编号并回车'
		});
		if (!picked) {
			return;
		}
		const pick = all.get(picked.label);

		if (pick) {
			await this.add_snippet(pick, editor);
			return;
		}
		const atoms = catagories.get(picked.label)!;
		const selected_atom = await window.showQuickPick(atoms.map((it) => {
			const item: QuickPickItem = {
				detail: it.name,
				label: it.no
			};
			return item;
		}), {
			...pickoption,
			placeHolder: '选择一个控件编号并回车'
		});
		if (!selected_atom) {
			return;
		}
		await this.add_snippet(all.get(selected_atom.label)!, editor);
	}

	private async load_local(root: string) {
		try {
			const atom_dir = join(root, 'src', 'widgets');
			const atoms_dirs = await workspace.fs.readDirectory(Uri.file(atom_dir));
			return atoms_dirs.filter(([ad, type]) => {
				if (type !== FileType.Directory) {
					return false;
				}
				return ad.startsWith('pw');
			}).map(([p]) => {
				return {
					name: `项目级控件:${p}`,
					no: p,
					local: true
				} as IAtom;
			});
		} catch {
			return [];
		}
	}

	private async add_snippet(atom: IAtom, editor: TextEditor) {
		if (atom.local) {
			await this.add_local(atom, editor);
			return;
		}
		await this.shellinstall(editor, atom.no, atom.version, true);
		const root_dir = this.root(editor);
		const dir = join(root_dir, 'node_modules', atom.no);
		// update components config
		const pkg = JSON.parse(await this.readfileasync(join(dir, 'package.json'))) as { main?: string; miniprogram?: string; };
		const file_path = this.get_config_file_path(editor);
		const conf = await this.get_config(file_path);
		const uc = conf.usingComponents || {};
		const main = pkg.main ? pkg.main.replace('.js', '') : '';
		const path = join(atom.no, main ? main : (pkg.miniprogram ? join(pkg.miniprogram, 'index') : ''));
		// const main = join(atom.no, pkg.miniprogram ? pkg.miniprogram : '', 'index');	
		uc[atom.no.replace(/(.+\/)?/, '')] = path;
		conf.usingComponents = uc;
		await this.writefileasync(file_path, JSON.stringify(conf, null, '\t'));

		// insert template
		const snippet_use = join(dir, 'use.snippet');
		const use = await this.readfileasync(snippet_use);

		await editor.insertSnippet(new SnippetString(use), editor.selection.active, {
			undoStopAfter: true,
			undoStopBefore: true
		});
		await workspace.saveAll();
	}

	private async get_config(file_path: string) {
		return JSON.parse(await this.readfileasync(file_path)) as { usingComponents: { [key: string]: string; }; };
	}

	private get_config_file_path(editor: TextEditor) {
		const path = dirname(editor.document.uri.fsPath);
		if (path.includes('widgets')) {
			return join(path, 'index.json');
		}
		const name = basename(path);
		return join(path, `${name}.json`);
	}

	private async add_local(atom: IAtom, editor: TextEditor) {
		const doc = editor.document;
		const dir = join(this.root(editor), 'src', 'widgets', atom.no);
		const cur = dirname(doc.uri.fsPath);
		const widget_path = join(relative(cur, dir), 'index');

		// update components config
		const file_path = this.get_config_file_path(editor);
		const conf = await this.get_config(file_path);
		const uc = conf.usingComponents || {};
		uc[atom.no] = widget_path;
		conf.usingComponents = uc;
		await this.writefileasync(file_path, JSON.stringify(conf, null, '\t'));
		// insert template
		const snippet_use = join(dir, 'use.snippet');
		const use = await this.readfileasync(snippet_use);
		await editor.insertSnippet(new SnippetString(use), editor.selection.active, {
			undoStopAfter: true,
			undoStopBefore: true
		});
		await workspace.saveAll();
	}


	private remoteatoms = [] as IAtomCatagory[];
	protected async getremoteatoms(): Promise<IAtomCatagory[]> {
		if (!this.remoteatoms) {
			this.remoteatoms = await get<IAtomCatagory[]>('https://mmstudio.gitee.io/atom-wxapp/index.json');
		}
		return this.remoteatoms;
	}
	public async refreshsitemap(): Promise<void> {
		const rt = this.root();
		const mdfile = join(rt, '.mm.md');
		const map = await this.md2map(mdfile);
		const src = join(rt, 'src');
		const all = await this.readdirasync(src);
		const atoms1 = { name: '项目自定义服务端原子操作', addr: '#项目自定义服务端原子操作', sub: [] } as Section;
		const atoms2 = { name: '项目自定义客户端原子操作', addr: '#项目自定义客户端原子操作', sub: [] } as Section;
		const widgets = { name: '项目自定义控件', addr: '#项目自定义控件', sub: [] } as Section;
		const pages = { name: '项目页面', addr: '#项目页面', sub: [] } as Section;
		function add(rs: Link[], name: string, l: string) {
			const addr = relative(rt, l);
			const nm = map.get(addr);
			rs.push({
				addr,
				name: nm ? nm : name
			});
			return rs;
		}
		await Promise.all(all.map(async (dir) => {
			const d = join(src, dir);
			if (dir.endsWith('widgets')) {
				const subs = await this.readdirasync(d);
				widgets.sub = subs.reduce((pre, it) => {
					const m = /pw(\d{3})/.exec(it);
					if (m) {
						add(pre, `mm-p${m[1]}`, join(d, it, 'index.ts'));
					}
					// mm-p001
					return pre;
				}, [] as Link[]);
			} else if (dir.endsWith('atoms')) {
				const subs = await this.readdirasync(d);
				subs.forEach((it) => {
					if (it.startsWith('anp')) {
						add(atoms1.sub, it, join(d, it, 'index.ts'));
					} else if (it.startsWith('ap')) {
						add(atoms2.sub, it, join(d, it, 'index.ts'));
					}
				});
			} else if (/pg\d{3}/.test(dir)) {
				try {
					const d = join(src, dir);
					const name = dir;
					const addr = relative(rt, join(d, `${dir}.wxml`));
					const nm = map.get(addr);
					pages.sub.push({
						addr,
						name: nm ? nm : name
					});
				} catch {
					// 空文件夹
				}
			}
		}));
		const md = [pages, atoms1, atoms2, widgets].map((it) => {
			return it.sub.reduce((pre, cur) => {
				pre.push(`- ${this.l2t(cur)}`);
				return pre;
			}, [`## ${this.l2t(it)}`, '']).join('\n');
		}).join('\n\n');
		await this.writefileasync(mdfile, `# 页面地图

页面/组件/控件/原子操作名称可以手动编辑，以获得更好的实用效果。更新操作不会修改名称，如果确实需要自动修改，可先删除需要修改的行，然后重新全部更新即可。

${md}
`);
	}
	public async shellcreate(cwd: string, no: string, desc: string): Promise<void> {
		await this.downloadandextractrepo(cwd, { name: 'wxapp', branch: 'master' });
		await this.replacefile(join(cwd, 'package.json'), [/prjno/, /\$desc/], [no, desc]);
		await this.replacefile(join(cwd, 'src', 'package.json'), [/prjno/, /\$desc/], [no, desc]);
	}
	public shelldebug(): void {
		const command = 'npm t';
		return this.shellrun(command, 'debug');
	}
	public shellbuild(): void {
		const command = "npm version '1.0.'$(date +%Y%m%d%H%M) && npm run build && npm publish";
		this.shellrun(command, 'build');
	}
	public completion(): Disposable {
		const events = ['mm-events-init', 'mm-events-wx-app-launch', 'mm-events-wx-app-show', 'mm-events-wx-app-hide', 'mm-events-wx-app-error', 'mm-events-wx-page-load', 'mm-events-wx-page-ready', 'mm-events-wx-page-show', 'mm-events-wx-page-hide', 'mm-events-wx-page-unload', 'mm-events-wx-page-pulldown_refresh', 'mm-events-wx-page-reach-bottom', 'mm-events-wx-page-page-scroll'];
		return languages.registerCompletionItemProvider(
			'typescript',
			{
				provideCompletionItems: async (document: TextDocument, position: Position) => {
					if (!/[\\|/]n?s\.ts$/.test(document.fileName) || events.length === 0) {
						return undefined;
					}
					const linePrefix = document.lineAt(position).text.substr(0, position.character);
					if (linePrefix.includes(':')) {
						const dir = dirname(document.fileName);
						const files = await this.readdirasync(dir);
						const reg = /[\\|/]ns\.ts$/.test(document.fileName) ? /^na\d+.ts$/ : /^a\d+.ts$/;
						return files.filter((it) => {
							return reg.test(it);
						}).map((it) => {
							return new CompletionItem(it.replace('.ts', ''), CompletionItemKind.File);
						});
					}
					return events.map((event) => {
						return new CompletionItem(event, CompletionItemKind.Enum);
					});
				}
			},
			'\'',
			'"'
		);
	}
	public addwebfilter(): Promise<void> {
		return this.baseaddwebrouter('filters');
	}
	public addwebrouter(): Promise<void> {
		return this.baseaddwebrouter('routers');
	}
	public addpresentation(_editor: TextEditor): Promise<void> {
		throw new Error('Method not implemented.');
	}
	public addservice(): Promise<void> {
		return this.baseaddservice();
	}
	public addpage(): Promise<void> {
		return new AddComponentWeixin().act();
	}
	public addcomponent(_editor: TextEditor): Promise<void> {
		return this.addpage();
	}
	public addaction(editor: TextEditor): Promise<void> {
		return new AddActionWeixinPage().do(editor);
	}
	private l2t(link: Link) {
		return `[${link.name}](${link.addr})`;
	}

	private async md2map(mdfile: string) {
		try {
			const text = await this.readfileasync(mdfile);
			const reg = /##[^#]/g;
			let lastpos = -1;
			const blocks = [];
			let match;
			while ((match = reg.exec(text))) {
				if (lastpos > -1) {
					const t = text.substring(lastpos, match.index - 1);
					blocks.push(t);
				}
				lastpos = match.index;
			}
			if (lastpos > -1) {
				const t = text.substring(lastpos);
				blocks.push(t);
			}

			return blocks.reduce((m, block) => {
				const [h, ...body] = block.split('\n');
				const [, name, path] = /^## \[(.*)\]\((.*)\)/.exec(h)!;	// [pg001](./src/pg001/html.ts)
				m.set(path, name);

				const zj = /^- \[(.*)\]\((.*)\)/;	// - [zj-001](./src/pg001/zj-001/tpl.tpl)
				body.filter((line) => {
					return zj.test(line);
				}).forEach((line) => {
					const [, name, path] = zj.exec(line)!;
					m.set(path, name);
				});
				return m;
			}, new Map<string, string>());
		} catch {
			return new Map<string, string>();
		}
	}

}
