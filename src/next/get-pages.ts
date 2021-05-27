import { join } from 'path';
import { promises as fs } from 'fs';

export async function get_pages(rootPath: string) {
	const pages = join(rootPath, 'pages');
	if (await existsasync(join(pages, '_app.page.tsx'))) {
		return pages;
	}
	const src = join(rootPath, 'src', 'pages');
	if (await existsasync(join(src, '_app.page.tsx'))) {
		return src;
	}
	throw new Error('Wrong type');
}

async function existsasync(path: string) {
	try {
		await fs.stat(path);
		return true;
	} catch (error) {
		return false;
	}
}
