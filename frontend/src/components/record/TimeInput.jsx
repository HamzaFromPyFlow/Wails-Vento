import { formatVideoDurationWithMsIncludingHrs } from '@lib/helper-pure';
import styles from '../../styles/modules/Editor.module.scss';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * TimeInput component for desktop editor.
 * Ported from the web version with desktop adaptations.
 */

function TimeInput({
  label,
  valueMs,
  videoDuration,
  minMs = 0,
  maxMs = videoDuration,
  placeholder,
  onChangeMs,
}) {
  const inputRef = useRef(null);
  const caretRef = useRef(null);
  const [inputVal, setInputVal] = useState(
    formatVideoDurationWithMsIncludingHrs(valueMs, videoDuration)
  );

  useEffect(() => {
    setInputVal(formatVideoDurationWithMsIncludingHrs(valueMs, videoDuration));
  }, [valueMs, videoDuration]);

  function parseFormattedTime(input, videoDurationMs) {
    const parts = input.trim().split(':');
    let totalSeconds = 0;

    if (parts.length === 3) {
      const [hh, mm, ss] = parts;
      totalSeconds =
        parseInt(hh || '0') * 3600 +
        parseInt(mm || '0') * 60 +
        parseFloat((ss || '0').replace(',', '.'));
    } else if (parts.length === 2) {
      const [mm, ss] = parts;
      totalSeconds =
        parseInt(mm || '0') * 60 +
        parseFloat((ss || '0').replace(',', '.'));
    } else {
      totalSeconds = parseFloat(input.replace(',', '.'));
    }

    const totalMs = Math.round(totalSeconds * 1000);

    if (!Number.isFinite(totalMs)) return null;
    if (totalMs < 0 || totalMs > videoDurationMs) return null;

    return totalMs;
  }

  const findPrevDigitIndex = (s, caret) => {
    let i = Math.max(0, caret - 1);
    while (i >= 0 && !/\d/.test(s[i])) i--;
    return i;
  };

  const findNextDigitIndex = (s, caret) => {
    let i = Math.max(0, caret);
    while (i < s.length && !/\d/.test(s[i])) i++;
    return i >= s.length ? -1 : i;
  };

  const replaceDigitsInRange = (s, start, end, ch = '0') => {
    const chars = s.split('');
    for (let i = start; i < end && i < chars.length; i++) {
      if (/\d/.test(chars[i])) chars[i] = ch;
    }
    return chars.join('');
  };

  const handleBeforeInput = (e) => {
    const inputEl = e.currentTarget;
    const data = e.nativeEvent?.data ?? null;

    if (!data || !/^\d$/.test(data)) {
      e.preventDefault();
      return;
    }

    const base = inputVal;
    const caret = inputEl.selectionStart ?? base.length;
    let i = Math.max(0, caret);
    while (i < base.length && !/\d/.test(base[i])) i++;
    if (i >= base.length) {
      e.preventDefault();
      return;
    }
    const next = base.slice(0, i) + data + base.slice(i + 1);
    const nextCaret = i + 1;

    const parsed = parseFormattedTime(next, videoDuration);
    const min = minMs ?? 0;
    const max = maxMs ?? videoDuration;

    e.preventDefault();

    if (parsed !== null && parsed >= min && parsed <= max) {
      caretRef.current = nextCaret;
      onChangeMs(parsed);
    } else {
      try {
        inputEl.setSelectionRange(nextCaret, nextCaret);
      } catch {}
      caretRef.current = nextCaret;
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const raw = e.clipboardData.getData('text');
    const cleaned = raw.replace(/[^0-9:\.,]/g, '');
    const parsed = parseFormattedTime(cleaned, videoDuration);
    const min = minMs ?? 0;
    const max = maxMs ?? videoDuration;

    if (parsed !== null && parsed >= min && parsed <= max) {
      caretRef.current = formatVideoDurationWithMsIncludingHrs(parsed, videoDuration).length;
      onChangeMs(parsed);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key !== 'Backspace' && e.key !== 'Delete') return;

    const el = e.currentTarget;
    const selStart = el.selectionStart ?? 0;
    const selEnd = el.selectionEnd ?? selStart;
    const min = minMs ?? 0;
    const max = maxMs ?? videoDuration;

    e.preventDefault();

    if (selStart !== selEnd) {
      const candidate = replaceDigitsInRange(inputVal, selStart, selEnd, '0');
      const parsed = parseFormattedTime(candidate, videoDuration);
      if (parsed !== null && parsed >= min && parsed <= max) {
        caretRef.current = selStart;
        onChangeMs(parsed);
      } else {
        try {
          el.setSelectionRange(selStart, selStart);
        } catch {}
        caretRef.current = selStart;
      }
      return;
    }

    if (e.key === 'Backspace') {
      const prevIdx = findPrevDigitIndex(inputVal, selStart);
      if (prevIdx < 0) return;

      if (inputVal[prevIdx] === '0') {
        const newCaret = prevIdx;
        try {
          el.setSelectionRange(newCaret, newCaret);
        } catch {}
        caretRef.current = newCaret;
        return;
      }

      const candidate = inputVal.slice(0, prevIdx) + '0' + inputVal.slice(prevIdx + 1);
      const parsed = parseFormattedTime(candidate, videoDuration);

      if (parsed !== null && parsed >= min && parsed <= max) {
        caretRef.current = prevIdx;
        onChangeMs(parsed);
      } else {
        const newCaret = prevIdx;
        try {
          el.setSelectionRange(newCaret, newCaret);
        } catch {}
        caretRef.current = newCaret;
      }
      return;
    }

    if (e.key === 'Delete') {
      const nextIdx = findNextDigitIndex(inputVal, selStart);
      if (nextIdx < 0) return;
      const candidate = inputVal.slice(0, nextIdx) + '0' + inputVal.slice(nextIdx + 1);
      const parsed = parseFormattedTime(candidate, videoDuration);

      if (parsed !== null && parsed >= min && parsed <= max) {
        caretRef.current = selStart;
        onChangeMs(parsed);
      } else {
        try {
          el.setSelectionRange(selStart, selStart);
        } catch {}
        caretRef.current = selStart;
      }
      return;
    }
  };

  const handleChange = (input, caretPos) => {
    setInputVal(input);
    const parsed = parseFormattedTime(input, videoDuration);
    if (parsed === null) return;
    if (parsed >= (minMs ?? 0) && parsed <= (maxMs ?? videoDuration)) {
      if (typeof caretPos === 'number') caretRef.current = caretPos;
      onChangeMs(parsed);
    }
  };

  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    if (document.activeElement !== el) return;
    if (caretRef.current == null) return;
    const pos = Math.min(caretRef.current, el.value.length);
    try {
      el.setSelectionRange(pos, pos);
    } catch {}
    caretRef.current = null;
  }, [inputVal]);

  return (
    <div className={styles.inputGroup}>
      <label>{label}</label>
      <input
        type="text"
        ref={inputRef}
        value={inputVal}
        onBeforeInput={handleBeforeInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onChange={(e) => handleChange(e.target.value, e.currentTarget.selectionStart)}
        placeholder={
          placeholder ?? (videoDuration >= 3600000 ? 'HH:MM:SS.ms' : 'MM:SS.ms')
        }
      />
    </div>
  );
}

export default TimeInput;
