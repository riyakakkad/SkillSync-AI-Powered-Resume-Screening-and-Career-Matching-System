import re
from typing import List, Dict, Any, Optional
from app.utils.taxonomy import (
    DOMAIN_TAXONOMY,
    DOMAIN_INDICATORS,
    DOMAIN_UNKNOWN,
    DOMAIN_IT,
    ALL_DOMAINS,
)

class SkillExtractor:
    # Flatten all domain taxonomy entries into SKILL_VOCABULARY for backward compatibility
    # and direct taxonomy lookups.
    SKILL_VOCABULARY: Dict[str, List[str]] = {}
    for _domain, _skills in DOMAIN_TAXONOMY.items():
        for _skill, _patterns in _skills.items():
            if _skill not in SKILL_VOCABULARY:
                SKILL_VOCABULARY[_skill] = list(_patterns)
            else:
                for _p in _patterns:
                    if _p not in SKILL_VOCABULARY[_skill]:
                        SKILL_VOCABULARY[_skill].append(_p)

    # Common non-skill phrases to filter out from dynamic in-section extraction
    STOP_PHRASES = {
        "etc", "other", "others", "and", "or", "various", "including",
        "proficient in", "knowledge of", "experience with", "familiar with",
        "strong background in", "ability to", "responsible for", "team player",
        "excellent communication", "problem solver", "hard worker", "work ethic",
        "proven track record", "results oriented", "self motivated", "quick learner",
        "good communication skills", "analytical skills", "soft skills"
    }

    @classmethod
    def extract_skills(cls, text: str, skills_section_text: Optional[str] = None) -> List[str]:
        """
        Extract detected skills from candidate resume text across all supported domains.
        Supports both multi-domain taxonomy matching and dynamic in-section extraction
        from candidate-declared skills.
        """
        if not text or not text.strip():
            return []

        lower_text = text.lower()
        detected_skills = set()

        # Step 1: Match against multi-domain taxonomy
        for skill_name, patterns in cls.SKILL_VOCABULARY.items():
            for pattern in patterns:
                if re.search(pattern, lower_text, re.IGNORECASE):
                    detected_skills.add(skill_name)
                    break

        # Step 2: Dynamic in-section extraction from candidate's explicit skills section if available
        if skills_section_text and skills_section_text.strip():
            dynamic_skills = cls._extract_dynamic_skills(skills_section_text, lower_text)
            for ds in dynamic_skills:
                detected_skills.add(ds)

        return sorted(list(detected_skills))

    @classmethod
    def _extract_dynamic_skills(cls, section_text: str, full_lower_text: str) -> List[str]:
        """
        Extract clean, candidate-declared skill tokens from the candidate's skills section text.
        Guarantees that no skills are invented: each extracted candidate skill must be
        verifiable in the resume text.
        """
        extracted = []
        # Split section on bullet points, commas, semicolons, pipes, or newlines
        raw_tokens = re.split(r'[\n\r,;•|*▪►–—]+', section_text)

        for raw_token in raw_tokens:
            token = raw_token.strip()
            # Clean leading/trailing punctuation
            token = re.sub(r'^[^\w#+]+|[^\w#+]+$', '', token).strip()

            if not token:
                continue

            lower_token = token.lower()

            # Skip common filler or header artifacts
            if lower_token in cls.STOP_PHRASES:
                continue

            # Skip action verbs, sentence fragments, or filler prefixes
            DISQUALIFIED_PREFIXES = (
                "responsible for", "assisted with", "participated in", "worked on",
                "handled", "managed", "experienced in", "strong knowledge of",
                "proficient in", "knowledge of", "experience with", "familiar with",
                "duties include", "tasks include", "including", "such as", "ability to"
            )
            if any(lower_token.startswith(p) for p in DISQUALIFIED_PREFIXES):
                continue

            # Skip common non-skill words in token
            DISQUALIFIED_WORDS = {
                "tasks", "duties", "responsibilities", "responsible", "etc", "various", "things"
            }
            if any(w in DISQUALIFIED_WORDS for w in lower_token.split()):
                continue

            # Length and word count boundaries (skills are typically 1 to 4 words)
            word_count = len(token.split())
            if len(token) < 2 or len(token) > 40 or word_count > 5:
                continue

            # Skip tokens with numbers only or email/url fragments
            if token.isdigit() or "@" in token or "http" in lower_token or ".com" in lower_token:
                continue

            # Verify that the token actually exists in the full resume text
            if lower_token in full_lower_text:
                # Check if it matches an existing canonical skill in taxonomy (normalization)
                canonical_match = None
                for canon_name, patterns in cls.SKILL_VOCABULARY.items():
                    if canon_name.lower() == lower_token:
                        canonical_match = canon_name
                        break
                    for p in patterns:
                        if re.fullmatch(p, lower_token):
                            canonical_match = canon_name
                            break
                    if canonical_match:
                        break

                if canonical_match:
                    extracted.append(canonical_match)
                else:
                    # Format title-cased skill if it's a valid domain phrase
                    cleaned_name = " ".join(
                        w.upper() if len(w) <= 3 and w.isupper() else w.capitalize()
                        for w in token.split()
                    )
                    extracted.append(cleaned_name)

        return extracted

    @classmethod
    def classify_domain(
        cls,
        text: str,
        detected_skills: List[str],
        sections: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Detect a candidate's primary and relevant professional domains using:
        - Extracted skills matching specific domain taxonomies
        - Resume sections (experience, education, summary)
        - Target qualifications, degrees, and job titles
        
        Returns:
            primaryDomain: str (e.g. "Healthcare", "Finance and Accounting", or "Unknown")
            relevantDomains: List[str] (all domains with significant evidence)
            confidence: int (0 to 100 percentage)
            domainScores: Dict[str, int]
            domainSkills: Dict[str, List[str]]
        """
        if not text:
            return {
                "primaryDomain": DOMAIN_UNKNOWN,
                "relevantDomains": [],
                "confidence": 0,
                "domainScores": {d: 0 for d in ALL_DOMAINS},
                "domainSkills": {d: [] for d in ALL_DOMAINS}
            }

        lower_text = text.lower()
        domain_scores = {d: 0 for d in ALL_DOMAINS}
        domain_skills = {d: [] for d in ALL_DOMAINS}

        # 1. Evaluate detected skills against each domain taxonomy
        for skill in detected_skills:
            for domain_name, taxonomy in DOMAIN_TAXONOMY.items():
                if skill in taxonomy:
                    domain_skills[domain_name].append(skill)
                    # Skills unique to a domain provide strong domain evidence
                    domain_scores[domain_name] += 3

        # Disambiguation: some skills overlap (e.g. Python, SQL, Excel).
        # We also evaluate domain indicators (job titles, degrees, role terms)
        experience_text = ""
        education_text = ""
        summary_text = ""
        if sections:
            exp_items = sections.get("experience", [])
            experience_text = " ".join(exp_items).lower() if isinstance(exp_items, list) else str(exp_items).lower()
            edu_items = sections.get("education", [])
            education_text = " ".join(edu_items).lower() if isinstance(edu_items, list) else str(edu_items).lower()
            summary_text = str(sections.get("summary", "")).lower()

        searchable_profile = f"{summary_text} {experience_text} {education_text} {lower_text}"

        # 2. Evaluate Domain Indicators (Job Titles & Degrees)
        for domain_name, indicators in DOMAIN_INDICATORS.items():
            # Check job title patterns
            for title_pat in indicators.get("titles", []):
                matches = re.findall(title_pat, searchable_profile)
                if matches:
                    # Titles are high-confidence evidence
                    domain_scores[domain_name] += min(15, len(matches) * 5)

            # Check educational degrees / field of study patterns
            for degree_pat in indicators.get("degrees", []):
                matches = re.findall(degree_pat, searchable_profile)
                if matches:
                    # Degrees are strong corroborating evidence
                    domain_scores[domain_name] += min(12, len(matches) * 4)

        # 3. Determine Primary and Relevant Domains
        max_score = max(domain_scores.values()) if domain_scores else 0
        total_score = sum(domain_scores.values())

        # If insufficient evidence (e.g. no identifiable domain signals), return "Unknown"
        # Minimum threshold: at least 4 evidence points required
        if max_score < 4 or total_score == 0:
            return {
                "primaryDomain": DOMAIN_UNKNOWN,
                "relevantDomains": [],
                "confidence": 0,
                "domainScores": domain_scores,
                "domainSkills": domain_skills
            }

        # Sort domains by score descending
        sorted_domains = sorted(domain_scores.items(), key=lambda item: item[1], reverse=True)
        primary_domain = sorted_domains[0][0]

        # Calculate confidence percentage (relative to total domain evidence)
        confidence = round(min(100, (max_score / max(total_score, 1)) * 100))
        # Ensure minimum visible confidence for unambiguous primary
        if confidence < 40 and max_score >= 10:
            confidence = 50

        # Multi-Domain Detection:
        # Include all domains with meaningful evidence (score >= 6 and score >= 40% of max_score)
        relevant_domains = []
        for d_name, d_score in sorted_domains:
            if d_score >= 5 and (d_score >= 0.35 * max_score or d_score >= 8):
                relevant_domains.append(d_name)

        if not relevant_domains:
            relevant_domains = [primary_domain]

        return {
            "primaryDomain": primary_domain,
            "relevantDomains": relevant_domains,
            "confidence": confidence,
            "domainScores": domain_scores,
            "domainSkills": domain_skills
        }
