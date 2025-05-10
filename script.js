function getRank(level) {
  if (level >= 50) return 'S';
  if (level >= 35) return 'A';
  if (level >= 20) return 'B';
  if (level >= 10) return 'C';
  if (level >= 5) return 'D';
  return 'E';
}

function rankValue(rank) {
  return ['E', 'D', 'C', 'B', 'A', 'S'].indexOf(rank);
}

// Keys for today
const todayKey = new Date().toISOString().split('T')[0]; // e.g., "2025-05-10"
const auraKey = `aura-${todayKey}`;
const temptedKey = `tempted-${todayKey}`;

// Keys for yesterday (discipline bonus)
const yesterday = new Date(Date.now() - 86400000); // 1 day ago
const yesterdayKey = yesterday.toISOString().split('T')[0];
const temptedYesterday = `tempted-${yesterdayKey}`;
const rewardedYesterday = `rewarded-${yesterdayKey}`;

function updateStats() {
  const xp = parseInt(localStorage.getItem('shivaXP') || '0');
  const soldiers = parseInt(localStorage.getItem('shivaSoldiers') || '0');
  const level = Math.floor(xp / 100);
  const currentRank = getRank(level);
  let highestRank = localStorage.getItem('highestRank') || 'E';

  if (rankValue(currentRank) > rankValue(highestRank)) {
    highestRank = currentRank;
    localStorage.setItem('highestRank', highestRank);
  }

  document.getElementById('xp').textContent = xp;
  document.getElementById('soldiers').textContent = soldiers;
  document.getElementById('level').textContent = level;
  document.getElementById('rank').textContent = highestRank;

  // Aura
  let aura = parseInt(localStorage.getItem(auraKey));
  if (isNaN(aura)) {
    aura = 100;
    localStorage.setItem(auraKey, aura);
  }
  updateAuraBar(aura);
}

function updateAuraBar(value) {
  const bar = document.getElementById('auraBar');
  const text = document.getElementById('auraPercent');

  bar.style.width = `${Math.min(Math.abs(value), 100)}%`;
  text.textContent = `${value}%`;

  bar.style.background = value >= 0 ? '#30ffa8' : '#ff5e5e';
}

function openDialog(id) {
  document.getElementById(id).style.display = 'flex';
}

function closeDialog(id) {
  document.getElementById(id).style.display = 'none';
}

let demonSoldiers = 0;
let selectedSoldiers = 0;

function prepareBattle() {
  // Mark that battle was attempted
  localStorage.setItem(temptedKey, 'yes');

  const xp = parseInt(localStorage.getItem('shivaXP') || '0');
  const level = Math.floor(xp / 100);
  const soldiers = parseInt(localStorage.getItem('shivaSoldiers') || '0');

  demonSoldiers = Math.floor(Math.random() * ((level * 3 + 10) - (level * 2 + 5) + 1)) + (level * 2 + 5);
  selectedSoldiers = 0;

  document.getElementById('shivaSoldiers').textContent = soldiers;
  document.getElementById('demonSoldiers').textContent = demonSoldiers;
  document.getElementById('soldierSlider').max = soldiers;
  document.getElementById('soldierSlider').value = 0;
  document.getElementById('selectedSoldiers').textContent = selectedSoldiers;

  document.getElementById('soldierSlider').oninput = function () {
    selectedSoldiers = parseInt(this.value);
    document.getElementById('selectedSoldiers').textContent = selectedSoldiers;
  };

  openDialog('battleDialog');
}

function startBattle() {
  closeDialog('battleDialog');
  openDialog('battleArena');
}

