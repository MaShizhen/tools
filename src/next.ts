import { join } from 'path';
import { Disposable, TextEditor } from 'vscode';
import Base from './base';
import { IAtomCatagory } from './interfaces';
import AddAtomNext from './next/addatom';
import AddComponentNext from './next/addcomponent';
import AddPageNext from './next/addpage';
import AddScheduleNext from './next/addschedule';
import AddServiceNext from './next/addservice';

export default class Next extends Base {
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
