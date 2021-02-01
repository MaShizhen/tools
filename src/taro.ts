import { join } from 'path';
import { Disposable, TextEditor } from 'vscode';
import Base from './base';
import { IAtomCatagory } from './interfaces';
import AddAtomTaro from './taro/addatom';
import AddPageTaro from './taro/addpage';

export default class Taro extends Base {
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
		return new AddAtomTaro().do();
	}
	public addtplwidget(_editor: TextEditor): Promise<void> {
		throw new Error('Method not implemented.');
	}
	protected getremoteatoms(): Promise<IAtomCatagory[]> {
		throw new Error('Method not implemented.');
	}
	public async shellcreate(cwd: string, no: string, desc: string): Promise<void> {
		await this.downloadandextractrepo(cwd, { name: 'taro' });
		await this.replacefile(join(cwd, 'package.json'), [/p000000/, /\$desc/], [no, desc]);
		const dt = new Date().toLocaleDateString();
		await this.replacefile(join(cwd, 'config', 'index.js'), [/prjname/, /createdate/], [no, dt]);
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
	public addpage(): Promise<void> {
		return new AddPageTaro().do();
	}
	public addcomponent(_editor: TextEditor): Promise<void> {
		throw new Error('Method not implemented.');
	}
	public addservice(): Promise<void> {
		throw new Error('Method not implemented.');
	}
	public addatomlocal(editor: TextEditor): Promise<void> {
		return this.baseaddatomlocal(editor);
	}
}
