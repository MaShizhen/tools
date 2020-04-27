export default function prefix(pre: string, num: number, len: number) {
	return pre + num.toString().padStart(len, '0');
}
