-- ═══════════════════════════════════════════════════════════════
-- MEDICALGATEWAY DATABASE SCHEMA
-- Run this entire file in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── UNIVERSITIES (future expansion) ─────────────────────────
create table if not exists universities (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  short_name   text not null,
  city         text,
  active       boolean default true,
  created_at   timestamptz default now()
);

-- ─── SUBJECTS ────────────────────────────────────────────────
create table if not exists subjects (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  code            text not null unique,   -- ANAT, PHYS1, PATH etc.
  category        text not null default 'MBBS',  -- MBBS, FCPS_PART1, USMLE_STEP1, MRCP etc.
  year            text,                   -- 1st Year, 2nd Year ... Final Year
  university_id   uuid references universities(id) on delete set null,
  display_order   integer default 0,
  active          boolean default true,
  created_at      timestamptz default now()
);

-- Seed all 21 MBBS subjects
insert into subjects (name, code, category, year, display_order) values
  ('Gross Anatomy',       'ANAT',  'MBBS', '1st Year',   1),
  ('Neuroanatomy',        'NEUR',  'MBBS', '1st Year',   2),
  ('Histology',           'HIST',  'MBBS', '1st Year',   3),
  ('Embryology',          'EMBR',  'MBBS', '1st Year',   4),
  ('Physiology',          'PHYS1', 'MBBS', '1st Year',   5),
  ('Biochemistry',        'BIOC',  'MBBS', '1st Year',   6),
  ('Physiology',          'PHYS2', 'MBBS', '2nd Year',   7),
  ('Pharmacology',        'PHAR',  'MBBS', '2nd Year',   8),
  ('Microbiology',        'MICR',  'MBBS', '2nd Year',   9),
  ('Immunology',          'IMMU',  'MBBS', '2nd Year',   10),
  ('Pathology',           'PATH',  'MBBS', '2nd Year',   11),
  ('Forensic Medicine',   'FORN',  'MBBS', '3rd Year',   12),
  ('Community Medicine',  'COMM',  'MBBS', '3rd Year',   13),
  ('Ophthalmology',       'OPHT',  'MBBS', 'Final Year', 14),
  ('ENT',                 'ENTT',  'MBBS', 'Final Year', 15),
  ('Pediatrics',          'PAED',  'MBBS', 'Final Year', 16),
  ('Medicine',            'MEDI',  'MBBS', 'Final Year', 17),
  ('Gynecology',          'GYNE',  'MBBS', 'Final Year', 18),
  ('Obstetrics',          'OBST',  'MBBS', 'Final Year', 19),
  ('Surgery',             'SURG',  'MBBS', 'Final Year', 20),
  ('Medical Oncology',    'ONCO',  'MBBS', 'Final Year', 21)
on conflict (code) do nothing;

-- ─── USER PROFILES ───────────────────────────────────────────
create table if not exists user_profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,
  email                 text not null,
  full_name             text,
  phone                 text,
  medical_college       text,
  mbbs_year             text,
  role                  text not null default 'student',  -- student, admin, super_admin
  subscription_status   text not null default 'free',     -- free, trialing, active, past_due, canceled
  subscription_plan     text,                             -- annual_full, annual_discounted
  subscription_end      timestamptz,
  stripe_customer_id    text unique,
  stripe_subscription_id text unique,
  free_mcqs_used        integer default 0,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

-- ─── MCQs ────────────────────────────────────────────────────
create table if not exists mcqs (
  id               uuid primary key default uuid_generate_v4(),
  mcq_code         text unique,                 -- ANAT-001, PATH-045 etc.
  subject_id       uuid not null references subjects(id) on delete restrict,
  chapter          text,
  topic            text,
  question         text not null,
  option_a         text not null,
  option_b         text not null,
  option_c         text not null,
  option_d         text not null,
  option_e         text,                        -- optional 5th option
  correct_answer   text not null check (correct_answer in ('A','B','C','D','E')),
  explanation      text,
  difficulty       text default 'Medium' check (difficulty in ('Easy','Medium','Hard')),
  tags             text[] default '{}',
  is_active        boolean default true,
  created_by       uuid references auth.users(id) on delete set null,
  created_at       timestamptz default now()
);

create index if not exists idx_mcqs_subject on mcqs(subject_id);
create index if not exists idx_mcqs_difficulty on mcqs(difficulty);
create index if not exists idx_mcqs_active on mcqs(is_active);

-- ─── EXAM SESSIONS ───────────────────────────────────────────
create table if not exists exam_sessions (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  mode                text not null check (mode in ('practice','timed','mock')),
  status              text not null default 'in_progress' check (status in ('in_progress','completed','abandoned')),
  category            text not null default 'MBBS',
  subject_id          uuid references subjects(id) on delete set null,
  year_filter         text,
  total_questions     integer not null,
  time_limit_minutes  integer,
  started_at          timestamptz default now(),
  completed_at        timestamptz,
  score               numeric(5,2),
  correct_count       integer default 0,
  incorrect_count     integer default 0,
  skipped_count       integer default 0
);

