"""
SkillPath — Machine Learning Analysis
Dataset: LinkedIn Job Postings 2024 (Kaggle)

NEW TASK:
  Task 1: Career Level Classification
          Predict Junior / Mid-Level / Senior career level from job title,
          description, industry, location, and required skills.

  Task 2: Clustering
          Group jobs by skill/text profiles.

Why this is better:
  The dataset may already contain salary and job type, but career level is
  engineered from text. This makes the ML task more meaningful for SkillPath.
"""

import os
import re
import warnings
import numpy as np
import pandas as pd

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import PCA

from sklearn.neighbors import KNeighborsClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.neural_network import MLPClassifier

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report,
)

from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score, adjusted_rand_score

warnings.filterwarnings("ignore")

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(SCRIPT_DIR, "..", "backend", "public", "ml-outputs")
os.makedirs(OUTPUT_DIR, exist_ok=True)


def out(filename):
    return os.path.join(OUTPUT_DIR, filename)


print("=" * 70)
print("  SkillPath — Career Level ML Analysis")
print("=" * 70)

print("\n[1] Loading dataset...")

DATA_PATHS = [
    ("C:/data", "C:/data/job_skills.csv", "C:/data/linkedin_job_postings.csv"),
    ("../", "../job_skills.csv", "../linkedin_job_postings.csv"),
]

postings, skills_df = None, None

for base, skills_path, postings_path in DATA_PATHS:
    if os.path.exists(skills_path) and os.path.exists(postings_path):
        postings = pd.read_csv(postings_path, on_bad_lines="skip")
        skills_df = pd.read_csv(skills_path, on_bad_lines="skip")
        print(f"   Loaded from: {base}")
        break

if postings is None:
    raise FileNotFoundError(
        "Could not find CSV files.\n"
        "Place linkedin_job_postings.csv and job_skills.csv in C:/data/"
    )

print(f"   Postings : {postings.shape[0]:,} rows x {postings.shape[1]} cols")
print(f"   Skills   : {skills_df.shape[0]:,} rows x {skills_df.shape[1]} cols")

print("\n[2] Preprocessing...")

postings.columns = [c.strip().lower().replace(" ", "_") for c in postings.columns]
skills_df.columns = [c.strip().lower().replace(" ", "_") for c in skills_df.columns]

link_col = next((c for c in postings.columns if "link" in c), postings.columns[0])
s_link_col = next((c for c in skills_df.columns if "link" in c), skills_df.columns[0])
s_skill_col = next((c for c in skills_df.columns if "skill" in c), skills_df.columns[-1])

df = postings.merge(
    skills_df[[s_link_col, s_skill_col]],
    left_on=link_col,
    right_on=s_link_col,
    how="inner",
)

title_col = next((c for c in df.columns if "title" in c), None)
industry_col = next(
    (c for c in df.columns if "industry" in c or "search_position" in c or "position" in c),
    None,
)
location_col = next(
    (c for c in df.columns if "location" in c or "city" in c or "country" in c),
    None,
)
description_col = next(
    (c for c in df.columns if "description" in c or "summary" in c),
    None,
)

print(f"   Title col       : {title_col}")
print(f"   Industry col    : {industry_col}")
print(f"   Location col    : {location_col}")
print(f"   Description col : {description_col}")
print(f"   Skills col      : {s_skill_col}")

if title_col is None:
    raise ValueError("No title column found. Career level prediction needs job titles.")


# ---------------------------------------------------------------------------
# Career level label engineering
# ---------------------------------------------------------------------------
# The dataset does not need to contain career level directly.
# We create labels from job title/description keywords.

JUNIOR_PATTERNS = [
    r"\bintern\b",
    r"\binternship\b",
    r"\bjunior\b",
    r"\bentry\b",
    r"\bentry level\b",
    r"\btrainee\b",
    r"\bgraduate\b",
    r"\bnew grad\b",
    r"\bassociate\b",
    r"\bassistant\b",
    r"\bapprentice\b",
]

SENIOR_PATTERNS = [
    r"\bsenior\b",
    r"\bsr\.?\b",
    r"\blead\b",
    r"\bprincipal\b",
    r"\bstaff\b",
    r"\bmanager\b",
    r"\bdirector\b",
    r"\bhead\b",
    r"\bchief\b",
    r"\barchitect\b",
    r"\bexpert\b",
    r"\bconsultant\b",
    r"\bspecialist\b",
]


def contains_any(text, patterns):
    text = str(text).lower()
    return any(re.search(pattern, text) for pattern in patterns)


