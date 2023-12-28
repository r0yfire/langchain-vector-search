import {formatDocumentsAsString} from "langchain/util/document";

export const getPageContent = (doc: any) => {
    if (doc.pageContent) {
        return doc.pageContent;
    } else if (doc.metadata?.pageContent) {
        return doc.metadata.pageContent;
    } else if (doc.metadata?._node_content) {
        if (typeof doc.metadata._node_content === 'string') {
            doc.metadata._node_content = JSON.parse(doc.metadata._node_content);
        }
        return doc.metadata._node_content.text;
    } else {
        console.warn('No page content found for document', doc);
        return formatDocumentsAsString([doc]);
    }
};