async function chain_filter<T>(initial_value: T[], ...args: Array<[() => Promise<boolean>, T]>): Promise<T[]> {
	if (args.length > 0) {
		const [first, ...other] = args;
		if (!first) {
			return initial_value;
		}
		const [fun, item] = first;

		const ret = await fun();
		if (ret) {
			initial_value.push(item);
		}
		return chain_filter(initial_value, ...other);
	}
	return initial_value;
}

export default function filter<T>(arr: T[], callback: (it: T, i?: number, arr?: T[]) => boolean | Promise<boolean>) {
	const funcs = arr.map((it, i, _arr) => {
		return [
			async () => {
				try {
					return await callback(it, i, _arr);
				} catch {
					return false;
				}
			},
			it
		] as [() => Promise<boolean>, T];
	});
	return chain_filter([], ...funcs);
}
