---
created: 2026-09-21
updated: 2026-09-30
status: published
---

# Carousel

A carousel shows a collection of items that scroll on and off the screen, changing size as
they move and settling into place: artwork, photos, featured entries, to browse rather than
read in full. M3 has five layouts: **multi-browse**, **uncontained**, **hero**,
**center-aligned hero** and **full-screen**. See the
[M3 carousel guidelines](https://m3.material.io/components/carousel/overview).

## Usage

The carousel fills the height it is given, and has none of its own: set one on it or on its
container. `change` fires with the `index` of the item that settles into the focal position.

```example
carousel:
  ariaLabel: Places to explore
  slides:
    - { image: /assets/playground/landscape-1.svg, alt: Hills under a pale sky, title: Highlands }
    - { image: /assets/playground/landscape-2.svg, alt: Cliffs over the sea, title: Coast }
    - { image: /assets/playground/landscape-3.svg, alt: Dunes at noon, title: Desert }
  on change: showSlide(index)
```

## Examples

### Hero, with a call to action

`variant` picks the layout. `hero` shows one large item and a glimpse of the next;
`hero-center` centers it between two small ones. `itemWidth` is a large item's preferred
width, and in the hero layouts its maximum. A slide's `buttonText` and `buttonUrl` add a link.

```example
carousel:
  variant: hero
  itemWidth: 480
  ariaLabel: Collections
  slides:
    - { image: /assets/playground/landscape-4.svg, alt: A forest path, title: Spring collection, description: Out now, buttonText: Browse, buttonUrl: /collections/spring }
    - { image: /assets/playground/landscape-5.svg, alt: A lake at dawn, title: Lakeside }
```

### Uncontained

Items keep one size and run off the trailing edge, and the list scrolls freely, without
settling on an item.

```example
carousel:
  variant: uncontained
  itemWidth: 240
  ariaLabel: Recent photos
  slides:
    - { image: /assets/playground/landscape-1.svg, alt: Hills under a pale sky }
    - { image: /assets/playground/landscape-2.svg, alt: Cliffs over the sea }
    - { image: /assets/playground/landscape-3.svg, alt: Dunes at noon }
```

`multi-browse`, the default, shows at least one large, one medium and one small item, and
more large ones as the container grows. `full-screen` shows one edge-to-edge item at a time
and scrolls vertically. The layouts follow Compose's keylines: each item's size and place
come from the scroll offset. In the factory, a slide's `content` (an element or markup)
replaces the image and text, and `next()`, `prev()` and `goTo(index)` move the carousel.

## API

<!-- API: generated from mtrl's types and <m-carousel>'s spec in a later step. Until then these
tables are hand-written: keep them in line with the code, and add no prose restating them. -->

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `variant` | `'multi-browse' \| 'uncontained' \| 'hero' \| 'hero-center' \| 'full-screen'` | `'multi-browse'` | The layout |
| `slides` | `CarouselSlide[]` | `[]` | The items |
| `itemWidth` | `number` | `280` | A large item's width in pixels; a maximum in the hero layouts |
| `gap` | `number` | `8`, `16` for full-screen | Space between items in pixels |
| `padding` | `number` | `16`, `0` for full-screen | Space between the container's edges and the items |
| `cornerRadius` | `number` | `28` | The items' corner radius in pixels |
| `snap` | `boolean` | `true`, `false` for uncontained | Whether scrolling settles on an item |
| `initialSlide` | `number` | `0` | The item shown first |
| `minSmallItemWidth` / `maxSmallItemWidth` | `number` | `40` / `56` | A small item's width range |
| `ariaLabel` | `string` | `'Carousel'` | The carousel's accessible name |
| `class` | `string` | `undefined` | Additional CSS classes |
| `prefix` | `string` | `'mtrl'` | Prefix for CSS class names |

#### Slides

| Field | Type | Description |
|-------|------|-------------|
| `image` | `string` | Image URL |
| `alt` | `string` | The image's alt text; `title` without it, and `''` for a decorative image |
| `title` / `description` | `string` | Text over the image |
| `buttonText` / `buttonUrl` | `string` | A call-to-action link |
| `content` | `HTMLElement \| string` | The app's own content, instead of the image and text |

### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `next()` / `prev()` | `CarouselComponent` | The next or previous item, stopping at the ends |
| `goTo(index)` | `CarouselComponent` | Scrolls to an item, smoothly unless reduced motion is on |
| `getCurrentSlide()` | `number` | The item in the focal position |
| `getVariant()` | `CarouselVariant` | The layout |
| `addSlide(slide, index?)` / `removeSlide(index)` | `CarouselComponent` | Adds or removes an item |
| `slides.updateSlide(index, slide)` | `SlidesAPI` | Replaces an item's content in place |
| `slides.getSlide(index)` / `slides.getCount()` / `slides.getElements()` | `CarouselSlide \| null` / `number` / `HTMLElement[]` | Reads the items |
| `on(event, handler)` / `off(event, handler)` | `CarouselComponent` | Events |
| `addClass(...classes)` | `CarouselComponent` | Adds classes to the root |
| `destroy()` | `void` | Removes the carousel, its observer and its listeners |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `change` | `{ index }` | Another item settled into the focal position; a `goTo()` reports its destination only |

The web component's `change` carries `{ index }` too.

## Accessibility

- The carousel is a `region` with `aria-roledescription="carousel"`, named by `ariaLabel`:
  name each carousel on a page distinctly.
- Each item is a focusable `group` with `aria-roledescription="slide"`, labelled "n of total".
  Focusing one brings it into the focal position.
- The arrows move between items, `Left` and `Right` (`Up` and `Down` full screen); `Home` and
  `End` go to the ends. Touch, trackpad and wheel scroll it natively.
- Alt text is the app's to give; `title` stands in for it, which is rarely what a screen
  reader needs.

## Styling

The component writes `--mtrl-carousel-corner` on the root, the corner radius, and
`--mtrl-carousel-fade` on each item, from 1 when large to 0 when small, which the text
overlay fades with. It also writes each item's `transform` and `clip-path` as it scrolls:
don't set them from CSS. The root also carries the layout as a modifier, such as
`mtrl-carousel--hero`, which the stylesheet does not style.

```css
.mtrl-carousel { }
.mtrl-carousel--vertical, .mtrl-carousel--snap { }
.mtrl-carousel__scroller, .mtrl-carousel__track, .mtrl-carousel__item, .mtrl-carousel__image { }
.mtrl-carousel__content, .mtrl-carousel__title, .mtrl-carousel__description, .mtrl-carousel__button { }
```

## Measurements

From Compose's `CarouselDefaults`:

| Attribute | Value |
|-----------|-------|
| Space between items | 8dp; 16dp full screen |
| Container padding | 16dp |
| Item corner | 28dp |
| Small item | 40 to 56dp wide |
| Anchor size | 10dp outside the container |
