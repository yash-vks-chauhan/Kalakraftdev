# VueBits Implementation Guide

This guide was prepared from the live VueBits docs at https://vue-bits.dev on June 13, 2026, starting from the Split Text page:
https://vue-bits.dev/text-animations/split-text.

Use it as a practical checklist for bringing VueBits components into a Vue/Nuxt project, or for porting the same ideas into a React/Next project like Pulse.

## What VueBits Is

VueBits is not a normal npm component library that you import from one package. It is a copy-into-your-project component collection. Each component page usually gives:

- Preview tab: interactive demo and prop controls.
- Code tab: dependency install command, usage snippet, and full `.vue` source.
- CLI tab: `jsrepo` command to copy the component into your project.
- Props table: exact props and defaults for that component.

The install command pattern shown by the docs is:

```bash
npx jsrepo@latest add https://vue-bits.dev/r/ComponentName
```

If you need to inspect the raw registry JSON, add `.json`:

```bash
curl https://vue-bits.dev/r/Aurora.json
```

## Vue/Nuxt Workflow

1. Choose one component from the catalog below.
2. Install only the extra packages listed for that component.
3. Run the VueBits `jsrepo` add command.
4. Import the copied `.vue` file from wherever `jsrepo` placed it.
5. Open the linked docs page and copy the exact props from the Code or Props tab.

Recommended target directory when `jsrepo` asks:

```text
src/components/vuebits
```

Example for Aurora:

```bash
npm install ogl
npx jsrepo@latest add https://vue-bits.dev/r/Aurora
```

```vue
<template>
  <div class="aurora-container">
    <Aurora
      :color-stops="['#7cff67', '#171D22', '#7cff67']"
      :amplitude="1"
      :blend="0.5"
      :speed="1"
      :intensity="1"
      class="w-full h-full"
    />
  </div>
</template>

<script setup lang="ts">
import Aurora from './Aurora.vue';
</script>

<style scoped>
.aurora-container {
  width: 100%;
  height: 500px;
  position: relative;
  overflow: hidden;
}
</style>
```

Example for Split Text:

```bash
npm install gsap
npx jsrepo@latest add https://vue-bits.dev/r/SplitText
```

```vue
<template>
  <SplitText
    text="Hello, GSAP!"
    class-name="text-2xl font-semibold text-center"
    :delay="100"
    :duration="0.6"
    ease="power3.out"
    split-type="chars"
    :from="{ opacity: 0, y: 40 }"
    :to="{ opacity: 1, y: 0 }"
    :threshold="0.1"
    root-margin="-100px"
    text-align="center"
    @animation-complete="handleAnimationComplete"
  />
</template>

<script setup lang="ts">
import SplitText from './SplitText.vue';

const handleAnimationComplete = () => {
  console.log('All letters have animated.');
};
</script>
```

Nuxt note: WebGL, cursor, scroll, and DOM-measurement components should usually be wrapped in `ClientOnly`.

```vue
<ClientOnly>
  <Aurora class="h-full w-full" />
</ClientOnly>
```

## React/Next Porting Notes For Pulse

Pulse is a Next.js/React app, so VueBits `.vue` files cannot be imported directly into `apps/web`. For this repo, either use an existing React equivalent, port the Vue source manually, or use the React Bits equivalent when one exists.

Existing Pulse motion components:

- `apps/web/components/motion/aurora.tsx`: CSS aurora-style decorative background.
- `apps/web/components/motion/grainient.tsx`: React/OGL shader port inspired by VueBits Grainient.
- `apps/web/components/motion/split-text.tsx`: React/Tailwind split text animation.
- `apps/web/components/motion/blur-text.tsx`: React/Tailwind blur text animation.
- `apps/web/components/motion/count-up.tsx`: viewport-triggered count-up.
- `apps/web/components/motion/number-ticker.tsx`: animated number changes.
- `apps/web/components/motion/reveal.tsx`: IntersectionObserver reveal wrapper.

Porting checklist:

1. Copy the idea, not the `.vue` file.
2. Convert `ref`, `onMounted`, `onUnmounted`, and `watch` to `useRef` and `useEffect`.
3. Convert Vue props from kebab-case usage to React camelCase props.
4. Keep browser-only code behind `"use client"`.
5. Add cleanup for animation frames, observers, event listeners, GSAP timelines, and WebGL contexts.
6. Add reduced-motion behavior for intensive animations.

## Dependency Cheat Sheet

Install only what the chosen row needs:

```bash
npm install gsap motion-v ogl three matter-js mathjs lenis gl-matrix postprocessing face-api.js
```

Common meanings:

- `gsap`: timeline, scroll, stagger, and transform animation.
- `motion-v`: Vue motion primitives.
- `ogl`: lightweight WebGL renderer used by many backgrounds.
- `three`: heavier 3D/WebGL effects.
- `matter-js`: physics for Falling Text.
- `lenis`: smooth scroll helper.
- `postprocessing`: render effects for some Three.js backgrounds.
- `face-api.js`: Grid Scan face-detection dependency.

