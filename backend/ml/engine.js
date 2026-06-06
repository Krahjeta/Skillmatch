function tokenize(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOPWORDS.has(w));
}

const STOPWORDS = new Set([
  'the','and','for','are','was','were','has','have','had','will','with',
  'this','that','from','they','you','your','our','its','not','but','been',
  'can','all','one','more','also','some','any','into','out','who','how',
  'what','when','where','which','their','there','than','then','other',
  'about','would','should','could','must','need','work','working','well',
]);

function buildTfIdf(documents) {
  const N = documents.length;
  const df = {};
  documents.forEach(tokens => {
    const unique = new Set(tokens);
    unique.forEach(term => { df[term] = (df[term] || 0) + 1; });
  });
  const idf = {};
  Object.keys(df).forEach(term => {
    idf[term] = Math.log((N + 1) / (df[term] + 1)) + 1;
  });
  return documents.map(tokens => {
    const tf = {};
    tokens.forEach(t => { tf[t] = (tf[t] || 0) + 1; });
    const total = tokens.length || 1;
    const vec = {};
    Object.keys(tf).forEach(t => {
      vec[t] = (tf[t] / total) * (idf[t] || 1);
    });
    return vec;
  });
}

function cosineSimilarity(vecA, vecB) {
  let dot = 0, magA = 0, magB = 0;
  const allKeys = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
  allKeys.forEach(k => {
    const a = vecA[k] || 0;
    const b = vecB[k] || 0;
    dot += a * b;
    magA += a * a;
    magB += b * b;
  });
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function buildJobVector(job, tfidfVec) {
  const vec = { ...tfidfVec };
  (job.skills || []).forEach(skill => {
    const key = 'skill_' + skill.toLowerCase().replace(/\s+/g, '_');
    vec[key] = (vec[key] || 0) + 3.0;
  });
  if (job.industry) {
    vec['industry_' + job.industry.toLowerCase().replace(/\s+/g, '_')] = 2.0;
  }
  return vec;
}

function buildUserVector(userSkills) {
  const levelWeight = { beginner: 0.5, intermediate: 1.0, advanced: 1.5, expert: 2.0 };
  const vec = {};
  userSkills.forEach(({ name, level }) => {
    const key = 'skill_' + name.toLowerCase().replace(/\s+/g, '_');
    vec[key] = levelWeight[level] || 1.0;
  });
  return vec;
}

function kMeans(jobVectors, k = 6, maxIter = 30) {
  if (jobVectors.length === 0) return [];
  const allKeys = [...new Set(jobVectors.flatMap(v => Object.keys(v)))];
  let centroids = [];
  const step = Math.max(1, Math.floor(jobVectors.length / k));
  for (let i = 0; i < k && i * step < jobVectors.length; i++) {
    centroids.push({ ...jobVectors[i * step] });
  }
  if (centroids.length < k) {
    while (centroids.length < k) centroids.push({ ...centroids[0] });
  }
  let assignments = new Array(jobVectors.length).fill(0);
  for (let iter = 0; iter < maxIter; iter++) {
    const newAssignments = jobVectors.map(vec => {
      let bestCluster = 0, bestSim = -1;
      centroids.forEach((c, ci) => {
        const sim = cosineSimilarity(vec, c);
        if (sim > bestSim) { bestSim = sim; bestCluster = ci; }
      });
      return bestCluster;
    });
    const changed = newAssignments.some((a, i) => a !== assignments[i]);
    assignments = newAssignments;
    if (!changed) break;
    centroids = centroids.map((_, ci) => {
      const members = jobVectors.filter((_, i) => assignments[i] === ci);
      if (members.length === 0) return centroids[ci];
      const newC = {};
      allKeys.forEach(k => {
        newC[k] = members.reduce((s, v) => s + (v[k] || 0), 0) / members.length;
      });
      return newC;
    });
  }
  return assignments;
}

function labelCluster(jobs, clusterIndex, assignments) {
  const members = jobs.filter((_, i) => assignments[i] === clusterIndex);
  if (!members.length) return `Cluster ${clusterIndex + 1}`;
  const freq = {};
  members.forEach(j => {
    if (j.industry) freq[j.industry] = (freq[j.industry] || 0) + 1;
  });
  const top = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];
  return top ? top[0] : `Cluster ${clusterIndex + 1}`;
}

function collaborativeFilter(userId, userSkills, allUsers, topN = 5) {
  const myVec = buildUserVector(userSkills);
  const scored = allUsers
    .filter(u => u.id !== userId && u.appliedJobIds.length > 0)
    .map(u => ({ user: u, sim: cosineSimilarity(myVec, buildUserVector(u.skills)) }))
    .sort((a, b) => b.sim - a.sim)
    .slice(0, 10);
  const jobScores = {};
  scored.forEach(({ user, sim }) => {
    user.appliedJobIds.forEach(jid => {
      jobScores[jid] = (jobScores[jid] || 0) + sim;
    });
  });
  return Object.entries(jobScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([jobId, score]) => ({ jobId: parseInt(jobId), collaborativeScore: score }));
}

function skillGapAnalysis(userSkills, topJobs) {
  const userSkillNames = new Set(userSkills.map(s => s.name.toLowerCase()));
  const missing = {};
  topJobs.forEach(job => {
    (job.skills || []).forEach(skill => {
      if (!userSkillNames.has(skill.toLowerCase())) {
        missing[skill] = (missing[skill] || 0) + 1;
      }
    });
  });
  return Object.entries(missing)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([skill, count]) => ({ skill, demand: count }));
}

module.exports = {
  tokenize, buildTfIdf, cosineSimilarity,
  buildJobVector, buildUserVector,
  kMeans, labelCluster,
  collaborativeFilter, skillGapAnalysis,
};