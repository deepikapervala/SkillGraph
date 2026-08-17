from database import get_driver


def seed_database():
    driver = get_driver()

    candidates = [
        {
            "id": "C001",
            "name": "Aarav Sharma",
            "skills": ["Python", "SQL", "Pandas", "Power BI"]
        },
        {
            "id": "C002",
            "name": "Ananya Reddy",
            "skills": ["Java", "Spring Boot", "React", "SQL"]
        },
        {
            "id": "C003",
            "name": "Rahul Kumar",
            "skills": ["Python", "Machine Learning", "TensorFlow", "SQL"]
        }
    ]

    jobs = [
        {
            "id": "J001",
            "title": "Data Analyst",
            "company": "Insight Analytics",
            "skills": ["Python", "SQL", "Pandas", "Power BI"]
        },
        {
            "id": "J002",
            "title": "Machine Learning Engineer",
            "company": "AI Labs",
            "skills": ["Python", "Machine Learning", "TensorFlow", "SQL"]
        },
        {
            "id": "J003",
            "title": "Full Stack Developer",
            "company": "TechNova",
            "skills": ["Java", "Spring Boot", "React", "SQL"]
        },
        {
            "id": "J004",
            "title": "Python Developer",
            "company": "CloudWorks",
            "skills": ["Python", "SQL", "FastAPI", "Git"]
        }
    ]

    with driver.session() as session:

        # Clear existing demo data
        session.run("MATCH (n) DETACH DELETE n")

        # Create candidates and skills
        for candidate in candidates:
            session.run(
                """
                MERGE (c:Candidate {id: $id})
                SET c.name = $name
                """,
                id=candidate["id"],
                name=candidate["name"]
            )

            for skill in candidate["skills"]:
                session.run(
                    """
                    MERGE (c:Candidate {id: $candidate_id})
                    MERGE (s:Skill {name: $skill})
                    MERGE (c)-[:HAS_SKILL]->(s)
                    """,
                    candidate_id=candidate["id"],
                    skill=skill
                )

        # Create jobs, companies and required skills
        for job in jobs:
            session.run(
                """
                MERGE (j:Job {id: $id})
                SET j.title = $title

                MERGE (c:Company {name: $company})
                MERGE (j)-[:POSTED_BY]->(c)
                """,
                id=job["id"],
                title=job["title"],
                company=job["company"]
            )

            for skill in job["skills"]:
                session.run(
                    """
                    MERGE (j:Job {id: $job_id})
                    MERGE (s:Skill {name: $skill})
                    MERGE (j)-[:REQUIRES]->(s)
                    """,
                    job_id=job["id"],
                    skill=skill
                )

    driver.close()
    print("SkillGraph seed data loaded successfully!")


if __name__ == "__main__":
    seed_database()