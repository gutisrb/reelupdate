-- Create presets table for storing user configurations
create table if not exists public.presets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  type text not null check (type in ('wizard', 'script_hook', 'visual_hook')),
  data jsonb not null default '{}'::jsonb,
  is_verified boolean default false, -- For system default presets
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.presets enable row level security;

-- Policies
create policy "Users can view their own presets and verified presets"
  on public.presets for select
  using (auth.uid() = user_id or is_verified = true);

create policy "Users can insert their own presets"
  on public.presets for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own presets"
  on public.presets for update
  using (auth.uid() = user_id);

create policy "Users can delete their own presets"
  on public.presets for delete
  using (auth.uid() = user_id);

-- Create index for faster lookups
create index if not exists presets_user_id_idx on public.presets(user_id);
create index if not exists presets_type_idx on public.presets(type);
