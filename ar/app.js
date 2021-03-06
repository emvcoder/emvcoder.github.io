var video, canvas, context, imageData, detector;
var camera, scene, renderer;
var mesh, timeout = [];
var xrotate = 0, yrotate = 0, zrotate = 0;
var scale = 1;

function onLoad(){
    video = document.getElementById("video");
    canvas = document.getElementById("canvas");
    context = canvas.getContext("2d");

    canvas.width = window.innerWidth/scale;
    canvas.height = window.innerHeight/scale;

    function successCallback(stream) {
        if (window.webkitURL) {
            video.src = window.webkitURL.createObjectURL(stream);
        } else if (video.mozSrcObject !== undefined) {
            video.mozSrcObject = stream;
        } else {
            video.src = stream;
        }
    }

    function errorCallback(error) {}

    getUserMedia({video: {facingMode: "environment"} }, successCallback, errorCallback);

    detector = new AR.Detector();
    init();
    requestAnimationFrame(tick);
}

function tick(){
    requestAnimationFrame(tick);

    snapshot();
    var markers = detector.detect(imageData);
    drawCorners(markers);
    drawCenter(markers);
}

function snapshot(){
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    imageData = context.getImageData(0, 0, canvas.width, canvas.height);
}

function drawCorners(markers){
    var corners, corner, i, j;

    context.lineWidth = 3;

    for (i = 0; i !== markers.length; ++ i){
        corners = markers[i].corners;

        context.strokeStyle = "red";
        context.beginPath();

        for (j = 0; j !== corners.length; ++ j){
            corner = corners[j];
            context.moveTo(corner.x, corner.y);
            corner = corners[(j + 1) % corners.length];
            context.lineTo(corner.x, corner.y);
        }

        context.stroke();
        context.closePath();

        context.strokeStyle = "green";
        context.strokeRect(corners[0].x - 2, corners[0].y - 2, 4, 4);
    }
}

function drawId(markers){
    var corners, corner, x, y, i, j;

    context.strokeStyle = "blue";
    context.lineWidth = 1;

    for (i = 0; i !== markers.length; ++ i){
    corners = markers[i].corners;

    x = Infinity;
    y = Infinity;

    for (j = 0; j !== corners.length; ++ j){
        corner = corners[j];

        x = Math.min(x, corner.x);
        y = Math.min(y, corner.y);
    }

    console.log(markers[i].id)
    context.strokeText(markers[i].id, x, y)
    }
}

var prevX = 0, prevY = 0;

function drawCenter(markers) {
    for (var i = 0; i < markers.length; i++) {
        var corners = markers[i].corners;

        var x0 = corners[0].x,
            y0 = corners[0].y,
            x1 = corners[1].x,
            y1 = corners[1].y,
            x2 = corners[2].x,
            y2 = corners[2].y,
            x3 = corners[3].x,
            y3 = corners[3].y;

        var arrx = [x1, x2, x3];
        var arry = [y1, y2, y3];
        var xnum = 0,
            ynum = 0;

        arry.forEach(function(ys) {
            if (ys > y0) ynum++;
        })

        arrx.forEach(function(xs) {
            if (x0 > xs) xnum++;
        })

        var x = (x0+x1+x2+x3)*scale/4;
        var y = (y0+y1+y2+y3)*scale/4;

        // context.fillStyle = "blue";
        // context.fillRect(x-2, y-2, 4, 4);

        var AD = Math.sqrt(Math.pow(Math.abs(x0 - x3), 2)+Math.pow(Math.abs(y0 - y3), 2));
        var AB = Math.sqrt(Math.pow(Math.abs(x0 - x1), 2)+Math.pow(Math.abs(y0 - y1), 2));
        var BC = Math.sqrt(Math.pow(Math.abs(x1 - x2), 2)+Math.pow(Math.abs(y1 - y2), 2));
        var CD = Math.sqrt(Math.pow(Math.abs(x2 - x3), 2)+Math.pow(Math.abs(y2 - y3), 2));

        var a = (AB+BC+CD+AD)*1.5/4;

        var k = (AB > CD) ? 1 : -1;

        var t = AD > BC ? 1 : -1;

        if (ynum > 1) {
           k = -k;
           t = -t;
        }
        var alpha = k*Math.atan((Math.min(AB, CD) - Math.max(AB, CD))/Math.abs(y0 - y3));
        var betha = t*Math.atan((Math.min(BC, AD) - Math.max(BC, AD))/Math.abs(y1 - y2));

        // if (xnum > 1) {
        //  var corner_s = alpha;
        //  alpha = betha;
        //  betha = alpha;
        // }

        xrotate = xrotate + 0.05;
        yrotate = yrotate + 0.05;
//         zrotate = zrotate + 0.05;

        prevX = (x - window.innerWidth/2);
        prevY = (window.innerHeight/2 - y);

        removeEntity(markers[i].id);
        createObjectMesh(markers[i].id, a);

        scene.add(mesh);

        mesh.position.x = prevX;
        mesh.position.y = prevY;
        mesh.position.z = a/Math.sqrt(2);
        
        mesh.rotation.z = zrotate;
        mesh.rotation.x = xrotate;
        mesh.rotation.y = yrotate;

        clearTimeout(timeout[markers[i].id]);
        timeout[markers[i].id] = setTimeout(removeEntity, 800, markers[i].id);
    }
    renderer.render(scene, camera);
}

function createObjectMesh(id, side) {
    var geometry;

    switch (id) {
        case 100:
            geometry = new THREE.CubeGeometry(side, side, side);
            break;
        case 101:
            geometry = new THREE.CubeGeometry(side, 2*side, side);
            break;
        case 102:
            geometry = new THREE.ConeGeometry(side/2*1.5, side*1.5, 4);
            break;
        case 103:
            geometry = new THREE.CylinderGeometry(side/2, side/2, side, 64);
            break;
        case 104:
            geometry = new THREE.ConeGeometry(side/2, side, 64);
            break;
        case 105:
            geometry = new THREE.CylinderGeometry(side, side, 2*side, 3);
            break;
        case 106:
            geometry = new THREE.TetrahedronGeometry(side/2);
            break;
        case 107:
            geometry = new THREE.OctahedronGeometry(side/2);
            break;
        case 108:
            geometry = new THREE.DodecahedronGeometry(side/2);
            break;
        case 109:
            geometry = new THREE.IcosahedronGeometry(side/2);
            break;
        default:
            geometry = null;
  }

  var material = new THREE.MeshNormalMaterial();
  mesh = new THREE.Mesh(geometry, material);
  mesh.name = id;
}

function removeEntity(id) {
    var selectedObject = scene.getObjectByName(id);
    scene.remove(selectedObject);
}

function init() {
    camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 1, 1000 );
    camera.position.z = 1000;

    scene = new THREE.Scene();
    renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );
}

window.onload = onLoad;
