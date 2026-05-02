const board      = document.getElementById('board');
const emptyMsg   = document.getElementById('empty-msg');
const wordCount  = document.getElementById('word-count');
const songSelect = document.getElementById('song-select');
const flipAllBtn = document.getElementById('flip-all-btn');
const resetBtn   = document.getElementById('reset-btn');
const songTitle  = document.getElementById('song-title');

let flipAllTimeout = null;
let resetTimeout   = null;
let titleTimeout   = null;

function clearScheduled() {
  if (flipAllTimeout) { clearTimeout(flipAllTimeout); flipAllTimeout = null; }
  if (resetTimeout)   { clearTimeout(resetTimeout);   resetTimeout   = null; }
  if (titleTimeout)   { clearTimeout(titleTimeout);   titleTimeout   = null; }
}

function allInners() {
  return Array.from(document.querySelectorAll('.tile-inner'));
}

function checkAllFlipped() {
  const inners = allInners();
  if (inners.length > 0 && inners.every(i => i.classList.contains('flipped'))) {
    songTitle.classList.remove('hidden');
  } else {
    songTitle.classList.add('hidden');
  }
}

function renderBoard(words, title) {
  songTitle.textContent = title;
  songTitle.classList.add('hidden');
  board.innerHTML = '';
  emptyMsg.style.display = 'none';

  words.forEach(({ number, word }, idx) {
    const tile = document.createElement('div');
    tile.className = 'tile';

    const inner = document.createElement('div');
    inner.className = 'tile-inner';

    const front = document.createElement('div');
    front.className = 'tile-front';
    front.textContent = number;

    const back = document.createElement('div');
    back.className = 'tile-back';
    back.textContent = idx < words.length - 1 ? word + ',' : word;

    inner.appendChild(front);
    inner.appendChild(back);
    tile.appendChild(inner);

    tile.addEventListener('click', () => {
      inner.classList.toggle('flipped');
      checkAllFlipped();
    });

    board.appendChild(tile);
  });

  wordCount.textContent = `${words.length} ord`;
  flipAllBtn.disabled = false;
  resetBtn.disabled   = false;
}

flipAllBtn.addEventListener('click', () => {
  clearScheduled();
  const inners = allInners();
  inners.forEach((inner, i) => {
    flipAllTimeout = setTimeout(() => inner.classList.add('flipped'), i * 60);
  });
  titleTimeout = setTimeout(checkAllFlipped, (inners.length - 1) * 60 + 700);
});

resetBtn.addEventListener('click', () => {
  clearScheduled();
  songTitle.classList.add('hidden');
  const inners = allInners().reverse();
  inners.forEach((inner, i) => {
    resetTimeout = setTimeout(() => inner.classList.remove('flipped'), i * 45);
  });
});

songSelect.addEventListener('change', async () => {
  const id = songSelect.value;
  clearScheduled();
  songTitle.classList.add('hidden');

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
    board.innerHTML        = '';
    emptyMsg.textContent   = 'Kunde inte ladda låten.';
    emptyMsg.style.display = '';
    return;
  }

  renderBoard(data.words, data.title);
});