def engineer_career_level(row):
    title = str(row.get(title_col, "")).lower()
    desc = str(row.get(description_col, "")).lower() if description_col else ""
    combined = title + " " + desc

    # Title has priority because it is usually more reliable.
    if contains_any(title, JUNIOR_PATTERNS):
        return "Junior"
    if contains_any(title, SENIOR_PATTERNS):
        return "Senior"

    # Description is secondary.
    if contains_any(desc, JUNIOR_PATTERNS):
        return "Junior"
    if contains_any(desc, SENIOR_PATTERNS):
        return "Senior"

    return "Mid-Level"


df["career_level"] = df.apply(engineer_career_level, axis=1)

# Remove empty titles and empty skills.
df = df[df[title_col].notna()].copy()
df = df[df[s_skill_col].notna()].copy()

# Optional sample for faster training.
if len(df) > 15000:
    df = df.sample(15000, random_state=42)

print(f"   Rows after cleaning: {len(df):,}")
print(f"   Career level distribution:\n{df['career_level'].value_counts().to_string()}")

print("\n[3] Feature engineering...")

text_parts = []

if title_col:
    text_parts.append(df[title_col].fillna(""))
if description_col:
    text_parts.append(df[description_col].fillna(""))
if industry_col:
    text_parts.append(df[industry_col].fillna(""))
if location_col:
    text_parts.append(df[location_col].fillna(""))

text_parts.append(df[s_skill_col].fillna(""))

df["ml_text"] = text_parts[0]

for part in text_parts[1:]:
    df["ml_text"] = df["ml_text"] + " " + part

# Remove direct label words from the features.
# This prevents the model from simply reading "senior" and predicting Senior.
LEAK_WORDS = [
    "intern", "internship", "junior", "entry", "trainee", "graduate",
    "associate", "assistant", "apprentice", "senior", "lead", "principal",
    "staff", "manager", "director", "head", "chief", "architect", "expert",
    "consultant", "specialist", "sr"
]


def remove_leak_words(text):
    text = str(text).lower()
    for word in LEAK_WORDS:
        text = re.sub(rf"\b{re.escape(word)}\b", " ", text)
    return text


df["ml_text_clean"] = df["ml_text"].apply(remove_leak_words)

tfidf = TfidfVectorizer(
    max_features=300,
    stop_words="english",
    ngram_range=(1, 2),
    min_df=2,
)

X_text = tfidf.fit_transform(df["ml_text_clean"]).toarray()

extra_features = []

if industry_col:
    le_industry = LabelEncoder()
    industry_values = df[industry_col].fillna("Unknown").astype(str)
    extra_features.append(le_industry.fit_transform(industry_values).reshape(-1, 1))

if location_col:
    le_location = LabelEncoder()
    location_values = df[location_col].fillna("Unknown").astype(str)
    extra_features.append(le_location.fit_transform(location_values).reshape(-1, 1))

if extra_features:
    X = np.hstack([X_text] + extra_features)
else:
    X = X_text

y = df["career_level"].astype(str).values

le_target = LabelEncoder()
y_enc = le_target.fit_transform(y)
class_names = le_target.classes_

print(f"   Feature matrix: {X.shape}")
print(f"   Target classes: {list(class_names)}")

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y_enc,
    test_size=0.2,
    random_state=42,
    stratify=y_enc,
)

scaler = StandardScaler()
X_train_sc = scaler.fit_transform(X_train)
X_test_sc = scaler.transform(X_test)

print(f"   Train: {len(X_train):,} | Test: {len(X_test):,}")


def evaluate(name, model, X_tr, X_te, y_tr, y_te):
    model.fit(X_tr, y_tr)
    y_pred = model.predict(X_te)

    acc = accuracy_score(y_te, y_pred)
    prec = precision_score(y_te, y_pred, average="weighted", zero_division=0)
    rec = recall_score(y_te, y_pred, average="weighted", zero_division=0)
    f1 = f1_score(y_te, y_pred, average="weighted", zero_division=0)
    cm = confusion_matrix(y_te, y_pred)

    print(f"   {name:<38} Acc={acc:.3f} P={prec:.3f} R={rec:.3f} F1={f1:.3f}")

    return {
        "Classifier": name,
        "Accuracy": acc,
        "Precision": prec,
        "Recall": rec,
        "F1-Score": f1,
        "model": model,
        "y_pred": y_pred,
        "cm": cm,
    }


results = []

print("\n[4] Training classifiers for Career Level Prediction...")

print("\n   [4a] K-Nearest Neighbors")
best_knn, best_knn_f1 = None, 0

for k in [3, 5, 7, 11, 15]:
    m = KNeighborsClassifier(n_neighbors=k, metric="euclidean")
    m.fit(X_train_sc, y_train)
    pred = m.predict(X_test_sc)
    f1 = f1_score(y_test, pred, average="weighted", zero_division=0)

    print(f"      k={k:2d} F1={f1:.3f}")

    if f1 > best_knn_f1:
        best_knn_f1 = f1
        best_knn = m

