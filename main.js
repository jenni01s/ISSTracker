const posNum = 24;
var positions = new Array();
var slider = document.getElementById("slider");

async function getData(num) {
    url = 'https://api.wheretheiss.at/v1/satellites/25544/positions?timestamps=';
    timestamp = new Array(num);
    for (i = 0; i < num; i++) {
        timestamp[i] = Date.now() - 3600000 * i;
    }
    const apiUrl = `${url}${timestamp.join(",")}`;
    const response = await fetch(apiUrl);
    const data = await response.json();
    return data;
}

getData(posNum).then(data => data.forEach((element) => positions.push({
    "longitude": element.longitude,
    "latitude": element.latitude,
    "timestamp": element.timestamp
}))).then(() => slider.disabled = false);


var scene = new THREE.Scene();
var renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true
});
var camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.z = 9;


var light = new THREE.AmbientLight(0xFFFFFFF);
light.position.set(0, 0, 25);
scene.add(light);

scene = loadEarth(scene);
scene = loadISS(scene);

var controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.minDistance = 6;
controls.maxDistance = 10;
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("universe").appendChild(renderer.domElement);
renderer.render(scene, camera);

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

function loadEarth(scene) {
    var texture = new THREE.TextureLoader().load('assets/earth.jpg');
    const geometry = new THREE.SphereGeometry(4, 50, 50);
    var material = new THREE.MeshLambertMaterial({
        map: texture,
    });
    var earth = new THREE.Mesh(geometry, material);
    earth.position.set(0, 0, 0);
    earth.rotation.y = -Math.PI / 2;
    earth.name = 'earth';
    scene.add(earth);
    return scene;
}


function loadISS(scene) {
    var loader = new THREE.GLTFLoader();
    loader.load('assets/iss/scene.gltf',
        function (gltf) {
            iss = gltf.scene;
            iss.name = 'iss';
            iss.scale.set(0.05, 0.05, 0.05);
            iss.position.set(0, 0, 0);
            scene.add(iss);
        },
        function (xhr) {
            // console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        function (error) {
            console.log(error);
        }
    );
    return scene;
}

function calcIssPosition(iss, lat, lng) {
    const radius = 5;
    var phi = (lat >= 0 ? 90 - lat : 90 + Math.abs(lat));
    var theta = (lng >= 0 ? lng : 360 - Math.abs(lng));

    //convert phi and theta to radian measure 
    var rad_phi = (phi / 360) * 2 * Math.PI;
    var rad_theta = (theta / 360) * 2 * Math.PI;
    var newPos = new THREE.Vector3().setFromSphericalCoords(radius, rad_phi, rad_theta);

    iss.position.set(newPos.x, newPos.y, newPos.z);

}

function showTime(index) {
    let output = new Date(positions[index].timestamp).toLocaleDateString("en-US");
    output += " ";
    output += new Date(positions[index].timestamp).toLocaleTimeString();
    return output;
}

function ConvertDEGToDMS(deg, lat) {
    var absolute = Math.abs(deg);
    var degrees = Math.floor(absolute);
    var minutesNotTruncated = (absolute - degrees) * 60;
    var minutes = Math.floor(minutesNotTruncated);
    var seconds = ((minutesNotTruncated - minutes) * 60).toFixed(2);
    if (lat) {
        var direction = deg >= 0 ? "N" : "S";
    } else {
        var direction = deg >= 0 ? "E" : "W";
    }

    return degrees + "°" + minutes + "'" + seconds + "\"" + direction;
}

var displayTime = document.getElementById("displayTime");
var displayCoords = document.getElementById("displayCoords");

var render = function () {
    requestAnimationFrame(render);
    controls.update();
    if (scene.children.length == 3 && positions.length == 24) { // if iss is loaded && api data available
        var indexOfPos = slider.value;
        var iss = scene.getObjectByName("iss");
        let latitude = positions[indexOfPos].latitude;
        let longitude = positions[indexOfPos].longitude;
        calcIssPosition(iss, latitude, longitude);
        displayTime.innerHTML = showTime(indexOfPos);
        displayCoords.innerHTML = ConvertDEGToDMS(latitude, true) + " , " + ConvertDEGToDMS(longitude, false);
    }
    renderer.render(scene, camera);
}
render();