function handleBattleResult(result) {
  closeDialog('battleArena');

  let xp = parseInt(localStorage.getItem('shivaXP') || '0');
  let soldiers = parseInt(localStorage.getItem('shivaSoldiers') || '0');

  if (result === 'win') {
    document.getElementById('capturedSoldiers').textContent = demonSoldiers;
    openDialog('victoryDialog');
  } else {
    const lost = selectedSoldiers;
    const remainingSoldiers = Math.max(0, soldiers - lost);
    localStorage.setItem('shivaSoldiers', remainingSoldiers);

    let aura = parseInt(localStorage.getItem(auraKey) || '100');
    const auraLoss = Math.max(5, lost * 2);
    aura -= auraLoss;
    localStorage.setItem(auraKey, aura);
    updateAuraBar(aura);

    updateStats();
    showSummary('Defeat', lost, 0, 'Soldiers Lost');
  }
}

function handleArise() {
  closeDialog('victoryDialog');

  let xp = parseInt(localStorage.getItem('shivaXP') || '0');
  let soldiers = parseInt(localStorage.getItem('shivaSoldiers') || '0');
  const prevRank = localStorage.getItem('highestRank') || 'E';

  const gainedXP = demonSoldiers * 10;
  const gainedSoldiers = demonSoldiers;

  xp += gainedXP;
  soldiers += gainedSoldiers;

  localStorage.setItem('shivaXP', xp);
  localStorage.setItem('shivaSoldiers', soldiers);

  updateStats();
  showSummary('Victory', gainedSoldiers, gainedXP, 'Soldiers Gained');

  const newLevel = Math.floor(xp / 100);
  const newRank = getRank(newLevel);
  if (rankValue(newRank) > rankValue(prevRank)) {
    localStorage.setItem('highestRank', newRank);
    document.getElementById('oldRank').textContent = prevRank;
    document.getElementById('newRank').textContent = newRank;
    openDialog('rankUpDialog');
  }
}

function showSummary(resultText, soldierChange, xpChange, label) {
  document.getElementById('summaryResult').textContent = resultText;
  document.getElementById('summarySoldierLabel').textContent = label;
  document.getElementById('summarySoldiers').textContent = soldierChange;
  const xpDisplay = xpChange > 0 ? `XP: +${xpChange}` : `XP: ${xpChange}`;
  document.getElementById('summaryXPLine').textContent = xpDisplay;
  openDialog('battleSummary');
}

function resetGame() {
  localStorage.setItem('shivaXP', '0');
  localStorage.setItem('shivaSoldiers', '0');
  localStorage.setItem('highestRank', 'E');
  localStorage.setItem(auraKey, '100');
  localStorage.removeItem(temptedKey);
  updateStats();
  alert('Progress has been reset.');
}

function applyDisciplineBonusIfEligible() {
  const wasTempted = localStorage.getItem(temptedYesterday);
  const alreadyRewarded = localStorage.getItem(rewardedYesterday);

  if (!wasTempted && !alreadyRewarded) {
    let xp = parseInt(localStorage.getItem('shivaXP') || '0');
    const level = Math.floor(xp / 100);
    const bonus = 50 + level * 10;

    xp += bonus;
    localStorage.setItem('shivaXP', xp);
    localStorage.setItem(rewardedYesterday, 'yes');
    alert(`Discipline Reward: +${bonus} XP for no lust yesterday.`);
  }
}

document.getElementById('temptedBtn').onclick = prepareBattle;
document.getElementById('startBattleBtn').onclick = startBattle;
document.getElementById('winBtn').onclick = () => handleBattleResult('win');
document.getElementById('loseBtn').onclick = () => handleBattleResult('lose');
document.getElementById('ariseBtn').onclick = handleArise;
document.getElementById('resetBtn').onclick = resetGame;

window.onload = () => {
  if (!localStorage.getItem('shivaXP')) localStorage.setItem('shivaXP', '0');
  if (!localStorage.getItem('shivaSoldiers')) localStorage.setItem('shivaSoldiers', '0');
  if (!localStorage.getItem('highestRank')) localStorage.setItem('highestRank', 'E');
  if (!localStorage.getItem(auraKey)) localStorage.setItem(auraKey, '100');

  applyDisciplineBonusIfEligible();
  updateStats();
};
