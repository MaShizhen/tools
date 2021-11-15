import { basename, dirname, extname, join, sep } from 'path';
import { Disposable, env, QuickPickItem, TextEditor, Uri, ViewColumn, window, workspace } from 'vscode';
import knex, { Knex } from 'knex';
import Tools from './tools';
import { IAtom, IAtomCatagory } from './interfaces';
import MysqlTableGenerator from './next/tbgenerator/mysql';
import PostgresqlTableGenerator from './next/tbgenerator/pg';

export default abstract class Base extends Tools {
	public abstract regenerateresourses(): Promise<void>;
	public abstract regeneratepages(): Promise<void>;
	public abstract regenerateapis(): Promise<void>;
	public abstract transfiles(): Promise<void>;
	public async generatetable(): Promise<void> {
		// type clientype = 'pg' | 'mysql' | 'mysql2' | 'mssql';
		const mm = await this.readfile(join(this.root(), 'mm.json'));
		const mmconfig = JSON.parse(mm) as { dbconfig: Knex.Config; };
		const config = mmconfig.dbconfig;
		if (!config) {
			this.showerror('请检查配置文件mm.json');
			return;
		}
		const dbname = (() => {
			const conn = config.connection;
			if (!conn) {
				throw new Error('Could not get connection');
			}
			if (typeof conn === 'string') {
				const c = Uri.parse(conn);
				return c.path.replace('/', '');
			}
			return (conn as Knex.MariaSqlConnectionConfig).db
				|| (conn as Knex.ConnectionConfig | Knex.MySqlConnectionConfig | Knex.MySql2ConnectionConfig | Knex.MsSqlConnectionConfig | Knex.OracleDbConnectionConfig | Knex.PgConnectionConfig | Knex.RedshiftConnectionConfig | Knex.SocketConnectionConfig).database;
		})();
		// const dbname = await window.showInputBox({
		// 	placeHolder: 'Type database name',
		// 	prompt: '请输入数据库名称',
		// 	ignoreFocusOut: true,
		// 	value: Next.dbname
		// });
		if (!dbname) {
			return;
		}
		await this.mkdir(join('src', 'pages', 'api', 'tables'));
		if (config.client === 'mysql') {
			config.client = 'mysql2';
		}
		const db = knex(config);
		switch (config?.client) {
			case 'mysql':
			case 'mysql2':
				await new MysqlTableGenerator(db, dbname).do();
				break;
			case 'pg':
				await new PostgresqlTableGenerator(db).do();
				break;
			case 'mssql':
			case 'oracle':
				throw new Error('Coming soon.');
		}
	}

	// 原型
	public async prototype() {
		const editor = window.activeTextEditor;
		if (!editor) {
			this.showerror('You must run this command when you opend a page file');
			return;
		}
		const doc = editor.document;
		const uri = doc.uri;
		if (uri.scheme !== 'file') {
			return;
		}
		const path = uri.fsPath;
		const pagename = this.getpagename(path);
		if (!pagename) {
			this.showerror('Could not get page name');
			return;
		}
		// const rt = this.root(editor);
		// const pkgstr = await this.readfile(join(rt, 'package.json'));
		// const pkg = JSON.parse(pkgstr) as { name: string; productid: string; };
		const pane = window.createWebviewPanel('01', '原型', ViewColumn.Beside);
		const url = 'https://01factory.vercel.app/';
		await env.openExternal(Uri.parse(url));
		// const url = `http://127.0.0.1:3000/pg002/${pkg.productid}/${pagename}`;
		pane.webview.html = `<!DOCTYPE html>
<html lang="en">

<head>
<style type="text/css">
html,body,iframe{
height:100%;
}
</style>
</head>

<body>
	<iframe onload="this.height=this.contentWindow.document.body.scrollHeight" src="${url}" width="100%"></iframe>
</body>

</html>
`;
		// get url or pictures on web by spaceid and 
	}
	protected abstract getpagename(path: string): string | null;

