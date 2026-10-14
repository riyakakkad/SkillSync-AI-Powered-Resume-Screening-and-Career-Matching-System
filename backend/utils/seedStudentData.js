const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Job = require('../models/Job.model');
const Course = require('../models/Course.model');

dotenv.config();

const multiDomainJobs = [
  // 1. IT and Software Development
  {
    title: 'Frontend React Developer',
    company: 'TechCorp Solutions',
    companyLogo: '💻',
    location: 'San Francisco, CA (Hybrid)',
    salary: '$90,000 - $110,000 / year',
    jobType: 'Full-time',
    description: 'Looking for a passionate React developer with strong JavaScript, CSS, and modern web application skills to build high-performance client dashboards.',
    requiredSkills: ['React', 'JavaScript', 'CSS3', 'TypeScript', 'Git'],
    experienceLevel: 'Entry-level',
    domain: 'IT and Software Development',
    isActive: true
  },
  {
    title: 'Full Stack Node.js Engineer',
    company: 'CloudScale Innovations',
    companyLogo: '☁️',
    location: 'Austin, TX (Remote)',
    salary: '$95,000 - $120,000 / year',
    jobType: 'Full-time',
    description: 'Join our cloud infrastructure team to build scalable REST APIs, microservices, and interactive frontend interfaces using React, Express, and MongoDB.',
    requiredSkills: ['Node.js', 'Express', 'MongoDB', 'React', 'REST API'],
    experienceLevel: 'Mid-level',
    domain: 'IT and Software Development',
    isActive: true
  },
  {
    title: 'Junior DevOps Engineer',
    company: 'NextGen Systems',
    companyLogo: '🚀',
    location: 'Seattle, WA (Hybrid)',
    salary: '$85,000 - $105,000 / year',
    jobType: 'Full-time',
    description: 'Manage CI/CD pipelines, Docker containers, AWS Cloud resources, and automated deployment scripts for modern enterprise applications.',
    requiredSkills: ['Docker', 'AWS', 'Linux', 'CI/CD', 'Python'],
    experienceLevel: 'Entry-level',
    domain: 'IT and Software Development',
    isActive: true
  },

  // 2. Data Science and Data Analytics
  {
    title: 'Data Scientist / ML Specialist',
    company: 'Nexus AI Labs',
    companyLogo: '🤖',
    location: 'New York, NY (Hybrid)',
    salary: '$105,000 - $130,000 / year',
    jobType: 'Full-time',
    description: 'Work closely with Senior Data Scientists to build machine learning models, statistical models, and data pipelines in Python and Scikit-Learn.',
    requiredSkills: ['Python', 'Machine Learning', 'Data Analysis', 'Scikit-Learn', 'SQL', 'Pandas'],
    experienceLevel: 'Entry-level',
    domain: 'Data Science and Data Analytics',
    isActive: true
  },
  {
    title: 'Business Intelligence & Data Analyst',
    company: 'Apex Analytics Group',
    companyLogo: '📊',
    location: 'Chicago, IL (Remote)',
    salary: '$80,000 - $100,000 / year',
    jobType: 'Full-time',
    description: 'Design dashboards, automate reporting queries, and extract business insights using SQL, Power BI, and Tableau for enterprise clients.',
    requiredSkills: ['SQL', 'Power BI', 'Tableau', 'Data Analytics', 'Excel'],
    experienceLevel: 'Entry-level',
    domain: 'Data Science and Data Analytics',
    isActive: true
  },

  // 3. Healthcare
  {
    title: 'Clinical Nurse Specialist',
    company: 'Metro General Hospital',
    companyLogo: '🏥',
    location: 'Boston, MA (On-site)',
    salary: '$88,000 - $115,000 / year',
    jobType: 'Full-time',
    description: 'Provide high-quality clinical patient care, manage vital sign monitoring, triage acute cases, and maintain strict HIPAA regulatory compliance.',
    requiredSkills: ['Patient Care', 'BLS', 'Clinical Workflow', 'HIPAA Compliance', 'Vital Signs'],
    experienceLevel: 'Mid-level',
    domain: 'Healthcare',
    isActive: true
  },
  {
    title: 'Health Informatics Coordinator',
    company: 'CarePoint Health Systems',
    companyLogo: '🩺',
    location: 'Atlanta, GA (Hybrid)',
    salary: '$75,000 - $95,000 / year',
    jobType: 'Full-time',
    description: 'Coordinate electronic health records (EHR) workflows, ensure data privacy, and streamline healthcare operational protocols across clinics.',
    requiredSkills: ['Electronic Health Records', 'HIPAA Compliance', 'Medical Terminology', 'Healthcare Administration'],
    experienceLevel: 'Entry-level',
    domain: 'Healthcare',
    isActive: true
  },

  // 4. Finance and Accounting
  {
    title: 'Corporate Financial Analyst',
    company: 'Vanguard Capital Partners',
    companyLogo: '💰',
    location: 'New York, NY (Hybrid)',
    salary: '$85,000 - $110,000 / year',
    jobType: 'Full-time',
    description: 'Build financial valuation models, conduct cash flow variance analysis, and prepare budget forecasts for executive leadership.',
    requiredSkills: ['Financial Modeling', 'Excel', 'Valuation', 'Accounting', 'Budgeting'],
    experienceLevel: 'Entry-level',
    domain: 'Finance and Accounting',
    isActive: true
  },
  {
    title: 'Senior Staff Accountant',
    company: 'Deloitte & Associates',
    companyLogo: '📑',
    location: 'Dallas, TX (Hybrid)',
    salary: '$80,000 - $105,000 / year',
    jobType: 'Full-time',
    description: 'Lead periodic audit reviews, financial statement preparation under US GAAP standards, and corporate tax compliance.',
    requiredSkills: ['Auditing', 'Taxation', 'Financial Reporting', 'GAAP', 'QuickBooks'],
    experienceLevel: 'Mid-level',
    domain: 'Finance and Accounting',
    isActive: true
  },

  // 5. Marketing
  {
    title: 'Digital Marketing Strategist',
    company: 'Elevate Media Agency',
    companyLogo: '📈',
    location: 'Los Angeles, CA (Remote)',
    salary: '$70,000 - $90,000 / year',
    jobType: 'Full-time',
    description: 'Plan and execute SEO campaigns, organic content strategies, and social media analytics to accelerate customer acquisition.',
    requiredSkills: ['SEO', 'Content Strategy', 'Google Analytics', 'Social Media Marketing', 'Copywriting'],
    experienceLevel: 'Entry-level',
    domain: 'Marketing',
    isActive: true
  },
  {
    title: 'Performance Marketing Manager',
    company: 'OmniGrowth Labs',
    companyLogo: '🎯',
    location: 'San Francisco, CA (Hybrid)',
    salary: '$95,000 - $120,000 / year',
    jobType: 'Full-time',
    description: 'Manage paid search advertising budgets, SEM funnels, conversion tracking, and email remarketing campaigns.',
    requiredSkills: ['Paid Advertising', 'SEM', 'Email Campaigns', 'Market Research', 'Google Analytics'],
    experienceLevel: 'Mid-level',
    domain: 'Marketing',
    isActive: true
  },

  // 6. Human Resources
  {
    title: 'Human Resources Generalist',
    company: 'Pinnacle People Solutions',
    companyLogo: '👥',
    location: 'Denver, CO (Hybrid)',
    salary: '$65,000 - $85,000 / year',
    jobType: 'Full-time',
    description: 'Oversee full-cycle talent acquisition, employee onboarding, HRIS database administration, and labor relations compliance.',
    requiredSkills: ['Talent Acquisition', 'Employee Relations', 'HRIS', 'Performance Management', 'Onboarding'],
    experienceLevel: 'Entry-level',
    domain: 'Human Resources',
    isActive: true
  },

  // 7. Education
  {
    title: 'Instructional Designer & Curriculum Developer',
    company: 'Global EdTech Academy',
    companyLogo: '📚',
    location: 'Philadelphia, PA (Remote)',
    salary: '$72,000 - $92,000 / year',
    jobType: 'Full-time',
    description: 'Design digital learning modules, configure LMS course pathways, and construct assessment frameworks grounded in pedagogy.',
    requiredSkills: ['Curriculum Development', 'Instructional Design', 'Learning Management Systems', 'Assessment Design', 'Pedagogy'],
    experienceLevel: 'Mid-level',
    domain: 'Education',
    isActive: true
  },

  // 8. Mechanical, Civil, and Electrical Engineering
  {
    title: 'Mechanical Design Engineer',
    company: 'AeroPrecision Dynamics',
    companyLogo: '⚙️',
    location: 'Detroit, MI (On-site)',
    salary: '$85,000 - $110,000 / year',
    jobType: 'Full-time',
    description: 'Create detailed 3D CAD assemblies in SolidWorks and AutoCAD, perform finite element structural analyses, and optimize thermal performance.',
    requiredSkills: ['AutoCAD', 'SolidWorks', 'Finite Element Analysis', 'Mechanical Design', 'Thermodynamics'],
    experienceLevel: 'Entry-level',
    domain: 'Mechanical, Civil, and Electrical Engineering',
    isActive: true
  },
  {
    title: 'Civil Infrastructure Project Engineer',
    company: 'Apex Infrastructure Group',
    companyLogo: '🏗️',
    location: 'Phoenix, AZ (Hybrid)',
    salary: '$82,000 - $105,000 / year',
    jobType: 'Full-time',
    description: 'Lead site engineering design, structural analysis calculations, and construction safety compliance for municipal civil projects.',
    requiredSkills: ['AutoCAD', 'Structural Analysis', 'Construction Safety', 'Project Engineering', 'Civil Engineering'],
    experienceLevel: 'Mid-level',
    domain: 'Mechanical, Civil, and Electrical Engineering',
    isActive: true
  },

  // 9. Business and Management
  {
    title: 'Associate Product Manager',
    company: 'Starlight SaaS Products',
    companyLogo: '🚀',
    location: 'San Jose, CA (Hybrid)',
    salary: '$90,000 - $115,000 / year',
    jobType: 'Full-time',
    description: 'Collaborate with cross-functional engineering and design squads using Agile Scrum frameworks to define user stories and product roadmaps.',
    requiredSkills: ['Agile Methodology', 'Product Strategy', 'User Research', 'Scrum', 'Roadmapping'],
    experienceLevel: 'Entry-level',
    domain: 'Business and Management',
    isActive: true
  }
];

