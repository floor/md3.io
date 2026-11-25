// The carousel card's places: Lorem Picsum photos, from vlist.io's carousel demo
// (src/data/carousel.js), at twice the card's 200 × 148 slide.
// Lorem Picsum (https://picsum.photos, read 2026-10-02) says "Images from Unsplash" and states no licence of its own.
// Unsplash publishes its licence at https://unsplash.com/license (read 2026-10-02): "Unsplash grants you an irrevocable, nonexclusive, worldwide copyright license to download, copy, modify, distribute, perform, and use images from Unsplash for free, including for commercial purposes, without permission from or attributing the photographer or Unsplash."
// Neither page says which terms cover a given photo. The images are loaded from that service at view time, not stored in this repository.
export const carouselPlaces = [
  { id: 29, title: 'Himalayan Peaks', location: 'Nepal' },
  { id: 49, title: 'Santorini Village', location: 'Greece' },
  { id: 62, title: 'Tuscan Sunrise', location: 'Tuscany' },
  { id: 506, title: 'Gullfoss Falls', location: 'Iceland' },
  { id: 122, title: 'Millennium Bridge', location: 'London' },
  { id: 984, title: 'Highland Drama', location: 'Scotland' },
] as const;
export const picsum = (id: number) => `https://picsum.photos/id/${id}/400/296`;
