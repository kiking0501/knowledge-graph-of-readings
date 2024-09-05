Generate a JSON file consisting of nodes and edges information from the bookmarks of different PDFs

### 1. Generate bookmark files

Navigate to `bookmarks/`, follow instructions there to generate the bookmark files for each PDF file.


### 2. Generate graph file

Come back to `graph/`, run 
```
python generate_graph_json.py --output_graph <output_graph>.json
````
Currently `main.js` will look for `complete_graph.json` under this folder. Check the python code for more details on how the node and edges are defined

### 3. Custom nodes & edges

Modify `relation_edges.json` to include custom nodes & edges to the final graph.
