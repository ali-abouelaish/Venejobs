'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  useForm,
  useFieldArray,
  type SubmitHandler,
} from 'react-hook-form';
import axios from 'axios';
import useToastStore from '@/app/store/toastStore';

type Experience = {
  job_title: string;
  company: string;
  location?: string | null;
  city?: string | null;
  start_month: string;
  start_year: number | string;
  end_month?: string | null;
  end_year?: number | string | null;
  is_current: boolean;
  description?: string | null;
};

type Education = {
  institution_name: string;
  degree?: string | null;
  field_of_study?: string | null;
  type_of_education?: string | null;
  start_date: string;
  end_date?: string | null;
  description?: string | null;
};

type Language = { language: string; proficiency?: string | null };
type Portfolio = {
  title: string;
  description?: string | null;
  project_url?: string | null;
};
type Skill = { name: string; level?: string | null };

type FormShape = {
  professional_title: string;
  overview?: string | null;
  hourly_rate?: number | string | null;
  phone?: string | null;
  date_of_birth?: string | null;
  street_address?: string | null;
  apt_suite?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  country?: string | null;
  category?: string | null;
  skills: Skill[];
  experiences: Experience[];
  educations: Education[];
  languages: Language[];
  portfolios: Portfolio[];
};

const PROFICIENCIES = ['Basic', 'Conversational', 'Fluent', 'Native'] as const;
const MONTHS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 60 }, (_, i) => String(CURRENT_YEAR - i));

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? '';

type CategoryOption = { code: string; name: string };
type SkillOption = { id: number | string; name: string };

