/** English versions of the example bridges, by id (levels in the same order as the German originals) */
export const BRIDGES_EN: Record<string, { title: string; description: string; tip: string; levels: { title: string; description: string }[] }> = {
  bridge_natur: {
    title: '10 minutes of nature',
    description: 'A small bridge into nature. Choose the level that feels right for you right now.',
    tip: 'If it fits: name five things you can see right now, just for yourself. It does not have to be loud or special — simply noticing is already enough.',
    levels: [
      { title: 'Look out of the window', description: 'Sit down for just a moment and watch the trees outside.' },
      { title: 'A short look outside', description: 'Stand in front of the door and feel the fresh air for a minute.' },
      { title: 'A short walk', description: 'Walk once around the block and feel the ground under your feet.' },
      { title: 'Dive in deeper', description: 'A longer walk in nature, to really arrive.' },
    ],
  },
  bridge_atem: {
    title: 'Returning to the breath',
    description: 'The breath is always there — a bridge that gently brings you back into your body.',
    tip: 'If counting feels tight or controlling, leave it out — simply noticing the breath is completely enough.',
    levels: [
      { title: 'One conscious breath', description: 'A single breath, without counting, without technique.' },
      { title: 'A few deep breaths', description: 'A few breaths deep in through the nose — no counting needed, just feeling.' },
      { title: 'Calm, counted breath', description: 'If it feels good: 4 seconds in, short pause, 4 seconds out. You can stop at any time.' },
      { title: 'A longer breath journey', description: 'Follow your own breath for a few minutes without changing it.' },
    ],
  },
  bridge_kontakt: {
    title: 'Calling & talking',
    description: 'A small step back towards other people — at your own pace.',
    tip: 'You don’t have to explain why you are getting in touch. “I just wanted to say hi” is completely enough.',
    levels: [
      { title: 'Send a short message', description: 'Send a single word or emoji to someone you trust.' },
      { title: 'Call someone familiar', description: 'A short call — not much needs to be said.' },
      { title: 'Start a conversation', description: 'Actively tell how you are doing right now.' },
      { title: 'Spend time together', description: 'Arrange to meet or spend time together.' },
    ],
  },
  bridge_musik: {
    title: 'Music & sound',
    description: 'Sound can help to arrive in the body again.',
    tip: 'Familiar music often works stronger than new music — the recognition alone can already calm.',
    levels: [
      { title: 'Listen to a song', description: 'Put on a familiar, calm song.' },
      { title: 'Listen consciously', description: 'For one song, do nothing else, just listen.' },
      { title: 'Hum along or move', description: 'Hum along lightly or move gently to it.' },
      { title: 'Make a playlist', description: 'Put together a small playlist for exactly such moments.' },
    ],
  },
  bridge_notiz: {
    title: 'Write something down',
    description: 'Finding words without having to share them right away.',
    tip: 'It may be unfinished, illegible or only understandable to you — nobody but you ever has to read it.',
    levels: [
      { title: 'Note a single word', description: 'One word that fits right now — nothing more.' },
      { title: 'A few sentences', description: 'Briefly write down what is there right now.' },
      { title: 'Write in the diary', description: 'Start a diary entry.' },
      { title: 'Create something', description: 'Write, draw or express in another creative way what is there.' },
    ],
  },
  bridge_salamander_blick: {
    title: 'The salamander look',
    description: 'Keep your head still, move your eyes far to the side until a yawn or swallow comes — releases inner freeze.',
    tip: 'Developed by Stanley Rosenberg (vagus regulation). The extreme eye movement without turning the head decouples the cranial nerves responsible for the freeze reaction (among others III, IV, VI and XI). The involuntary yawn or swallow is the visible sign that the system is releasing the freeze and switching back into the safe ventral vagus.',
    levels: [{ title: 'Try it once', description: 'Keep your head straight. Move only your eyes all the way to the right and stay there for a few breaths until a yawn or swallow comes. Then to the other side.' }],
  },
  bridge_schulterkreisen: {
    title: 'Shoulder circles (fixed gaze)',
    description: 'Eyes fixed, shoulders moving — decouples the eye-neck unit that is locked in freeze.',
    tip: 'From craniofacial therapy (Stanley Rosenberg). In the freeze state, eyes and neck work rigidly as a locked unit (preparing the flight reflex). Moving the shoulders with fixed eyes forces the deep neck muscles to relax, which dissolves the freeze loop in the brainstem.',
    levels: [{ title: '45 seconds', description: 'Fix your gaze on a point straight ahead on the wall, eyes stay rigid on it. Circle your shoulders very slowly and widely backwards — head and eyes do not move.' }],
  },
  bridge_isometrischer_zug: {
    title: 'Isometric hand pull',
    description: 'Discharging blocked energy through a short, successful “feat of strength” — without any outward movement.',
    tip: 'From body-oriented trauma therapy. Freeze is blocked energy — the short, maximal muscle tension without movement (isometrics) simulates a “successful feat of strength” for the nervous system. The system can discharge the blocked energy and releases the brake.',
    levels: [{ title: '5 repetitions', description: 'Hook your fingers together in front of your chest. As you breathe out, try to pull your hands apart with maximum force without letting go. Hold for 5 seconds, let go completely as you breathe in. Repeat 5 times.' }],
  },
};
