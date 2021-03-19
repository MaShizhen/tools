import { join } from 'path';
import { Knex } from 'knex';
import Actor from '../../actor';
import gettype from './gettype';

interface Table {
	table_schema: string;
	table_name: string;
	ordinal_position: number;
	table_comment: string;
}

interface Column {
	column_name: string;
	column_default: string;
	is_nullable: string;
	data_type: string;
	column_type: string;
	column_key: string;
	column_comment: string;
	table_schema: string;
	table_name: string;
	ordinal_position: number;
}

export default class MysqlTableGenerator extends Actor {
	public constructor(private db: Knex, private dbname: string) {
		super();
	}
	public async do(): Promise<void> {
		const db = this.db;
		const tb1 = db<Table>('information_schema.tables');
		const tbs = await tb1.select('table_name', 'table_comment').where({
			table_schema: this.dbname
		});
		const picked = await this.pick([{
			label: 'all-all-all',
			detail: 'generate all tables'
		}, ...tbs.map((tb) => {
			return {
				label: tb.table_name,
				detail: tb.table_comment
			};
		})]);
		if (!picked) {
			return;
		}
		const tbname = picked.label;
		if (!tbname) {
			return;
		}
		const all = (() => {
			if (tbname === 'all-all-all') {
				return tbs;
			}
			return [{
				table_name: picked.label,
				table_comment: picked.detail
			}];
		})();
		const [path] = await Promise.all(all.map(async (it) => {
			const tbname = it.table_name;
			const tbdesc = it.table_comment;
			const tb2 = db<Column>('information_schema.columns');
			const data = await tb2.select('column_name', /*'is_nullable',*/ 'data_type', 'column_comment').where({
				table_schema: this.dbname,
				table_name: tbname
			}).orderBy('ordinal_position', 'asc');
			const fields = data.map((c) => {
				const type = gettype(c.data_type);
				return `	/**
	 * ${c.column_comment}
	 */
	${c.column_name}: ${type};`;
			});
			const content = `/**
 * ${tbdesc}
 */
interface ITb${tbname} {
${fields.join('\n')}
}
`;
			const path = join(this.root(), 'src', 'pages', 'api', 'tables', `${tbname}.d.ts`);
			await this.writefile(path, content);
			return path;
		}));
		await this.show_doc(path);
	}
}
