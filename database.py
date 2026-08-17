from neo4j import GraphDatabase
from dotenv import load_dotenv
import os

load_dotenv()

COGNODB_URI = os.getenv("COGNODB_URI")
COGNODB_USERNAME = os.getenv("COGNODB_USERNAME")
COGNODB_PASSWORD = os.getenv("COGNODB_PASSWORD")

driver = GraphDatabase.driver(
    COGNODB_URI,
    auth=(COGNODB_USERNAME, COGNODB_PASSWORD)
)


def get_driver():
    return driver