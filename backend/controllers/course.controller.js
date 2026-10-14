const Course = require('../models/Course.model');
const Resume = require('../models/Resume.model');
const User = require('../models/User.model');
const { callMlService } = require('../utils/mlClient');

// @desc    Get all courses
// @route   GET /api/courses
// @access  Private / Public
exports.getCourses = async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: courses.length,
      courses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching courses'
    });
  }
};

// @desc    Get recommended courses based on student's missing skill gaps & domain
// @route   GET /api/courses/recommended
// @access  Private (Student)
exports.getRecommendedCourses = async (req, res) => {
  try {
    const resume = await Resume.findOne({ user: req.user.id, status: 'analyzed' }).sort({ createdAt: -1 });
    const user = await User.findById(req.user.id);

    const candidateDomain = (resume && resume.detectedDomain && resume.detectedDomain !== 'Unknown')
      ? resume.detectedDomain
      : (user?.domain || 'General');

    const candidateSkills = (resume && resume.detectedSkills?.length)
      ? resume.detectedSkills
      : (user?.skills || []);

    // 1. Identify missing skill gaps from cached resume or calculate via ML
    let missingSkills = [];
    if (resume && resume.skillGaps && resume.skillGaps.criticalGaps && resume.skillGaps.criticalGaps.length > 0) {
      missingSkills = [
        ...resume.skillGaps.criticalGaps.map((g) => g.skill),
        ...(resume.skillGaps.growthGaps || []).map((g) => g.skill)
      ];
    } else {
      try {
        const gapData = await callMlService('/api/ml/skill-gaps', {
          candidate_skills: candidateSkills,
          candidate_domain: candidateDomain
        });
        if (gapData && gapData.criticalGaps) {
          missingSkills = [
            ...gapData.criticalGaps.map((g) => g.skill),
            ...(gapData.growthGaps || []).map((g) => g.skill)
          ];
          if (resume) {
            resume.skillGaps = gapData;
            await resume.save();
          }
        }
      } catch (e) {
        console.warn('[CourseController] Live gap calculation fallback:', e.message);
      }
    }

    // 2. Fetch all courses from MongoDB
    const allCourses = await Course.find().lean();

    // 3. Score and prioritize courses that bridge missing skill gaps
    const scoredCourses = allCourses.map((course) => {
      const courseSkill = (course.skillCovered || '').toLowerCase();
      const courseName = (course.courseName || '').toLowerCase();

      // Check if this course bridges any missing skill gap
      const matchedGap = missingSkills.find((gap) => {
        const gapLower = gap.toLowerCase().trim();
        const courseSkillParts = courseSkill.split(',').map((s) => s.trim());
        return (
          courseSkillParts.some((part) => part && (part === gapLower || gapLower.includes(part) || part.includes(gapLower))) ||
          courseSkill.includes(gapLower) ||
          gapLower.includes(courseSkill) ||
          courseName.includes(gapLower)
        );
      });

      const isDomainMatch = course.domain === candidateDomain;

      let priorityScore = 0;
      if (matchedGap) priorityScore += 50;
      if (isDomainMatch) priorityScore += 25;
      priorityScore += (course.rating || 4.5) * 5;

      return {
        ...course,
        bridgesGap: !!matchedGap,
        gapSkill: matchedGap || null,
        isDomainMatch,
        priorityScore
      };
    });

    // Sort descending by priorityScore
    scoredCourses.sort((a, b) => b.priorityScore - a.priorityScore);

    res.status(200).json({
      success: true,
      count: scoredCourses.length,
      targetDomain: candidateDomain,
      identifiedSkillGaps: missingSkills,
      courses: scoredCourses
    });
  } catch (error) {
    console.error('Error fetching recommended courses:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recommended courses'
    });
  }
};
