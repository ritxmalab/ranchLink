-- ============================================================================
-- TAMACORE: Seed early target pipeline (Central Texas)
-- ============================================================================
-- Run after ADD_TAMACORE_PIPELINE.sql. Idempotent: only inserts if no rows.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.pipeline_contacts LIMIT 1) THEN
    INSERT INTO public.pipeline_contacts (list_order, legal_name, contact, location, category, herd_type, estimated_herd, status)
    VALUES
      (1,  'Smith Genetics LLC',           'Timothy J. Smith',     'Giddings TX',  'Breeder', 'Seedstock genetics',     '100-250',  'prototype_sent'),
      (2,  'Braham Country Genetics LLC',   'Ranch Owner',          'Llano TX',     'Breeder', 'Brahman genetics',      '200-400',  'target'),
      (3,  'V8 Ranch Inc',                 'Ranch Management',     'Wharton TX',   'Breeder', 'Brahman genetics',      '500-1000', 'target'),
      (4,  'BRC Ranch LLC',                 'Operations Manager',   'Refugio TX',   'Breeder', 'Wagyu breeding',       '200-400',  'target'),
      (5,  'McClaren Farms LLC',            'Ranch Owner',          'Texas',        'Breeder', 'Angus seedstock',        '150-300',  'target'),
      (6,  'Mill-King Market & Creamery LLC', 'Dairy Manager',     'McGregor TX',  'Dairy',   'Grass-fed dairy',        '200-400',  'target'),
      (7,  'Volleman''s Family Farm LLC',   'Ranch Owner',          'Gustine TX',   'Dairy',   'Commercial dairy',       '300-600',  'target'),
      (8,  'Stryk Jersey Farm LLC',         'Ranch Owner',          'Schulenburg TX', 'Dairy', 'Jersey dairy',          '200-350',  'target'),
      (9,  'Richardson Farms LLC',          'Ranch Manager',        'Rockdale TX',  'Beef',    'Cow-calf operation',     '300-600',  'target'),
      (10, 'Strait Ranch Company LLC',      'Ranch Management',     'South TX',     'Beef',    'Large cattle ranch',     '1000+',    'target'),
      (11, 'JB Ranch LLC',                 'Ranch Owner',          'Buda TX',      'Beef',    'Cow-calf herd',          '100-200',  'target'),
      (12, '4C Ranch LLC',                 'Ranch Owner',          'Dripping Springs TX', 'Beef', 'Cow-calf herd', '150-250',  'target');
  END IF;
END $$;
