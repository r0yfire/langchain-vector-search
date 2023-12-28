const fs = require('fs');
const validExtensions = ['.md', '.mdx'];

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

function pathToUrl(path) {
    // Remove extension
    path = path.slice(0, path.lastIndexOf('.'));

    // Replace path with URL
    if (path.startsWith('blog/')) {
        return `https://docs.mywebsite.tld/blog/${path.replace('blog/', '')}`;
    } else if (path.startsWith('docs/')) {
        return `https://docs.mywebsite.tld/docs/${path.replace('docs/', '')}`;
    } else if (path.startsWith('knowledge/')) {
        return `https://docs.mywebsite.tld/docs/${path}`;
    } else {
        return path;
    }
}

(async () => {
    let json;
    let files = [];

    // Create an array of objects with the path and content of each file.
    const blogPages = walk('documents/blog', ['.md']);
    const docsPages = walk('documents/docs', ['.md']);
    const knowledgePages = walk('documents/knowledge', ['.md']);
    const docs = [...blogPages, ...docsPages, ...knowledgePages];

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