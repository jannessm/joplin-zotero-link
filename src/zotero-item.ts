import { Completion, pickedCompletion } from "@codemirror/autocomplete";
import { EditorView } from "@codemirror/view";
import { Annotation, AnnotationType, ChangeSet, Text } from "@codemirror/state";
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

    getHint(): Completion {
      return {
        label: 'z@' + this.titleL + this.creatorsL + this.date,
        displayLabel: this.title,
        detail: this.creators + ' ' + this.date,
        apply: this.apply.bind(this)
      };
    }

    apply(view: EditorView, completion: Completion, from: number, to: number) {
      const replacement = `[${this.title}](zotero://select/library/items/${this.key})`;

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