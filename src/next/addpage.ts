import { basename, join } from 'path';
import { Uri, window, workspace } from 'vscode';
import { existsasync, writefileasync } from '../util/fs';
import generate from '../util/generate';

export default async function addpagenext(rootPath: string) {
	const pages = join(rootPath, 'pages');
	if (!await existsasync(join(pages, '_app.tsx'))) {
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
