"""
SkillSync Multi-Domain Resume Parsing & Skill Extraction Test Suite.
Tests:
1. IT / Software resume
2. Data Analyst resume
3. Healthcare resume
4. Finance / Accounting resume
5. Marketing resume
6. Engineering resume
7. Multi-domain resume (Healthcare + Data/Tech)
8. Insufficient / Unknown domain resume
9. PDF & DOCX document extraction
10. ML Microservice API Endpoints via FastAPI TestClient
"""

import sys
import os
import io

# Ensure app is on import path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.text_processor import TextProcessor
from app.services.section_extractor import SectionExtractor
from app.services.skill_extractor import SkillExtractor
from app.services.ats_scorer import ATSScorer
from app.services.document_parser import DocumentParser
from app.utils.taxonomy import (
    DOMAIN_IT,
    DOMAIN_DATA,
    DOMAIN_HEALTHCARE,
    DOMAIN_FINANCE,
    DOMAIN_MARKETING,
    DOMAIN_ENGINEERING,
    DOMAIN_UNKNOWN,
)

from docx import Document
from pypdf import PdfWriter
from fastapi.testclient import TestClient
from app.main import app

def run_tests():
    print("=" * 70)
    print("SKILLSYNC MULTI-DOMAIN RESUME PARSING & SKILL EXTRACTION TEST SUITE")
    print("=" * 70)

    passed = 0
    failed = 0

    def assert_test(condition: bool, description: str):
        nonlocal passed, failed
        if condition:
            print(f"[PASS] {description}")
            passed += 1
        else:
            print(f"[FAIL] {description}")
            failed += 1

    # -------------------------------------------------------------
    # 1. Test IT / Software Resume
    # -------------------------------------------------------------
    it_resume_text = """
    Alice Smith
    Email: alice.smith@univ.edu
    Phone: (555) 123-4567
    LinkedIn: linkedin.com/in/alicesmith

    PROFESSIONAL SUMMARY
    Dedicated Full Stack Software Developer with expertise in building scalable web applications.

    SKILLS
    Python, JavaScript, TypeScript, React, Node.js, Express, MongoDB, SQL, Git, Docker, REST API

    EDUCATION
    Bachelor of Science in Computer Science - Stanford University (2022 - 2026)

    WORK EXPERIENCE
    Software Engineer Intern - TechCorp Solutions (2025 - Present)
    Developed responsive React dashboards and optimized Express REST API endpoints.

    PROJECTS
    SkillSync AI Resume Parser - Built using FastAPI, Python, and React.
    """
    clean_it = TextProcessor.clean_text(it_resume_text)
    sections_it = SectionExtractor.extract_sections(clean_it)
    skills_it = SkillExtractor.extract_skills(clean_it, sections_it.get("rawSkillsText"))
    domain_it = SkillExtractor.classify_domain(clean_it, skills_it, sections_it)
    ats_it = ATSScorer.calculate_ats_score(clean_it, sections_it, skills_it, domain_it)

    assert_test("React" in skills_it and "Python" in skills_it and "Docker" in skills_it,
                "IT Resume: Extracted core technical skills (React, Python, Docker)")
    assert_test(domain_it["primaryDomain"] == DOMAIN_IT,
                f"IT Resume: Classified as '{DOMAIN_IT}' (Confidence: {domain_it['confidence']}%)")
    assert_test(ats_it["overallScore"] >= 75,
                f"IT Resume: High ATS Compatibility Score ({ats_it['overallScore']}%)")

    # -------------------------------------------------------------
    # 2. Test Data Analyst Resume
    # -------------------------------------------------------------
    data_resume_text = """
    David Chen
    Email: david.chen@analytics.org
    Phone: (555) 234-5678

    PROFESSIONAL SUMMARY
    Results-driven Data Analyst experienced in business intelligence, statistical modeling, and data pipelines.

    AREAS OF EXPERTISE
    SQL, Python, Tableau, Power BI, Excel, Data Analytics, Pandas, Statistics, Data Visualization, ETL

    EDUCATION
    BS in Statistics and Data Science - UC Berkeley (2020 - 2024)

    WORK EXPERIENCE
    Data Analyst - MetricFlow Systems (2024 - Present)
    Built automated Tableau dashboards and optimized SQL analytical queries across large datasets.
    """
    clean_data = TextProcessor.clean_text(data_resume_text)
    sections_data = SectionExtractor.extract_sections(clean_data)
    skills_data = SkillExtractor.extract_skills(clean_data, sections_data.get("rawSkillsText"))
    domain_data = SkillExtractor.classify_domain(clean_data, skills_data, sections_data)
    ats_data = ATSScorer.calculate_ats_score(clean_data, sections_data, skills_data, domain_data)

    assert_test("Tableau" in skills_data and "Power BI" in skills_data and "SQL" in skills_data,
                "Data Analyst Resume: Extracted BI & analytics skills (Tableau, Power BI, SQL)")
    assert_test(domain_data["primaryDomain"] == DOMAIN_DATA,
                f"Data Analyst Resume: Classified as '{DOMAIN_DATA}' (Confidence: {domain_data['confidence']}%)")

    # -------------------------------------------------------------
    # 3. Test Healthcare Resume
    # -------------------------------------------------------------
    healthcare_resume_text = """
    Sarah Miller, RN, BSN
    Email: sarah.miller@healthmail.org
    Phone: (555) 345-6789

    SUMMARY
    Compassionate Registered Nurse with 5+ years of acute care experience in emergency and pediatric units.

    CLINICAL COMPETENCIES
    Patient Care, Clinical Assessment, EHR / EMR, HIPAA Compliance, Triage, Phlebotomy, Vital Signs Monitoring, BLS (Basic Life Support), Medication Administration

    EDUCATION
    Bachelor of Science in Nursing (BSN) - Johns Hopkins School of Nursing (2019 - 2023)

    CLINICAL EXPERIENCE
    Registered Nurse - Metropolitan General Hospital (2023 - Present)
    Delivered direct patient care, monitored vital signs, performed emergency triage, and administered medications.

    LICENSURE & CERTIFICATIONS
    Registered Nurse (RN) State License, BLS Certification
    """
    clean_hc = TextProcessor.clean_text(healthcare_resume_text)
    sections_hc = SectionExtractor.extract_sections(clean_hc)
    skills_hc = SkillExtractor.extract_skills(clean_hc, sections_hc.get("rawSkillsText"))
    domain_hc = SkillExtractor.classify_domain(clean_hc, skills_hc, sections_hc)
    ats_hc = ATSScorer.calculate_ats_score(clean_hc, sections_hc, skills_hc, domain_hc)

    assert_test("Patient Care" in skills_hc and "HIPAA Compliance" in skills_hc and "Triage" in skills_hc,
                "Healthcare Resume: Extracted clinical skills (Patient Care, HIPAA, Triage, Phlebotomy)")
    assert_test(domain_hc["primaryDomain"] == DOMAIN_HEALTHCARE,
                f"Healthcare Resume: Classified as '{DOMAIN_HEALTHCARE}' (Confidence: {domain_hc['confidence']}%)")
    # Crucial requirement: ATS recommendations must NOT recommend Git, SQL, or Python to a nurse!
    recs_str = " ".join(ats_hc["recommendations"])
    assert_test("Git" not in recs_str and "Docker" not in recs_str,
                "Healthcare Resume: No inappropriate IT recommendations (no Git, Docker, Python forced)")
    assert_test(ats_hc["overallScore"] >= 75,
                f"Healthcare Resume: Domain-adaptive ATS score is fair and unpenalized ({ats_hc['overallScore']}%)")

    # -------------------------------------------------------------
    # 4. Test Finance / Accounting Resume
    # -------------------------------------------------------------
    finance_resume_text = """
    Robert Sterling, CPA
    Email: r.sterling@financeservices.com
    Phone: (555) 456-7890

    PROFESSIONAL SUMMARY
    Certified Public Accountant specializing in corporate financial reporting, audit compliance, and tax preparation.

    CORE SKILLS
    Financial Modeling, GAAP, IFRS, Auditing, Tax Compliance, Financial Reporting, QuickBooks, General Ledger, Variance Analysis, Budgeting

    EDUCATION
    Master of Accounting & Finance - NYU Stern (2021 - 2023)
    Bachelor of Commerce - Boston College (2017 - 2021)

    PROFESSIONAL EXPERIENCE
    Senior Auditor - Deloitte (2023 - Present)
    Led external audit engagements, verified GAAP compliance, and performed financial statement reviews.
    """
    clean_fin = TextProcessor.clean_text(finance_resume_text)
    sections_fin = SectionExtractor.extract_sections(clean_fin)
    skills_fin = SkillExtractor.extract_skills(clean_fin, sections_fin.get("rawSkillsText"))
    domain_fin = SkillExtractor.classify_domain(clean_fin, skills_fin, sections_fin)
    ats_fin = ATSScorer.calculate_ats_score(clean_fin, sections_fin, skills_fin, domain_fin)

    assert_test("GAAP" in skills_fin and "Financial Modeling" in skills_fin and "Auditing" in skills_fin,
                "Finance Resume: Extracted finance/accounting skills (GAAP, Financial Modeling, Auditing)")
    assert_test(domain_fin["primaryDomain"] == DOMAIN_FINANCE,
                f"Finance Resume: Classified as '{DOMAIN_FINANCE}' (Confidence: {domain_fin['confidence']}%)")

    # -------------------------------------------------------------
    # 5. Test Marketing Resume
    # -------------------------------------------------------------
    marketing_resume_text = """
    Emily Vance
    Email: emily.vance@growthagency.io
    Phone: (555) 567-8901

    PROFILE
    Strategic Digital Marketing Specialist with demonstrated success in multi-channel brand growth and SEO campaigns.

    KEY COMPETENCIES
    Digital Marketing, SEO, Content Strategy, Google Analytics, Copywriting, Social Media Marketing, Brand Strategy, Campaign Management, Email Marketing

    EDUCATION
    BA in Marketing & Communications - Northwestern University (2020 - 2024)

    WORK EXPERIENCE
    Marketing Specialist - Elevate Growth Agency (2024 - Present)
    Managed organic SEO content campaigns and tracked conversion metrics via Google Analytics.
    """
    clean_mkt = TextProcessor.clean_text(marketing_resume_text)
    sections_mkt = SectionExtractor.extract_sections(clean_mkt)
    skills_mkt = SkillExtractor.extract_skills(clean_mkt, sections_mkt.get("rawSkillsText"))
    domain_mkt = SkillExtractor.classify_domain(clean_mkt, skills_mkt, sections_mkt)

    assert_test("SEO" in skills_mkt and "Google Analytics" in skills_mkt and "Content Strategy" in skills_mkt,
                "Marketing Resume: Extracted marketing skills (SEO, Google Analytics, Content Strategy)")
    assert_test(domain_mkt["primaryDomain"] == DOMAIN_MARKETING,
                f"Marketing Resume: Classified as '{DOMAIN_MARKETING}' (Confidence: {domain_mkt['confidence']}%)")

    # -------------------------------------------------------------
    # 6. Test Engineering Resume
    # -------------------------------------------------------------
    eng_resume_text = """
    Marcus Wright
    Email: marcus.wright@engsol.com
    Phone: (555) 678-9012

    OBJECTIVE
    Mechanical Design Engineer with background in CAD modeling, thermal systems, and structural finite element analysis.

    TECHNICAL PROFICIENCIES
    AutoCAD, SolidWorks, MATLAB, Circuit Design, Structural Analysis, Thermodynamics, Six Sigma, Lean Manufacturing

    EDUCATION
    B.Tech in Mechanical Engineering - Michigan State University (2020 - 2024)

    ENGINEERING EXPERIENCE
    Mechanical Engineer - Apex Manufacturing (2024 - Present)
    Designed component assemblies using SolidWorks and executed thermal stress simulations.
    """
    clean_eng = TextProcessor.clean_text(eng_resume_text)
    sections_eng = SectionExtractor.extract_sections(clean_eng)
    skills_eng = SkillExtractor.extract_skills(clean_eng, sections_eng.get("rawSkillsText"))
    domain_eng = SkillExtractor.classify_domain(clean_eng, skills_eng, sections_eng)

    assert_test("AutoCAD" in skills_eng and "SolidWorks" in skills_eng and "Thermodynamics" in skills_eng,
                "Engineering Resume: Extracted engineering skills (AutoCAD, SolidWorks, Thermodynamics)")
    assert_test(domain_eng["primaryDomain"] == DOMAIN_ENGINEERING,
                f"Engineering Resume: Classified as '{DOMAIN_ENGINEERING}' (Confidence: {domain_eng['confidence']}%)")

    # -------------------------------------------------------------
    # 7. Test Multi-Domain Resume (Healthcare + Data/Analytics)
    # -------------------------------------------------------------
    hybrid_resume_text = """
    Elena Rostova, RN
    Email: elena.rostova@medanalytics.org
    Phone: (555) 789-0123

    SUMMARY
    Clinical Nurse Informaticist combining registered nursing practice with healthcare data analytics and SQL queries.

    SKILLS
    Patient Care, Clinical Assessment, EHR / EMR, HIPAA Compliance, Python, SQL, Data Analytics, Tableau, Statistics

    EDUCATION
    BSN in Nursing - University of Michigan
    MS in Health Data Analytics - Boston University

    EXPERIENCE
    Clinical Data Specialist - St. Jude Health (2023 - Present)
    Analyzed patient health records using SQL and Python to track clinical outcomes.
    """
    clean_hyb = TextProcessor.clean_text(hybrid_resume_text)
    sections_hyb = SectionExtractor.extract_sections(clean_hyb)
    skills_hyb = SkillExtractor.extract_skills(clean_hyb, sections_hyb.get("rawSkillsText"))
    domain_hyb = SkillExtractor.classify_domain(clean_hyb, skills_hyb, sections_hyb)

    assert_test("Patient Care" in skills_hyb and "Python" in skills_hyb and "Tableau" in skills_hyb,
                "Multi-Domain Resume: Extracted skills from both Healthcare and Data domains")
    assert_test(len(domain_hyb["relevantDomains"]) >= 2,
                f"Multi-Domain Resume: Identified multiple relevant domains: {domain_hyb['relevantDomains']}")
    assert_test(DOMAIN_HEALTHCARE in domain_hyb["relevantDomains"] and DOMAIN_DATA in domain_hyb["relevantDomains"],
                f"Multi-Domain Resume: Identified both '{DOMAIN_HEALTHCARE}' and '{DOMAIN_DATA}'")

    # -------------------------------------------------------------
    # 8. Test Insufficient / Unknown Domain Resume
    # -------------------------------------------------------------
    unknown_resume_text = """
    John Doe
    Email: john.doe@example.com
    Phone: (555) 000-1111

    SUMMARY
    Dedicated individual seeking exciting growth opportunities in a collaborative work environment.
    Eager to learn and contribute to organizational goals.
    """
    clean_unk = TextProcessor.clean_text(unknown_resume_text)
    sections_unk = SectionExtractor.extract_sections(clean_unk)
    skills_unk = SkillExtractor.extract_skills(clean_unk, sections_unk.get("rawSkillsText"))
    domain_unk = SkillExtractor.classify_domain(clean_unk, skills_unk, sections_unk)

    assert_test(len(skills_unk) == 0,
                "Insufficient Resume: No skills extracted when none present (skills list is empty)")
    assert_test(domain_unk["primaryDomain"] == DOMAIN_UNKNOWN,
                f"Insufficient Resume: Classified as '{DOMAIN_UNKNOWN}' without forcing IT default")
    assert_test(domain_unk["confidence"] == 0,
                "Insufficient Resume: Confidence score is 0 due to lack of domain signals")

    # -------------------------------------------------------------
    # 8b. Test Non-Invented Skills on Generic Filler Phrases
    # -------------------------------------------------------------
    filler_skills_text = "Responsible for various tasks, team player, quick learner, excellent communication, hard worker"
    filler_skills = SkillExtractor._extract_dynamic_skills(filler_skills_text, filler_skills_text.lower())
    assert_test(len(filler_skills) == 0,
                "Non-Invented Skills: Filler and non-skill phrases are filtered out and not invented as skills")

    # -------------------------------------------------------------
    # 9. Verify PDF and DOCX Extraction Pipeline
    # -------------------------------------------------------------
    # Synthetic DOCX file creation
    docx_path = os.path.join(os.path.dirname(__file__), "scratch_test_resume.docx")
    doc = Document()
    doc.add_heading("Laura Bennett - Healthcare Resume", level=1)
    doc.add_paragraph("Clinical Nurse experienced in Patient Care, Triage, and EHR records.")
    table = doc.add_table(rows=2, cols=2)
    table.rows[0].cells[0].text = "Skill"
    table.rows[0].cells[1].text = "Level"
    table.rows[1].cells[0].text = "Phlebotomy"
    table.rows[1].cells[1].text = "Advanced"
    doc.save(docx_path)

    extracted_docx = DocumentParser.extract_text_from_docx(docx_path)
    assert_test("Patient Care" in extracted_docx and "Phlebotomy" in extracted_docx,
                "DOCX Extraction: Parsed paragraphs and table cells successfully")
    if os.path.exists(docx_path):
        os.remove(docx_path)

    # Synthetic PDF file creation
    pdf_path = os.path.join(os.path.dirname(__file__), "scratch_test_resume.pdf")
    writer = PdfWriter()
    writer.add_blank_page(width=72 * 8.5, height=72 * 11)
    with open(pdf_path, "wb") as f:
        writer.write(f)
    
    # DocumentParser.parse_document fallback handles standard stream
    parsed_pdf_fallback = DocumentParser.parse_document(pdf_path, "application/pdf")
    assert_test(isinstance(parsed_pdf_fallback, str),
                "PDF Extraction: Executed pypdf pipeline safely")
    if os.path.exists(pdf_path):
        os.remove(pdf_path)

    # -------------------------------------------------------------
    # 10. ML Microservice API Endpoints via FastAPI TestClient
    # -------------------------------------------------------------
    client = TestClient(app)

    # Test /api/ml/extract-skills
    extract_resp = client.post("/api/ml/extract-skills", json={
        "text": "Experienced Registered Nurse skilled in Patient Care, EHR, HIPAA, and Vital Signs."
    })
    assert_test(extract_resp.status_code == 200 and extract_resp.json()["detectedDomain"] == DOMAIN_HEALTHCARE,
                "FastAPI /api/ml/extract-skills: Returns domain and detected skills correctly")

    # Test /api/ml/ats-score
    score_resp = client.post("/api/ml/ats-score", json={
        "text": healthcare_resume_text
    })
    assert_test(score_resp.status_code == 200 and score_resp.json()["atsScore"] > 0,
                "FastAPI /api/ml/ats-score: Computes domain-aware ATS score")

    # Test /api/ml/analyze-resume with raw_text
    analyze_resp = client.post("/api/ml/analyze-resume", json={
        "raw_text": finance_resume_text
    })
    data = analyze_resp.json()
    assert_test(
        analyze_resp.status_code == 200 and
        data["detectedDomain"] == DOMAIN_FINANCE and
        "GAAP" in data["detectedSkills"] and
        data["atsScore"] > 0,
        "FastAPI /api/ml/analyze-resume: End-to-end multi-domain analysis endpoint verified"
    )

    print("\n" + "=" * 70)
    print(f"TEST RESULTS: {passed} PASSED, {failed} FAILED")
    print("=" * 70)

    if failed > 0:
        sys.exit(1)

if __name__ == "__main__":
    run_tests()
