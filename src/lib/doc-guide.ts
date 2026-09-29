// Plain-language "what it looks like / where to find it" hints for checklist documents.
const GUIDES: [RegExp, string][] = [
  [/photo id/i, "A driver's license, state ID or passport. A clear phone photo of the front is enough."],
  [/last year|prior year/i, "Last year's federal and state return, usually a PDF from whoever filed it or your tax software account."],
  [/^w-2/i, "A one-page form from your employer, mailed or posted in your payroll portal by January 31."],
  [/1099-nec|1099-k/i, "Sent by clients who paid you $600+ (NEC), or by PayPal, Venmo, Stripe or Etsy (K). Check your email and account tax pages."],
  [/income & expense/i, "A simple list or spreadsheet of what you earned and spent for the business. Totals by category are fine."],
  [/home office/i, "The size of your office space and your home's total square footage. Rough numbers are okay."],
  [/1099-int/i, "From your bank, usually in the documents or statements section of online banking. Only if you earned $10+ interest."],
  [/1099-b/i, "From your brokerage (Fidelity, Schwab, Robinhood…), under tax documents, usually by mid-February."],
  [/1098-e/i, "From your student loan servicer's website, under tax documents."],
  [/1098/i, "From your mortgage lender, showing the interest you paid. Look in your lender's online account."],
  [/childcare/i, "The provider's name, address and tax ID, and how much you paid this year. Your provider can give you a year-end statement."],
  [/rental income/i, "Rent received and costs like repairs, insurance and management fees. A spreadsheet or statements work."],
  [/property tax/i, "Your town's property tax bill for the rental, or the amount shown on your mortgage escrow statement."],
  [/irs letter/i, "The letter the IRS mailed you. Photograph every page, including the notice number at the top right."],
];

export const docGuide = (name: string, fallback?: string | null) =>
  GUIDES.find(([re]) => re.test(name))?.[1] ?? fallback ?? "Upload a clear photo or PDF.";
