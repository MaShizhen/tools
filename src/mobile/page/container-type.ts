import { window } from 'vscode';

//  'drawer' | 'bottom-tab' | 'material-bottom-tab' | 'material-top-tab'
export default async function getcontainertype() {
	const type = await window.showQuickPick([{
		label: '1.压栈式',
		description: '页面分层上下覆盖，返回时从最上层向前返回至最底层页面',
		detail: 'https://reactnavigation.org/docs/stack-navigator',
		type: 'stack'
	}, {
		label: '2.侧边划出式',
		description: '可使用手势从一侧拖动打开和关闭页面',
		detail: 'https://reactnavigation.org/docs/drawer-navigator',
		type: 'drawer'
	}, {
		label: '3.底部tab页',
		description: '常用的主页显示形式，底部为tab页，可切换',
		detail: 'https://reactnavigation.org/docs/bottom-tab-navigator',
		type: 'bottom-tab'
	}, {
		label: '4.增强型底部tab页',
		description: '底部为tab页，带手势特效，延迟加载',
		detail: 'https://reactnavigation.org/docs/material-bottom-tab-navigator',
		type: 'material-bottom-tab'
	}, {
		label: '5.顶部tab页',
		description: '顶部为tab页，带手势特效，延迟加载',
		detail: 'https://reactnavigation.org/docs/material-top-tab-navigator',
		type: 'material-top-tab'
	}], {
		matchOnDescription: true,
		matchOnDetail: true,
		canPickMany: false,
		ignoreFocusOut: true
	});
	if (!type) {
		return null;
	}
	return type.type;
}
