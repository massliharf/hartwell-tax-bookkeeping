export type Service = { id: string; name: string; blurb: string; minutes: number; price: number; from: boolean };

export const SERVICES: Service[] = [
  { id: "intro", name: "Free 15-minute call", blurb: "Not sure what you need? Talk it through with Claire.", minutes: 15, price: 0, from: false },
  { id: "individual", name: "Individual return", blurb: "For employees and families: W-2s, mortgage, kids, student loans, retirement.", minutes: 45, price: 250, from: true },
  { id: "self-employed", name: "Self-employed / freelancer", blurb: "For freelancers and sole owners: 1099s, business expenses, home office, quarterly estimates.", minutes: 75, price: 450, from: true },
  { id: "rental", name: "Rental property", blurb: "For landlords: rent, repairs, depreciation, and the forms your property needs.", minutes: 60, price: 400, from: true },
  { id: "letter", name: "IRS or state letter", blurb: "A notice from the IRS or New Jersey you don't understand.", minutes: 30, price: 150, from: false },
  { id: "extension", name: "Extension or late return", blurb: "More time to file, or catching up on past years.", minutes: 45, price: 200, from: true },
  { id: "planning", name: "Tax planning and quarterly estimates", blurb: "Plan ahead and set your quarterly payments.", minutes: 45, price: 175, from: false },
  { id: "bookkeeping", name: "Small business bookkeeping", blurb: "Set up simple books, or fix messy ones before tax time.", minutes: 60, price: 200, from: false },
];

export const HOURS = [
  { days: "Monday – Friday", time: "9:00 am – 6:00 pm" },
  { days: "Saturday", time: "10:00 am – 2:00 pm" },
  { days: "Sunday", time: "Closed" },
];
