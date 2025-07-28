// visualization/visualization.js
// This script runs in the visualization page to display the browsing history

// TODO add sliding control for time, store timestamps for nodes and edges

// Convert timestamp to human-readable time ago (thanks chatgpt)
function timeAgo(timestamp) {
    const now = Date.now();
    let diff = now - timestamp;
    const isPast = diff >= 0;
    diff = Math.abs(diff);

    const units = [
        { unit: 'year',   ms: 1000 * 60 * 60 * 24 * 365 },
        { unit: 'month',  ms: 1000 * 60 * 60 * 24 * 30 },
        { unit: 'week',   ms: 1000 * 60 * 60 * 24 * 7 },
        { unit: 'day',    ms: 1000 * 60 * 60 * 24 },
        { unit: 'hour',   ms: 1000 * 60 * 60 },
        { unit: 'minute', ms: 1000 * 60 },
        { unit: 'second', ms: 1000 },
    ];

    let result = [];

    for (let i = 0; i < units.length; i++) {
        const { unit, ms } = units[i];
        const delta = Math.floor(diff / ms);
        if (delta >= 1) {
            result.push(`${delta} ${unit}${delta !== 1 ? 's' : ''}`);
            diff -= delta * ms;

            // Try to get one more smaller unit
            for (let j = i + 1; j < units.length; j++) {
                const nextDelta = Math.floor(diff / units[j].ms);
                if (nextDelta >= 1) {
                    result.push(`${nextDelta} ${units[j].unit}${nextDelta !== 1 ? 's' : ''}`);
                }
                break;
            }

            break;
        }
    }

    if (result.length === 0) {
        return 'just now';
    }

    return isPast
        ? result.join(' ') + ' ago'
        : 'in ' + result.join(' ');
}




// Extract nodes and edges from history
function extractGraph(history) {
    const nodes = [];
    const edges = [];
    const nodeSet = new Set();

    history.forEach(entry => {
        // Resolve fragment identifiers
        entry.url = entry.url.split('#')[0];
        entry.referrer = entry.referrer.split('#')[0];
        if (!nodeSet.has(entry.url)) {
            nodes.push(
                { data: 
                    { 
                        id: entry.url, 
                        label: entry.title, 
                        screenshot: entry.screenshot, 
                        favicon: entry.favicon,
                    } 
                }
            );
            nodeSet.add(entry.url);
        } else {
            // If the node already exists, update the screenshot if it has one
            const existingNode = nodes.find(node => node.data.id === entry.url);
            if (entry.screenshot && !existingNode.data.screenshot) {
                existingNode.data.screenshot = entry.screenshot; 
            }
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

// Load the graph visualization
document.addEventListener('DOMContentLoaded', () => {
    const spinner = document.getElementById('loading-spinner');
    spinner.style.display = 'block'; 

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
                spacingFactor: 1.1,
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
                    selector: 'node[!screenshot][favicon]',
                    style: {
                        'background-image': 'data(favicon)',
                        'background-fit': 'cover',
                        'background-color': 'transparent',
                        'shape': 'ellipse',
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
                        'border-width': 0
                    }
                },
                {
                    selector: 'node[!screenshot][!favicon]',
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
                        'line-color': '#41c7d1',
                        'target-arrow-shape': 'triangle',
                        'target-arrow-color': '#41c7d1',
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

        cy.ready(() => {
            spinner.style.display = 'none';
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

