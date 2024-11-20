import { Completion, pickedCompletion } from "@codemirror/autocomplete";
import { EditorView } from "@codemirror/view";
import { Annotation, AnnotationType, ChangeSet, Text } from "@codemirror/state";
import { Editor } from "codemirror";

export class ZoteroItem {
    key: string;

    title: string;
    titleL: string;

    date: string;

    creators: string;
    creatorsL: string;
    creatorFirst: string;

    publication: string;
    publicationShort: string;

    doi: string;
    url: string;

    settings;

    constructor(item, settings) {
      this.key = item.key;

      this.title = item.title || '';
      this.titleL = this.title ? item.title.toLowerCase() : '';

      this.date = item.date || '';

      this.creators = ZoteroItem.parseCreators(item.creators);
      this.creatorsL = this.creators.toLowerCase();
      this.creatorFirst = ZoteroItem.parseFirstCreator(item.creators);

      this.publication = item.publicationTitle || '';
      this.publicationShort = item.journalAbbreviation || '';

      this.doi = item.DOI || '';
      this.url = item.url || '';

      this.settings = settings;
    }

    static parseCreators(creators) {
      if (!creators) return '';
      return creators.map(c => `${c.firstName} ${c.lastName}`)
                     .join(', ');
    }

    static parseFirstCreator(creators) {
      if (!creators) return '';
      return creators.map(c => `${c.firstName} ${c.lastName}`)[0];
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

    getHint(): Completion {
      return {
        label: 'z@' + this.titleL + this.creatorsL + this.date,
        displayLabel: this.title,
        detail: this.creators + ' ' + this.date,
        apply: this.apply.bind(this)
      };
    }

    format(customFormat: string) {
      let f = customFormat;
      let date = new Date(this.date);
      f = f.replace("<key>", this.key);
      f = f.replace("<zoterolink>", `zotero://select/library/items/${this.key}`);
      f = f.replace("<authors>", this.creators);
      f = f.replace("<authorfirst>", this.creatorFirst)
      f = f.replace("<title>", this.title);
      f = f.replace("<date>", date.toLocaleDateString(undefined));
      f = f.replace("<year>", date.toLocaleDateString(undefined, {year: "numeric"}))
      f = f.replace("<publication>", this.publication);
      f = f.replace("<publicationshort>", this.publicationShort);
      f = f.replace("<doi>", this.doi);
      f = f.replace("<doiurl>", `https://doi.org/${this.doi}`);
      f = f.replace("<url>", this.url)
      f = f.replace("<externallink>", `[&#x1F517;](${this.url})`);
      f = f.replace("<externaldoi>", `[&#x1F517;](https://doi.org/${this.doi})`);
      return f;
    }

    apply(view: EditorView, completion: Completion, from: number, to: number) {
      let replacement;
      if (this.settings.customFormatEnable){
        const customFormat = this.settings.customFormat;
        replacement = this.format(customFormat);
      } else {
        replacement = `[${this.title}](zotero://select/library/items/${this.key})`;
      }
      

      const replaceTransaction = view.state.update({
        changes: {
          from: from-2,
          to,
          insert: replacement
        },
        annotations: pickedCompletion.of(completion)
      });

      view.dispatch(replaceTransaction);
    }
  }