import { dirname, join } from 'path';
import { window, workspace } from 'vscode';
import { get_pages } from './get-pages';
import Tools from '../tools';

export default class AddServiceNext extends Tools {
	public async addservice() {
		const rootPath = await this.root();
		const pages = await get_pages(rootPath);

		const api = (() => {
			const editor = window.activeTextEditor;
			if (!editor) {
				return join(pages, 'api');
			}
			return dirname(editor.document.fileName);
		})();

		const path = await this.generate(api, 's', '.ts', 3);
		// create service file
		const servicefile = `${path}.ts`;
		await this.create_page(servicefile);
		await workspace.saveAll();
		this.set_status_bar_message('成功添加服务文件');
		this.show_doc(servicefile);
	}

	private create_page(path: string) {
		const tpl = `import nextConnect from 'next-connect';
import { NextApiRequest, NextApiResponse, PageConfig } from 'next';

const handler = nextConnect<NextApiRequest, NextApiResponse<Record<string, unknown>>>();

handler.get((req, res) => {
	res.statusCode = 200;
	res.json({ name: 'mmstudio' });
});

export const config = {} as PageConfig;

export default handler;
`;
		return this.writefileasync(path, tpl);
	}
}
