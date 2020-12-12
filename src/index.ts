import { ExtensionContext } from 'vscode';
import create_proj from './mm/shell/create';
import insert_atom from './mm/snippets/insert-atom';
import insert_tpl from './mm/snippets/insert-tpl';
import insert_widget from './mm/snippets/insert-widget';
import list_services from './nodejs/list-services';
import addatom from './mm/add-atom';
import addlocalatom from './mm/add-local-atom';
import addwidget from './mm/add-widget';
import addlocalwidget from './mm/add-local-widget';
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
		mm.addpresentation(),
		mm.addwebrouter(),
		mm.addwebfilter(),
		mm.completion(),
		mm.shellbuild(),
		mm.shelldebug(),
		insert_atom(),
		insert_tpl(),
		insert_widget(),
		list_services(),
		create_proj(),
		addatom(),
		addlocalatom(),
		addwidget(),
		addlocalwidget(),
		addschedule(),
		showsitemap(),
		refreshsitemap()
	);
}
