## Extract and Modify the "bookmark" information of a PDF file using `pdftk` 


###1. Dump Metadata
```
pdftk <mybigfile>.pdf data_dump output <metadata>.txt
```

### 2. Modify these lines to set the desired bookmarks
```
BookmarkBegin
BookmarkTitle: My first bookmark
BookmarkLevel: 1
BookmarkPageNumber: 2
```

### 3. Update Metadata
```
pdftk mybigfile.pdf update_info bookmarks.txt output mynewfile.pdf
```

### Example for getting the metadata for book 1
```
pdftk ../nodes_pdf/kiking_notes_01_<...> data_dump output 1_bookmark.txt
```