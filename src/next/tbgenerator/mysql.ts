import { join } from 'path';
import { Knex } from 'knex';
import Actor from './db';
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
		const all = await this.picktable(tbs.map((tb) => {
			return {
				name: tb.table_name || tb.TABLE_NAME,
				alias: tb.table_comment || tb.TABLE_COMMENT
			};
		}));
		if (all.length === 0) {
			return;
		}
		const a = await Promise.all(all.map(async (it) => {
			const tbname = it.name;
			const tbdesc = it.alias;
			const tb2 = db<Column>('information_schema.columns');
			const data = await tb2.select('column_name', /*'is_nullable',*/ 'data_type', 'column_comment').where({
				table_schema: this.dbname,
				table_name: tbname
			}).orderBy('ordinal_position', 'asc') as Column[];
			const fields = data.map((c) => {
				const fieldtype = c.data_type || c.DATA_TYPE;
				const type = gettype(fieldtype);
				return `	/**
	 * ${c.column_comment || c.COLUMN_COMMENT}
	 */
	${c.column_name || c.COLUMN_NAME}: ${type};	// ${fieldtype}`;
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
			return {
				path,
				tbname
			};
		}));
		await this.savedb(a.map((it) => {
			return it.tbname;
		}));
		await this.show_doc(a[0].path);
	}
}
