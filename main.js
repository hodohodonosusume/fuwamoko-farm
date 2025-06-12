// ふわもこファーム ゲームロジック

// --- ゲームデータ ---
const GAME_DATA = {
  animals: [
    { id: 1, name: "ふわもこウサギ", color: "#ffe0e4", earn: 1, price: 0, unlocked: true, emoji: "🐰" },
    { id: 2, name: "ふわもこヒツジ", color: "#e0f7fa", earn: 3, price: 50, unlocked: false, emoji: "🐑" },
    { id: 3, name: "ふわもこネコ", color: "#fffde7", earn: 8, price: 200, unlocked: false, emoji: "🐱" },
    { id: 4, name: "ふわもこイヌ", color: "#f3e5f5", earn: 18, price: 800, unlocked: false, emoji: "🐶" },
    { id: 5, name: "ふわもこリス", color: "#ffe0b2", earn: 40, price: 3000, unlocked: false, emoji: "🐿️" }
  ],
  decors: [
    { id: 1, name: "お花畑", price: 100, emoji: "🌸", unlocked: false },
    { id: 2, name: "ピクニックシート", price: 350, emoji: "🧺", unlocked: false },
    { id: 3, name: "虹", price: 1000, emoji: "🌈", unlocked: false }
  ]
};

let state = {
  coin: 0,
  animals: [1], // 最初はうさぎのみ
  animalLevels: { 1: 1 },
  animalCounts: { 1: 1 },
  decors: [],
  lastCollect: Date.now(),
  lastSave: Date.now()
};

// --- セーブ/ロード ---
function saveGame() {
  localStorage.setItem("fuwamokoFarm", JSON.stringify(state));
}
function loadGame() {
  const data = localStorage.getItem("fuwamokoFarm");
  if (data) {
    state = JSON.parse(data);
    // 型安全のため最低限の初期化
    if (!state.animals) state.animals = [1];
    if (!state.animalLevels) state.animalLevels = { 1: 1 };
    if (!state.animalCounts) state.animalCounts = { 1: 1 };
    if (!state.decors) state.decors = [];
    if (!state.lastCollect) state.lastCollect = Date.now();
    if (!state.lastSave) state.lastSave = Date.now();
  }
}
loadGame();

// --- 収穫ロジック ---
function getEarnings() {
  let total = 0;
  for (const id of state.animals) {
    const animal = GAME_DATA.animals.find(a => a.id === id);
    const count = state.animalCounts[id] || 1;
    const level = state.animalLevels[id] || 1;
    total += animal.earn * count * level;
  }
  return total;
}
function collect() {
  const now = Date.now();
  const diffSec = Math.floor((now - state.lastCollect) / 1000);
  const earn = getEarnings();
  const gain = earn * diffSec;
  if (gain > 0) {
    state.coin += gain;
    state.lastCollect = now;
    showToast(`+${gain} コイン収穫！`);
    updateCoin();
    saveGame();
    draw();
  } else {
    showToast("まだ収穫できません");
  }
}

// --- UI更新 ---
function updateCoin() {
  document.getElementById("coin-count").textContent = state.coin;
}

// --- ショップ ---
function openShop() {
  const shop = document.getElementById("shop-modal");
  shop.style.display = "block";
  const list = document.getElementById("shop-list");
  list.innerHTML = "";
  // 動物購入
  GAME_DATA.animals.forEach(animal => {
    if (animal.unlocked || state.animals.includes(animal.id)) return;
    const btn = document.createElement("button");
    btn.textContent = `${animal.emoji} ${animal.name}（${animal.price}コイン）`;
    btn.onclick = () => {
      if (state.coin >= animal.price) {
        state.coin -= animal.price;
        state.animals.push(animal.id);
        state.animalCounts[animal.id] = 1;
        state.animalLevels[animal.id] = 1;
        animal.unlocked = true;
        showToast(`${animal.name}を仲間にした！`);
        updateCoin();
        saveGame();
        draw();
        openShop();
      } else {
        showToast("コインが足りません");
      }
    };
    list.appendChild(btn);
  });
  // 動物追加購入
  state.animals.forEach(id => {
    const animal = GAME_DATA.animals.find(a => a.id === id);
    const btn = document.createElement("button");
    btn.textContent = `${animal.emoji} ${animal.name}を追加（${animal.price}コイン）`;
    btn.onclick = () => {
      if (state.coin >= animal.price) {
        state.coin -= animal.price;
        state.animalCounts[id] = (state.animalCounts[id] || 1) + 1;
        showToast(`${animal.name}をもう1匹追加！`);
        updateCoin();
        saveGame();
        draw();
        openShop();
      } else {
        showToast("コインが足りません");
      }
    };
    list.appendChild(btn);
  });
}
function closeShop() {
  document.getElementById("shop-modal").style.display = "none";
}

