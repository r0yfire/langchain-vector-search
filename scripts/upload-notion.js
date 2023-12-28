/*


This script uploads all the files in the `documents/notion` folder to the API.

Steps:
1. Export all the pages from Notion as Markdown files.
2. Save the files in the `documents/notion` folder.
3. Run this script.


 */

const fs = require('fs');
const path = require('path');
const validExtensions = ['.md', '.mdx'];

// [!] Replace the xxxxx with your Notion workspace ID.
const NOTION_WORKSPACE_ID = 'xxxx';
//

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

    // Create an array of objects with the path and content of each file.
    const docs = walk('documents/notion/', ['.md']);

    // Filter out files that don't have a valid extension.
    for (const doc of docs) {
        if (!validExtensions.includes(doc.slice(doc.lastIndexOf('.')))) {
            continue;
        }
        files.push({
            path: pathToUrl(doc.replace('documents/', '')),
            content: (await fs.promises.readFile(doc)).toString(),
        });
    }

    // Filter files that have 'Untitled' in the file name.
    files = files.filter(file => !file.path.includes('Untitled'));

    // Split the files into chunks of 10.
    const chunksOf10 = chunks(files, 10);

    // Upload the files to API by chunks
    for (const chunk of chunksOf10) {
        console.log(`Uploading chunk of ${chunk.length} files... ${JSON.stringify(chunk.map(f => f.path))}`);
        try {
            const result = await fetch('http://0.0.0.0:3000/dev/train', {
                method: 'POST',
                body: JSON.stringify({
                    files: chunk,
                    topic: 'notion',
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