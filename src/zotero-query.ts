import { ZoteroItem } from "./zotero-item";

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
    codeMirror: any;
    cm: any;
    context: any;
    start: ChangePos;
    change: Change;
    zoteroItems: ZoteroItem[] = [];
    filteredItems: ZoteroItem[] = [];
    timeout: NodeJS.Timeout | undefined;

    constructor(codeMirror, context, cm) {
        this.codeMirror = codeMirror;
        this.context = context;
        this.cm = cm
    }
    
    getInputReadHandler() {
        const that = this;
        return async function (cm, change) {
            if (!cm.state.completionActive && that.cm.getTokenAt(cm.getCursor()).string === COMMAND) {
                that.zoteroItems = await that.loadData();
                that.filteredItems = that.zoteroItems;
    
                that.change = change;
                that.start = {
                    line: change.from.line,
                    ch: change.from.ch + 1
                };
    
                setTimeout(() => {
                    that.codeMirror.showHint(that.cm, that.getPrepareHints(), {
                        completeSingle: false,
                        closeOnUnfocus: true,
                        async: true,
                        closeCharacters: /[()\[\]{};:>,]/
                    });
                }, 10);
            }
        }
    }

    getPrepareHints() {
        const that = this;

        return async function (cm, callback) {
            const cursor = cm.getCursor();
            let prefix = cm.getRange(that.start, cursor) || '';
    
            const hints = await that.query(prefix);
            callback({
                list: hints,
                from: {
                    line: that.change.from.line,
                    ch: that.change.from.ch + 1,
                },
                to: {
                    line: that.change.to.line,
                    ch: that.change.to.ch + 1,
                },
            });
        }
    };

    async query(query: string) {
        if (!this.zoteroItems) {
            return [];
        }

        query = query.toLowerCase();
        this.filteredItems = this.zoteroItems.filter(item => item.matches(query));

        return this.filteredItems.map(item => item.getHint());
    }

    async loadData() {
        let data;

        try {
            const query = new URLSearchParams({
                itemType: '-attachment',
                q: query
            }).toString();

            const res = await fetch(`http://localhost:23119/api/user/0/items?${query}`, {
                method: 'get',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            data = await res.json();

        } catch (e) { }

        // zotero api is not working. Try to use zotserver
        if (!data) {
            try {
                const res = await fetch(`http://localhost:23119/zotserver/search`, {
                    method: 'post',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify([{
                        condition: 'quicksearch-everything',
                        value: ''
                    }])
                });
        
                data = await res.json();
            } catch (e) {
                this.context.postMessage({
                    title: 'Zotero not found',
                    description: 'Could not connect with Zotero. Is it running?'
                });
            }
        }

        if (!!data) {
            
            data = data.filter(item => item.itemType !== 'attachment' && item.itemType !== 'note')
            .map(item => new ZoteroItem(item));
 
            data.sort((a: ZoteroItem, b: ZoteroItem) => a.title.localeCompare(b.title));
                    
            return data;
        }
    }
}