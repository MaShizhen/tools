export default function tplatom(no: string, n: number) {
	const arr = new Array<number>(n).fill(0).map((_it, i) => {
		return i + 1;
	});
	const ps = arr.map((i) => {
		return `param${i}: string`;
	});
	return `
export default async function ${no.replace(/([a-z]+)0+(\d+)/, '$1$2')}(${ps.join(', ')}) {
}
`;
}
