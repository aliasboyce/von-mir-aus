/** Symbols to choose from (routine cards, mind maps …). Grouped so the list never feels like a wall. */
export interface EmojiGroup {
  id: string;
  label: string;
  labelEn: string;
  icon: string;
  items: string[];
}

export const EMOJI_GROUPS: EmojiGroup[] = [
  { id: 'daily', label: 'Alltag', labelEn: 'Daily', icon: '🌤️', items: ['💧', '🌤️', '🌬️', '🪥', '🍵', '🧘', '🚶', '🛏️', '📵', '🌱', '🧴', '🍎', '📓', '☀️', '🌙', '💊', '🧦', '🎧', '🕯️', '🫖', '🚿', '🧼', '🪟', '🧺', '🛒', '📞', '💌', '🔑', '⏰', '🗓️', '📝', '✅'] },
  { id: 'body', label: 'Körper', labelEn: 'Body', icon: '🫶', items: ['🫶', '🤲', '🙌', '💆', '🛀', '🧖', '🫁', '❤️', '🧠', '🦶', '👣', '🖐️', '🤗', '😮‍💨', '🥶', '🥵', '😴', '🤸', '🏃', '🚴', '🏊', '🧎', '🙆', '🧍'] },
  { id: 'nature', label: 'Natur', labelEn: 'Nature', icon: '🌳', items: ['🌳', '🌲', '🌿', '🍀', '🌸', '🌻', '🌷', '🍂', '🍁', '🌾', '🌊', '🏔️', '🌈', '☁️', '🌧️', '❄️', '🔥', '🌅', '🌄', '⭐', '✨', '🌕', '🪨', '🐚'] },
  { id: 'food', label: 'Essen', labelEn: 'Food', icon: '🍲', items: ['🍲', '🥣', '🍞', '🧀', '🥕', '🥦', '🍓', '🍌', '🍊', '🥛', '☕', '🍯', '🥜', '🍪', '🍫', '🍦', '🥗', '🍳', '🍜', '🫐', '🍐', '🥑', '🧃', '🍽️'] },
  { id: 'calm', label: 'Ruhe', labelEn: 'Calm', icon: '🕊️', items: ['🕊️', '🧸', '🛋️', '🧶', '🪔', '🔔', '🫧', '🪷', '🌙', '💤', '🌌', '🦋', '🐢', '🍃', '🪶', '🏡', '⛅', '🎐', '🧿', '🪞'] },
  { id: 'create', label: 'Kreativ', labelEn: 'Creative', icon: '🎨', items: ['🎨', '🖌️', '✏️', '📖', '📚', '🎵', '🎶', '🎸', '🎹', '🥁', '🎤', '📷', '🎬', '🧩', '🎲', '🪡', '🧵', '✂️', '🪄', '💡', '🧪', '🔭', '💻', '🎮'] },
  { id: 'animals', label: 'Tiere', labelEn: 'Animals', icon: '🐕', items: ['🐕', '🐈', '🐇', '🐹', '🐦', '🐴', '🐑', '🐝', '🐞', '🦆', '🐠', '🐢', '🦔', '🦉', '🐻', '🦊', '🐘', '🦒', '🐼', '🦋'] },
  { id: 'people', label: 'Menschen & Orte', labelEn: 'People & places', icon: '🤝', items: ['🤝', '👪', '👫', '🧑‍🤝‍🧑', '👵', '👴', '🧒', '👶', '💞', '🏠', '🏥', '🏫', '🌆', '🚌', '🚆', '🚲', '⛪', '🏞️', '🏖️', '🛍️', '🏢', '🧳', '✈️', '🗺️'] },
  { id: 'feel', label: 'Gefühle', labelEn: 'Feelings', icon: '💛', items: ['💛', '💚', '💙', '💜', '🧡', '🤍', '🖤', '🩷', '😊', '🙂', '😌', '😔', '😟', '😢', '😠', '🥰', '🤔', '😐', '🫥', '🌧️', '⚡', '🎈', '🌟', '🎁'] },
  { id: 'symbols', label: 'Zeichen', labelEn: 'Symbols', icon: '🔶', items: ['🔶', '🔷', '⭕', '🔺', '⬛', '➕', '➖', '➡️', '↔️', '🔁', '⚓', '🧭', '📌', '📍', '🔒', '🔓', '❓', '❗', '💬', '🏷️', '🚩', '🎯', '🏆', '⚖️'] },
];

/** 32 gentle colours, in rows from warm to cool. */
export const PALETTE_COLORS = [
  '#e8a83d', '#f0b957', '#d9778a', '#e58a8a', '#c9522f', '#d98a4f', '#c9a227', '#8fae3d',
  '#6fbf73', '#4fa387', '#4a8f9e', '#5b9bd5', '#5b7fb5', '#7a8fd6', '#9a7bc4', '#b58acb',
  '#c76fa6', '#e09ab8', '#8d6e63', '#a1887f', '#78909c', '#90a4ae', '#607d8b', '#455a64',
  '#7bb661', '#a8c686', '#f2c9a0', '#f4d9a8', '#cfd8dc', '#b0bec5', '#5d4e75', '#2f3e46',
];
