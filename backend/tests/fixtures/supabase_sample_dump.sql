-- Fixture minimal pour discovery TICKET-250 (ne pas utiliser en prod).
CREATE TABLE public.landing_partners (
    id uuid PRIMARY KEY,
    company_name text NOT NULL,
    city text,
    phone text,
    email text,
    instagram_handle text,
    notes text,
    signed boolean DEFAULT false,
    created_at timestamptz
);

CREATE TABLE public.auth_users (
    id uuid PRIMARY KEY,
    email text NOT NULL
);
