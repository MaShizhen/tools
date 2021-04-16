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
			label: '2. client',
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
		const name = await window.showInputBox({
			prompt: 'type pagename',
			placeHolder: 'page name',
			value: await this.generate(dir, 'pg', 3)
		});
		if (!name) {
			return;
		}
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
		const body = await this.body();
		const tpl = `import { GetStaticPaths, GetStaticProps, NextPage, PageConfig } from 'next';
${body}
// // enables server-side rendering, this enable seo
// page.getInitialProps = async (context) => {
// 	const ${slug} = context.params.${slug} as string;
// 	return {
// 	};
// };

// pre-render this page at build time
export const getStaticProps: GetStaticProps<IProps> = async () => {
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
		const body = await this.body();
		const tpl = `import { GetStaticPaths, GetStaticProps, NextPage, PageConfig } from 'next';
${body}
// // enables server-side rendering, this enable seo
// page.getInitialProps = async (context) => {
// 	const ${query} = context.params.${query} as string;
// 	return {
// 	};
// };

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
		const body = await this.body();
		const tpl = `import { GetStaticProps, NextPage, PageConfig } from 'next';
${body}
// // enables server-side rendering, this enable seo
// page.getInitialProps = async (context) => {
// 	return {
// 	};
// };
// pre-render this page at build time
export const getStaticProps: GetStaticProps<IProps> = async () => {
	return {
		props: {},
		revalidate: 60 * 60 * 24 // 1 day
	};
};

`;
		await this.writefile(path, tpl);
		return path;
	}
	private async createpageclientside(dir: string, name: string) {
		const path = join(dir, `${name}.tsx`);
		const body = await this.body();
		const tpl = `import { GetServerSideProps, NextPage, PageConfig } from 'next';
${body}
// pre-render this page on each request
export const getServerSideProps: GetServerSideProps<IProps> = async () => {
	return {
		props: {}
	};
};
`;
		await this.writefile(path, tpl);
		return path;
	}

	private async body() {
		const title = await window.showInputBox({
			prompt: '页面标题',
			value: '01factory'
		});
		const input = await window.showInputBox({
			prompt: '组件个数',
			value: '0'
		});
		const num = Number(input) || 0;
		const csno = new Array<string>(num).fill('').map((_it, idx) => {
			return this.prefix('C', idx + 1, 3);
		});
		const csfun = csno.map((c) => {
			return `
function ${c}() {
	return <>
		组件${c}
	</>;
}`;
		});
		const cs = csno.map((c) => {
			return `<${c}></${c}>`;
		});
		// const relativepath = this.getrelativepath('src', path);
		// const logger = anylogger('${relativepath.replace('.tsx', '')}');
		return `import Head from 'next/head';
import { useEffect, useState } from 'react';

interface IProps {
}

/**
 * ${title || 'mmstudio'}
 */
const page: NextPage<IProps> = () => {
	return (
		<>
			<Head>
				<title>${title || '01factory'}</title>
				<link rel="shortcut icon" href="/favicon.ico" type="image/x-icon"></link>
				<link rel="icon" type="image/x-icon" sizes="32x32" href="/favicon-32x32.ico" ></link>
				<link rel="icon" type="image/x-icon" sizes="16x16" href="/favicon-16x16.ico"></link>
			</Head>
			${cs.join('\n\t\t\t')}
		</>
	);
};

export const config: PageConfig = {
	amp: false
};

export default page;

${csfun.join('\n')}
`;
	}
}
