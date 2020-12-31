import { join } from 'path';
import { Disposable, TextEditor } from 'vscode';
import Base from './base';
import { IAtomCatagory } from './interfaces';
import AddPageTaro from './taro/addpage';

export default class Taro extends Base {
	public addwidgetlocal(): Promise<void> {
		throw new Error('Method not implemented.');
	}
	public addwidget(): Promise<void> {
		throw new Error('Method not implemented.');
	}
	public addatom(): Promise<void> {
		throw new Error('Method not implemented.');
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
	}
	public shellbuild(): void {
		throw new Error('Method not implemented.');
	}
	public shelldebug(): void {
		throw new Error('Method not implemented.');
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
	public addaction(editor: TextEditor): Promise<void> {
		return this.baseaddaction(editor);
	}
	public addpresentation(_editor: TextEditor): Promise<void> {
		throw new Error('Method not implemented.');
	}
	public addwebfilter(): Promise<void> {
		throw new Error('Method not implemented.');
	}
	public addwebrouter(): Promise<void> {
		throw new Error('Method not implemented.');
	}
}
