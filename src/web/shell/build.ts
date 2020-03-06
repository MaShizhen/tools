import run from '../../util/terminal';

export default function build() {
	const command = "npm version '1.0.'$(date +%Y%m%d%H%M) && npm run build:n && npm run build && git commit -am 'build' && npm publish";
	run(command, 'build');
}
