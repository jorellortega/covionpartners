import { Job } from "@/app/types";

const mockUsers = [
  {
    id: "u1",
    name: "Jane Doe",
    avatar_url: "/placeholder-user.jpg",
    email: "jane@example.com"
  },
  {
    id: "u2",
    name: "John Smith",
    avatar_url: "/placeholder-user.jpg",
    email: "john@example.com"
  }
];

export const mockCompanies = [
  {
    slug: "technova",
    name: "TechNova",
    logo: "/placeholder-logo.png",
    description: "TechNova is a leading innovator in web and cloud solutions, empowering businesses worldwide.",
    website: "https://technova.com",
    location: "San Francisco, USA",
    founded: 2012,
    employees: 120,
    industry: "Software & Cloud",
    socials: {
      linkedin: "https://linkedin.com/company/technova",
      twitter: "https://twitter.com/technova"
    },
    projects: [
      { id: "p1", name: "NovaCloud", description: "A scalable cloud platform for modern apps." },
      { id: "p2", name: "NovaAI", description: "AI-powered analytics for business growth." }
    ],
    media: [
      { type: "image", url: "/placeholder.jpg", title: "Office HQ" },
      { type: "image", url: "/placeholder-user.jpg", title: "Team Event" },
      { type: "video", url: "https://www.youtube.com/embed/dQw4w9WgXcQ", title: "Company Overview" }
    ],
    team: [
      { name: "Alice Johnson", role: "CEO & Founder", photo: "/placeholder-user.jpg" },
      { name: "Mark Lee", role: "CTO", photo: "/placeholder-user.jpg" }
    ]
  },
  {
    slug: "finedge",
    name: "FinEdge",
    logo: "/placeholder-logo.svg",
    description: "FinEdge delivers next-gen fintech products for global markets.",
    website: "https://finedge.com",
    location: "New York, USA",
    founded: 2017,
    employees: 60,
    industry: "Fintech",
    socials: {
      linkedin: "https://linkedin.com/company/finedge"
    },
    projects: [
      { id: "p3", name: "EdgePay", description: "A secure payment gateway for e-commerce." }
    ],
    media: [
      { type: "image", url: "/placeholder.jpg", title: "FinEdge Team" },
      { type: "video", url: "https://www.youtube.com/embed/ysz5S6PUM-U", title: "FinEdge Product Demo" }
    ],
    team: [
      { name: "Bob Smith", role: "Product Manager", photo: "/placeholder-user.jpg" }
    ]
  },
  {
    slug: "datawiz",
    name: "DataWiz",
    logo: "/placeholder-logo.png",
    description: "DataWiz turns data into actionable insights for enterprises.",
    website: "https://datawiz.com",
    location: "London, UK",
    founded: 2015,
    employees: 40,
    industry: "Data Science",
    socials: {
      linkedin: "https://linkedin.com/company/datawiz"
    },
    projects: [
      { id: "p4", name: "WizBI", description: "Business intelligence for everyone." }
    ],
    media: [
      { type: "image", url: "/placeholder.jpg", title: "DataWiz Office" }
    ],
    team: [
      { name: "Carol Lee", role: "Lead Data Scientist", photo: "/placeholder-user.jpg" }
    ]
  }
];

