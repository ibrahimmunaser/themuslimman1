/// Converts the Latin Quran transliteration (en.transliteration) into
/// Devanagari (Hindi) or Bengali script, phonetically.
String indicTranslit(String lang, String text) {
  final t = lang == 'bn' ? _bn : lang == 'hi' ? _hi : null;
  if (t == null) return text;
  final out = StringBuffer();
  final word = StringBuffer();
  void flush() {
    if (word.isNotEmpty) {
      out.write(_word(word.toString().toLowerCase(), t));
      word.clear();
    }
  }

  for (final r in text.runes) {
    final ch = String.fromCharCode(r);
    if (RegExp(r"[A-Za-z']").hasMatch(ch)) {
      word.write(ch);
    } else {
      flush();
      out.write(ch);
    }
  }
  flush();
  return out.toString();
}

class _Tbl {
  final Map<String, String> cons;
  final Map<String, String> matra;
  final Map<String, String> indep;
  final String halant;
  const _Tbl(this.cons, this.matra, this.indep, this.halant);
}

const _hi = _Tbl(
  {
    'kh': 'ख', 'sh': 'श', 'gh': 'ग़', 'th': 'थ', 'dh': 'ज़',
    'b': 'ब', 't': 'त', 'j': 'ज', 'h': 'ह', 'd': 'द', 'r': 'र', 'z': 'ज़',
    's': 'स', 'f': 'फ़', 'q': 'क़', 'k': 'क', 'l': 'ल', 'm': 'म', 'n': 'न',
    'w': 'व', 'y': 'य', 'g': 'ग', 'p': 'प', 'v': 'व', 'c': 'क', 'x': 'क्स',
  },
  {
    'a': '', 'aa': 'ा', 'i': 'ि', 'ee': 'ी', 'u': 'ु', 'oo': 'ू',
    'o': 'ो', 'e': 'े', 'ai': 'ै', 'au': 'ौ',
  },
  {
    'a': 'अ', 'aa': 'आ', 'i': 'इ', 'ee': 'ई', 'u': 'उ', 'oo': 'ऊ',
    'o': 'ओ', 'e': 'ए', 'ai': 'ऐ', 'au': 'औ',
  },
  '्',
);

const _bn = _Tbl(
  {
    'kh': 'খ', 'sh': 'শ', 'gh': 'গ', 'th': 'থ', 'dh': 'য',
    'b': 'ব', 't': 'ত', 'j': 'জ', 'h': 'হ', 'd': 'দ', 'r': 'র', 'z': 'জ',
    's': 'স', 'f': 'ফ', 'q': 'ক্ব', 'k': 'ক', 'l': 'ল', 'm': 'ম', 'n': 'ন',
    'w': 'ওয়', 'y': 'য়', 'g': 'গ', 'p': 'প', 'v': 'ভ', 'c': 'ক', 'x': 'ক্স',
  },
  {
    'a': '', 'aa': 'া', 'i': 'ি', 'ee': 'ী', 'u': 'ু', 'oo': 'ূ',
    'o': 'ো', 'e': 'ে', 'ai': 'ৈ', 'au': 'ৌ',
  },
  {
    'a': 'অ', 'aa': 'আ', 'i': 'ই', 'ee': 'ঈ', 'u': 'উ', 'oo': 'ঊ',
    'o': 'ও', 'e': 'এ', 'ai': 'ঐ', 'au': 'ঔ',
  },
  '্',
);

const _vowelTokens = ['aa', 'ee', 'oo', 'ai', 'au', 'a', 'i', 'u', 'o', 'e'];

String _word(String w, _Tbl t) {
  final b = StringBuffer();
  var needVowel = false; // last emitted is a bare consonant
  var i = 0;
  while (i < w.length) {
    final c = w[i];
    if (c == "'") {
      i++;
      continue;
    }
    // vowel?
    String? v;
    for (final tok in _vowelTokens) {
      if (w.startsWith(tok, i)) {
        v = tok;
        break;
      }
    }
    if (v != null) {
      if (needVowel) {
        b.write(t.matra[v]);
      } else {
        b.write(t.indep[v]);
      }
      needVowel = false;
      i += v.length;
      continue;
    }
    // consonant (digraph first)
    String? k;
    if (i + 1 < w.length && t.cons.containsKey(w.substring(i, i + 2))) {
      k = w.substring(i, i + 2);
    } else if (t.cons.containsKey(c)) {
      k = c;
    }
    if (k == null) {
      b.write(c);
      i++;
      continue;
    }
    if (needVowel) b.write(t.halant);
    b.write(t.cons[k]);
    needVowel = true;
    i += k.length;
  }
  if (needVowel) b.write(t.halant);
  return b.toString();
}
