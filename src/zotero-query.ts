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

const COMMAND = "z@";

export class ZoteroQuery {
  start: ChangePos;
  change: Change;
  zoteroItems: ZoteroItem[] = [];
  filteredItems: ZoteroItem[] = [];
  timeout: NodeJS.Timeout | undefined;
  settings: { customFormat: ""; customHintFormat: ""; citationStyle: "", customHintSort: "", customHintDetails: "" };

  constructor(
    private context,
    private cm,
  ) {
    this.loadData().then((items) => (this.zoteroItems = items));
  }

  getCompletions() {
    const that = this;
    return (context: CompletionContext) => {
      // reload data in background
      that.loadData().then((items) => (that.zoteroItems = items)); 
    
      let word = context.matchBefore(/\S+/);

      if (!word || word.from == word.to || !word.text.startsWith("z@"))
        return null;
      let sortedOptions = that.zoteroItems.map((item) => item.getHint())
      // sortedOptions.sort((a,b) => a.displayLabel > b.displayLabel ? 1 : -1)
     
      return {
        from: word.from + 2,
        options: sortedOptions,
        filter: true,
      };
    };
  }

  query(query: string) {
    if (!this.zoteroItems) {
      return [];
    }

    query = query.toLowerCase();
    this.filteredItems = this.zoteroItems.filter((item) => item.matches(query));
    let hints= this.filteredItems.map((item) => item.getHint());
    
    return hints
  }

  async loadData() {
    const settings = await this.context.postMessage("getSettings");
    this.settings = settings;
    let data;

    data = await this.tryZotero7(settings.port, true);
    // trys without citation if citation style is malformed or invalid
    if (!data) {
      data = await this.tryZotero7(settings.port, false);
    }

    // zotero api is not working. Try to use zotserver
    if (!data) {
      data = await this.tryZotServer(settings.port);
    }

    if (!!data) {
    
        
      data = data
        .filter(
          (item) => item.itemType !== "attachment" && item.itemType !== "note",
        )
        .map(
          (item) =>
            new ZoteroItem(
              item,
              settings.customFormat,
              settings.customHintFormat,
              settings.customHintSort,
              settings.customHintDetails,
            ),
        );

        // data.sort((a,b) => a.citation > b.citation ? 1 : -1)
    
        data.sort((a:ZoteroItem,b:ZoteroItem) => a.citation > b.citation ? 1 : -1)
     
      return data;
    } else {
      this.context.postMessage({
        title: "Loading Zotero data failed.",
        description:
          "Data could not be loaded from Zotero. Please check if Zotero is running with the correct port set in your settings. Otherwise a broken reference in your library could be an issue. Please have a look at existing github issues to find more help.",
      });

      return [];
    }
  }

  async tryZotero7(port: string, allowCite: boolean) {
    const query = new URLSearchParams({
      itemType: "-attachment",
      q: "",
    }).toString();

    // SORT ITEMS
    // dateAdded, dateModified, title,
    // creator, itemType, date, publisher,
    // publicationTitle, journalAbbreviation,
    // language, accessDate, libraryCatalog,
    // callNumber, rights, addedBy, numItem

    // SORT DIRECTION
    // asc, desc
   
    let queryInclude = "";
    let citationStyle = "";
    if (allowCite) {
      // let capture = this.settings.citationStyle.match(/\<citation:([a-zA-Z0-9-]+)\>/);

      citationStyle = "style=" + this.settings.citationStyle.trim();

      if (citationStyle) {
        queryInclude = "include=data,citation";
      }
      //  `http://localhost:${port}/api/users/0/items?${query}&${querySort}&${queryInclude}&${citationStyle}
    }
    let fetchURL = `http://localhost:${port}/api/users/0/items?${query}&${queryInclude}&${citationStyle}`;
    try {
      const res = await fetch(fetchURL, {
        method: "get",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (res.status === 500) {
        this.context.postMessage({
          title: "Zotero API not working",
          description: res.body,
        });
        return;
      }

      const data = await res.json();
      //    this suld only be run if there are citations

      if (data[0].hasOwnProperty("citation")) {
        data.forEach((item) => {
          // Move the citation into the data object
          item.data.citation = item.citation;
        });
      }
      data.sort((a,b) => a.citation > b.citation ? 1 : -1)
      return data.map((item) => item.data);
    } catch (err) {}
  }

  async tryZotServer(port: string) {
    try {
      const res = await fetch(`http://localhost:${port}/zotserver/search`, {
        method: "post",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          {
            condition: "quicksearch-everything",
            value: "",
          },
        ]),
      });

      if (res.status === 500) {
        this.context.postMessage({
          title: "Zotero API not working",
          description: res.body,
        });
        return;
      }

      return await res.json();
    } catch (err) {
      return;
    }
  }
}
