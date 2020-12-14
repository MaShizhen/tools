import Tools from '../tools';

export default class TplMobile extends Tools {
	public widget(no: string) {
		const tag = no.toUpperCase();
		return `import React from 'react';

interface IProps {
}

export default function ${tag}(props: IProps) {
	return <>
	</>;
}
`;
	}
	public widgetusage(no: string) {
		const tag = no.toUpperCase();
		return `<${tag}></${tag}>`;
	}
}