## Registry Gaps

Most live pages have working registry JSON at `https://vue-bits.dev/r/Name.json`. These visible pages did not return registry JSON when checked and should be copied manually from the official repo source until the registry is updated:

- Text Trail: `src/content/TextAnimations/TextTrail/TextTrail.vue`
- Antigravity: `src/content/Animations/Antigravity/Antigravity.vue`
- Orbit Images: `src/content/Animations/OrbitImages/OrbitImages.vue`
- Rolling Gallery: `src/content/Components/RollingGallery/RollingGallery.vue`
- Grid Scan: `src/content/Backgrounds/GridScan/GridScan.vue`

Manual-copy paths above refer to the official `DavidHDev/vue-bits` repository, not this Pulse repo.

## Complete Live Catalog

The starter import/use column is intentionally minimal. For real implementation, open the linked page and copy the exact usage snippet and prop values from the Code tab.

### Text Animations (24)

| Component                                                                     | Add command                                                       | Extra packages | Starter import/use                                                               |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------------- | -------------- | -------------------------------------------------------------------------------- |
| [Ascii Text](https://vue-bits.dev/text-animations/ascii-text)                 | `npx jsrepo@latest add https://vue-bits.dev/r/ASCIIText`          | three          | `import ASCIIText from "./ASCIIText.vue"; <ASCIIText />`                         |
| [Blur Text](https://vue-bits.dev/text-animations/blur-text)                   | `npx jsrepo@latest add https://vue-bits.dev/r/BlurText`           | motion-v       | `import BlurText from "./BlurText.vue"; <BlurText />`                            |
| [Circular Text](https://vue-bits.dev/text-animations/circular-text)           | `npx jsrepo@latest add https://vue-bits.dev/r/CircularText`       | motion-v       | `import CircularText from "./CircularText.vue"; <CircularText />`                |
| [Count Up](https://vue-bits.dev/text-animations/count-up)                     | `npx jsrepo@latest add https://vue-bits.dev/r/CountUp`            | none           | `import CountUp from "./CountUp.vue"; <CountUp />`                               |
| [Curved Loop](https://vue-bits.dev/text-animations/curved-loop)               | `npx jsrepo@latest add https://vue-bits.dev/r/CurvedLoop`         | none           | `import CurvedLoop from "./CurvedLoop.vue"; <CurvedLoop />`                      |
| [Decrypted Text](https://vue-bits.dev/text-animations/decrypted-text)         | `npx jsrepo@latest add https://vue-bits.dev/r/DecryptedText`      | none           | `import DecryptedText from "./DecryptedText.vue"; <DecryptedText />`             |
| [Falling Text](https://vue-bits.dev/text-animations/falling-text)             | `npx jsrepo@latest add https://vue-bits.dev/r/FallingText`        | matter-js      | `import FallingText from "./FallingText.vue"; <FallingText />`                   |
| [Fuzzy Text](https://vue-bits.dev/text-animations/fuzzy-text)                 | `npx jsrepo@latest add https://vue-bits.dev/r/FuzzyText`          | none           | `import FuzzyText from "./FuzzyText.vue"; <FuzzyText />`                         |
| [Glitch Text](https://vue-bits.dev/text-animations/glitch-text)               | `npx jsrepo@latest add https://vue-bits.dev/r/GlitchText`         | none           | `import GlitchText from "./GlitchText.vue"; <GlitchText />`                      |
| [Gradient Text](https://vue-bits.dev/text-animations/gradient-text)           | `npx jsrepo@latest add https://vue-bits.dev/r/GradientText`       | motion-v       | `import GradientText from "./GradientText.vue"; <GradientText />`                |
| [Rotating Text](https://vue-bits.dev/text-animations/rotating-text)           | `npx jsrepo@latest add https://vue-bits.dev/r/RotatingText`       | motion-v       | `import RotatingText from "./RotatingText.vue"; <RotatingText />`                |
| [Scroll Float](https://vue-bits.dev/text-animations/scroll-float)             | `npx jsrepo@latest add https://vue-bits.dev/r/ScrollFloat`        | gsap           | `import ScrollFloat from "./ScrollFloat.vue"; <ScrollFloat />`                   |
| [Scroll Reveal](https://vue-bits.dev/text-animations/scroll-reveal)           | `npx jsrepo@latest add https://vue-bits.dev/r/ScrollReveal`       | gsap           | `import ScrollReveal from "./ScrollReveal.vue"; <ScrollReveal />`                |
| [Scroll Velocity](https://vue-bits.dev/text-animations/scroll-velocity)       | `npx jsrepo@latest add https://vue-bits.dev/r/ScrollVelocity`     | gsap           | `import ScrollVelocity from "./ScrollVelocity.vue"; <ScrollVelocity />`          |
| [Scramble Text](https://vue-bits.dev/text-animations/scramble-text)           | `npx jsrepo@latest add https://vue-bits.dev/r/ScrambleText`       | gsap           | `import ScrambleText from "./ScrambleText.vue"; <ScrambleText />`                |
| [Shiny Text](https://vue-bits.dev/text-animations/shiny-text)                 | `npx jsrepo@latest add https://vue-bits.dev/r/ShinyText`          | motion-v       | `import ShinyText from "./ShinyText.vue"; <ShinyText />`                         |
| [Shuffle](https://vue-bits.dev/text-animations/shuffle)                       | `npx jsrepo@latest add https://vue-bits.dev/r/Shuffle`            | gsap           | `import Shuffle from "./Shuffle.vue"; <Shuffle />`                               |
| [Split Text](https://vue-bits.dev/text-animations/split-text)                 | `npx jsrepo@latest add https://vue-bits.dev/r/SplitText`          | gsap           | `import SplitText from "./SplitText.vue"; <SplitText />`                         |
| [Text Cursor](https://vue-bits.dev/text-animations/text-cursor)               | `npx jsrepo@latest add https://vue-bits.dev/r/TextCursor`         | motion-v       | `import TextCursor from "./TextCursor.vue"; <TextCursor />`                      |
| [Text Pressure](https://vue-bits.dev/text-animations/text-pressure)           | `npx jsrepo@latest add https://vue-bits.dev/r/TextPressure`       | none           | `import TextPressure from "./TextPressure.vue"; <TextPressure />`                |
| [Text Trail](https://vue-bits.dev/text-animations/text-trail)                 | Manual copy: `src/content/TextAnimations/TextTrail/TextTrail.vue` | three          | `import TextTrail from "./TextTrail.vue"; <TextTrail />`                         |
| [Text Type](https://vue-bits.dev/text-animations/text-type)                   | `npx jsrepo@latest add https://vue-bits.dev/r/TextType`           | gsap           | `import TextType from "./TextType.vue"; <TextType />`                            |
| [True Focus](https://vue-bits.dev/text-animations/true-focus)                 | `npx jsrepo@latest add https://vue-bits.dev/r/TrueFocus`          | motion-v       | `import TrueFocus from "./TrueFocus.vue"; <TrueFocus />`                         |
| [Variable Proximity](https://vue-bits.dev/text-animations/variable-proximity) | `npx jsrepo@latest add https://vue-bits.dev/r/VariableProximity`  | none           | `import VariableProximity from "./VariableProximity.vue"; <VariableProximity />` |

### Animations (29)

| Component                                                            | Add command                                                       | Extra packages | Starter import/use                                                         |
| -------------------------------------------------------------------- | ----------------------------------------------------------------- | -------------- | -------------------------------------------------------------------------- |
| [Animated Content](https://vue-bits.dev/animations/animated-content) | `npx jsrepo@latest add https://vue-bits.dev/r/AnimatedContent`    | gsap           | `import AnimatedContent from "./AnimatedContent.vue"; <AnimatedContent />` |
| [Antigravity](https://vue-bits.dev/animations/antigravity)           | Manual copy: `src/content/Animations/Antigravity/Antigravity.vue` | three          | `import Antigravity from "./Antigravity.vue"; <Antigravity />`             |
| [Blob Cursor](https://vue-bits.dev/animations/blob-cursor)           | `npx jsrepo@latest add https://vue-bits.dev/r/BlobCursor`         | gsap           | `import BlobCursor from "./BlobCursor.vue"; <BlobCursor />`                |
| [Click Spark](https://vue-bits.dev/animations/click-spark)           | `npx jsrepo@latest add https://vue-bits.dev/r/ClickSpark`         | none           | `import ClickSpark from "./ClickSpark.vue"; <ClickSpark />`                |
| [Crosshair](https://vue-bits.dev/animations/crosshair)               | `npx jsrepo@latest add https://vue-bits.dev/r/Crosshair`          | gsap           | `import Crosshair from "./Crosshair.vue"; <Crosshair />`                   |
| [Cubes](https://vue-bits.dev/animations/cubes)                       | `npx jsrepo@latest add https://vue-bits.dev/r/Cubes`              | gsap           | `import Cubes from "./Cubes.vue"; <Cubes />`                               |
| [Electric Border](https://vue-bits.dev/animations/electric-border)   | `npx jsrepo@latest add https://vue-bits.dev/r/ElectricBorder`     | none           | `import ElectricBorder from "./ElectricBorder.vue"; <ElectricBorder />`    |
| [Fade Content](https://vue-bits.dev/animations/fade-content)         | `npx jsrepo@latest add https://vue-bits.dev/r/FadeContent`        | none           | `import FadeContent from "./FadeContent.vue"; <FadeContent />`             |
| [Ghost Cursor](https://vue-bits.dev/animations/ghost-cursor)         | `npx jsrepo@latest add https://vue-bits.dev/r/GhostCursor`        | three          | `import GhostCursor from "./GhostCursor.vue"; <GhostCursor />`             |
| [Glare Hover](https://vue-bits.dev/animations/glare-hover)           | `npx jsrepo@latest add https://vue-bits.dev/r/GlareHover`         | none           | `import GlareHover from "./GlareHover.vue"; <GlareHover />`                |
| [Gradual Blur](https://vue-bits.dev/animations/gradual-blur)         | `npx jsrepo@latest add https://vue-bits.dev/r/GradualBlur`        | mathjs         | `import GradualBlur from "./GradualBlur.vue"; <GradualBlur />`             |
| [Image Trail](https://vue-bits.dev/animations/image-trail)           | `npx jsrepo@latest add https://vue-bits.dev/r/ImageTrail`         | gsap           | `import ImageTrail from "./ImageTrail.vue"; <ImageTrail />`                |
| [Laser Flow](https://vue-bits.dev/animations/laser-flow)             | `npx jsrepo@latest add https://vue-bits.dev/r/LaserFlow`          | three          | `import LaserFlow from "./LaserFlow.vue"; <LaserFlow />`                   |
| [Logo Loop](https://vue-bits.dev/animations/logo-loop)               | `npx jsrepo@latest add https://vue-bits.dev/r/LogoLoop`           | none           | `import LogoLoop from "./LogoLoop.vue"; <LogoLoop />`                      |
| [Magic Rings](https://vue-bits.dev/animations/magic-rings)           | `npx jsrepo@latest add https://vue-bits.dev/r/MagicRings`         | three          | `import MagicRings from "./MagicRings.vue"; <MagicRings />`                |
| [Magnet](https://vue-bits.dev/animations/magnet)                     | `npx jsrepo@latest add https://vue-bits.dev/r/Magnet`             | none           | `import Magnet from "./Magnet.vue"; <Magnet />`                            |
| [Magnet Lines](https://vue-bits.dev/animations/magnet-lines)         | `npx jsrepo@latest add https://vue-bits.dev/r/MagnetLines`        | none           | `import MagnetLines from "./MagnetLines.vue"; <MagnetLines />`             |
| [Metallic Paint](https://vue-bits.dev/animations/metallic-paint)     | `npx jsrepo@latest add https://vue-bits.dev/r/MetallicPaint`      | none           | `import MetallicPaint from "./MetallicPaint.vue"; <MetallicPaint />`       |
| [Meta Balls](https://vue-bits.dev/animations/meta-balls)             | `npx jsrepo@latest add https://vue-bits.dev/r/MetaBalls`          | ogl            | `import MetaBalls from "./MetaBalls.vue"; <MetaBalls />`                   |
| [Noise](https://vue-bits.dev/animations/noise)                       | `npx jsrepo@latest add https://vue-bits.dev/r/Noise`              | none           | `import Noise from "./Noise.vue"; <Noise />`                               |
| [Pixel Trail](https://vue-bits.dev/animations/pixel-trail)           | `npx jsrepo@latest add https://vue-bits.dev/r/PixelTrail`         | three          | `import PixelTrail from "./PixelTrail.vue"; <PixelTrail />`                |
| [Pixel Transition](https://vue-bits.dev/animations/pixel-transition) | `npx jsrepo@latest add https://vue-bits.dev/r/PixelTransition`    | gsap           | `import PixelTransition from "./PixelTransition.vue"; <PixelTransition />` |
| [Ribbons](https://vue-bits.dev/animations/ribbons)                   | `npx jsrepo@latest add https://vue-bits.dev/r/Ribbons`            | ogl            | `import Ribbons from "./Ribbons.vue"; <Ribbons />`                         |
| [Shape Blur](https://vue-bits.dev/animations/shape-blur)             | `npx jsrepo@latest add https://vue-bits.dev/r/ShapeBlur`          | three          | `import ShapeBlur from "./ShapeBlur.vue"; <ShapeBlur />`                   |
| [Splash Cursor](https://vue-bits.dev/animations/splash-cursor)       | `npx jsrepo@latest add https://vue-bits.dev/r/SplashCursor`       | none           | `import SplashCursor from "./SplashCursor.vue"; <SplashCursor />`          |
| [Star Border](https://vue-bits.dev/animations/star-border)           | `npx jsrepo@latest add https://vue-bits.dev/r/StarBorder`         | none           | `import StarBorder from "./StarBorder.vue"; <StarBorder />`                |
| [Sticker Peel](https://vue-bits.dev/animations/sticker-peel)         | `npx jsrepo@latest add https://vue-bits.dev/r/StickerPeel`        | gsap           | `import StickerPeel from "./StickerPeel.vue"; <StickerPeel />`             |
| [Target Cursor](https://vue-bits.dev/animations/target-cursor)       | `npx jsrepo@latest add https://vue-bits.dev/r/TargetCursor`       | gsap           | `import TargetCursor from "./TargetCursor.vue"; <TargetCursor />`          |
| [Orbit Images](https://vue-bits.dev/animations/orbit-images)         | Manual copy: `src/content/Animations/OrbitImages/OrbitImages.vue` | none           | `import OrbitImages from "./OrbitImages.vue"; <OrbitImages />`             |

### Components (34)

| Component                                                            | Add command                                                             | Extra packages | Starter import/use                                                         |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------- | -------------- | -------------------------------------------------------------------------- |
| [Animated List](https://vue-bits.dev/components/animated-list)       | `npx jsrepo@latest add https://vue-bits.dev/r/AnimatedList`             | motion-v       | `import AnimatedList from "./AnimatedList.vue"; <AnimatedList />`          |
| [Border Glow](https://vue-bits.dev/components/border-glow)           | `npx jsrepo@latest add https://vue-bits.dev/r/BorderGlow`               | none           | `import BorderGlow from "./BorderGlow.vue"; <BorderGlow />`                |
| [Bounce Cards](https://vue-bits.dev/components/bounce-cards)         | `npx jsrepo@latest add https://vue-bits.dev/r/BounceCards`              | gsap           | `import BounceCards from "./BounceCards.vue"; <BounceCards />`             |
| [Bubble Menu](https://vue-bits.dev/components/bubble-menu)           | `npx jsrepo@latest add https://vue-bits.dev/r/BubbleMenu`               | gsap           | `import BubbleMenu from "./BubbleMenu.vue"; <BubbleMenu />`                |
| [Card Nav](https://vue-bits.dev/components/card-nav)                 | `npx jsrepo@latest add https://vue-bits.dev/r/CardNav`                  | gsap           | `import CardNav from "./CardNav.vue"; <CardNav />`                         |
| [Card Swap](https://vue-bits.dev/components/card-swap)               | `npx jsrepo@latest add https://vue-bits.dev/r/CardSwap`                 | gsap           | `import CardSwap from "./CardSwap.vue"; <CardSwap />`                      |
| [Carousel](https://vue-bits.dev/components/carousel)                 | `npx jsrepo@latest add https://vue-bits.dev/r/Carousel`                 | motion-v       | `import Carousel from "./Carousel.vue"; <Carousel />`                      |
| [Chroma Grid](https://vue-bits.dev/components/chroma-grid)           | `npx jsrepo@latest add https://vue-bits.dev/r/ChromaGrid`               | gsap           | `import ChromaGrid from "./ChromaGrid.vue"; <ChromaGrid />`                |
| [Circular Gallery](https://vue-bits.dev/components/circular-gallery) | `npx jsrepo@latest add https://vue-bits.dev/r/CircularGallery`          | ogl            | `import CircularGallery from "./CircularGallery.vue"; <CircularGallery />` |
| [Counter](https://vue-bits.dev/components/counter)                   | `npx jsrepo@latest add https://vue-bits.dev/r/Counter`                  | motion-v       | `import Counter from "./Counter.vue"; <Counter />`                         |
| [Decay Card](https://vue-bits.dev/components/decay-card)             | `npx jsrepo@latest add https://vue-bits.dev/r/DecayCard`                | gsap           | `import DecayCard from "./DecayCard.vue"; <DecayCard />`                   |
| [Dock](https://vue-bits.dev/components/dock)                         | `npx jsrepo@latest add https://vue-bits.dev/r/Dock`                     | motion-v       | `import Dock from "./Dock.vue"; <Dock />`                                  |
| [Dome Gallery](https://vue-bits.dev/components/dome-gallery)         | `npx jsrepo@latest add https://vue-bits.dev/r/DomeGallery`              | none           | `import DomeGallery from "./DomeGallery.vue"; <DomeGallery />`             |
| [Elastic Slider](https://vue-bits.dev/components/elastic-slider)     | `npx jsrepo@latest add https://vue-bits.dev/r/ElasticSlider`            | none           | `import ElasticSlider from "./ElasticSlider.vue"; <ElasticSlider />`       |
| [Flowing Menu](https://vue-bits.dev/components/flowing-menu)         | `npx jsrepo@latest add https://vue-bits.dev/r/FlowingMenu`              | gsap           | `import FlowingMenu from "./FlowingMenu.vue"; <FlowingMenu />`             |
| [Flying Posters](https://vue-bits.dev/components/flying-posters)     | `npx jsrepo@latest add https://vue-bits.dev/r/FlyingPosters`            | ogl            | `import FlyingPosters from "./FlyingPosters.vue"; <FlyingPosters />`       |
| [Folder](https://vue-bits.dev/components/folder)                     | `npx jsrepo@latest add https://vue-bits.dev/r/Folder`                   | none           | `import Folder from "./Folder.vue"; <Folder />`                            |
| [Glass Icons](https://vue-bits.dev/components/glass-icons)           | `npx jsrepo@latest add https://vue-bits.dev/r/GlassIcons`               | none           | `import GlassIcons from "./GlassIcons.vue"; <GlassIcons />`                |
| [Glass Surface](https://vue-bits.dev/components/glass-surface)       | `npx jsrepo@latest add https://vue-bits.dev/r/GlassSurface`             | none           | `import GlassSurface from "./GlassSurface.vue"; <GlassSurface />`          |
| [Gooey Nav](https://vue-bits.dev/components/gooey-nav)               | `npx jsrepo@latest add https://vue-bits.dev/r/GooeyNav`                 | none           | `import GooeyNav from "./GooeyNav.vue"; <GooeyNav />`                      |
| [Infinite Menu](https://vue-bits.dev/components/infinite-menu)       | `npx jsrepo@latest add https://vue-bits.dev/r/InfiniteMenu`             | gl-matrix      | `import InfiniteMenu from "./InfiniteMenu.vue"; <InfiniteMenu />`          |
| [Infinite Scroll](https://vue-bits.dev/components/infinite-scroll)   | `npx jsrepo@latest add https://vue-bits.dev/r/InfiniteScroll`           | gsap           | `import InfiniteScroll from "./InfiniteScroll.vue"; <InfiniteScroll />`    |
| [Magic Bento](https://vue-bits.dev/components/magic-bento)           | `npx jsrepo@latest add https://vue-bits.dev/r/MagicBento`               | gsap           | `import MagicBento from "./MagicBento.vue"; <MagicBento />`                |
| [Masonry](https://vue-bits.dev/components/masonry)                   | `npx jsrepo@latest add https://vue-bits.dev/r/Masonry`                  | gsap           | `import Masonry from "./Masonry.vue"; <Masonry />`                         |
| [Pill Nav](https://vue-bits.dev/components/pill-nav)                 | `npx jsrepo@latest add https://vue-bits.dev/r/PillNav`                  | gsap           | `import PillNav from "./PillNav.vue"; <PillNav />`                         |
| [Pixel Card](https://vue-bits.dev/components/pixel-card)             | `npx jsrepo@latest add https://vue-bits.dev/r/PixelCard`                | none           | `import PixelCard from "./PixelCard.vue"; <PixelCard />`                   |
| [Profile Card](https://vue-bits.dev/components/profile-card)         | `npx jsrepo@latest add https://vue-bits.dev/r/ProfileCard`              | none           | `import ProfileCard from "./ProfileCard.vue"; <ProfileCard />`             |
| [Rolling Gallery](https://vue-bits.dev/components/rolling-gallery)   | Manual copy: `src/content/Components/RollingGallery/RollingGallery.vue` | motion-v       | `import RollingGallery from "./RollingGallery.vue"; <RollingGallery />`    |
| [Scroll Stack](https://vue-bits.dev/components/scroll-stack)         | `npx jsrepo@latest add https://vue-bits.dev/r/ScrollStack`              | lenis          | `import ScrollStack from "./ScrollStack.vue"; <ScrollStack />`             |
| [Spotlight Card](https://vue-bits.dev/components/spotlight-card)     | `npx jsrepo@latest add https://vue-bits.dev/r/SpotlightCard`            | none           | `import SpotlightCard from "./SpotlightCard.vue"; <SpotlightCard />`       |
| [Stack](https://vue-bits.dev/components/stack)                       | `npx jsrepo@latest add https://vue-bits.dev/r/Stack`                    | motion-v       | `import Stack from "./Stack.vue"; <Stack />`                               |
| [Staggered Menu](https://vue-bits.dev/components/staggered-menu)     | `npx jsrepo@latest add https://vue-bits.dev/r/StaggeredMenu`            | gsap           | `import StaggeredMenu from "./StaggeredMenu.vue"; <StaggeredMenu />`       |
| [Stepper](https://vue-bits.dev/components/stepper)                   | `npx jsrepo@latest add https://vue-bits.dev/r/Stepper`                  | motion-v       | `import Stepper from "./Stepper.vue"; <Stepper />`                         |
| [Tilted Card](https://vue-bits.dev/components/tilted-card)           | `npx jsrepo@latest add https://vue-bits.dev/r/TiltedCard`               | motion-v       | `import TiltedCard from "./TiltedCard.vue"; <TiltedCard />`                |

### Backgrounds (40)

| Component                                                           | Add command                                                   | Extra packages                     | Starter import/use                                                      |
| ------------------------------------------------------------------- | ------------------------------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------- |
| [Aurora](https://vue-bits.dev/backgrounds/aurora)                   | `npx jsrepo@latest add https://vue-bits.dev/r/Aurora`         | ogl                                | `import Aurora from "./Aurora.vue"; <Aurora />`                         |
| [Balatro](https://vue-bits.dev/backgrounds/balatro)                 | `npx jsrepo@latest add https://vue-bits.dev/r/Balatro`        | ogl                                | `import Balatro from "./Balatro.vue"; <Balatro />`                      |
| [Ballpit](https://vue-bits.dev/backgrounds/ballpit)                 | `npx jsrepo@latest add https://vue-bits.dev/r/Ballpit`        | gsap, three                        | `import Ballpit from "./Ballpit.vue"; <Ballpit />`                      |
| [Beams](https://vue-bits.dev/backgrounds/beams)                     | `npx jsrepo@latest add https://vue-bits.dev/r/Beams`          | three                              | `import Beams from "./Beams.vue"; <Beams />`                            |
| [Color Bends](https://vue-bits.dev/backgrounds/color-bends)         | `npx jsrepo@latest add https://vue-bits.dev/r/ColorBends`     | three                              | `import ColorBends from "./ColorBends.vue"; <ColorBends />`             |
| [Dark Veil](https://vue-bits.dev/backgrounds/dark-veil)             | `npx jsrepo@latest add https://vue-bits.dev/r/DarkVeil`       | ogl                                | `import DarkVeil from "./DarkVeil.vue"; <DarkVeil />`                   |
| [Dither](https://vue-bits.dev/backgrounds/dither)                   | `npx jsrepo@latest add https://vue-bits.dev/r/Dither`         | ogl                                | `import Dither from "./Dither.vue"; <Dither />`                         |
| [Dot Grid](https://vue-bits.dev/backgrounds/dot-grid)               | `npx jsrepo@latest add https://vue-bits.dev/r/DotGrid`        | gsap                               | `import DotGrid from "./DotGrid.vue"; <DotGrid />`                      |
| [Evil Eye](https://vue-bits.dev/backgrounds/evil-eye)               | `npx jsrepo@latest add https://vue-bits.dev/r/EvilEye`        | ogl                                | `import EvilEye from "./EvilEye.vue"; <EvilEye />`                      |
| [Faulty Terminal](https://vue-bits.dev/backgrounds/faulty-terminal) | `npx jsrepo@latest add https://vue-bits.dev/r/FaultyTerminal` | ogl                                | `import FaultyTerminal from "./FaultyTerminal.vue"; <FaultyTerminal />` |
| [Floating Lines](https://vue-bits.dev/backgrounds/floating-lines)   | `npx jsrepo@latest add https://vue-bits.dev/r/FloatingLines`  | three                              | `import FloatingLines from "./FloatingLines.vue"; <FloatingLines />`    |
| [Galaxy](https://vue-bits.dev/backgrounds/galaxy)                   | `npx jsrepo@latest add https://vue-bits.dev/r/Galaxy`         | ogl                                | `import Galaxy from "./Galaxy.vue"; <Galaxy />`                         |
| [Gradient Blinds](https://vue-bits.dev/backgrounds/gradient-blinds) | `npx jsrepo@latest add https://vue-bits.dev/r/GradientBlinds` | ogl                                | `import GradientBlinds from "./GradientBlinds.vue"; <GradientBlinds />` |
| [Grainient](https://vue-bits.dev/backgrounds/grainient)             | `npx jsrepo@latest add https://vue-bits.dev/r/Grainient`      | ogl                                | `import Grainient from "./Grainient.vue"; <Grainient />`                |
| [Grid Distortion](https://vue-bits.dev/backgrounds/grid-distortion) | `npx jsrepo@latest add https://vue-bits.dev/r/GridDistortion` | three                              | `import GridDistortion from "./GridDistortion.vue"; <GridDistortion />` |
| [Grid Motion](https://vue-bits.dev/backgrounds/grid-motion)         | `npx jsrepo@latest add https://vue-bits.dev/r/GridMotion`     | gsap                               | `import GridMotion from "./GridMotion.vue"; <GridMotion />`             |
| [Grid Scan](https://vue-bits.dev/backgrounds/grid-scan)             | Manual copy: `src/content/Backgrounds/GridScan/GridScan.vue`  | face-api.js, postprocessing, three | `import GridScan from "./GridScan.vue"; <GridScan />`                   |
| [Hyperspeed](https://vue-bits.dev/backgrounds/hyperspeed)           | `npx jsrepo@latest add https://vue-bits.dev/r/Hyperspeed`     | three, postprocessing              | `import Hyperspeed from "./Hyperspeed.vue"; <Hyperspeed />`             |
| [Iridescence](https://vue-bits.dev/backgrounds/iridescence)         | `npx jsrepo@latest add https://vue-bits.dev/r/Iridescence`    | ogl                                | `import Iridescence from "./Iridescence.vue"; <Iridescence />`          |
| [Letter Glitch](https://vue-bits.dev/backgrounds/letter-glitch)     | `npx jsrepo@latest add https://vue-bits.dev/r/LetterGlitch`   | none                               | `import LetterGlitch from "./LetterGlitch.vue"; <LetterGlitch />`       |
| [Light Pillar](https://vue-bits.dev/backgrounds/light-pillar)       | `npx jsrepo@latest add https://vue-bits.dev/r/LightPillar`    | three                              | `import LightPillar from "./LightPillar.vue"; <LightPillar />`          |
| [Light Rays](https://vue-bits.dev/backgrounds/light-rays)           | `npx jsrepo@latest add https://vue-bits.dev/r/LightRays`      | ogl                                | `import LightRays from "./LightRays.vue"; <LightRays />`                |
| [Lightning](https://vue-bits.dev/backgrounds/lightning)             | `npx jsrepo@latest add https://vue-bits.dev/r/Lightning`      | none                               | `import Lightning from "./Lightning.vue"; <Lightning />`                |
| [Line Waves](https://vue-bits.dev/backgrounds/line-waves)           | `npx jsrepo@latest add https://vue-bits.dev/r/LineWaves`      | ogl                                | `import LineWaves from "./LineWaves.vue"; <LineWaves />`                |
| [Liquid Chrome](https://vue-bits.dev/backgrounds/liquid-chrome)     | `npx jsrepo@latest add https://vue-bits.dev/r/LiquidChrome`   | ogl                                | `import LiquidChrome from "./LiquidChrome.vue"; <LiquidChrome />`       |
| [Liquid Ether](https://vue-bits.dev/backgrounds/liquid-ether)       | `npx jsrepo@latest add https://vue-bits.dev/r/LiquidEther`    | three                              | `import LiquidEther from "./LiquidEther.vue"; <LiquidEther />`          |
| [Orb](https://vue-bits.dev/backgrounds/orb)                         | `npx jsrepo@latest add https://vue-bits.dev/r/Orb`            | ogl                                | `import Orb from "./Orb.vue"; <Orb />`                                  |
| [Particles](https://vue-bits.dev/backgrounds/particles)             | `npx jsrepo@latest add https://vue-bits.dev/r/Particles`      | ogl                                | `import Particles from "./Particles.vue"; <Particles />`                |
| [Pixel Blast](https://vue-bits.dev/backgrounds/pixel-blast)         | `npx jsrepo@latest add https://vue-bits.dev/r/PixelBlast`     | postprocessing, three              | `import PixelBlast from "./PixelBlast.vue"; <PixelBlast />`             |
| [Pixel Snow](https://vue-bits.dev/backgrounds/pixel-snow)           | `npx jsrepo@latest add https://vue-bits.dev/r/PixelSnow`      | three                              | `import PixelSnow from "./PixelSnow.vue"; <PixelSnow />`                |
| [Plasma](https://vue-bits.dev/backgrounds/plasma)                   | `npx jsrepo@latest add https://vue-bits.dev/r/Plasma`         | ogl                                | `import Plasma from "./Plasma.vue"; <Plasma />`                         |
| [Prism](https://vue-bits.dev/backgrounds/prism)                     | `npx jsrepo@latest add https://vue-bits.dev/r/Prism`          | ogl                                | `import Prism from "./Prism.vue"; <Prism />`                            |
| [Prismatic Burst](https://vue-bits.dev/backgrounds/prismatic-burst) | `npx jsrepo@latest add https://vue-bits.dev/r/PrismaticBurst` | ogl                                | `import PrismaticBurst from "./PrismaticBurst.vue"; <PrismaticBurst />` |
| [Radar](https://vue-bits.dev/backgrounds/radar)                     | `npx jsrepo@latest add https://vue-bits.dev/r/Radar`          | ogl                                | `import Radar from "./Radar.vue"; <Radar />`                            |
| [Ripple Grid](https://vue-bits.dev/backgrounds/ripple-grid)         | `npx jsrepo@latest add https://vue-bits.dev/r/RippleGrid`     | ogl                                | `import RippleGrid from "./RippleGrid.vue"; <RippleGrid />`             |
| [Silk](https://vue-bits.dev/backgrounds/silk)                       | `npx jsrepo@latest add https://vue-bits.dev/r/Silk`           | ogl                                | `import Silk from "./Silk.vue"; <Silk />`                               |
| [Soft Aurora](https://vue-bits.dev/backgrounds/soft-aurora)         | `npx jsrepo@latest add https://vue-bits.dev/r/SoftAurora`     | ogl                                | `import SoftAurora from "./SoftAurora.vue"; <SoftAurora />`             |
| [Squares](https://vue-bits.dev/backgrounds/squares)                 | `npx jsrepo@latest add https://vue-bits.dev/r/Squares`        | none                               | `import Squares from "./Squares.vue"; <Squares />`                      |
| [Threads](https://vue-bits.dev/backgrounds/threads)                 | `npx jsrepo@latest add https://vue-bits.dev/r/Threads`        | ogl                                | `import Threads from "./Threads.vue"; <Threads />`                      |
| [Waves](https://vue-bits.dev/backgrounds/waves)                     | `npx jsrepo@latest add https://vue-bits.dev/r/Waves`          | none                               | `import Waves from "./Waves.vue"; <Waves />`                            |

## Sources Checked

- Live VueBits docs: https://vue-bits.dev
- Split Text page: https://vue-bits.dev/text-animations/split-text
- Aurora page: https://vue-bits.dev/backgrounds/aurora
- Official repository: https://github.com/DavidHDev/vue-bits
- Local Pulse equivalents: `apps/web/components/motion`
