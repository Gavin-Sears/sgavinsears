import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
const horn = "./hornAssets/horn.glb";

let mesh;
let raycaster;
let line;

const intersection = {
	intersects: false,
	point: new THREE.Vector3(),
	normal: new THREE.Vector3()
};

// init

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const listener = new THREE.AudioListener();
camera.add( listener );

const honk = new THREE.Audio( listener );

const audioLoader = new THREE.AudioLoader();

audioLoader.load( './hornAssets/honk.wav', function( buffer ) {
	honk.setBuffer( buffer );
	honk.setLoop( false );
	honk.setVolume( 0.4 );
});

// camera controls

camera.position.z = 5;

const controls = new OrbitControls( camera, renderer.domElement );
controls.minDistance = 2.8;
controls.maxDistance = 20.0;
// controls.enableZoom = false;
const loader = new GLTFLoader();

const mouse = new THREE.Vector2();
const intersects = [];

raycaster = new THREE.Raycaster();

const mouseHelper = new THREE.Mesh( new THREE.BoxGeometry( 1, 1, 10 ), new THREE.MeshNormalMaterial() );
mouseHelper.visible = false;
scene.add( mouseHelper );

const geometry = new THREE.BufferGeometry();
geometry.setFromPoints( [ new THREE.Vector3(), new THREE.Vector3() ] );

line = new THREE.Line( geometry, new THREE.LineBasicMaterial() );
line.visible = false;
scene.add( line );

window.addEventListener( 'resize', onWindowResize );

let moved = false;

controls.addEventListener( 'change', function () {
	moved = true;
} );

window.addEventListener( 'pointerdown', function () {
	moved = false;
} );

window.addEventListener( 'pointerup', function ( event ) {
	if ( moved == false ) {
		checkIntersection( event.clientX, event.clientY );

		if ( intersection.intersects ) hornNoise();
	}
} );

window.addEventListener( 'pointermove', onPointerMove );

function onPointerMove( event ) {
	if ( event.isPrimary ) {
		checkIntersection( event.clientX, event.clientY );
	}
}

function checkIntersection( x, y ) {
	const mesh = scene.children[ 5 ];

	if ( mesh == undefined ) return;

	mouse.x = ( x / window.innerWidth ) * 2 - 1;
	mouse.y = - ( y / window.innerHeight ) * 2 + 1;

	raycaster.setFromCamera( mouse, camera );
	raycaster.intersectObject( mesh, true, intersects );

	if ( intersects.length > 0 ) {

		const p = intersects[ 0 ].point;
		mouseHelper.position.copy( p );
		intersection.point.copy( p );

		const n = intersects[ 0 ].face.normal.clone();
		n.transformDirection( mesh.matrixWorld );
		n.multiplyScalar( 10 );
		n.add( intersects[ 0 ].point );

		intersection.normal.copy( intersects[ 0 ].face.normal );
		mouseHelper.lookAt( n );

		const positions = line.geometry.attributes.position;
		positions.setXYZ( 0, p.x, p.y, p.z );
		positions.setXYZ( 1, n.x, n.y, n.z );
		positions.needsUpdate = true;

		intersection.intersects = true;

		intersects.length = 0;

	} else {

		intersection.intersects = false;

	}
}

// const textureLoader = new THREE.TextureLoader();

scene.add(new THREE.AmbientLight( 0x666666 ));

const dirLight1 = new THREE.DirectionalLight( 0xffddcc, 6 );
dirLight1.position.set( 1, 0.75, 0.5 );
scene.add( dirLight1 );

const dirLight2 = new THREE.DirectionalLight( 0xccccff, 6 );
dirLight2.position.set( -1, 0.75, -0.5 );
scene.add( dirLight2 );

// horn

/*
// Does not seem to need these assigned at the moment
const metalnessMap = textureLoader.load( hMetal );
const map = textureLoader.load( hDiff );
const roughnessMap = textureLoader.load( hRough );
const envMap = textureLoader.load( hdri );
*/

const Loader = new GLTFLoader();

Loader.load( horn, function ( gltf ) {
	mesh = gltf.scene.children[ 0 ];
	scene.add( mesh );
	mesh.scale.set(1, 1, 1);
	mesh.rotation.y = - Math.PI / 2;
});

// for noises

// TODO: play horn noise
function hornNoise()
{
	console.log("horn was honked");
	honk.play();
}

// window resize

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );
}

// animation

function animate() {
	requestAnimationFrame( animate );

	renderer.render( scene, camera );
}
animate();