# Carousel Component

The Carousel component shows a collection of items that scroll on and off the
screen, changing size as they move through the layout and snapping into place.
Reach for it when the items are browsable rather than ranked: artwork, photos,
featured entries. It is the wrong control for a list the user must read in full,
because everything past the first item or two is off screen.

The implementation is a port of the Compose Material 3 carousel. Items are not
positioned by CSS scroll snapping alone: a keyline strategy decides where each
item rests and how large it is there, and every item interpolates between the
keylines it sits between as the scroll offset changes.

## Import

```javascript
import { createCarousel } from 'mtrl';

import {
  CAROUSEL_VARIANTS,
  CAROUSEL_DEFAULTS
} from 'mtrl/components/carousel';
```

## Basic Usage

```javascript
const carousel = createCarousel({
  variant: 'multi-browse',
  itemWidth: 280,
  ariaLabel: 'Featured artwork',
  slides: [
    { image: '/art/bridge.jpg', title: 'Forest Bridge', description: 'A wooden bridge through the trees' },
    { image: '/art/waters.jpg', title: 'Dark Waters', description: 'Still lake at twilight' }
  ]
});

carousel.element.style.height = '280px';
container.appendChild(carousel.element);

carousel.on('change', ({ index }) => {
  console.log(index);
});
```

The carousel fills the height it is given. It has no intrinsic height of its own,
so set one on the element or on the container that holds it.

## Layouts

`variant` picks the keyline arrangement, and it is the option that changes the
component's behaviour most.

| Variant | Arrangement |
|---------|-------------|
| `multi-browse` | At least one large, one medium and one small item. More large items appear as the container grows. The default |
| `uncontained` | Items keep one size and run off the trailing edge. Scrolls freely, without snapping |
| `hero` | One large item and a small preview of the next |
| `hero-center` | One large item centred between two small ones, once the list is scrolled off its start |
| `full-screen` | One edge-to-edge item at a time, scrolling vertically |

`itemWidth` means different things per layout: multi-browse and uncontained treat
it as the preferred width of a large item, hero layouts as a maximum, defaulting
to the container width.

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `variant` | `CarouselVariant` | `'multi-browse'` | Layout, see the table above |
| `slides` | `CarouselSlide[]` | `[]` | Items created at construction |
| `itemWidth` | `number` | `280` | Width of a large item in pixels; a maximum for the hero layouts |
| `gap` | `number` | `8`, `16` for full-screen | Space between items in pixels |
| `padding` | `number` | `16`, `0` for full-screen | Space between the container edges and the items |
| `cornerRadius` | `number` | `28` | Corner radius of the items in pixels |
| `snap` | `boolean` | `true`, `false` for uncontained | Whether scrolling settles on an item |
| `initialSlide` | `number` | `0` | Index shown at construction |
| `minSmallItemWidth` | `number` | `40` | Lower bound on a small item's width |
| `maxSmallItemWidth` | `number` | `56` | Upper bound on a small item's width |
| `ariaLabel` | `string` | `'Carousel'` | Accessible name of the carousel region |
| `class` | `string` | `undefined` | Additional CSS classes |
| `prefix` | `string` | `'mtrl'` | Prefix for CSS class names |

### Slide configuration

A slide is either an image with optional text and a call to action, or arbitrary
content of your own.

| Option | Type | Description |
|--------|------|-------------|
| `image` | `string` | Image source URL |
| `alt` | `string` | Alt text for the image. Falls back to `title`; pass `''` for a decorative image |
| `title` | `string` | Title drawn over the image |
| `description` | `string` | Supporting line under the title |
| `buttonText` | `string` | Label of a call-to-action link |
| `buttonUrl` | `string` | Href for that link |
| `content` | `HTMLElement \| string` | Custom content, replacing the image and text entirely |

## Component API

### Navigation

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `next()` | none | `CarouselComponent` | Moves to the following item, clamped at the end |
| `prev()` | none | `CarouselComponent` | Moves to the preceding item, clamped at the start |
| `goTo(index)` | `index: number` | `CarouselComponent` | Scrolls to an index, smoothly unless reduced motion is requested |
| `getCurrentSlide()` | none | `number` | Index of the item currently snapped into the focal position |
| `getVariant()` | none | `CarouselVariant` | The resolved layout |

### Content

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `addSlide(slide, index?)` | `slide: CarouselSlide, index?: number` | `CarouselComponent` | Inserts a slide, appending it when no index is given |
| `removeSlide(index)` | `index: number` | `CarouselComponent` | Removes a slide |

Adding or removing rebuilds the keyline strategy and re-labels every item, so a
batch of changes costs one layout pass each. `carousel.slides` exposes the same
operations plus a few reads:

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `updateSlide(index, slide)` | `index: number, slide: CarouselSlide` | `SlidesAPI` | Replaces one slide's content in place, without a rebuild |
| `getSlide(index)` | `index: number` | `CarouselSlide \| null` | The slide's configuration |
| `getCount()` | none | `number` | How many slides there are |
| `getElements()` | none | `HTMLElement[]` | A copy of the item elements |

