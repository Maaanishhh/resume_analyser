import { useState } from "react";
import axios from "axios";
import { useDropzone } from "react-dropzone";
import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";
import "./App.css";

const API = "http://127.0.0.1:8000";

export default function App() {
  const [page, setPage] = useState("home");
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("scores");
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobLocation, setJobLocation] = useState("India");
  const [jobPage, setJobPage] = useState(1);
  const [currentJobTitle, setCurrentJobTitle] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const [compareResult, setCompareResult] = useState(null);
  const [resume1Text, setResume1Text] = useState("");
  const [resume2Text, setResume2Text] = useState("");
  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [builderData, setBuilderData] = useState({
    name: "", email: "", phone: "", location: "",
    summary: "", experience: "", education: "", skills: "", projects: ""
  });
  const [builtResume, setBuiltResume] = useState(null);
  const [buildLoading, setBuildLoading] = useState(false);

  const scoreColor = (s) => s >= 75 ? "#639922" : s >= 50 ? "#BA7517" : "#E24B4A";

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "application/pdf": [".pdf"] },
    onDrop: (f) => setFile(f[0]),
  });

  const drop1 = useDropzone({ accept: { "application/pdf": [".pdf"] }, onDrop: (f) => setFile1(f[0]) });
  const drop2 = useDropzone({ accept: { "application/pdf": [".pdf"] }, onDrop: (f) => setFile2(f[0]) });

  const analyse = async () => {
    if (!resumeText.trim() && !file) return alert("Please paste your resume or upload a PDF!");
    setLoading(true); setResult(null);
    try {
      const fd = new FormData();
      fd.append("resume_text", resumeText);
      fd.append("job_description", jobDescription);
      if (file) fd.append("file", file);
      const res = await axios.post(`${API}/analyse`, fd);
      setResult(res.data);
      setActiveTab("scores");
    } catch { alert("Something went wrong. Make sure backend is running!"); }
    setLoading(false);
  };

  const fetchJobs = async (title, pg = 1, append = false) => {
    setJobsLoading(true);
    setCurrentJobTitle(title);
    try {
      const fd = new FormData();
      fd.append("query", title);
      fd.append("location", jobLocation);
      fd.append("page", pg.toString());
      const res = await axios.post(`${API}/jobs`, fd);
      const newJobs = res.data.jobs || [];
      if (append) {
        setJobs(prev => [...prev, ...newJobs]);
      } else {
        setJobs(newJobs);
        setJobPage(1);
      }
      setHasMore(newJobs.length >= 8);
      setActiveTab("jobs");
    } catch { alert("Could not fetch jobs. Check your RapidAPI key!"); }
    setJobsLoading(false);
  };

  const loadMoreJobs = () => {
    const nextPage = jobPage + 1;
    setJobPage(nextPage);
    fetchJobs(currentJobTitle, nextPage, true);
  };

  const compareResumes = async () => {
    if (!resume1Text.trim() && !file1) return alert("Please provide Resume 1!");
    if (!resume2Text.trim() && !file2) return alert("Please provide Resume 2!");
    setCompareLoading(true); setCompareResult(null);
    try {
      const fd = new FormData();
      fd.append("resume1_text", resume1Text);
      fd.append("resume2_text", resume2Text);
      if (file1) fd.append("file1", file1);
      if (file2) fd.append("file2", file2);
      const res = await axios.post(`${API}/compare`, fd);
      setCompareResult(res.data);
    } catch { alert("Something went wrong comparing resumes!"); }
    setCompareLoading(false);
  };

  const buildResume = async () => {
    if (!builderData.name || !builderData.email) return alert("Please fill in at least your name and email!");
    setBuildLoading(true); setBuiltResume(null);
    try {
      const fd = new FormData();
      Object.entries(builderData).forEach(([k, v]) => fd.append(k, v));
      const res = await axios.post(`${API}/build-resume`, fd);
      setBuiltResume(res.data);
    } catch { alert("Something went wrong building your resume!"); }
    setBuildLoading(false);
  };

  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-brand">🎯 Resume AI</div>
        <div className="nav-links">
          {["home", "compare", "builder"].map((p) => (
            <button key={p} className={`nav-btn ${page === p ? "active" : ""}`}
              onClick={() => { setPage(p); setResult(null); setCompareResult(null); setBuiltResume(null); }}>
              {p === "home" ? "Analyser" : p === "compare" ? "Compare" : "Resume Builder"}
            </button>
          ))}
        </div>
      </nav>

      {page === "home" && (
        <div>
          {!result ? (
            <div className="input-section">
              <div className="page-title">
                <h1>AI Resume Analyser</h1>
                <p>Get your ATS score, feedback, job matches and more</p>
              </div>
              <div {...getRootProps()} className={`dropzone ${isDragActive ? "active" : ""} ${file ? "has-file" : ""}`}>
                <input {...getInputProps()} />
                {file ? <p>✅ {file.name} <span onClick={(e) => { e.stopPropagation(); setFile(null); }}>✕</span></p>
                  : <p>📄 Drag & drop PDF or click to upload</p>}
              </div>
              <div className="divider">or paste resume text</div>
              <textarea placeholder="Paste your resume here..." value={resumeText} onChange={(e) => setResumeText(e.target.value)} rows={10} />
              <textarea placeholder="Paste job description (optional)..." value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} rows={4} />
              <button className="analyse-btn" onClick={analyse} disabled={loading}>
                {loading ? "Analysing..." : "Analyse My Resume →"}
              </button>
            </div>
          ) : (
            <div className="results">
              <div className="score-header">
                <RadialBarChart width={140} height={140} cx={70} cy={70} innerRadius={50} outerRadius={70}
                  data={[{ value: result.overall_score, fill: scoreColor(result.overall_score) }]}
                  startAngle={90} endAngle={-270}>
                  <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                  <RadialBar dataKey="value" cornerRadius={6} background={{ fill: "#f0f0f0" }} />
                  <text x={70} y={70} textAnchor="middle" dominantBaseline="central"
                    fontSize={22} fontWeight={500} fill={scoreColor(result.overall_score)}>
                    {result.overall_score}
                  </text>
                </RadialBarChart>
                <div className="verdict">
                  <h2>{result.verdict}</h2>
                  <p>{result.summary}</p>
                  <div className="ats-badge" style={{
                    background: scoreColor(result.ats_score) + "22",
                    color: scoreColor(result.ats_score),
                    border: `1px solid ${scoreColor(result.ats_score)}`
                  }}>
                    ATS Score: {result.ats_score}/100
                  </div>
                </div>
              </div>

              {result.ats_issues?.length > 0 && (
                <div className="ats-issues">
                  <p className="section-label">⚠️ ATS Issues to fix</p>
                  {result.ats_issues.map((issue, i) => <div key={i} className="ats-issue">• {issue}</div>)}
                </div>
              )}

              <div className="tabs">
                {["scores", "keywords", "rewrite", "jobs", "feedback"].map((t) => (
                  <button key={t} className={`tab ${activeTab === t ? "active" : ""}`} onClick={() => setActiveTab(t)}>
                    {t === "rewrite" ? "Rewrites" : t === "jobs" ? "Jobs" : t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>

              {activeTab === "scores" && (
                <div className="scores">
                  {Object.entries(result.subscores).map(([key, val]) => (
                    <div key={key} className="score-row">
                      <span className="score-label">{key.replace(/_/g, " ")}</span>
                      <div className="bar-wrap"><div className="bar-fill" style={{ width: `${val}%`, background: scoreColor(val) }} /></div>
                      <span className="score-val" style={{ color: scoreColor(val) }}>{val}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "keywords" && (
                <div className="keywords">
                  <p className="kw-label">Found in your resume</p>
                  <div className="pills">{result.keywords_found?.map((k) => <span key={k} className="pill green">{k}</span>)}</div>
                  <p className="kw-label">Missing / could add</p>
                  <div className="pills">{result.keywords_missing?.map((k) => <span key={k} className="pill red">{k}</span>)}</div>
                  <p className="kw-label">Suggestions</p>
                  <div className="pills">{result.suggestions?.map((k) => <span key={k} className="pill amber">{k}</span>)}</div>
                </div>
              )}

              {activeTab === "rewrite" && (
                <div className="rewrite">
                  <p className="section-label" style={{ marginBottom: "1rem" }}>AI rewrote your weak sections to be more impactful</p>
                  {result.weak_sections?.map((w, i) => (
                    <div key={i} className="rewrite-card">
                      <div className="rewrite-original"><span className="rewrite-tag red">Original</span>{w.original}</div>
                      <div className="rewrite-arrow">↓</div>
                      <div className="rewrite-improved"><span className="rewrite-tag green">Improved</span>{w.rewritten}</div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "jobs" && (
                <div className="jobs-section">
                  <p className="section-label" style={{ marginBottom: "1rem" }}>Search real jobs based on your resume</p>
                  <div className="job-search-bar">
                    <input type="text" placeholder="Location (e.g. India, Mumbai, Remote)"
                      value={jobLocation} onChange={(e) => setJobLocation(e.target.value)}
                      className="job-location-input" />
                  </div>
                  <div className="job-titles">
                    {result.job_search_titles?.map((title) => (
                      <button key={title} className="job-title-btn" onClick={() => fetchJobs(title)} disabled={jobsLoading}>
                        🔍 {title}
                      </button>
                    ))}
                  </div>
                  {jobsLoading && <div className="loader-text">Fetching real jobs...</div>}
                  {jobs.length > 0 && (
                    <div className="job-list">
                      {jobs.map((job, i) => (
                        <div key={i} className="job-card">
                          <div className="job-top">
                            <div>
                              <div className="job-title">{job.title}</div>
                              <div className="job-company">{job.company}</div>
                            </div>
                            <a href={job.apply_link} target="_blank" rel="noreferrer" className="apply-btn">Apply →</a>
                          </div>
                          <div className="job-meta">
                            <span>📍 {job.location}</span>
                            <span>💼 {job.type}</span>
                            <span>💰 {job.salary}</span>
                            {job.posted && <span>📅 {job.posted}</span>}
                          </div>
                          <div className="job-desc">{job.description}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {!jobsLoading && jobs.length > 0 && hasMore && (
                    <button className="load-more-btn" onClick={loadMoreJobs}>
                      Load More Jobs ↓
                    </button>
                  )}
                </div>
              )}

              {activeTab === "feedback" && (
                <div className="feedback">
                  {result.feedback?.map((f, i) => (
                    <div key={i} className={`feedback-item ${f.type}`}>
                      <span className="dot" />{f.text}
                    </div>
                  ))}
                </div>
              )}

              <button className="analyse-btn secondary" onClick={() => {
                setResult(null); setFile(null);
                setResumeText(""); setJobDescription(""); setJobs([]);
              }}>
                Analyse Another Resume
              </button>
            </div>
          )}
        </div>
      )}

      {page === "compare" && (
        <div className="input-section">
          <div className="page-title"><h1>Compare Two Resumes</h1><p>Find out which resume is stronger</p></div>
          {!compareResult ? (
            <>
              <div className="compare-grid">
                <div className="compare-col">
                  <p className="section-label">Resume 1</p>
                  <div {...drop1.getRootProps()} className={`dropzone small ${file1 ? "has-file" : ""}`}>
                    <input {...drop1.getInputProps()} />
                    {file1 ? <p>✅ {file1.name}</p> : <p>📄 Upload PDF</p>}
                  </div>
                  <textarea placeholder="Or paste Resume 1 text..." value={resume1Text} onChange={(e) => setResume1Text(e.target.value)} rows={8} />
                </div>
                <div className="compare-col">
                  <p className="section-label">Resume 2</p>
                  <div {...drop2.getRootProps()} className={`dropzone small ${file2 ? "has-file" : ""}`}>
                    <input {...drop2.getInputProps()} />
                    {file2 ? <p>✅ {file2.name}</p> : <p>📄 Upload PDF</p>}
                  </div>
                  <textarea placeholder="Or paste Resume 2 text..." value={resume2Text} onChange={(e) => setResume2Text(e.target.value)} rows={8} />
                </div>
              </div>
              <button className="analyse-btn" onClick={compareResumes} disabled={compareLoading}>
                {compareLoading ? "Comparing..." : "Compare Resumes →"}
              </button>
            </>
          ) : (
            <div className="results">
              <div className="winner-banner" style={{ background: scoreColor(compareResult.winner === 1 ? compareResult.resume1.overall_score : compareResult.resume2.overall_score) + "22" }}>
                🏆 Resume {compareResult.winner} Wins! — {compareResult.winner_reason}
              </div>
              <div className="compare-cards">
                {[compareResult.resume1, compareResult.resume2].map((r, i) => (
                  <div key={i} className={`compare-card ${compareResult.winner === i + 1 ? "winner" : ""}`}>
                    <div className="compare-card-name">{r.name} {compareResult.winner === i + 1 && "🏆"}</div>
                    <div className="compare-scores">
                      <div className="mini-score" style={{ color: scoreColor(r.overall_score) }}>{r.overall_score}<span>overall</span></div>
                      <div className="mini-score" style={{ color: scoreColor(r.ats_score) }}>{r.ats_score}<span>ATS</span></div>
                    </div>
                    <p className="kw-label">Strengths</p>
                    {r.strengths?.map((s, j) => <div key={j} className="strength-item">✅ {s}</div>)}
                    <p className="kw-label" style={{ marginTop: "0.75rem" }}>Weaknesses</p>
                    {r.weaknesses?.map((s, j) => <div key={j} className="weakness-item">❌ {s}</div>)}
                  </div>
                ))}
              </div>
              <div className="scores" style={{ marginTop: "1rem" }}>
                <p className="section-label" style={{ marginBottom: "1rem" }}>Category breakdown</p>
                {compareResult.comparison?.map((c, i) => (
                  <div key={i} style={{ marginBottom: "1rem" }}>
                    <p style={{ fontSize: "0.85rem", color: "#666", marginBottom: "0.4rem" }}>{c.category}</p>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <span style={{ width: 80, fontSize: "0.8rem", textAlign: "right", color: scoreColor(c.resume1_score) }}>R1: {c.resume1_score}</span>
                      <div style={{ flex: 1, height: 8, background: "#f0f0f0", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ width: `${c.resume1_score}%`, height: "100%", background: scoreColor(c.resume1_score), borderRadius: 4 }} />
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginTop: 4 }}>
                      <span style={{ width: 80, fontSize: "0.8rem", textAlign: "right", color: scoreColor(c.resume2_score) }}>R2: {c.resume2_score}</span>
                      <div style={{ flex: 1, height: 8, background: "#f0f0f0", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ width: `${c.resume2_score}%`, height: "100%", background: scoreColor(c.resume2_score), borderRadius: 4 }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="analyse-btn secondary" onClick={() => {
                setCompareResult(null); setResume1Text(""); setResume2Text(""); setFile1(null); setFile2(null);
              }}>
                Compare Again
              </button>
            </div>
          )}
        </div>
      )}

      {page === "builder" && (
        <div className="input-section">
          <div className="page-title"><h1>AI Resume Builder</h1><p>Fill in your details and AI will create a polished resume</p></div>
          {!builtResume ? (
            <>
              <div className="builder-grid">
                {[
                  { key: "name", label: "Full Name", placeholder: "John Doe" },
                  { key: "email", label: "Email", placeholder: "john@email.com" },
                  { key: "phone", label: "Phone", placeholder: "+91 9876543210" },
                  { key: "location", label: "Location", placeholder: "Mumbai, India" },
                ].map(({ key, label, placeholder }) => (
                  <div key={key} className="builder-field">
                    <label className="field-label">{label}</label>
                    <input type="text" placeholder={placeholder} value={builderData[key]}
                      onChange={(e) => setBuilderData({ ...builderData, [key]: e.target.value })}
                      className="builder-input" />
                  </div>
                ))}
              </div>
              {[
                { key: "summary", label: "Professional Summary", placeholder: "Brief summary about yourself..." },
                { key: "experience", label: "Work Experience", placeholder: "Company name, role, duration, responsibilities..." },
                { key: "education", label: "Education", placeholder: "Degree, institution, year, grade..." },
                { key: "skills", label: "Skills", placeholder: "Python, React, Machine Learning, SQL..." },
                { key: "projects", label: "Projects", placeholder: "Project name, description, technologies used..." },
              ].map(({ key, label, placeholder }) => (
                <div key={key} className="builder-field">
                  <label className="field-label">{label}</label>
                  <textarea placeholder={placeholder} value={builderData[key]}
                    onChange={(e) => setBuilderData({ ...builderData, [key]: e.target.value })}
                    rows={4} />
                </div>
              ))}
              <button className="analyse-btn" onClick={buildResume} disabled={buildLoading}>
                {buildLoading ? "Building your resume..." : "Build My Resume →"}
              </button>
            </>
          ) : (
            <div className="built-resume">
              <div className="resume-header-block">
                <h2>{builtResume.name}</h2>
                <p>{builtResume.email} • {builtResume.phone} • {builtResume.location}</p>
                <div className="ats-badge" style={{
                  background: scoreColor(builtResume.ats_score) + "22",
                  color: scoreColor(builtResume.ats_score),
                  border: `1px solid ${scoreColor(builtResume.ats_score)}`,
                  marginTop: "0.75rem", display: "inline-block"
                }}>
                  Predicted ATS Score: {builtResume.ats_score}/100
                </div>
              </div>

              {builtResume.professional_summary && (
                <div className="resume-section">
                  <h3>Professional Summary</h3>
                  <p>{builtResume.professional_summary}</p>
                </div>
              )}

              {builtResume.experience?.length > 0 && (
                <div className="resume-section">
                  <h3>Work Experience</h3>
                  {builtResume.experience.map((exp, i) => (
                    <div key={i} className="resume-exp">
                      <div className="exp-header"><strong>{exp.role}</strong> — {exp.company} <span className="exp-duration">{exp.duration}</span></div>
                      <ul>{exp.bullets?.map((b, j) => <li key={j}>{b}</li>)}</ul>
                    </div>
                  ))}
                </div>
              )}

              {builtResume.education?.length > 0 && (
                <div className="resume-section">
                  <h3>Education</h3>
                  {builtResume.education.map((edu, i) => (
                    <div key={i} className="resume-exp">
                      <div className="exp-header"><strong>{edu.degree}</strong> — {edu.institution} <span className="exp-duration">{edu.year} {edu.grade && `| ${edu.grade}`}</span></div>
                    </div>
                  ))}
                </div>
              )}

              {builtResume.skills?.length > 0 && (
                <div className="resume-section">
                  <h3>Skills</h3>
                  <div className="pills">{builtResume.skills.map((s) => <span key={s} className="pill green">{s}</span>)}</div>
                </div>
              )}

              {builtResume.projects?.length > 0 && (
                <div className="resume-section">
                  <h3>Projects</h3>
                  {builtResume.projects.map((p, i) => (
                    <div key={i} className="resume-exp">
                      <div className="exp-header"><strong>{p.name}</strong></div>
                      <p>{p.description}</p>
                      <div className="pills" style={{ marginTop: "0.5rem" }}>{p.tech?.map((t) => <span key={t} className="pill amber">{t}</span>)}</div>
                    </div>
                  ))}
                </div>
              )}

              {builtResume.improvements_made?.length > 0 && (
                <div className="ats-issues" style={{ background: "#f0f7e6", borderColor: "#639922" }}>
                  <p className="section-label">✅ AI improvements made</p>
                  {builtResume.improvements_made.map((imp, i) => <div key={i} className="ats-issue">• {imp}</div>)}
                </div>
              )}

              <button className="analyse-btn" onClick={async () => {
                const fd = new FormData();
                fd.append("resume_data", JSON.stringify(builtResume));
                const res = await axios.post(`${API}/download-resume`, fd, { responseType: "blob" });
                const url = window.URL.createObjectURL(new Blob([res.data]));
                const a = document.createElement("a");
                a.href = url;
                a.download = `${builtResume.name.replace(" ", "_")}_resume.pdf`;
                a.click();
              }}>
                Download Resume as PDF ↓
              </button>
              <button className="analyse-btn secondary" onClick={() => setBuiltResume(null)}>
                Build Another Resume
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}