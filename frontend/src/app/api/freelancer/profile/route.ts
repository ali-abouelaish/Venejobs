import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/drizzle';
import {
  users,
  freelancerProfiles,
  freelancerSkills,
  freelancerExperiences,
  freelancerEducations,
  freelancerLanguages,
  freelancerPortfolios,
} from '@/lib/db/schema';

// Coerce a 4-digit year string into a Postgres-parseable timestamp.
// Education start_date/end_date columns are `timestamp` but the form
// only collects a year — pad to Jan 1 so Postgres accepts the value.
function yearToDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  if (/^\d{4}$/.test(trimmed)) return `${trimmed}-01-01`;
  return trimmed;
}

const ExperienceSchema = z.object({
  job_title: z.string().trim().min(1),
  company: z.string().trim().min(1),
  location: z.string().trim().optional().nullable(),
  city: z.string().trim().optional().nullable(),
  start_month: z.coerce.string().min(1),
  start_year: z.coerce.number().int().min(1900).max(2200),
  end_month: z.coerce.string().optional().nullable(),
  end_year: z.coerce.number().int().min(1900).max(2200).optional().nullable(),
  is_current: z.boolean().default(false),
  description: z.string().optional().nullable(),
});

const EducationSchema = z.object({
  institution_name: z.string().trim().min(1),
  degree: z.string().trim().optional().nullable(),
  field_of_study: z.string().trim().optional().nullable(),
  type_of_education: z.string().trim().optional().nullable(),
  start_date: z.coerce.string().min(1),
  end_date: z.coerce.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

const LanguageSchema = z.object({
  language: z.string().trim().min(1),
  proficiency: z.string().trim().optional().nullable(),
});

const PortfolioSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().optional().nullable(),
  project_url: z.string().trim().optional().nullable(),
});

const SkillSchema = z.object({
  name: z.string().trim().min(1),
  level: z.string().trim().optional().nullable(),
});

const ProfileSchema = z.object({
  professional_title: z.string().trim().min(1).max(255),
  overview: z.string().optional().nullable(),
  hourly_rate: z.coerce.number().nonnegative().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  // user-level fields
  phone: z.string().optional().nullable(),
  date_of_birth: z.string().optional().nullable(),
  street_address: z.string().optional().nullable(),
  apt_suite: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zip_code: z.string().optional().nullable(),
  // arrays
  skills: z.array(SkillSchema).default([]),
  experiences: z.array(ExperienceSchema).default([]),
  educations: z.array(EducationSchema).default([]),
  languages: z.array(LanguageSchema).default([]),
  portfolios: z.array(PortfolioSchema).default([]),
});

/** GET /api/freelancer/profile — load the authenticated user's profile. */
export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  const [userRow] = await db
    .select({
      id: users.id,
      name: users.name,
      lastname: users.lastname,
      email: users.email,
      phone: users.phone,
      profile_picture: users.profilePicture,
      date_of_birth: users.dateOfBirth,
      street_address: users.streetAddress,
      apt_suite: users.aptSuite,
      city: users.city,
      state: users.state,
      zip_code: users.zipCode,
      country: users.country,
    })
    .from(users)
    .where(eq(users.id, userId));

  const [profileRow] = await db
    .select()
    .from(freelancerProfiles)
    .where(eq(freelancerProfiles.userId, userId));

  if (!profileRow) {
    return NextResponse.json({
      user: userRow ?? null,
      profile: null,
      skills: [],
      experiences: [],
      educations: [],
      languages: [],
      portfolios: [],
    });
  }

  const freelancerId = profileRow.id;

  const [skills, experiences, educations, languages, portfolios] =
    await Promise.all([
      db.select().from(freelancerSkills).where(eq(freelancerSkills.freelancerId, freelancerId)),
      db.select().from(freelancerExperiences).where(eq(freelancerExperiences.freelancerId, freelancerId)),
      db.select().from(freelancerEducations).where(eq(freelancerEducations.freelancerId, freelancerId)),
      db.select().from(freelancerLanguages).where(eq(freelancerLanguages.freelancerId, freelancerId)),
      db.select().from(freelancerPortfolios).where(eq(freelancerPortfolios.freelancerId, freelancerId)),
    ]);

  return NextResponse.json({
    user: userRow ?? null,
    profile: {
      id: profileRow.id,
      professional_title: profileRow.professionalTitle,
      overview: profileRow.overview,
      hourly_rate: profileRow.hourlyRate,
      country: profileRow.country,
      city: profileRow.city,
      profile_completed: profileRow.profileCompleted,
    },
    skills: skills.map((s) => ({ id: s.id, name: s.skillName, level: s.level })),
    experiences: experiences.map((e) => ({
      id: e.id,
      job_title: e.jobTitle,
      company: e.company,
      location: e.location,
      city: e.city,
      start_month: e.startMonth,
      start_year: e.startYear,
      end_month: e.endMonth,
      end_year: e.endYear,
      is_current: e.isCurrent,
      description: e.description,
    })),
    educations: educations.map((e) => ({
      id: e.id,
      institution_name: e.institutionName,
      degree: e.degree,
      field_of_study: e.fieldOfStudy,
      type_of_education: e.typeOfEducation,
      start_date: e.startDate,
      end_date: e.endDate,
      description: e.description,
    })),
    languages: languages.map((l) => ({
      id: l.id,
      language: l.language,
      proficiency: l.proficiency,
    })),
    portfolios: portfolios.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      project_url: p.projectUrl,
    })),
  });
}

