export default function prefix(pre: string, num: number, len: number) {
	return pre + (Array<string>(len).join('0') + num.toString()).slice(-len);
}
