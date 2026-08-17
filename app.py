from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from database import get_driver


app = FastAPI(
    title="SkillGraph API",
    description="Graph-based Career Recommendation Platform",
    version="1.0.0"
)


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = BASE_DIR / "frontend"


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# DATABASE HELPER
# ============================================================

def run_query(query, parameters=None):
    driver = get_driver()

    try:
        records, _, _ = driver.execute_query(
            query,
            parameters or {}
        )

        return [record.data() for record in records]

    except Exception as e:
        print("DATABASE QUERY ERROR:", repr(e))
        raise


# ============================================================
# STARTUP
# ============================================================

@app.on_event("startup")
def startup():

    print("=" * 50)
    print("SkillGraph API starting...")
    print("=" * 50)

    try:
        driver = get_driver()
        driver.verify_connectivity()

        print("Neo4j database connection: OK")
        print("SkillGraph API: READY")

    except Exception as e:
        print("Neo4j connection error:", repr(e))


# ============================================================
# ROOT / FRONTEND
# ============================================================

@app.get("/")
def root():
    return FileResponse(
        FRONTEND_DIR / "index.html"
    )


# ============================================================
# HEALTH
# ============================================================

@app.get("/health")
def health():

    try:
        driver = get_driver()
        driver.verify_connectivity()

        return {
            "status": "healthy",
            "database": "connected"
        }

    except Exception as e:

        print("HEALTH ERROR:", repr(e))

        raise HTTPException(
            status_code=503,
            detail="Database connection failed"
        )


# ============================================================
# CANDIDATES
# ============================================================

@app.get("/candidates")
def get_candidates():

    query = """
    MATCH (c:Candidate)
    OPTIONAL MATCH (c)-[:HAS_SKILL]->(s:Skill)

    RETURN
        c.id AS id,
        c.name AS name,
        collect(s.name) AS skills

    ORDER BY c.name
    """

    try:

        return run_query(query)

    except Exception as e:

        print("CANDIDATES ERROR:", repr(e))

        raise HTTPException(
            status_code=503,
            detail="Unable to retrieve candidates"
        )


# ============================================================
# CANDIDATE SKILLS
# ============================================================

@app.get("/candidates/{candidate_id}/skills")
def get_candidate_skills(candidate_id: str):

    query = """
    MATCH (c:Candidate {id: $candidate_id})
    OPTIONAL MATCH (c)-[:HAS_SKILL]->(s:Skill)

    RETURN
        c.id AS candidate_id,
        c.name AS candidate,
        collect(s.name) AS skills
    """

    try:

        results = run_query(
            query,
            {
                "candidate_id": candidate_id.upper()
            }
        )

        if not results:

            raise HTTPException(
                status_code=404,
                detail="Candidate not found"
            )

        return results[0]

    except HTTPException:
        raise

    except Exception as e:

        print("CANDIDATE SKILLS ERROR:", repr(e))

        raise HTTPException(
            status_code=503,
            detail="Unable to retrieve candidate skills"
        )


# ============================================================
# JOBS
# ============================================================

@app.get("/jobs")
def get_jobs():

    query = """
    MATCH (j:Job)-[:POSTED_BY]->(company:Company)
    OPTIONAL MATCH (j)-[:REQUIRES]->(s:Skill)

    RETURN
        j.id AS id,
        j.title AS title,
        company.name AS company,
        collect(s.name) AS required_skills

    ORDER BY j.id
    """

    try:

        return run_query(query)

    except Exception as e:

        print("JOBS ERROR:", repr(e))

        raise HTTPException(
            status_code=503,
            detail="Unable to retrieve jobs"
        )


# ============================================================
# SINGLE JOB
# ============================================================

@app.get("/jobs/{job_id}")
def get_job(job_id: str):

    query = """
    MATCH (j:Job {id: $job_id})
          -[:POSTED_BY]->(company:Company)

    OPTIONAL MATCH (j)-[:REQUIRES]->(s:Skill)

    RETURN
        j.id AS id,
        j.title AS title,
        company.name AS company,
        collect(s.name) AS required_skills
    """

    try:

        results = run_query(
            query,
            {
                "job_id": job_id.upper()
            }
        )

        if not results:

            raise HTTPException(
                status_code=404,
                detail="Job not found"
            )

        return results[0]

    except HTTPException:
        raise

    except Exception as e:

        print("JOB ERROR:", repr(e))

        raise HTTPException(
            status_code=503,
            detail="Unable to retrieve job"
        )


# ============================================================
# RECOMMENDATIONS
# ============================================================

