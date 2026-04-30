const board      = document.getElementById('board');
const emptyMsg   = document.getElementById('empty-msg');
const wordCount  = document.getElementById('word-count');
const songSelect = document.getElementById('song-select');
const flipAllBtn = document.getElementById('flip-all-btn');
const resetBtn   = document.getElementById('reset-btn');

let flipAllTimeout = null;
let resetTimeout   = null;

function clearScheduled() {
  if (flipAllTimeout) { clearTimeout(flipAllTimeout); flipAllTimeout = null; }
  if (resetTimeout)   { clearTimeout(resetTimeout);   resetTimeout   = null; }
}

function renderBoard(words) {
  board.innerHTML = '';
  emptyMsg.style.display = 'none';

  words.forEach(({ number, word }) => {
    const tile = document.createElement('div');
    tile.className = 'tile';

    const inner = document.createElement('div');
    inner.className = 'tile-inner';

    const front = document.createElement('div');
    front.className = 'tile-front';
    front.textContent = number;

    const back = document.createElement('div');
    back.className = 'tile-back';
    back.textContent = word;

    inner.appendChild(front);
    inner.appendChild(back);
    tile.appendChild(inner);

    tile.addEventListener('click', () => {
      inner.classList.toggle('flipped');
    });

    board.appendChild(tile);
  });

  wordCount.textContent = `${words.length} ord`;
  flipAllBtn.disabled = false;
  resetBtn.disabled   = false;
}

function allInners() {
  return Array.from(document.querySelectorAll('.tile-inner'));
}

flipAllBtn.addEventListener('click', () => {
  clearScheduled();
  const inners = allInners();
  inners.forEach((inner, i) => {
    flipAllTimeout = setTimeout(() => inner.classList.add('flipped'), i * 60);
  });
});

resetBtn.addEventListener('click', () => {
  clearScheduled();
  const inners = allInners().reverse();
  inners.forEach((inner, i) => {
    resetTimeout = setTimeout(() => inner.classList.remove('flipped'), i * 45);
  });
});

songSelect.addEventListener('change', async () => {
  const id = songSelect.value;
  clearScheduled();

  if (!id) {
    board.innerHTML = '';
    emptyMsg.style.display = '';
    wordCount.textContent  = '';
    flipAllBtn.disabled    = true;
    resetBtn.disabled      = true;
    return;
  }

  const res  = await fetch(`/api/lyrics/${id}`);
  const data = await res.json();

  if (data.error) {
    board.innerHTML      = '';
    emptyMsg.textContent = 'Kunde inte ladda låten.';
    emptyMsg.style.display = '';
    return;
  }

  renderBoard(data.words);
});
