import { join } from 'path';
import { workspace } from 'vscode';
import { create_s } from '../mm/addservice';
import Tools from '../tools';

export default class AddPageServe extends Tools {
	public async addpage() {
		const rootPath = await this.root();
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
		await create_s(s_path, s_path.replace(/.*src[/|\\]/, ''));

		await workspace.saveAll();
		this.show_doc(join(p_path, 's001.ts'));
	}
}
