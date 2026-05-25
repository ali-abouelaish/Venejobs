import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
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

/**
 * GET /api/freelancer/:userId/profile — public read of a freelancer's
 * profile by user_id. Only returns rows where profile_completed=true.
 * Response is shaped to match what the legacy Express endpoint returned
 * so /client/FreelancerProfile/[id] keeps working unchanged.
 */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ userId: string }> },
): Promise<NextResponse> {
  const { userId } = await context.params;
  const userIdNum = Number(userId);
  if (!Number.isInteger(userIdNum) || userIdNum <= 0) {
    return NextResponse.json(
      { success: false, message: 'Invalid userId' },
      { status: 400 },
    );
  }

  const [profileRow] = await db
    .select()
    .from(freelancerProfiles)
    .where(
      and(
        eq(freelancerProfiles.userId, userIdNum),
        eq(freelancerProfiles.profileCompleted, true),
      ),
    );

  if (!profileRow) {
    return NextResponse.json(
      { success: false, message: 'Freelancer profile not found' },
      { status: 404 },
    );
  }

  const [userRow] = await db
    .select({
      id: users.id,
      name: users.name,
      profile_picture: users.profilePicture,
    })
    .from(users)
    .where(eq(users.id, userIdNum));

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
    success: true,
    profile: {
      id: profileRow.id,
      professional_title: profileRow.professionalTitle,
      overview: profileRow.overview,
      hourly_rate: profileRow.hourlyRate,
      country: profileRow.country,
      city: profileRow.city,
      User: userRow ?? null,
      skills: skills.map((s) => ({
        id: s.id,
        skill_name: s.skillName,
        name: s.skillName,
        level: s.level,
      })),
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
        name: l.language,
        proficiency: l.proficiency,
        level: l.proficiency,
      })),
      portfolios: portfolios.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        project_url: p.projectUrl,
      })),
    },
  });
}
