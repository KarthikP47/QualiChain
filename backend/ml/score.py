import sys
import os
import json
import joblib  # type: ignore
import numpy as np  # type: ignore
import re
import warnings
import io
from scipy.sparse import hstack  # type: ignore

warnings.filterwarnings('ignore')

# Handle Windows UTF-8 encoding issues for stdin/stdout safely
try:
    if hasattr(sys.stdin, 'buffer'):
        sys.stdin = io.TextIOWrapper(sys.stdin.buffer, encoding='utf-8')
    if hasattr(sys.stdout, 'buffer'):
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
except Exception:
    pass

# Load model and vectorizer safely regardless of CWD
base_dir = os.path.dirname(os.path.abspath(__file__))
model = joblib.load(os.path.join(base_dir, "rf_model.pkl"))
tfidf = joblib.load(os.path.join(base_dir, "tfidf.pkl"))

def detect_jibberish(text):
    """Detect if text is jibberish/nonsensical"""
    if not text or len(text.strip()) == 0:
        return True
    
    # Check for excessive repeated characters (e.g., "aaaaaa", "asdfasdfasdf")
    repeated_chars = re.findall(r'(.)\1{4,}', text.lower())
    if len(repeated_chars) > 2:
        return True
    
    # Check for repeated words/phrases (spam pattern)
    words = text.lower().split()
    if len(words) > 3:
        # Check if same word appears more than 50% of the time
        word_counts = {}
        for word in words:
            word_counts[word] = word_counts.get(word, 0) + 1
        max_repeat = max(word_counts.values()) if word_counts else 0
        if max_repeat > len(words) * 0.5:
            return True
    
    # Check for too many non-alphabetic characters
    alpha_chars = sum(1 for c in text if c.isalpha())
    if len(text) > 10 and alpha_chars / len(text) < 0.4:
        return True
    
    # Check for random character sequences (like "asdf qwer zxcv")
    random_patterns = re.findall(r'\b[a-z]{1,4}\s+[a-z]{1,4}\s+[a-z]{1,4}\b', text.lower())
    if len(random_patterns) > len(text.split()) * 0.3:
        return True
    
    return False

def calculate_readability_features(text):
    """Calculate readability and structure features"""
    if not text:
        return {
            'word_count': 0,
            'char_count': 0,
            'sentence_count': 0,
            'avg_word_length': 0,
            'unique_word_ratio': 0,
            'capitalization_ratio': 0,
            'punctuation_count': 0
        }
    
    # Basic counts
    words = text.split()
    word_count = len(words)
    char_count = len(text)
    
    # Sentence count (split by . ! ?)
    sentences = re.split(r'[.!?]+', text)
    sentence_count = max(1, len([s for s in sentences if s.strip()]))
    
    # Average word length
    if word_count > 0:
        avg_word_length = sum(len(word) for word in words) / word_count
    else:
        avg_word_length = 0
    
    # Unique word ratio (vocabulary diversity)
    unique_words = len(set(word.lower() for word in words))
    unique_word_ratio = unique_words / word_count if word_count > 0 else 0
    
    # Capitalization (proper sentences)
    capitalized = sum(1 for word in words if word and word[0].isupper())
    capitalization_ratio = capitalized / word_count if word_count > 0 else 0
    
    # Punctuation
    punctuation_count = len(re.findall(r'[.,!?;:]', text))
    
    return {
        'word_count': word_count,
        'char_count': char_count,
        'sentence_count': sentence_count,
        'avg_word_length': avg_word_length,
        'unique_word_ratio': unique_word_ratio,
        'capitalization_ratio': capitalization_ratio,
        'punctuation_count': punctuation_count
    }

def apply_rule_based_penalties(text, ml_prob, upvotes, downvotes):
    """Apply strict rule-based penalties before ML score"""
    features = calculate_readability_features(text)
    
    # Base ML score thresholding (if model is unsure, penalize it)
    if ml_prob < 0.4:
        ml_prob *= 0.1 # Heavily punish low-confidence scores
    elif ml_prob < 0.6:
        ml_prob *= 0.5 # Moderate punish for middle-of-the-road scores
        
    # Rule 1: Too short posts get heavy penalty (Steemit posts are long)
    if features['word_count'] < 20:
        return 0.0  # Zero points for basically comments
    elif features['word_count'] < 50:
        ml_prob *= 0.1  # Extreme penalty for short blurbs
    elif features['word_count'] < 100:
        ml_prob *= 0.4  # Heavy penalty
    elif features['word_count'] < 200:
        ml_prob *= 0.8  # Light penalty
    
    # Rule 2: Jibberish detection - zero score
    if detect_jibberish(text):
        return 0.0
    
    # Rule 3: Very low vocabulary diversity (repetitive)
    if features['word_count'] > 20 and features['unique_word_ratio'] < 0.4:
        ml_prob *= 0.0  # Zero for clearly repetitive spam
    elif features['word_count'] > 20 and features['unique_word_ratio'] < 0.5:
        ml_prob *= 0.2
        
    # Rule 4: No sentence structure (all lowercase, no punctuation)
    if features['word_count'] > 20:
        if features['capitalization_ratio'] < 0.05 and features['punctuation_count'] < 5:
            ml_prob *= 0.1  # Poor structure penalty
    
    # Rule 5: Avg word length (catch "asdf asdf asdf" or "a b c d")
    if features['avg_word_length'] < 3.0 and features['word_count'] > 20:
        ml_prob *= 0.0  # Likely jibberish
    
    # Rule 6: Negative vote ratio penalty (strict downvote handling)
    total_votes = upvotes + downvotes
    if total_votes > 0:
        downvote_ratio = downvotes / total_votes
        if downvote_ratio > 0.3:  # Just 30% downvotes ruins the post
            ml_prob *= 0.0
        elif downvote_ratio > 0.1:  # 10% downvotes introduces penalty
            ml_prob *= 0.4
            
    # Rule 7: Zero upvotes gets no free pass unless ML is extremely confident
    if upvotes == 0 and ml_prob < 0.8:
        ml_prob *= 0.5
    
    return max(0.0, min(1.0, ml_prob))  # Clamp between 0 and 1

# Read input from Node
try:
    input_str = sys.stdin.read()
    data = json.loads(input_str) if input_str.strip() else {}
except Exception:
    data = {}

text = str(data.get("body", "") or "")
upvotes = int(data.get("upvotes", 0))
downvotes = int(data.get("downvotes", 0))

# Early exit for empty text
if not text.strip():
    print("ML_PROB: 0.0")
    sys.exit(0)

# Transform text
X_text = tfidf.transform([text])

feat = calculate_readability_features(text)
feature_matrix = [
    feat['word_count'],
    feat['char_count'],
    feat['sentence_count'],
    feat['avg_word_length'],
    feat['unique_word_ratio'],
    feat['capitalization_ratio']
]

# Numeric features
X_num = np.array([[upvotes, downvotes] + feature_matrix])

# Combine features
X = hstack([X_text, X_num])

# Predict probability of high quality (class 1)
ml_prob = model.predict_proba(X)[0][1]

# Apply strict rule-based penalties
final_prob = apply_rule_based_penalties(text, ml_prob, upvotes, downvotes)

# Output probability using explicit format for backend parsing
print(f"ML_PROB: {final_prob}")

