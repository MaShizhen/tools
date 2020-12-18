import { basename, dirname } from 'path';
import { window, workspace } from 'vscode';
import Actor from '../actor';
import { get_pages } from './get-pages';

export default class AddPageNext extends Actor {
	public async do(): Promise<void> {
		const rootPath = this.root();
		const pages = await get_pages(rootPath);
		const page_dir = (() => {
			const editor = window.activeTextEditor;
			if (!editor) {
				return pages;
			}
			return dirname(editor.document.fileName);
		})();
		const p_path = await this.generate(page_dir, 'pg', '.tsx', 3);
		const name = basename(p_path);
		// create page file
		const pagefile = `${p_path}.tsx`;
		await this.create_page(pagefile, name);
		await workspace.saveAll();
		this.set_status_bar_message('成功添加页面文件');
		this.show_doc(pagefile);
	}

	private create_page(path: string, name: string) {
		const tpl = `import { GetServerSideProps, GetStaticPaths, GetStaticProps, NextPage } from 'next';
import anylogger from 'anylogger';

const logger = anylogger('${name}');

interface IProps {
}

const ${name}: NextPage<IProps> = ({ }) => {
	return (
		<>
		</>
	);
};

${name}.getInitialProps = async (context) => {
	return Promise.resolve({
	});
};

export const getStaticProps: GetStaticProps<IProps> = async (context) => {
	return Promise.resolve({
		props: {}
	});
};

export const getStaticPaths: GetStaticPaths = async () => {
	return {
		fallback: true,
		paths: []
	};
};

export const getServerSideProps: GetServerSideProps<IProps> = async (context) => {
	return Promise.resolve({
		props: {}
	});
};

export default ${name};
`;
		return this.writefile(path, tpl);
	}
}