// --- 動物図鑑 ---
function openAnimal() {
  const modal = document.getElementById("animal-modal");
  modal.style.display = "block";
  const list = document.getElementById("animal-list");
  list.innerHTML = "";
  state.animals.forEach(id => {
    const animal = GAME_DATA.animals.find(a => a.id === id);
    const div = document.createElement("div");
    div.style.marginBottom = "8px";
    div.innerHTML = `<span style="font-size:2em">${animal.emoji}</span> ${animal.name} Lv.${state.animalLevels[id]} ×${state.animalCounts[id] || 1}
      <button style="margin-left:8px" onclick="levelUpAnimal(${id})">レベルアップ（${animal.price * 2}コイン）</button>`;
    list.appendChild(div);
  });
}
function closeAnimal() {
  document.getElementById("animal-modal").style.display = "none";
}
window.levelUpAnimal = function(id) {
  const animal = GAME_DATA.animals.find(a => a.id === id);
  const price = animal.price * 2;
  if (state.coin >= price) {
    state.coin -= price;
    state.animalLevels[id] = (state.animalLevels[id] || 1) + 1;
    showToast(`${animal.name}がLv.${state.animalLevels[id]}になった！`);
    updateCoin();
    saveGame();
    draw();
    openAnimal();
  } else {
    showToast("コインが足りません");
  }
};

// --- デコレーション ---
function openDecor() {
  const modal = document.getElementById("decor-modal");
  modal.style.display = "block";
  const list = document.getElementById("decor-list");
  list.innerHTML = "";
  GAME_DATA.decors.forEach(decor => {
    const owned = state.decors.includes(decor.id);
    const btn = document.createElement("button");
    btn.textContent = owned ? `設置中: ${decor.emoji} ${decor.name}` : `${decor.emoji} ${decor.name}（${decor.price}コイン）`;
    btn.disabled = owned;
    btn.onclick = () => {
      if (state.coin >= decor.price) {
        state.coin -= decor.price;
        state.decors.push(decor.id);
        showToast(`${decor.name}を設置！`);
        updateCoin();
        saveGame();
        draw();
        openDecor();
      } else {
        showToast("コインが足りません");
      }
    };
    list.appendChild(btn);
  });
}
function closeDecor() {
  document.getElementById("decor-modal").style.display = "none";
}

// --- トースト通知 ---
function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.style.display = "block";
  setTimeout(() => { toast.style.display = "none"; }, 1800);
}

// --- キャンバス描画 ---
const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // 背景
  ctx.fillStyle = "#e3f2fd";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // デコ
  let y = 80;
  state.decors.forEach(id => {
    const decor = GAME_DATA.decors.find(d => d.id === id);
    ctx.font = "2.2em serif";
    ctx.fillText(decor.emoji, 200, y);
    y += 40;
  });
  // 動物
  const n = state.animals.length;
  let x = 60;
  state.animals.forEach((id, i) => {
    const animal = GAME_DATA.animals.find(a => a.id === id);
    const count = state.animalCounts[id] || 1;
    for (let j = 0; j < count; j++) {
      ctx.beginPath();
      ctx.arc(x + (j * 40), 400 + Math.sin(Date.now()/800 + i*2 + j)*6, 36, 0, 2 * Math.PI);
      ctx.fillStyle = animal.color;
      ctx.fill();
      ctx.font = "2.3em serif";
      ctx.fillText(animal.emoji, x - 18 + (j * 40), 410 + Math.sin(Date.now()/800 + i*2 + j)*6);
    }
    x += 80;
  });
  // 地面
  ctx.fillStyle = "#b2dfdb";
  ctx.fillRect(0, 540, canvas.width, 60);
}
setInterval(draw, 1000 / 30);

// --- イベント ---
document.getElementById("collect-btn").onclick = collect;
document.getElementById("shop-btn").onclick = openShop;
document.getElementById("animal-btn").onclick = openAnimal;
document.getElementById("decor-btn").onclick = openDecor;
document.querySelectorAll(".close-btn").forEach(btn => {
  btn.onclick = () => {
    btn.parentElement.style.display = "none";
  };
});

// --- 放置報酬 ---
function grantOfflineEarnings() {
  const now = Date.now();
  const diff = Math.floor((now - state.lastCollect) / 1000);
  if (diff > 10) {
    const earn = getEarnings();
    const gain = earn * diff;
    state.coin += gain;
    state.lastCollect = now;
    showToast(`おかえり！放置報酬 +${gain}コイン`);
    updateCoin();
    saveGame();
    draw();
  }
}
window.onload = () => {
  updateCoin();
  grantOfflineEarnings();
  draw();
};

// --- 自動収穫 ---
setInterval(() => {
  collect();
}, 10000);

// --- 定期セーブ ---
setInterval(saveGame, 30000);

window.onbeforeunload = saveGame;