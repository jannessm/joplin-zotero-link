import joplin from 'api';
import { ContentScriptType } from 'api/types';
import * as http from 'http';

import { registerSettings, SETTING } from './settings';

interface ZoteroSettings {
	port: string;
	customFormat: string;
}

interface JsonRequestOptions {
	method?: 'GET' | 'POST';
	headers?: Record<string, string>;
	body?: string;
}

async function getSettings(): Promise<ZoteroSettings> {
	const port = await joplin.settings.value(SETTING.Port);
	const customFormat = await joplin.settings.value(SETTING.CustomFormat);

	return {
		port: String(port || '23119').trim() || '23119',
		customFormat: String(customFormat || '[<title>](<zoterolink>)'),
	};
}

async function requestJson(url: string, options: JsonRequestOptions = {}): Promise<any | undefined> {
	return new Promise<any | undefined>((resolve) => {
		try {
			const req = http.request(url, {
				method: options.method || 'GET',
				headers: options.headers || {},
			}, (res) => {
				let body = '';
				res.setEncoding('utf8');
				res.on('data', chunk => body += chunk);
				res.on('error', () => resolve(undefined));
				res.on('aborted', () => resolve(undefined));
				res.on('end', () => {
					const statusCode = res.statusCode || 0;
					if (statusCode < 200 || statusCode >= 300) {
						resolve(undefined);
						return;
					}

					try {
						resolve(body ? JSON.parse(body) : undefined);
					} catch {
						resolve(undefined);
					}
				});
			});

			req.on('error', () => resolve(undefined));

			if (options.body) {
				req.write(options.body);
			}

			req.end();
		} catch {
			resolve(undefined);
		}
	});
}

async function tryZotero7(settings: ZoteroSettings) {
	const query = new URLSearchParams({
		itemType: '-attachment',
		q: '',
	}).toString();

	const data = await requestJson(`http://localhost:${settings.port}/api/users/0/items?${query}`, {
		headers: {
			'Accept': 'application/json',
			'Zotero-API-Version': '3',
		},
	});

	if (!Array.isArray(data)) {
		return undefined;
	}

	return data.map(item => item && item.data).filter(Boolean);
}

async function tryZotServer(settings: ZoteroSettings) {
	const data = await requestJson(`http://localhost:${settings.port}/zotserver/search`, {
		method: 'POST',
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json',
		},
		body: JSON.stringify([{
			condition: 'quicksearch-everything',
			value: '',
		}]),
	});

	return Array.isArray(data) ? data : undefined;
}

async function loadZoteroData(settings: ZoteroSettings) {
	return await tryZotero7(settings) || await tryZotServer(settings);
}

joplin.plugins.register({
	onStart: async function() {
		const scriptId = 'zotero-link';
		await registerSettings();


		const dialogs = joplin.views.dialogs;
		const error = await dialogs.create('zoteroLinkError');
		await dialogs.setButtons(error, [{id: 'Cancel'}]);

		await joplin.contentScripts.register(
			ContentScriptType.CodeMirrorPlugin,
			scriptId,
			'./zotero-link.js'
		);

		await joplin.contentScripts.onMessage(scriptId, async (msg) => {

			if (msg === 'getSettings') {
				return await getSettings();
			} else if (msg && msg.type === 'loadZoteroData') {
				const settings = await getSettings();
				return {
					items: await loadZoteroData(settings),
					customFormat: settings.customFormat,
				};
			} else {
				await dialogs.setHtml(error, `
					<h1>${msg.title}</h1>
					<p>${msg.description}</p>
				`);
				dialogs.open(error);
			}
		})
	},
});
