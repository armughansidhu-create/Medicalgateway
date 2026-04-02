// ─── Platform Categories (expandable) ────────────────────────────────────────
export type PlatformCategory =
  | 'MBBS'
  | 'FCPS_PART1'
  | 'USMLE_STEP1'
  | 'MRCP'
  | 'BDS'
  | 'NURSING'
  | 'MDCAT'
  | string   // allows future custom categories

// ─── MBBS Years ───────────────────────────────────────────────────────────────
export type MBBSYear =
  | '1st Year'
  | '2nd Year'
  | '3rd Year'
  | '4th Year'
  | 'Final Year'

// ─── University (future expansion) ───────────────────────────────────────────
export interface University {
  id: string
  name: string
  short_name: string
  city: string
  active: boolean
}

// ─── Subject ─────────────────────────────────────────────────────────────────
export interface Subject {
  id: string
  name: string
  code: string                    // e.g. ANAT, PHYS1, PATH
  category: PlatformCategory
  year?: MBBSYear                 // null for non-MBBS categories
  university_id?: string          // null = all universities
  total_mcqs?: number
  active: boolean
  created_at: string
}

// ─── MCQ ─────────────────────────────────────────────────────────────────────
export type Difficulty = 'Easy' | 'Medium' | 'Hard'

export interface MCQ {
  id: string
  mcq_code: string               // e.g. ANAT-001
  subject_id: string
  subject?: Subject
  chapter: string
  topic: string
  question: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  option_e?: string              // optional 5th option
  correct_answer: 'A' | 'B' | 'C' | 'D' | 'E'
  explanation: string
  difficulty: Difficulty
  tags: string[]
  is_active: boolean
  created_at: string
}

// ─── User / Subscription ─────────────────────────────────────────────────────
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'free'
export type UserRole = 'student' | 'admin' | 'super_admin'

export interface UserProfile {
  id: string
  email: string
  full_name: string
  phone?: string
  medical_college?: string
  mbbs_year?: MBBSYear
  role: UserRole
  subscription_status: SubscriptionStatus
  subscription_plan?: 'annual_full' | 'annual_discounted'  // PKR 4800 or 3600
  subscription_end?: string
  stripe_customer_id?: string
  free_mcqs_used: number          // track free trial usage
  created_at: string
}

// ─── Exam / Attempt ───────────────────────────────────────────────────────────
export type ExamMode = 'practice' | 'timed' | 'mock'
export type ExamStatus = 'in_progress' | 'completed' | 'abandoned'

export interface ExamSession {
  id: string
  user_id: string
  mode: ExamMode
  status: ExamStatus
  subject_id?: string
  category: PlatformCategory
  year_filter?: MBBSYear
  total_questions: number
  time_limit_minutes?: number
  started_at: string
  completed_at?: string
  score?: number                  // percentage
  correct_count?: number
  incorrect_count?: number
  skipped_count?: number
}

export interface MCQAttempt {
  id: string
  session_id: string
  user_id: string
  mcq_id: string
  mcq?: MCQ
  selected_answer?: 'A' | 'B' | 'C' | 'D' | 'E'
  is_correct?: boolean
  is_skipped: boolean
  time_spent_seconds?: number
  created_at: string
}

// ─── Analytics ────────────────────────────────────────────────────────────────
export interface SubjectPerformance {
  subject_id: string
  subject_name: string
  total_attempted: number
  correct: number
  percentage: number
}

export interface UserStats {
  total_attempted: number
  total_correct: number
  overall_percentage: number
  current_streak: number
  longest_streak: number
  subjects: SubjectPerformance[]
  recent_sessions: ExamSession[]
}

// ─── Admin ────────────────────────────────────────────────────────────────────
export interface UploadResult {
  success: number
  failed: number
  errors: string[]
}

export interface AdminStats {
  total_users: number
  active_subscribers: number
  total_mcqs: number
  monthly_revenue_pkr: number
  new_users_this_month: number
  sessions_today: number
}

// ─── Pricing Plans ────────────────────────────────────────────────────────────
export interface PricingPlan {
  id: string
  name: string
  price_pkr: number
  stripe_price_id: string
  description: string
  features: string[]
  is_popular?: boolean
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'annual_full',
    name: 'MBBS Complete',
    price_pkr: 4800,
    stripe_price_id: process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL_FULL || '',
    description: 'Full access to all MBBS subjects — 1st to Final Year',
    features: [
      '25,000+ MCQs across all MBBS years',
      'All 22 subjects covered',
      'Timed mock exams',
      'Detailed explanations for every MCQ',
      'Performance analytics & weak subject tracking',
      'New MCQs added regularly',
      'Mobile-friendly — study anywhere',
    ],
    is_popular: true,
  },
  {
    id: 'annual_discounted',
    name: 'Single Year',
    price_pkr: 3600,
    stripe_price_id: process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL_DISCOUNTED || '',
    description: 'Access to one MBBS year of your choice',
    features: [
      'All subjects for your selected year',
      'Timed practice sessions',
      'Detailed explanations',
      'Performance tracking',
      'Mobile-friendly',
    ],
  },
]

// ─── Free trial limits ────────────────────────────────────────────────────────
export const FREE_MCQ_LIMIT = 50

// ─── Subject master list (matches your 22 folders) ───────────────────────────
export const SUBJECTS_MASTER = [
  { code: 'ANAT',  name: 'Gross Anatomy',       year: '1st Year',   category: 'MBBS' },
  { code: 'NEUR',  name: 'Neuroanatomy',         year: '1st Year',   category: 'MBBS' },
  { code: 'HIST',  name: 'Histology',            year: '1st Year',   category: 'MBBS' },
  { code: 'EMBR',  name: 'Embryology',           year: '1st Year',   category: 'MBBS' },
  { code: 'PHYS1', name: 'Physiology',           year: '1st Year',   category: 'MBBS' },
  { code: 'BIOC',  name: 'Biochemistry',         year: '1st Year',   category: 'MBBS' },
  { code: 'PHYS2', name: 'Physiology',           year: '2nd Year',   category: 'MBBS' },
  { code: 'PHAR',  name: 'Pharmacology',         year: '2nd Year',   category: 'MBBS' },
  { code: 'MICR',  name: 'Microbiology',         year: '2nd Year',   category: 'MBBS' },
  { code: 'IMMU',  name: 'Immunology',           year: '2nd Year',   category: 'MBBS' },
  { code: 'PATH',  name: 'Pathology',            year: '2nd Year',   category: 'MBBS' },
  { code: 'FORN',  name: 'Forensic Medicine',    year: '3rd Year',   category: 'MBBS' },
  { code: 'COMM',  name: 'Community Medicine',   year: '3rd Year',   category: 'MBBS' },
  { code: 'OPHT',  name: 'Ophthalmology',        year: 'Final Year', category: 'MBBS' },
  { code: 'ENTT',  name: 'ENT',                  year: 'Final Year', category: 'MBBS' },
  { code: 'PAED',  name: 'Pediatrics',           year: 'Final Year', category: 'MBBS' },
  { code: 'MEDI',  name: 'Medicine',             year: 'Final Year', category: 'MBBS' },
  { code: 'GYNE',  name: 'Gynecology',           year: 'Final Year', category: 'MBBS' },
  { code: 'OBST',  name: 'Obstetrics',           year: 'Final Year', category: 'MBBS' },
  { code: 'SURG',  name: 'Surgery',              year: 'Final Year', category: 'MBBS' },
  { code: 'ONCO',  name: 'Medical Oncology',     year: 'Final Year', category: 'MBBS' },
] as const
