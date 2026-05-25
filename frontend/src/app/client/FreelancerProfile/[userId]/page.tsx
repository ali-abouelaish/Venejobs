'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Breadcrumbs,
  Card,
  ErrorState,
  Icon,
  ServicesShell,
  Skeleton,
  formatPrice,
} from '../../../services-ui';
import {
  RatingSummary,
  UserReviewsSection,
} from '../../../components/reviews/UserReviewsSection';

// Reads from the Next.js API route at /api/freelancer/[userId]/profile,
// which mirrors the legacy Express response shape (returns { profile }
// with nested User, educations, experiences, portfolios, languages,
// skills) so this page stays shape-compatible with both backends.

interface FreelancerUser {
  id: number;
  name?: string;
  email?: string;
  profile_picture?: string | null;
}

interface PortfolioItem {
  id: number;
  title: string;
  description?: string | null;
  project_url?: string | null;
}

interface EducationItem {
  id: number;
  institution_name: string;
  degree?: string | null;
  field_of_study?: string | null;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
}

interface ExperienceItem {
  id: number;
  job_title: string;
  company?: string | null;
  description?: string | null;
  start_month?: string | null;
  start_year?: string | number | null;
  end_month?: string | null;
  end_year?: string | number | null;
  is_current?: boolean;
}

interface LanguageItem {
  language?: string;
  name?: string;
  level?: string | null;
  proficiency?: string | null;
}

interface SkillItem {
  skill_name?: string;
  name?: string;
}

