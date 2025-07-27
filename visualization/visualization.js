// visualization/visualization.js
// This script runs in the visualization page to display the browsing history
// TODOS:
// Use a charting library to visualize the data, want graphs, timelines, maybe
// screenshots of pages visited

// extract nodes and edges from history
function extractGraph(history) {
    const nodes = [];
    const edges = [];
    const nodeSet = new Set();

    history.forEach(entry => {
        // resolve frament identifiers
        entry.url = entry.url.split('#')[0]
        entry.referrer = entry.referrer.split('#')[0]
        if (!nodeSet.has(entry.url)) {
            nodes.push({ data: { id: entry.url, label: entry.title } });
            nodeSet.add(entry.url);
        }
        if (entry.referrer) {
            edges.push({ data: { source: entry.referrer, target: entry.url } });
            if (!nodeSet.has(entry.refferrer)) {
                nodes.push({ data: { id: entry.referrer, label: entry.referrer } });
                nodeSet.add(entry.referrer);
            }
        }
    });
    return [...nodes, ...edges];
}

// load the graph visualization
document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get(["history"], function(result) {
        const data = result || [];
        console.log(JSON.stringify(data.history, null, 2));
        graph = extractGraph(data.history)
        console.log("Graph data:", graph);
        cytoscape.use(cytoscapeDagre);
        const cy = cytoscape({
            container: document.getElementById('cy'),
            elements: graph,
            layout: {
                name: 'dagre',
                directed: true,
                rankDir: 'LR',
                nodeDimensionsIncludeLabels: true,
                spacingFactor: 1.2,
                fit: true
            },
            style: [
                {
                    selector: 'node',
                    style: {
                        'label': 'data(label)',
                        'background-color': '#0074D9',
                        'color': '#0b2033ff',
                        'text-wrap': 'wrap',
                        'text-valign': 'top',
                        'text-halign': 'center'
                    }
                },
                {
                    selector: 'edge',
                    style: {
                    'width': 2,
                    'line-color': '#ccc',
                    'target-arrow-shape': 'triangle',
                    'target-arrow-color': '#ccc',
                    'curve-style': 'bezier'
                    }
                }
            ]
        });
    });
  
});
