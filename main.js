        
$( document ).ready(function() {
    var params = {
        "book_key": "2", // default value
        "display_graph": 1, // default display
    };
    let urlParams = new URLSearchParams(window.location.search.substring(1));
    urlParams.forEach((value, key) => {
        params[key] = value;
    });

    display_book_covers(display_graph);
    if (params["display_graph"] != 1) toggle_graph();

    load_book(params["book_key"]);
})


import * as THREE from "./js_three/three.module.js";
import SpriteText from "./js_three/three-spritetext.mjs";


function display_graph() {

    var suffix_list = ["", "_practitioners"];
    var background_colors = ["black", "black"];
    var dag_modes = ["td", "td"];
    var relate_colors = ["red", "white"];

    for (let i = 0; i < suffix_list.length; i++) {

        var Graph = ForceGraph3D(
            { 
                controlType: 'orbit', 
                rendererConfig: { antialias: true, alpha: true },
            }
        )(document.getElementById('section_graph' + suffix_list[i]))
        .jsonUrl('./graph/complete_graph' + suffix_list[i] + '.json');

        _display_graph( 
            Graph, 
            document.getElementById('graph_container' + suffix_list[i]), 
            background_colors[i],
            dag_modes[i],
            relate_colors[i],
        );
    }
}

function _display_graph(Graph, graph_container_obj, background_color, dagMode, relate_color) {

    function getImgSprite(book_key) {
        var title = reading_info[book_key]['title'];
        var imgElement = $("#cover_" + title).find("img")[0];

        const imgTexture = new THREE.TextureLoader().load(imgElement.src);
        imgTexture.colorSpace = THREE.SRGBColorSpace;
        const material = new THREE.SpriteMaterial({ map: imgTexture });
        const sprite = new THREE.Sprite(material);

        var fixedWidth = 120;
        sprite.scale.set( 
            fixedWidth,
            imgElement.naturalHeight * (fixedWidth / imgElement.naturalWidth)
        );
        return sprite;
    }

    function getTextSprite(title, color, level) {
        const sprite = new SpriteText(title);
        sprite.material.depthWrite = false; // make sprite background transparent
        sprite.color = color;
        sprite.textHeight = 11 - level;
        sprite.strokeColor = background_color;
        sprite.strokeWidth = 2;

        return sprite;
    }

    Graph
      .width(graph_container_obj.clientWidth)
      .height(graph_container_obj.clientHeight / 2)
      .backgroundColor(background_color)
      .showNavInfo(true)
      .dagMode(dagMode)
      .cameraPosition({x: 815, y: 777, z: 930}) 
      .linkColor((link) => {
        if (link.type == "contains") { return reading_info[link.source.split("-")[0]]['color']; 
        };
        if (link.type == "related") { return relate_color }
        if (link.type == "read_sequence") { return 'lightgrey' }
      })
      .linkOpacity(.5)
      .linkWidth((link)=> { if (link.type == "related") { return 1 }; return 0; })
      .linkDirectionalParticles((link)=> { if (link.type == "related") { return 10}; return 0; })
      .linkDirectionalParticleWidth(1.5)
      .linkDirectionalParticleSpeed(0.003)
      .nodeThreeObject((node) => {
        if (node.type == "img") {
            return getImgSprite(node.book_key);
        }
        if (node.type == "text") {
            return getTextSprite(
                node.title, reading_info[node.book_key]['color'], node.bookmark_level
            );
        }
      })
      .onNodeClick((node) => {
        if (node.type == "text") {
            load_book(node.book_key, node.bookmark_page, node.bookmark_name);

            // Aim at node from outside it
              const distance = 300;
              const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);

              const newPos = node.x || node.y || node.z
                ? { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }
                : { x: 0, y: 0, z: distance }; // special case if node is in (0,0,0)

              Graph.cameraPosition(
                newPos, // new position
                node, // lookAt ({ x, y, z })
                2000  // ms transition duration
              );
            
        } else {
            load_book(node.book_key);
        };
        // console.log(Graph.cameraPosition());
      })

    Graph.d3Force('charge').strength(-100);
    window.addEventListener('resize', () => {
        Graph.width(graph_container_obj.clientWidth);
    });
}


function display_book_covers(callback) {
    function fill_book_cover(book_key, book_cover) {
        var title = reading_info[book_key]['title'];
        var glink = reading_info[book_key]['glink'];
        book_cover.find(".book_cover").attr("id", "cover_" + title);
        
        var img = book_cover.find("img")[0];
        $(img).attr("id", "img_" + title);
        $(img).attr("src","./media/covers/cover_" + title + ".jpg");
        $(img).attr("title", $("#description_" + title).text());

        if (!todos.has(book_key)) {
            $(img).attr("onclick", "load_book('" + book_key + "')");
        } else {
            $(img).css("cursor", "not-allowed")
        }
        return book_cover
    }
    var section_book_covers = $("#section_book_cover")
    section_book_covers.html("");

    var row_div = $('<div>', { class: 'row' });
    for (let i = 0; i < order.length; i++) {
        var book_key = order[i];
        var book_cover = $("#template_book_cover_3").clone();
        book_cover.removeAttr("id");

        fill_book_cover(book_key, book_cover);

        row_div.append(book_cover.html());
        if (!((i+1) % 4)) {
          section_book_covers.append(row_div);
          row_div = $('<div>', { class: 'row' });
        }
    }
    section_book_covers.append(row_div);

    var section_extra_book_covers = $("#section_extra_book_cover")
    section_extra_book_covers.html("");
    row_div = $('<div>', { class: 'row' });
    for (let i = 0; i < order_practitioners.length; i++) {
        var book_key = order_practitioners[i];
        var book_cover = $("#template_book_cover_2").clone();
        book_cover.removeAttr("id");

        fill_book_cover(book_key, book_cover);

        row_div.append(book_cover.html());
        if (!((i+1) % 6)) {
          section_extra_book_covers.append(row_div);
          row_div = $('<div>', { class: 'row' });
        }
    }
    section_extra_book_covers.append(row_div);



    $("#section_change_log").show();
    callback();
}

