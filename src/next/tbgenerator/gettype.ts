export default function gettype(type: string) {
	if (/character\svarying\(\d+\)/.test(type)) {
		return 'string';
	}
	if (/character\(\d+\)/.test(type)) {
		return 'string';
	}
	if (/geometry\(.+\)/.test(type)) {
		return 'unknown';
	}
	if (/numeric\(\d+,\d\)/.test(type)) {
		return 'number';
	}
	switch (type) {
		case 'bigint':
			return 'number';
		case 'int':
		case 'integer':
		case 'decimal':
		case 'smallint':
		case 'float':
		case 'tinyint':
		case 'double':
		case 'double precision':
		case 'real':
			return 'number';
		case 'char':
		case 'varchar':
		case 'longtext':
		case 'text':
		case 'time':
		case 'tinytext':
		case 'cstring':
		case 'name':
		case '"char"':
		case 'oid':
		case 'xid':
			return 'string';
		case 'date':
		case 'datetime':
		case 'timestamp':
			return 'Date';
		case 'boolean':
			return 'boolean';
		case 'timestamp with time zone':
			return 'Date';
		case 'double precision[]':
			return 'number[]';
		case 'boolean[]':
		case 'oid[]':
		case 'text[]':
		case '"char"[]':
			return 'string[]';
		case 'real[]':
		case 'aclitem[]':
		case 'anyarray':
			return 'unknown[]';
		case 'bytea':
		case 'geometry':
		case 'information_schema.sql_identifier':
		case 'information_schema.cardinal_number':
		case 'information_schema.character_data':
		case 'information_schema.yes_or_no':
		case 'information_schema.time_stamp':
		case 'blob':
		case 'enum':
		case 'longblob':
		case 'json':
		case 'binary':
		case 'varbinary':
		case 'set':
		default:
			return 'unknown';
	}
}
