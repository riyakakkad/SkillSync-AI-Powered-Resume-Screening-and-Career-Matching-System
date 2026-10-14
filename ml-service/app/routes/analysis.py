from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os

from app.services.document_parser import DocumentParser
from app.services.text_processor import TextProcessor
from app.services.section_extractor import SectionExtractor
from app.services.skill_extractor import SkillExtractor
from app.services.ats_scorer import ATSScorer
from app.services.job_matcher import JobMatcher

router = APIRouter(prefix="/api/ml", tags=["Resume Analysis & Matching"])

class AnalyzeResumeRequest(BaseModel):
    file_path: Optional[str] = None
    file_type: Optional[str] = None
    raw_text: Optional[str] = None

class ExtractSkillsRequest(BaseModel):
    text: str

class ATSScoreRequest(BaseModel):
    text: str
    sections: Optional[Dict[str, Any]] = None
    skills: Optional[List[str]] = None

class MatchJobsRequest(BaseModel):
    candidate_skills: List[str]
    candidate_domain: Optional[str] = "Unknown"
    candidate_relevant_domains: Optional[List[str]] = None
    candidate_text: Optional[str] = ""
    jobs: List[Dict[str, Any]]

class SkillGapsRequest(BaseModel):
    candidate_skills: List[str]
    candidate_domain: Optional[str] = "Unknown"
    jobs: Optional[List[Dict[str, Any]]] = None

@router.post("/analyze-resume")
def analyze_resume(request: AnalyzeResumeRequest):
    """
    Full Multi-Domain ML Resume Analysis Pipeline:
    Extract text, clean, parse sections, extract skills (taxonomy + dynamic),
    detect professional domain, and compute domain-adaptive ATS score.
    """
    try:
        raw_text = ""
        if request.file_path:
            if not os.path.exists(request.file_path):
                raise HTTPException(status_code=404, detail=f"File not found on server disk: {request.file_path}")
            raw_text = DocumentParser.parse_document(request.file_path, request.file_type)
        elif request.raw_text:
            raw_text = request.raw_text
        else:
            raise HTTPException(status_code=400, detail="Provide either file_path or raw_text to analyze.")

        if not raw_text or not raw_text.strip():
            raise HTTPException(status_code=400, detail="Extracted document text is empty.")

        # Step 2: Clean and normalize text
        cleaned_text = TextProcessor.clean_text(raw_text)

        # Step 3: Extract structured sections across multiple domains
        parsed_data = SectionExtractor.extract_sections(cleaned_text)

        # Step 4: Extract multi-domain skills (both taxonomy and dynamic in-section)
        raw_skills_text = parsed_data.get("rawSkillsText", "")
        detected_skills = SkillExtractor.extract_skills(cleaned_text, skills_section_text=raw_skills_text)
        parsed_data["skills"] = detected_skills

        # Step 5: Detect candidate's professional domain
        domain_info = SkillExtractor.classify_domain(cleaned_text, detected_skills, parsed_data)
        parsed_data["detectedDomain"] = domain_info["primaryDomain"]
        parsed_data["relevantDomains"] = domain_info["relevantDomains"]
        parsed_data["domainConfidence"] = domain_info["confidence"]

        # Step 6: Calculate domain-adaptive ATS score breakdown
        ats_breakdown = ATSScorer.calculate_ats_score(
            cleaned_text,
            parsed_data,
            detected_skills,
            domain_info=domain_info
        )

        return {
            "success": True,
            "extractedText": cleaned_text,
            "parsedData": parsed_data,
            "detectedSkills": detected_skills,
            "atsScore": ats_breakdown["overallScore"],
            "atsBreakdown": ats_breakdown,
            # Additive multi-domain fields (preserving backward compatibility)
            "detectedDomain": domain_info["primaryDomain"],
            "relevantDomains": domain_info["relevantDomains"],
            "domainConfidence": domain_info["confidence"],
            "domainScores": domain_info["domainScores"],
            "domainSkills": domain_info["domainSkills"]
        }

    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ML Service Analysis Error: {str(e)}")

@router.post("/extract-skills")
def extract_skills(request: ExtractSkillsRequest):
    """Standalone multi-domain skill extraction API."""
    skills = SkillExtractor.extract_skills(request.text)
    domain_info = SkillExtractor.classify_domain(request.text, skills)
    return {
        "success": True,
        "count": len(skills),
        "skills": skills,
        "detectedDomain": domain_info["primaryDomain"],
        "relevantDomains": domain_info["relevantDomains"],
        "domainConfidence": domain_info["confidence"],
        "domainSkills": domain_info["domainSkills"]
    }

@router.post("/ats-score")
def calculate_ats_score(request: ATSScoreRequest):
    """Standalone domain-adaptive ATS score calculation API."""
    sections = request.sections or SectionExtractor.extract_sections(request.text)
    skills = request.skills or SkillExtractor.extract_skills(request.text)
    domain_info = SkillExtractor.classify_domain(request.text, skills, sections)
    ats_result = ATSScorer.calculate_ats_score(request.text, sections, skills, domain_info=domain_info)
    return {
        "success": True,
        "atsScore": ats_result["overallScore"],
        "atsBreakdown": ats_result,
        "detectedDomain": domain_info["primaryDomain"]
    }

@router.post("/match-jobs")
def match_jobs(request: MatchJobsRequest):
    """
    Match and rank candidate profile against job postings.
    Uses TF-IDF Cosine Similarity, Skill Overlap, and Domain Alignment.
    """
    try:
        ranked_jobs = JobMatcher.rank_jobs(
            candidate_skills=request.candidate_skills,
            candidate_domain=request.candidate_domain or "Unknown",
            candidate_relevant_domains=request.candidate_relevant_domains or [request.candidate_domain or "Unknown"],
            candidate_text=request.candidate_text or "",
            jobs=request.jobs
        )
        return {
            "success": True,
            "count": len(ranked_jobs),
            "jobs": ranked_jobs
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Job Matching Error: {str(e)}")

@router.post("/skill-gaps")
def analyze_skill_gaps(request: SkillGapsRequest):
    """
    Perform domain-adaptive skill gap analysis.
    Identifies Critical (High Priority) and Growth (Medium Priority) missing skills.
    """
    try:
        gap_results = JobMatcher.analyze_skill_gaps(
            candidate_skills=request.candidate_skills,
            candidate_domain=request.candidate_domain or "Unknown",
            jobs=request.jobs
        )
        return {
            "success": True,
            **gap_results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Skill Gap Analysis Error: {str(e)}")

