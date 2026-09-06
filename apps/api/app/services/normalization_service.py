import unicodedata
import re
from typing import Dict, Any, Tuple

class NormalizationService:
    def __init__(self):
        self.honorifics = [
            "thiru", "thirumathi", "shri", "shree", "smt", "smt.", "mr", "mr.", "mrs", "mrs.",
            "ms", "ms.", "miss", "dr", "dr.", "late", "selvi", "thiruvalar"
        ]
        
        # Multilingual transliteration dictionary for common land record names
        self.transliteration_map = {
            "ரவிகுமார்": "ravi kumar",
            "ரவி குமார்": "ravi kumar",
            "ரவி": "ravi",
            "குமார்": "kumar",
            "கந்தசாமி": "kandasamy",
            "முருகன்": "murugan",
            "சுரேஷ்": "suresh",
            "மணி": "mani",
            "செல்வம்": "selvam",
            "வெங்கடேஷ்": "venkatesh",
            "ரமேஷ்": "ramesh",
            "பாலன்": "balan",
            "रवि कुमार": "ravi kumar",
            "रवि": "ravi",
            "सुरेश": "suresh",
            "रमेश": "ramesh",
            "राजेश": "rajesh",
            "अनिल": "anil",
            "दीपक": "deepak"
        }

    def normalize_text(self, text: str) -> str:
        """
        Applies Unicode normalization (NFKC), lowercases, and collapses whitespace.
        """
        if not text:
            return ""
        norm = unicodedata.normalize("NFKC", str(text)).lower().strip()
        # Remove unwanted punctuation
        norm = re.sub(r'[^\w\s\./\-]', ' ', norm)
        # Collapse spaces
        norm = re.sub(r'\s+', ' ', norm).strip()
        return norm

    def normalize_person_name(self, name: str) -> str:
        """
        Normalizes person name by stripping honorifics, resolving transliterations,
        and standardizing initials.
        """
        if not name:
            return ""
        
        cleaned_raw = unicodedata.normalize("NFKC", str(name)).strip()
        if cleaned_raw in self.transliteration_map:
            return self.transliteration_map[cleaned_raw]
            
        words = cleaned_raw.split()
        mapped = []
        for w in words:
            w_norm = unicodedata.normalize("NFKC", w).strip()
            if w_norm in self.transliteration_map:
                mapped.append(self.transliteration_map[w_norm])
            else:
                mapped.append(w)
        
        candidate = " ".join(mapped)
        if candidate in self.transliteration_map:
            candidate = self.transliteration_map[candidate]

        norm = self.normalize_text(candidate)
        
        # Remove honorifics
        norm_words = norm.split()
        cleaned_words = [w for w in norm_words if w not in self.honorifics]
        
        cleaned = " ".join(cleaned_words)
        cleaned = re.sub(r'\.', ' ', cleaned)
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()
        
        return cleaned

    def soundex(self, text: str) -> str:
        """
        Standard Soundex phonetic algorithm for English transliterated names.
        """
        text = self.normalize_text(text)
        text = re.sub(r'[^a-z]', '', text)
        if not text:
            return "0000"
            
        first_letter = text[0].upper()
        mapping = {
            'b': '1', 'f': '1', 'p': '1', 'v': '1',
            'c': '2', 'g': '2', 'j': '2', 'k': '2', 'q': '2', 's': '2', 'x': '2', 'z': '2',
            'd': '3', 't': '3',
            'l': '4',
            'm': '5', 'n': '5',
            'r': '6'
        }
        
        encoded = [first_letter]
        prev_code = mapping.get(text[0], '0')
        
        for char in text[1:]:
            code = mapping.get(char, '0')
            if code != '0' and code != prev_code:
                encoded.append(code)
            prev_code = code
            
        soundex_code = "".join(encoded).ljust(4, '0')[:4]
        return soundex_code

    def levenshtein_similarity(self, s1: str, s2: str) -> float:
        """
        Calculates normalized Levenshtein similarity (0.0 to 1.0).
        """
        if not s1 and not s2:
            return 1.0
        if not s1 or not s2:
            return 0.0
            
        m, n = len(s1), len(s2)
        dp = [[0] * (n + 1) for _ in range(m + 1)]
        
        for i in range(m + 1):
            dp[i][0] = i
        for j in range(n + 1):
            dp[0][j] = j
            
        for i in range(1, m + 1):
            for j in range(1, n + 1):
                cost = 0 if s1[i-1] == s2[j-1] else 1
                dp[i][j] = min(
                    dp[i-1][j] + 1,      # deletion
                    dp[i][j-1] + 1,      # insertion
                    dp[i-1][j-1] + cost  # substitution
                )
                
        dist = dp[m][n]
        max_len = max(m, n)
        return round(1.0 - (dist / max_len), 4)

    def compare_names(self, name1: str, name2: str) -> Dict[str, Any]:
        """
        Compares two names using fuzzy string similarity, initial matching,
        and phonetic Soundex comparison.
        Returns: {score: float, category: MATCH | PROBABLE_MATCH | POSSIBLE_MATCH | NO_MATCH, details: dict}
        """
        n1 = self.normalize_person_name(name1)
        n2 = self.normalize_person_name(name2)
        
        if not n1 or not n2:
            return {"score": 0.0, "category": "NO_MATCH", "reason": "One or both names are empty"}
            
        # Exact match
        if n1 == n2:
            return {
                "score": 100.0,
                "category": "MATCH",
                "reason": "Exact normalized name match",
                "normalized_1": n1,
                "normalized_2": n2
            }
            
        # Check initial expansion: e.g. "r kumar" vs "ravi kumar"
        tokens1 = n1.split()
        tokens2 = n2.split()
        
        initial_match = False
        if len(tokens1) >= 2 and len(tokens2) >= 2:
            # Case 1: Initial is first token
            if (len(tokens1[0]) == 1 and tokens2[0].startswith(tokens1[0]) and tokens1[1:] == tokens2[1:]) or \
               (len(tokens2[0]) == 1 and tokens1[0].startswith(tokens2[0]) and tokens1[1:] == tokens2[1:]):
                initial_match = True
            # Case 2: Initial is last token
            elif (len(tokens1[-1]) == 1 and tokens2[-1].startswith(tokens1[-1]) and tokens1[:-1] == tokens2[:-1]) or \
                 (len(tokens2[-1]) == 1 and tokens1[-1].startswith(tokens2[-1]) and tokens1[:-1] == tokens2[:-1]):
                initial_match = True

        lev_score = self.levenshtein_similarity(n1, n2) * 100.0
        snd1 = self.soundex(n1)
        snd2 = self.soundex(n2)
        soundex_match = (snd1 == snd2)
        
        final_score = lev_score
        if initial_match:
            final_score = max(final_score, 92.0)
        elif soundex_match and lev_score > 70.0:
            final_score = min(100.0, final_score + 15.0)

        if final_score >= 90.0:
            category = "MATCH"
        elif final_score >= 78.0:
            category = "PROBABLE_MATCH"
        elif final_score >= 60.0:
            category = "POSSIBLE_MATCH"
        else:
            category = "NO_MATCH"
            
        return {
            "score": round(final_score, 1),
            "category": category,
            "soundex_1": snd1,
            "soundex_2": snd2,
            "normalized_1": n1,
            "normalized_2": n2,
            "initial_match": initial_match,
            "soundex_match": soundex_match
        }

normalization_service = NormalizationService()