print(f"   Best KNN: k={best_knn.n_neighbors}")
results.append(evaluate("KNN (career level)", best_knn, X_train_sc, X_test_sc, y_train, y_test))


print("\n   [4b] Decision Tree")
best_dt, best_dt_f1 = None, 0

for depth in [4, 8, 12, 16, None]:
    m = DecisionTreeClassifier(max_depth=depth, random_state=42, class_weight="balanced")
    m.fit(X_train, y_train)
    pred = m.predict(X_test)
    f1 = f1_score(y_test, pred, average="weighted", zero_division=0)

    print(f"      max_depth={str(depth):<5} F1={f1:.3f}")

    if f1 > best_dt_f1:
        best_dt_f1 = f1
        best_dt = m

print(f"   Best DT: max_depth={best_dt.max_depth}")
results.append(evaluate("Decision Tree (career level)", best_dt, X_train, X_test, y_train, y_test))


print("\n   [4c] Random Forest")
best_rf, best_rf_f1 = None, 0

for n in [50, 100, 200]:
    m = RandomForestClassifier(
        n_estimators=n,
        random_state=42,
        n_jobs=-1,
        class_weight="balanced",
    )
    m.fit(X_train, y_train)
    pred = m.predict(X_test)
    f1 = f1_score(y_test, pred, average="weighted", zero_division=0)

    print(f"      n_estimators={n:3d} F1={f1:.3f}")

    if f1 > best_rf_f1:
        best_rf_f1 = f1
        best_rf = m

print(f"   Best RF: n_estimators={best_rf.n_estimators}")
results.append(evaluate("Random Forest (career level)", best_rf, X_train, X_test, y_train, y_test))


print("\n   [4d] Neural Network")
arch1 = (64, 32)
arch2 = (128, 64, 32)

nn1 = MLPClassifier(
    hidden_layer_sizes=arch1,
    activation="relu",
    max_iter=300,
    random_state=42,
    early_stopping=True,
)
nn2 = MLPClassifier(
    hidden_layer_sizes=arch2,
    activation="relu",
    max_iter=300,
    random_state=42,
    early_stopping=True,
)

nn1.fit(X_train_sc, y_train)
nn2.fit(X_train_sc, y_train)

f1_nn1 = f1_score(y_test, nn1.predict(X_test_sc), average="weighted", zero_division=0)
f1_nn2 = f1_score(y_test, nn2.predict(X_test_sc), average="weighted", zero_division=0)

print(f"      Architecture {arch1}: F1={f1_nn1:.3f}")
print(f"      Architecture {arch2}: F1={f1_nn2:.3f}")

best_nn = nn1 if f1_nn1 >= f1_nn2 else nn2
print(f"   Best NN: {best_nn.hidden_layer_sizes}")

results.append(evaluate("Neural Network (career level)", best_nn, X_train_sc, X_test_sc, y_train, y_test))


print("\n[5] Results comparison table")

metrics_df = pd.DataFrame([
    {k: v for k, v in r.items() if k not in ("model", "y_pred", "cm")}
    for r in results
])

metrics_df = metrics_df.sort_values("F1-Score", ascending=False).reset_index(drop=True)
print(metrics_df.to_string(index=False))

metrics_df.to_csv(out("comparison_table.csv"), index=False)

fig, ax = plt.subplots(figsize=(10, 5))
x = np.arange(len(metrics_df))
width = 0.2

for i, metric in enumerate(["Accuracy", "Precision", "Recall", "F1-Score"]):
    ax.bar(x + i * width, metrics_df[metric], width, label=metric)

ax.set_xticks(x + width * 1.5)
ax.set_xticklabels(metrics_df["Classifier"], rotation=12, ha="right", fontsize=9)
ax.set_ylim(0, 1.05)
ax.set_title("Career Level Classifier Performance Comparison")
ax.legend()

plt.tight_layout()
plt.savefig(out("classifier_comparison.png"), dpi=150)
plt.close()

print("   Saved: classifier_comparison.png")


fig, axes = plt.subplots(2, 2, figsize=(14, 10))
axes = axes.flatten()

for i, r in enumerate(results):
    sns.heatmap(
        r["cm"],
        annot=True,
        fmt="d",
        cmap="Blues",
        xticklabels=class_names,
        yticklabels=class_names,
        ax=axes[i],
    )
    axes[i].set_title(r["Classifier"])
    axes[i].set_xlabel("Predicted")
    axes[i].set_ylabel("Actual")

plt.tight_layout()
plt.savefig(out("confusion_matrices.png"), dpi=150)
plt.close()

print("   Saved: confusion_matrices.png")

best_result = max(results, key=lambda r: r["F1-Score"])

