import re

class SectionExtractor:
    SECTION_HEADERS = {
        "summary": [
            "summary", "profile", "about me", "objective", "professional summary",
            "career objective", "executive summary", "overview", "professional profile", "career summary"
        ],
        "skills": [
            "skills", "technical skills", "technologies", "core competencies",
            "competencies", "areas of expertise", "key skills", "professional skills",
            "clinical skills", "technical & clinical skills", "functional skills",
            "tools", "skills & tools", "specialties", "technical proficiencies",
            "key strengths", "core strengths", "expertise"
        ],
        "education": [
            "education", "academic background", "qualifications", "education & training",
            "academic history", "educational qualifications", "degrees & credentials", "educational background"
        ],
        "experience": [
            "experience", "work experience", "employment history", "work history",
            "professional experience", "internships", "clinical experience", "clinical rotations",
            "residency", "teaching experience", "teaching history", "audit experience",
            "accounting experience", "field experience", "practical experience", "work background"
        ],
        "projects": [
            "projects", "personal projects", "academic projects", "key projects",
            "technical projects", "case studies", "campaigns", "portfolio",
            "research & publications", "selected transactions", "design projects",
            "consulting projects", "key engagements"
        ],
        "certifications": [
            "certifications", "licenses", "licensure", "courses", "certificates",
            "credentials", "board certifications", "professional certifications",
            "accreditations", "licensure & certifications"
        ],
        "achievements": [
            "achievements", "awards", "honors", "accomplishments", "publications",
            "honours & awards", "patents", "recognitions"
        ]
    }

    @classmethod
    def extract_sections(cls, text: str) -> dict:
        """Parse clean text into structured resume sections across multiple professional domains."""
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        
        sections = {
            "contact": cls._extract_contact_info(text, lines),
            "summary": "",
            "skills": [],
            "rawSkillsText": "",
            "education": [],
            "experience": [],
            "projects": [],
            "certifications": [],
            "achievements": []
        }

        current_section = None
        section_lines = {sec: [] for sec in cls.SECTION_HEADERS.keys()}

        for line in lines:
            normalized_line = line.lower().strip(':').strip('-').strip()
            
            # Check if line matches a section header
            matched_section = None
            for sec_name, keywords in cls.SECTION_HEADERS.items():
                if (
                    normalized_line in keywords
                    or any(normalized_line.startswith(kw + ":") for kw in keywords)
                    or any(normalized_line.startswith(kw + " -") for kw in keywords)
                    or any(normalized_line == kw.replace('&', 'and') for kw in keywords)
                ):
                    matched_section = sec_name
                    break
            
            if matched_section:
                current_section = matched_section
                continue
            
            if current_section and current_section in section_lines:
                section_lines[current_section].append(line)

        # Process summary
        if section_lines["summary"]:
            sections["summary"] = " ".join(section_lines["summary"])

        # Capture raw text of skills section for dynamic extraction
        if section_lines["skills"]:
            sections["rawSkillsText"] = "\n".join(section_lines["skills"])

        # Process structured list sections
        sections["education"] = cls._parse_list_section(section_lines["education"])
        sections["experience"] = cls._parse_list_section(section_lines["experience"])
        sections["projects"] = cls._parse_list_section(section_lines["projects"])
        sections["certifications"] = cls._parse_list_section(section_lines["certifications"])
        sections["achievements"] = cls._parse_list_section(section_lines["achievements"])

        return sections

    @staticmethod
    def _extract_contact_info(text: str, lines: list) -> dict:
        """Extract email, phone, and links using regex patterns."""
        email_match = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text)
        phone_match = re.search(r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', text)
        linkedin_match = re.search(r'linkedin\.com/in/[a-zA-Z0-9_-]+', text, re.IGNORECASE)
        github_match = re.search(r'github\.com/[a-zA-Z0-9_-]+', text, re.IGNORECASE)

        name = lines[0] if lines and len(lines[0]) <= 50 and not '@' in lines[0] else ""

        return {
            "name": name,
            "email": email_match.group(0) if email_match else "",
            "phone": phone_match.group(0) if phone_match else "",
            "linkedin": f"https://{linkedin_match.group(0)}" if linkedin_match else "",
            "github": f"https://{github_match.group(0)}" if github_match else ""
        }

    @staticmethod
    def _parse_list_section(lines: list) -> list:
        """Group text lines into items based on bullet points or line breaks."""
        items = []
        current_item = []

        for line in lines:
            if line.startswith(('•', '-', '*', '1.', '2.', '3.')):
                if current_item:
                    items.append(" ".join(current_item))
                    current_item = []
                current_item.append(re.sub(r'^[•\-\*\d\.]+\s*', '', line))
            else:
                current_item.append(line)

        if current_item:
            items.append(" ".join(current_item))

        return items if items else lines
