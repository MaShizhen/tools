import { basename, dirname } from 'path';
import { TextEditor, window, workspace } from 'vscode';
import Actor from '../actor';
import { get_pages } from './get-pages';

export default class AddPageNext extends Actor {
	public do(_editor: TextEditor): Promise<void> {
		throw new Error('Method not implement_ed.');
	}
	public async act(): Promise<void> {
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

export const getStaticProps: GetStaticProps = async (context) => {
	// ...
};

export const getStaticPaths: GetStaticPaths = async () => {
	// ...
};

export const getServerSideProps: GetServerSideProps = async (context) => {
	// ...
};

export default ${name};
`;
		return this.writefileasync(path, tpl);
	}
}