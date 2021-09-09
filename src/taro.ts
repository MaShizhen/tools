import { basename, extname, join } from 'path';
import { Disposable, TextEditor } from 'vscode';
import Base from './base';
import { IAtomCatagory } from './interfaces';
import AddAtomTaro from './taro/addatom';
import AddComponentTaro from './taro/addcomponent';
import AddPageTaro from './taro/addpage';
import RegenerateTaroPages from './taro/regeneratepages';

export default class Taro extends Base {
	public regeneratepages(): Promise<void> {
		return new RegenerateTaroPages().do();
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
	protected getpagename(path: string): string | null {
		if (!/pages/.test(path)) {
			return null;
		}
		const ext = extname(path);
		return basename(path, ext);
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
	public addcomponent(editor: TextEditor): Promise<void> {
		return new AddComponentTaro().do(editor);
	}
	public addservice(_p?: string): Promise<void> {
		throw new Error('Method not implemented.');
	}
}
