import { Editor } from "codemirror";

export class ZoteroItem {
    key: string;
    title: string;
    date: string;
    creators: string;
    titleL: string;
    creatorsL: string;

    constructor(item) {
      this.key = item.key;
      this.title = item.title || '';
      this.date = item.date || '';
      this.creators = ZoteroItem.parseCreators(item.creators);

      this.titleL = this.title ? item.title.toLowerCase() : '';
      this.creatorsL = this.creators.toLowerCase();
    }

    static parseCreators(creators) {
      if (!creators) return '';
      return creators.filter(c => c.creatorType === 'author')
                     .map(c => `${c.firstName} ${c.lastName}`)
                     .join(', ');
    }

    matches(query) {
      if (!query) return true;

      return this.match(query, this.titleL) ||
             this.match(query, this.date) ||
             this.match(query, this.creatorsL)
    }

    match(query, value) {
      return value ? value.indexOf(query) >= 0 : false;
    }

    getHint() {
      return {
        text: this.title,
        render: async (elem, self, data) => {
            const itemElem = elem.ownerDocument.createElement('div');
            itemElem.className = 'zotero-results-item';

            itemElem.innerHTML = `
                <div class="zotero-item-title">${this.title}</div>
                <div class="zotero-item-meta">${this.creators} <i>${this.date}</i></div>
            `;
            elem.appendChild(itemElem);
        },
        hint: async (cm: Editor, data, completion) => {
            const from = completion.from || data.from;
            from.ch -= 2;
            cm.replaceRange(`[${this.title}](zotero://select/library/items/${this.key})`, from, cm.getCursor(), "complete");
        }
    }
    }
  }