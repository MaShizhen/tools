
export default function tplwebwidget(no: string, project: boolean) {
	no = no.replace(/[a-z]*/, '');
	const prefix = project ? 'mm-p' : 'mm-';
	const tag = `${prefix}${no}`;
	return `import on, { emit } from '@mmstudio/on';

const no = '${tag}';

/**
 * :host表示选中当前组件,使用all:initial;属性,
 * 当外部有css样式要越过shadowDom边界时将该css样式重置为初始值,从而不在影响shaowDom内部的样式.
 * 参考链接https://developers.google.cn/web/fundamentals/web-components/shadowdom#reset,
 * 使用 ${no} 作为所有样式类的前缀可以作为前置限定，从而避免某些浏览器对shadowdom支持不好，样式错乱的问题,
 * tpl 中可以添加link标签，但是最好使用公网可以访问到的cdn连接，且一定要保证版本号固定，如<link rel="stylesheet" href="//cdn.jsdelivr.net/npm/jstree@3.3.7/dist/themes/default/style.min.css" />
 */
const tpl = \`
<style>
.$\{no} {
	width: 100%;
	height: inherit;
	overflow: hidden;
	position: relative;
}
:host {
	all: initial;
}
</style>

<div class="$\{no}">
	<div id="n01">Hello <a href="https://mm-edu.gitee.io/">mmstudio</a></div>
</div>
\`;

export default class Widget extends HTMLElement {
	public constructor() {
		super();
		const dom = this.attachShadow({ mode: 'closed' });
		dom.innerHTML = tpl;
		const s = this.getAttribute('sattr');
		const n = dom.querySelector<HTMLDivElement>('#n01')!;
		on(n, 'click', () => {
			emit(this, 'mmwe-click', true, true);
		});
		emit(this, 'mmwe-init', true, true, {
			data: {
				id: this.id
			}
		});
		alert(\`widget $\{no} inited, attribte: sattr = $\{s} \`);
	}
	/**
	 * 方法注释
	 * @param param 参数注释
	 */
	public method01(param: string) {
		window.console.debug('this is a public method', param);
		this.method02(param);
	}
	private method02(param: string) {
		alert(\`This is a private method: $\{param}\`);
	}
}

if (!window.customElements.get(no)) {
	window.customElements.define(no, Widget);
}

`;
}
