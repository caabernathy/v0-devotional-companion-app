-- Seed a sample devotional for today
INSERT INTO public.devotionals (date, verse_reference, verse_text, reflection, prayer_points, themes)
VALUES (
  CURRENT_DATE,
  'Philippians 4:13',
  'I can do all things through Christ who strengthens me.',
  'This powerful verse reminds us that our strength doesn''t come from ourselves, but from Christ. When we face challenges that seem insurmountable, we can draw on His infinite power. Paul wrote these words while imprisoned, yet he found contentment and strength in every circumstance through his relationship with Christ. This isn''t about achieving worldly success, but about having the spiritual fortitude to face whatever God calls us to do. Today, remember that you''re not alone in your struggles - Christ is your source of strength.',
  ARRAY[
    'Thank God for being your source of strength in difficult times',
    'Ask for wisdom to recognize when you''re relying on your own strength instead of His',
    'Pray for someone you know who is facing a challenging situation'
  ],
  ARRAY['strength', 'faith', 'perseverance', 'trust']
)
ON CONFLICT (date) DO NOTHING;
