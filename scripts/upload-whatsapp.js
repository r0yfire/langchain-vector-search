/*


This script uploads all the files in the `documents/whatsapp` folder to the API.

Steps:
1. Export your WhatsApp chat history from your phone.
2. Save the files in the `documents/whatsapp` folder.
3. Run this script.


 */

const fs = require('fs');
const path = require('path');
const validExtensions = ['.txt'];

function walk(dir, extensions) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function (file) {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            results.push(file);
        }
    });
    if (extensions) {
        results = results.filter(path => extensions.includes(path.slice(path.lastIndexOf('.'))));
    }
    return results;
}

function chunks(array, size) {
    const results = [];
    while (array.length) {
        results.push(array.splice(0, size));
    }
    return results;
}

function slugify(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(/[^\w-]+/g, '') // Remove all non-word chars
        .replace(/--+/g, '-'); // Replace multiple - with single -
}

function pathToUrl(filePath) {
    // Remove extension
    filePath = filePath.slice(0, filePath.lastIndexOf('.'));

    // Replace filePath with URL
    if (filePath.startsWith('notion/')) {
        return `https://www.notion.so/${NOTION_WORKSPACE_ID}/${slugify(path.basename(filePath))}?pvs=4`;
    } else {
        return filePath;
    }
}

(async () => {
    let json;
    let files = [];
    const msgRegex = /^\[(\d{4}-\d{2}-\d{2}, \d{1,2}:\d{2}:\d{2}\s\w{2})\]\s(.+?):\s(.+)/;


    // Create an array of objects with the path and content of each file.
    const docs = walk('documents/whatsapp/', ['.txt']);

    // Filter out files that don't have a valid extension.
    for (const doc of docs) {
        if (!validExtensions.includes(doc.slice(doc.lastIndexOf('.')))) {
            continue;
        }

    /*

[2016-04-02, 6:33:00 PM] Mark Firestein: What are you talking about?
[2016-04-05, 3:48:32 PM] Idan Firestein: Who can solve this
‎[2016-04-05, 3:48:33 PM] Idan Firestein: ‎image omitted

    */
        const text = (await fs.promises.readFile(doc)).toString();
        const content = text
            .split('\n')
            .filter(line => !line.includes('image omitted') && !line.includes('‎'))
            .map(line => {
                const matches = line.match(msgRegex);
                if (matches) {
                    return {
                        date: matches[1],
                        user: matches[2],
                        message: matches[3],
                    };
                }
            })
            .filter(line => line)
            .map(line => `[${line.date}] ${line.user}: ${line.message}`.trim())
            .join('\n');
        files.push({
            path: path.basename(doc).replace('.txt', ''),
            content: content,
        });
    }

    // Split the files into chunks of 10.
    const chunksOf10 = chunks(files, 10);

    // Upload the files to API by chunks
    for (const chunk of chunksOf10) {
        console.log(`Uploading chunk of ${chunk.length} files... ${JSON.stringify(chunk.map(f => f.path))}`);
        try {
            const result = await fetch('http://0.0.0.0:3001/dev/train', {
                method: 'POST',
                body: JSON.stringify({
                    files: chunk,
                    topic: 'whatsapp',
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
})();