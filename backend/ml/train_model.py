import pandas as pd
import joblib
import re
import numpy as np

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from scipy.sparse import hstack

# Load dataset
df = pd.read_csv("dataset.csv")

# Text feature
X_text = df["post_body"].astype(str)

# Extract additional features
def extract_features(text):
    """Extract readability and structure features"""
    if not text or pd.isna(text):
        return [0, 0, 0, 0, 0, 0]
    
    words = str(text).split()
    word_count = len(words)
    char_count = len(text)
    
    # Sentence count
    sentences = re.split(r'[.!?]+', text)
    sentence_count = max(1, len([s for s in sentences if s.strip()]))
    
    # Average word length
    avg_word_length = sum(len(word) for word in words) / word_count if word_count > 0 else 0
    
    # Unique word ratio
    unique_words = len(set(word.lower() for word in words))
    unique_word_ratio = unique_words / word_count if word_count > 0 else 0
    
    # Capitalization ratio
    capitalized = sum(1 for word in words if word and word[0].isupper())
    capitalization_ratio = capitalized / word_count if word_count > 0 else 0
    
    return [word_count, char_count, sentence_count, avg_word_length, unique_word_ratio, capitalization_ratio]

# Extract features for all texts
feature_matrix = np.array([extract_features(text) for text in X_text])

# Numeric features (upvotes, downvotes)
X_numeric = df[["upvotes", "downvotes"]].values

# Combine all numeric features
X_all_numeric = np.hstack([X_numeric, feature_matrix])

# Labels
y = df["score_label"]

# TF-IDF vectorization
tfidf = TfidfVectorizer(
    max_features=5000,
    stop_words="english",
    min_df=2,  # Ignore words that appear in less than 2 documents
    max_df=0.95  # Ignore words that appear in more than 95% of documents
)
X_text_vec = tfidf.fit_transform(X_text)

# Combine text + all numeric features
X = hstack([X_text_vec, X_all_numeric])

# Train-test split (for sanity check)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Random Forest model with better parameters
model = RandomForestClassifier(
    n_estimators=300,
    max_depth=30,
    min_samples_split=5,
    min_samples_leaf=2,
    random_state=42,
    n_jobs=-1,
    class_weight='balanced'  # Handle class imbalance
)

# Train
model.fit(X_train, y_train)

# Simple accuracy check
accuracy = model.score(X_test, y_test)
print("Model accuracy:", round(accuracy, 4))

# Save model and vectorizer
joblib.dump(model, "rf_model.pkl")
joblib.dump(tfidf, "tfidf.pkl")

print("Model and vectorizer saved successfully.")
print(f"Features: TF-IDF ({X_text_vec.shape[1]}) + Numeric (8)")