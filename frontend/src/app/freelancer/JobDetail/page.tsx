import { Suspense } from 'react';
import FreelancerLayout from '@/app/layout/FreelancerLayout';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db';
import { getMyProposalForJob, getJobProposalCount, type MyProposalForJob } from '@/lib/proposals';
import JobDetailView, { type JobDetailData } from './JobDetailView';

export const dynamic = 'force-dynamic';

interface JobRow {
  id: number;
  client_id: number;
  title: string;
  description: string;
  category: string | null;
  skills: string[] | null;
  project_size: string | null;
  duration: string | null;
  experience_level: string | null;
  budget_type: string | null;
  budget_amount: number | null;
  attachment: string | null;
  status: string;
  created_at: string;
}

interface ClientRow {
  id: number;
  name: string;
  profile_picture: string | null;
  city: string | null;
  country: string | null;
  created_at: string;
  jobs_posted: string;
}

async function fetchJobDetail(jobId: number, userId: number | null): Promise<JobDetailData | null> {
  const jobRows = await sql<JobRow[]>`
    SELECT id, client_id, title, description, category, skills,
           project_size, duration, experience_level,
           budget_type, budget_amount, attachment, status, created_at
    FROM jobs WHERE id = ${jobId} LIMIT 1
  `;
  const job = jobRows[0];
  if (!job) return null;

  const [clientRows, proposalCount, myProposal] = await Promise.all([
    sql<ClientRow[]>`
      SELECT
        u.id, u.name, u.profile_picture, u.city, u.country, u.created_at,
        (SELECT COUNT(*)::text FROM jobs j WHERE j.client_id = u.id) AS jobs_posted
      FROM users u WHERE u.id = ${job.client_id} LIMIT 1
    `,
    getJobProposalCount(jobId),
    userId ? getMyProposalForJob(userId, jobId) : Promise.resolve<MyProposalForJob | null>(null),
  ]);
  const client = clientRows[0] ?? null;

  const parsedSkills = Array.isArray(job.skills)
    ? job.skills
        .map((s) => {
          if (typeof s !== 'string') return s as { name: string; level?: string };
          try {
            const parsed = JSON.parse(s);
            return parsed as { name: string; level?: string };
          } catch {
            return { name: s };
          }
        })
        .filter((s) => s && s.name)
    : [];

  return {
    job: {
      id: job.id,
      clientId: job.client_id,
      title: job.title,
      description: job.description,
      category: job.category,
      skills: parsedSkills,
      projectSize: job.project_size,
      duration: job.duration,
      experienceLevel: job.experience_level,
      budgetType: job.budget_type,
      budgetAmount: job.budget_amount,
      attachment: job.attachment,
      status: job.status,
      createdAt: job.created_at,
    },
    client: client && {
      id: client.id,
      name: client.name,
      profilePicture: client.profile_picture,
      city: client.city,
      country: client.country,
      createdAt: client.created_at,
      jobsPosted: Number(client.jobs_posted ?? '0'),
    },
    proposalCount,
    myProposal,
    viewerId: userId,
  };
}

async function JobDetailLoader({ id }: { id: string | undefined }) {
  const jobId = Number(id);
  if (!id || !Number.isFinite(jobId)) return <NotFound />;

  const session = await auth();
  const userId = session?.user?.id ?? null;

  const data = await fetchJobDetail(jobId, userId);
  if (!data) return <NotFound />;

  return <JobDetailView data={data} />;
}

function NotFound() {
  return (
    <div className="max-w-[1200px] mx-auto px-6 my-20 text-center">
      <h2 className="text-2xl font-semibold text-heading">Job not found</h2>
      <p className="text-paragraph mt-2">This job may have been removed or does not exist.</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="max-w-[1200px] mx-auto px-6 my-20 text-center text-paragraph">
      Loading job details…
    </div>
  );
}

export default async function JobDetailPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  return (
    <FreelancerLayout>
      <div className="bg-slate-50 min-h-[calc(100vh-76px)] py-8">
        <Suspense fallback={<LoadingState />}>
          <JobDetailLoader id={id} />
        </Suspense>
      </div>
    </FreelancerLayout>
  );
}
