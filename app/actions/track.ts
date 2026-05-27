'use server'

import { trackOpen } from "@/lib/airtable";
import { getGuestById } from "@/lib/guests";

export async function trackInviteOpen(invitationId: string) {
    const guest = getGuestById(invitationId);
    if (!guest) return;
    await trackOpen(invitationId, guest.name);
}
