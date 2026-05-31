from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from dotenv import load_dotenv
import pdfplumber
import httpx
import json
import os
import io

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://resume-analyser.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")

def extract_text_from_pdf(file_bytes):
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        return "\n".join(page.extract_text() or "" for page in pdf.pages)

def safe_json(text):
    try:
        clean = text.replace("```json", "").replace("```", "").strip()
        return json.loads(clean)
    except:
        try:
            start = text.find("{")
            end = text.rfind("}") + 1
            return json.loads(text[start:end])
        except:
            return {"error": "AI returned invalid response, please try again"}

@app.post("/analyse")
async def analyse_resume(
    resume_text: str = Form(default=""),
    job_description: str = Form(default=""),
    file: UploadFile = File(default=None)
):
    extracted_text = resume_text
    if file and file.filename.endswith(".pdf"):
        contents = await file.read()
        extracted_text = extract_text_from_pdf(contents)

    if not extracted_text.strip():
        return {"error": "No resume text provided"}

    extracted_text = extracted_text[:3000]

    prompt = f"""You are a strict professional resume analyst and ATS expert. Analyse this resume{' against the job description' if job_description else ''} and return ONLY valid JSON, no markdown, no explanation.

Resume:
{extracted_text}

{f'Job Description:{job_description[:500]}' if job_description else ''}

ATS SCORING RULES — be very strict:
- Average resume scores 40-60
- Good resume scores 60-75
- Excellent resume scores 75-85
- Only perfect resumes score above 85
- Deduct points for: missing keywords, use of tables/graphics, special characters, missing contact info, non-standard section names, too long, spelling errors, weak action verbs, no measurable achievements

Return ONLY this JSON:
{{
  "overall_score": 75,
  "ats_score": 55,
  "ats_issues": ["specific ATS issue 1", "specific ATS issue 2", "specific ATS issue 3", "specific ATS issue 4"],
  "verdict": "Good resume",
  "summary": "Two sentence summary here.",
  "subscores": {{
    "clarity": 80,
    "impact": 70,
    "skills_relevance": 75,
    "formatting": 80{',    "job_match": 72' if job_description else ''}
  }},
  "keywords_found": ["keyword1", "keyword2"],
  "keywords_missing": ["keyword1", "keyword2"],
  "suggestions": ["suggestion1", "suggestion2"],
  "job_search_titles": ["Job Title 1", "Job Title 2", "Job Title 3"],
  "weak_sections": [
    {{"original": "actual weak line from resume", "rewritten": "stronger version with metrics"}},
    {{"original": "actual weak line from resume", "rewritten": "stronger version with metrics"}},
    {{"original": "actual weak line from resume", "rewritten": "stronger version with metrics"}}
  ],
  "feedback": [
    {{"type": "good", "text": "specific good thing"}},
    {{"type": "good", "text": "specific good thing"}},
    {{"type": "improve", "text": "specific thing to improve"}},
    {{"type": "improve", "text": "specific thing to improve"}},
    {{"type": "tip", "text": "specific actionable tip"}},
    {{"type": "tip", "text": "specific actionable tip"}}
  ]
}}

Replace all example values with real analysis of the resume. Return ONLY the JSON object."""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,
        max_tokens=1500,
    )

    result = response.choices[0].message.content
    return safe_json(result)


