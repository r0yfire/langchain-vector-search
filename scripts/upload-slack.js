/*


This script will load a Slack export zip file and upload the messages to the API.

Steps:
1. Export the Slack workspace as a zip file.
2. Save the zip file in the `documents/slack` folder.
3. Run this script.


 */

const fs = require('fs').promises;
const path = require('path');
const metadataFiles = ['channels.json', 'users.json', 'integration_logs.json', 'canvases.json'];

const walkSync = async (dir, extensions) => {
    let results = [];
    const list = await fs.readdir(dir);
    for (const file of list) {
        const stat = await fs.stat(`${dir}/${file}`);
        if (stat && stat.isDirectory()) {
            results = results.concat(await walkSync(`${dir}/${file}`));
        } else {
            results.push(`${dir}/${file}`);
        }
    }
    if (extensions) {
        results = results.filter(path => extensions.includes(path.slice(path.lastIndexOf('.'))));
    }
    return results;
};

class SlackDirectoryLoader {
    constructor(filePath, workspaceUrl = null) {
        this.filePath = filePath;
        this.workspaceUrl = workspaceUrl;
        this.channelIDMap = {}; // This will be populated later
    }

    async getChannelIDMap() {
        let channelContent = await fs.readFile(`${this.filePath}/channels.json`, 'utf8');
        if (channelContent) {
            const channels = JSON.parse(channelContent);
            this.channelIDMap = channels.reduce((map, channel) => {
                map[channel.name] = channel.id;
                return map;
            }, {});
        }
    }

    async load() {
        await this.getChannelIDMap();
        const docs = [];
        let files = await walkSync('documents/slack', ['.json']);
        files = files.filter(file => !metadataFiles.includes(path.basename(file)));
        for (const file of files) {
            const data = await fs.readFile(file);
            const messages = JSON.parse(data);
            const parts = file.split('/');
            const channelName = parts[parts.length - 2];
            messages.forEach(message => {
                const document = this.convertMessageToDocument(message, channelName);
                docs.push(document);
            });
        }
        return docs;
    }

    convertMessageToDocument(message, channelName) {
        const text = message['text'] || '';
        const metadata = this.getMessageMetadata(message, channelName);
        return {
            content: text,
            path: metadata.source,
        };
    }

    getMessageMetadata(message, channelName) {
        const timestamp = message['ts'] || '';
        const user = message['user'] || '';
        const source = this.getMessageSource(channelName, user, timestamp);
        return {source, channel: channelName, timestamp, user};
    }

    getMessageSource(channelName, user, timestamp) {
        if (this.workspaceUrl) {
            const channelID = this.channelIDMap[channelName] || '';
            return `${this.workspaceUrl}/archives/${channelID}/p${timestamp.replace('.', '')}`;
        } else {
            return `${channelName} - ${user} - ${timestamp}`;
        }
    }
}


const chunks = (array, size) => {
    const results = [];
    while (array.length) {
        results.push(array.splice(0, size));
    }
    return results;
};


const main = async () => {
    let json;
    let files = [];

    // Initialize the loader
    const loader = new SlackDirectoryLoader(
        'documents/slack/export',
        'https://xxxx.slack.com'
    );

    // Load the documents
    const docs = await loader.load();

    // Slice the documents into chunks
    const groups = chunks(docs, 10);

    // Upload each group of documents
    for (const group of groups) {
        console.log(`Uploading chunk of ${group.length} files... ${JSON.stringify(group.map(f => f.path))}`);
        try {
            const result = await fetch('http://0.0.0.0:3000/dev/train', {
                method: 'POST',
                body: JSON.stringify({
                    files: group,
                    topic: 'slack',
                }),
                headers: {
                    // 'Authorization': `Bearer ${process.env.MY_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            });
            json = await result.json();
        } catch (error) {
            console.error(error);
        }

        // Check for errors.
        if (json && json.error) {
            console.error(json);
        } else {
            console.log(JSON.stringify(json, null, 2));
        }
    }
};

(async () => {
    await main();
})();