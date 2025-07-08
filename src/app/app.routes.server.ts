import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'all/:category',
    renderMode: RenderMode.Server,
  },
  {
    path: 'all/:category/:ads/:id',
    renderMode: RenderMode.Server,
  },
  {
    // Prerender all other routes.
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