const multiDomainCourses = [
  // IT and Software Development Courses
  {
    courseName: 'Modern React & TypeScript Architecture',
    platform: 'SkillSync Academy',
    instructor: 'Dr. Sarah Jenkins',
    rating: 4.9,
    duration: '22 hours',
    difficulty: 'Intermediate',
    skillCovered: 'TypeScript',
    domain: 'IT and Software Development',
    progress: 0,
    link: 'https://coursera.org'
  },
  {
    courseName: 'Cloud DevOps: Docker, Kubernetes & CI/CD Pipelines',
    platform: 'Pluralsight',
    instructor: 'Elena Rostova',
    rating: 4.9,
    duration: '16 hours',
    difficulty: 'Intermediate',
    skillCovered: 'Docker',
    domain: 'IT and Software Development',
    progress: 0,
    link: 'https://pluralsight.com'
  },
  {
    courseName: 'Scalable REST APIs with Express & MongoDB',
    platform: 'Udemy',
    instructor: 'Marcus Vance',
    rating: 4.8,
    duration: '14 hours',
    difficulty: 'Beginner',
    skillCovered: 'Express',
    domain: 'IT and Software Development',
    progress: 0,
    link: 'https://udemy.com'
  },

  // Data Science & Analytics Courses
  {
    courseName: 'Power BI & Tableau for Enterprise Data Analytics',
    platform: 'Coursera',
    instructor: 'Alex Rivera',
    rating: 4.9,
    duration: '18 hours',
    difficulty: 'Beginner',
    skillCovered: 'Power BI',
    domain: 'Data Science and Data Analytics',
    progress: 0,
    link: 'https://coursera.org'
  },
  {
    courseName: 'Machine Learning & Predictive Modeling in Python',
    platform: 'edX',
    instructor: 'Prof. Michael Chang',
    rating: 4.8,
    duration: '26 hours',
    difficulty: 'Advanced',
    skillCovered: 'Machine Learning',
    domain: 'Data Science and Data Analytics',
    progress: 0,
    link: 'https://edx.org'
  },
  {
    courseName: 'Advanced SQL Querying & Data Warehousing',
    platform: 'SkillSync Academy',
    instructor: 'Priya Sharma',
    rating: 4.9,
    duration: '12 hours',
    difficulty: 'Intermediate',
    skillCovered: 'SQL',
    domain: 'Data Science and Data Analytics',
    progress: 0,
    link: 'https://udemy.com'
  },

  // Healthcare Courses
  {
    courseName: 'HIPAA Compliance & Patient Health Information Privacy',
    platform: 'HealthEd Online',
    instructor: 'Dr. Rebecca Moore, MD',
    rating: 4.9,
    duration: '8 hours',
    difficulty: 'Beginner',
    skillCovered: 'HIPAA Compliance',
    domain: 'Healthcare',
    progress: 0,
    link: 'https://coursera.org'
  },
  {
    courseName: 'Electronic Health Records (EHR) Clinical Mastery',
    platform: 'edX',
    instructor: 'James Campbell, RN',
    rating: 4.7,
    duration: '15 hours',
    difficulty: 'Intermediate',
    skillCovered: 'Electronic Health Records',
    domain: 'Healthcare',
    progress: 0,
    link: 'https://edx.org'
  },
  {
    courseName: 'Foundations of Clinical Patient Care & Triage Protocols',
    platform: 'SkillSync Academy',
    instructor: 'Nurse Practitioner Lisa Hayes',
    rating: 4.8,
    duration: '20 hours',
    difficulty: 'Intermediate',
    skillCovered: 'Patient Care',
    domain: 'Healthcare',
    progress: 0,
    link: 'https://coursera.org'
  },
  {
    courseName: 'BLS (Basic Life Support) & CPR Clinical Certification',
    platform: 'American Heart Association',
    instructor: 'Dr. Kevin Harris, MD',
    rating: 4.9,
    duration: '10 hours',
    difficulty: 'Beginner',
    skillCovered: 'BLS (Basic Life Support), CPR',
    domain: 'Healthcare',
    progress: 0,
    link: 'https://heart.org'
  },
  {
    courseName: 'Clinical Assessment & Triage Protocols in Acute Care',
    platform: 'edX',
    instructor: 'Prof. Margaret Collins',
    rating: 4.8,
    duration: '16 hours',
    difficulty: 'Intermediate',
    skillCovered: 'Clinical Assessment, Triage',
    domain: 'Healthcare',
    progress: 0,
    link: 'https://edx.org'
  },

  // Finance & Accounting Courses
  {
    courseName: 'Financial Modeling & Valuation Masterclass',
    platform: 'Corporate Finance Institute',
    instructor: 'Robert Sterling, CFA',
    rating: 4.9,
    duration: '24 hours',
    difficulty: 'Advanced',
    skillCovered: 'Financial Modeling',
    domain: 'Finance and Accounting',
    progress: 0,
    link: 'https://cfi.org'
  },
  {
    courseName: 'US GAAP Standards & Corporate Financial Reporting',
    platform: 'Coursera',
    instructor: 'Prof. David Klein, CPA',
    rating: 4.8,
    duration: '16 hours',
    difficulty: 'Intermediate',
    skillCovered: 'GAAP',
    domain: 'Finance and Accounting',
    progress: 0,
    link: 'https://coursera.org'
  },
  {
    courseName: 'Internal Auditing & QuickBooks Accounting Essentials',
    platform: 'Udemy',
    instructor: 'Amanda Cooper, CPA',
    rating: 4.7,
    duration: '12 hours',
    difficulty: 'Beginner',
    skillCovered: 'Auditing',
    domain: 'Finance and Accounting',
    progress: 0,
    link: 'https://udemy.com'
  },

  // Marketing Courses
  {
    courseName: 'Complete SEO Strategy & Content Optimization',
    platform: 'HubSpot Academy',
    instructor: 'Rachel Adams',
    rating: 4.9,
    duration: '14 hours',
    difficulty: 'Intermediate',
    skillCovered: 'SEO',
    domain: 'Marketing',
    progress: 0,
    link: 'https://hubspot.com'
  },
  {
    courseName: 'Google Analytics 4 & Performance Digital Ads',
    platform: 'Google Skillshop',
    instructor: 'Chris Evans',
    rating: 4.8,
    duration: '10 hours',
    difficulty: 'Beginner',
    skillCovered: 'Google Analytics',
    domain: 'Marketing',
    progress: 0,
    link: 'https://skillshop.withgoogle.com'
  },

  // HR Courses
  {
    courseName: 'HR Information Systems (HRIS) & Strategic Talent Acquisition',
    platform: 'SHRM Learning System',
    instructor: 'Karen Mitchell, SHRM-SCP',
    rating: 4.9,
    duration: '16 hours',
    difficulty: 'Intermediate',
    skillCovered: 'HRIS',
    domain: 'Human Resources',
    progress: 0,
    link: 'https://shrm.org'
  },

  // Education Courses
  {
    courseName: 'Instructional Design Foundations & LMS Course Management',
    platform: 'edX',
    instructor: 'Dr. Evelyn Reed',
    rating: 4.8,
    duration: '18 hours',
    difficulty: 'Intermediate',
    skillCovered: 'Instructional Design',
    domain: 'Education',
    progress: 0,
    link: 'https://edx.org'
  },

  // Engineering Courses
  {
    courseName: '3D CAD Modeling with SolidWorks & AutoCAD',
    platform: 'Udemy',
    instructor: 'Eng. Thomas Ward',
    rating: 4.9,
    duration: '28 hours',
    difficulty: 'Intermediate',
    skillCovered: 'SolidWorks',
    domain: 'Mechanical, Civil, and Electrical Engineering',
    progress: 0,
    link: 'https://udemy.com'
  },
  {
    courseName: 'Structural Analysis & Finite Element Simulation',
    platform: 'Coursera',
    instructor: 'Prof. Alan Vance',
    rating: 4.8,
    duration: '20 hours',
    difficulty: 'Advanced',
    skillCovered: 'Structural Analysis',
    domain: 'Mechanical, Civil, and Electrical Engineering',
    progress: 0,
    link: 'https://coursera.org'
  },

  // Business Courses
  {
    courseName: 'Agile Product Strategy & Scrum Frameworks',
    platform: 'Product School',
    instructor: 'Samantha Taylor',
    rating: 4.9,
    duration: '15 hours',
    difficulty: 'Intermediate',
    skillCovered: 'Agile Methodology',
    domain: 'Business and Management',
    progress: 0,
    link: 'https://productschool.com'
  }
];

