import { dirname, join, relative } from 'path';
import { CompletionItem, CompletionItemKind, Disposable, languages, Position, TextDocument, TextEditor } from 'vscode';
import Base from './base';
import { IAtomCatagory } from './interfaces';
import AddActionWeixinPage from './wxapp/addaction/page';
import AddAtomWx from './wxapp/addatom';
import AddComponentWeixin from './wxapp/addcomponent';
import AddTplWidgetWx from './wxapp/addtplwidget';
import AddWidgetWx from './wxapp/addwidgets';

interface Link {
	name: string;
	addr: string;
}

interface Section extends Link {
	sub: Link[];
}

export default class WeiXin extends Base {
	public addwidget(): Promise<void> {
		return new AddWidgetWx().act();
	}
	public addatom(): Promise<void> {
		return new AddAtomWx().act();
	}
	private tplwidgetadder = new AddTplWidgetWx();
	public async addtplwidget(editor: TextEditor): Promise<void> {
		return this.tplwidgetadder.do(editor);
	}

	private remoteatoms = [] as IAtomCatagory[];
	protected async getremoteatoms(): Promise<IAtomCatagory[]> {
		if (!this.remoteatoms) {
			this.remoteatoms = await this.get<IAtomCatagory[]>('https://mmstudio.gitee.io/atom-wxapp/index.json');
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