@app.get("/recommendations/{candidate_id}")
def get_recommendations(candidate_id: str):

    query = """
    MATCH (c:Candidate {id: $candidate_id})
          -[:HAS_SKILL]->(s:Skill)
          <-[:REQUIRES]-(j:Job)

    WITH
        j,
        COUNT(DISTINCT s) AS matched_skills

    MATCH (j)-[:REQUIRES]->(required:Skill)

    WITH
        j,
        matched_skills,
        COUNT(DISTINCT required) AS total_skills

    MATCH (j)-[:POSTED_BY]->(company:Company)

    RETURN
        j.id AS job_id,
        j.title AS title,
        company.name AS company,
        matched_skills,
        total_skills

    ORDER BY matched_skills DESC
    """

    try:

        results = run_query(
            query,
            {
                "candidate_id": candidate_id.upper()
            }
        )

        recommendations = []

        for item in results:

            matched = item["matched_skills"]
            total = item["total_skills"]

            percentage = (
                round((matched / total) * 100)
                if total > 0
                else 0
            )

            recommendations.append({
                "job_id": item["job_id"],
                "title": item["title"],
                "company": item["company"],
                "matched_skills": matched,
                "total_skills": total,
                "match_percentage": percentage
            })

        recommendations.sort(
            key=lambda item: item["match_percentage"],
            reverse=True
        )

        return recommendations

    except Exception as e:

        print("RECOMMENDATIONS ERROR:", repr(e))

        raise HTTPException(
            status_code=503,
            detail="Unable to generate job recommendations"
        )


# ============================================================
# SKILL GAP
# ============================================================

@app.get("/skill-gap/{candidate_id}/{job_id}")
def get_skill_gap(
    candidate_id: str,
    job_id: str
):

    query = """
    MATCH (c:Candidate {id: $candidate_id})
    MATCH (j:Job {id: $job_id})

    OPTIONAL MATCH (c)-[:HAS_SKILL]->(owned:Skill)

    WITH
        c,
        j,
        collect(owned.name) AS candidate_skills

    MATCH (j)-[:REQUIRES]->(required:Skill)

    WITH
        j,
        candidate_skills,
        collect(required.name) AS required_skills

    RETURN
        j.title AS job,
        [
            skill IN required_skills
            WHERE NOT skill IN candidate_skills
        ] AS missing_skills
    """

    try:

        results = run_query(
            query,
            {
                "candidate_id": candidate_id.upper(),
                "job_id": job_id.upper()
            }
        )

        if not results:

            raise HTTPException(
                status_code=404,
                detail="Candidate or job not found"
            )

        return results[0]

    except HTTPException:
        raise

    except Exception as e:

        print("SKILL GAP ERROR:", repr(e))

        raise HTTPException(
            status_code=503,
            detail="Unable to calculate skill gap"
        )


# ============================================================
# RELATED SKILLS
# ============================================================

@app.get("/related-skills/{skill_name}")
def get_related_skills(skill_name: str):

    query = """
    MATCH (target:Skill)

    WHERE toLower(target.name) = toLower($skill_name)

    MATCH (target)<-[:REQUIRES]-(j:Job)
          -[:REQUIRES]->(related:Skill)

    WHERE related.name <> target.name

    RETURN
        related.name AS skill,
        COUNT(DISTINCT j) AS job_count

    ORDER BY job_count DESC, skill

    LIMIT 10
    """

    try:

        return run_query(
            query,
            {
                "skill_name": skill_name.strip()
            }
        )

    except Exception as e:

        print("RELATED SKILLS ERROR:", repr(e))

        raise HTTPException(
            status_code=503,
            detail="Unable to retrieve related skills"
        )


# ============================================================
# GRAPH
# ============================================================

@app.get("/graph/{candidate_id}")
def get_graph(candidate_id: str):

    query = """
    MATCH (c:Candidate {id: $candidate_id})
          -[:HAS_SKILL]->(s:Skill)
          <-[:REQUIRES]-(j:Job)
          -[:POSTED_BY]->(company:Company)

    RETURN
        c.name AS candidate,
        s.name AS skill,
        j.title AS job,
        company.name AS company

    ORDER BY job, skill
    """

    try:

        return run_query(
            query,
            {
                "candidate_id": candidate_id.upper()
            }
        )

    except Exception as e:

        print("GRAPH ERROR:", repr(e))

        raise HTTPException(
            status_code=503,
            detail="Unable to retrieve graph data"
        )


# ============================================================
# FRONTEND STATIC FILES
# ============================================================

app.mount(
    "/",
    StaticFiles(
        directory=str(FRONTEND_DIR)
    ),
    name="frontend"
)