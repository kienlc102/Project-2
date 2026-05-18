from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class SubjectDetail(BaseModel):
    subject_code: str
    subject_name: str
    university_code: str
    university_name: str
    created_at: datetime 
    

class SubjectFeatured(BaseModel):
    id: int
    subject_code: str   
    subject_name: str
    university_code: str
    university_name: str