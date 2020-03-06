import { get as base } from 'https';

export default function get(url: string) {
	return new Promise<string>((resolve, reject) => {
		base(url, (res) => {
			const { statusCode } = res;
			// const contentType = res.headers['content-type'];

			let error;
			if (statusCode !== 200) {
				error = new Error('Request Failed.\n' +
					`Status Code: ${statusCode}`);
				// } else if (!/^text/.test(contentType)) {
				// 	error = new Error('Invalid content-type.\n' +
				// 		`Expected text but received ${contentType}`);
			}
			if (error) {
				console.error(error.message);
				reject(error);
				// Consume response data to free up memory
				res.resume();
				return;
			}

			res.setEncoding('utf8');
			let rawData = '';
			res.on('data', (chunk) => { rawData += chunk; });
			res.on('end', () => {
				resolve(rawData);
			});
		});
	});
}
