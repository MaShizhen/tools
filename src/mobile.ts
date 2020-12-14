import { homedir, platform } from 'os';
import { dirname, join, relative } from 'path';
import { CompletionItem, CompletionItemKind, Disposable, FileType, languages, Position, TextDocument, TextEditor, Uri, window, workspace } from 'vscode';
import Base from './base';
import { IAtomCatagory } from './interfaces';
import AddActionMobile from './mobile/addaction/component';
import AddAtomMobile from './mobile/addatom';
import AddComponentMobile from './mobile/addcomponent';
import AddTplWidgetMobile from './mobile/addtplwidget';
import AddWidgetMobile from './mobile/addwidgets';

interface Link {
	name: string;
	addr: string;
}

interface Section extends Link {
	sub: Link[];
}

export default class Mobile extends Base {
	public addwidget(): Promise<void> {
		return new AddWidgetMobile().act();
	}
	public addatom(): Promise<void> {
		return new AddAtomMobile().act();
	}
	private tplwidgetadder = new AddTplWidgetMobile()
	public async addtplwidget(editor: TextEditor): Promise<void> {
		return this.tplwidgetadder.do(editor);
	}
	private remoteatoms = [] as IAtomCatagory[];
	protected async getremoteatoms(): Promise<IAtomCatagory[]> {
		if (!this.remoteatoms) {
			this.remoteatoms = await this.get<IAtomCatagory[]>('https://mmstudio.gitee.io/atom-mobile/index.json');
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
		const app = { name: 'App', addr: '#App', sub: [] } as Section;
		function add(rs: Link[], name: string, l: string) {
			const addr = relative(rt, l);
			const nm = map.get(addr);
			rs.push({
				addr,
				name: nm ? nm : name
			});
			return rs;
		}
		await Promise.all(all.map(async (pg) => {
			const d = join(src, pg);
			if (pg.endsWith('widgets')) {
				const subs = await this.readdirasync(d);
				widgets.sub = subs.reduce((pre, it) => {
					const m = /pw(\d{3})/.exec(it);
					if (m) {
						add(pre, `PW${m[1]}`, join(d, it, 'index.tsx'));
					}
					// PW001
					return pre;
				}, [] as Link[]);
			} else if (pg.endsWith('atoms')) {
				const subs = await this.readdirasync(d);
				await Promise.all(subs.map(async (it) => {
					const p1 = join(d, it, 'index.ts');
					const p2 = join(d, it, 'index.tsx');
					let p = p1;
					if (await this.existsasync(p1)) {
						p = p1;
					} else if (await this.existsasync(p2)) {
						p = p2;
					}
					if (it.startsWith('anp')) {
						add(atoms1.sub, it, p);
					} else if (it.startsWith('ap')) {
						add(atoms2.sub, it, p);
					}
				}));
			} else if (/pg\d{3}/.test(pg)) {
				try {
					const name = pg;
					const addr = relative(rt, join(d, 'tpl.tsx'));
					const nm = map.get(addr);
					app.sub.push({
						addr,
						name: nm ? nm : name
					});
				} catch {
					// 空文件夹
				}
			} else if (/c\d{3}/.test(pg)) {
				try {
					await this.generate_container(d, rt, map, pg, pages, app);
				} catch {
					// 空文件夹
				}
			}
		}));
		const md = [app, ...pages, atoms1, atoms2, widgets].map((it) => {
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
		await this.downloadandextractrepo(cwd, { name: 'mobile', branch: 'master' });
		await this.replacefile(join(cwd, 'package.json'), [/prjno/, /\$desc/], [no, desc]);
		await this.replace_mobile(join(cwd, 'android'), no);
		await this.replace_mobile(join(cwd, 'ios'), no);
		await this.replacefile(join(cwd, 'app.json'), [/mmstudio/, /\$desc/], [no, desc]);
		await this.replacefile(join(cwd, 'index.js'), [/mmstudio/, /\$desc/], [no, desc]);
	}
	public shelldebug(): void {
		const command = 'npm t';
		this.shellrun(command, 'debug');
		if (this.isios()) {
			const app = 'npm run test:ios';
			this.shellrun(app, 'debug app');
		} else {
			// const env = (() => {
			// 	const home = homedir();
			// 	const android = join(home, 'Android');
			// 	const javahome = join(android, 'jdk1.8.0_191');
			// 	const path = join(javahome, 'bin');
			// 	const androidhome = join(android, 'Sdk');
			// 	return `export JAVA_HOME=${javahome} && export PATH=${path}:$PATH && export ANDROID_HOME=${androidhome}`;
			// })();
			// run(env, 'debug app');
			const app = 'npm run test:dev';
			this.shellrun(app, 'debug app');
		}
	}
	public async shellbuild() {
		const pickoption = this.getdefaultpickoption();
		const select = await window.showQuickPick([
			{
				description: '服务包一般指向服务器部署的软件包,部署才能生效',
				label: '服务包',
				picked: true
			},
			{
				description: 'apk或ipa包',
				label: 'app包',
				picked: false
			}
		], {
			...pickoption,
			placeHolder: '请选择打包类型'
		});
		if (!select) {
			return;
		}
		if (select.label === '服务包') {
			const command = "npm version '1.0.'$(date +%Y%m%d%H%M) && npm run build && npm publish";
			this.shellrun(command, 'build');
		} else {
			const cwd = workspace.workspaceFolders![0].uri.fsPath;
			this.shellrun(`cd ${cwd}`, 'debug app');
			if (this.isios()) {
				const app = 'npm run build:ts && gulp && react-native bundle --entry-file index.js --platform ios --dev false --bundle-output release_ios/main.jsbundle --assets-dest release_ios/';
				this.shellrun(app, 'debug app');
			} else {
				const env = (() => {
					const home = homedir();
					const android = join(home, 'Android');
					const javahome = join(android, 'jdk1.8.0_191');
					const path = join(javahome, 'bin');
					const androidhome = join(android, 'Sdk');
					return `export JAVA_HOME=${javahome} && export PATH=${path}:$PATH && export ANDROID_HOME=${androidhome}`;
				})();
				this.shellrun(env, 'debug app');
				const app = 'npm run build:ts && cd ./android && ./gradlew assembleRelease';
				this.shellrun(app, 'debug app');
			}
		}
	}
	public completion(): Disposable {
		const events = ['mm-events-status-change', 'mm-events-init', 'mm-events-nav-blur', 'mm-events-nav-focus', 'mm-events-nav-state', 'mm-events-nav-stack-trans-start', 'mm-events-nav-stack-trans-end', 'mm-events-nav-tab-press', 'mm-events-nav-tab-long-press', 'mm-events-keyboard-will-show', 'mm-events-keyboard-did-show', 'mm-events-keyboard-will-hide', 'mm-events-keyboard-did-hide', 'mm-events-keyboard-will-changeframe', 'mm-events-keyboard-did-changeframe', 'mm-events-accessibility-change', 'mm-events-accessibility-annoucement-finished', 'mm-events-net-change'];
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
		return new AddComponentMobile().act();
	}
	public addcomponent(_editor: TextEditor): Promise<void> {
		return this.addpage();
	}
	public async addaction(editor: TextEditor): Promise<void> {
		const addactionmobile = new AddActionMobile();
		return addactionmobile.do(editor);
	}
	private isios() {
		switch (platform()) {
			case 'darwin':
				return true;
			case 'linux':
			case 'win32':
			default:
				return false;
		}
	}
	private async replace_mobile(cwd: string, no: string) {
		const files = await workspace.fs.readDirectory(Uri.file(cwd));
		return Promise.all(files.map(async ([path, type]) => {
			const fullpath = join(cwd, path);
			const newpath = join(cwd, path.replace(/mmstudio/, no));
			if (path.includes('mmstudio')) {
				await workspace.fs.rename(Uri.file(fullpath), Uri.file(newpath));
			}
			if (type === FileType.Directory) {
				await this.replace_mobile(newpath, no);
			} else if (type === FileType.File) {
				await this.replacefile(newpath, [/mmstudio/g], [no]);
			}
		}));
	}

	private async generate_container(d: string, rt: string, map: Map<string, string>, pg: string, pages: Section[], container: Section) {
		const zjs = await this.readdirasync(d);
		const sub = await Promise.all(zjs.filter((it) => {
			return /pg\d{3}/.test(it);
		}).map((it) => {
			const l = join(d, it, 'tpl.tsx');
			const addr = relative(rt, l);
			const nm = map.get(addr);
			return {
				addr,
				name: nm ? nm : it
			};
		}));
		const addr = `#${pg}`;// self link [name](#addr)
		const nm = map.get(addr);
		const name = nm ? nm : pg;
		const c = {
			addr,
			name,
			sub
		};
		await Promise.all(zjs.filter((it) => {
			return /c\d{3}/.test(it);
		}).map((it) => {
			const dd = join(d, it);
			return this.generate_container(dd, rt, map, it, pages, c);
		}));
		pages.push(c);
		const address = `#${name}`; // [name](#addr)
		const nm2 = map.get(address);
		container.sub.push({
			addr: address,
			name: nm2 ? nm2 : name
		});
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
					return zj.test(line) && !/^- .*\(#c\d+\)$/.test(line);
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
