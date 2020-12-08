import { basename, join } from 'path';
import { Uri, window, workspace } from 'vscode';
import { existsasync, writefileasync } from '../util/fs';
import generate from '../util/generate';

export default async function addpagenext(rootPath: string) {
	const pages = await get_pages(rootPath);
	if (!pages) {
		return false;
	}
	const p_path = await generate(pages, 'pg', '.tsx', 3);
	const name = basename(p_path);
	// create page file
	const pagefile = `${p_path}.tsx`;
	await create_page(pagefile, name);
	await workspace.saveAll();
	window.setStatusBarMessage('成功添加页面文件');
	window.showTextDocument(Uri.file(pagefile));
	return true;
}

async function get_pages(rootPath: string) {
	const pages = join(rootPath, 'pages');
	if (await existsasync(join(pages, '_app.tsx'))) {
		return pages;
	}
	const src = join(rootPath, 'src', 'pages');
	if (await existsasync(join(src, '_app.tsx'))) {
		return src;
	}
	return false;
}

function create_page(path: string, name: string) {
	const tpl = `import { NextPage } from 'next';

interface IProps {
}

const ${name}: NextPage<IProps> = ({ }) => {
	return (
		<>
		</>
	)
}

${name}.getInitialProps = async (context) => {
	return {
	};
}

export default ${name};
`;
	return writefileasync(path, tpl);
}
