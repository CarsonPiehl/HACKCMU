import {useState} from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DragControls } from 'three/examples/jsm/controls/DragControls.js';
import { PropagationManager } from './PropagationManager';
import { Infobox, InfoboxProps } from './Components/Infobox';
import { render } from 'react-dom';
import panUrl from './assets/cmuPan.jpg'

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

export default function Three(setter : any) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const clock = new THREE.Clock();

    function onPointerMove (event : MouseEvent) {
        pointer.x = ((event.clientX / window.innerWidth) * 2) - 1;
        pointer.y = -((event.clientY / window.innerHeight) * 2) + 1
    }
    
    let propagationManager = new PropagationManager("");
    propagationManager.getData();
    let sats = propagationManager.constructSats();
    sats.forEach(sat => scene.add(sat.shape));
    propagationManager.updatePropagations();
    sats.forEach(sat => sat.updateShapePosition());

    const vertexShader = `
    varying vec2 vUv;
    uniform float time;
    
        void main() {

        vUv = uv;
        
        // VERTEX POSITION
        
        vec4 mvPosition = vec4( position, 1.0 );
        #ifdef USE_INSTANCING
            mvPosition = instanceMatrix * mvPosition;
        #endif
        
        // DISPLACEMENT
        
        // here the displacement is made stronger on the blades tips.
        float dispPower = 1.0 - cos( uv.y * 3.1416 / 2.0 );
        
        float displacement = sin( mvPosition.z + time * 10.0 ) * ( 0.1 * dispPower );
        mvPosition.z += displacement;
        
        //
        
        vec4 modelViewPosition = modelViewMatrix * mvPosition;
        gl_Position = projectionMatrix * modelViewPosition;

        }
    `;

    const fragmentShader = `
    varying vec2 vUv;
    
    void main() {
        vec3 baseColor = vec3( 0.41, 1.0, 0.5 );
        float clarity = ( vUv.y * 0.5 ) + 0.5;
        gl_FragColor = vec4( baseColor * clarity, 1 );
    }
    `;

    const uniforms = {
        time: {
        value: 0
    }
    }

    const leavesMaterial = new THREE.ShaderMaterial({
        vertexShader,
    fragmentShader,
    uniforms,
    side: THREE.DoubleSide
    });

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    //@ts-ignore
    document.getElementById('three').innerHTML = "";
    //@ts-ignore
    document.getElementById('three').appendChild( renderer.domElement );

    const instanceNumber = 5000;
    const dummy = new THREE.Object3D();
    const geometry = new THREE.PlaneGeometry( 0.1, 1, 1, 4 );
    geometry.translate( 0, -2, 0 ); // move grass blade geometry lowest point at 0.   
    const grass = new THREE.InstancedMesh( geometry, leavesMaterial, instanceNumber );
    scene.add( grass );
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshBasicMaterial({ color: 0xA17954 }))
    ground.rotateX(-(Math.PI/2));
    ground.position.y = -2;
    scene.add(ground);

    const moon = new THREE.Mesh(new THREE.SphereGeometry(11, 20, 20), new THREE.MeshBasicMaterial({ color: 0xc2c5cc }))
    moon.position.x = 100
    moon.position.y = 80
    moon.position.z = 50
    scene.add(moon);

    // Position and scale the grass blade instances randomly.

    for ( let i=0 ; i < instanceNumber ; i++ ) {
        dummy.position.set(
        ( Math.random() - 0.5 ) * 10,
        0,
        ( Math.random() - 0.5 ) * 10
        );
    
        dummy.scale.setScalar( 0.5 + Math.random() * 0.5 );
        
        dummy.rotation.y = Math.random() * Math.PI;
        
        dummy.updateMatrix();
        grass.setMatrixAt( i, dummy.matrix );
    }
    
    /*
    const loader = new THREE.TextureLoader();
    const panoTexture = loader.load(panUrl, x => renderer.render(scene, camera))
    panoTexture.mapping = THREE.EquirectangularReflectionMapping;

    scene.background = panoTexture;
    */

    camera.position.z = -0.001;

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enablePan = false;

    // let meshes = generateRandomLandmarks([-20, 20], [0, 20], [-20, 20], 30, scene);

    //@ts-ignore
    let intersects = [];
    let selected : any;

    function onClick (event : MouseEvent) {
        if (intersects.length < 1) {
            //@ts-ignore
            //if (selected) selected.unselectShape();
            setter({
                "title": "",
                "description": "",
                "image": "",
                "exists": false
            })
        }
        else {
            //@ts-ignore
            //if (selected) selected.unselectShape();
            //@ts-ignore
            selected = sats[parseInt(intersects[0].object.name)];
            //@ts-ignore
            selected.selectShape();
            setter({
                "title": selected.title,
                "description": selected.description,
                "image": "",
                "exists": true
            })
        }
    }

    function animate() {
        requestAnimationFrame( animate );

        // calculate pointer position in normalized device coordinates
        // (-1 to +1) for both 
        raycaster.setFromCamera( pointer, camera );    
        
        intersects = raycaster.intersectObjects( scene.children );

        renderer.render( scene, camera );

        propagationManager.updatePropagations();
        sats.forEach(sat => sat.updateShapePosition())
    }

    
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("click", onClick)

    animate();
}