const API_BASE = "";

document.addEventListener("DOMContentLoaded", () => {
    loadCandidates();
    loadJobs();
});

async function loadCandidates() {
    try {
        const response = await fetch(`${API_BASE}/candidates`);

        if (!response.ok) {
            throw new Error(`Candidates API error: ${response.status}`);
        }

        const candidates = await response.json();

        const selects = [
            "candidateSelect",
            "recommendationCandidate",
            "gapCandidate",
            "graphCandidate"
        ];

        selects.forEach(id => {
            const select = document.getElementById(id);

            if (select) {
                select.innerHTML =
                    id === "gapCandidate"
                        ? '<option value="">Select candidate</option>'
                        : '<option value="">Select a candidate</option>';

                candidates.forEach(candidate => {
                    const option = document.createElement("option");

                    option.value = candidate.id;
                    option.textContent = candidate.name;

                    select.appendChild(option);
                });
            }
        });

        document.getElementById("candidateCount").textContent =
            candidates.length;

    } catch (error) {
        console.error("Candidates loading error:", error);
        document.getElementById("candidateCount").textContent = "0";
    }
}


async function loadCandidateSkills() {
    const candidateId =
        document.getElementById("candidateSelect").value;

    const container =
        document.getElementById("candidateResult");

    if (!candidateId) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">👤</div>
                <h3>Select a candidate</h3>
                <p>Please select a candidate first.</p>
            </div>
        `;
        return;
    }

    container.innerHTML =
        '<div class="loading">Loading candidate skills...</div>';

    try {
        const response = await fetch(
            `${API_BASE}/candidates/${encodeURIComponent(candidateId)}/skills`
        );

        if (!response.ok) {
            throw new Error(`Skills API error: ${response.status}`);
        }

        const data = await response.json();

        const skills = data.skills || [];

        if (!skills.length) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📚</div>
                    <h3>No skills found</h3>
                    <p>No skills are available for this candidate.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="result-header">
                <h3>${escapeHtml(data.name || "Candidate")}</h3>
                <span>${skills.length} skills</span>
            </div>

            <div class="skill-list">
                ${skills.map(skill => `
                    <div class="skill-card">
                        <strong>${escapeHtml(
                            typeof skill === "string"
                                ? skill
                                : skill.name || skill.skill || ""
                        )}</strong>
                    </div>
                `).join("")}
            </div>
        `;

    } catch (error) {
        console.error("Candidate skills error:", error);

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⚠️</div>
                <h3>Unable to load skills</h3>
                <p>${escapeHtml(error.message)}</p>
            </div>
        `;
    }
}


async function loadJobs() {
    const container = document.getElementById("jobsContainer");

    if (!container) {
        return;
    }

    container.innerHTML =
        '<div class="loading">Loading jobs...</div>';

    try {
        const response = await fetch(`${API_BASE}/jobs`);

        if (!response.ok) {
            throw new Error(`Jobs API error: ${response.status}`);
        }

        const jobs = await response.json();

        if (!jobs.length) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">💼</div>
                    <h3>No jobs available</h3>
                    <p>No jobs are currently available.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = jobs.map(job => `
            <div class="job-card">
                <h3>${escapeHtml(job.title || job.name || "Job")}</h3>

                ${
                    job.company
                        ? `<p class="company">${escapeHtml(job.company)}</p>`
                        : ""
                }

                ${
                    job.location
                        ? `<p class="location">📍 ${escapeHtml(job.location)}</p>`
                        : ""
                }

                ${
                    job.skills
                        ? `
                            <div class="job-skills">
                                ${
                                    (Array.isArray(job.skills)
                                        ? job.skills
                                        : [job.skills]
                                    ).map(skill => `
                                        <span class="skill-tag">
                                            ${escapeHtml(
                                                typeof skill === "string"
                                                    ? skill
                                                    : skill.name || ""
                                            )}
                                        </span>
                                    `).join("")
                                }
                            </div>
                        `
                        : ""
                }
            </div>
        `).join("");

    } catch (error) {
        console.error("Jobs loading error:", error);

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⚠️</div>
                <h3>Unable to load jobs</h3>
                <p>Please make sure the backend is running.</p>
            </div>
        `;
    }
}


async function loadRecommendations() {
    const candidateId =
        document.getElementById("recommendationCandidate").value;

    const container =
        document.getElementById("recommendationResult");

    if (!candidateId) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🎯</div>
                <h3>Select a candidate</h3>
                <p>Please select a candidate to view recommendations.</p>
            </div>
        `;
        return;
    }

    container.innerHTML =
        '<div class="loading">Loading recommendations...</div>';

    try {
        const response = await fetch(
            `${API_BASE}/recommendations/${encodeURIComponent(candidateId)}`
        );

        if (!response.ok) {
            throw new Error(
                `Recommendations API error: ${response.status}`
            );
        }

        const data = await response.json();

        const recommendations =
            data.recommendations ||
            data.jobs ||
            data.results ||
            [];

        if (!recommendations.length) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🎯</div>
                    <h3>No recommendations found</h3>
                    <p>No matching career recommendations are available.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = recommendations.map(item => `
            <div class="recommendation-card">
                <h3>${escapeHtml(
                    item.title ||
                    item.name ||
                    item.job_title ||
                    "Recommendation"
                )}</h3>

                ${
                    item.company
                        ? `<p>${escapeHtml(item.company)}</p>`
                        : ""
                }

                ${
                    item.score !== undefined
                        ? `<strong>Match: ${escapeHtml(item.score)}%</strong>`
                        : ""
                }
            </div>
        `).join("");

    } catch (error) {
        console.error("Recommendations error:", error);

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⚠️</div>
                <h3>Unable to load recommendations</h3>
                <p>${escapeHtml(error.message)}</p>
            </div>
        `;
    }
}


