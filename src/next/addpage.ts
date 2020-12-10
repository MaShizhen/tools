import { basename } from 'path';
import { Uri, window, workspace } from 'vscode';
import { writefileasync } from '../util/fs';
import generate from '../util/generate';
import { get_pages } from './get-pages';

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

function create_page(path: string, name: string) {
	const tpl = `import { NextPage, GetStaticProps, GetStaticPaths, GetServerSideProps } from 'next';

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

export const getStaticProps: GetStaticProps = async (context) => {
  // ...
}

export const getStaticPaths: GetStaticPaths = async () => {
  // ...
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  // ...
}

export default ${name};
`;
	return writefileasync(path, tpl);
}
