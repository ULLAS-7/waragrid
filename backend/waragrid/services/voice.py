"""Farmer channel: call scripts per language plus mock IVR / WhatsApp senders.
Swap MockChannel.send for Twilio / WhatsApp Cloud API calls when you go beyond the prototype."""
# Have a native speaker proofread hi / pa / mr before any farmer hears them.
SCRIPTS = {
    "en": "Your pump turn is {s} to {e}. Press 1 to confirm, 2 to swap.",
    "hi": "आपके पंप की बारी {s} से {e} तक है। पक्का करने के लिए 1 दबाइए, बदलने के लिए 2 दबाइए।",
    "pa": "ਤੁਹਾਡੇ ਪੰਪ ਦੀ ਵਾਰੀ {s} ਤੋਂ {e} ਤੱਕ ਹੈ। ਪੱਕਾ ਕਰਨ ਲਈ 1 ਦਬਾਓ, ਬਦਲਣ ਲਈ 2 ਦਬਾਓ।",
    "mr": "तुमच्या पंपाची पाळी {s} ते {e} अशी आहे. निश्चित करण्यासाठी 1 दाबा, बदलण्यासाठी 2 दाबा.",
}


def script(lang, start, end):
    return SCRIPTS[lang].format(s=start, e=end)


def all_scripts(start, end):
    return {lang: script(lang, start, end) for lang in SCRIPTS}


class MockChannel:
    """Records the message instead of calling a telephony API."""
    kind = "mock"

    def __init__(self):
        self.outbox = []

    def send(self, to, text, lang="en"):
        self.outbox.append({"to": to, "lang": lang, "text": text, "channel": self.kind})
        return self.outbox[-1]


class MockIVR(MockChannel):
    kind = "ivr"


class MockWhatsApp(MockChannel):
    kind = "whatsapp-voice-note"
