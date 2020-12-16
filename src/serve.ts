import { join, relative } from 'path';
import { Disposable, TextEditor } from 'vscode';
import Base from './base';
import { IAtomCatagory } from './interfaces';
import AddAtomServe from './serve/addatom';
import AddPageServe from './serve/addpage';

interface Link {
	name: string;
	addr: string;
}

interface Section extends Link {
	sub: Link[];
}

export default class Serve extends Base {
	public addwidgetlocal(): Promise<void> {
		throw new Error('Method not implemented.');
	}
	public addwidget(): Promise<void> {
		throw new Error('Method not implemented.');
	}
	public addatom(): Promise<void> {
		return new AddAtomServe().do();
	}
	public addtplwidget(_editor: TextEditor): Promise<void> {
		throw new Error('Method not implemented.');
	}
	private remoteatoms = [] as IAtomCatagory[];
	protected async getremoteatoms(): Promise<IAtomCatagory[]> {
		if (!this.remoteatoms) {
			this.remoteatoms = await this.get<IAtomCatagory[]>('https://mmstudio.gitee.io/atom-nodejs/index.json');
		}
		return this.remoteatoms;
	}
	public async refreshsitemap(): Promise<void> {
		const rt = this.root();
		const mdfile = join(rt, '.mm.md');
		const map = await this.md2map(mdfile);
		const src = join(rt, 'src');
		const all = await this.readdir(src);
		const pages = [] as Section[];
		const atoms = { name: '项目自定义服务端原子操作', addr: '#项目自定义服务端原子操作', sub: [] } as Section;
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
			if (dir.endsWith('atoms')) {
				const subs = await this.readdir(d);
				subs.forEach((it) => {
					if (it.startsWith('anp')) {
						add(atoms.sub, it, join(d, it, 'index.ts'));
					}
				});
			} else if (/pg\d{3}/.test(dir)) {
				try {
					const d = join(src, dir);
					const services = await this.readdir(d);
					const sub = await Promise.all(services.filter((it) => {
						return /s\d{3}/.test(it);
					}).map((it) => {
						const l = join(d, it);
						const addr = relative(rt, l);
						const nm = map.get(addr);
						return {
							addr,
							name: nm ? nm : it
						};
					}));
					if (services.length > 0) {
						const addr = relative(rt, d);
						const nm = map.get(addr);
						pages.push({
							addr,
							name: nm ? nm : dir,
							sub
						});
					}
				} catch {
					// 空文件夹
				}
			}
		}));
		const md = [...pages, atoms].map((it) => {
			return it.sub.reduce((pre, cur) => {
				pre.push(`- ${this.l2t(cur)}`);
				return pre;
			}, [`## ${this.l2t(it)}`, '']).join('\n');
		}).join('\n\n');
		await this.writefile(mdfile, `# 页面地图

页面/原子操作名称可以手动编辑，以获得更好的实用效果。更新操作不会修改名称，如果确实需要自动修改，可先删除需要修改的行，然后重新全部更新即可。

${md}
`);
	}
	public async shellcreate(cwd: string, no: string, desc: string): Promise<void> {
		await this.downloadandextractrepo(cwd, { name: 'serve' });
		await this.replacefile(join(cwd, 'package.json'), [/prjno/, /\$desc/], [no, desc]);
	}
	public shellbuild(): void {
		const command = "npm version '1.0.'$(date +%Y%m%d%H%M) && yarn build && npm publish";
		this.shellrun(command, 'build');
	}
	public shelldebug(): void {
		const command = 'npm t';
		this.shellrun(command, 'debug');
	}
	public completion(): Disposable {
		return Disposable.from();
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
		return new AddPageServe().do();
	}
	public addaction(editor: TextEditor): Promise<void> {
		return this.baseaddaction(editor);
	}
	public addcomponent(_editor: TextEditor): Promise<void> {
		return this.addpage();
	}

	private l2t(link: Link) {
		return `[${link.name}](${link.addr})`;
	}

	private async md2map(mdfile: string) {
		try {
			const text = await this.readfile(mdfile);
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