/**
 * PUT /api/freelancer/profile — atomic replace of the authenticated user's
 * profile. Updates the User row, upserts the FreelancerProfile, then
 * destroy+recreates each child collection inside a single transaction.
 * Always flips profile_completed → true on success.
 */
export async function PUT(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  const body = await req.json().catch(() => null);
  const parsed = ProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const data = parsed.data;

  // Date-of-birth: accept ISO strings or YYYY-MM-DD; null clears.
  let dob: string | null = null;
  if (data.date_of_birth) {
    const parsedDob = new Date(data.date_of_birth);
    if (!isNaN(parsedDob.getTime())) dob = parsedDob.toISOString();
  }

  await db.transaction(async (tx) => {
    // 1) user-level fields
    await tx
      .update(users)
      .set({
        phone: data.phone ?? null,
        dateOfBirth: dob,
        streetAddress: data.street_address ?? null,
        aptSuite: data.apt_suite ?? null,
        city: data.city ?? null,
        state: data.state ?? null,
        zipCode: data.zip_code ?? null,
        country: data.country ?? null,
      })
      .where(eq(users.id, userId));

    // 2) upsert freelancer_profiles by user_id (unique)
    const [existing] = await tx
      .select({ id: freelancerProfiles.id })
      .from(freelancerProfiles)
      .where(eq(freelancerProfiles.userId, userId));

    let freelancerId: number;
    if (existing) {
      freelancerId = existing.id;
      await tx
        .update(freelancerProfiles)
        .set({
          professionalTitle: data.professional_title,
          overview: data.overview ?? null,
          hourlyRate: data.hourly_rate ?? null,
          city: data.city ?? null,
          country: data.country ?? null,
          profileCompleted: true,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(freelancerProfiles.id, existing.id));
    } else {
      const [created] = await tx
        .insert(freelancerProfiles)
        .values({
          userId,
          professionalTitle: data.professional_title,
          overview: data.overview ?? null,
          hourlyRate: data.hourly_rate ?? null,
          city: data.city ?? null,
          country: data.country ?? null,
          profileCompleted: true,
        })
        .returning({ id: freelancerProfiles.id });
      freelancerId = created.id;
    }

    // 3) child collections: destroy + bulk insert. Dedup by the unique
    // index keys to avoid 23505 errors if the form ever submits dupes.
    await tx.delete(freelancerSkills).where(eq(freelancerSkills.freelancerId, freelancerId));
    if (data.skills.length) {
      const seenSkills = new Set<string>();
      const rows = data.skills
        .filter((s) => {
          const key = s.name.toLowerCase();
          if (seenSkills.has(key)) return false;
          seenSkills.add(key);
          return true;
        })
        .map((s) => ({
          freelancerId,
          skillName: s.name,
          level: s.level ?? null,
        }));
      if (rows.length) await tx.insert(freelancerSkills).values(rows);
    }

    await tx.delete(freelancerExperiences).where(eq(freelancerExperiences.freelancerId, freelancerId));
    if (data.experiences.length) {
      await tx.insert(freelancerExperiences).values(
        data.experiences.map((e) => ({
          freelancerId,
          jobTitle: e.job_title,
          company: e.company,
          location: e.location ?? null,
          city: e.city ?? null,
          startMonth: String(e.start_month),
          startYear: e.start_year,
          endMonth: e.is_current ? null : (e.end_month ? String(e.end_month) : null),
          endYear: e.is_current ? null : (e.end_year ?? null),
          isCurrent: e.is_current,
          description: e.description ?? null,
        })),
      );
    }

    await tx.delete(freelancerEducations).where(eq(freelancerEducations.freelancerId, freelancerId));
    if (data.educations.length) {
      const seenEdu = new Set<string>();
      const rows = data.educations
        .map((e) => ({
          freelancerId,
          institutionName: e.institution_name,
          degree: e.degree ?? null,
          fieldOfStudy: e.field_of_study ?? null,
          typeOfEducation: e.type_of_education ?? null,
          startDate: yearToDate(e.start_date)!,
          endDate: yearToDate(e.end_date),
          description: e.description ?? null,
        }))
        .filter((row) => {
          // unique_freelancer_education: (freelancer_id, institution_name, start_date)
          const key = `${row.institutionName.toLowerCase()}|${row.startDate}`;
          if (seenEdu.has(key)) return false;
          seenEdu.add(key);
          return true;
        });
      if (rows.length) await tx.insert(freelancerEducations).values(rows);
    }

    await tx.delete(freelancerLanguages).where(eq(freelancerLanguages.freelancerId, freelancerId));
    if (data.languages.length) {
      await tx.insert(freelancerLanguages).values(
        data.languages.map((l) => ({
          freelancerId,
          language: l.language,
          proficiency: l.proficiency ?? null,
        })),
      );
    }

    await tx.delete(freelancerPortfolios).where(eq(freelancerPortfolios.freelancerId, freelancerId));
    if (data.portfolios.length) {
      await tx.insert(freelancerPortfolios).values(
        data.portfolios.map((p) => ({
          freelancerId,
          title: p.title,
          description: p.description ?? null,
          projectUrl: p.project_url ?? null,
        })),
      );
    }
  });

  return NextResponse.json({ success: true });
}
