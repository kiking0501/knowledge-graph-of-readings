        
$( document ).ready(function() {
    var params = {
        "book_key": "2", // default value
        "display_graph": 1, // default display
    };
    let urlParams = new URLSearchParams(window.location.search.substring(1));
    urlParams.forEach((value, key) => {
        params[key] = value;
    });

    display_book_covers(build_graph);
    if (params["display_graph"] != 1) toggle_graph();

    load_book(params["book_key"]);
})


import * as THREE from "./js_three/three.module.js";
import SpriteText from "./js_three/three-spritetext.mjs";

const Graph = {};

function build_graph() {

    var suffix_list = ["", "_practitioners"];
    var dag_modes = ["td", "td"];
    var relate_colors = ["red", "white"];

    for (let i = 0; i < suffix_list.length; i++) {
        Graph["graph" + suffix_list[i]] = ForceGraph3D(
            { 
                controlType: 'orbit', 
                rendererConfig: { antialias: true, alpha: true },
            }
        )(document.getElementById('section_graph' + suffix_list[i]), { controlType: 'orbit' })
        .jsonUrl('./graph/complete_graph' + suffix_list[i] + '.json');

        _build_graph( 
            Graph["graph" + suffix_list[i]], 
            document.getElementById('graph_container' + suffix_list[i]),
            suffix_list[i],
            dag_modes[i],
            relate_colors[i],
        );

        Graph["selected" + suffix_list[i]] = null;
    }
}

function _build_graph(graph, graph_container_obj, suffix, dagMode, relate_color) {

    function getImgSprite(book_key, opacity) {
        var title = reading_info[book_key]['title'];
        var imgElement = $("#cover_" + title).find("img")[0];

        const imgTexture = new THREE.TextureLoader().load(imgElement.src);
        imgTexture.colorSpace = THREE.SRGBColorSpace;
        const material = new THREE.SpriteMaterial({
            map: imgTexture,
            opacity: opacity,
        });
        const sprite = new THREE.Sprite(material);

        var fixedWidth = 120;
        sprite.scale.set( 
            fixedWidth,
            imgElement.naturalHeight * (fixedWidth / imgElement.naturalWidth)
        );
        return sprite;
    }

    function getTextSprite(title, color, level, opacity) {
        const sprite = new SpriteText(title);
        sprite.material.depthWrite = false; // make sprite background transparent
        sprite.material.opacity = opacity;
        sprite.color = color;
        sprite.textHeight = 11 - level;
        sprite.strokeColor = "black";
        sprite.strokeWidth = 2;
        

        return sprite;
    }
    function is_solid_link(link_obj, selected_id) {
        return (
            link_obj.source.book_key == undefined ||
            selected_id == null ||
            link_obj.source.book_key == selected_id ||
            link_obj.target.book_key == selected_id
        );
    }

    graph
      .width(graph_container_obj.clientWidth)
      .height(graph_container_obj.clientHeight / 2)
      .backgroundColor("black")
      .showNavInfo(true)
      .dagMode(dagMode)
      .cameraPosition({x: 700, y: 700, z: 1300})
      .linkColor((link) => {
        if (link.type == "contains") { 
            var node_id = link.source.id? link.source.id : link.source
            return reading_info[node_id.split("-")[0]]['color']; 
        };
        if (link.type == "related") { return relate_color }
        if (link.type == "read_sequence") { return 'lightgrey' }
      })
      .linkWidth((link)=> {
        return is_solid_link(link, Graph["selected" + suffix])? 1.5 : 0.5
      })
      .linkOpacity(.5)
      .linkDirectionalParticles((link)=> {
        if (link.type == "related") {
            return is_solid_link(link, Graph["selected" + suffix])? 10 : 0
        }; 
        return 0; 
      })
      .linkDirectionalParticleWidth(1.5)
      .linkDirectionalParticleSpeed(0.003)
      .nodeThreeObject((node) => {
        const opacity = (
            Graph["selected" + suffix] == node.book_key ||
            !Graph["selected" + suffix]
        )? 1.0 : 0.4; 
        if (node.type == "img") {
            return getImgSprite(node.book_key, opacity);
        }
        if (node.type == "text") {
            return getTextSprite(
                node.title, reading_info[node.book_key]['color'], node.bookmark_level, opacity
            );
        }
      })
      .onNodeClick((node) => {
        if (node.type == "text") {
            load_book(node.book_key, node.bookmark_page, node.bookmark_name);

            // Camera move - Aim at node from outside it
              // const distance = 300;
              // const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);

              // const newPos = node.x || node.y || node.z
              //   ? { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }
              //   : { x: 0, y: 0, z: distance }; // special case if node is in (0,0,0)

              // graph.cameraPosition(
              //   newPos, // new position
              //   node, // lookAt ({ x, y, z })
              //   2000  // ms transition duration
              // );
            
        } else {
            load_book(node.book_key);
        };

        Graph["selected" + suffix] = node.book_key;
        refresh_graph(graph);
        // console.log(Graph.cameraPosition());
      })
      .onBackgroundClick(() => { 
        Graph["selected" + suffix] = null;
        refresh_graph(graph);
    })


    graph.d3Force('charge').strength(-100);
    window.addEventListener('resize', () => {
        graph.width(graph_container_obj.clientWidth);
    });
}

function refresh_graph(graph) {
    graph
        .nodeThreeObject(graph.nodeThreeObject())
        .linkWidth(graph.linkWidth())
        .linkDirectionalParticles(graph.linkDirectionalParticles());
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

