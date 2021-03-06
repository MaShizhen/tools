import { basename, dirname, extname, join } from 'path';
import { Disposable, TextEditor } from 'vscode';
import Base from './base';
import { IAtomCatagory } from './interfaces';
import AddAtomNext from './next/addatom';
import AddComponentNext from './next/addcomponent';
import AddComponentNext2 from './next/addcomponent2';
import AddPageNext from './next/addpage';
import AddScheduleNext from './next/addschedule';
import AddServiceNext from './next/addservice';
import FileTranslator from './next/filetranslator';
import RegenerateAPIs from './next/regenerateapis';
import RegenerateNextPages from './next/regeneratepages';
import RegenerateNextResources from './next/regenerateresources';

export default class Next extends Base {
	public regenerateresourses(): Promise<void> {
		return new RegenerateNextResources().do();
	}
	public regeneratepages(): Promise<void> {
		return new RegenerateNextPages().do();
	}
	public regenerateapis(): Promise<void> {
		return new RegenerateAPIs().do();
	}
	public addcomponent2(path?: string): Promise<void> {
		return new AddComponentNext2().do(path);
	}
	public async transfiles(): Promise<void> {
		return new FileTranslator().do();
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
	public addservice(path?: string): Promise<void> {
		return new AddServiceNext().do(path);
	}
	public addpage(path?: string): Promise<void> {
		return new AddPageNext().do(path);
	}
	public addcomponent(editor: TextEditor): Promise<void> {
		return new AddComponentNext().do(editor);
	}
}
