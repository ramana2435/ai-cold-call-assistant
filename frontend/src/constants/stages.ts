export const STAGES = [
  {
    number: 1,
    name: 'Opening',
    guidance: 'Introduce yourself and confirm you are speaking with the right person',
    quickTaps: ['Reached decision maker', 'Spoke to receptionist', 'Left voicemail', 'Call connected']
  },
  {
    number: 2,
    name: 'Purpose',
    guidance: 'Say why you called in one or two sentences she can repeat to her receptionist',
    quickTaps: ['Asked what we do', 'Asked where we got number', 'Said make it quick', 'Let me go on']
  },
  {
    number: 3,
    name: 'Permission',
    guidance: 'Ask if you can take 2 minutes to see if there is a fit',
    quickTaps: ['Gave permission', 'Asked to call back', 'Said they are busy', 'Requested more info']
  },
  {
    number: 4,
    name: 'Their business',
    guidance: 'Understand their company and current situation',
    quickTaps: ['Described their practice', 'Mentioned current systems', 'Asked about our service', 'Showed interest']
  },
  {
    number: 5,
    name: 'Their need, in their words',
    guidance: 'Listen for and capture their exact statement of need',
    quickTaps: ['Stated specific need', 'Mentioned pain point', 'Described current problem', 'Expressed interest']
  },
  {
    number: 6,
    name: 'Objection',
    guidance: 'Handle concerns and address resistance',
    quickTaps: ['Not the right person', 'Already have solution', 'Not interested right now', 'Send information first']
  },
  {
    number: 7,
    name: 'Next step',
    guidance: 'Agree on a specific action with a date',
    quickTaps: ['Agreed to meeting', 'Asked for proposal', 'Requested follow-up call', 'Wanted email first']
  },
  {
    number: 8,
    name: 'Close',
    guidance: 'Confirm the next step and end positively',
    quickTaps: ['Confirmed next step', 'Thanked for time', 'Set calendar invite', 'Ended positively']
  }
];

export const OUTCOMES = [
  { value: 'next_step_agreed', label: 'Next step agreed' },
  { value: 'agreed_to_receive_report', label: 'Agreed to receive report' },
  { value: 'interested', label: 'Interested' },
  { value: 'follow_up', label: 'Follow up' },
  { value: 'call_again', label: 'Call again' },
  { value: 'not_interested', label: 'Not interested' },
  { value: 'do_not_call', label: 'Do not call' },
  { value: 'wrong_person', label: 'Wrong person' },
  { value: 'moved_company', label: 'Moved company' },
  { value: 'not_logged', label: 'Not logged' }
];

export const SHE_MAY_SAY: Record<number, string[]> = {
  1: ["Is this a sales call?", "Who are you with?", "What's this about?"],
  2: ["What does your software do exactly?", "How did you get my number?", "I'm quite busy right now"],
  3: ["What's this going to involve?", "We're not looking for anything new", "How long will this take?"],
  4: ["We've been running the same system for years", "We're a small practice so...", "We're actually growing quite quickly"],
  5: ["Our biggest issue is probably...", "We waste so much time on...", "Honestly what would really help is..."],
  6: ["Send me an email instead", "We already have something similar", "I'd need to check with my partner"],
  7: ["When would that be exactly?", "Can you send a calendar invite?", "What do I need to prepare?"],
  8: ["Thanks for your time", "I'll look forward to it", "Let me check my diary"]
};
