import FreelancerLayout from '@/app/layout/FreelancerLayout';
import EditForm from './EditForm';

export const dynamic = 'force-dynamic';

export default function FreelancerProfileEditPage() {
  return (
    <FreelancerLayout>
      <div className="w-full max-w-[90%] sm:max-w-[540px] md:max-w-[720px] lg:max-w-[960px] xl:max-w-[1100px] mx-auto my-10 lg:my-12">
        <EditForm />
      </div>
    </FreelancerLayout>
  );
}
