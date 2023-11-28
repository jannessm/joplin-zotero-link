import { ZoteroQuery } from './zotero-query';

module.exports = {
    default: function(context) {

        const plugin = function (CodeMirror) {
            
            CodeMirror.defineOption('zoteroLink', false, function(cm, value, prev) {
                if (!value) return;
                const zq = new ZoteroQuery(CodeMirror, context, cm);
                
                cm.on('inputRead', zq.getInputReadHandler());
            });
        };

        return {
            plugin,
            codeMirrorResources: [
                'addon/hint/show-hint'
            ],
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