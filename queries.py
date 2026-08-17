CREATE_CONSTRAINTS = """
CREATE CONSTRAINT candidate_id IF NOT EXISTS
FOR (c:Candidate) REQUIRE c.id IS UNIQUE
"""

CREATE_GRAPH = """
MERGE (c:Candidate {
    id: $candidate_id,
    name: $candidate_name
})

MERGE (s:Skill {
    name: $skill_name
})

MERGE (c)-[:HAS_SKILL]->(s)

RETURN c, s
"""

GET_CANDIDATE_SKILLS = """
MATCH (c:Candidate {id: $candidate_id})-[:HAS_SKILL]->(s:Skill)
RETURN s.name AS skill
ORDER BY skill
"""

FIND_MATCHING_JOBS = """
MATCH (c:Candidate {id: $candidate_id})-[:HAS_SKILL]->(s:Skill)
MATCH (s)<-[:REQUIRES]-(j:Job)
WITH c, j, COUNT(DISTINCT s) AS matched_skills
OPTIONAL MATCH (j)-[:REQUIRES]->(required:Skill)
WITH c, j, matched_skills, COUNT(DISTINCT required) AS total_skills
RETURN
    j.id AS job_id,
    j.title AS title,
    j.company AS company,
    matched_skills,
    total_skills,
    ROUND((100.0 * matched_skills) / CASE WHEN total_skills = 0 THEN 1 ELSE total_skills END, 1) AS match_percentage
ORDER BY match_percentage DESC
"""

SKILL_GAP = """
MATCH (c:Candidate {id: $candidate_id})-[:HAS_SKILL]->(s:Skill)
MATCH (j:Job {id: $job_id})-[:REQUIRES]->(required:Skill)
WHERE NOT (c)-[:HAS_SKILL]->(required)
RETURN required.name AS missing_skill
ORDER BY missing_skill
"""

RELATED_SKILLS = """
MATCH (s:Skill {name: $skill_name})<-[:REQUIRES]-(j:Job)-[:REQUIRES]->(related:Skill)
WHERE related.name <> $skill_name
RETURN related.name AS skill, COUNT(DISTINCT j) AS job_count
ORDER BY job_count DESC, skill
LIMIT 10
"""

GRAPH_EXPLORATION = """
MATCH (c:Candidate {id: $candidate_id})
      -[:HAS_SKILL]->(s:Skill)
      <-[:REQUIRES]-(j:Job)
      -[:POSTED_BY]->(company:Company)
RETURN c.name AS candidate,
       s.name AS skill,
       j.title AS job,
       company.name AS company
ORDER BY job
"""