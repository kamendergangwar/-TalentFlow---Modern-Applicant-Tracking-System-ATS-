ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS stages JSONB NOT NULL DEFAULT '[
  {"id": "applied", "label": "Applied", "color": "bg-blue-500"},
  {"id": "screening", "label": "Screening", "color": "bg-yellow-500"},
  {"id": "interview", "label": "Interview", "color": "bg-purple-500"},
  {"id": "offer", "label": "Offer", "color": "bg-green-500"},
  {"id": "rejected", "label": "Rejected", "color": "bg-red-500"}
]'::jsonb;
