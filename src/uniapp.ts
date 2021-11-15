import { join } from 'path';
import { Disposable, TextEditor } from 'vscode';
import Base from './base';
import { IAtomCatagory } from './interfaces';
import AddAtomUniapp from './uniapp/addatom';
import AddPageUniapp from './uniapp/addpage';

export default class UniApp extends Base {
	public regenerateresourses(): Promise<void> {
		throw new Error('Method not implemented.');
	}
	public regeneratepages(): Promise<void> {
		throw new Error('Method not implemented.');
	}
	public regenerateapis(): Promise<void> {
		throw new Error('Method not implemented.');
	}
	public addcomponent2(_path?: string): Promise<void> {
		throw new Error('Method not implemented.');
	}
	public transfiles(): Promise<void> {
		throw new Error('Method not implemented.');
	}
	protected getpagename(_path: string): string | null {
		throw new Error('Method not implemented.');
	}
	public addschedule(): Promise<void> {
		throw new Error('Method not implemented.');
	}
	public addwidgetlocal(): Promise<void> {
		throw new Error('Method not implemented.');
	}
	public addwidget(): Promise<void> {
		throw new Error('Method not implemented.');
	}
	public addatom(): Promise<void> {
		return new AddAtomUniapp().do();
	}
	public addtplwidget(_editor: TextEditor): Promise<void> {
		throw new Error('Method not implemented.');
	}
	private remoteatoms = [] as IAtomCatagory[];
	protected async getremoteatoms(): Promise<IAtomCatagory[]> {
		if (this.remoteatoms.length === 0) {
			this.remoteatoms = await this.get<IAtomCatagory[]>('https://mmstudio.gitee.io/atom-uniapp/index.json');
		}
		return this.remoteatoms;
	}
	public async shellcreate(cwd: string, no: string, desc: string): Promise<void> {
		await this.downloadandextractrepo(cwd, { name: 'uniapp' });
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
	public addservice(_p?: string): Promise<void> {
		throw new Error('Method not implemented.');
	}
	public addpage(): Promise<void> {
		return new AddPageUniapp().do();
	}
	public addcomponent(_editor: TextEditor): Promise<void> {
		return this.addpage();
	}
}
