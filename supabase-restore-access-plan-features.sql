-- Fluxora access-plan bullet restoration
-- Run once in Supabase SQL Editor after the previous fixed-admin migration.

update public.access_plans
set
  features = E'Prompts\nTools\nCustom GPTs\nCourses\nWeb Access',
  button_label = 'Choose Premium'
where id = 'premium';

update public.access_plans
set features = E'Prompts+\nTools+\nCustom GPTs+\nCourses+\nWorkflows\nWeb Access+\nSecret Methods'
where id = 'creator';
