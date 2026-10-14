"""
SkillSync AI Job Matching & Skill Gap Analysis Engine.
Implements pure-Python TF-IDF vectorization, Cosine Similarity,
Skill Overlap evaluation, and Domain-Adaptive Skill Gap Prioritization.
"""

import math
import re
from typing import List, Dict, Any, Optional
from app.utils.taxonomy import DOMAIN_ESSENTIAL_SKILLS, ALL_DOMAINS

class JobMatcher:
    STOP_WORDS = {
        "a", "about", "above", "after", "again", "against", "all", "am", "an", "and",
        "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being",
        "below", "between", "both", "but", "by", "can", "cannot", "could", "did",
        "do", "does", "doing", "down", "during", "each", "few", "for", "from",
        "further", "had", "has", "have", "having", "he", "her", "here", "hers",
        "herself", "him", "himself", "his", "how", "i", "if", "in", "into", "is",
        "it", "its", "itself", "let's", "me", "more", "most", "my", "myself", "no",
        "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought",
        "our", "ours", "ourselves", "out", "over", "own", "same", "she", "should",
        "so", "some", "such", "than", "that", "the", "their", "theirs", "them",
        "themselves", "then", "there", "these", "they", "this", "those", "through",
        "to", "too", "under", "until", "up", "very", "was", "we", "were", "what",
        "when", "where", "which", "while", "who", "whom", "why", "with", "would",
        "you", "your", "yours", "yourself", "yourselves"
    }

    @classmethod
    def _tokenize(cls, text: str) -> List[str]:
        """Convert text into cleaned, lowercased word tokens excluding stop words."""
        if not text:
            return []
        words = re.findall(r'[a-zA-Z0-9+#.-]+', text.lower())
        return [w for w in words if w not in cls.STOP_WORDS and len(w) > 1]

    @classmethod
    def compute_cosine_similarity(cls, text1: str, text2: str) -> float:
        """
        Compute TF-IDF Cosine Similarity between two text passages.
        Returns a float between 0.0 and 1.0.
        """
        tokens1 = cls._tokenize(text1)
        tokens2 = cls._tokenize(text2)

        if not tokens1 or not tokens2:
            return 0.0

        # Term frequency for each document
        tf1 = {}
        for t in tokens1:
            tf1[t] = tf1.get(t, 0) + 1
        tf2 = {}
        for t in tokens2:
            tf2[t] = tf2.get(t, 0) + 1

        all_terms = set(tf1.keys()).union(set(tf2.keys()))
        doc_count = 2

        # Compute TF-IDF vectors
        vec1 = {}
        vec2 = {}
        for term in all_terms:
            df = (1 if term in tf1 else 0) + (1 if term in tf2 else 0)
            idf = math.log((1 + doc_count) / (1 + df)) + 1.0
            vec1[term] = (tf1.get(term, 0) / len(tokens1)) * idf
            vec2[term] = (tf2.get(term, 0) / len(tokens2)) * idf

        # Dot product and magnitudes
        dot_product = sum(vec1[t] * vec2[t] for t in all_terms)
        mag1 = math.sqrt(sum(v ** 2 for v in vec1.values()))
        mag2 = math.sqrt(sum(v ** 2 for v in vec2.values()))

        if mag1 == 0 or mag2 == 0:
            return 0.0

        similarity = dot_product / (mag1 * mag2)
        return min(1.0, max(0.0, similarity))

    @classmethod
    def match_single_job(
        cls,
        candidate_skills: List[str],
        candidate_domain: str,
        candidate_relevant_domains: List[str],
        candidate_text: str,
        job: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Evaluate match compatibility between candidate profile and a specific job posting.
        Returns:
            matchScore: int (0 to 100)
            matchedSkills: List[str]
            missingSkills: List[str]
            skillMatchRate: float
            domainAlignment: str ("High", "Moderate", "Low")
            priority: str ("High Match", "Moderate Fit", "Potential Fit")
            explanation: str
        """
        job_skills = job.get("requiredSkills", [])
        job_domain = job.get("domain", "General")
        job_title = job.get("title", "")
        job_description = job.get("description", "")

        # 1. Skill Intersection Evaluation
        candidate_skills_lower = {s.lower(): s for s in candidate_skills}
        matched_skills = []
        missing_skills = []

        for req_skill in job_skills:
            req_lower = req_skill.lower()
            # Direct match or substring word boundary match
            if req_lower in candidate_skills_lower:
                matched_skills.append(req_skill)
            elif any(req_lower == cs or req_lower in cs.split() for cs in candidate_skills_lower.keys()):
                matched_skills.append(req_skill)
            else:
                missing_skills.append(req_skill)

        total_req = len(job_skills)
        skill_ratio = len(matched_skills) / max(total_req, 1)

        # 2. Domain Alignment Evaluation
        cand_domain = candidate_domain or "Unknown"
        rel_domains = candidate_relevant_domains or [cand_domain]

        if job_domain in rel_domains or job_domain == cand_domain:
            domain_score = 1.0
            domain_alignment = "High"
        elif job_domain == "General" or cand_domain == "Unknown":
            domain_score = 0.75
            domain_alignment = "Moderate"
        elif (
            (cand_domain == "IT and Software Development" and job_domain == "Data Science and Data Analytics")
            or (cand_domain == "Data Science and Data Analytics" and job_domain == "IT and Software Development")
            or (cand_domain == "Finance and Accounting" and job_domain == "Business and Management")
        ):
            domain_score = 0.70
            domain_alignment = "Moderate"
        else:
            domain_score = 0.25
            domain_alignment = "Low"

        # 3. TF-IDF Text & Context Semantic Similarity
        cand_context = f"{cand_domain} {' '.join(rel_domains)} {' '.join(candidate_skills)} {candidate_text[:1200]}"
        job_context = f"{job_domain} {job_title} {' '.join(job_skills)} {job_description}"
        text_similarity = cls.compute_cosine_similarity(cand_context, job_context)

        # 4. Composite Match Percentage
        # Weights: 60% skill coverage, 25% domain alignment, 15% semantic text similarity
        composite = (skill_ratio * 0.60) + (domain_score * 0.25) + (text_similarity * 0.15)
        match_score = round(min(100, max(5, composite * 100)))

        # 5. Explainable Priority & Narrative
        if match_score >= 75:
            priority = "High Match"
        elif match_score >= 50:
            priority = "Moderate Fit"
        else:
            priority = "Skill Stretch"

        # Construct clear explanation
        if total_req > 0:
            skill_summary = f"Matched {len(matched_skills)} of {total_req} required skills ({round(skill_ratio * 100)}% coverage)."
        else:
            skill_summary = "Job requirements are open-ended."

        if missing_skills:
            missing_summary = f"Key skills to bridge: {', '.join(missing_skills[:3])}."
        else:
            missing_summary = "Complete skill coverage achieved."

        explanation = f"{skill_summary} {domain_alignment} domain alignment with {job_domain}. {missing_summary}"

        return {
            "matchScore": match_score,
            "matchedSkills": matched_skills,
            "missingSkills": missing_skills,
            "skillMatchRate": round(skill_ratio * 100),
            "domainAlignment": domain_alignment,
            "priority": priority,
            "explanation": explanation
        }

    @classmethod
    def rank_jobs(
        cls,
        candidate_skills: List[str],
        candidate_domain: str,
        candidate_relevant_domains: List[str],
        candidate_text: str,
        jobs: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Rank a collection of jobs by match percentage descending for candidate recommendations.
        """
        ranked = []
        for job in jobs:
            match_details = cls.match_single_job(
                candidate_skills=candidate_skills,
                candidate_domain=candidate_domain,
                candidate_relevant_domains=candidate_relevant_domains,
                candidate_text=candidate_text,
                job=job
            )
            # Combine job data with match details
            combined = dict(job)
            combined.update(match_details)
            ranked.append(combined)

        # Sort by matchScore descending
        return sorted(ranked, key=lambda j: j.get("matchScore", 0), reverse=True)

    @classmethod
    def analyze_skill_gaps(
        cls,
        candidate_skills: List[str],
        candidate_domain: str,
        jobs: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Perform prioritized domain skill gap analysis.
        Compares candidate's verified skills against:
        1. Essential foundational skills for their detected domain
        2. Market frequencies from active job postings in the domain
        
        Returns:
            readinessScore: int (0 to 100)
            possessedSkills: List[str]
            criticalGaps: List[Dict[str, Any]] (High Priority)
            growthGaps: List[Dict[str, Any]] (Medium Priority)
            targetDomain: str
            summaryText: str
        """
        cand_lower = {s.lower(): s for s in candidate_skills}
        domain = candidate_domain if candidate_domain in ALL_DOMAINS else "IT and Software Development"

        # Domain essential benchmark skills
        benchmark_skills = DOMAIN_ESSENTIAL_SKILLS.get(domain, [])

        # Count frequencies in active jobs if provided
        job_skill_freq = {}
        if jobs:
            for job in jobs:
                if job.get("domain") == domain or not job.get("domain"):
                    for skill in job.get("requiredSkills", []):
                        job_skill_freq[skill] = job_skill_freq.get(skill, 0) + 1

        # Classify gaps into Critical (High) and Growth (Medium)
        critical_gaps = []
        growth_gaps = []

        # 1. Essential skills missing are Critical Gaps
        for b_skill in benchmark_skills:
            if b_skill.lower() not in cand_lower:
                critical_gaps.append({
                    "skill": b_skill,
                    "priority": "High Priority",
                    "reason": f"Core foundational competency required for {domain} roles.",
                    "demand": "High"
                })

        # 2. Frequent job skills missing are Growth Gaps
        for j_skill, freq in sorted(job_skill_freq.items(), key=lambda x: x[1], reverse=True):
            if j_skill.lower() not in cand_lower and not any(g["skill"].lower() == j_skill.lower() for g in critical_gaps):
                growth_gaps.append({
                    "skill": j_skill,
                    "priority": "Medium Priority",
                    "reason": f"Active market requirement appearing in {freq} open roles.",
                    "demand": "Moderate"
                })

        # Calculate readiness percentage
        total_bench = len(benchmark_skills)
        matched_bench = sum(1 for b in benchmark_skills if b.lower() in cand_lower)
        readiness_score = round(min(100, max(15, (matched_bench / max(total_bench, 1)) * 100)))

        summary_text = (
            f"You possess {len(candidate_skills)} validated skills with {readiness_score}% "
            f"readiness against the {domain} industry benchmark. "
            f"Closing {len(critical_gaps)} critical skill gaps will maximize your match score."
        )

        return {
            "targetDomain": domain,
            "readinessScore": readiness_score,
            "possessedSkills": candidate_skills,
            "criticalGaps": critical_gaps[:6],
            "growthGaps": growth_gaps[:6],
            "totalGapsCount": len(critical_gaps) + len(growth_gaps),
            "summaryText": summary_text
        }
