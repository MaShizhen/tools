import { join } from 'path';
import { Disposable, languages, TextEditor } from 'vscode';
import Base from './base';
import { IAtomCatagory } from './interfaces';
import AddPageNext from './next/addpage';
import AddServiceNext from './next/addservice';
import get from './util/get';

export default class Next extends Base {
	public addtplwidget(_editor: TextEditor): Promise<void> {
		throw new Error('Method not implemented.');
	}
	private remoteatoms = [] as IAtomCatagory[];
	protected async getremoteatoms(): Promise<IAtomCatagory[]> {
		if (!this.remoteatoms) {
			this.remoteatoms = await get<IAtomCatagory[]>('https://mmstudio.gitee.io/atom-next/index.json');
		}
		return this.remoteatoms;
	}
	public refreshsitemap(): Promise<void> {
		throw new Error('Method not implemented.');
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
		return languages.registerCompletionItemProvider(
			'typescript',
			{
				provideCompletionItems() {
					return undefined;
				}
			}
		);
	}
	public addwebfilter(): Promise<void> {
		throw new Error('Method not implemented.');
	}
	public addwebrouter(): Promise<void> {
		throw new Error('Method not implemented.');
	}
	public addpresentation(_editor: TextEditor): Promise<void> {
		throw new Error('Method not implemented.');
	}
	public addservice(): Promise<void> {
		return new AddServiceNext().addservice();
	}
	public addpage(): Promise<void> {
		return new AddPageNext().addpage();
	}
	public addcomponent(_editor: TextEditor): Promise<void> {
		return this.addpage();
	}
	public addaction(editor: TextEditor): Promise<void> {
		return this.baseaddaction(editor);
	}
}
