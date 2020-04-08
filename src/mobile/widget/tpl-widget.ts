
export default function tplwebwidget(no: string) {
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
