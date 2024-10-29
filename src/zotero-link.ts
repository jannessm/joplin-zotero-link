import { ZoteroQuery } from './zotero-query';
import { completeFromList, CompletionContext } from '@codemirror/autocomplete';

module.exports = {
    default: function(context) {

        const plugin = function (CodeMirror) {
            CodeMirror.defineOption('zoteroLink', false, function(cm, value, prev) {
                if (!value) return;
                const zq = new ZoteroQuery(context, cm);
                
                console.log(CodeMirror);
                CodeMirror.addExtension([
                    CodeMirror.joplinExtensions.completionSource(
                      zq.getCompletions()
                    ),
                    
                    // Joplin also exposes a Facet that allows enabling or disabling CodeMirror's
                    // built-in autocompletions. These apply, for example, to HTML tags.
                    CodeMirror.joplinExtensions.enableLanguageDataAutocomplete.of(true)
                ]);
            });
        };

        return {
            plugin,
            codeMirrorOptions: {
                'zoteroLink': true
            },
            assets: () => {
                return [
                    {name: './query.css'}
                ]
            }
        }
    }
}