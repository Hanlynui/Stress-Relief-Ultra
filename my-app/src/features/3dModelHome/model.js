import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { EXRLoader } from "three/examples/jsm/loaders/EXRLoader";

const Model3D = () => {
  // Create a reference to the container element in the DOM
  const containerRef = useRef();
  const [spinTime, setSpinTime] = useState(0);
  const [spinSpeed, setSpinSpeed] = useState(0);
  const [topSpinSpeed, setTopSpinSpeed] = useState(0);
  const spinTimeRef = useRef(0);
  const topSpinSpeedRef = useRef(0);

  // This effect runs once when the component mounts
  useEffect(() => {
    // Create a new spinnerScene
    const skyScene = new THREE.Scene();
    const spinnerScene = new THREE.Scene();
    const clock = new THREE.Clock();

    // set up camera
    const camera = new THREE.PerspectiveCamera(30, 1, 1, 100);
    camera.position.z = 3;
    // spinnerScene.add(camera);

    const skyCamera = new THREE.PerspectiveCamera(30, 1, 1, 100);

    // Create the renderer and set its size
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    //set pixel ratio so that it looks better
    renderer.setPixelRatio(2);

    //todo
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    // const exrLoader = new EXRLoader();
    // exrLoader.load("/skymap.exr", (texture) => {
    //   const envMap = pmremGenerator.fromEquirectangular(texture).texture;
    //   skyScene.background = envMap;
    //   spinnerScene.environment = envMap;

    //   texture.dispose();
    //   pmremGenerator.dispose();
    // });

    // Add ambient light to the spinnerScene
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    spinnerScene.add(ambientLight);

    // Top directional light
    const topDirectionalLight = new THREE.DirectionalLight(0xffffff, 0.2);
    topDirectionalLight.position.set(0, 1, 0);
    spinnerScene.add(topDirectionalLight);

    // Bottom directional light
    const bottomDirectionalLight = new THREE.DirectionalLight(0xffffff, 0.2);
    bottomDirectionalLight.position.set(0, -1, 0);
    spinnerScene.add(bottomDirectionalLight);

    // Left directional light
    const leftDirectionalLight = new THREE.DirectionalLight(0xffffff, 0.2);
    leftDirectionalLight.position.set(-1, 0, 0);
    spinnerScene.add(leftDirectionalLight);

    // Right directional light
    const rightDirectionalLight = new THREE.DirectionalLight(0xffffff, 0.2);
    rightDirectionalLight.position.set(1, 0, 0);
    spinnerScene.add(rightDirectionalLight);

    // Front directional light
    const frontDirectionalLight = new THREE.DirectionalLight(0xffffff, 0.2);
    frontDirectionalLight.position.set(0, 0, 1);
    spinnerScene.add(frontDirectionalLight);

    // Back directional light
    const backDirectionalLight = new THREE.DirectionalLight(0xffffff, 0.2);
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
    controls.enableZoom = false;

    const velocity = new THREE.Vector2(0, 0);

    let prevMousePosition = { x: 0, y: 0 };
    let curMousePosition = { x: 0, y: 0 };
    let isMouseDown = false;

    renderer.domElement.addEventListener("mousedown", () => {
      isMouseDown = true;
    });

    renderer.domElement.addEventListener("mousemove", (event) => {
      if (isMouseDown) {
        prevMousePosition.x = curMousePosition.x;
        prevMousePosition.y = curMousePosition.y;

        curMousePosition.x = event.clientX;
        curMousePosition.y = event.clientY;

        velocity.x = curMousePosition.x - prevMousePosition.x;
        velocity.y = curMousePosition.y - prevMousePosition.y;
      }
    });

    renderer.domElement.addEventListener("touchmove", (event) => {
      if (isMouseDown) {
        prevMousePosition.x = curMousePosition.x;
        prevMousePosition.y = curMousePosition.y;

        curMousePosition.x = event.touches[0].clientX;
        curMousePosition.y = event.touches[0].clientY;

        velocity.x = curMousePosition.x - prevMousePosition.x;
        velocity.y = curMousePosition.y - prevMousePosition.y;
      }
      event.preventDefault();
    });

    renderer.domElement.addEventListener("mouseup", () => {
      isMouseDown = false;
    });

    renderer.domElement.addEventListener("touchstart", () => {
      isMouseDown = true;
    });

    renderer.domElement.addEventListener("touchend", () => {
      isMouseDown = false;
    });

    function adjustVelocity(velocity) {
      const speed = velocity.length();
      const spinSpeedThreshold = 0.01;

      let decayFactor;
      // console.log(speed);
      if (speed > 1.5) {
        decayFactor = 0.996;
      } else if (speed <= 1.5) {
        decayFactor = 0.5;
      }

      // Apply the decay factor to the velocity
      velocity.multiplyScalar(decayFactor);

      // Set the velocity to zero when the speed is less than a small threshold value
      if (speed < 0.01) {
        velocity.set(0, 0);
      }

      // Return true if the spin speed is greater than the threshold, false otherwise
      return speed > spinSpeedThreshold;
    }

    let spinDuration = 0;
    // Define the animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      const model = spinnerScene.children.find(
        (child) => child.type === "Group"
      );

      const delta = clock.getDelta(); // Get the time since the last frame

      // Call the adjustVelocity function and get whether the spin speed is greater than the threshold
      const isSpinning = adjustVelocity(velocity);

      setSpinSpeed(velocity.length().toFixed(3));

      if (model && isSpinning) {
        model.rotation.y += velocity.x * 0.001;
        model.rotation.x += velocity.y * 0.001;
      }

      // Update the spin duration only when isSpinning is true
      if (isSpinning) {
        spinDuration += delta;

        // Update the spinTimeRef value
        spinTimeRef.current = spinDuration;

        // Update the spinTime state only when the difference is greater than the threshold
        if (Math.abs(spinTime - spinTimeRef.current) >= 0.1) {
          setSpinTime(spinTimeRef.current.toFixed(1));
        }
      }
      // Update the controls
      controls.update();

      // Render the skyScene using the skyCamera
      // renderer.render(skyScene, skyCamera);

      skyCamera.rotation.y += skyCameraRotationSpeed;
      skyCamera.rotation.x += skyCameraRotationSpeed / 2;

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
      <div>Total Spin Time Spent Spinning Today: {spinTime} seconds </div>
      <div>Current Spin Speed: {spinSpeed}</div>
      <div>Top Spin Speed Today: {topSpinSpeed}</div>
      <div ref={containerRef} />
    </div>
  );
};

export default Model3D;

//todo make sure that it works for all devices and reduce the loading time
