import { join } from 'path';
import Actor from '../../actor';

interface ITable {
	name: string;
	alias: string;
}

export default abstract class Db extends Actor {
	protected async picktable(tbs: ITable[]) {
		const picked = await this.pick([{
			label: 'all-all-all',
			detail: 'generate all tables'
		}, ...tbs.map((tb) => {
			return {
				label: tb.name,
				detail: tb.alias
			};
		})]);
		if (!picked) {
			return [];
		}
		const tbname = picked.label;
		if (!tbname) {
			return [];
		}
		if (tbname === 'all-all-all') {
			return tbs;
		}
		return [{
			name: picked.label,
			alias: picked.detail
		}];
	}
	protected async savedb(names: string[]) {
		const file = join(this.root(), 'src', 'atoms', 'db.ts');
		const content = await (async () => {
			try {
				return await this.readfile(file);
			} catch {
				return `import an49 from '@mmstudio/an000049';

const db = an49();
`;
			}
		})();
		const all = names.reduce((pre, cur) => {
			const fun = `
export function tb${cur}() {
	return db<ITb${cur}>('${cur}');
}
`;
			if (!content.includes(fun)) {
				return pre + fun;
			}
			return pre;
		}, content);
		await this.writefile(file, all);
	}
}
