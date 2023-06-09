import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { EXRLoader } from "three/examples/jsm/loaders/EXRLoader";
import LoadingScreen from "../loading";
import "./model.css";

const Model3D = () => {
  // Create a reference to the container element in the DOM
  const containerRef = useRef();
  const [spinTime, setSpinTime] = useState(0);
  const [spinSpeed, setSpinSpeed] = useState(0);
  const [topSpinSpeed, setTopSpinSpeed] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const spinTimeRef = useRef(0);
  const spinSpeedRef = useRef(0);
  const topSpinSpeedRef = useRef(0);
  const [showPopup, setShowPopup] = useState(false);

  // ...

  // This effect runs once when the component mounts
  useEffect(() => {
    // Create a new spinnerScene

    const skyScene = new THREE.Scene();
    const spinnerScene = new THREE.Scene();
    const clock = new THREE.Clock();
    const sizes = {
      width: window.innerWidth,
      height: window.innerHeight,
    };
    // set up camera
    const camera = new THREE.PerspectiveCamera(
      30,
      sizes.width / sizes.height,
      0.1,
      1000
    );
    camera.position.z = 3;
    // spinnerScene.add(camera);

    const skyCamera = new THREE.PerspectiveCamera(
      100,
      sizes.width / sizes.height,
      0.1,
      1000
    );

    // Create the renderer and set its size
    const isHighPerformanceDevice = window.devicePixelRatio <= 2;
    const renderer = new THREE.WebGLRenderer({
      antialias: isHighPerformanceDevice,
    });

    renderer.setSize(sizes.width, sizes.height);
    //set pixel ratio so that it looks better
    renderer.setPixelRatio(
      isHighPerformanceDevice ? window.devicePixelRatio : 1
    );

    //todo
    window.addEventListener("resize", () => {
      sizes.width = window.innerWidth;
      sizes.height = window.innerHeight;
      camera.updateProjectionMatrix();
      camera.aspect = sizes.width / sizes.height;
      skyCamera.aspect = sizes.width / sizes.height;
      renderer.setSize(sizes.width, sizes.height);
    });

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    const exrLoader = new EXRLoader();
    exrLoader.load("/secluded_beach_4k.exr", (texture) => {
      const envMap = pmremGenerator.fromEquirectangular(texture).texture;
      skyScene.background = envMap;
      spinnerScene.environment = envMap;

      texture.dispose();
      pmremGenerator.dispose();
      setIsLoading(false);
    });

    const createLights = (spinnerScene) => {
      const pointLightPositions = [];

      const radius = 3; // Set the radius of the circle
      const numLights = 20; // Set the number of lights to create
      const angleStep = (2 * Math.PI) / numLights; // Calculate the angle between each light

      for (let i = 0; i < numLights; i++) {
        const x = radius * Math.cos(angleStep * i);
        const y = radius * Math.sin(angleStep * i);
        const z = 0; // Set the z position to 0 for a 2D circle
        const position = new THREE.Vector3(x, y, z);
        pointLightPositions.push(position);
      }

      pointLightPositions.forEach((position) => {
        const pointLight = new THREE.PointLight(0xffffff, 0.35);
        pointLight.position.copy(position);
        spinnerScene.add(pointLight);
      });
    };
    let counter = 0;

    if (!counter) {
      console.log(1);
      createLights(spinnerScene);
      counter++;
    }

    // Load the GLTF model
    const loader = new GLTFLoader();
    loader.load(
      "/fidget_spinner_animation/scene.gltf",
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
    let touch = false;
    let speedFactor = 1;

    function handleMovement(event) {
      if (isMouseDown) {
        prevMousePosition.x = curMousePosition.x;
        prevMousePosition.y = curMousePosition.y;

        curMousePosition.x = event.clientX;
        curMousePosition.y = event.clientY;

        velocity.x = (curMousePosition.x - prevMousePosition.x) * speedFactor;
        velocity.y = (curMousePosition.y - prevMousePosition.y) * speedFactor;
      }
    }
    function handleMouseEnd() {
      isMouseDown = false;
    }

    renderer.domElement.addEventListener("mousedown", () => {
      isMouseDown = true;
    });

    renderer.domElement.addEventListener("mouseup", handleMouseEnd);
    renderer.domElement.addEventListener("mouseleave", handleMouseEnd);

    renderer.domElement.addEventListener("mousemove", (event) => {
      if (touch) return;
      handleMovement(event);
    });

    renderer.domElement.addEventListener("touchstart", (event) => {
      isMouseDown = true;
      touch = true;
      speedFactor = 2.5;
    });

    renderer.domElement.addEventListener("touchend", handleMouseEnd);
    renderer.domElement.addEventListener("touchcancel", handleMouseEnd);

    renderer.domElement.addEventListener("touchmove", (event) => {
      handleMovement(event.touches[0]);
      event.preventDefault();
    });

    // const spinningSound = new Audio("/spinning-fidget-spinner-23292.mp3");

    function adjustVelocity(velocity) {
      const speed = velocity.length();
      const spinSpeedThreshold = 0.01;

      // const handleSpinSound = () => {
      //   if (spinningSound.paused) {
      //     spinningSound.play();
      //   }

      //   const maxPlaybackRate = 1;
      //   const minPlaybackRate = 0.25;

      //   const playbackRate = Math.max(
      //     minPlaybackRate,
      //     Math.min(maxPlaybackRate, speed / 500)
      //   );

      //   spinningSound.playbackRate = playbackRate;
      // };

      // Adjust the decay factor
      let decayFactor;
      if (speed > 50) {
        decayFactor = 0.998; // Increase the decay factor slightly for faster spins
      } else if (speed <= 50) {
        decayFactor = 0.9; // Increase the decay factor slightly for slower spins
      }

      // Apply the decay factor to the velocity
      velocity.multiplyScalar(decayFactor);

      if (speed < 1) {
        velocity.set(0, 0);
        // spinningSound.pause();
        // spinningSound.currentTime = 0;
      }

      // Return true if the spin speed is greater than the threshold, false otherwise
      else if (speed > spinSpeedThreshold) {
        // If so, play the spin sound with the new speed
        // handleSpinSound(speed);
        return true;
      } else {
        return false;
      }
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

      spinSpeedRef.current = velocity.length().toFixed(3);

      if (
        parseFloat(spinSpeedRef.current) >
          parseFloat(topSpinSpeedRef.current) &&
        !(spinSpeedRef.current > 999)
      ) {
        topSpinSpeedRef.current = spinSpeedRef.current;
      }

      // console.log(spinSpeed);

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
      renderer.render(skyScene, skyCamera);

      skyCamera.rotation.y -= skyCameraRotationSpeed;
      // skyCamera.rotation.x += skyCameraRotationSpeed / 2;

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
      if (
        containerRef.current &&
        containerRef.current.contains(renderer.domElement)
      ) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setSpinSpeed(spinSpeedRef.current);
      setTopSpinSpeed(topSpinSpeedRef.current);
    }, 100);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const [userHasInteracted, setUserHasInteracted] = useState(false);
  const [BGM, setBGM] = useState(null);

  useEffect(() => {
    setBGM(new Audio("/Heart-Of-The-Ocean.mp3"));
  }, []);

  useEffect(() => {
    if (!isLoading && BGM) {
      setTimeout(() => setShowPopup(true), 500); // Show the popup 1 second after the loading is finished
    }
  }, [isLoading, BGM]);

  useEffect(() => {
    if (BGM && userHasInteracted) {
      BGM.play();
      BGM.autoplay = true;
      BGM.loop = true;
    }
  }, [BGM, userHasInteracted]);

  return (
    <div className="parent">
      <div className={isLoading ? "loading" : "hide"}>
        <h1 className="title main">
          <strong>The Only Stress Relief App You Will Ever Need</strong>
        </h1>
        <div className="under-title">
          First Time Loading May Take a While...
        </div>
        <LoadingScreen />
      </div>
      <div>
        {showPopup && (
          <div className="popup">
            <p>
              Welcome to the only <strong>Stress Relief App</strong> you will
              ever need.
              <br></br>
              <em>Give it a spin</em> to relieve some stress!
              <br></br>
              Also please turn off your Ad Block so we can make some dough from
              Ads {":)"}
            </p>
            <button
              onClick={() => {
                setShowPopup(false);
                setUserHasInteracted(true);
              }}
            >
              Close
            </button>
          </div>
        )}
      </div>
      <div className={!isLoading ? "loading model-container" : "hide"}>
        <div className="model-info">
          <div className="title main">Stress Relief Whenever Whereever</div>
          <div className="spin-time">
            Stress Relief Time Today: <span>{spinTime}</span> seconds
          </div>
          <div className="spin-speed">
            Current Spin Speed: <span>{spinSpeed}</span>
          </div>
          <div className="top-spin-speed">
            Top Spin Speed Today: <span>{topSpinSpeed}</span>
          </div>
        </div>
        <div ref={containerRef} />
      </div>
    </div>
  );
};

export default Model3D;

//todo reduce the loading time maybe save to local storage or cache
