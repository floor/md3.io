// The carousel card (and a component page's hero): the factory, so it can scroll freely.
// <m-carousel> takes no snap attribute (material 3.16.4), and snapping is on by default.
import 'material/elements/css/carousel';
import createCarousel from 'material/components/carousel';
import { carouselPlaces, picsum } from '../../shared/carousel-places';
import { carouselPhotos, carouselPhotoUrl } from '../../shared/carousel-photos';
import { surface } from './surface';

const slides = () => carouselPlaces.map(place => ({ image: picsum(place.id), alt: `${place.title}, ${place.location}`, title: place.title, description: place.location }));

/** The Overview's property sections: `md3-catalog-carousel-variant-<layout>` (component-properties.ts). The hero layouts get a large
 * item that fills most of the strip, so the layout reads as one hero and a glimpse. */
const LAYOUTS = ['multi-browse', 'uncontained', 'hero', 'hero-center', 'full-screen'] as const;

export const define = (): void => {
  surface('md3-catalog-carousel', ['carousel'], () => {
    const carousel = createCarousel({ ariaLabel: 'Places to explore', itemWidth: 200, gap: 8, padding: 0, cornerRadius: 28, snap: false, slides: slides() });
    return { element: carousel.element, destroy: () => carousel.destroy() };
  });
  for (const layout of LAYOUTS) surface(`md3-catalog-carousel-variant-${layout}`, ['carousel'], () => {
    const carousel = createCarousel({ ariaLabel: 'Places to explore', variant: layout, ...(layout === 'full-screen' ? {} : { itemWidth: layout === 'hero' ? 780 : layout === 'hero-center' ? 780 : 280 }), gap: 8, padding: 0,
      // Each layout its own photos: the playground's curated set for it (carousel-photos.ts), at that layout's size.
      slides: carouselPhotos(layout).slice(0, 12).map(photo => ({ image: carouselPhotoUrl(layout, photo.id), alt: `${photo.title}, ${photo.location}`, title: photo.title, description: photo.location })) } as never);
    return { element: carousel.element, destroy: () => carousel.destroy() };
  });
};
