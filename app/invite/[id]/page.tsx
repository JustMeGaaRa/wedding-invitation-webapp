import { getGuestById } from "@/lib/guests";
import { getQuestionnaire } from "@/lib/questionnaire";
import WeddingApp from "@/app/WeddingApp";
import { redirect } from "next/navigation";
import { getRSVP } from "@/lib/airtable";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function InvitePage({ params }: PageProps) {
  const { id } = await params;
  const guest = getGuestById(id);

  if (!guest) {
    redirect('/invite/not-found');
  }

  const questionnaire = getQuestionnaire();

  const existingRSVP = await getRSVP(id);
  
  // Map Airtable fields back to answers state
  const initialAnswers: Record<number, string> = {};
  if (existingRSVP) {
    questionnaire.forEach((q, idx) => {
      const answer = existingRSVP.fields[q.id];
      if (answer) {
        initialAnswers[idx] = answer as string;
      }
    });
  }

  return <WeddingApp 
    guestName={guest.name} 
    inviteId={guest.id} 
    questions={questionnaire}
    initialAnswers={initialAnswers}
  />;
}
