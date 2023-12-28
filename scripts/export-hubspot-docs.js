const csv = require('@fast-csv/parse');
const {NodeHtmlMarkdown} = require('node-html-markdown');
const fs = require('fs');
const path = require('path');

/*

Convert HubSpot Knowledge Base export to Markdown.


Prerequisites:

    npm install --no-save @fast-csv/parse node-html-markdown

 */

const FILE_NAME = "/Users/myuser/Downloads/hubspot-knowledge-base-export-empty-2023-12-26.csv";

const isEmpty = value => value === undefined || value === null || value === '';
const slugify = (text) => {
    const slug = text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9 ]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-')
        .replace(/-+$/, '');
    return `${slug}`;
};
const decodeHtmlEntities = html => {
    const htmlEntities = {
        nbsp: ' ',
        cent: '¢',
        pound: '£',
        yen: '¥',
        euro: '€',
        copy: '©',
        reg: '®',
        lt: '<',
        gt: '>',
        quot: '"',
        amp: '&',
        apos: '\''
    };
    return html.replace(/&([^;]+);/g, (entity, entityCode) => {
        let match;
        if (entityCode in htmlEntities) {
            return htmlEntities[entityCode];
            /*eslint no-cond-assign: 0*/
        } else if (match = entityCode.match(/^#x([\da-fA-F]+)$/)) {
            return String.fromCharCode(parseInt(match[1], 16));
            /*eslint no-cond-assign: 0*/
        } else if (match = entityCode.match(/^#(\d+)$/)) {
            return String.fromCharCode(~~match[1]);
        } else {
            return entity;
        }
    });
};
const stripHTML = (html = '') => {
    html = html.replace(/<br\/?>/g, '\n'); // replace '<br/>' with '\n'
    html = html.replace(/<\/p>/g, '\n'); // replace '</p>' with '\n'
    html = html.replace(/<[^>]*>?/gm, ''); // remove HTML tags
    html = decodeHtmlEntities(html); // decode HTML entities
    return html;
};

const parseCSV = () => new Promise((resolve, reject) => {
    const rows = [];
    csv.parseFile(FILE_NAME, {headers: true})
        .on('error', error => console.error(error))
        .on('data', async (row) => {
            rows.push(row);
        })
        .on('end', () => resolve(rows));
});

const cleanArticleTitle = (title = '') => {
    // Replace double quotes with single quotes
    title = title.replace(/"/g, '\'');

    // Remove HTML tags
    title = stripHTML(title);

    return title;
};

const cleanMarkdownArticle = (article = '') => {
    let matches;
    // if (1) {
    //     return article;
    // }

    // Replace old image URLs with new ones
    article = article.replace(/https:\/\/www.autohost.ai/g, 'https://help.autohost.ai');

    // Replace `“` with `"` and `”` with `"` anc `’` with `'`
    article = article.replace(/“/g, '"');
    article = article.replace(/”/g, '"');
    article = article.replace(/’/g, '\'');

    // Replace angled brackets with backticks
    article = article.replace(/</g, '`');
    article = article.replace(/>/g, '`');

    // Replace `{% raw %}` with ``
    article = article.replace(/\{% raw %}/g, '');

    // Replace `}}{% endraw %}` with `{'}'}`
    article = article.replace(/_\{% endraw %}_/g, '');
    article = article.replace(/\{% endraw %}/g, '');

    // Replace line-by-line
    article = article.split('\n').map(line => {
        if (!line.startsWith('`')) {

            // Replace one or more instances of {{ with {'{'} and }} with {'}'}
            // This is to prevent MDX from interpreting the double curly braces as JSX
            matches = line.match(/[{]{2}([\w\d\s_\-/\\.]+)[}]{2}/g);
            if (matches) {
                line = matches.reduce((acc, match) => {
                    return acc.replace(match, `{'{'}{${match.replace('{{', '').replace('}}', '')}}{'}'}`);
                }, line);
            }

            // Replace one or more instances of { with {'{'} and } with {'}'}
            // This is to prevent MDX from interpreting the curly braces as JSX
            matches = line.match(/[{]{1}([\w\d\s_\-/\\.]+)[}]{1}/g);
            if (matches) {
                line = matches.reduce((acc, match) => {
                    return acc.replace(match, `{'{'}${match.replace(/[\{\}]/g, '')}{'}'}`);
                }, line);
            }
        }
        return line;
    }).join('\n');

    return article;
};

const createMarkdownFile = (article) => {
    const slug = article['Article URL'].split('/').pop();
    const category = article['Category'];
    const subcategory = article['Subcategory'];
    const fileName = [
        'knowledge',
        slugify(category),
        slugify(subcategory),
        slug
    ].filter(n => n && n !== '').join('/') + '.md';

    // Check if directory exists and create it if not
    const dir = path.join(__dirname, '../documents/', path.dirname(fileName));
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, {recursive: true});
    }

    // Create Markdown file contents
    let contents = [
        `# ${stripHTML(article['Article title'])}\n`,
        isEmpty(article['Article subtitle']) ? '' : `${stripHTML(article['Article subtitle'])}\n`,
        ...(cleanMarkdownArticle(article.markdown).split('\n')),
    ].join('\n');

    // Write file
    fs.writeFileSync(path.join(__dirname, '../documents/', fileName), contents);
};

const main = () => {
    const nhm = new NodeHtmlMarkdown();
    (async () => {
        let articles = await parseCSV();
        articles = articles.filter(a => a['Archived'] === 'false');
        articles = articles.filter(a => a['Status'] === 'PUBLISHED');

        console.log(`Total articles: ${articles.length}`);
        console.log('Headers:', Object.keys(articles[0]));

        for (let i = 0; i < articles.length; i++) {

            // Convert HTML to Markdown
            articles[i].markdown = nhm.translate(articles[i]['Article body']);

            // Create Markdown file
            createMarkdownFile(articles[i]);
        }
    })();
};

main();