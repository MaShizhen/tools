import { basename, dirname, join } from 'path';
import { window, workspace } from 'vscode';
import { get_pages } from './get-pages';
import Actor from '../actor';

export default class AddServiceNext extends Actor {
	public async do(): Promise<void> {
		const rootPath = this.root();
		const pages = await get_pages(rootPath);

		const api = (() => {
			const editor = window.activeTextEditor;
			if (!editor) {
				return join(pages, 'api');
			}
			return dirname(editor.document.fileName);
		})();

		const name = await this.generate(api, 's', 3);
		// create service file
		const servicefile = join(api, `${name}.ts`);
		await this.create_api(servicefile);
		await workspace.saveAll();
		this.set_status_bar_message('成功添加服务文件');
		this.show_doc(servicefile);
	}

	private create_api(path: string) {
		const no = basename(path, '.ts');
		const tpl = `import nextConnect from 'next-connect';
import { NextApiRequest, NextApiResponse, PageConfig } from 'next';
import anylogger from 'anylogger';
import '@mmstudio/an000042';

const logger = anylogger('${no}');

const handler = nextConnect<NextApiRequest, NextApiResponse<Record<string, unknown>>>();

handler.get((req, res) => {
	res.status(200).json({ name: 'mmstudio' });
});

export const config = {} as PageConfig;

export default handler;
`;
		return this.writefile(path, tpl);
	}
}
