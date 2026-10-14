from typing import List, Dict, Any, Optional
from app.utils.taxonomy import (
    DOMAIN_ESSENTIAL_SKILLS,
    DOMAIN_IT,
    DOMAIN_UNKNOWN,
    DOMAIN_ENGINEERING,
)

class ATSScorer:
    # Retain ESSENTIAL_COMMON_SKILLS for backward compatibility with existing tests/references
    ESSENTIAL_COMMON_SKILLS = [
        "Git", "SQL", "Python", "JavaScript", "React",
        "Node.js", "Docker", "REST API", "HTML", "CSS"
    ]

    @classmethod
    def calculate_ats_score(
        cls,
        text: str,
        sections: dict,
        detected_skills: list,
        domain_info: Optional[Dict[str, Any]] = None
    ) -> dict:
        """
        Calculate transparent, domain-adaptive, rule-based ATS score breakdown and recommendations.
        Adapts evaluation criteria based on detected professional domain.
        """
        primary_domain = (domain_info or {}).get("primaryDomain", DOMAIN_IT)
        if not primary_domain:
            primary_domain = DOMAIN_IT

        # 1. Section Completeness Score (Max 100)
        section_weights = {
            "contact": 20,
            "skills": 25,
            "education": 20,
            "experience": 20,
            "projects": 15
        }
        
        completeness_score = 0
        contact_info = sections.get("contact", {})
        if contact_info.get("email") or contact_info.get("phone"):
            completeness_score += section_weights["contact"]
            
        if detected_skills:
            completeness_score += section_weights["skills"]
            
        if sections.get("education"):
            completeness_score += section_weights["education"]
            
        experience_items = sections.get("experience", [])
        if experience_items:
            completeness_score += section_weights["experience"]
            
        project_items = sections.get("projects", [])
        cert_items = sections.get("certifications", [])

        # For IT and Engineering, Projects section is standard (15 points).
        # For non-engineering domains (Healthcare, Education, HR, Finance),
        # clinical rotations, case studies, or certifications/licenses satisfy this criterion.
        if project_items:
            completeness_score += section_weights["projects"]
        elif primary_domain not in [DOMAIN_IT, DOMAIN_ENGINEERING]:
            if cert_items or len(experience_items) >= 2:
                completeness_score += section_weights["projects"]

        # 2. Skills Score (Max 100)
        # 1 skill = 15%, 5+ skills = 75-100%
        skills_count = len(detected_skills)
        skills_score = min(100, skills_count * 15)

        # 3. Education Score (Max 100)
        education_score = 100 if sections.get("education") else 30

        # 4. Experience Score (Max 100)
        experience_score = min(100, len(experience_items) * 35) if experience_items else 40

        # 5. Project Score (Max 100)
        if project_items:
            project_score = min(100, len(project_items) * 35)
        elif primary_domain not in [DOMAIN_IT, DOMAIN_ENGINEERING] and experience_items:
            # Domain-adaptive: practical experience / certifications substitute for projects
            project_score = min(90, len(experience_items) * 30 + (25 if cert_items else 0))
        else:
            project_score = 40

        # 6. Keyword Relevance Score (Max 100)
        text_length = len(text.split())
        if text_length < 100:
            keyword_score = 40
        elif text_length < 250:
            keyword_score = 65
        elif text_length < 800:
            keyword_score = 85
        else:
            keyword_score = 95

        # Overall Weighted Score Calculation
        overall_score = round(
            (completeness_score * 0.30) +
            (skills_score * 0.25) +
            (keyword_score * 0.15) +
            (experience_score * 0.15) +
            (education_score * 0.10) +
            (project_score * 0.05)
        )

        # Domain-Adaptive Essential Skills Identification
        domain_essential = DOMAIN_ESSENTIAL_SKILLS.get(primary_domain, cls.ESSENTIAL_COMMON_SKILLS)
        if primary_domain == DOMAIN_UNKNOWN:
            missing_common_skills = []
        else:
            missing_common_skills = [
                skill for skill in domain_essential
                if skill not in detected_skills
            ]

        # Generate Domain-Aware Actionable Recommendations
        recommendations = []
        if not contact_info.get("email"):
            recommendations.append("Add a clear email address in your contact header.")
        if not contact_info.get("phone"):
            recommendations.append("Include a phone number for recruiter contact.")

        if skills_count < 5:
            if primary_domain in [DOMAIN_IT, DOMAIN_UNKNOWN]:
                recommendations.append("List more technical skills and frameworks in your Skills section.")
            else:
                recommendations.append(f"List more {primary_domain} skills and core competencies in your Skills section.")

        if not sections.get("experience"):
            if primary_domain == "Healthcare":
                recommendations.append("Add a Clinical Experience or Healthcare Practice section to boost ATS relevance.")
            elif primary_domain == "Education":
                recommendations.append("Add a Teaching Experience or Academic History section to boost ATS relevance.")
            else:
                recommendations.append("Add a Work Experience or Internship section to boost ATS relevance.")

        # Project recommendation tailored by domain
        if not project_items:
            if primary_domain in [DOMAIN_IT, DOMAIN_ENGINEERING]:
                recommendations.append("Include a Projects section highlighting technologies used.")
            elif not cert_items and primary_domain != DOMAIN_UNKNOWN:
                recommendations.append("Include relevant case studies, certifications, or specialized initiatives.")

        if text_length < 200:
            recommendations.append("Expand your resume content with quantifiable achievements and descriptions.")

        if missing_common_skills:
            if primary_domain == DOMAIN_IT:
                # Retain exact Phase 4 recommendation wording for IT
                recommendations.append(f"Consider adding foundational skills if applicable: {', '.join(missing_common_skills[:3])}.")
            elif primary_domain != DOMAIN_UNKNOWN:
                recommendations.append(f"Consider highlighting core {primary_domain} competencies: {', '.join(missing_common_skills[:3])}.")

        if not recommendations:
            recommendations.append("Great job! Your resume meets essential ATS formatting and keyword benchmarks.")

        return {
            "overallScore": min(100, max(0, overall_score)),
            "keywordScore": min(100, keyword_score),
            "skillsScore": min(100, skills_score),
            "sectionCompletenessScore": min(100, completeness_score),
            "educationScore": min(100, education_score),
            "experienceScore": min(100, experience_score),
            "projectScore": min(100, project_score),
            "detectedSkills": detected_skills,
            "detectedDomain": primary_domain,
            "missingCommonSkills": missing_common_skills,
            "recommendations": recommendations
        }
