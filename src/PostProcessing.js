import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";

const MindShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uAberration: { value: 0.012 },
    uGrain: { value: 0.055 },
    uVignette: { value: 1.0 },
    uContrast: { value: 1.08 },
    uPulse: { value: 0.03 },
    uTint: { value: new THREE.Color("#ebe2d4") },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uAberration;
    uniform float uGrain;
    uniform float uVignette;
    uniform float uContrast;
    uniform float uPulse;
    uniform vec3 uTint;
    varying vec2 vUv;

    float random(vec2 value) {
      return fract(sin(dot(value, vec2(12.9898, 78.233))) * 43758.5453123);
    }

    void main() {
      vec2 centered = vUv - 0.5;
      vec2 shift = centered * (uAberration + sin(uTime * 0.7) * uPulse * 0.0035);
      float red = texture2D(tDiffuse, vUv + shift).r;
      float green = texture2D(tDiffuse, vUv).g;
      float blue = texture2D(tDiffuse, vUv - shift).b;
      vec3 color = vec3(red, green, blue);

      float noise = random(vUv * 320.0 + uTime * 0.35) - 0.5;
      color += noise * uGrain;

      float vignette = smoothstep(0.95, 0.18, length(centered * (1.15 + uVignette * 0.04)));
      color = (color - 0.5) * uContrast + 0.5;
      color *= vignette;
      color = mix(vec3(dot(color, vec3(0.299, 0.587, 0.114))), color, 1.07);
      color = mix(color, color * uTint, 0.08);

      gl_FragColor = vec4(color, 1.0);
    }
  `,
};

export function createComposer(renderer, scene, camera) {
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  const stylizePass = new ShaderPass(MindShader);
  composer.addPass(stylizePass);

  return { composer, stylizePass };
}

export function applyPostProcessingMood(stylizePass, mood) {
  stylizePass.uniforms.uAberration.value = mood.aberration ?? 0.012;
  stylizePass.uniforms.uGrain.value = mood.grain ?? 0.055;
  stylizePass.uniforms.uVignette.value = mood.vignette ?? 1.0;
  stylizePass.uniforms.uContrast.value = mood.contrast ?? 1.08;
  stylizePass.uniforms.uPulse.value = mood.pulse ?? 0.03;
  stylizePass.uniforms.uTint.value = new THREE.Color(mood.tint ?? "#ebe2d4");
}