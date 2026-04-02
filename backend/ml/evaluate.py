import pandas as pd
import numpy as np
import joblib
import re
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import accuracy_score, precision_score, f1_score, confusion_matrix, roc_curve, auc
from sklearn.model_selection import train_test_split
from scipy.sparse import hstack
import json

# Setup
model = joblib.load('rf_model.pkl')
tfidf = joblib.load('tfidf.pkl')
df = pd.read_csv('dataset.csv')

X_text = df["post_body"].astype(str)

def extract_features(text):
    if not text or pd.isna(text):
        return [0, 0, 0, 0, 0, 0]
    words = str(text).split()
    word_count = len(words)
    char_count = len(text)
    sentences = re.split(r'[.!?]+', text)
    sentence_count = max(1, len([s for s in sentences if s.strip()]))
    avg_word_length = sum(len(word) for word in words) / word_count if word_count > 0 else 0
    unique_words = len(set(word.lower() for word in words))
    unique_word_ratio = unique_words / word_count if word_count > 0 else 0
    capitalized = sum(1 for word in words if word and word[0].isupper())
    capitalization_ratio = capitalized / word_count if word_count > 0 else 0
    return [word_count, char_count, sentence_count, avg_word_length, unique_word_ratio, capitalization_ratio]

feature_matrix = np.array([extract_features(text) for text in X_text])
X_numeric = df[["upvotes", "downvotes"]].values
X_all_numeric = np.hstack([X_numeric, feature_matrix])

y = df["score_label"]
X_text_vec = tfidf.transform(X_text)
X = hstack([X_text_vec, X_all_numeric])

_, X_test, _, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

y_pred = model.predict(X_test)
y_prob = model.predict_proba(X_test)[:, 1]

# Metrics
acc = accuracy_score(y_test, y_pred)
prec = precision_score(y_test, y_pred)
f1 = f1_score(y_test, y_pred)

print(json.dumps({'accuracy': acc, 'precision': prec, 'f1': f1}))

# Plotting
plt.figure(figsize=(12, 5))

# Confusion Matrix
plt.subplot(1, 2, 1)
cm = confusion_matrix(y_test, y_pred)
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', cbar=False)
plt.title('Confusion Matrix')
plt.xlabel('Predicted Label')
plt.ylabel('True Label')
plt.xticks([0.5, 1.5], ['Low Quality', 'High Quality'])
plt.yticks([0.5, 1.5], ['Low Quality', 'High Quality'])

# ROC Curve
plt.subplot(1, 2, 2)
fpr, tpr, _ = roc_curve(y_test, y_prob)
roc_auc = auc(fpr, tpr)
plt.plot(fpr, tpr, color='darkorange', lw=2, label=f'ROC curve (area = {roc_auc:.2f})')
plt.plot([0, 1], [0, 1], color='navy', lw=2, linestyle='--')
plt.xlim([0.0, 1.0])
plt.ylim([0.0, 1.05])
plt.xlabel('False Positive Rate')
plt.ylabel('True Positive Rate')
plt.title('Receiver Operating Characteristic')
plt.legend(loc="lower right")

plt.tight_layout()
plt.savefig('model_evaluation.png', dpi=300)
print('Graph saved as model_evaluation.png')
