// Import the required modules
import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { EXRLoader } from "three/examples/jsm/loaders/EXRLoader";

const Model3D = () => {
  // Create a reference to the container element in the DOM
  const containerRef = useRef();

  // This effect runs once when the component mounts
  useEffect(() => {
    // Create a new spinnerScene
    const skyScene = new THREE.Scene();
    const spinnerScene = new THREE.Scene();

    // set up camera
    const camera = new THREE.PerspectiveCamera(30, 1, 1, 100);
    camera.position.z = 3;
    // spinnerScene.add(camera);

    const skyCamera = new THREE.PerspectiveCamera(30, 1, 1, 100);

    // Create the renderer and set its size
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);

    //todo
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    const exrLoader = new EXRLoader();
    exrLoader.load("/skymap.exr", (texture) => {
      const envMap = pmremGenerator.fromEquirectangular(texture).texture;
      skyScene.background = envMap;
      spinnerScene.environment = envMap;

      texture.dispose();
      pmremGenerator.dispose();
    });

    // Add ambient light to the spinnerScene
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    spinnerScene.add(ambientLight);

    // Top directional light
    const topDirectionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
    topDirectionalLight.position.set(0, 1, 0);
    spinnerScene.add(topDirectionalLight);

    // Bottom directional light
    const bottomDirectionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
    bottomDirectionalLight.position.set(0, -1, 0);
    spinnerScene.add(bottomDirectionalLight);

    // Left directional light
    const leftDirectionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
    leftDirectionalLight.position.set(-1, 0, 0);
    spinnerScene.add(leftDirectionalLight);

    // Right directional light
    const rightDirectionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
    rightDirectionalLight.position.set(1, 0, 0);
    spinnerScene.add(rightDirectionalLight);

    // Front directional light
    const frontDirectionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
    frontDirectionalLight.position.set(0, 0, 1);
    spinnerScene.add(frontDirectionalLight);

    // Back directional light
    const backDirectionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
    backDirectionalLight.position.set(0, 0, -1);
    spinnerScene.add(backDirectionalLight);

    // Load the GLTF model
    const loader = new GLTFLoader();
    loader.load(
      "/fidgetSpinner/scene.gltf",
      (gltf) => {
        // Add the loaded model to the spinnerScene
        spinnerScene.add(gltf.scene);
      },
      (xhr) => {
        // Log the loading progress
        console.log(`${(xhr.loaded / xhr.total) * 100}% loaded`);
      },
      (error) => {
        // Log any errors that occur during loading
        console.error("An error happened", error);
      }
    );
    const skyCameraRotationSpeed = 0.0001;
    // Add OrbitControls for user interaction with the model
    const controls = new OrbitControls(camera, renderer.domElement);
    //enable dampening
    controls.enableDamping = true;

    // Define the animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      // Update the controls
      controls.update();

      // Update the sky camera position to match the model camera
      skyCamera.position.copy(camera.position);
      skyCamera.updateMatrixWorld();

      // Auto-rotate the sky camera
      skyCamera.rotation.y += skyCameraRotationSpeed;
      skyCamera.rotation.x += skyCameraRotationSpeed;

      // Render the skyScene using the skyCamera
      renderer.render(skyScene, skyCamera);

      // Render the spinnerScene using the model camera on top of the skyScene
      renderer.autoClear = false;
      renderer.render(spinnerScene, camera);
      renderer.autoClear = true;
    };

    // Add the renderer's DOM element to the container and start the animation loop
    if (containerRef.current) {
      containerRef.current.appendChild(renderer.domElement);
      animate();
    }

    // Clean up the renderer when the component is unmounted
    return () => {
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div>
      <h1>My 3D Model</h1>
      <div ref={containerRef} />
    </div>
  );
};

export default Model3D;
