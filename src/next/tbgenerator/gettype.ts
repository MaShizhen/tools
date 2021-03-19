export default function gettype(type: string) {
	switch (type) {
		case 'bigint':
			return 'bigint';
		case 'int':
		case 'decimal':
		case 'smallint':
		case 'float':
		case 'tinyint':
		case 'double':
			return 'number';
		case 'varchar':
		case 'longtext':
		case 'text':
			return 'string';
		case 'datetime':
			return 'Date';
		case 'blob':
		case 'enum':
		case 'longblob':
		default:
			return 'unknown';
	}
}
