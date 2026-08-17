from pydantic import BaseModel
from typing import List


class CandidateCreate(BaseModel):
    id: str
    name: str
    skills: List[str]


class CandidateResponse(BaseModel):
    id: str
    name: str
    skills: List[str]


class JobResponse(BaseModel):
    id: str
    title: str
    company: str
    required_skills: List[str]