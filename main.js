        
$( document ).ready(function() {
    display_book_covers(display_graph);
    $("#nav_pills_display").find("li").on('click', function(){
        change_nav_pill(this);
    });
    $("#display_graph").click();

    var init_pos = 2;
    load_book(init_pos);

    $("#expand_toggle").on('click', function() {
        $("#section_display").removeClass("col-lg-5");
        $("#section_reading_notes").removeClass("col-lg-7");
        adjust_column_display();
    });
    $("#parallel_toggle").on('click', function() {
        $("#section_display").addClass("col-lg-5");
        $("#section_reading_notes").addClass("col-lg-7");
        adjust_column_display();
    });
    
})

function change_nav_pill(obj) {
    $("#nav_pills_display").find("li").removeClass("active");
    $(obj).addClass("active");

    $(".display_tab").hide();
    if ($(obj).attr('id') == "display_standard") {
        $("#section_book_cover").show();
    }
    if ($(obj).attr('id') == "display_graph") {
        $("#section_graph").show();
    }
}

function adjust_column_display() {
    $("#expand_toggle").toggle();
    $("#parallel_toggle").toggle();
    window.dispatchEvent(new Event('resize'));
}


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

        var fixedWidth = 120
        sprite.scale.set( 
            fixedWidth,
            imgElement.height * (fixedWidth / imgElement.naturalWidth)
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
    const graph_container = document.getElementById('section_display');

    const Graph = ForceGraph3D(
        { 
            controlType: 'orbit', 
            rendererConfig: { antialias: true, alpha: true },
        }
    )(document.getElementById('section_graph'))
      .width(graph_container.clientWidth)
      .height(1200)
      .backgroundColor('black')
      .showNavInfo(true)
      .jsonUrl(graph_file)
      .dagMode('td') 
      .cameraPosition({x: 0, y: 1200, z: 1200})
      .linkColor((link) => {
        if (link.type == "contains") { return reading_info[link.source[0]]['color'] };
        if (link.type == "related") { return 'red'}
        if (link.type == "read_sequence") { return 'lightgrey' }
      })
      .linkOpacity(.5)
      .linkWidth((link)=> {
        if (link.type == "related") { return 1 };
        return 0;
      })
      .linkDirectionalParticles((link)=> {
        if (link.type == "related") { return 10};
        return 0;
      })
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
            load_book(node.book_key, node.bookmark_page);
            $("#message_selected_page .title").html(node.title);
            $("#message_selected_page .page").html(node.bookmark_page);
            $("#message_selected_page").show();
            
        } else {
            load_book(node.book_key);
        }
      })

    Graph.d3Force('charge').strength(-80);
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
        $(img).attr("onclick", "load_book(" + book_key + ")");
        section_book_covers.append(book_cover.html());
    }
    callback();
}


