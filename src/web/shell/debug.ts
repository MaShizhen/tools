import run from '../../util/terminal';

export default function debug() {
	const command = 'npm t';
	run(command, 'debug');
}