@app.post("/jobs")
async def get_jobs(
    query: str = Form(),
    location: str = Form(default="India"),
    page: str = Form(default="1")
):
    try:
        async with httpx.AsyncClient(timeout=15.0) as http:
            response = await http.get(
                "https://jsearch.p.rapidapi.com/search",
                params={
                    "query": f"{query} in {location}",
                    "num_pages": "1",
                    "page": page,
                    "date_posted": "month"
                },
                headers={
                    "X-RapidAPI-Key": RAPIDAPI_KEY,
                    "X-RapidAPI-Host": "jsearch.p.rapidapi.com"
                }
            )
            data = response.json()
            jobs = []
            for job in data.get("data", []):
                city = job.get("job_city") or ""
                country = job.get("job_country") or ""
                location_str = f"{city}, {country}".strip(", ")
                salary = "Not specified"
                if job.get("job_min_salary"):
                    currency = job.get("job_salary_currency") or ""
                    salary = f"{currency} {job.get('job_min_salary')}"
                posted = ""
                if job.get("job_posted_at_datetime_utc"):
                    posted = job["job_posted_at_datetime_utc"][:10]
                jobs.append({
                    "title": job.get("job_title") or "Unknown",
                    "company": job.get("employer_name") or "Unknown",
                    "location": location_str,
                    "type": job.get("job_employment_type") or "Full Time",
                    "salary": salary,
                    "posted": posted,
                    "apply_link": job.get("job_apply_link") or "#",
                    "description": (job.get("job_description") or "")[:200] + "..."
                })
            return {"jobs": jobs}
    except httpx.TimeoutException:
        return {"error": "Job search timed out. Please try again.", "jobs": []}
    except Exception as e:
        return {"error": str(e), "jobs": []}


@app.post("/compare")
async def compare_resumes(
    resume1_text: str = Form(default=""),
    resume2_text: str = Form(default=""),
    job_description: str = Form(default=""),
    file1: UploadFile = File(default=None),
    file2: UploadFile = File(default=None)
):
    text1 = resume1_text
    text2 = resume2_text

    if file1 and file1.filename.endswith(".pdf"):
        contents = await file1.read()
        text1 = extract_text_from_pdf(contents)

    if file2 and file2.filename.endswith(".pdf"):
        contents = await file2.read()
        text2 = extract_text_from_pdf(contents)

    if not text1.strip() or not text2.strip():
        return {"error": "Please provide both resumes"}

    text1 = text1[:1500]
    text2 = text2[:1500]

    prompt = f"""You are a strict resume analyst. Compare these two resumes and return ONLY valid JSON, no markdown.

Resume 1:
{text1}

Resume 2:
{text2}

ATS SCORING RULES — be very strict and consistent:
- Average resume scores 45-60
- Good resume scores 60-75
- Only perfect resumes score above 80
- Deduct points for: missing keywords, tables, special characters, missing contact info, weak action verbs, no measurable achievements

Return ONLY this JSON:
{{
  "winner": 1,
  "winner_reason": "One sentence reason why this resume wins",
  "resume1": {{
    "name": "Candidate name or Resume 1",
    "overall_score": 65,
    "ats_score": 55,
    "strengths": ["strength1", "strength2", "strength3"],
    "weaknesses": ["weakness1", "weakness2"]
  }},
  "resume2": {{
    "name": "Candidate name or Resume 2",
    "overall_score": 58,
    "ats_score": 48,
    "strengths": ["strength1", "strength2", "strength3"],
    "weaknesses": ["weakness1", "weakness2"]
  }},
  "comparison": [
    {{"category": "Experience", "resume1_score": 70, "resume2_score": 60}},
    {{"category": "Skills", "resume1_score": 65, "resume2_score": 55}},
    {{"category": "Education", "resume1_score": 60, "resume2_score": 65}},
    {{"category": "ATS Compatibility", "resume1_score": 55, "resume2_score": 48}},
    {{"category": "Impact", "resume1_score": 65, "resume2_score": 55}}
  ]
}}

Replace example values with real strict analysis. Return ONLY the JSON."""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,
        max_tokens=1000,
    )

    result = response.choices[0].message.content
    return safe_json(result)


