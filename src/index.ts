import { ExtensionContext } from 'vscode';
import addtpl from './mm/add-tpl';
import addwebrouters from './mm/add-web-routers';
import list_events from './mm/list-events';
import shell_build from './mm/shell/build';
import create_proj from './mm/shell/create';
import shell_debug from './mm/shell/debug';
import insert_atom from './mm/snippets/insert-atom';
import insert_tpl from './mm/snippets/insert-tpl';
import insert_widget from './mm/snippets/insert-widget';
import list_services from './nodejs/list-services';
import addatom from './mm/add-atom';
import addlocalatom from './mm/add-local-atom';
import addwidget from './mm/add-widget';
import addlocalwidget from './mm/add-local-widget';
import addwebfilter from './mm/add-web-filter';
import addschedule from './mm/add-schedule';
import showsitemap from './mm/sitemap/show';
import refreshsitemap from './mm/sitemap/refresh';
import MM from './mm';

export function activate({ subscriptions }: ExtensionContext) {
	const mm = new MM();
	subscriptions.push(
		mm.addaction(),
		mm.addcomponent(),
		mm.addpage(),
		mm.addservice(),
		addtpl(),
		addwebrouters(),
		insert_atom(),
		insert_tpl(),
		insert_widget(),
		list_events(),
		list_services(),
		shell_debug(),
		shell_build(),
		create_proj(),
		addatom(),
		addlocalatom(),
		addwidget(),
		addlocalwidget(),
		addwebfilter(),
		addschedule(),
		showsitemap(),
		refreshsitemap()
	);
}
