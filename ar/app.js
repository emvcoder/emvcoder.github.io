var video, canvas, context, imageData, detector;
var camera, scene, renderer;
var mesh, timeout = [];
let xrotate = 0, yrotate = 0;

let marker_s = 40*40;

function onLoad(){
    video = document.getElementById("video");
    canvas = document.getElementById("canvas");
    context = canvas.getContext("2d");

    canvas.width = window.innerWidth/3;
    canvas.height = window.innerHeight/3;

    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    if (navigator.getUserMedia) {
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

      navigator.getUserMedia({video: true}, successCallback, errorCallback);

      detector = new AR.Detector();
      init();
      requestAnimationFrame(tick);
    }
}

function tick(){
    requestAnimationFrame(tick);

    if (video.readyState === video.HAVE_ENOUGH_DATA){
        snapshot();
        // animate();
        var markers = detector.detect(imageData);
        drawCorners(markers);
        // drawId(markers);
        drawCenter(markers);
    }
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

    context.strokeText(markers[i].id, x, y)
    }
}

let prevX = 0, prevY = 0;

function drawCenter(markers) {
    for (let i = 0; i < markers.length; i++) {
        let corners = markers[i].corners;

        let x0 = corners[0].x,
            y0 = corners[0].y,
            x1 = corners[1].x,
            y1 = corners[1].y,
            x2 = corners[2].x,
            y2 = corners[2].y,
            x3 = corners[3].x,
            y3 = corners[3].y;

        let x = (x0+x1+x2+x3)/4;
        let y = (y0+y1+y2+y3)/4;

        let AD = Math.sqrt(Math.pow(3*Math.abs(x0 - x3), 2)+Math.pow(3*Math.abs(y0 - y3), 2));
        let AB = Math.sqrt(Math.pow(3*Math.abs(x0 - x1), 2)+Math.pow(3*Math.abs(y0 - y1), 2));
        let BC = Math.sqrt(Math.pow(3*Math.abs(x1 - x2), 2)+Math.pow(3*Math.abs(y1 - y2), 2));
        let CD = Math.sqrt(Math.pow(3*Math.abs(x2 - x3), 2)+Math.pow(3*Math.abs(y2 - y3), 2));

        let a = (AB+BC+CD+AD)/6;

        let k = ((AB - CD) > 0.1 || (AB - CD)) < -0.1 ? -1 : 1;

        let alpha = k*(Math.PI/2-Math.acos(Math.abs(y-y3)/a))*Math.PI*2;
        console.log(alpha)
        xrotate = alpha;
        yrotate = yrotate + 0.05;

        context.fillStyle = "red";
        context.fillRect(x - 2, y - 2, 4, 4);

        prevX = (3*x - window.innerWidth/2);
        prevY = (window.innerHeight/2 - 3*y);

        removeEntity(markers[i].id);

        createObjectMesh(markers[i].id, a);
        scene.add(mesh);

        mesh.position.x = prevX;
        mesh.position.y = prevY;
        mesh.position.z = a/Math.sqrt(2);

        mesh.rotation.y = yrotate;
        mesh.rotation.x = xrotate;

        clearTimeout(timeout[markers[i].id]);
        timeout[markers[i].id] = setTimeout(removeEntity, 800, markers[i].id);
    }
    renderer.render(scene, camera);
}

function createObjectMesh(id, side) {
    var geometry;

    switch (id) {
        case 7:
            geometry = new THREE.CubeGeometry(side, side, side);
            break;
        case 101:
            geometry = new THREE.CubeGeometry(side, 2*side, side);
            // geometry = new THREE.DodecahedronGeometry(side);
            break;
        case 102:
            geometry = new THREE.ConeGeometry(side/2, side, 4);
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

function animate() {
    mesh.rotation.y += 0.005;
}

window.onload = onLoad;