export default function EditForm() {
  const router = useRouter();
  const { showSuccess, showError } = useToastStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [skillsOptions, setSkillsOptions] = useState<SkillOption[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormShape>({
    mode: 'onSubmit',
    defaultValues: {
      professional_title: '',
      overview: '',
      hourly_rate: '',
      phone: '',
      date_of_birth: '',
      street_address: '',
      apt_suite: '',
      city: '',
      state: '',
      zip_code: '',
      country: '',
      category: '',
      skills: [],
      experiences: [],
      educations: [],
      languages: [],
      portfolios: [],
    },
  });

  const expFA = useFieldArray({ control, name: 'experiences' });
  const eduFA = useFieldArray({ control, name: 'educations' });
  const langFA = useFieldArray({ control, name: 'languages' });
  const portFA = useFieldArray({ control, name: 'portfolios' });

  const selectedCategory = watch('category');
  const selectedSkills = watch('skills') ?? [];

  // Initial load: existing profile + category list (parallel).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [profileRes, catRes] = await Promise.all([
          fetch('/api/freelancer/profile', { credentials: 'include' }),
          axios
            .get(`${BASE_URL}api/lookup/categories`)
            .then((r) => r.data)
            .catch(() => ({ data: [] })),
        ]);
        if (cancelled) return;

        if (catRes?.data && Array.isArray(catRes.data)) {
          setCategories(catRes.data);
        }

        if (!profileRes.ok) {
          if (profileRes.status === 401) {
            showError('Not signed in', 'Please sign in again');
            router.push('/auth/signin/');
            return;
          }
          throw new Error(`HTTP ${profileRes.status}`);
        }
        const profileJson = await profileRes.json();
        const p = profileJson.profile;
        const u = profileJson.user;

        reset({
          professional_title: p?.professional_title ?? '',
          overview: p?.overview ?? '',
          hourly_rate: p?.hourly_rate ?? '',
          phone: u?.phone ?? '',
          date_of_birth: u?.date_of_birth
            ? String(u.date_of_birth).slice(0, 10)
            : '',
          street_address: u?.street_address ?? '',
          apt_suite: u?.apt_suite ?? '',
          city: u?.city ?? p?.city ?? '',
          state: u?.state ?? '',
          zip_code: u?.zip_code ?? '',
          country: u?.country ?? p?.country ?? '',
          category: '',
          skills: (profileJson.skills ?? []).map((s: { name: string; level?: string }) => ({
            name: s.name,
            level: s.level ?? null,
          })),
          experiences: profileJson.experiences ?? [],
          educations: (profileJson.educations ?? []).map((e: Education) => ({
            ...e,
            start_date: e.start_date ? String(e.start_date).slice(0, 4) : '',
            end_date: e.end_date ? String(e.end_date).slice(0, 4) : '',
          })),
          languages: profileJson.languages ?? [],
          portfolios: profileJson.portfolios ?? [],
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load';
        showError('Could not load profile', msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When category changes, load skills for that category.
  useEffect(() => {
    let cancelled = false;
    if (!selectedCategory) {
      setSkillsOptions([]);
      return;
    }
    setSkillsLoading(true);
    axios
      .get(`${BASE_URL}api/lookup/skills?category=${encodeURIComponent(selectedCategory)}`)
      .then((r) => {
        if (cancelled) return;
        const arr = Array.isArray(r.data?.data) ? r.data.data : [];
        setSkillsOptions(arr);
      })
      .catch(() => {
        if (!cancelled) setSkillsOptions([]);
      })
      .finally(() => {
        if (!cancelled) setSkillsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedCategory]);

  const selectedSkillNames = useMemo(
    () => new Set(selectedSkills.map((s) => s.name)),
    [selectedSkills],
  );

  const toggleSkill = (name: string) => {
    if (selectedSkillNames.has(name)) {
      setValue(
        'skills',
        selectedSkills.filter((s) => s.name !== name),
        { shouldDirty: true },
      );
    } else {
      setValue(
        'skills',
        [...selectedSkills, { name, level: 'Intermediate' }],
        { shouldDirty: true },
      );
    }
  };

  const onSubmit: SubmitHandler<FormShape> = async (data) => {
    setSaving(true);
    try {
      const body = {
        ...data,
        hourly_rate:
          data.hourly_rate === '' || data.hourly_rate == null
            ? null
            : Number(data.hourly_rate),
        experiences: data.experiences.map((e) => ({
          ...e,
          start_year: Number(e.start_year),
          end_year:
            e.is_current || e.end_year === '' || e.end_year == null
              ? null
              : Number(e.end_year),
          end_month: e.is_current ? null : e.end_month || null,
        })),
      };

      const res = await fetch('/api/freelancer/profile', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success === false) {
        const issueMsg =
          json?.issues && Array.isArray(json.issues) && json.issues[0]
            ? `${json.issues[0].path?.join('.') ?? 'field'}: ${json.issues[0].message}`
            : json?.error || json?.message || `HTTP ${res.status}`;
        showError('Save failed', issueMsg);
        return;
      }
      showSuccess('Profile saved', 'Your changes are live');
      // Full page navigation: the legacy /freelancer/profileData page
      // reads from a Zustand store that caches the GET response and
      // skips refetching when it has any data — router.push would show
      // stale state. window.location forces a fresh load.
      setTimeout(() => {
        window.location.href = '/freelancer/profileData';
      }, 400);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      showError('Save failed', msg);
    } finally {
      setSaving(false);
    }
  };

  const onInvalid = (formErrors: typeof errors) => {
    const firstField = Object.keys(formErrors)[0];
    const fieldErr = formErrors[firstField as keyof FormShape] as
      | { message?: string }
      | undefined;
    showError(
      'Please fix form errors',
      fieldErr?.message || `Check the "${firstField}" field`,
    );
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-gray-500">Loading profile…</div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit, onInvalid)}
      className="flex flex-col gap-8"
    >
      <header className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-heading">
            Edit your freelancer profile
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            All sections are optional except your professional title. Changes
            replace your existing profile when you save.
          </p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 bg-secondary text-white rounded-lg font-semibold hover:bg-secondary/90 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {saving ? 'Saving…' : 'Save Profile'}
        </button>
      </header>

      {/* ===== Title + Overview + Rate ===== */}
      <Section title="Basics">
        <Field label="Professional title" required error={errors.professional_title?.message}>
          <input
            type="text"
            placeholder="e.g. Senior React Developer"
            className={inputCls}
            {...register('professional_title', {
              required: 'Professional title is required',
              minLength: { value: 5, message: 'Title should be at least 5 characters' },
              maxLength: { value: 255, message: 'Title is too long' },
            })}
          />
        </Field>
        <Field label="Overview / short bio">
          <textarea
            rows={4}
            placeholder="Tell clients what you do and how you can help them."
            className={textareaCls}
            {...register('overview')}
          />
        </Field>
        <Field label="Hourly rate (GBP)">
          <input
            type="number"
            min={0}
            step="0.5"
            placeholder="e.g. 35"
            className={inputCls}
            {...register('hourly_rate')}
          />
        </Field>
      </Section>

      {/* ===== Personal details ===== */}
      <Section title="Personal details">
        <Grid>
          <Field label="Phone">
            <input
              type="tel"
              placeholder="+44 7…"
              className={inputCls}
              {...register('phone')}
            />
          </Field>
          <Field label="Date of birth">
            <input type="date" className={inputCls} {...register('date_of_birth')} />
          </Field>
          <Field label="Street address">
            <input type="text" className={inputCls} {...register('street_address')} />
          </Field>
          <Field label="Apt / Suite">
            <input type="text" className={inputCls} {...register('apt_suite')} />
          </Field>
          <Field label="City">
            <input type="text" className={inputCls} {...register('city')} />
          </Field>
          <Field label="State / Region">
            <input type="text" className={inputCls} {...register('state')} />
          </Field>
          <Field label="Country">
            <input type="text" className={inputCls} {...register('country')} />
          </Field>
          <Field label="Zip / Postcode">
            <input type="text" className={inputCls} {...register('zip_code')} />
          </Field>
        </Grid>
      </Section>

      {/* ===== Category + Skills ===== */}
      <Section title="Skills">
        <Field label="Category">
          <select className={inputCls} {...register('category')}>
            <option value="">Select a category to load skills</option>
            {categories.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>

        {selectedSkills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedSkills.map((s) => (
              <span
                key={s.name}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-secondary text-white rounded-full text-sm"
              >
                {s.name}
                <button
                  type="button"
                  onClick={() => toggleSkill(s.name)}
                  className="text-white/80 hover:text-white cursor-pointer"
                  aria-label={`Remove ${s.name}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {selectedCategory ? (
          skillsLoading ? (
            <p className="text-sm text-gray-500">Loading skills…</p>
          ) : skillsOptions.length === 0 ? (
            <p className="text-sm text-gray-500">No skills found for this category.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {skillsOptions.map((opt) => {
                const active = selectedSkillNames.has(opt.name);
                return (
                  <button
                    type="button"
                    key={opt.id}
                    onClick={() => toggleSkill(opt.name)}
                    className={`px-3 py-1.5 rounded-full text-sm border cursor-pointer transition ${
                      active
                        ? 'bg-secondary text-white border-secondary'
                        : 'bg-white text-heading border-gray-300 hover:border-secondary'
                    }`}
                  >
                    {opt.name}
                  </button>
                );
              })}
            </div>
          )
        ) : (
          <p className="text-sm text-gray-500">
            Pick a category above to browse popular skills, or your saved skills
            stay attached even without picking a category.
          </p>
        )}
      </Section>

      {/* ===== Experience ===== */}
      <Section
        title="Work experience"
        action={
          <AddButton
            onClick={() =>
              expFA.append({
                job_title: '',
                company: '',
                location: '',
                city: '',
                start_month: '1',
                start_year: String(CURRENT_YEAR),
                end_month: '',
                end_year: '',
                is_current: false,
                description: '',
              })
            }
            label="Add experience"
          />
        }
      >
        {expFA.fields.length === 0 ? (
          <EmptyHint text="No work experience added yet." />
        ) : (
          expFA.fields.map((field, idx) => {
            const isCurrent = watch(`experiences.${idx}.is_current`);
            return (
              <EntryCard key={field.id} onRemove={() => expFA.remove(idx)}>
                <Grid>
                  <Field
                    label="Job title"
                    required
                    error={errors.experiences?.[idx]?.job_title?.message}
                  >
                    <input
                      type="text"
                      className={inputCls}
                      {...register(`experiences.${idx}.job_title`, {
                        required: 'Job title required',
                      })}
                    />
                  </Field>
                  <Field
                    label="Company"
                    required
                    error={errors.experiences?.[idx]?.company?.message}
                  >
                    <input
                      type="text"
                      className={inputCls}
                      {...register(`experiences.${idx}.company`, {
                        required: 'Company required',
                      })}
                    />
                  </Field>
                  <Field label="Location">
                    <input
                      type="text"
                      className={inputCls}
                      {...register(`experiences.${idx}.location`)}
                    />
                  </Field>
                  <Field label="City">
                    <input
                      type="text"
                      className={inputCls}
                      {...register(`experiences.${idx}.city`)}
                    />
                  </Field>
                  <Field label="Start month">
                    <select
                      className={inputCls}
                      {...register(`experiences.${idx}.start_month`)}
                    >
                      {MONTHS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Start year">
                    <select
                      className={inputCls}
                      {...register(`experiences.${idx}.start_year`)}
                    >
                      {YEARS.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="End month">
                    <select
                      className={inputCls}
                      disabled={isCurrent}
                      {...register(`experiences.${idx}.end_month`)}
                    >
                      <option value="">--</option>
                      {MONTHS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="End year">
                    <select
                      className={inputCls}
                      disabled={isCurrent}
                      {...register(`experiences.${idx}.end_year`)}
                    >
                      <option value="">--</option>
                      {YEARS.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </Field>
                </Grid>
                <label className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    {...register(`experiences.${idx}.is_current`)}
                  />
                  <span className="text-sm">I currently work here</span>
                </label>
                <Field label="Description">
                  <textarea
                    rows={3}
                    className={textareaCls}
                    {...register(`experiences.${idx}.description`)}
                  />
                </Field>
              </EntryCard>
            );
          })
        )}
      </Section>

      {/* ===== Education ===== */}
      <Section
        title="Education"
        action={
          <AddButton
            onClick={() =>
              eduFA.append({
                institution_name: '',
                degree: '',
                field_of_study: '',
                type_of_education: '',
                start_date: String(CURRENT_YEAR),
                end_date: '',
                description: '',
              })
            }
            label="Add education"
          />
        }
      >
        {eduFA.fields.length === 0 ? (
          <EmptyHint text="No education added yet." />
        ) : (
          eduFA.fields.map((field, idx) => (
            <EntryCard key={field.id} onRemove={() => eduFA.remove(idx)}>
              <Grid>
                <Field
                  label="Institution"
                  required
                  error={errors.educations?.[idx]?.institution_name?.message}
                >
                  <input
                    type="text"
                    className={inputCls}
                    {...register(`educations.${idx}.institution_name`, {
                      required: 'Institution required',
                    })}
                  />
                </Field>
                <Field label="Degree">
                  <input
                    type="text"
                    className={inputCls}
                    {...register(`educations.${idx}.degree`)}
                  />
                </Field>
                <Field label="Field of study">
                  <input
                    type="text"
                    className={inputCls}
                    {...register(`educations.${idx}.field_of_study`)}
                  />
                </Field>
                <Field label="Type">
                  <input
                    type="text"
                    placeholder="e.g. Bachelor's"
                    className={inputCls}
                    {...register(`educations.${idx}.type_of_education`)}
                  />
                </Field>
                <Field label="Start year" required>
                  <select
                    className={inputCls}
                    {...register(`educations.${idx}.start_date`, {
                      required: 'Start year required',
                    })}
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="End year">
                  <select
                    className={inputCls}
                    {...register(`educations.${idx}.end_date`)}
                  >
                    <option value="">--</option>
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </Field>
              </Grid>
              <Field label="Description">
                <textarea
                  rows={3}
                  className={textareaCls}
                  {...register(`educations.${idx}.description`)}
                />
              </Field>
            </EntryCard>
          ))
        )}
      </Section>

      {/* ===== Portfolio ===== */}
      <Section
        title="Portfolio"
        action={
          <AddButton
            onClick={() =>
              portFA.append({ title: '', description: '', project_url: '' })
            }
            label="Add portfolio entry"
          />
        }
      >
        {portFA.fields.length === 0 ? (
          <EmptyHint text="No portfolio entries yet." />
        ) : (
          portFA.fields.map((field, idx) => (
            <EntryCard key={field.id} onRemove={() => portFA.remove(idx)}>
              <Grid>
                <Field
                  label="Project title"
                  required
                  error={errors.portfolios?.[idx]?.title?.message}
                >
                  <input
                    type="text"
                    className={inputCls}
                    {...register(`portfolios.${idx}.title`, {
                      required: 'Title required',
                    })}
                  />
                </Field>
                <Field label="Project URL">
                  <input
                    type="url"
                    placeholder="https://…"
                    className={inputCls}
                    {...register(`portfolios.${idx}.project_url`)}
                  />
                </Field>
              </Grid>
              <Field label="Description">
                <textarea
                  rows={3}
                  className={textareaCls}
                  {...register(`portfolios.${idx}.description`)}
                />
              </Field>
            </EntryCard>
          ))
        )}
      </Section>

      {/* ===== Languages ===== */}
      <Section
        title="Languages"
        action={
          <AddButton
            onClick={() => langFA.append({ language: '', proficiency: 'Conversational' })}
            label="Add language"
          />
        }
      >
        {langFA.fields.length === 0 ? (
          <EmptyHint text="No languages added yet." />
        ) : (
          langFA.fields.map((field, idx) => (
            <EntryCard key={field.id} onRemove={() => langFA.remove(idx)}>
              <Grid>
                <Field
                  label="Language"
                  required
                  error={errors.languages?.[idx]?.language?.message}
                >
                  <input
                    type="text"
                    className={inputCls}
                    {...register(`languages.${idx}.language`, {
                      required: 'Language required',
                    })}
                  />
                </Field>
                <Field label="Proficiency">
                  <select
                    className={inputCls}
                    {...register(`languages.${idx}.proficiency`)}
                  >
                    {PROFICIENCIES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </Field>
              </Grid>
            </EntryCard>
          ))
        )}
      </Section>

      {/* footer save */}
      <div className="flex justify-end pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={saving}
          className="px-8 py-3 bg-secondary text-white rounded-lg font-semibold hover:bg-secondary/90 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {saving ? 'Saving…' : 'Save Profile'}
        </button>
      </div>
    </form>
  );
}

/* ============ tiny presentational helpers ============ */

const inputCls =
  'w-full py-2.5 px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-secondary text-heading';
const textareaCls =
  'w-full py-2.5 px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-secondary text-heading resize-y';

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-gray-200 rounded-2xl p-5 lg:p-7 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg lg:text-xl font-bold text-heading">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-heading">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
      {error ? <span className="text-xs text-red-500">{error}</span> : null}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
      {children}
    </div>
  );
}

function EntryCard({
  children,
  onRemove,
}: {
  children: React.ReactNode;
  onRemove: () => void;
}) {
  return (
    <div className="border border-gray-200 rounded-xl p-4 flex flex-col gap-4 bg-[#FAFAFA]">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onRemove}
          className="text-xs text-red-500 hover:text-red-600 font-medium cursor-pointer"
        >
          Remove
        </button>
      </div>
      {children}
    </div>
  );
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-4 py-2 text-sm border border-secondary text-secondary rounded-md hover:bg-secondary hover:text-white transition cursor-pointer"
    >
      + {label}
    </button>
  );
}

function EmptyHint({ text }: { text: string }) {
  return <p className="text-sm text-gray-500">{text}</p>;
}
