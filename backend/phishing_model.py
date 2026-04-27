import re
import numpy as np
import torch
from transformers import pipeline
from lime.lime_text import LimeTextExplainer
import logging

import logging

# Initialize logger
logger = logging.getLogger(__name__)

# Initialize the Model
# Model: ealvaradob/bert-finetuned-phishing
logger.info("Initializing BERT phishing model...")
device = 0 if torch.cuda.is_available() else -1
try:
    classifier = pipeline(
        "text-classification",
        model="ealvaradob/bert-finetuned-phishing",
        device=device
    )
    logger.info("BERT model loaded successfully.")
except Exception as e:
    logger.error(f"Failed to load BERT model: {str(e)}")
    classifier = None

def extract_features(url: str):
    """Extract heuristic features from a URL."""
    return {
        "length": len(url),
        "has_https": int("https" in url),
        "dot_count": url.count("."),
        "has_ip": int(bool(re.search(r'\d+\.\d+\.\d+\.\d+', url))),
        "has_suspicious_word": int(any(word in url.lower() for word in ["login", "verify", "bank", "secure", "update", "signin", "account"]))
    }

def predict_proba(urls):
    """Prediction wrapper for LIME."""
    if classifier is None:
        return np.array([[0.5, 0.5]] * len(urls))
        
    results = classifier(urls, batch_size=16)
    all_probs = []
    for res in results:
        score = res['score']
        # The model uses 'LABEL_0'/'LABEL_1' or 'benign'/'phishing'
        # We need to normalize the output to [benign_prob, phishing_prob]
        label = res['label'].lower()
        if label == 'phishing' or label == 'label_1':
            all_probs.append([1 - score, score])
        else:
            all_probs.append([score, 1 - score])
    return np.array(all_probs)

def analyze_url(url: str):
    """
    Analyzes a URL using BERT and heuristics.
    Returns a structured dictionary.
    """
    if classifier is None:
        return {
            "prediction": "unknown",
            "confidence": 0,
            "features": {},
            "explanations": []
        }

    # 1. Get Model Prediction
    result = classifier(url)[0]
    label = result["label"].lower()
    score = result["score"]
    
    # Normalize labels
    is_phishing = (label == 'phishing' or label == 'label_1')
    prediction = "phishing" if is_phishing else "safe"
    
    # 2. Extract Features
    features = extract_features(url)
    
    # 3. Get Explanations (LIME) ONLY if phishing
    explanations = []
    if is_phishing:
        try:
            # Reduce num_samples to 50-100 for performance
            explainer = LimeTextExplainer(class_names=["benign", "phishing"])
            exp = explainer.explain_instance(
                url, 
                predict_proba, 
                num_features=6, 
                num_samples=75 # Optimized sample size
            )
            
            # Format as {word, score}
            for word, importance in exp.as_list():
                explanations.append({
                    "word": word,
                    "score": float(importance)
                })
        except Exception as e:
            logger.error(f"LIME analysis failed: {str(e)}")
            
    return {
        "prediction": prediction,
        "confidence": float(score),
        "features": features,
        "explanations": explanations
    }