interface FreelancerProfile {
  professional_title?: string | null;
  overview?: string | null;
  hourly_rate?: number | null;
  city?: string | null;
  country?: string | null;
  User?: FreelancerUser;
  educations?: EducationItem[];
  experiences?: ExperienceItem[];
  portfolios?: PortfolioItem[];
  languages?: LanguageItem[];
  skills?: SkillItem[];
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? '';

function avatarSrc(pic: string | null | undefined): string | undefined {
  if (!pic) return undefined;
  if (pic.startsWith('http')) return pic;
  return `${BASE_URL}${pic.replace(/^\//, '')}`;
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function monthLabel(month: string | number | null | undefined): string {
  if (month == null || month === '') return '';
  const n = Number(month);
  if (!Number.isInteger(n) || n < 1 || n > 12) return String(month);
  return MONTH_NAMES[n - 1];
}

function eduPeriod(edu: EducationItem): string {
  const start = edu.start_date ? new Date(edu.start_date).getFullYear() : '';
  const end = edu.end_date ? new Date(edu.end_date).getFullYear() : 'Present';
  return start ? `${start} – ${end}` : '';
}

function expPeriod(exp: ExperienceItem): string {
  const startM = monthLabel(exp.start_month);
  const start = startM
    ? `${startM} ${exp.start_year ?? ''}`.trim()
    : `${exp.start_year ?? ''}`.trim();
  if (exp.is_current) return `${start} – Present`;
  const endM = monthLabel(exp.end_month);
  const end = endM
    ? `${endM} ${exp.end_year ?? ''}`.trim()
    : `${exp.end_year ?? ''}`.trim();
  if (!end) return start;
  return `${start} – ${end}`;
}

export default function FreelancerProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = use(params);
  const userIdNum = Number(userId);
  const router = useRouter();

  const [profile, setProfile] = useState<FreelancerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/freelancer/${encodeURIComponent(userId)}/profile`, {
      cache: 'no-store',
    })
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) {
          setError('Freelancer profile not found.');
          return;
        }
        const data = (await res.json()) as { profile?: FreelancerProfile };
        setProfile(data?.profile ?? null);
      })
      .catch(() => {
        if (cancelled) return;
        setError('Freelancer profile not found.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (loading) {
    return (
      <ServicesShell mode="public">
        <div className="flex flex-col gap-5">
          <div className="relative h-44 rounded-2xl bg-gradient-to-br from-indigo-100 via-violet-100 to-rose-100" />
          <Card padding={24}>
            <div className="flex gap-5 items-center">
              <Skeleton width={112} height={112} radius={56} />
              <div className="flex-1">
                <Skeleton width="40%" height={22} style={{ marginBottom: 10 }} />
                <Skeleton width="60%" height={14} />
              </div>
            </div>
          </Card>
        </div>
      </ServicesShell>
    );
  }

  if (error || !profile) {
    return (
      <ServicesShell mode="public">
        <ErrorState
          title="Freelancer not found"
          body={error ?? 'This profile may have been removed.'}
        />
      </ServicesShell>
    );
  }

  const user = profile.User ?? { id: userIdNum };
  const name = user.name ?? 'Freelancer';
  const headline = profile.professional_title ?? '';
  const location = [profile.city, profile.country].filter(Boolean).join(', ');
  const avatar = avatarSrc(user.profile_picture);
  const portfolios = profile.portfolios ?? [];
  const educations = profile.educations ?? [];
  const experiences = profile.experiences ?? [];
  const languages = profile.languages ?? [];
  const skills = (profile.skills ?? [])
    .map((s) => s.skill_name ?? s.name)
    .filter((x): x is string => Boolean(x));

  const initial = (name?.[0] ?? 'F').toUpperCase();

  return (
    <ServicesShell mode="public">
      <div className="flex flex-col gap-6">
        <Breadcrumbs
          items={[
            { label: 'Browse freelancers', to: '/client/FreelancerProfile' },
            { label: name },
          ]}
          onNavigate={(to) => router.push(to)}
        />

        {/* ===== HERO ===== */}
        <section className="relative rounded-2xl overflow-hidden border border-[var(--border-2)]">
          {/* Gradient banner */}
          <div
            className="h-40 sm:h-48 w-full"
            style={{
              background:
                'linear-gradient(135deg, #6366f1 0%, #8b5cf6 45%, #ec4899 100%)',
            }}
            aria-hidden
          />
          <div className="px-5 sm:px-8 pb-7 -mt-14 sm:-mt-16">
            <div className="flex flex-col sm:flex-row sm:items-end sm:gap-6 gap-4">
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl ring-4 ring-white shadow-md overflow-hidden bg-white flex items-center justify-center">
                {avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatar}
                    alt={name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl sm:text-4xl font-bold text-indigo-500">
                    {initial}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-[var(--fg-1)] leading-tight">
                  {name}
                </h1>
                {headline && (
                  <p className="text-base sm:text-lg text-[var(--fg-3)] mt-1">
                    {headline}
                  </p>
                )}
                <div className="flex flex-wrap gap-4 mt-3 text-sm text-[var(--fg-4)]">
                  {location && (
                    <span className="inline-flex items-center gap-1.5">
                      <Icon name="mapPin" size={14} />
                      {location}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5">
                    <RatingHeader userId={userIdNum} />
                  </span>
                </div>
              </div>
              <div className="hidden sm:block">
                <HireBox profile={profile} userIdNum={userIdNum} router={router} compact />
              </div>
            </div>
            {/* Mobile hire CTA */}
            <div className="sm:hidden mt-4">
              <HireBox profile={profile} userIdNum={userIdNum} router={router} />
            </div>
          </div>
        </section>

        {/* ===== STATS STRIP ===== */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatTile
            label="Hourly rate"
            value={
              profile.hourly_rate != null
                ? formatPrice(Math.round(profile.hourly_rate * 100), {
                    currency: 'gbp',
                  })
                : '—'
            }
            sub={profile.hourly_rate != null ? '/hr' : undefined}
          />
          <StatTile
            label="Skills"
            value={String(skills.length)}
            sub={skills.length === 1 ? 'skill' : 'skills'}
          />
          <StatTile
            label="Experience"
            value={String(experiences.length)}
            sub={experiences.length === 1 ? 'position' : 'positions'}
          />
          <StatTile
            label="Languages"
            value={String(languages.length)}
            sub={languages.length === 1 ? 'language' : 'languages'}
          />
        </section>

        {/* ===== TWO COLUMN ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
          {/* LEFT — narrative */}
          <div className="flex flex-col gap-5">
            {profile.overview && (
              <SectionCard title="About">
                <p className="text-[15px] text-[var(--fg-2)] leading-7 whitespace-pre-wrap">
                  {profile.overview}
                </p>
              </SectionCard>
            )}

            {portfolios.length > 0 && (
              <SectionCard title="Portfolio">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {portfolios.map((p) => (
                    <a
                      key={p.id}
                      href={p.project_url ?? '#'}
                      target={p.project_url ? '_blank' : undefined}
                      rel="noreferrer"
                      className="group block rounded-xl border border-[var(--border-2)] p-4 hover:border-indigo-300 hover:shadow-sm transition"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="font-semibold text-[var(--fg-1)] group-hover:text-indigo-600 transition">
                          {p.title}
                        </h4>
                        {p.project_url && (
                          <Icon name="arrowUpRight" size={14} />
                        )}
                      </div>
                      {p.description && (
                        <p className="text-sm text-[var(--fg-3)] leading-6 mt-2 line-clamp-3">
                          {p.description}
                        </p>
                      )}
                    </a>
                  ))}
                </div>
              </SectionCard>
            )}

            {experiences.length > 0 && (
              <SectionCard title="Work experience">
                <Timeline>
                  {experiences.map((e) => (
                    <TimelineRow key={e.id} period={expPeriod(e)}>
                      <h4 className="font-semibold text-[var(--fg-1)]">
                        {e.job_title}
                        {e.company && (
                          <span className="text-[var(--fg-3)] font-normal">
                            {' '}· {e.company}
                          </span>
                        )}
                      </h4>
                      {e.description && (
                        <p className="text-sm text-[var(--fg-3)] leading-6 mt-1.5 whitespace-pre-wrap">
                          {e.description}
                        </p>
                      )}
                    </TimelineRow>
                  ))}
                </Timeline>
              </SectionCard>
            )}

            {educations.length > 0 && (
              <SectionCard title="Education">
                <Timeline>
                  {educations.map((e) => (
                    <TimelineRow key={e.id} period={eduPeriod(e)}>
                      <h4 className="font-semibold text-[var(--fg-1)]">
                        {e.institution_name}
                        {e.degree && (
                          <span className="text-[var(--fg-3)] font-normal">
                            {' '}— {e.degree}
                          </span>
                        )}
                        {e.field_of_study && (
                          <span className="text-[var(--fg-3)] font-normal">
                            {', '}{e.field_of_study}
                          </span>
                        )}
                      </h4>
                      {e.description && (
                        <p className="text-sm text-[var(--fg-3)] leading-6 mt-1.5 whitespace-pre-wrap">
                          {e.description}
                        </p>
                      )}
                    </TimelineRow>
                  ))}
                </Timeline>
              </SectionCard>
            )}

            <UserReviewsSection userId={userIdNum} />
          </div>

          {/* RIGHT — sticky sidebar */}
          <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
            {skills.length > 0 && (
              <SectionCard title="Skills" compact>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((s) => (
                    <span
                      key={s}
                      className="px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </SectionCard>
            )}

            {languages.length > 0 && (
              <SectionCard title="Languages" compact>
                <ul className="flex flex-col gap-2">
                  {languages.map((l, i) => {
                    const lang = l.language ?? l.name ?? '';
                    const lvl = l.proficiency ?? l.level ?? '';
                    if (!lang) return null;
                    return (
                      <li
                        key={`${lang}-${i}`}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-[var(--fg-2)]">{lang}</span>
                        {lvl && (
                          <span className="text-xs text-[var(--fg-4)] uppercase tracking-wide font-medium">
                            {lvl}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </SectionCard>
            )}
          </aside>
        </div>
      </div>
    </ServicesShell>
  );
}

/* ===================== presentational pieces ===================== */

function HireBox({
  profile,
  userIdNum,
  router,
  compact,
}: {
  profile: FreelancerProfile;
  userIdNum: number;
  router: ReturnType<typeof useRouter>;
  compact?: boolean;
}) {
  const rate = profile.hourly_rate;
  return (
    <div
      className={`rounded-xl border border-[var(--border-2)] bg-white ${
        compact ? 'px-4 py-3' : 'p-4'
      } flex items-center gap-4 shadow-sm`}
    >
      {rate != null && (
        <div className="text-right">
          <div className="text-[11px] uppercase tracking-wider font-semibold text-[var(--fg-4)]">
            From
          </div>
          <div className="text-xl font-bold text-[var(--fg-1)] leading-none mt-1">
            {formatPrice(Math.round(rate * 100), { currency: 'gbp' })}
            <span className="text-xs font-medium text-[var(--fg-4)] ml-1">
              /hr
            </span>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => router.push(`/client/HireFreelancer/${userIdNum}`)}
        className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition cursor-pointer whitespace-nowrap"
      >
        Hire me
      </button>
    </div>
  );
}

function StatTile({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Card padding={16}>
      <div className="text-[11px] uppercase tracking-wider font-semibold text-[var(--fg-4)]">
        {label}
      </div>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span className="text-xl font-bold text-[var(--fg-1)]">{value}</span>
        {sub && (
          <span className="text-xs text-[var(--fg-4)] font-medium">{sub}</span>
        )}
      </div>
    </Card>
  );
}

function SectionCard({
  title,
  children,
  compact,
}: {
  title: string;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <Card padding={compact ? 18 : 24}>
      <h3 className="text-[15px] font-bold text-[var(--fg-1)] mb-3">{title}</h3>
      {children}
    </Card>
  );
}

function Timeline({ children }: { children: React.ReactNode }) {
  return <ul className="flex flex-col gap-5">{children}</ul>;
}

function TimelineRow({
  period,
  children,
}: {
  period: string;
  children: React.ReactNode;
}) {
  return (
    <li className="relative pl-6">
      <span className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-indigo-500" />
      <span className="absolute left-[5px] top-5 bottom-[-20px] w-px bg-[var(--border-2)] last:hidden" />
      <div className="text-xs font-medium text-[var(--fg-4)] uppercase tracking-wide mb-1">
        {period}
      </div>
      {children}
    </li>
  );
}

/**
 * Fetches just the rating aggregate to render inline on the hero. The
 * full UserReviewsSection below the fold makes its own request — we
 * accept the duplicate because both surfaces need data independently and
 * the response is small + indexed.
 */
function RatingHeader({ userId }: { userId: number }) {
  const [avg, setAvg] = useState(0);
  const [count, setCount] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/users/${userId}/reviews?cursor=`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setAvg(Number(d.rating_avg) || 0);
        setCount(d.rating_count ?? 0);
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (!loaded) return null;
  return <RatingSummary value={avg} count={count} />;
}
