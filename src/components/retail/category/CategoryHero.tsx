import { Grid2X2 } from 'lucide-react';

const images = ['/marketplace/electronics.jpg', '/marketplace/home.jpg', '/marketplace/fashion.jpg'];

export function CategoryHero({ categoryCount, productCount }: { categoryCount: number; productCount: number }) {
  return (
    <header className="relative grid min-h-[150px] overflow-hidden rounded-lg border border-retail-border bg-retail-light-green px-5 py-6 sm:grid-cols-[minmax(0,1fr)_320px] sm:items-center sm:px-8 lg:min-h-[180px]">
      <div className="relative z-10 min-w-0">
        <p className="flex items-center gap-2 text-xs font-bold uppercase text-retail-green"><Grid2X2 className="h-4 w-4" />Browse departments</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-retail-dark-green sm:text-4xl">All Categories</h1>
        <p className="mt-2 max-w-xl text-sm text-retail-muted sm:text-base">Explore everything available on Tejaraa and find the right department faster.</p>
        {categoryCount > 0 && <p className="mt-3 text-xs font-semibold text-retail-green">{categoryCount.toLocaleString()} departments{productCount > 0 ? ` · ${productCount.toLocaleString()} products` : ''}</p>}
      </div>
      <div aria-hidden="true" className="absolute inset-y-0 right-0 hidden w-[42%] items-center justify-end gap-2 overflow-hidden pr-5 sm:flex">
        {images.map((image, index) => <span key={image} className={`block w-24 overflow-hidden rounded-md border-4 border-retail-card bg-retail-card shadow-sm ${index === 1 ? '-translate-y-3' : 'translate-y-3'}`}><img src={image} alt="" width={192} height={192} className="aspect-square w-full object-cover" /></span>)}
      </div>
    </header>
  );
}