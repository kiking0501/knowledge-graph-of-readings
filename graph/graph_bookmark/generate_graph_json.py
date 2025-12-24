import json
from glob import glob
import os
import re

def dump_json(args):
    """
        Generate the graph json file in the form of
        {
            "nodes": [...],
            "edges: [...]
        }
    """
    def get_book_keys(bookmark_suffix):
        book_keys = []
        for file in glob(f"../bookmarks/*{bookmark_suffix}"):
            book_keys.append(
                file.rpartition('/')[2].partition('_')[0]
            )
        return book_keys

    book_keys = get_book_keys(args.bookmark_suffix)
    core_graph = get_core_graph(book_keys)
    bookmark_graph = get_bookmark_graph(book_keys, dump_json=True)
    custom_graph = get_custom_graph(args.custom_graph_file)

    combine_list = [core_graph, bookmark_graph, custom_graph]
    graph = {
        'nodes': [node for g in combine_list for node in g.get('nodes', [])],
        'links': [link for g in combine_list for link in g.get('links', [])],
    }

    with open(args.output_path, "w") as f:
        json.dump(graph, f, indent=4)

    print(f"{args.output_path} saved.")


def get_custom_graph(custom_graph_file):
    """ Load custom graph info from file """
    return json.load(open(custom_graph_file, "r"))


def get_core_graph(book_keys, dump_json=False):
    """ Get the core graph of "Book" nodes """
    graph = {
        "nodes": [
            {
                "id": book_key,
                "book_key": book_key,
                "type": "img",
            }
            for book_key in book_keys
        ],
        "links": [
        ]
    }
    if dump_json:
        with open("graph_core.json", "w") as f:
            json.dump(graph, f, indent=4)

    return graph


def get_bookmark_graph(book_keys, dump_json=False):
    """
        Get the bookmark subgraphs corresponding to each "Book",
            where "Book" nodes are the roots,
            and each bookmark section contributes to a child node of these roots
    """

    def get_path_bookmark(book_key):
        return f"../bookmarks/{book_key}_bookmark.txt"

    def get_id_bookmark(book_key, bookmark_title):
        digits = re.findall(r'\d+', bookmark_title)
        if digits:
            return f"{'-'.join([book_key] + digits)}"
        return None

    def get_keyword_bookmark(bookmark_title):
        return bookmark_title.partition(':')[2].strip()

    def get_graph_bookmark(bookmark_info):
        nodes, links = [], []

        parent_ids = {}  
        for book_key, bookmark_id, info in bookmark_info:
            if bookmark_id is None: continue
            nodes.append(
                {
                    "id": bookmark_id,
                    "bookmark_name": info['title'],
                    "bookmark_page": info["page"],
                    "bookmark_level": info['level'],
                    "title": get_keyword_bookmark(info['title']),
                    "book_key": book_key,
                    "type": "text",
                }
            )
            parent_ids[info['level']] = bookmark_id

            if info['level'] == 1 or not (parent_ids.get(info['level']-1)):
                parent_bookmark_id = book_key
            else:
                parent_bookmark_id = parent_ids[info['level']-1]
            links.append(
                {
                    "source": parent_bookmark_id,
                    "target": bookmark_id,
                    "type": "contains",

                }
            )
        return {"nodes": nodes, "links": links}


    all_graph = []

    for book_key in book_keys:
        path = get_path_bookmark(book_key)
        if not os.path.exists(path):
            print(f"{path} does not exists; skipping")
            continue
        
        bookmark_info = [
            (book_key, get_id_bookmark(book_key, info['title']), info)
            for info in read_bookmark_info(path)
        ]
        bookmark_graph = get_graph_bookmark(bookmark_info)

        if dump_json:
            with open(f"tmp_graph_bookmark_{book_key}.json", "w") as f:
                json.dump(bookmark_graph, f, indent=4)

        all_graph.append(bookmark_graph)

    graph = {
        'nodes': [node for g in all_graph for node in g['nodes']],
        'links': [link for g in all_graph for link in g['links']],
    }
    return graph

def read_bookmark_info(filename):
    '''
        Extracting PDF bookmark info by parsing a file that contains the below lines
            BookmarkBegin
            BookmarkTitle: Chapter 1: General
            BookmarkLevel: 1
            BookmarkPageNumber: 1
            
            BookmarkBegin (<--- repeat)
            ...
        
        Output:
        [
            {
                'title' (str): 'Chapter 1: General', 
                'level' (int): 1, 
                'page'  (int): 1
            },
            ...
        ]
    '''
    with open(filename, "r") as f:
        # a list of strings starting with Bookmark* 
        lines = [x.strip() for x in f.readlines() if x.startswith('Bookmark')]
    bookmarks = [
        {   
            'title': title[len('BookmarkTitle:'):].strip().replace('&amp;', '&').replace("&apos;", "'"),
            'level': int(level[len('BookmarkLevel:'):].strip()),
            'page': int(page[len('BookmarkPageNumber:'):].strip()),
        }
        for title, level, page in [
            # 1. get a string that is joined by the separator '\n' on the bookmark* lines
            # 2. split the string into substrings by the Bookmark indicator 'BookmarkBegin\n', one substring per bookmark 
            # 3. split this bookmark-substring by '\n' again to get the title/level/page info
            x.strip().split('\n') for x in '\n'.join(lines).split('BookmarkBegin\n') if x
        ]
    ]
    return bookmarks



if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(
        description="Generate JSON files for Graph Display",
    )
    parser.add_argument('--bookmark_suffix', default='_bookmark.txt',
                        help='If files within the bookmarks/ folder have this suffix, they will'
                             'be scanned for creating the bookmark-subgraphs in the final graph')
    parser.add_argument('--custom_graph_file', default='relation_edges.json',
                        help='Nodes and edges from this file will be added to the final graph')
    parser.add_argument('--output_path', default="tmp_graph.json",
                        help='Output of the final graph json file')
    args = parser.parse_args()
    dump_json(args)