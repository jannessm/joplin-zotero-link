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
        const response = await this.context.postMessage({
            type: 'loadZoteroData'
        });
        const customFormat = response && response.customFormat ? response.customFormat : '[<title>](<zoterolink>)';
        let data = response && response.items;

        if (Array.isArray(data)) {
            data = data.filter(item => item.itemType !== 'attachment' && item.itemType !== 'note')
                .map(item => new ZoteroItem(item, customFormat));

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
            }, customFormat);

            return [errorItem];
        }
    }
}