@app.post("/build-resume")
async def build_resume(
    name: str = Form(),
    email: str = Form(),
    phone: str = Form(),
    location: str = Form(default=""),
    summary: str = Form(default=""),
    experience: str = Form(default=""),
    education: str = Form(default=""),
    skills: str = Form(default=""),
    projects: str = Form(default="")
):
    prompt = f"""You are a professional resume writer. Create a polished resume and return ONLY valid JSON, no markdown.

Name: {name}
Email: {email}
Phone: {phone}
Location: {location}
Summary: {summary}
Experience: {experience}
Education: {education}
Skills: {skills}
Projects: {projects}

Return ONLY this JSON:
{{
  "name": "{name}",
  "email": "{email}",
  "phone": "{phone}",
  "location": "{location}",
  "professional_summary": "AI improved 3 sentence professional summary",
  "experience": [
    {{"role": "Job Title", "company": "Company", "duration": "2020-2023", "bullets": ["achievement1", "achievement2", "achievement3"]}}
  ],
  "education": [
    {{"degree": "Degree", "institution": "University", "year": "2020", "grade": "3.8 GPA"}}
  ],
  "skills": ["skill1", "skill2", "skill3"],
  "projects": [
    {{"name": "Project", "description": "Description here.", "tech": ["tech1", "tech2"]}}
  ],
  "ats_score": 72,
  "improvements_made": ["improvement1", "improvement2", "improvement3"]
}}

Replace example values with real content based on input. Return ONLY the JSON."""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,
        max_tokens=1500,
    )

    result = response.choices[0].message.content
    return safe_json(result)


@app.post("/download-resume")
async def download_resume(resume_data: str = Form()):
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
    from fastapi.responses import StreamingResponse

    data = json.loads(resume_data)
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4,
        rightMargin=0.75*inch, leftMargin=0.75*inch,
        topMargin=0.75*inch, bottomMargin=0.75*inch)

    name_style = ParagraphStyle('name', fontSize=20, fontName='Helvetica-Bold', spaceAfter=4, alignment=1)
    contact_style = ParagraphStyle('contact', fontSize=9, fontName='Helvetica', spaceAfter=2, textColor=colors.grey, alignment=1)
    heading_style = ParagraphStyle('heading', fontSize=11, fontName='Helvetica-Bold', spaceBefore=12, spaceAfter=4)
    body_style = ParagraphStyle('body', fontSize=9, fontName='Helvetica', spaceAfter=3, leading=14)
    bullet_style = ParagraphStyle('bullet', fontSize=9, fontName='Helvetica', spaceAfter=2, leftIndent=12, leading=13)

    story = []
    story.append(Paragraph(data.get("name", ""), name_style))
    contact = f"{data.get('email','')} | {data.get('phone','')} | {data.get('location','')}"
    story.append(Paragraph(contact, contact_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.black, spaceAfter=6))

    if data.get("professional_summary"):
        story.append(Paragraph("PROFESSIONAL SUMMARY", heading_style))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.grey, spaceAfter=4))
        story.append(Paragraph(data["professional_summary"], body_style))

    if data.get("experience"):
        story.append(Paragraph("WORK EXPERIENCE", heading_style))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.grey, spaceAfter=4))
        for exp in data["experience"]:
            story.append(Paragraph(f"<b>{exp.get('role','')}</b> — {exp.get('company','')} <font color='grey'>{exp.get('duration','')}</font>", body_style))
            for bullet in exp.get("bullets", []):
                story.append(Paragraph(f"• {bullet}", bullet_style))
            story.append(Spacer(1, 4))

    if data.get("education"):
        story.append(Paragraph("EDUCATION", heading_style))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.grey, spaceAfter=4))
        for edu in data["education"]:
            grade = f" | {edu.get('grade','')}" if edu.get('grade') else ''
            story.append(Paragraph(f"<b>{edu.get('degree','')}</b> — {edu.get('institution','')} <font color='grey'>{edu.get('year','')}{grade}</font>", body_style))

    if data.get("skills"):
        story.append(Paragraph("SKILLS", heading_style))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.grey, spaceAfter=4))
        story.append(Paragraph(" • ".join(data["skills"]), body_style))

    if data.get("projects"):
        story.append(Paragraph("PROJECTS", heading_style))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.grey, spaceAfter=4))
        for proj in data["projects"]:
            tech = ", ".join(proj.get("tech", []))
            story.append(Paragraph(f"<b>{proj.get('name','')}</b> <font color='grey'>({tech})</font>", body_style))
            story.append(Paragraph(proj.get("description",""), bullet_style))
            story.append(Spacer(1, 4))

    doc.build(story)
    buffer.seek(0)

    return StreamingResponse(buffer, media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={data.get('name','resume').replace(' ','_')}_resume.pdf"})


@app.get("/")
def root():
    return {"message": "Resume Analyser API is running!"}
