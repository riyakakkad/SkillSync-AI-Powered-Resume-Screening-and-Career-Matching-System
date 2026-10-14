const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User.model');
const Job = require('../models/Job.model');
const Resume = require('../models/Resume.model');
const Application = require('../models/Application.model');

dotenv.config();

const seedDemoUsers = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/skillsync';
    await mongoose.connect(mongoUri);
    console.log(`[Demo Seeder] Connected to MongoDB at ${mongoUri}`);

    // 1. Seed or update Admin
    const adminEmail = 'admin@skillsync.com';
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      admin = await User.create({
        fullName: 'System Administrator',
        email: adminEmail,
        password: 'Admin@123456',
        role: 'admin',
        isActive: true
      });
      console.log(`[Demo Seeder] Created Admin user: ${adminEmail}`);
    } else {
      admin.role = 'admin';
      admin.isActive = true;
      admin.password = 'Admin@123456';
      await admin.save();
      console.log(`[Demo Seeder] Updated Admin user: ${adminEmail}`);
    }

    // 2. Seed or update Recruiter
    const recruiterEmail = 'recruiter.demo@skillsync.com';
    let recruiter = await User.findOne({ email: recruiterEmail });
    if (!recruiter) {
      recruiter = await User.create({
        fullName: 'Sarah Jenkins (Talent Lead)',
        email: recruiterEmail,
        password: 'Password123!',
        role: 'recruiter',
        companyName: 'TechScale Innovations',
        isActive: true
      });
      console.log(`[Demo Seeder] Created Recruiter user: ${recruiterEmail}`);
    } else {
      recruiter.role = 'recruiter';
      recruiter.companyName = 'TechScale Innovations';
      recruiter.isActive = true;
      recruiter.password = 'Password123!';
      await recruiter.save();
      console.log(`[Demo Seeder] Updated Recruiter user: ${recruiterEmail}`);
    }

    // Assign / create recruiter jobs
    const sampleJobs = [
      {
        title: 'Full Stack Node.js & React Developer',
        company: 'TechScale Innovations',
        companyLogo: '💻',
        location: 'San Francisco, CA (Hybrid)',
        salary: '$110,000 - $135,000 / year',
        jobType: 'Full-time',
        description: 'We are seeking a versatile Full Stack Developer experienced with React, Node.js, Express, and MongoDB. You will architect high-throughput APIs and sleek user interfaces.',
        requiredSkills: ['JavaScript', 'React', 'Node.js', 'Express', 'MongoDB'],
        preferredSkills: ['TypeScript', 'Docker', 'AWS'],
        experienceLevel: 'Mid-level',
        domain: 'IT and Software Development',
        postedBy: recruiter._id,
        isActive: true
      },
      {
        title: 'Clinical Data Coordinator',
        company: 'CareFirst Health Network',
        companyLogo: '🏥',
        location: 'Boston, MA (Remote)',
        salary: '$80,000 - $95,000 / year',
        jobType: 'Full-time',
        description: 'Responsible for clinical trial data management, patient record integrity, and regulatory compliance. Direct experience with EHR and GCP required.',
        requiredSkills: ['Clinical Research', 'Electronic Health Records', 'Patient Care', 'HIPAA Compliance'],
        preferredSkills: ['Biostatistics', 'SAS', 'Medical Terminology'],
        experienceLevel: 'Entry-level',
        domain: 'Healthcare',
        postedBy: recruiter._id,
        isActive: true
      },
      {
        title: 'Senior Financial Analyst',
        company: 'Apex Global Financial',
        companyLogo: '📈',
        location: 'New York, NY (Hybrid)',
        salary: '$105,000 - $130,000 / year',
        jobType: 'Full-time',
        description: 'Conduct quantitative financial forecasting, valuation modeling, variance analysis, and presentation decks for executive leadership.',
        requiredSkills: ['Financial Modeling', 'Financial Analysis', 'Excel Modeling', 'Valuation'],
        preferredSkills: ['CPA', 'Bloomberg Terminal', 'PowerBI'],
        experienceLevel: 'Senior',
        domain: 'Finance and Accounting',
        postedBy: recruiter._id,
        isActive: true
      }
    ];

    for (const jobData of sampleJobs) {
      const existingJob = await Job.findOne({ title: jobData.title, postedBy: recruiter._id });
      if (!existingJob) {
        await Job.create(jobData);
        console.log(`[Demo Seeder] Created Recruiter Job: ${jobData.title}`);
      }
    }

    // 3. Seed or update Student
    const studentEmail = 'student.demo@skillsync.com';
    let student = await User.findOne({ email: studentEmail });
    if (!student) {
      student = await User.create({
        fullName: 'Alex Rivera (Demo Student)',
        email: studentEmail,
        password: 'Password123!',
        role: 'student',
        isActive: true
      });
      console.log(`[Demo Seeder] Created Student user: ${studentEmail}`);
    } else {
      student.role = 'student';
      student.isActive = true;
      student.password = 'Password123!';
      await student.save();
      console.log(`[Demo Seeder] Updated Student user: ${studentEmail}`);
    }

    // Create / ensure Student resume
    let studentResume = await Resume.findOne({ user: student._id });
    if (!studentResume) {
      studentResume = await Resume.create({
        user: student._id,
        originalName: 'Alex_Rivera_Software_Engineer_Resume.pdf',
        fileName: 'demo-student-resume.pdf',
        filePath: 'uploads/resumes/demo-student-resume.pdf',
        fileType: 'application/pdf',
        fileSize: 104230,
        status: 'analyzed',
        analysisStatus: 'analyzed',
        extractedText: 'Alex Rivera. Full Stack Developer. Experienced with JavaScript, React, Node.js, Express, MongoDB, REST API, Git, HTML5, and CSS3. Built multiple scalable applications.',
        detectedSkills: ['JavaScript', 'React', 'Node.js', 'Express', 'MongoDB', 'REST API', 'Git', 'HTML5', 'CSS3'],
        detectedDomain: 'IT and Software Development',
        relevantDomains: ['IT and Software Development'],
        domainConfidence: 0.92,
        atsScore: 88,
        atsBreakdown: {
          skillsScore: 90,
          formattingScore: 85,
          experienceScore: 88,
          readabilityScore: 90,
          feedback: [
            'Outstanding presence of modern full-stack web technologies.',
            'Clear project demonstrations and measurable accomplishments.',
            'Domain alignment with IT and Software Development is exceptionally high.'
          ]
        },
        analyzedAt: new Date()
      });
      console.log(`[Demo Seeder] Created analyzed resume for student: ${studentEmail}`);
    } else {
      studentResume.status = 'analyzed';
      studentResume.analysisStatus = 'analyzed';
      studentResume.detectedSkills = ['JavaScript', 'React', 'Node.js', 'Express', 'MongoDB', 'REST API', 'Git', 'HTML5', 'CSS3'];
      studentResume.detectedDomain = 'IT and Software Development';
      studentResume.relevantDomains = ['IT and Software Development'];
      studentResume.domainConfidence = 0.92;
      studentResume.atsScore = 88;
      await studentResume.save();
      console.log(`[Demo Seeder] Updated analyzed resume for student: ${studentEmail}`);
    }

    // Create a demo application for the student to recruiter's job
    const recruiterJob = await Job.findOne({ title: 'Full Stack Node.js & React Developer' });
    if (recruiterJob) {
      const existingApp = await Application.findOne({ job: recruiterJob._id, student: student._id });
      if (!existingApp) {
        await Application.create({
          job: recruiterJob._id,
          student: student._id,
          resume: studentResume._id,
          status: 'Shortlisted',
          notes: 'Candidate has strong full stack foundation; matched 100% of required skills.',
          timeline: [
            { status: 'Applied', notes: 'Initial application submitted.' },
            { status: 'Shortlisted', notes: 'Candidate skills closely match backend & frontend requirements.' }
          ]
        });
        console.log(`[Demo Seeder] Created sample application: Alex Rivera -> Full Stack Developer`);
      }
    }

    console.log('[Demo Seeder] All demo accounts and seed data successfully initialized.');
    process.exit(0);
  } catch (error) {
    console.error(`[Demo Seeder Error]: ${error.message}`);
    process.exit(1);
  }
};

seedDemoUsers();
