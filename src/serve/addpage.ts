import { basename, join } from 'path';
import { TextEditor, workspace } from 'vscode';
import Actor from '../actor';

export default class AddPageServe extends Actor {
	public do(_editor: TextEditor): Promise<void> {
		throw new Error('Method not implemented.');
	}
	public async act(): Promise<void> {
		const rootPath = this.root();
		const src = join(rootPath, 'src');
		if (!await this.existsasync(src)) {
			await this.mkdirasync(src);
		}
		const folder = src;
		const p_path = await this.generate(folder, 'pg', '', 3);
		if (!await this.existsasync(folder)) {
			await this.mkdirasync(folder);
		}
		await this.mkdirasync(p_path);
		const s_path = join(p_path, 's001');
		await this.create_s(s_path, s_path.replace(/.*src[/|\\]/, ''));

		await workspace.saveAll();
		this.show_doc(join(p_path, 's001.ts'));
	}

	private create_s(path: string, dir: string) {
		const no = basename(path, '.ts');
		const tpl = `import an1 from '@mmstudio/an000001';
import an4 from '@mmstudio/an000004';

interface Message {
	// cookies: {
	// 	uk: string;
	// 	[key: string]: string
	// };
	// urls: {
	// 	base: string;
	// 	origin: string;
	// 	url: string;
	// };
	// query: {};
	// params: {};
	// headers: {};
	// captcha: string;
}

export default async function ${no}(msg: Message, actionid: string): Promise<an4> {
	an1(\`Service begin path:${dir},actionid:$\{actionid}\`);

	an1(\`Service end path:${dir},actionid:$\{actionid}\`);
	return {
		data: '"mm"'
	} as an4;
}
`;
		return this.writefileasync(`${path}.ts`, tpl);
	}
}
