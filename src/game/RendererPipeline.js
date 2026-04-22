import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'

const postShader = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float time;
    varying vec2 vUv;

    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }

    void main() {
      vec2 uv = vUv;
      vec2 center = uv - 0.5;

      float shift = 0.0015 + 0.0007 * sin(time * 1.2 + uv.y * 22.0);
      vec4 cr = texture2D(tDiffuse, uv + vec2(shift, 0.0));
      vec4 cg = texture2D(tDiffuse, uv);
      vec4 cb = texture2D(tDiffuse, uv - vec2(shift, 0.0));
      vec3 color = vec3(cr.r, cg.g, cb.b);

      float grain = random(uv * 900.0 + time * 0.25) - 0.5;
      color += grain * 0.08;

      float vignette = smoothstep(0.8, 0.15, length(center));
      color *= vignette;

      gl_FragColor = vec4(color, 1.0);
    }
  `,
}

export class RendererPipeline {
  constructor(canvas, scene, camera) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      powerPreference: 'high-performance',
    })
    this.renderer.setPixelRatio(1)

    this.composer = new EffectComposer(this.renderer)
    this.composer.addPass(new RenderPass(scene, camera))

    this.postPass = new ShaderPass(postShader)
    this.composer.addPass(this.postPass)

    this.resize()
    window.addEventListener('resize', () => this.resize())
  }

  resize() {
    const width = Math.max(320, Math.floor(window.innerWidth * 0.68))
    const height = Math.max(180, Math.floor(window.innerHeight * 0.68))

    this.renderer.setSize(width, height, false)
    this.renderer.domElement.style.width = '100vw'
    this.renderer.domElement.style.height = '100vh'
    this.renderer.domElement.style.imageRendering = 'pixelated'

    this.composer.setSize(width, height)
  }

  render(time) {
    this.postPass.uniforms.time.value = time
    this.composer.render()
  }
}
