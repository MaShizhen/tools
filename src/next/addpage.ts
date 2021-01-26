import { dirname, join } from 'path';
import { window } from 'vscode';
import Actor from '../actor';
import { get_pages } from './get-pages';

export default class AddPageNext extends Actor {
	public async do(): Promise<void> {
		const rootPath = this.root();
		const pages = await get_pages(rootPath);
		const dir = (() => {
			const editor = window.activeTextEditor;
			if (!editor) {
				return pages;
			}
			const dir = dirname(editor.document.fileName);
			if (!/pages/.test(dir)) {
				return pages;
			}
			if (/pg\d{3,}/.test(dir)) {
				return join(dir, '..');
			}
			return dir;
		})();
		const picked = await this.pick([{
			label: '1. ssr',
			detail: 'Server side render page',
			description: 'pgxxx.tsx',
			type: 1
		}, {
			label: '2. Page',
			detail: 'Client side render page',
			description: 'pgxxx.tsx',
			type: 2
		}, {
			label: '3. ssr query Page',
			detail: 'Query page like pgxxx/yyy',
			description: 'pgxxx/[id]',
			type: 3
		}, {
			label: '4. ssr slug query page',
			detail: 'Slug page like pgxxx/yyy, pgxxx/yyy/zzz,...',
			description: 'pgxxx/[...slug]',
			type: 4
		}]);
		if (!picked) {
			return;
		}
		const name = await this.generate(dir, 'pg', 3);
		// create page file
		const path = await (async () => {
			switch (picked.type) {
				case 1:
					return this.createpageserverside(dir, name);
				case 2:
					return this.createpageclientside(dir, name);
				case 3:
					return this.createpagestaticquery(dir, name);
				case 4:
					return this.createpagessrslug(dir, name);
				default:
					return null;
			}
		})();
		if (!path) {
			return;
		}
		await this.save();
		this.set_status_bar_message('成功添加页面文件');
		await this.show_doc(path);
	}

	private async createpagessrslug(dir: string, name: string) {
		const path = join(dir, name);
		await this.mkdir(path);
		const slug = await window.showInputBox({
			prompt: 'Please type query name',
			placeHolder: 'Type query name like `slug`',
			value: 'slug'
		});
		if (!slug) {
			return null;
		}

		const file = join(path, `[...${slug}].tsx`);
		const body = await this.body(file, name);
		const tpl = `import { GetStaticPaths, GetStaticProps, NextPage, PageConfig } from 'next';
${body}
// pre-render this page at build time
export const getStaticProps: GetStaticProps<IProps> = async (context) => {
	const ${slug} = context.params.${slug} as string[];
	return {
		props: {},
		revalidate: 60 * 60 * 24 // 1 day
	};
};

export const getStaticPaths: GetStaticPaths<{ ${slug}: string[]; }> = async () => {
	return {
		fallback: true,
		paths: [{
			params: {
				${slug}: []
			}
		}]
	};
};
`;
		await this.writefile(file, tpl);
		return file;
	}

	private async createpagestaticquery(dir: string, name: string) {
		const path = join(dir, name);
		await this.mkdir(path);
		const query = await window.showInputBox({
			prompt: 'Please type query name',
			placeHolder: 'Type query name like `id`',
			value: 'id'
		});
		if (!query) {
			return null;
		}

		const file = join(path, `[${query}].tsx`);
		const body = await this.body(file, name);
		const tpl = `import { GetStaticPaths, GetStaticProps, NextPage, PageConfig } from 'next';
${body}
// pre-render this page at build time
export const getStaticProps: GetStaticProps<IProps> = async (context) => {
	const ${query} = context.params.${query} as string;
	return {
		props: {},
		revalidate: 60 * 60 * 24 // 1 day
	};
};

export const getStaticPaths: GetStaticPaths<{ ${query}: string; }> = async () => {
	return {
		fallback: true,
		paths: [{
			params: {
				${query}: 'xxx'
			}
		}]
	};
};
`;
		await this.writefile(file, tpl);
		return file;
	}

	private async createpageserverside(dir: string, name: string) {
		const path = join(dir, `${name}.tsx`);
		const body = await this.body(path, name);
		const tpl = `import { NextPage, PageConfig } from 'next';
${body}
// enables server-side rendering, this enable seo
${name}.getInitialProps = async (context) => {
	return {
	};
};
`;
		await this.writefile(path, tpl);
		return path;
	}
	private async createpageclientside(dir: string, name: string) {
		const path = join(dir, `${name}.tsx`);
		const body = await this.body(path, name);
		const tpl = `import { GetServerSideProps, NextPage, PageConfig } from 'next';
${body}
// pre-render this page on each request
export const getServerSideProps: GetServerSideProps<IProps> = async (context) => {
	return {
		props: {}
	};
};
`;
		await this.writefile(path, tpl);
		return path;
	}

	private async body(path: string, name: string) {
		const title = await window.showInputBox({
			prompt: '页面标题',
			value: 'mmstudio'
		});
		const input = await window.showInputBox({
			prompt: '组件个数',
			value: '1'
		});
		const num = Number(input) || 0;
		const csno = new Array<string>(num).fill('').map((_it, idx) => {
			return this.prefix('C', idx + 1, 3);
		});
		const csfun = csno.map((c) => {
			return `
// function ${c}(props: { prop: string;}) {
function ${c}() {
	return <>组件${c}</>;
}`;
		});
		const cs = csno.map((c) => {
			return `<${c} />`;
		});
		const relativepath = this.getrelativepath('src', path);
		return `import anylogger from 'anylogger';
import Head from 'next/head';

const logger = anylogger('${relativepath}');

interface IProps {
}
${csfun.join('\n')}

/**
 * ${title || 'mmstudio'}
 */
const ${name}: NextPage<IProps> = ({ }) => {
	return (
		<>
			<Head>
				<title>${title || 'mmstudio'}</title>
			</Head>
			${cs.join('\n\t\t\t')}
		</>
	);
};

export const config: PageConfig = {
	amp: false
};

export default ${name};
`;
	}
}
