export type Service = { id: string; name: string; blurb: string; minutes: number; price: number; from: boolean };

export const SERVICES: Service[] = [
  { id: "individual", name: "Individual return", blurb: "W-2 income, standard or itemized.", minutes: 45, price: 250, from: true },
  { id: "self-employed", name: "Self-employed / freelancer", blurb: "1099 income and Schedule C.", minutes: 75, price: 450, from: true },
  { id: "rental", name: "Rental property", blurb: "Income, expenses and depreciation.", minutes: 60, price: 400, from: true },
  { id: "extension", name: "Extension / IRS letter review", blurb: "File on time, or understand a notice.", minutes: 30, price: 150, from: false },
  { id: "bookkeeping", name: "Small business bookkeeping consult", blurb: "Get your books clean and simple.", minutes: 60, price: 200, from: false },
];

export const HOURS = [
  { days: "Monday – Friday", time: "9:00 am – 6:00 pm" },
  { days: "Saturday", time: "10:00 am – 2:00 pm" },
  { days: "Sunday", time: "Closed" },
];
