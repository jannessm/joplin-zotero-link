import { start } from "repl";
import { SETTING } from "./settings";
import { ZoteroItem } from "./zotero-item";

import { CompletionContext, startCompletion } from "@codemirror/autocomplete";

interface ChangePos {
    line: any;
    ch: any;
}

interface Change {
    from: ChangePos;
    to: ChangePos;
}

const COMMAND = 'z@';

export class ZoteroQuery {
    start: ChangePos;
    change: Change;
    zoteroItems: ZoteroItem[] = [];
    filteredItems: ZoteroItem[] = [];
    timeout: NodeJS.Timeout | undefined;

    constructor(private context, private cm) {
        this.loadData().then(items => this.zoteroItems = items);
    }

    getCompletions() {
        const that = this;
        return (context: CompletionContext) => {
            // reload data in background
            that.loadData().then(items => that.zoteroItems = items);
            let word = context.matchBefore(/\S+/);

            if (!word || word.from == word.to || !word.text.startsWith('z@'))
                return null;

            return {
                from: word.from + 2,
                options: that.zoteroItems.map(item => item.getHint())
            }
        }
    }

    query(query: string) {
        if (!this.zoteroItems) {
            return [];
        }

        query = query.toLowerCase();
        this.filteredItems = this.zoteroItems.filter(item => item.matches(query));

        return this.filteredItems.map(item => item.getHint());
    }

    async loadData() {
        const settings = await this.context.postMessage('getSettings');

        let data;

        data = await this.tryZotero7(settings.port);

        // zotero api is not working. Try to use zotserver
        if (!data) {
            data = await this.tryZotServer(settings.port);
        }

        if (!!data) {
            data = data.filter(item => item.itemType !== 'attachment' && item.itemType !== 'note')
                .map(item => new ZoteroItem(item, settings.customFormat));

            data.sort((a: ZoteroItem, b: ZoteroItem) => a.title.localeCompare(b.title));
            return data;
        } else {
            // Do not show a popup on load failure. Return a single special ZoteroItem
            // that will appear in completions to indicate the error only when the user queries.
            const errorItem = new ZoteroItem({
                itemType: 'computerProgram',
                title: '⚠️ Data could not be loaded from Zotero.\nPlease check if Zotero is running with the correct port set in your settings.\nOtherwise a broken reference in your library could be an issue.\nPlease have a look at existing github issues to find more help.',
                key: '__zotero_data_error__',
                creators: []
            }, settings.customFormat);

            return [errorItem];
        }
    }

    async tryZotero7(port: string) {
        const query = new URLSearchParams({
            itemType: '-attachment',
            q: ''
        }).toString();

        try {
            const res = await fetch(`http://localhost:${port}/api/users/0/items?${query}`, {
                method: 'get',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (res.status === 500) {
                this.context.postMessage({
                    title: 'Zotero API not working',
                    description: res.body
                });
                return;
            }

            const data = await res.json();
            return data.map(item => item.data);
        } catch (err) { }
    }

    async tryZotServer(port: string) {
        try {
            const res = await fetch(`http://localhost:${port}/zotserver/search`, {
                method: 'post',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify([{
                    condition: 'quicksearch-everything',
                    value: ''
                }])
            });

            if (res.status === 500) {
                this.context.postMessage({
                    title: 'Zotero API not working',
                    description: res.body
                });
                return;
            }

            return await res.json();

        } catch (err) {
            return;
        }

    }
}