import joplin from 'api';
import { SettingItemType } from 'api/types';

export enum SETTING {
	Port = 'zotero-port',
    CustomFormat = 'zotero-custom-format',
    CustomHintFormat = 'zotero-custom-hint-format',
    CitationStyle = 'zotero-citation-style',
    CustomHintSort = 'zotero-custom-hint-sort',
    CustomHintDetails = 'zotero-custom-hint-formatdetails'
};

export const registerSettings = async () => {
    const sectionName = 'zotero-link-plugin';
    await joplin.settings.registerSection(sectionName, {
        label: 'Zotero Link',
        description: 'Settings for the Zotero Link plugin.',
        iconName: 'fas fa-link',
    });

    await joplin.settings.registerSettings({
        [SETTING.Port]: {
            section: sectionName,
            value: '23119', // Default value
            public: true, // Show in the settings screen
            type: SettingItemType.String,
            label: 'Port of Zotero 7 API',
        },
        [SETTING.CitationStyle]: {
            section: sectionName,
            value: '',
            public: true,
            type: SettingItemType.String,
            label: 'Citation Style',
            description: 'Allows you to format citations using Zotero Style Repository. Examples: apa, chicago-author-date, modern-language-association, ieee, american-medical-association'
        },
        [SETTING.CustomFormat]: {
            section: sectionName,
            value: '[<title>](<zoterolink>)',
            public: true,
            type: SettingItemType.String,
            label: 'Custom Format',
            description: 'Customize the text links using variables such as <authors>, <title> and <date>.'
        },
        [SETTING.CustomHintFormat]: {
            section: sectionName,
            value: '<authors>',
            public: true,
            type: SettingItemType.String,
            label: 'Custom Hint Format',
            description: 'Customize the hints shown when you use @Z using variables such as <authors>, <title> and <date>.'
        },
        [SETTING.CustomHintDetails]: {
            section: sectionName,
            value: '',
            public: true,
            type: SettingItemType.String,
            label: 'Custom Hint Details',
            description: 'Customize additional details you will see in your hints'
        },
        [SETTING.CustomHintSort]: {
            section: sectionName,
            value: '',
            public: true,
            type: SettingItemType.String,
            label: 'Custom Hint Sort',
            description: 'Customize the sort order of the autocomplete hints shown.'
        },
        
        
    });
};
