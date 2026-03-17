const STORAGE_KEY = "gohan-time-save-v1";

const characterDefinitions = {
  shiro: {
    id: "shiro",
    name: "しろまる",
    defaultState: {
      fullness: 40,
      affection: 10,
      lastMessage: "おなかすいた〜"
    },
    foods: [
      {
        id: "riceball",
        name: "おにぎり",
        icon: "🍙",
        fullness: 16,
        affection: 6,
        tag: "ていばん"
      },
      {
        id: "pudding",
        name: "ぷりん",
        icon: "🍮",
        fullness: 10,
        affection: 10,
        tag: "おやつ"
      },
      {
        id: "fish",
        name: "おさかな",
        icon: "🐟",
        fullness: 20,
        affection: 7,
        tag: "まんぷく"
      },
      {
        id: "cookie",
        name: "クッキー",
        icon: "🍪",
        fullness: 8,
        affection: 8,
        tag: "おやつ"
      }
    ],
    reactions: {
      feed: {
        riceball: [
          "おにぎり、ほっとする味だね",
        ],
        pudding: [
          "ぷるぷるでおいしい！"
        ],
        fish: [
          "これもおいしいねっ",
        ],
        cookie: [
          "おやつの時間っていいね",
        ]
      },
      pet: [
        "わっ",
      ],
      hungry: [
        "なにか食べたいな…",
        "ぺこぺこかも…"
      ],
      normal: [
        "のんびりしてるよっ",
        "今日は過ごしやすい気温だね",
      ],
      full: [
        "ふぅ〜、おなかいっぱい",
        "元気でてきたっ",
        "しあわせな気分っ"
      ],
      overfed: [
        "もう、ちょっと食べすぎかも…",
        "おなかいっぱいすぎるっ",
        "少し休みたいな…"
      ]
    }
  }
};

const dom = {
  character: document.getElementById("character"),
  characterStage: document.getElementById("characterStage"),
  characterSelect: document.getElementById("characterSelect"),
  speechBubble: document.getElementById("speechBubble"),
  fullnessText: document.getElementById("fullnessText"),
  affectionText: document.getElementById("affectionText"),
  fullnessBar: document.getElementById("fullnessBar"),
  affectionBar: document.getElementById("affectionBar"),
  foodGrid: document.getElementById("foodGrid"),
  petButton: document.getElementById("petButton"),
  resetButton: document.getElementById("resetButton"),
  saveButton: document.getElementById("saveButton")
};

const appState = loadAppState();

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function randomFrom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function createDefaultSaveData() {
  const characters = {};

  Object.values(characterDefinitions).forEach((character) => {
    characters[character.id] = { ...character.defaultState };
  });

  return {
    selectedCharacterId: "shiro",
    characters
  };
}

function mergeSaveData(rawData) {
  const base = createDefaultSaveData();

  if (!rawData || typeof rawData !== "object") {
    return base;
  }

  const merged = {
    selectedCharacterId:
      typeof rawData.selectedCharacterId === "string" &&
      characterDefinitions[rawData.selectedCharacterId]
        ? rawData.selectedCharacterId
        : base.selectedCharacterId,
    characters: {}
  };

  Object.keys(characterDefinitions).forEach((characterId) => {
    const savedCharacter = rawData.characters?.[characterId];
    const defaultCharacter = base.characters[characterId];

    merged.characters[characterId] = {
      fullness:
        typeof savedCharacter?.fullness === "number"
          ? clamp(savedCharacter.fullness, 0, 100)
          : defaultCharacter.fullness,
      affection:
        typeof savedCharacter?.affection === "number"
          ? clamp(savedCharacter.affection, 0, 100)
          : defaultCharacter.affection,
      lastMessage:
        typeof savedCharacter?.lastMessage === "string"
          ? savedCharacter.lastMessage
          : defaultCharacter.lastMessage
    };
  });

  return merged;
}

function loadAppState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createDefaultSaveData();
    }

    return mergeSaveData(JSON.parse(raw));
  } catch (error) {
    return createDefaultSaveData();
  }
}

function saveAppState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
}

function getCurrentCharacterDefinition() {
  return characterDefinitions[appState.selectedCharacterId];
}

function getCurrentCharacterState() {
  return appState.characters[appState.selectedCharacterId];
}

function setCurrentMessage(message) {
  const current = getCurrentCharacterState();
  current.lastMessage = message;
}

function getMoodType(state) {
  if (state.fullness >= 96) return "overfed";
  if (state.fullness >= 75) return "full";
  if (state.fullness <= 20) return "hungry";
  if (state.affection >= 75) return "super-happy";
  return "normal";
}

function getIdleMessage(characterDef, state) {
  if (state.fullness >= 96) {
    return randomFrom(characterDef.reactions.overfed);
  }
  if (state.fullness >= 75) {
    return randomFrom(characterDef.reactions.full);
  }
  if (state.fullness <= 20) {
    return randomFrom(characterDef.reactions.hungry);
  }
  return randomFrom(characterDef.reactions.normal);
}

function updateCharacterVisual() {
  const state = getCurrentCharacterState();
  const moodType = getMoodType(state);

  dom.character.classList.remove(
    "idle",
    "happy",
    "pet",
    "hungry",
    "full",
    "super-happy",
    "overfed"
  );

  dom.character.classList.add("idle");

  if (moodType === "hungry") {
    dom.character.classList.add("hungry");
  } else if (moodType === "full") {
    dom.character.classList.add("full");
  } else if (moodType === "super-happy") {
    dom.character.classList.add("super-happy");
  } else if (moodType === "overfed") {
    dom.character.classList.add("overfed");
  }
}

