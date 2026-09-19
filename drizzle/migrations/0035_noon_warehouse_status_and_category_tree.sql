alter table public.noon_warehouses add column if not exists noon_status text not null default 'active';
alter table public.noon_category_cache add column if not exists parent_code text;
alter table public.noon_category_cache add column if not exists level integer not null default 0;
alter table public.noon_category_cache add column if not exists path_en text;
alter table public.noon_category_cache add column if not exists path_ar text;
create unique index if not exists noon_warehouses_unique on public.noon_warehouses (connection_id, market, warehouse_code);
create index if not exists noon_category_cache_parent_idx on public.noon_category_cache (parent_code);