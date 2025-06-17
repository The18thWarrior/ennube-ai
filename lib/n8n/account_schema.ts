export interface BillingAddress {
  street: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
}

export interface AccountSchema {
  Id: string;
  Name: string;
  Website: string;
  CreatedDate: string;
  Phone: string;
  billingAddress: BillingAddress;
  industry: string | null;
  numberOfEmployees: number | null;
  step1DataMined: boolean | null;
  contactUsForm: string | null;
  careersWebsite: string | null;
  teamPage: string | null;
  linkedinURL: string | null;
  productsDescription: string | null;
}