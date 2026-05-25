import ClientProfileLayout from "@/app/layout/ClientProfileLayout";
import ClientInfoEditor from "./ClientInfoEditor";

export const dynamic = "force-dynamic";

export default function Info() {
  return (
    <ClientProfileLayout>
      <ClientInfoEditor />
    </ClientProfileLayout>
  );
}
