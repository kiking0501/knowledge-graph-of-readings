"""
 Example command:
    python3 generate_manifest_html_elements.py
            --bookmark_input_file ../bookmarks/3_bookmark.txt
            --output_path tmp_manifest_3.html

"""

def generate_html_elements(args):
    def get_keyword_bookmark(bookmark_title):
        return bookmark_title.partition(':')[2].strip()

    def a_manifest_chapter_header(book_key, page_number, title):
        return f"""
    <h4> <a class="manifest_chapter_header" onclick="load_book({book_key}, {page_number}, '{title}')">
        <i class="fa fa-pencil-square" aria-hidden="true"></i> {title}
    </a> </h4>
"""

    def toggle_manifest_chapter_header(selected_text):
        return f"""
<h4 class="manifest_chapter_header" onclick="toggle_manifest_chapter(this);"> 
    <i class="fa fa-chevron-down"> </i> 
    {selected_text}
</h4>
"""

    def manifest_ul_li_element(book_key, page_number, title):
        trim_title = get_keyword_bookmark(title)
        return f"""
<li><a onclick="load_book({book_key}, {page_number}, '{title}')">
    {trim_title}
</a></li>
"""
    
    def is_chapter_header(title):
        return title.lower().strip().startswith("chapter") or not title[0].strip().isdigit()


    bookmarks = read_bookmark_info(args.bookmark_input_file)
    is_all_chapter_header = all( [is_chapter_header(item['title']) for item in bookmarks])
    with open(args.output_path, "w") as f:
        for item in bookmarks:
            if is_chapter_header(item['title']) and (not is_all_chapter_header):
                f.write("\n/* -------- */\n")
                element = toggle_manifest_chapter_header(item['title'])
            elif item['title'][0].strip().isdigit():
                element = manifest_ul_li_element(
                    args.bookmark_input_file.partition('_')[0].rpartition('/')[2],
                    item["page"],
                    item["title"]
                )
            else:
                element = a_manifest_chapter_header(
                    args.bookmark_input_file.partition('_')[0].rpartition('/')[2],
                    item["page"],
                    item["title"]
                )
            f.write(element)
        print(f"{args.output_path} saved.")

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
        description="Generate html elements for the manifest html",
    )
    parser.add_argument('--bookmark_input_file',
                        help='Input path for the bookmark file')
    parser.add_argument('--output_path',
                        help='Output path of the generated html elements file')
    args = parser.parse_args()
    generate_html_elements(args)