create index if not exists idx_sessions_user on exam_sessions(user_id);
create index if not exists idx_sessions_status on exam_sessions(status);

-- ─── MCQ ATTEMPTS ────────────────────────────────────────────
create table if not exists mcq_attempts (
  id                   uuid primary key default uuid_generate_v4(),
  session_id           uuid not null references exam_sessions(id) on delete cascade,
  user_id              uuid not null references auth.users(id) on delete cascade,
  mcq_id               uuid not null references mcqs(id) on delete cascade,
  selected_answer      text check (selected_answer in ('A','B','C','D','E')),
  is_correct           boolean,
  is_skipped           boolean default false,
  time_spent_seconds   integer,
  created_at           timestamptz default now()
);

create index if not exists idx_attempts_user on mcq_attempts(user_id);
create index if not exists idx_attempts_session on mcq_attempts(session_id);
create index if not exists idx_attempts_mcq on mcq_attempts(mcq_id);

-- ─── USER STREAKS ─────────────────────────────────────────────
create table if not exists user_streaks (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  current_streak   integer default 0,
  longest_streak   integer default 0,
  last_active_date date
);

-- ─── SUBSCRIPTIONS LOG ───────────────────────────────────────
create table if not exists subscription_events (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references auth.users(id) on delete set null,
  event_type    text not null,   -- created, renewed, canceled, payment_failed
  plan          text,
  amount_pkr    numeric(10,2),
  stripe_event_id text unique,
  created_at    timestamptz default now()
);

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────

alter table user_profiles enable row level security;
alter table mcqs enable row level security;
alter table exam_sessions enable row level security;
alter table mcq_attempts enable row level security;
alter table user_streaks enable row level security;
alter table subjects enable row level security;
alter table universities enable row level security;
alter table subscription_events enable row level security;

-- user_profiles: users see only their own
create policy "Users read own profile"
  on user_profiles for select using (auth.uid() = id);
create policy "Users update own profile"
  on user_profiles for update using (auth.uid() = id);
create policy "Admin full access profiles"
  on user_profiles for all using (
    exists (select 1 from user_profiles where id = auth.uid() and role in ('admin','super_admin'))
  );

-- mcqs: active subscribers + free trial users see MCQs
create policy "Subscribers read MCQs"
  on mcqs for select using (
    is_active = true and (
      exists (
        select 1 from user_profiles
        where id = auth.uid()
        and (
          subscription_status in ('active', 'trialing')
          or role in ('admin', 'super_admin')
        )
      )
    )
  );
create policy "Admin manage MCQs"
  on mcqs for all using (
    exists (select 1 from user_profiles where id = auth.uid() and role in ('admin','super_admin'))
  );

-- exam_sessions: users manage own sessions
create policy "Users own sessions"
  on exam_sessions for all using (auth.uid() = user_id);
create policy "Admin read all sessions"
  on exam_sessions for select using (
    exists (select 1 from user_profiles where id = auth.uid() and role in ('admin','super_admin'))
  );

-- mcq_attempts: users manage own attempts
create policy "Users own attempts"
  on mcq_attempts for all using (auth.uid() = user_id);

-- user_streaks: users own streaks
create policy "Users own streaks"
  on user_streaks for all using (auth.uid() = user_id);

-- subjects: everyone can read
create policy "Anyone reads subjects"
  on subjects for select using (active = true);
create policy "Admin manage subjects"
  on subjects for all using (
    exists (select 1 from user_profiles where id = auth.uid() and role in ('admin','super_admin'))
  );

-- universities: everyone can read
create policy "Anyone reads universities"
  on universities for select using (active = true);

-- subscription_events: admin only
create policy "Admin reads subscription events"
  on subscription_events for select using (
    exists (select 1 from user_profiles where id = auth.uid() and role in ('admin','super_admin'))
  );

-- ─── FUNCTIONS ────────────────────────────────────────────────

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
set search_path = public as $$
begin
  insert into public.user_profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  insert into public.user_streaks (user_id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Get subject MCQ counts
create or replace function get_subject_counts()
returns table(subject_id uuid, count bigint) language sql as $$
  select subject_id, count(*) from mcqs where is_active = true group by subject_id;
$$;

-- Get admin dashboard stats
create or replace function get_admin_stats()
returns json language plpgsql security definer as $$
declare
  result json;
begin
  select json_build_object(
    'total_users',          (select count(*) from user_profiles),
    'active_subscribers',   (select count(*) from user_profiles where subscription_status = 'active'),
    'total_mcqs',           (select count(*) from mcqs where is_active = true),
    'new_users_this_month', (select count(*) from user_profiles where created_at > date_trunc('month', now())),
    'sessions_today',       (select count(*) from exam_sessions where started_at::date = current_date)
  ) into result;
  return result;
end;
$$;
