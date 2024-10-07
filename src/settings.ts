import joplin from 'api';
import { SettingItemType } from 'api/types';

export enum SETTING {
	Port = 'zotero-port'
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
    });
};
