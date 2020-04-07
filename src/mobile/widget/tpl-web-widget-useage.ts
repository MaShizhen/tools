
export default function tplwidgetusage(no: string, project: boolean) {
	no = no.replace(/[a-z]*/, '');
	const prefix = project ? 'MMP' : 'MM';
	const tag = `${prefix}${no}`;
	return `<${tag}"></${tag}>`;
}
