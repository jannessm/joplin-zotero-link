import joplin from 'api';
import { ContentScriptType } from 'api/types';

import { registerSettings, SETTING } from './settings';

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
				const port = await joplin.settings.value(SETTING.Port);
				const cf = await joplin.settings.value(SETTING.CustomFormat);
				const cfEnable = await joplin.settings.value(SETTING.CustomFormatEnable);
                return {
					port: port,
					customFormat: cf,
					customFormatEnable: cfEnable
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
