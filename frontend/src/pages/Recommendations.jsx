// ============================================================================
// RECOMMENDATIONS.JSX - ML Recommendations Page
// Project: SkillPath
//
// Work Distribution:
//
// Krahjeta:
// - Main page structure
// - Loading ML data from backend
// - Collaborative recommendations UI
// - Python ML results tab integration
//
// Anita:
// - Skill Gap UI
// - Missing skills visualization
// - Explanation text for skill recommendations
//
// Sara:
// - Job Clusters UI
// - Cluster cards
// - Python ML charts/table display
//
// Shared Work:
// - UI testing
// - API connection testing
// - Styling and debugging
// ============================================================================

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ============================================================================
// KRAHJETA
// Main Recommendations component.
// This page loads ML results from the backend and displays them in tabs.
// ============================================================================
export default function Recommendations() {
  const [gaps, setGaps] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [collab, setCollab] = useState([]);
  const [loading, setLoading] = useState(true);
  const [collabMsg, setCollabMsg] = useState('');
  const [tab, setTab] = useState('skill-gap');

  const [pyReady, setPyReady] = useState(false);
  const [pyTable, setPyTable] = useState(null);
  const [pyImages, setPyImages] = useState([]);
  const [pyLoading, setPyLoading] = useState(false);
  const [pyActiveImg, setPyActiveImg] = useState(null);

  // ==========================================================================
  // KRAHJETA
  // Loads live ML data from backend:
  // - Skill Gap Analysis
  // - Job Clusters
  // - Collaborative Filtering Recommendations
  // ==========================================================================
  useEffect(() => {
    async function load() {
      setLoading(true);

      try {
        const [r2, r3, r4] = await Promise.all([
          api.get('/ml/skill-gap'),
          api.get('/ml/clusters'),
          api.get('/ml/collaborative'),
        ]);

        setGaps(r2.data.gaps || []);
        setClusters(r3.data.clusters || []);
        setCollab(r4.data.jobs || []);
        setCollabMsg(r4.data.message || '');
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const maxGap = gaps[0]?.demand || 1;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* ====================================================================
            KRAHJETA
            Page header.
            Shows title and short explanation of recommendation system.
        ==================================================================== */}
        <div style={styles.header}>
          <h1 style={styles.title}>Job Recommendations</h1>
          <p style={styles.subtitle}>
            Suggestions based on your skills, applications, and job activity.
          </p>
        </div>

        {/* ====================================================================
            KRAHJETA
            Tab navigation.
            Allows user to switch between ML features.
        ==================================================================== */}
        <div style={styles.tabs}>
          {[
            { id: 'skill-gap', label: 'Missing Skills' },
            { id: 'clusters', label: 'Job Groups' },
            { id: 'collaborative', label: 'Similar Users' },
            { id: 'python-ml', label: 'Model Results' },
          ].map((t) => (
            <button
              key={t.id}
              style={tab === t.id ? styles.tabActive : styles.tab}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={styles.loading}>Loading recommendations...</div>
        ) : (
          <>
            {/* ================================================================
                ANITA
                Skill Gap Analysis UI.
                Shows missing skills that appear often in suitable jobs.
            ================================================================ */}
            {tab === 'skill-gap' && (
              <div>
                <div style={styles.infoTag}>Skill gap analysis</div>

                {gaps.length === 0 ? (
                  <div style={styles.notice}>
                    No skill gaps found. Add more skills to your profile first.
                  </div>
                ) : (
                  <div style={styles.gapList}>
                    <p style={styles.intro}>
                      These are skills that appear often in jobs that match your profile.
                    </p>

                    {gaps.map((g, i) => (
                      <div key={g.skill} style={styles.gapRow}>
                        <div style={styles.gapRank}>#{i + 1}</div>

                        <div style={styles.gapInfo}>
                          <div style={styles.gapName}>{g.skill}</div>

                          <div style={styles.barBg}>
                            <div
                              style={{
                                ...styles.barFill,
                                width: `${(g.demand / maxGap) * 100}%`,
                              }}
                            />
                          </div>
                        </div>

                        <div style={styles.gapCount}>
                          Needed by {g.demand} job{g.demand > 1 ? 's' : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ================================================================
                SARA
                Job Clustering UI.
                Shows groups of jobs created by K-Means clustering.
            ================================================================ */}
            {tab === 'clusters' && (
              <div>
                <div style={styles.infoTag}>Job grouping</div>

                {clusters.length === 0 ? (
                  <div style={styles.notice}>
                    Not enough jobs in the database for clustering.
                  </div>
                ) : (
                  <>
                    <p style={styles.intro}>
                      Jobs are grouped by similar skills and descriptions.
                    </p>

                    <div style={styles.clusterGrid}>
                      {clusters.map((c) => (
                        <div key={c.id} style={styles.clusterCard}>
                          <div style={styles.clusterLabel}>{c.label}</div>
                          <div style={styles.clusterSize}>{c.size} jobs</div>

                          <div style={styles.clusterJobs}>
                            {(c.sampleJobs || []).map((j) => (
                              <div key={j.id} style={styles.clusterJob}>
                                <Link to={`/jobs/${j.id}`} style={styles.clusterJobLink}>
                                  {j.title}
                                </Link>
                                <span style={styles.clusterJobCo}>{j.company}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ================================================================
                KRAHJETA
                Collaborative Filtering UI.
                Shows jobs recommended from similar user behavior.
            ================================================================ */}
            {tab === 'collaborative' && (
              <div>
                <div style={styles.infoTag}>Based on similar users</div>

                {collabMsg && <div style={styles.notice}>{collabMsg}</div>}

                {collab.length === 0 && !collabMsg && (
                  <div style={styles.notice}>
                    No collaborative recommendations yet.
                  </div>
                )}

                {collab.length > 0 && (
                  <>
                    <p style={styles.intro}>
                      These jobs were viewed, saved, or applied to by users with similar activity.
                    </p>

                    <div style={styles.cardGrid}>
                      {collab.map((job) => (
                        <div key={job.id} style={styles.card}>
                          <div style={styles.cardHeader}>
                            <div>
                              <div style={styles.cardTitle}>{job.title}</div>
                              <div style={styles.cardCompany}>
                                {job.company} {job.location ? `· ${job.location}` : ''}
                              </div>
                            </div>

                            <div style={styles.smallBadge}>Match</div>
                          </div>

                          <div style={styles.tags}>
                            {(job.skill_names || '')
                              .split(', ')
                              .filter(Boolean)
                              .slice(0, 5)
                              .map((s) => (
                                <span key={s} style={styles.tag}>
                                  {s}
                                </span>
                              ))}
                          </div>

                          <Link to={`/jobs/${job.id}`} style={styles.viewBtn}>
                            View Job
                          </Link>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ================================================================
                SARA
                Python ML Results tab.
                Displays offline Python ML model results, tables and charts.
            ================================================================ */}
            {tab === 'python-ml' && (
              <PythonMLTab
                pyReady={pyReady}
                setPyReady={setPyReady}
                pyTable={pyTable}
                setPyTable={setPyTable}
                pyImages={pyImages}
                setPyImages={setPyImages}
                pyLoading={pyLoading}
                setPyLoading={setPyLoading}
                pyActiveImg={pyActiveImg}
                setPyActiveImg={setPyActiveImg}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// SARA
// PythonMLTab component.
// Loads and displays Python-generated ML results:
// - classifier comparison table
// - confusion matrix
// - clustering visualization
// - silhouette curve
// ============================================================================
function PythonMLTab({
  pyReady,
  setPyReady,
  pyTable,
  setPyTable,
  pyImages,
  setPyImages,
  pyLoading,
  setPyLoading,
  pyActiveImg,
  setPyActiveImg,
}) {
  // ==========================================================================
  // SARA
  // Loads Python ML outputs from backend.
  // These files are generated by ml-python/main.py.
  // ==========================================================================
  useEffect(() => {
    async function loadPyML() {
      setPyLoading(true);

      try {
        const [statusRes, imagesRes] = await Promise.all([
          fetch(`${API_BASE}/api/mlresults/status`).then((r) => r.json()),
          fetch(`${API_BASE}/api/mlresults/images`).then((r) => r.json()),
        ]);

        setPyReady(statusRes.ready);

        if (statusRes.ready) {
          const tableRes = await fetch(`${API_BASE}/api/mlresults/comparison`).then((r) =>
            r.json()
          );

          setPyTable(tableRes);
          setPyImages(imagesRes.images || []);

          if (imagesRes.images?.length > 0) {
            setPyActiveImg(imagesRes.images[0].key);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setPyLoading(false);
      }
    }

    loadPyML();
  }, []);

  if (pyLoading) {
    return <div style={styles.loading}>Loading model results...</div>;
  }

  if (!pyReady) {
    return (
      <div style={pyStyles.notReady}>
        <h2 style={pyStyles.notReadyTitle}>Model results are not ready yet</h2>

        <p style={pyStyles.notReadyText}>
          Run the Python ML script first to generate the comparison table and charts.
        </p>

        <div style={pyStyles.stepsBox}>
          <p style={pyStyles.stepsTitle}>How to run:</p>

          <ol style={pyStyles.stepsList}>
            <li>Open Command Prompt in your project folder</li>
            <li>
              Go to <code style={pyStyles.code}>ml-python/</code>
            </li>
            <li>
              Run <code style={pyStyles.code}>pip install -r requirements.txt</code>
            </li>
            <li>
              Run <code style={pyStyles.code}>python main.py</code>
            </li>
            <li>Refresh this page</li>
          </ol>
        </div>
      </div>
    );
  }

  const activeImage = pyImages.find((img) => img.key === pyActiveImg);

  return (
    <div style={pyStyles.wrapper}>
      <div style={styles.infoTag}>
        KNN · Decision Tree · Random Forest · Neural Network · K-Means
      </div>

      {/* ======================================================================
          SARA
          Classifier comparison table.
          Shows Accuracy, Precision, Recall and F1-score.
      ====================================================================== */}
      {pyTable && (
        <div style={pyStyles.section}>
          <h3 style={pyStyles.sectionTitle}>Classifier Comparison</h3>

          <p style={pyStyles.sectionDesc}>
            The table compares the trained models using accuracy, precision, recall, and F1-score.
          </p>

          <div style={pyStyles.tableWrap}>
            <table style={pyStyles.table}>
              <thead>
                <tr>
                  {pyTable.headers.map((h) => (
                    <th key={h} style={pyStyles.th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {pyTable.rows.map((row, i) => (
                  <tr key={i} style={i === 0 ? pyStyles.trBest : pyStyles.tr}>
                    {pyTable.headers.map((h) => (
                      <td key={h} style={pyStyles.td}>
                        {typeof row[h] === 'number'
                          ? `${(row[h] * 100).toFixed(1)}%`
                          : row[h]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p style={pyStyles.bestNote}>
            Best model: <strong>{pyTable.rows[0]?.Classifier}</strong>
          </p>
        </div>
      )}

      {/* ======================================================================
          SARA
          Python ML chart display.
          Shows generated charts from backend/public/ml-outputs.
      ====================================================================== */}
      {pyImages.length > 0 && (
        <div style={pyStyles.section}>
          <h3 style={pyStyles.sectionTitle}>Charts</h3>

          <div style={pyStyles.imgTabs}>
            {pyImages.map((img) => (
              <button
                key={img.key}
                style={pyActiveImg === img.key ? pyStyles.imgTabActive : pyStyles.imgTab}
                onClick={() => setPyActiveImg(img.key)}
              >
                {img.title}
              </button>
            ))}
          </div>

          {activeImage && (
            <div style={pyStyles.imgBox}>
              <img
                src={`${API_BASE}${activeImage.url}`}
                alt={activeImage.title}
                style={pyStyles.chartImg}
              />

              <p style={pyStyles.imgCaption}>{activeImage.title}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SHARED WORK
// Main page styling.
// Used by all ML tabs and recommendation UI.
// ============================================================================
const styles = {
  page: { minHeight: '100vh', background: '#f6f7fb', padding: '24px 16px' },
  container: { maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '18px' },
  header: { background: 'white', borderRadius: '12px', padding: '22px', border: '1px solid #e5e7eb' },
  title: { margin: 0, fontSize: '28px', fontWeight: '700', color: '#111827' },
  subtitle: { margin: '6px 0 0', fontSize: '14px', color: '#6b7280' },
  tabs: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  tab: { padding: '9px 15px', borderRadius: '8px', border: '1px solid #d1d5db', background: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: '#374151' },
  tabActive: { padding: '9px 15px', borderRadius: '8px', border: '1px solid #2563eb', background: '#2563eb', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: 'white' },
  infoTag: { display: 'inline-block', background: '#f3f4f6', color: '#374151', fontSize: '12px', fontWeight: '500', padding: '5px 10px', borderRadius: '8px', marginBottom: '16px' },
  notice: { background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px', padding: '14px', fontSize: '14px', color: '#9a3412', marginBottom: '16px' },
  loading: { textAlign: 'center', padding: '50px', fontSize: '15px', color: '#6b7280' },
  intro: { color: '#4b5563', fontSize: '14px', margin: '0 0 16px' },
  gapList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  gapRow: { display: 'flex', alignItems: 'center', gap: '12px', background: 'white', borderRadius: '10px', padding: '13px', border: '1px solid #e5e7eb' },
  gapRank: { fontWeight: '700', color: '#6b7280', fontSize: '13px', width: '28px', flexShrink: 0 },
  gapInfo: { flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' },
  gapName: { fontSize: '14px', fontWeight: '600', color: '#111827' },
  gapCount: { fontSize: '12px', color: '#6b7280', flexShrink: 0 },
  barBg: { height: '6px', background: '#e5e7eb', borderRadius: '99px', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: '99px', background: '#2563eb' },
  clusterGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' },
  clusterCard: { background: 'white', borderRadius: '12px', padding: '18px', border: '1px solid #e5e7eb' },
  clusterLabel: { fontSize: '16px', fontWeight: '700', marginBottom: '4px', color: '#111827' },
  clusterSize: { fontSize: '13px', color: '#6b7280', marginBottom: '12px' },
  clusterJobs: { display: 'flex', flexDirection: 'column', gap: '8px' },
  clusterJob: { display: 'flex', flexDirection: 'column' },
  clusterJobLink: { fontSize: '14px', fontWeight: '600', color: '#2563eb', textDecoration: 'none' },
  clusterJobCo: { fontSize: '12px', color: '#6b7280' },
  cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' },
  card: { background: 'white', borderRadius: '12px', padding: '18px', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: '10px' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', gap: '8px' },
  cardTitle: { fontSize: '16px', fontWeight: '700', color: '#111827' },
  cardCompany: { fontSize: '13px', color: '#6b7280', marginTop: '2px' },
  smallBadge: { background: '#f3f4f6', color: '#374151', borderRadius: '8px', padding: '5px 9px', fontSize: '12px', fontWeight: '600', height: 'fit-content' },
  tags: { display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '4px' },
  tag: { background: '#f3f4f6', color: '#374151', borderRadius: '999px', padding: '4px 9px', fontSize: '12px' },
  viewBtn: { marginTop: '6px', display: 'inline-block', color: '#2563eb', fontWeight: '600', fontSize: '14px', textDecoration: 'none' },
};

// ============================================================================
// SHARED WORK
// Python ML result styling.
// Used for tables, charts, and "not ready" state.
// ============================================================================
const pyStyles = {
  wrapper: { display: 'flex', flexDirection: 'column', gap: '18px' },
  section: { background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb' },
  sectionTitle: { margin: '0 0 8px', fontSize: '17px', fontWeight: '700', color: '#111827' },
  sectionDesc: { margin: '0 0 16px', fontSize: '14px', color: '#6b7280' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  th: { background: '#f3f4f6', color: '#374151', fontWeight: '700', padding: '10px 14px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' },
  tr: { borderBottom: '1px solid #f3f4f6' },
  trBest: { borderBottom: '1px solid #f3f4f6', background: '#eff6ff' },
  td: { padding: '10px 14px', color: '#374151' },
  bestNote: { margin: '12px 0 0', fontSize: '13px', color: '#6b7280' },
  imgTabs: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' },
  imgTab: { padding: '7px 12px', borderRadius: '8px', border: '1px solid #d1d5db', background: 'white', cursor: 'pointer', fontSize: '12px', color: '#374151' },
  imgTabActive: { padding: '7px 12px', borderRadius: '8px', border: '1px solid #2563eb', background: '#2563eb', cursor: 'pointer', fontSize: '12px', color: 'white' },
  imgBox: { textAlign: 'center' },
  chartImg: { maxWidth: '100%', borderRadius: '10px', border: '1px solid #e5e7eb' },
  imgCaption: { margin: '10px 0 0', fontSize: '12px', color: '#6b7280' },
  notReady: { background: 'white', borderRadius: '12px', padding: '36px 28px', textAlign: 'center', border: '1px solid #e5e7eb' },
  notReadyTitle: { margin: '0 0 12px', fontSize: '20px', fontWeight: '700', color: '#111827' },
  notReadyText: { margin: '0 0 24px', fontSize: '14px', color: '#6b7280' },
  stepsBox: { background: '#f9fafb', borderRadius: '10px', padding: '18px 22px', textAlign: 'left', maxWidth: '480px', margin: '0 auto', border: '1px solid #e5e7eb' },
  stepsTitle: { margin: '0 0 12px', fontWeight: '700', fontSize: '14px', color: '#111827' },
  stepsList: { margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#374151' },
  code: { background: '#f3f4f6', color: '#111827', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '12px' },
};