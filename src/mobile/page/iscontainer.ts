import { join } from 'path';
import { existsSync, readFileSync } from '../../util/fs';

export default async function iscontainer(dir: string) {
	const p = join(dir, 'p.ts');
	if (!await existsSync(p)) {
		return false;
	}
	const content = await readFileSync(p);
	return /import\s+{\s+container\s+}\s+from\s+['"]@mmstudio\/mobile['"]/.test(content);
}
