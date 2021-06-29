export default function gettype(type: string) {
	switch (type) {
		case 'bigint':
			return 'number;	// bigint';
		case 'int':
		case 'integer':
		case 'decimal':
		case 'smallint':
		case 'float':
		case 'tinyint':
		case 'double':
		case 'real':
			return 'number';
		case 'char':
		case 'varchar':
		case 'longtext':
		case 'text':
		case 'time':
		case 'tinytext':
			return 'string';
		case 'date':
		case 'datetime':
		case 'timestamp':
			return 'Date';
		case 'blob':
		case 'enum':
		case 'longblob':
		default:
			return 'unknown';
	}
}
