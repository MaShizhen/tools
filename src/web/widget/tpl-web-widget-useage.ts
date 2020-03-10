
export default function tplwidgetusage(no: string, project: boolean) {
	no = no.replace(/\w*/, '');
	const prefix = project ? 'mm-p' : 'mm-';
	const tag = `${prefix}${no}`;
	return `<${tag} data-mm-id="${no}"></${tag}>`;
}