async function loadSkillGap() {
    const candidateId =
        document.getElementById("gapCandidate").value;

    const container =
        document.getElementById("gapResult");

    if (!candidateId) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📊</div>
                <h3>Select a candidate</h3>
                <p>Please select a candidate to view the skill gap.</p>
            </div>
        `;
        return;
    }

    container.innerHTML =
        '<div class="loading">Loading skill gap...</div>';

    try {
        const response = await fetch(
            `${API_BASE}/skill-gap/${encodeURIComponent(candidateId)}`
        );

        if (!response.ok) {
            throw new Error(
                `Skill gap API error: ${response.status}`
            );
        }

        const data = await response.json();

        const missing =
            data.missing_skills ||
            data.missingSkills ||
            data.missing ||
            [];

        const current =
            data.current_skills ||
            data.currentSkills ||
            data.skills ||
            [];

        container.innerHTML = `
            <div class="skill-gap-result">

                <div class="gap-section">
                    <h3>Current Skills</h3>

                    ${
                        current.length
                            ? `
                                <div class="skill-list">
                                    ${current.map(skill => `
                                        <span class="skill-tag">
                                            ${escapeHtml(
                                                typeof skill === "string"
                                                    ? skill
                                                    : skill.name || ""
                                            )}
                                        </span>
                                    `).join("")}
                                </div>
                            `
                            : `<p>No current skills found.</p>`
                    }
                </div>

                <div class="gap-section">
                    <h3>Missing Skills</h3>

                    ${
                        missing.length
                            ? `
                                <div class="skill-list">
                                    ${missing.map(skill => `
                                        <span class="skill-tag missing">
                                            ${escapeHtml(
                                                typeof skill === "string"
                                                    ? skill
                                                    : skill.name || ""
                                            )}
                                        </span>
                                    `).join("")}
                                </div>
                            `
                            : `<p>No missing skills found.</p>`
                    }
                </div>

            </div>
        `;

    } catch (error) {
        console.error("Skill gap error:", error);

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⚠️</div>
                <h3>Unable to load skill gap</h3>
                <p>${escapeHtml(error.message)}</p>
            </div>
        `;
    }
}


async function loadRelatedSkills() {
    const candidateId =
        document.getElementById("relatedSkillsCandidate").value;

    const container =
        document.getElementById("relatedSkillsResult");

    if (!candidateId) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔗</div>
                <h3>Select a candidate</h3>
                <p>Please select a candidate first.</p>
            </div>
        `;
        return;
    }

    container.innerHTML =
        '<div class="loading">Loading related skills...</div>';

    try {
        const response = await fetch(
            `${API_BASE}/related-skills/${encodeURIComponent(candidateId)}`
        );

        if (!response.ok) {
            throw new Error(
                `Related skills API error: ${response.status}`
            );
        }

        const data = await response.json();

        const skills =
            data.related_skills ||
            data.relatedSkills ||
            data.skills ||
            [];

        if (!skills.length) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔗</div>
                    <h3>No related skills found</h3>
                    <p>No related skills are available.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="skill-list">
                ${skills.map(skill => `
                    <div class="related-skill-card">
                        <strong>
                            ${escapeHtml(
                                typeof skill === "string"
                                    ? skill
                                    : skill.name || ""
                            )}
                        </strong>
                    </div>
                `).join("")}
            </div>
        `;

    } catch (error) {
        console.error("Related skills error:", error);

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⚠️</div>
                <h3>Unable to load related skills</h3>
                <p>${escapeHtml(error.message)}</p>
            </div>
        `;
    }
}


async function loadCareerGraph() {
    const candidateId =
        document.getElementById("graphCandidate").value;

    const container =
        document.getElementById("careerGraphResult");

    if (!candidateId) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🌐</div>
                <h3>Select a candidate</h3>
                <p>Please select a candidate to explore the career graph.</p>
            </div>
        `;
        return;
    }

    container.innerHTML =
        '<div class="loading">Loading career graph...</div>';

    try {
        const response = await fetch(
            `${API_BASE}/career-graph/${encodeURIComponent(candidateId)}`
        );

        if (!response.ok) {
            throw new Error(
                `Career graph API error: ${response.status}`
            );
        }

        const data = await response.json();

        const nodes = data.nodes || [];
        const relationships =
            data.relationships ||
            data.edges ||
            [];

        if (!nodes.length) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🌐</div>
                    <h3>No graph data found</h3>
                    <p>No career graph information is available.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="graph-summary">
                <div>
                    <strong>${nodes.length}</strong>
                    <span>Nodes</span>
                </div>

                <div>
                    <strong>${relationships.length}</strong>
                    <span>Connections</span>
                </div>
            </div>

            <div class="graph-data">
                ${nodes.map(node => `
                    <div class="graph-node">
                        <strong>
                            ${escapeHtml(
                                node.name ||
                                node.label ||
                                node.id ||
                                "Node"
                            )}
                        </strong>

                        ${
                            node.type
                                ? `<span>${escapeHtml(node.type)}</span>`
                                : ""
                        }
                    </div>
                `).join("")}
            </div>
        `;

    } catch (error) {
        console.error("Graph error:", error);

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⚠️</div>
                <h3>Unable to explore graph</h3>
                <p>${escapeHtml(error.message)}</p>
            </div>
        `;
    }
}


function scrollToCandidates() {
    document
        .getElementById("candidates")
        .scrollIntoView({
            behavior: "smooth"
        });
}


function scrollToJobs() {
    document
        .getElementById("jobs")
        .scrollIntoView({
            behavior: "smooth"
        });
}


function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value ?? "";
    return div.innerHTML;
}