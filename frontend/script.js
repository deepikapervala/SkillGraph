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

        container.innerHTML = `
            <div class="candidate-card">
                <h3>${escapeHtml(data.candidate)}</h3>

                <p class="card-label">
                    Candidate ID: ${escapeHtml(data.candidate_id)}
                </p>

                <div class="skills-list">
                    ${data.skills.map(skill => `
                        <span class="skill-chip">
                            ${escapeHtml(skill)}
                        </span>
                    `).join("")}
                </div>
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
    const container =
        document.getElementById("jobsContainer");

    try {
        const response = await fetch(`${API_BASE}/jobs`);

        if (!response.ok) {
            throw new Error(`Jobs API error: ${response.status}`);
        }

        const jobs = await response.json();

        document.getElementById("jobCount").textContent =
            jobs.length;

        container.innerHTML = jobs.map(job => `
            <div class="job-card">
                <h3>${escapeHtml(job.title)}</h3>

                <div class="company">
                    ${escapeHtml(job.company)}
                </div>

                <div class="card-label">
                    Required Skills
                </div>

                <div class="skills-list">
                    ${job.required_skills.map(skill => `
                        <span class="skill-chip">
                            ${escapeHtml(skill)}
                        </span>
                    `).join("")}
                </div>
            </div>
        `).join("");

        const gapJob =
            document.getElementById("gapJob");

        gapJob.innerHTML =
            '<option value="">Select job</option>';

        jobs.forEach(job => {
            const option = document.createElement("option");

            option.value = job.id;
            option.textContent =
                `${job.title} — ${job.company}`;

            gapJob.appendChild(option);
        });

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
        document.getElementById("recommendationsContainer");

    if (!candidateId) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🎯</div>
                <h3>Select a candidate</h3>
                <p>Please select a candidate first.</p>
            </div>
        `;
        return;
    }

    container.innerHTML =
        '<div class="loading">Generating recommendations...</div>';

    try {
        const response = await fetch(
            `${API_BASE}/recommendations/${encodeURIComponent(candidateId)}`
        );

        if (!response.ok) {
            throw new Error(
                `Recommendations API error: ${response.status}`
            );
        }

        const recommendations = await response.json();

        if (recommendations.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔎</div>
                    <h3>No recommendations found</h3>
                    <p>No matching jobs were found.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = recommendations.map(job => `
            <div class="recommendation-card">

                <span class="match-score">
                    ${job.match_percentage}% Match
                </span>

                <h3>${escapeHtml(job.title)}</h3>

                <div class="company">
                    ${escapeHtml(job.company)}
                </div>

                <div class="card-label">
                    Skill Match
                </div>

                <p>
                    ${job.matched_skills}
                    of
                    ${job.total_skills}
                    required skills matched
                </p>

            </div>
        `).join("");

    } catch (error) {
        console.error("Recommendations error:", error);

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⚠️</div>
                <h3>Unable to generate recommendations</h3>
                <p>${escapeHtml(error.message)}</p>
            </div>
        `;
    }
}


async function loadSkillGap() {
    const candidateId =
        document.getElementById("gapCandidate").value;

    const jobId =
        document.getElementById("gapJob").value;

    const container =
        document.getElementById("skillGapContainer");

    if (!candidateId || !jobId) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📊</div>
                <h3>Select candidate and job</h3>
                <p>Both selections are required.</p>
            </div>
        `;
        return;
    }

    container.innerHTML =
        '<div class="loading">Analyzing skill gap...</div>';

    try {
        const response = await fetch(
            `${API_BASE}/skill-gap/${encodeURIComponent(candidateId)}/${encodeURIComponent(jobId)}`
        );

        if (!response.ok) {
            throw new Error(`Skill gap API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.missing_skills.length === 0) {
            container.innerHTML = `
                <div class="gap-result">
                    <h3>${escapeHtml(data.job)}</h3>

                    <p class="no-gap">
                        ✓ No skill gaps found. Candidate has all
                        required skills.
                    </p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="gap-result">

                <h3>${escapeHtml(data.job)}</h3>

                <p class="card-label">
                    Missing Skills
                </p>

                <div class="missing-skills">
                    ${data.missing_skills.map(skill => `
                        <span class="missing-skill">
                            ${escapeHtml(skill)}
                        </span>
                    `).join("")}
                </div>

            </div>
        `;

    } catch (error) {
        console.error("Skill gap error:", error);

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⚠️</div>
                <h3>Unable to analyze skill gap</h3>
                <p>${escapeHtml(error.message)}</p>
            </div>
        `;
    }
}


async function loadRelatedSkills() {
    const skill =
        document.getElementById("skillInput").value.trim();

    const container =
        document.getElementById("relatedSkillsContainer");

    if (!skill) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔗</div>
                <h3>Enter a skill</h3>
                <p>For example: SQL</p>
            </div>
        `;
        return;
    }

    container.innerHTML =
        '<div class="loading">Finding related skills...</div>';

    try {
        const response = await fetch(
            `${API_BASE}/related-skills/${encodeURIComponent(skill)}`
        );

        if (!response.ok) {
            throw new Error(
                `Related skills API error: ${response.status}`
            );
        }

        const skills = await response.json();

        if (skills.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔎</div>
                    <h3>No related skills found</h3>
                    <p>Try another skill.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = skills.map(item => `
            <div class="related-skill-card">
                <strong>${escapeHtml(item.skill)}</strong>
                <span class="job-count">
                    ${item.job_count}
                    job${item.job_count === 1 ? "" : "s"}
                </span>
            </div>
        `).join("");

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


async function loadGraph() {
    const candidateId =
        document.getElementById("graphCandidate").value;

    const container =
        document.getElementById("graphContainer");

    if (!candidateId) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🌐</div>
                <h3>Select a candidate</h3>
                <p>Please select a candidate first.</p>
            </div>
        `;
        return;
    }

    container.innerHTML =
        '<div class="loading">Exploring graph...</div>';

    try {
        const response = await fetch(
            `${API_BASE}/graph/${encodeURIComponent(candidateId)}`
        );

        if (!response.ok) {
            throw new Error(`Graph API error: ${response.status}`);
        }

        const graphData = await response.json();

        if (graphData.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🌐</div>
                    <h3>No graph relationships found</h3>
                    <p>No career relationships were found.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = graphData.map(item => `
            <div class="graph-row">

                <div class="graph-item">
                    <strong>Candidate</strong>
                    ${escapeHtml(item.candidate)}
                </div>

                <div class="graph-item">
                    <strong>Skill</strong>
                    ${escapeHtml(item.skill)}
                </div>

                <div class="graph-item">
                    <strong>Job</strong>
                    ${escapeHtml(item.job)}
                </div>

                <div class="graph-item">
                    <strong>Company</strong>
                    ${escapeHtml(item.company)}
                </div>

            </div>
        `).join("");

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