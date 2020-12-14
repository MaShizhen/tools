import Tools from '../tools';

export default class TplUtil extends Tools {
	public atomusage(description: string, no: string, n: number) {
		const arr = new Array<number>(n).fill(0).map((_it, i) => {
			return i + 1;
		});
		const params = arr.map((i) => {
			return `\t\tconst p${i} = $${i};	// 参数注释`;
		});
		const ps = arr.map((i) => {
			return `p${i}`;
		});
		const content = [
			`\t// ${description}`,
			'\t/**',
			// eslint-disable-next-line no-template-curly-in-string
			'\t * ${0:变量注释}',
			'\t */',
			'\tconst r$CURRENT_SECONDS_UNIX = await(() => {',
			...params,
			`\t\treturn ${no.replace(/(@.+\/)?([a-z]+)0+(\d+)/, '$2$3')}(${ps.join(', ')});`,
			'\t})();'
		];
		return content.join('\n');
	}

	public atom(no: string, n: number) {
		const arr = new Array<number>(n).fill(0).map((_it, i) => {
			return i + 1;
		});
		const ps = arr.map((i) => {
			return `param${i}: string`;
		});
		return `
export default function ${no.replace(/(@.+\/)?([a-z]+)0+(\d+)/, '$2$3')}(${ps.join(', ')}) {
}
`;
	}
}