	public async finddoc() {
		const root = this.root();
		// if (!root) {
		// 	return;
		// }
		const src = join(root, 'src');
		const files = await this.getallfiles(src);
		const tsfiles = files.filter((file) => {
			const ext = extname(file);
			if (!/^\.tsx?$/.test(ext)) {
				return false;
			}
			const name = basename(file, ext);
			return /^((a|pg|s|c|)\d{3,}|\[.+])$/.test(name);	// a001 pg001 s001 c001 [id]
		});
		const options = Promise.all(tsfiles.map(async (file) => {
			const doc = await this.readdoc(file);
			const path = this.getrelativepath(src, file);
			return {
				label: doc,
				detail: path,
				path: file
			};
		}));
		const picked = await this.pick(options);
		if (!picked) {
			return;
		}
		await this.show_doc(picked.path);
	}

	public abstract addschedule(): Promise<void>;
	public abstract addwidgetlocal(): Promise<void>;
	public abstract addwidget(): Promise<void>;
	public abstract addatom(): Promise<void>;

	public abstract addtplwidget(editor: TextEditor): Promise<void>;
	public async addtplatom(editor: TextEditor) {
		const catagories_remote = new Map<string, IAtom[]>();
		const all_remote = new Map<string, IAtom>();
		const remote_atoms = await this.getremoteatoms();
		remote_atoms.forEach((it) => {
			catagories_remote.set(it.catagory, it.atoms);
			it.atoms.forEach((atom) => {
				all_remote.set(atom.no, atom);
			});
		});
		const root_path = this.root(editor);
		const atom_dir = join(root_path, 'src', 'atoms');

		const local_atoms = await (async () => {
			try {
				const allfiles = await this.getallfiles(atom_dir);
				const tsfiles = allfiles.filter((file) => {
					const ext = extname(file);
					if (!/^\.tsx?$/.test(ext)) {
						return false;
					}
					const name = basename(file, ext);
					return /^a\d{3,}$/.test(name);
				});
				const ps = tsfiles.map(async (path) => {
					const doc = await this.readdoc(path);
					const no = this.getrelativepath(atom_dir, path.replace(/\.tsx?/, ''));
					return {
						name: doc,
						no,
						local: true
					} as IAtom;
				});
				return Promise.all(ps);
			} catch {
				return [];
			}
		})();

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
			const atomfile = join(atom_dir, atom.no);
			const cur = dirname(editor.document.uri.fsPath);
			const relativepath = this.getrelativepath(cur, atomfile);
			const imp_path = relativepath.startsWith('.') ? relativepath : `./${relativepath}`;
			// const name = atom.no.replace(/(@.+\/)?([a-z]+)0+(\d+)/, '$2$3');
			const name = atom.no.replace(/[/\\]/g, '_');
			const imp = `import ${name} from '${imp_path}';`;

			const use = `${name}($1)`;

			await this.insetSnippet(editor, use, imp);
			return;
		}
		await this.shellinstall(editor, atom.no);

		const name = atom.no.replace(/(@.+\/)?([a-z]+)0+(\d+)/, '$2$3');
		const imp = `import ${name} from '${atom.no}';`;
		const dir = join(root_path, 'node_modules', atom.no);
		const snippet_use = Uri.file(join(dir, 'use.snippet'));

		try {
			await workspace.fs.stat(snippet_use);
		} catch (error) {
			this.showerror('无法自动添加脚本，请联系供应商');
			return;
		}
		const use = Buffer.from(await workspace.fs.readFile(snippet_use)).toString('utf8');

		await this.insetSnippet(editor, use, imp);
	}
	protected abstract getremoteatoms(): Promise<IAtomCatagory[]>;

	public abstract shellcreate(cwd: string, no: string, desc: string): Promise<void>;
	public abstract shellbuild(): void;
	public abstract shelldebug(): void;

	public abstract completion(): Disposable;

	public abstract addpage(path: string): Promise<void>;
	public abstract addcomponent(editor: TextEditor): Promise<void>;
	public abstract addcomponent2(path?: string): Promise<void>;
	public abstract addservice(path?: string): Promise<void>;

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

	public async addatomlocal(path?: string) {
		const folder = await this.getdirorbypath(path);
		if (!folder) {
			return;
		}
		const a = await this.generate(folder, 'a', 3);
		const p1 = join(folder, a);
		const p_path = `${p1}.ts`;
		const atoms = join('src', 'atoms');
		const name = this.getrelativepath(atoms, p1).replace(/\./g, '').replaceAll(sep, '_').replace(/^_/, '');
		const tpl = `
export default function ${name}() {
	// todo
}
`;
		await this.writefile(p_path, tpl);
		await this.show_doc(p_path);
	}
}
