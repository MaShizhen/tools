import { dirname, join, parse, relative } from 'path';
import { CompletionItem, CompletionItemKind, Disposable, languages, Position, TextDocument, TextEditor, workspace } from 'vscode';
import Base from './base';
import { IAtomCatagory } from './interfaces';
import AddActionWebComponent from './web/addaction/component';
import AddActionWebComponentN from './web/addaction/componentn';
import AddActionWebPage from './web/addaction/page';
import AddActionWebPageN from './web/addaction/pagen';
import AddAtomWeb from './web/addatom';
import AddComponentWeb from './web/addcomponent';
import AddPageWeb from './web/addpage';
import AddPresentationWeb from './web/addpresentation';
import AddTplWidgetWeb from './web/addtplwidget';
import AddWidgetWeb from './web/addwidget';

interface Link {
	name: string;
	addr: string;
}

interface Section extends Link {
	sub: Link[];
}

export default class Web extends Base {
	public addwidget(): Promise<void> {
		return new AddWidgetWeb().act();
	}
	public async addatom(): Promise<void> {
		return new AddAtomWeb().act();
	}
	private tplwidgetadder = new AddTplWidgetWeb();
	public addtplwidget(editor: TextEditor): Promise<void> {
		return this.tplwidgetadder.do(editor);
	}
	private remoteatoms = [] as IAtomCatagory[];
	protected async getremoteatoms(): Promise<IAtomCatagory[]> {
		if (!this.remoteatoms) {
			this.remoteatoms = await this.get<IAtomCatagory[]>('https://mmstudio.gitee.io/atom-web/index.json');
		}
		return this.remoteatoms;
	}
	public async refreshsitemap(): Promise<void> {
		const rt = this.root();
		const mdfile = join(rt, '.mm.md');
		const map = await this.md2map(mdfile);
		const src = join(rt, 'src');
		const all = await this.readdirasync(src);
		const pages = [] as Section[];
		const atoms1 = { name: '项目自定义服务端原子操作', addr: '#项目自定义服务端原子操作', sub: [] } as Section;
		const atoms2 = { name: '项目自定义客户端原子操作', addr: '#项目自定义客户端原子操作', sub: [] } as Section;
		const widgets = { name: '项目自定义控件', addr: '#项目自定义控件', sub: [] } as Section;
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
					const n = await this.readfileasync(join(d, 'n.ts'));
					const [, name] = /<title>(.*)<\/title>/.exec(n)!;
					const zjs = await this.readdirasync(d);
					const sub = await Promise.all(zjs.filter((it) => {
						return /zj-\d{3}/.test(it);
					}).map((it) => {
						const l = join(d, it, 'tpl.tpl');
						const addr = relative(rt, l);
						const nm = map.get(addr);
						return {
							addr,
							name: nm ? nm : it
						};
					}));
					const addr = relative(rt, join(d, 'html.ts'));
					const nm = map.get(addr);
					pages.push({
						addr,
						name: nm ? nm : name,
						sub
					});
				} catch {
					// 空文件夹
				}
			}
		}));
		const md = [...pages, atoms1, atoms2, widgets].map((it) => {
			return it.sub.reduce((pre, cur) => {
				pre.push(`- ${this.l2t(cur)}`);
				return pre;
			}, [`## ${this.l2t(it)}`, '']).join('\n');
		}).join('\n\n');
		await this.writefileasync(mdfile, `# 页面地图

页面/组件/控件/原子操作名称可以手动编辑，以获得更好的实用效果。更新操作不会修改名称，如果确实需要自动修改，可先删除需要修改的行，然后重新全部更新即可。

${md}
`);
		await workspace.saveAll();
	}
	public async shellcreate(cwd: string, no: string, desc: string): Promise<void> {
		await this.downloadandextractrepo(cwd, { name: 'web', branch: 'master' });
		await this.replacefile(join(cwd, 'package.json'), [/prjno/, /\$desc/], [no, desc]);
	}
	public shelldebug(): void {
		const command = 'npm t';
		this.shellrun(command, 'debug');
	}
	public shellbuild(): void {
		const command = "npm version '1.0.'$(date +%Y%m%d%H%M) && npm run build:n && npm run build && git commit -am 'build' && npm publish";
		this.shellrun(command, 'build');
	}
	public completion(): Disposable {
		const ns = languages.registerCompletionItemProvider(
			'typescript',
			{
				provideCompletionItems: async (document: TextDocument, position: Position) => {
					const events = ['mm-events-init'];
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
		const listservice = languages.registerCompletionItemProvider(
			'typescript',
			{
				provideCompletionItems: async (document: TextDocument, position: Position) => {
					const linePrefix = document.lineAt(position).text.substr(0, position.character);
					if (!/aw17<.*>\(['|"]$/.test(linePrefix) && !/const service_name = ['|"]$/.test(linePrefix)) {
						return undefined;
					}
					const dir = dirname(document.fileName);

					const files = await this.readdirasync(dir);
					return files.filter((it) => {
						return /s\d+.ts$/.test(it);
					}).map((it) => {
						const full = join(dir, it);
						return new CompletionItem(full.replace(/\\/g, '/').replace(/.*src\/(.*)\.ts/, '$1'), CompletionItemKind.File);
					});
				}
			},
			'\'',
			'"'
		);
		return Disposable.from(ns, listservice);
	}
	public addwebfilter(): Promise<void> {
		return this.baseaddwebrouter('filters');
	}
	public addwebrouter(): Promise<void> {
		return this.baseaddwebrouter('routers');
	}
	public addpresentation(editor: TextEditor): Promise<void> {
		return new AddPresentationWeb().do(editor);
	}
	public addservice(): Promise<void> {
		return this.baseaddservice();
	}
	public addpage(): Promise<void> {
		return new AddPageWeb().act();
	}
	public addcomponent(editor: TextEditor): Promise<void> {
		return new AddComponentWeb().do(editor);
	}
	public async addaction(editor: TextEditor): Promise<void> {
		const path = editor.document.fileName;
		const fileName = parse(path).base;
		// 如果当前目录不在某个页面中，则不允许操作
		const r = this.reg_in_comment(path);
		if (r) {
			if (fileName === 'n.ts') {
				const componentn = new AddActionWebComponentN();
				await componentn.do(editor);
			} else {
				const component = new AddActionWebComponent();
				await component.do(editor);
			}
		} else if (fileName === 'n.ts') {
			const pagena = new AddActionWebPageN();
			await pagena.do(editor);
		} else {
			const page = new AddActionWebPage();
			await page.do(editor);
		}
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
