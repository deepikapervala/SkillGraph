# SkillGraph

SkillGraph is a graph-based career intelligence platform that connects candidates, skills, jobs, and companies to provide personalized job recommendations and skill gap analysis.

## Features

- Candidate skill exploration
- Job and skill requirement analysis
- Smart job recommendations with match percentage
- Skill gap analysis
- Related skills discovery
- Career graph exploration
- Graph-based relationship analysis

## Why a Graph Database?

SkillGraph is built around relationships between candidates, skills, jobs, and companies.

A graph database is a natural fit because career recommendations require traversing these relationships. For example:

Candidate → HAS_SKILL → Skill → REQUIRED_BY → Job → POSTED_BY → Company

This allows SkillGraph to efficiently answer relationship-based questions such as:

- Which jobs match a candidate's skills?
- What skills are missing for a particular job?
- Which skills are commonly related?
- Which companies are connected to jobs matching a candidate?
- What career opportunities can be reached through a candidate's skills?

In a relational database, these questions would require multiple tables and complex JOIN operations. With CognoDB, these relationships are represented directly as nodes and typed relationships, making graph traversal more natural and easier to extend.

## Tech Stack

- Python
- FastAPI
- CognoDB
- Neo4j Python Driver
- Cypher / openCypher
- HTML
- CSS
- JavaScript

## Graph Data Model

The SkillGraph data model consists of four main node types:

- **Candidate** — represents a job candidate.
- **Skill** — represents a technical or professional skill.
- **Job** — represents an available job opportunity.
- **Company** — represents the company posting a job.

### Relationships

```text
Candidate ──HAS_SKILL──> Skill
Skill <──REQUIRES── Job
Job ──POSTED_BY──> Company