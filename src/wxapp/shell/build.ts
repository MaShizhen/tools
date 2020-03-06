import run from '../../util/terminal';

export default function build() {
	const command = "npm version '1.0.'$(date +%Y%m%d%H%M) && npm run build && npm publish";
	return run(command, 'build');
}
