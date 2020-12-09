import { join } from 'path';
import { Uri, window, workspace } from 'vscode';
import { existsasync, mkdirasync, writefileasync } from '../util/fs';
import generate from '../util/generate';
import { get_pages } from './get-pages';
import root_path from '../util/root';

export default async function addservicenext() {
	const rootPath = await root_path();
	const pages = await get_pages(rootPath);
	if (!pages) {
		return false;
	}
	const api = join(pages, 'api');
	if (await existsasync(api)) {
		await mkdirasync(api);
	}

	const path = await generate(api, 's', '.ts', 3);
	// create service file
	const servicefile = `${path}.ts`;
	await create_page(servicefile);
	await workspace.saveAll();
	window.setStatusBarMessage('成功添加服务文件');
	window.showTextDocument(Uri.file(servicefile));
	return true;
}

function create_page(path: string) {
	const tpl = `import nextConnect from 'next-connect'
import { NextApiRequest, NextApiResponse } from 'next';

const handler = nextConnect<NextApiRequest, NextApiResponse<{}>>();

handler.get((req, res) => {
	res.statusCode = 200
	res.json({ name: 'taoqf' })
});

export default handler;
`;
	return writefileasync(path, tpl);
}
