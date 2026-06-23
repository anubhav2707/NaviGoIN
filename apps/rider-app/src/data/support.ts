import type { MaterialIcons } from '@expo/vector-icons';

export type SupportIssue = { q: string; a: string };

export type SupportTopic = {
  id: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  intro: string;
  issues: SupportIssue[];
};

// Catalog backing the Help & Support drill-down. Keep ids stable — screens
// reference topics by id through navigation params.
export const SUPPORT_TOPICS: SupportTopic[] = [
  {
    id: 'payments',
    icon: 'receipt-long',
    title: 'Payments & charges',
    intro: 'Issues with fares, refunds, receipts, or unexpected charges.',
    issues: [
      { q: 'I was charged the wrong fare', a: 'Open the trip from the Activity tab and tap "Fare breakdown". If the route or wait time looks wrong, use "Dispute fare" and our team will review it within 24 hours.' },
      { q: 'I was charged but no ride happened', a: 'Pre-authorisation holds are released automatically within 5–7 business days. If a completed charge has no matching trip, start a chat and we will refund it.' },
      { q: 'How do I get a GST invoice / receipt?', a: 'Every completed trip has a "Get receipt" option in Activity; the invoice is emailed to your registered address instantly.' },
      { q: 'A cancellation fee was applied', a: 'Cancellation fees apply after the free window or once a driver has arrived. If it was charged in error, our team can waive it from chat.' },
    ],
  },
  {
    id: 'trip',
    icon: 'directions-car',
    title: 'Trouble with a trip',
    intro: 'Route problems, driver behaviour, or something that went wrong on a ride.',
    issues: [
      { q: 'The driver took a longer route', a: 'Share the trip from Activity and tap "Report route issue". We compare the driven path against the optimal route and adjust the fare if needed.' },
      { q: 'The driver was rude or unsafe', a: 'Your safety is our priority. Report the driver from the trip details — they may be suspended pending review. For emergencies use the SOS button during a ride.' },
      { q: 'My driver never arrived', a: 'If the driver did not reach your pickup, any cancellation fee is automatically reversed. Start a chat if you still see a charge.' },
      { q: 'I was overcharged for wait time', a: 'Wait-time charges begin after the free waiting period. If you were charged before the driver arrived, we will refund it.' },
    ],
  },
  {
    id: 'lost-item',
    icon: 'search',
    title: 'I lost an item',
    intro: 'Left something in the car? We can help you reconnect with your driver.',
    issues: [
      { q: 'How do I contact my driver about a lost item?', a: 'Open the trip in Activity → "Find lost item" → we will call your driver on a masked number so your contact details stay private.' },
      { q: 'The driver is not responding', a: 'If you cannot reach the driver within a few hours, start a chat and our recovery team will follow up directly.' },
      { q: 'Is there a return fee?', a: 'Drivers may charge a small return-trip fee for delivering a lost item back to you. The amount is shown before you confirm.' },
    ],
  },
  {
    id: 'account',
    icon: 'account-circle',
    title: 'Account & security',
    intro: 'Login, profile, linked payment methods, and account safety.',
    issues: [
      { q: 'I am not receiving my OTP', a: 'Check your network and that the number is correct. You can re-request a code after the timer. On this build a dev code is shown on screen for testing.' },
      { q: 'How do I change my phone number?', a: 'Go to Account → profile to update your number. You will verify the new number with an OTP before the change takes effect.' },
      { q: 'I think my account was compromised', a: 'Sign out of all sessions from Account and start a chat immediately. We can lock the account and review recent activity.' },
      { q: 'How do I delete my account?', a: 'Account deletion removes your trips and payment methods permanently. Start a chat to request it; we process within 30 days as required by law.' },
    ],
  },
];

export function findTopic(id: string): SupportTopic | undefined {
  return SUPPORT_TOPICS.find((t) => t.id === id);
}
