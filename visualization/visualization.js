// visualization/visualization.js
// This script runs in the visualization page to display the browsing history

// convert timestamp to human-readable time ago (thanks chatgpt)
function timeAgo(timestamp) {
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const now = Date.now();
    const diff = now - timestamp;

    const units = [
        { unit: 'year',   ms: 1000 * 60 * 60 * 24 * 365 },
        { unit: 'month',  ms: 1000 * 60 * 60 * 24 * 30 },
        { unit: 'week',   ms: 1000 * 60 * 60 * 24 * 7 },
        { unit: 'day',    ms: 1000 * 60 * 60 * 24 },
        { unit: 'hour',   ms: 1000 * 60 * 60 },
        { unit: 'minute', ms: 1000 * 60 },
        { unit: 'second', ms: 1000 },
    ];

    for (let { unit, ms } of units) {
        const delta = Math.floor(diff / ms);
        if (Math.abs(delta) >= 1) {
            return rtf.format(-delta, unit); // negative because timestamp is in the past
        }
    }

    return 'just now';
}


// extract nodes and edges from history
function extractGraph(history) {
    const nodes = [];
    const edges = [];
    const nodeSet = new Set();

    history.forEach(entry => {
        // resolve fragment identifiers
        entry.url = entry.url.split('#')[0]
        entry.referrer = entry.referrer.split('#')[0]
        if (!nodeSet.has(entry.url)) {
            nodes.push(
                { data: 
                    { 
                        id: entry.url, 
                        label: entry.title, 
                        screenshot: entry.screenshot, 
                    } 
                }
            );
            nodeSet.add(entry.url);
        }
        if (entry.referrer) {
            edges.push(
                { data: 
                    { 
                        source: entry.referrer, 
                        target: entry.url, 
                        timestamp: timeAgo(entry.timestamp)
                    } 
                }
            );
            if (!nodeSet.has(entry.referrer)) {
                nodes.push({ data: { id: entry.referrer, label: entry.referrer } });
                nodeSet.add(entry.referrer);
            }
        }
    });
    return [...nodes, ...edges];
}

const nodeFont = "Menlo"; 

// load the graph visualization
document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get(["history"], function(result) {
        const data = result || [];
        graph = extractGraph(data.history)
        console.log("Graph data:", graph);
        console.log(JSON.stringify(data.history, null, 2));
        cytoscape.use(cytoscapeDagre);
        const cy = cytoscape({
            container: document.getElementById('cy'),
            elements: graph,
            layout: {
                name: 'dagre',
                edgeSep: 50, 
                directed: true,
                rankDir: 'LR',
                nodeDimensionsIncludeLabels: true,
                spacingFactor: 1.0,
                fit: true
            },
            style: [
                {
                    selector: 'node[screenshot]',
                    style: {
                        'background-image': 'data(screenshot)',
                        'background-fit': 'cover',
                        'background-color': 'transparent',
                        'shape': 'rectangle',
                        'width': '150px',
                        'height': '90px',
                        'label': 'data(label)',
                        'text-valign': 'bottom',
                        'text-wrap': 'wrap',
                        'text-max-width': '180px',
                        'text-halign': 'center',
                        'text-margin-y': '5px',
                        'color': '#222',
                        'font-family': nodeFont,
                        'font-size': '10px',
                        'border-width': 0,
                    }
                },
                {
                    selector: 'node[!screenshot]',
                    style: {
                        'background-color': '#1fa848',
                        'shape': 'triangle',
                        'width': '40px',
                        'height': '40px',
                        'label': 'data(label)',
                        'color': '#222',
                        'font-family': nodeFont,
                        'font-size': '10px',
                        'text-wrap': 'wrap',
                        'text-max-width': '180px',
                        'text-valign': 'bottom',
                        'text-halign': 'center',
                        'text-margin-y': '5px',
                        'border-width': 0,
                    }
                },
                {
                    selector: 'edge',
                    style: {
                        'width': 5,
                        'line-color': '#41d16f',
                        'target-arrow-shape': 'triangle',
                        'target-arrow-color': '#41d16f',
                        'curve-style': 'bezier',
                        'label': 'data(timestamp)',
                        'font-family': nodeFont,
                        'font-size': '5px',
                        'text-wrap': 'wrap',
                        'text-valign': 'top',
                        'text-halign': 'center',
                        'text-margin-y': -10
                    }
                }
            ]
        });
        // Add tooltips for nodes
        const tooltip = document.createElement('div');
        tooltip.id = 'cy-tooltip'; 
        document.body.appendChild(tooltip);

        const img = document.createElement('img');
        tooltip.appendChild(img); 

        cy.on('mouseover', 'node', function (evt) {
            const node = evt.target;
            const label = node.data('id') || node.id();
            const screenshot = node.data('screenshot');
            if (screenshot) {
                img.src = screenshot;
                img.style.display = 'block';
            } else {
                img.style.display = 'none';
            }
            tooltip.style.display = 'block';
            tooltip.innerHTML = `<div style="margin-bottom: 5px;">${label}</div>`;
            tooltip.appendChild(img);
            cy.container().style.cursor = 'pointer';
        });

        cy.on('mouseout', 'node', function () {
            tooltip.style.display = 'none';
            cy.container().style.cursor = 'default';
        });

        cy.on('mousemove', function (evt) {
            if (tooltip.style.display === 'block') {
                tooltip.style.left = `${evt.originalEvent.pageX + 10}px`;
                tooltip.style.top = `${evt.originalEvent.pageY + 10}px`;
            }
        });

        // Handle node clicks to open URLs
        cy.on('tap', 'node', function(evt) {
            const node = evt.target;
            const url = node.data('id'); 
            if (url) {
                window.open(url, '_blank');
            }
        });

        // Add zoom reset button
        document.getElementById('zoom-reset').addEventListener('click', () => {
            const layout = cy.layout({
                name: 'dagre',
                edgeSep: 50, 
                directed: true,
                rankDir: 'LR',
                nodeDimensionsIncludeLabels: true,
                spacingFactor: 1.0,
                fit: true,
                animate: true,
                animationDuration: 200
            });
            layout.run();
        });
    });  
});

