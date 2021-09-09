import { basename, join } from 'path';
import { commands, window } from 'vscode';
import Actor from '../actor';

export default class AddPageNext extends Actor {
	public async do(d?: string): Promise<void> {
		const defaultdir = await (async () => {
			const page = join(this.root(), 'src', 'pages');
			const dir = await this.getcurpath(d, page);
			if (!dir) {
				return page;
			}
			if (!/pages/.test(dir)) {
				return page;
			}
			if (/pages[/\\]api[/\\]?/.test(dir)) {
				return page;
			}
			return dir;
		})();
		const picked = await this.pick([{
			label: '1. Nomal',
			detail: 'Nomal page',
			description: 'pgxxx',
			type: 1
		}, {
			label: '2. query Page',
			detail: 'Query page like pgxxx/yyy',
			description: 'pgxxx/[id]',
			type: 2
		}, {
			label: '3. slug query page',
			detail: 'Slug page like pgxxx/yyy, pgxxx/yyy/zzz,...',
			description: 'pgxxx/[...slug]',
			type: 3
		}]);
		if (!picked) {
			return;
		}
		const tmp = await (async () => {
			if (/pages$/.test(defaultdir)) {
				const name = await this.generate(defaultdir, 'pg', 3);
				return join(defaultdir, name);
			}
			const files = await this.readdir(defaultdir);
			const isinpagedir = files.some((file) => {
				return /^(index\.page|\[[^.]*\]|\[\.\.\.[^.]*\])\.tsx$/.test(file);
			});
			if (isinpagedir) {
				const exist = files.some((file) => {
					if (picked.type === 1) {
						return /^index\.page\.tsx$/.test(file);
					}
					if (picked.type === 2) {
						return /^\[[^.]*\]\.page\.tsx$/.test(file);
					}
					if (picked.type === 3) {
						return /^\[\.\.\.[^.]*\]\.page\.tsx$/.test(file);
					}
					return false;
				});
				const dir = this.getdir(defaultdir);
				if (!exist) {
					const name = basename(defaultdir);
					return join(dir, name);
				}
				const name = await this.generate(dir, 'pg', 3);
				return join(dir, name);
			}
			const name = await this.generate(defaultdir, 'pg', 3);
			return join(defaultdir, name);
		})();
		if (!tmp) {
			return;
		}
		const path = await window.showInputBox({
			prompt: 'type page path',
			placeHolder: 'page path',
			value: tmp
		});
		if (!path) {
			return;
		}
		// create page file
		const filepath = await (async () => {
			switch (picked.type) {
				case 1:
					return this.createnomalpage(path);
				case 2:
					return this.createpagestaticquery(path);
				case 3:
					return this.createpagessrslug(path);
				default:
					return null;
			}
		})();
		if (!filepath) {
			return;
		}
		await this.save();
		this.set_status_bar_message('成功添加页面文件');
		await this.show_doc(filepath);
		await commands.executeCommand('mm.regeneratepages');
	}

	private async createpagessrslug(dir: string) {
		const slug = await window.showInputBox({
			prompt: 'Please type query name',
			placeHolder: 'Type query name like `slug`',
			value: 'slug'
		});
		if (!slug) {
			return null;
		}

		const file = join(dir, `[...${slug}].page.tsx`);
		const body = await this.body();
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

	private async createpagestaticquery(dir: string) {
		const query = await window.showInputBox({
			prompt: 'Please type query name',
			placeHolder: 'Type query name like `id`',
			value: 'id'
		});
		if (!query) {
			return null;
		}

		const file = join(dir, `[${query}].page.tsx`);
		const body = await this.body();
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

	private async createnomalpage(dir: string) {
		const filepath = join(dir, 'index.page.tsx');
		const body = await this.body();
		const tpl = `import { NextPage, PageConfig } from 'next';
${body}
`;
		await this.writefile(filepath, tpl);
		return filepath;
	}

	private async body() {
		const title = await window.showInputBox({
			prompt: '页面标题',
			value: '01factory'
		});
		// const relativepath = this.getrelativepath('src', path);
		// const logger = anylogger('${relativepath.replace('.tsx', '')}');
		return `import Head from 'next/head';
import { useEffect, useState } from 'react';

interface IProps {
}

/**
 * ${title || '01factory'}
 */
const Page: NextPage<IProps> = () => {
	return (
		<>
			<Head>
				<title>${title || '01factory'}</title>
			</Head>
		</>
	);
};

export const config: PageConfig = {
	amp: false
};

export default Page;
`;
	}
}
