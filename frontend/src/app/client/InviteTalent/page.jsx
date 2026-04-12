
import InviteWrapper from "@/app/components/Client/InviteTalent/InviteWrapper";
import LeftPanel from "@/app/components/Client/InviteTalent/LeftPanel";
import RightPanel from "@/app/components/Client/InviteTalent/RightPanel";
import ClientLayout from "@/app/layout/ClientLayout";

export default function page() {
  
  return (
    <ClientLayout>
      <InviteWrapper>
       <LeftPanel/>

        <RightPanel/>
      </InviteWrapper>
    </ClientLayout>
  );
}