async function seedData() {
  try {
    const connStr = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/skillsync';
    await mongoose.connect(connStr);
    console.log('[Seed] Connected to MongoDB for seeding multi-domain jobs & courses...');

    // Upsert or insert jobs by title so existing ones don't block domain variety
    let insertedJobs = 0;
    let updatedJobs = 0;
    for (const job of multiDomainJobs) {
      const existing = await Job.findOne({ title: job.title });
      if (!existing) {
        await Job.create(job);
        insertedJobs++;
      } else {
        await Job.updateOne({ _id: existing._id }, { $set: job });
        updatedJobs++;
      }
    }
    console.log(`[Seed] Jobs sync complete: ${insertedJobs} inserted, ${updatedJobs} updated. Total active jobs: ${await Job.countDocuments()}`);

    // Upsert or insert courses by courseName
    let insertedCourses = 0;
    let updatedCourses = 0;
    for (const course of multiDomainCourses) {
      const existing = await Course.findOne({ courseName: course.courseName });
      if (!existing) {
        await Course.create(course);
        insertedCourses++;
      } else {
        await Course.updateOne({ _id: existing._id }, { $set: course });
        updatedCourses++;
      }
    }
    console.log(`[Seed] Courses sync complete: ${insertedCourses} inserted, ${updatedCourses} updated. Total courses: ${await Course.countDocuments()}`);

    await mongoose.disconnect();
    console.log('[Seed] Multi-domain seeding completed successfully.');
  } catch (error) {
    console.error('[Seed] Error during seeding:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  seedData();
}

module.exports = { multiDomainJobs, multiDomainCourses, seedData };
