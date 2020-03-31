import { window } from 'vscode';
import pickoption from '../../util/pickoption';
import getcontainertype from './container-type';

export default async function getpagetype() {
	const picked = await window.showQuickPick([{
		label: '1. 普通页面',
		description: '普通展示页面，包含几乎所有页面逻辑',
		type: 'page'
	}, {
		label: '2. 容器页面',
		description: '组织普通页面的展示方式及顺序',
		type: 'container'
	}], pickoption);
	if (!picked) {
		// 取消操作
		return null;
	}
	if (picked.type === 'page') {
		return 'page';
	}
	return getcontainertype();
}
