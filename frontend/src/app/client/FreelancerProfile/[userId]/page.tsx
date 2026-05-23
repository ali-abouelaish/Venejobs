'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Avatar,
  Badge,
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
// Legacy axios helper — backend is frozen but functional. Same shape used
// by the old JSX page: returns { profile } where profile has nested User,
// educations, experiences, portfolios, languages, skills.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — legacy JS module without types
import { getPublicFreelancerProfile } from '@/app/lib/freelancer';

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

function eduPeriod(edu: EducationItem): string {
  const start = edu.start_date ? new Date(edu.start_date).getFullYear() : '';
  const end = edu.end_date ? new Date(edu.end_date).getFullYear() : 'Present';
  return start ? `${start} – ${end}` : '';
}

function expPeriod(exp: ExperienceItem): string {
  const start = exp.start_month
    ? `${exp.start_month} ${exp.start_year ?? ''}`
    : `${exp.start_year ?? ''}`;
  const end = exp.is_current
    ? 'Present'
    : exp.end_month
      ? `${exp.end_month} ${exp.end_year ?? ''}`
      : `${exp.end_year ?? ''}`;
  return `${start.trim()} – ${end.trim()}`.trim();
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
    getPublicFreelancerProfile(userId)
      .then((res: { profile?: FreelancerProfile }) => {
        if (cancelled) return;
        setProfile(res?.profile ?? null);
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Card padding={24}>
            <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
              <Skeleton width={96} height={96} radius={48} />
              <div style={{ flex: 1 }}>
                <Skeleton width="40%" height={22} style={{ marginBottom: 10 }} />
                <Skeleton width="60%" height={14} />
              </div>
            </div>
          </Card>
          <Card padding={24}>
            <Skeleton width="30%" height={16} style={{ marginBottom: 10 }} />
            <Skeleton width="80%" height={14} />
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

  return (
    <ServicesShell mode="public">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Breadcrumbs
          items={[
            { label: 'Browse freelancers', to: '/client/FreelancerProfile' },
            { label: name },
          ]}
          onNavigate={(to) => router.push(to)}
        />

        <Card padding={28}>
          <div
            style={{
              display: 'flex',
              gap: 24,
              alignItems: 'flex-start',
              flexWrap: 'wrap',
            }}
          >
            <Avatar name={name} src={avatar} size={104} tone="freelancer" />
            <div style={{ flex: 1, minWidth: 240 }}>
              <h1
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: 'var(--fg-1)',
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                {name}
              </h1>
              {headline && (
                <p
                  style={{
                    fontSize: 16,
                    color: 'var(--fg-3)',
                    margin: '6px 0 0',
                    lineHeight: 1.5,
                  }}
                >
                  {headline}
                </p>
              )}
              <div
                style={{
                  display: 'flex',
                  gap: 16,
                  marginTop: 12,
                  flexWrap: 'wrap',
                  alignItems: 'center',
                }}
              >
                {location && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 13,
                      color: 'var(--fg-4)',
                    }}
                  >
                    <Icon name="mapPin" size={14} />
                    {location}
                  </span>
                )}
                <RatingHeader userId={userIdNum} />
              </div>
            </div>
            {profile.hourly_rate != null && (
              <div
                style={{
                  textAlign: 'right',
                  padding: '12px 16px',
                  background: 'var(--bg-2)',
                  borderRadius: 10,
                  border: '1px solid var(--border-2)',
                  minWidth: 140,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    color: 'var(--fg-4)',
                  }}
                >
                  Hourly rate
                </div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: 'var(--fg-1)',
                    marginTop: 4,
                  }}
                >
                  {formatPrice(Math.round(profile.hourly_rate * 100), {
                    currency: 'gbp',
                  })}
                  <span
                    style={{
                      fontSize: 13,
                      color: 'var(--fg-4)',
                      fontWeight: 500,
                    }}
                  >
                    {' '}
                    /hr
                  </span>
                </div>
              </div>
            )}
          </div>

          {profile.overview && (
            <div
              style={{
                marginTop: 24,
                paddingTop: 20,
                borderTop: '1px solid var(--border-2)',
              }}
            >
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: 'var(--fg-1)',
                  margin: 0,
                  marginBottom: 8,
                }}
              >
                About
              </h3>
              <p
                style={{
                  fontSize: 15,
                  color: 'var(--fg-3)',
                  margin: 0,
                  lineHeight: 1.7,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {profile.overview}
              </p>
            </div>
          )}
        </Card>

        <div className="vj-two-col">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {portfolios.length > 0 && (
              <Card padding={24}>
                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: 'var(--fg-1)',
                    margin: 0,
                    marginBottom: 16,
                  }}
                >
                  Portfolio
                </h3>
                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                  }}
                >
                  {portfolios.map((p) => (
                    <li key={p.id}>
                      <h4
                        style={{
                          fontSize: 15,
                          fontWeight: 600,
                          color: 'var(--fg-1)',
                          margin: 0,
                          marginBottom: 4,
                        }}
                      >
                        {p.title}
                      </h4>
                      {p.description && (
                        <p
                          style={{
                            fontSize: 14,
                            color: 'var(--fg-3)',
                            margin: 0,
                            lineHeight: 1.6,
                          }}
                        >
                          {p.description}
                        </p>
                      )}
                      {p.project_url && (
                        <a
                          href={p.project_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 13,
                            color: 'var(--brand)',
                            textDecoration: 'none',
                            marginTop: 4,
                          }}
                        >
                          View project <Icon name="arrowUpRight" size={12} />
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {experiences.length > 0 && (
              <Card padding={24}>
                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: 'var(--fg-1)',
                    margin: 0,
                    marginBottom: 16,
                  }}
                >
                  Experience
                </h3>
                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                  }}
                >
                  {experiences.map((e) => (
                    <li
                      key={e.id}
                      style={{
                        paddingLeft: 14,
                        borderLeft: '3px solid var(--border-2)',
                      }}
                    >
                      <div style={{ fontSize: 12, color: 'var(--fg-4)' }}>
                        {expPeriod(e)}
                      </div>
                      <h4
                        style={{
                          fontSize: 15,
                          fontWeight: 600,
                          color: 'var(--fg-1)',
                          margin: '4px 0 0',
                        }}
                      >
                        {e.job_title}
                        {e.company ? ` · ${e.company}` : ''}
                      </h4>
                      {e.description && (
                        <p
                          style={{
                            fontSize: 14,
                            color: 'var(--fg-3)',
                            margin: '6px 0 0',
                            lineHeight: 1.6,
                          }}
                        >
                          {e.description}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {educations.length > 0 && (
              <Card padding={24}>
                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: 'var(--fg-1)',
                    margin: 0,
                    marginBottom: 16,
                  }}
                >
                  Education
                </h3>
                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                  }}
                >
                  {educations.map((e) => (
                    <li
                      key={e.id}
                      style={{
                        paddingLeft: 14,
                        borderLeft: '3px solid var(--border-2)',
                      }}
                    >
                      <div style={{ fontSize: 12, color: 'var(--fg-4)' }}>
                        {eduPeriod(e)}
                      </div>
                      <h4
                        style={{
                          fontSize: 15,
                          fontWeight: 600,
                          color: 'var(--fg-1)',
                          margin: '4px 0 0',
                        }}
                      >
                        {e.institution_name}
                        {e.degree ? ` — ${e.degree}` : ''}
                        {e.field_of_study ? `, ${e.field_of_study}` : ''}
                      </h4>
                      {e.description && (
                        <p
                          style={{
                            fontSize: 14,
                            color: 'var(--fg-3)',
                            margin: '6px 0 0',
                            lineHeight: 1.6,
                          }}
                        >
                          {e.description}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            <UserReviewsSection userId={userIdNum} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {skills.length > 0 && (
              <Card padding={20}>
                <h4
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: 'var(--fg-1)',
                    margin: 0,
                    marginBottom: 12,
                  }}
                >
                  Skills
                </h4>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {skills.map((s) => (
                    <Badge key={s} tone="neutral" dot={false}>
                      {s}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}

            {languages.length > 0 && (
              <Card padding={20}>
                <h4
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: 'var(--fg-1)',
                    margin: 0,
                    marginBottom: 12,
                  }}
                >
                  Languages
                </h4>
                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  {languages.map((l, i) => {
                    const lang = l.language ?? l.name ?? '';
                    if (!lang) return null;
                    return (
                      <li
                        key={`${lang}-${i}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: 14,
                          color: 'var(--fg-2)',
                        }}
                      >
                        <span>{lang}</span>
                        {l.level && (
                          <span
                            style={{
                              fontSize: 12,
                              color: 'var(--fg-4)',
                            }}
                          >
                            {l.level}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </Card>
            )}
          </div>
        </div>
      </div>
    </ServicesShell>
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