### Events, styling and lifecycle

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `on(event, handler)` | `event: string, handler: Function` | `CarouselComponent` | Adds an event listener |
| `off(event, handler)` | `event: string, handler: Function` | `CarouselComponent` | Removes an event listener |
| `addClass(...classes)` | `...classes: string[]` | `CarouselComponent` | Adds classes to the root element |
| `getClass(name)` | `name: string` | `string` | Prefixes a class name |
| `destroy()` | none | `void` | Disconnects the resize observer and removes every listener |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `change` | `{ index }` | The snapped item changed |

A programmatic `goTo` reports only its destination, not every item it scrolls
past, so a jump from 0 to 5 emits `change` once with `index: 5`. Dragging and
free scrolling emit as each item settles into the focal position.

## Examples

### The five layouts

This is what the showcase renders: one section per variant, each carousel given
an explicit height.

```javascript
const mount = (container, config, height) => {
  const carousel = createCarousel({ slides, ...config });
  carousel.element.style.height = height;
  container.appendChild(carousel.element);
  return carousel;
};

mount(section1, { variant: 'multi-browse', itemWidth: 280 }, '280px');
mount(section2, { variant: 'hero', itemWidth: 480 }, '320px');
mount(section3, { variant: 'hero-center', itemWidth: 480 }, '320px');
mount(section4, { variant: 'uncontained', itemWidth: 280 }, '240px');
```

The full-screen layout scrolls vertically, so it wants a tall, narrow frame:

```javascript
const carousel = createCarousel({ variant: 'full-screen', slides });
carousel.element.style.height = '480px';
carousel.element.style.maxWidth = '360px';
```

### Slides with a call to action

```javascript
const carousel = createCarousel({
  variant: 'hero',
  slides: [
    {
      image: '/promo/spring.jpg',
      alt: 'A garden in bloom',
      title: 'Spring collection',
      description: 'Out now',
      buttonText: 'Browse',
      buttonUrl: '/collections/spring'
    }
  ]
});
```

### Custom content

`content` replaces the image and text, which is how you put a component inside a
slide.

```javascript
carousel.addSlide({ content: card.element });
carousel.addSlide({ content: '<div class="promo">Coming soon</div>' });
```

The item still gets its corner radius, its clip and its accessible label; only
what goes inside it is yours.

### External controls

```javascript
nextButton.on('click', () => carousel.next());
prevButton.on('click', () => carousel.prev());

carousel.on('change', ({ index }) => {
  prevButton.element.disabled = index === 0;
  nextButton.element.disabled = index === carousel.slides.getCount() - 1;
});
```

## Accessibility

- The root element is a `region` with `aria-roledescription="carousel"` and
  `ariaLabel` as its name. Name every carousel on a page distinctly.
- Each item is a focusable `group` with `aria-roledescription="slide"` and an
  `aria-label` of `"n of total"`, kept correct as slides are added and removed.
- The scroller is a real overflow container, so touch, trackpad, wheel and
  assistive-technology scrolling all work without any special handling.
- Arrow keys move between items and scroll the new one into place: Left and Right
  horizontally, Up and Down in the full-screen layout. Home and End jump to the
  first and last item.
- Focusing an item with the keyboard or by any other means brings it into the
  focal position, so tabbing through a carousel does not leave focus off screen.
- `prefers-reduced-motion: reduce` turns off smooth scrolling; the component
  listens for changes to that query and rebuilds when it flips.
- Image alt text is yours to provide. `alt` falls back to `title` when omitted,
  which is rarely the description a screen reader needs.

## Styling

```css
.mtrl-carousel { }
.mtrl-carousel--multi-browse { }
.mtrl-carousel--uncontained { }
.mtrl-carousel--hero { }
.mtrl-carousel--hero-center { }
.mtrl-carousel--full-screen { }
.mtrl-carousel--vertical { }
.mtrl-carousel--snap { }

.mtrl-carousel__scroller { }
.mtrl-carousel__track { }
.mtrl-carousel__item { }
.mtrl-carousel__image { }
.mtrl-carousel__content { }
.mtrl-carousel__title { }
.mtrl-carousel__description { }
.mtrl-carousel__button { }
```

Two custom properties are written by the component: `--mtrl-carousel-corner` on
the root, holding the corner radius, and `--mtrl-carousel-fade` per item, going
from 1 for a large item to 0 for a small one. The text overlay uses the second to
fade out as an item shrinks, and any custom content can do the same.

Do not set `transform` or `clip-path` on `.mtrl-carousel__item` from CSS. The
component writes both on every scroll frame and will overwrite anything you put
there.

## Measurements

The defaults are taken from `CarouselDefaults` in the Compose Material 3
carousel, as `constants.ts` records.

| Attribute | Value | Token |
|-----------|-------|-------|
| Space between items | 8dp, 16dp for full-screen | `CarouselDefaults`, cited in `constants.ts` |
| Container padding | 16dp | `CarouselDefaults`, cited in `constants.ts` |
| Item corner | 28dp | `CarouselDefaults`, cited in `constants.ts` |
| Small item width | 40dp to 56dp | `CarouselDefaults`, cited in `constants.ts` |
| Anchor size | 10dp outside the container | `CarouselDefaults`, cited in `constants.ts` |

The 280dp default large-item width and the 0.85 medium-to-large threshold are in
the same constants block but are not attributed to a spec value there.
