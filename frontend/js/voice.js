/** Browser speech stands in for the IVR call or WhatsApp voice note. Replace with a telephony API later. */
export function speak(text, locale) {
  if (!text || !('speechSynthesis' in window)) return false;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = locale;
  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
  return true;
}
