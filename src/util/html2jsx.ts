import { HTMLElement, Node, NodeType, parse } from 'node-html-parser';

export default function html2jsx(html: string) {
	if (!html) {
		return '';
	}
	const root = parse(html);
	const cs = [] as string[];
	trans(cs, root);
	if (cs.length === 0) {
		return html;
	}
	const styles = cs.join('\n');
	const jsx = `<>
${root.toString()}
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
		if (node.childNodes.length > 0) {
			node.childNodes.forEach((node) => {
				no = trans(cs, node, no);
			});
		}
	}
	return no;
}
