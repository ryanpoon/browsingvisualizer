// visualization/visualization.js
// This script runs in the visualization page to display the browsing history
// TODOS:
// Use a charting library to visualize the data, want graphs, timelines, maybe
// screenshots of pages visited

import cytoscape from "./cytoscape.esm.min.js";

// boilerplate to get data from storage
chrome.storage.local.get(["history"], function(result) {
    const data = result || [];
    document.getElementById("chart").innerText = JSON.stringify(data.history, null, 2);
});
