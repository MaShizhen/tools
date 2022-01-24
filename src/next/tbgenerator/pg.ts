import { join } from 'path';
import { Knex } from 'knex';
import Actor from './db';
import gettype from './gettype';

interface Table {
	table_name: string;
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

export default class PostgresqlTableGenerator extends Actor {
	public constructor(private db: Knex) {
		super();
	}
	public async do(): Promise<void> {
		const db = this.db;
		const tbs = await db.raw<{ rows: Table[]; }>('select relname as table_name,cast(obj_description(relfilenode,\'pg_class\') as varchar) as table_comment from pg_class c where relkind = \'r\' and relname not like \'pg_%\' and relname not like \'sql_%\' order by relname');
		const all = await this.picktable(tbs.rows.map((tb) => {
			return {
				name: tb.table_name,
				alias: tb.table_comment
			};
		}));
		if (all.length === 0) {
			return;
		}
		const a = await Promise.all(all.map(async (it) => {
			const tbname = it.name;
			const tbdesc = it.alias;
			const data = await db.raw<{ rows: Column[]; }>('select a.attnum,(select description from pg_catalog.pg_description where objoid=a.attrelid and objsubid=a.attnum) as column_comment ,a.attname as column_name,pg_catalog.format_type(a.atttypid,a.atttypmod) as data_type from pg_catalog.pg_attribute a where 1=1 and a.attrelid=(select oid from pg_class where relname=?) and a.attnum>0 and not a.attisdropped order by a.attnum;', tbname);
			const fields = data.rows.map((c) => {
				const type = gettype(c.data_type);
				return `	/**
	 * ${c.column_comment}
	 */
	${c.column_name}: ${type};	// ${c.data_type}`;
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
