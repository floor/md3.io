// The carousel card (and a component page's hero): the factory, so it can scroll freely.
// <m-carousel> takes no snap attribute (material 3.16.4), and snapping is on by default.
import 'material/elements/css/carousel';
import createCarousel from 'material/components/carousel';
import { carouselPlaces, picsum } from '../../shared/carousel-places';
import { surface } from './surface';

export const define = (): void => surface('md3-catalog-carousel', ['carousel'], () => {
  const carousel = createCarousel({
    ariaLabel: 'Places to explore', itemWidth: 200, gap: 8, padding: 0, cornerRadius: 28, snap: false,
    slides: carouselPlaces.map(place => ({ image: picsum(place.id), alt: `${place.title}, ${place.location}`, title: place.title, description: place.location })),
  });
  return { element: carousel.element, destroy: () => carousel.destroy() };
});