function renderStatus() {
  const state = getCurrentCharacterState();

  dom.fullnessText.textContent = `${state.fullness} / 100`;
  dom.affectionText.textContent = `${state.affection} / 100`;
  dom.fullnessBar.style.width = `${state.fullness}%`;
  dom.affectionBar.style.width = `${state.affection}%`;
  dom.speechBubble.textContent = state.lastMessage;
}

function createFoodButton(food) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "food-button";
  button.dataset.foodId = food.id;

  button.innerHTML = `
    <span class="food-icon">${food.icon}</span>
    <span class="food-meta">
      <span class="food-name">${food.name}</span>
      <span class="food-effect">満腹 +${food.fullness} / 好感 +${food.affection}</span>
    </span>
    <span class="food-tag">${food.tag}</span>
  `;

  button.addEventListener("click", () => {
    feedCharacter(food.id);
  });

  return button;
}

function renderFoods() {
  const characterDef = getCurrentCharacterDefinition();
  dom.foodGrid.innerHTML = "";

  characterDef.foods.forEach((food) => {
    dom.foodGrid.appendChild(createFoodButton(food));
  });
}

function renderCharacterSelect() {
  dom.characterSelect.innerHTML = "";

  Object.values(characterDefinitions).forEach((characterDef) => {
    const option = document.createElement("option");
    option.value = characterDef.id;
    option.textContent = characterDef.name;
    dom.characterSelect.appendChild(option);
  });

  dom.characterSelect.value = appState.selectedCharacterId;
}

function renderAll() {
  updateCharacterVisual();
  renderStatus();
  renderFoods();
  renderCharacterSelect();
  saveAppState();
}

function animateClassOnce(element, className, duration = 550) {
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);

  window.setTimeout(() => {
    element.classList.remove(className);
    updateCharacterVisual();
  }, duration);
}

function showFloatingItem(icon) {
  const item = document.createElement("div");
  item.className = "floating-item";
  item.textContent = icon;

  const left = 44 + Math.random() * 18;
  const top = 58 + Math.random() * 10;

  item.style.left = `${left}%`;
  item.style.top = `${top}%`;

  dom.characterStage.appendChild(item);

  window.setTimeout(() => {
    item.remove();
  }, 900);
}

function feedCharacter(foodId) {
  const characterDef = getCurrentCharacterDefinition();
  const state = getCurrentCharacterState();
  const food = characterDef.foods.find((item) => item.id === foodId);

  if (!food) return;

  const wasAlreadyOverfed = state.fullness >= 96;

  state.fullness = clamp(state.fullness + food.fullness, 0, 100);

  if (wasAlreadyOverfed) {
    state.affection = clamp(state.affection - 4, 0, 100);
    setCurrentMessage("うぅ…もう入らないかも〜");
  } else if (state.fullness >= 100) {
    state.affection = clamp(state.affection + Math.max(food.affection - 2, 1), 0, 100);
    setCurrentMessage("おいしいけど、さすがに食べすぎかも〜");
  } else {
    state.affection = clamp(state.affection + food.affection, 0, 100);

    const specificMessages = characterDef.reactions.feed[food.id];
    if (Array.isArray(specificMessages) && specificMessages.length > 0) {
      setCurrentMessage(randomFrom(specificMessages));
    } else {
      setCurrentMessage(`${food.name}ありがとう〜`);
    }
  }

  animateClassOnce(dom.character, "happy", 520);
  showFloatingItem(food.icon);
  renderAll();
}

function petCharacter() {
  const characterDef = getCurrentCharacterDefinition();
  const state = getCurrentCharacterState();

  if (state.affection >= 96) {
    setCurrentMessage("一緒にゲームを作らない？");
  } else {
    state.affection = clamp(state.affection + 4, 0, 100);
    setCurrentMessage(randomFrom(characterDef.reactions.pet));
  }

  animateClassOnce(dom.character, "pet", 450);
  renderAll();
}

function resetCurrentCharacter() {
  const characterDef = getCurrentCharacterDefinition();

  appState.characters[characterDef.id] = { ...characterDef.defaultState };
  setCurrentMessage(characterDef.defaultState.lastMessage);

  renderAll();
}

function saveManually() {
  saveAppState();
  const previous = dom.speechBubble.textContent;
  dom.speechBubble.textContent = "保存したよ〜";

  window.setTimeout(() => {
    const current = getCurrentCharacterState();
    if (current.lastMessage === "保存したよ〜") {
      current.lastMessage = previous;
    }
    renderAll();
  }, 900);
}

function changeCharacter(characterId) {
  if (!characterDefinitions[characterId]) return;
  appState.selectedCharacterId = characterId;

  const state = getCurrentCharacterState();
  if (!state.lastMessage || state.lastMessage.trim() === "") {
    state.lastMessage = getCurrentCharacterDefinition().defaultState.lastMessage;
  }

  renderAll();
}

function decayFullness() {
  const state = getCurrentCharacterState();
  const characterDef = getCurrentCharacterDefinition();

  const nextFullness = clamp(state.fullness - 1, 0, 100);
  const fullnessChanged = nextFullness !== state.fullness;

  state.fullness = nextFullness;

  if (fullnessChanged) {
    state.lastMessage = getIdleMessage(characterDef, state);
    renderAll();
  }
}

function bindEvents() {
  dom.petButton.addEventListener("click", petCharacter);
  dom.resetButton.addEventListener("click", resetCurrentCharacter);
  dom.saveButton.addEventListener("click", saveManually);

  dom.characterSelect.addEventListener("change", (event) => {
    changeCharacter(event.target.value);
  });

  window.addEventListener("beforeunload", saveAppState);
}

function init() {
  bindEvents();
  renderAll();

  window.setInterval(() => {
    decayFullness();
  }, 15000);
}

init();
