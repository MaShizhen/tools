import { commands, window } from 'vscode';
import prj_type, { PrjType } from '../../util/prj-type';
import sitemapweb from '../../web/sitemap';
import sitemapmobile from '../../mobile/sitemap';
import sitemapwx from '../../wxapp/sitemap';

export default function refreshsitemap() {
	return commands.registerCommand('mm.refreshmap', async () => {
		const type = prj_type();
		switch (type) {
			case PrjType.web:
				await sitemapweb();
				break;
			case PrjType.wxapp:
				await sitemapwx();
				break;
			case PrjType.desktop:
				break;
			case PrjType.mobile:
				await sitemapmobile();
				break;
			default:
				await window.showErrorMessage('请打开项目后操作');
				throw new Error('请打开项目后操作');
		}
		await commands.executeCommand('mm.showmap');
	});
}
