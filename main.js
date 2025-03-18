        
$( document ).ready(function() {
    var params = {
        "book_key": 2, // default value
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


import * as THREE from '//unpkg.com/three/build/three.module.js';
import SpriteText from "//unpkg.com/three-spritetext/dist/three-spritetext.mjs";

function display_graph() {

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
        sprite.strokeColor = 'black';
        sprite.strokeWidth = 2;

        return sprite;
    }

    const graph_file = './graph/complete_graph.json'
    const graph_container = document.getElementById('graph_container');

    const Graph = ForceGraph3D(
        { 
            controlType: 'orbit', 
            rendererConfig: { antialias: true, alpha: true },
        }
    )(document.getElementById('section_graph'))
      .width(graph_container.clientWidth)
      // .height(1200)
      .height(graph_container.clientHeight / 2)
      .backgroundColor('black')
      .showNavInfo(true)
      .jsonUrl(graph_file)
      .dagMode('zout')
      .cameraPosition({x: 0, y: 0, z: 800}) 
      .linkColor((link) => {
        if (link.type == "contains") { return reading_info[link.source[0]]['color'] };
        if (link.type == "related") { return 'red'}
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
        console.log(node);
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
      })

    Graph.d3Force('charge').strength(-100);
    window.addEventListener('resize', () => {
        Graph.width(graph_container.clientWidth);
    });
}


function display_book_covers(callback) {
    var section_book_covers = $("#section_book_cover")
    section_book_covers.html("");
    for (let i = 0; i < order.length; i++) {
        var book_key = order[i];
        var book_cover = $("#template_book_cover").clone();

        var title = reading_info[book_key]['title'];
        var glink = reading_info[book_key]['glink'];
        book_cover.find(".book_cover").attr("id", "cover_" + title);
        
        var img = book_cover.find("img")[0];
        $(img).attr("id", "img_" + title);
        $(img).attr("src","./media/covers/cover_" + title + ".jpg");
        $(img).attr("title", $("#description_" + title).text());
        $(img).attr("onclick", "load_book('" + book_key + "')");
        section_book_covers.append(book_cover.html());
    }
    $("#section_change_log").show();
    callback();
}

