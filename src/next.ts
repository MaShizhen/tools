import { basename, dirname, extname, join } from 'path';
import { Disposable, TextEditor, Uri, window } from 'vscode';
import knex, { Knex } from 'knex';
import Base from './base';
import { IAtomCatagory } from './interfaces';
import AddAtomNext from './next/addatom';
import AddComponentNext from './next/addcomponent';
import AddPageNext from './next/addpage';
import AddScheduleNext from './next/addschedule';
import AddServiceNext from './next/addservice';
import MysqlTableGenerator from './next/tbgenerator/mysql';
import PostgresqlTableGenerator from './next/tbgenerator/pg';
import FileTranslator from './next/filetranslator';

export default class Next extends Base {
	public async transfiles(): Promise<void> {
		return new FileTranslator().do();
	}
	public async generatetable(): Promise<void> {
		// type clientype = 'pg' | 'mysql' | 'mysql2' | 'mssql';
		const mm = await this.readfile(join(this.root(), 'mm.json'));
		const mmconfig = JSON.parse(mm) as { dbconfig: Knex.Config; };
		const config = mmconfig.dbconfig;
		if (!config) {
			await window.showErrorMessage('请检查配置文件mm.json');
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
	protected getpagename(path: string): string | null {
		if (!/pages/.test(path)) {
			return null;
		}
		const ext = extname(path);
		const pagename = basename(path, ext);
		if (/pages\/api/.test(path)) {
			// 服务,直接获取文件夹名称
			const dir = dirname(path);
			if (/pages\/api\/.*/.test(dir)) {
				return basename(dir);
			}
			return null;
		}
		if (!/^\[.+\]$/.test(pagename)) {
			return pagename;
		}
		// 获取目录名
		const dir = dirname(path);
		return basename(dir);
	}
	public addschedule(): Promise<void> {
		return new AddScheduleNext().do();
	}
	public addwidgetlocal(): Promise<void> {
		throw new Error('Method not implemented.');
	}
	public addwidget(): Promise<void> {
		throw new Error('Method not implemented.');
	}
	public addatom(): Promise<void> {
		return new AddAtomNext().do();
	}
	public addtplwidget(_editor: TextEditor): Promise<void> {
		throw new Error('Method not implemented.');
	}
	private remoteatoms = [] as IAtomCatagory[];
	protected async getremoteatoms(): Promise<IAtomCatagory[]> {
		if (this.remoteatoms.length === 0) {
			this.remoteatoms = await this.get<IAtomCatagory[]>('https://mmstudio.gitee.io/atom-next/index.json');
		}
		return this.remoteatoms;
	}
	public async shellcreate(cwd: string, no: string, desc: string): Promise<void> {
		await this.downloadandextractrepo(cwd, { name: 'next' });
		await this.replacefile(join(cwd, 'package.json'), [/p000000/, /\$desc/], [no, desc]);
	}
	public shellbuild(): void {
		const command = 'yarn build';
		this.shellrun(command, 'build');
	}
	public shelldebug(): void {
		const command = 'yarn dev';
		this.shellrun(command, 'debug');
	}
	public completion(): Disposable {
		return Disposable.from();
	}
	public addservice(): Promise<void> {
		return new AddServiceNext().do();
	}
	public addpage(): Promise<void> {
		return new AddPageNext().do();
	}
	public addcomponent(editor: TextEditor): Promise<void> {
		return new AddComponentNext().do(editor);
	}
	public addatomlocal(editor: TextEditor): Promise<void> {
		return this.baseaddatomlocal(editor);
	}
}
