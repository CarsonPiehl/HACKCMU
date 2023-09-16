import {useState} from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DragControls } from 'three/examples/jsm/controls/DragControls.js';

function randomColor () {
    return new THREE.Color(Math.random(), Math.random(), Math.random());
}


function generateRandomLandmarks(xBounds : Array<number>, yBounds : Array<number>, zBounds : Array<number>, n : number, scene : (THREE.Scene | undefined) = undefined ) {
    let minX = xBounds[0];
    let maxX = xBounds[1];
    let minY = yBounds[0];
    let maxY = yBounds[1];
    let minZ = zBounds[0];
    let maxZ = zBounds[1];

    let meshArr : Array<THREE.Mesh> = new Array(n);
    
    for (let i = 0; i < n; i++) {
        let x = minX + (Math.random() * (maxX - minX));
        let y = minY + (Math.random() * (maxY - minY));
        let z = minZ + (Math.random() * (maxZ - minZ));

        meshArr[i] = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({color: randomColor()}));
        meshArr[i].position.x = x;
        meshArr[i].position.y = y;
        meshArr[i].position.z = z;
        
        if (scene) scene.add(meshArr[i]);
    }
    return meshArr;
}

export default function Three() {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    function onPointerMove (event : MouseEvent) {
        pointer.x = ((event.clientX / window.innerWidth) * 2) - 1;
        pointer.y = -((event.clientY / window.innerHeight) * 2) + 1
    }
    

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.innerHTML = "";
    document.body.appendChild( renderer.domElement );



    const ground : any = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshBasicMaterial( {color: 0xff6961} ));

    ground.rotation.x = -(Math.PI/2);
    ground.position.y = -2;
    scene.add(ground);

    camera.position.z = -0.001;

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enablePan = false;

    let meshes = generateRandomLandmarks([-20, 20], [0, 20], [-20, 20], 30, scene);

    function animate() {
        requestAnimationFrame( animate );

        // calculate pointer position in normalized device coordinates
        // (-1 to +1) for both 
        raycaster.setFromCamera( pointer, camera );

        for (let i = 0; i < meshes.length; i++) {
            let mesh = meshes[i];
            mesh.rotation.x += .02;
            mesh.rotation.y += .02;
        }
        
        renderer.render( scene, camera );
    }

    window.addEventListener("pointermove", onPointerMove)

    animate();
}