export const mockJobs: Job[] = [
  {
    id: "1",
    employer_id: "e1",
    title: "Senior Frontend Developer",
    company: "TechNova",
    location: "Remote",
    remote: true,
    job_type: "full-time",
    salary_min: 120000,
    salary_max: 150000,
    salary_currency: "USD",
    description: "Join our team to build modern web apps with React and TypeScript.",
    requirements: "5+ years experience, React, TypeScript, CSS",
    benefits: "Health, 401k, Remote work",
    skills: ["React", "TypeScript", "CSS", "UI/UX"],
    experience_level: "senior",
    education_level: "Bachelor's degree",
    application_deadline: "2024-07-01",
    is_active: true,
    views_count: 42,
    applications_count: 8,
    created_at: "2024-06-01T10:00:00Z",
    updated_at: "2024-06-01T10:00:00Z",
    employer: { full_name: "Alice Johnson", company: "TechNova", avatar_url: undefined, slug: "technova" },
    thumbnail_url: "/placeholder-logo.png",
    job_image_url: "/placeholder.jpg"
  },
  {
    id: "2",
    employer_id: "e1",
    title: "Backend Engineer",
    company: "TechNova",
    location: "San Francisco, USA",
    remote: false,
    job_type: "full-time",
    salary_min: 110000,
    salary_max: 140000,
    salary_currency: "USD",
    description: "Work on scalable backend systems.",
    requirements: "Node.js, PostgreSQL, AWS",
    benefits: "Health, 401k",
    skills: ["Node.js", "PostgreSQL", "AWS"],
    experience_level: "mid",
    education_level: "Bachelor's degree",
    application_deadline: "2024-06-15",
    is_active: false,
    views_count: 30,
    applications_count: 5,
    created_at: "2024-05-10T10:00:00Z",
    updated_at: "2024-06-01T10:00:00Z",
    employer: { full_name: "Alice Johnson", company: "TechNova", avatar_url: undefined, slug: "technova" },
    thumbnail_url: "/placeholder-logo.png",
    job_image_url: "/placeholder.jpg"
  },
  {
    id: "3",
    employer_id: "e1",
    title: "UI/UX Designer",
    company: "TechNova",
    location: "Remote",
    remote: true,
    job_type: "contract",
    salary_min: 60000,
    salary_max: 80000,
    salary_currency: "USD",
    description: "Design beautiful user interfaces.",
    requirements: "Figma, UX Research",
    benefits: "Remote, Flexible hours",
    skills: ["Figma", "UX", "UI"],
    experience_level: "junior",
    education_level: "Bachelor's degree",
    application_deadline: "2024-06-20",
    is_active: false,
    views_count: 20,
    applications_count: 3,
    created_at: "2024-04-01T10:00:00Z",
    updated_at: "2024-06-01T10:00:00Z",
    employer: { full_name: "Alice Johnson", company: "TechNova", avatar_url: undefined, slug: "technova" },
    thumbnail_url: "/placeholder-logo.png",
    job_image_url: "/placeholder.jpg",
    filled_by: mockUsers[0]
  },
  {
    id: "4",
    employer_id: "e2",
    title: "Product Manager",
    company: "FinEdge",
    location: "New York, USA",
    remote: false,
    job_type: "full-time",
    salary_min: 100000,
    salary_max: 130000,
    salary_currency: "USD",
    description: "Lead product teams in the fintech space.",
    requirements: "3+ years PM experience, Agile, Fintech",
    benefits: "Stock options, Health, Gym membership",
    skills: ["Product Management", "Agile", "Fintech"],
    experience_level: "mid",
    education_level: "Master's degree",
    application_deadline: "2024-07-10",
    is_active: true,
    views_count: 30,
    applications_count: 5,
    created_at: "2024-06-02T09:00:00Z",
    updated_at: "2024-06-02T09:00:00Z",
    employer: { full_name: "Bob Smith", company: "FinEdge", avatar_url: undefined, slug: "finedge" },
    thumbnail_url: "/placeholder-logo.svg",
    job_image_url: "/placeholder.jpg"
  },
  {
    id: "5",
    employer_id: "e2",
    title: "QA Engineer",
    company: "FinEdge",
    location: "Remote",
    remote: true,
    job_type: "full-time",
    salary_min: 90000,
    salary_max: 110000,
    salary_currency: "USD",
    description: "Ensure product quality and reliability.",
    requirements: "Automation, Selenium, API Testing",
    benefits: "Remote, Health",
    skills: ["QA", "Selenium", "API"],
    experience_level: "junior",
    education_level: "Bachelor's degree",
    application_deadline: "2024-06-30",
    is_active: false,
    views_count: 10,
    applications_count: 2,
    created_at: "2024-05-15T10:00:00Z",
    updated_at: "2024-06-01T10:00:00Z",
    employer: { full_name: "Bob Smith", company: "FinEdge", avatar_url: undefined, slug: "finedge" },
    thumbnail_url: "/placeholder-logo.svg",
    job_image_url: "/placeholder.jpg",
    filled_by: mockUsers[1]
  },
  {
    id: "6",
    employer_id: "e3",
    title: "Junior Data Scientist",
    company: "DataWiz",
    location: "San Francisco, USA",
    remote: false,
    job_type: "internship",
    salary_min: 3000,
    salary_max: 4000,
    salary_currency: "USD",
    description: "Work with big data and machine learning models.",
    requirements: "Python, ML, SQL, Data Visualization",
    benefits: "Mentorship, Networking",
    skills: ["Python", "Machine Learning", "SQL", "Data Visualization"],
    experience_level: "entry",
    education_level: "Bachelor's degree",
    application_deadline: "2024-07-15",
    is_active: true,
    views_count: 15,
    applications_count: 2,
    created_at: "2024-06-03T08:00:00Z",
    updated_at: "2024-06-03T08:00:00Z",
    employer: { full_name: "Carol Lee", company: "DataWiz", avatar_url: undefined, slug: "datawiz" },
    thumbnail_url: "/placeholder-logo.png",
    job_image_url: "/placeholder.jpg"
  },
  {
    id: "7",
    employer_id: "e3",
    title: "Data Engineer",
    company: "DataWiz",
    location: "London, UK",
    remote: false,
    job_type: "full-time",
    salary_min: 95000,
    salary_max: 120000,
    salary_currency: "USD",
    description: "Build and maintain data pipelines.",
    requirements: "ETL, SQL, Python",
    benefits: "Health, Flexible hours",
    skills: ["ETL", "SQL", "Python"],
    experience_level: "mid",
    education_level: "Bachelor's degree",
    application_deadline: "2024-06-25",
    is_active: false,
    views_count: 8,
    applications_count: 1,
    created_at: "2024-05-01T10:00:00Z",
    updated_at: "2024-06-01T10:00:00Z",
    employer: { full_name: "Carol Lee", company: "DataWiz", avatar_url: undefined, slug: "datawiz" },
    thumbnail_url: "/placeholder-logo.png",
    job_image_url: "/placeholder.jpg",
    filled_by: mockUsers[0]
  }
]; 