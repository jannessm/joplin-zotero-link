# Joplin Zotero Link Plugin

Conntect Zotero with Joplin to reference sources in notes and open them via `zotero://` links.

When having trouble using this plugin, please have a look down below to the FAQ.

## Installation

### Zotero >= 7

1. Enable "Local API" feature in your Zotero 7 settings: `Zotero 7 > Settings > Advanced > Allow other applications on this computer to communicate with Zotero`
2. Install this plugin

### Zotero <= 6

1. Install [ZotServer](https://github.com/MunGell/ZotServer) in Zotero
2. Install this plugin

## Usage

1. Open a note and enter `z@`
2. Search for your reference
3. Select it

### Custom Formatting

Custom formatting of the text can be enabled from plugin settings.

| Setting   | Function |
|---|---|
| Citation Style | Accepts Zotero Citation Repository ids (e.g. apa, chicago-author-date, modern-language-association, ieee, american-medical-association) to allow for automatic generation of citations.   |
| Custom Format| This allows you to use variables (see Available Variables) to customize to what the Zotero information appears in the document.  |
| Custom Hint Format | This allows you to use variables (see Available Variables)to customize what you see in the autocomplete dropdown.  |
| Custom Hint Details | This allows you to use variables (see Available Variables)to customize additional information that you want to see in the autocomplete dropdown. This will not influence sorting of the autocomplete hints.   |
| Custom Hint Sorting | This allows you to use variables (see Available Variables)to customize sort order of the autocomplete dropdown hints. If left empty the Custom Hint Format will be used.  |

#### Example

| Location   | Display |
|---|---|
| Settings | `[<authorfirst>, <year>, *<title>*](<zoterolink>)<externallink>`  |
| Markdown | `[Jannes Magnusson, 2024, *jannessm/joplin-zotero-link*](zotero://select/library/items/Q5U7SN82)[&#x1F517;](https://github.com/jannessm/joplin-zotero-link)`|
| Editor | [Jannes Magnusson, 2024, *jannessm/joplin-zotero-link*](zotero://select/library/items/Q5U7SN82)[&#x1F517;](https://github.com/jannessm/joplin-zotero-link) |

#### Available Variables
| Variable        | Description          |
|----------------|----------------------|
| `<key>`        | Zotero key           |
| `<zoterolink>` | Local zotero link `zotero://select/library/items/<key>` |
| `<authors>`     |    All authors                  |
|  `<authorfirst>`               |        First author |
|  `<firtauthor>`               |        First author |
|   `<title>`   |   Title |
|  `<date>` | Date in local format         |
|  `<date:YYYY-MM-DDTHH:mm:ss>` | Date formating using [dayjs](https://day.js.org/) |
|   `<year>`   |  Year    |
|   `<month>`  | Month in `en-US` format |
|   `<monthlocal>`  | Month in local format |
|   `<publication>`  |   Publication journal   |
|   `<publicationshort>` |  Short version of publication journal  |
|  `<doi>`        |   DOI    |
|  `<doiurl>`  |    DOI url `https://doi.org/<doi>`   |
|  `<url>` | External url    |
|  `<externallink>`   |  Give external link with icon 🔗 `[&#x1F517;](<url>)` |
|  `<externaldoi>`   |  Give external DOI link with icon 🔗 `[&#x1F517;](<doilink>)` |
|  `<citation>`   |  For Zotero >= 7, this returns a citation formatted based of the Citation Style plugin settings |
|  `<barecitation>`   |  The same as `<citation>` but without the surrounding parentheses |

## FAQ

### Joplin crashes after installation

- using CodeMirror v5 (only supported up to v1.2.1) ([#17](https://github.com/jannessm/joplin-zotero-link/issues/17), [#18](https://github.com/jannessm/joplin-zotero-link/issues/18), [#20](https://github.com/jannessm/joplin-zotero-link/issues/20), [#22](https://github.com/jannessm/joplin-zotero-link/issues/22))

### No Zotero Data could be loaded

- check if the port is correct under the plugin settings ([#3](https://github.com/jannessm/joplin-zotero-link/issues/3), [#4](https://github.com/jannessm/joplin-zotero-link/issues/4), [#6](https://github.com/jannessm/joplin-zotero-link/issues/6))

### Autocomplete shows text nested in `<ol><li></li></ol>`
- This may happen if you use the <citation> or <barecitation> variable but leave the Citation Style setting empty. This can be fixed by entering a valid citation style or changing the <citation> or <barecitation> variable to something else. Note that once this is corrected, it might take Joplin a few seconds to update the settings.

### Autocomplete isn't showing up
- This may happen if you use an invalid citation style. Check citation style name to make sure it is correct. Note that once this is corrected, it might take Joplin a few seconds to update the settings.

### Citation isn't working
- Make sure that you are using Zotero >= 7, this has not been implemented for Zotero server.