import BillingWrapper from "@/app/components/Client/BillingMethod/BillingWrapper";
import LeftPanel from "@/app/components/Client/BillingMethod/LeftPanel";
import RightPanel from "@/app/components/Client/BillingMethod/RightPanel";
import ClientLayout from "@/app/layout/ClientLayout";

export default function page() {
  return (
    <>
      <ClientLayout>
        <BillingWrapper>
          <LeftPanel />

          <RightPanel />
        </BillingWrapper>
      </ClientLayout>
    </>
  );
}
