export async function chain(...args: Array<() => Promise<unknown>>): Promise<void> {
	if (args.length > 0) {
		const [fun, ...other] = args;
		if (!fun) {
			return;
		}

		await fun();
		await chain(...other);
	}
}

export default function forEach<T>(arr: T[], callback: (it: T, i?: number, arr?: T[]) => unknown) {
	const funcs = arr.map((it, i, _arr) => {
		return async () => {
			await callback(it, i, _arr);
		};
	});
	return chain(...funcs);
}
