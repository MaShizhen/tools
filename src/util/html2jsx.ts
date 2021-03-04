import { HTMLElement, Node, NodeType, parse } from 'node-html-parser';

export default function html2jsx(html: string) {
	if (!html) {
		return '';
	}
	const root = parse(html);
	const cs = [] as string[];
	const ret = trans(cs, root);
	const text = ret.text;
	if (cs.length === 0) {
		return text;
	}
	const styles = cs.join('\n');
	const jsx = `<>
${ret.text}
<style jsx>{\`
${styles}
\`}</style>
</>`;
	return jsx;
}

function isel(node: Node): node is HTMLElement {
	return node.nodeType === NodeType.ELEMENT_NODE;
}

function trans(cs: string[], node: Node, no = 0) {
	let text = '';
	if (isel(node)) {
		const cls = node.classNames || [];
		node.removeAttribute('class');
		const style = node.getAttribute('style');
		if (style) {
			const s = `s${(++no).toString().padStart(3, '0')}`;
			cls.push(s);
			cs.push(`.${s} { ${style} }`);
		}
		node.removeAttribute('style');
		if (cls.length > 0) {
			node.setAttribute('className', cls.join(' '));
		}
		let innerHTML = '';
		if (node.childNodes.length > 0) {
			innerHTML = node.childNodes.map((node) => {
				const ret = trans(cs, node, no);
				no = ret.no;
				return ret.text;
			}).join('');
		}
		if (node.tagName) {
			const tag = node.tagName.toLowerCase();
			const attrs = node.rawAttributes;
			// Update rawString
			const rawAttrs = Object.keys(attrs).map((name) => {
				const val = JSON.stringify(attrs[name]);
				if (val === undefined || val === 'null') {
					return name;
				}
				return `${name}=${val}`;
			}).join(' ');
			const is_void = /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/i.test(tag);
			const attrsstr = rawAttrs ? ` ${rawAttrs}` : '';
			if (is_void) {
				text = `<${tag}${attrsstr} />`;
			} else {
				text = `<${tag}${attrsstr}>${innerHTML}</${tag}>`;
			}
		} else {
			text = innerHTML;
		}
	} else {
		text = node.innerText;
	}

	return { no, text };
}
