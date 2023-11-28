import joplin from 'api';
import { ContentScriptType } from 'api/types';


joplin.plugins.register({
	onStart: async function() {
		const dialogs = joplin.views.dialogs;
		const error = await dialogs.create('zoteroLinkError');
		await dialogs.setButtons(error, [{id: 'Cancel'}]);

		await joplin.contentScripts.register(
			ContentScriptType.CodeMirrorPlugin,
			'zoteroLink',
			'./zotero-link.js'
		);

		await joplin.contentScripts.onMessage('zoteroLink', async (msg) => {
			await dialogs.setHtml(error, `
				<h1>${msg.title}</h1>
				<p>${msg.description}</p>
			`);
			dialogs.open(error);
		})
	},
});
