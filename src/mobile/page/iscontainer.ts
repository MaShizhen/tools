import { join } from 'path';
import { existsasync, readfileasync } from '../../util/fs';

export default async function iscontainer(dir: string) {
	const p = join(dir, 'p.ts');
	if (!await existsasync(p)) {
		return false;
	}
	const content = await readfileasync(p);
	return /import\s+{\s+container\s+}\s+from\s+['"]@mmstudio\/mobile['"]/.test(content);
}
