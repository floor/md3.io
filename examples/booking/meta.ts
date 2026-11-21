import type { ExampleMeta } from '../types';
export default {
  slug:'booking',title:'Booking',
  description:'A fictional city hotel booking engine: dates and guests, room rates, extras, guest details and confirmation, in every framework.',
  components:['datepicker','text-field','select','card','radios','checkbox','button','snackbar','stepper'],
  tags:['Apps','Forms','Travel'],
  about:[
    'Reserve a stay at Hotel Lumen, a fictional four-star city hotel in Lisbon. Choose dates and guests, compare rooms and rate plans, add extras, enter guest details and see a confirmation. There are no hotel or room pictures.',
    'Every framework renders the same hotel, inventory and EUR pricing rules. Material components supply the fields, cards and controls; material-addons supplies the linear stepper. The hotel, address, availability, rates and taxes are invented demonstration data.',
  ],
  how:[
    'One range picker takes check-in and check-out, with nights shown below the field. Next validates the current step and focuses the first issue; Back keeps data without validation. Moving forward puts focus on a visually hidden step heading.',
    'Room and rate combinations form one radio group. Arrow keys move among available options, Home and End jump to the ends, and Enter or Space selects. Capacity and available room counts disable unsuitable choices and explain why.',
    'The summary stays beside the flow on wide frames and expands from a compact row on phones. It adds room rates, nights, rooms, extras and city tax, with included VAT below the total. Breakfast included in a rate is never charged twice.',
    'Guest details include a different lead guest and an illustrative payment choice. No card details are requested and nothing is sent or charged. Book opens a confirmation screen; Add to calendar and Manage booking only explain their demo status in a snackbar.',
  ],
} satisfies ExampleMeta;
