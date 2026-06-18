"""Language detection via Unicode-range heuristics (no LLM, <1ms)."""


def detect_language(text: str) -> str:
    """Detect the primary human language of resume text.

    Returns:
        "zh" for Chinese, "ja" for Japanese, "en" for English/other.
    """
    if not text:
        return "en"

    total = 0
    cjk = 0
    hiragana = 0
    katakana = 0

    for ch in text:
        cp = ord(ch)
        if cp >= 0x4E00 and cp <= 0x9FFF:  # CJK Unified Ideographs
            cjk += 1
            total += 1
        elif cp >= 0x3400 and cp <= 0x4DBF:  # CJK Extension A
            cjk += 1
            total += 1
        elif cp >= 0x3040 and cp <= 0x309F:  # Hiragana
            hiragana += 1
            total += 1
        elif cp >= 0x30A0 and cp <= 0x30FF:  # Katakana
            katakana += 1
            total += 1
        elif cp > 127:  # Other non-ASCII
            total += 1
        elif ch.isalpha():  # Latin letters
            total += 1

    if total == 0:
        return "en"

    kana_ratio = (hiragana + katakana) / total
    if kana_ratio > 0.10:
        return "ja"

    cjk_ratio = cjk / total
    if cjk_ratio > 0.30:
        return "zh"

    return "en"