print(
    f"\n   Best classifier: {best_result['Classifier']} "
    f"(F1={best_result['F1-Score']:.3f})"
)

print(
    classification_report(
        y_test,
        best_result["y_pred"],
        target_names=class_names,
        zero_division=0,
    )
)


print("\n[6] Clustering — K-Means on Job Skill/Text Profiles")

cluster_X = X_text

sample_size = min(5000, len(cluster_X))
cluster_X_sample = cluster_X[:sample_size]
y_true_slice = y_enc[:sample_size]

pca = PCA(n_components=2, random_state=42)
X_pca = pca.fit_transform(cluster_X_sample)

sil_scores = {}

for k in [3, 4, 5, 6, 8]:
    if k >= sample_size:
        continue

    km = KMeans(n_clusters=k, n_init=10, random_state=42)
    labels = km.fit_predict(cluster_X_sample)

    if len(set(labels)) > 1:
        sil = silhouette_score(
            cluster_X_sample,
            labels,
            sample_size=min(2000, sample_size),
            random_state=42,
        )
        sil_scores[k] = sil
        print(f"      K={k} Silhouette={sil:.4f}")

best_k = max(sil_scores, key=sil_scores.get)

km_best = KMeans(n_clusters=best_k, n_init=10, random_state=42)
cluster_labels = km_best.fit_predict(cluster_X_sample)

ari = adjusted_rand_score(y_true_slice, cluster_labels)

print(f"   Best K={best_k} ARI={ari:.4f}")

colors_c = plt.cm.tab10(np.linspace(0, 1, best_k))

fig, axes = plt.subplots(1, 2, figsize=(14, 6))

for c in range(best_k):
    mask = cluster_labels == c
    axes[0].scatter(
        X_pca[mask, 0],
        X_pca[mask, 1],
        color=colors_c[c],
        alpha=0.5,
        s=10,
        label=f"Cluster {c + 1}",
    )

c_pca = pca.transform(km_best.cluster_centers_)

axes[0].scatter(
    c_pca[:, 0],
    c_pca[:, 1],
    color="black",
    marker="X",
    s=120,
    zorder=5,
    label="Centroid",
)

axes[0].set_title(f"K-Means Job Clusters (K={best_k})")
axes[0].legend(fontsize=7)

unique_labels = np.unique(y_true_slice)
colors_y = plt.cm.Set1(np.linspace(0, 1, len(unique_labels)))

for ci, label in enumerate(unique_labels):
    mask = y_true_slice == label
    axes[1].scatter(
        X_pca[mask, 0],
        X_pca[mask, 1],
        color=colors_y[ci],
        alpha=0.5,
        s=10,
        label=le_target.inverse_transform([label])[0],
    )

axes[1].set_title("True Career Level Labels")
axes[1].legend(fontsize=7)

plt.tight_layout()
plt.savefig(out("clustering_pca.png"), dpi=150)
plt.close()

print("   Saved: clustering_pca.png")


fig, ax = plt.subplots(figsize=(7, 4))

ax.plot(
    list(sil_scores.keys()),
    list(sil_scores.values()),
    marker="o",
    color="#6366f1",
    linewidth=2,
)

ax.axvline(best_k, linestyle="--", color="red", label=f"Best K={best_k}")
ax.set_xlabel("K")
ax.set_ylabel("Silhouette Score")
ax.set_title("Silhouette Score vs K")
ax.legend()

plt.tight_layout()
plt.savefig(out("silhouette_curve.png"), dpi=150)
plt.close()

print("   Saved: silhouette_curve.png")


cluster_composition = pd.DataFrame({
    "cluster": cluster_labels,
    "career_level": le_target.inverse_transform(y_true_slice),
})

comp_table = pd.crosstab(
    cluster_composition["cluster"],
    cluster_composition["career_level"],
    normalize="index",
).round(2)

comp_table.to_csv(out("cluster_composition.csv"))

fig, ax = plt.subplots(figsize=(9, 5))

sns.heatmap(comp_table, annot=True, fmt=".2f", cmap="YlOrRd", ax=ax)
ax.set_title("Cluster Composition vs Career Level")

plt.tight_layout()
plt.savefig(out("cluster_composition_heatmap.png"), dpi=150)
plt.close()

print("   Saved: cluster_composition_heatmap.png")


print("\n" + "=" * 70)
print(
    f"  Best Classifier : {best_result['Classifier']} "
    f"(F1={best_result['F1-Score']:.3f})"
)
print(f"  Best K          : {best_k} | Silhouette: {sil_scores[best_k]:.4f}")
print(f"  Output folder   : {OUTPUT_DIR}")
print("=" * 70)
print("\nDone! Restart backend and open 'ML Recommendations' → 'Python ML Analysis' tab.")
