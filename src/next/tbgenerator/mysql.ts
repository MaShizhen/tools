import { join } from 'path';
import { Knex } from 'knex';
import Actor from '../../actor';
import gettype from './gettype';

interface Table {
	table_schema: string;
	TABLE_SCHEMA: string;
	table_name: string;
	TABLE_NAME: string;
	ordinal_position: number;
	ORDINAL_POSITION: number;
	table_comment: string;
	TABLE_COMMENT: string;
}

interface Column {
	column_name: string;
	COLUMN_NAME: string;
	column_default: string;
	COLUMN_DEFAULT: string;
	is_nullable: string;
	IS_NULLABLE: string;
	data_type: string;
	DATA_TYPE: string;
	column_type: string;
	COLUMN_TYPE: string;
	column_key: string;
	COLUMN_KEY: string;
	column_comment: string;
	COLUMN_COMMENT: string;
	table_schema: string;
	TABLE_SCHEMA: string;
	table_name: string;
	TABLE_NAME: string;
	ordinal_position: number;
	ORDINAL_POSITION: number;
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
		}) as Table[];
		const picked = await this.pick([{
			label: 'all-all-all',
			detail: 'generate all tables'
		}, ...tbs.map((tb) => {
			return {
				label: tb.table_name || tb.TABLE_NAME,
				detail: tb.table_comment || tb.TABLE_COMMENT
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
				TABLE_NAME: picked.label,
				table_comment: picked.detail,
				TABLE_COMMENT: picked.detail
			}];
		})();
		const [path] = await Promise.all(all.map(async (it) => {
			const tbname = it.table_name || it.TABLE_NAME;
			const tbdesc = it.table_comment || it.TABLE_COMMENT;
			const tb2 = db<Column>('information_schema.columns');
			const data = await tb2.select('column_name', /*'is_nullable',*/ 'data_type', 'column_comment').where({
				table_schema: this.dbname,
				table_name: tbname
			}).orderBy('ordinal_position', 'asc') as Column[];
			const fields = data.map((c) => {
				const type = gettype(c.data_type || c.DATA_TYPE);
				return `	/**
	 * ${c.column_comment || c.COLUMN_COMMENT}
	 */
	${c.column_name || c.COLUMN_NAME}: ${type};`;
			});
			const content = `/**
 * ${tbdesc}
 */
interface ITb${tbname} {
${fields.join('\n')}
}
`;
			const path = join(this.root(), 'src', 'tables', `${tbname}.d.ts`);
			await this.writefile(path, content);
			return path;
		}));
		await this.show_doc(path);
	}
}
