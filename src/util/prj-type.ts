import { workspace } from 'vscode';

export enum PrjType {
	web = 'web/h5',
	wxapp = 'wxapp',
	desktop = 'desktop',
	mobile = 'mobile',
	serve = 'serve'
}

export default function prj_type() {
	return workspace.getConfiguration().get<PrjType>('mm.proj.type');
}
