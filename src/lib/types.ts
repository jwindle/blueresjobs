// TypeScript types mirroring the AT Protocol lexicon definitions.

export interface Trait {
  name: string;
  description?: string;
  importance?: number;
}

export interface EmployerRecord {
  $type?: string;
  name?: string;
  shortDescription?: string;
  longDescription?: string;
  jobTraits?: Trait[];
  employeeTraits?: Trait[];
  image?: string;
}

export interface Salary {
  min?: number;
  max?: number;
  currency?: string;
  comment?: string;
}

// Generic {key: string, values: string[]} trait values entry.
export interface TraitValues {
  key: string;
  values: string[];
}

export interface JobPostRecord {
  $type?: string;
  postName: string;
  employerRef?: string;
  applicationContact?: string;
  datePosted: string;
  validThrough?: string;
  url?: string;
  jobTitle?: string;
  jobLocation?: string;
  shortDescription?: string;
  longDescription?: string;
  employmentType?: string;
  estimatedSalary?: Salary;
  jobBenefits?: string;
  jobTraits?: TraitValues[];
  employeeTraits?: TraitValues[];
  active?: boolean;
}

// A job post as returned from the PDS, with its AT Protocol coordinates attached.
export interface JobPostEntry {
  did: string;
  rkey: string;
  cid: string;
  record: JobPostRecord;
}
