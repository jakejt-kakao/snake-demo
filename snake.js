(() => {
  const GRID_SIZE = 20;
  const TICK_MS = 120;

  const boardEl = document.getElementById("board");
  const scoreEl = document.getElementById("score");
  const overlayEl = document.getElementById("overlay");
  const overlayTitleEl = document.getElementById("overlay-title");
  const overlaySubtitleEl = document.getElementById("overlay-subtitle");
  const restartBtn = document.getElementById("restart");

  const cells = [];

  const createEmptyGrid = () =>
    Array.from({ length: GRID_SIZE }, () =>
      Array.from({ length: GRID_SIZE }, () => 0)
    );

  const posKey = (pos) => `${pos.x},${pos.y}`;

  const isSamePos = (a, b) => a.x === b.x && a.y === b.y;

  const addPos = (pos, dir) => ({ x: pos.x + dir.x, y: pos.y + dir.y });

  const DIRECTIONS = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };

  const OPPOSITES = {
    up: "down",
    down: "up",
    left: "right",
    right: "left",
  };

  const createInitialState = () => {
    const start = { x: Math.floor(GRID_SIZE / 2), y: Math.floor(GRID_SIZE / 2) };
    const snake = [start, { x: start.x - 1, y: start.y }];
    const direction = "right";
    const food = spawnFood(snake);
    return {
      snake,
      direction,
      nextDirection: direction,
      food,
      score: 0,
      alive: true,
      paused: false,
    };
  };

  const spawnFood = (snake) => {
    const occupied = new Set(snake.map(posKey));
    const free = [];
    for (let y = 0; y < GRID_SIZE; y += 1) {
      for (let x = 0; x < GRID_SIZE; x += 1) {
        const key = `${x},${y}`;
        if (!occupied.has(key)) free.push({ x, y });
      }
    }
    if (free.length === 0) return null;
    const pick = free[Math.floor(Math.random() * free.length)];
    return pick;
  };

  const stepState = (state) => {
    if (!state.alive || state.paused) return state;

    const direction = state.nextDirection;
    const head = state.snake[0];
    const nextHead = addPos(head, DIRECTIONS[direction]);

    const outOfBounds =
      nextHead.x < 0 ||
      nextHead.x >= GRID_SIZE ||
      nextHead.y < 0 ||
      nextHead.y >= GRID_SIZE;

    const willEat = state.food && isSamePos(nextHead, state.food);
    const bodyToCheck = willEat ? state.snake : state.snake.slice(0, -1);
    const bodySet = new Set(bodyToCheck.map(posKey));
    const hitsSelf = bodySet.has(posKey(nextHead));

    if (outOfBounds || hitsSelf) {
      return { ...state, alive: false };
    }

    const ateFood = willEat;
    const newSnake = [nextHead, ...state.snake];
    if (!ateFood) newSnake.pop();

    const newFood = ateFood ? spawnFood(newSnake) : state.food;
    const newScore = ateFood ? state.score + 1 : state.score;

    return {
      ...state,
      snake: newSnake,
      direction,
      food: newFood,
      score: newScore,
    };
  };

  const render = (state) => {
    cells.forEach((cell) => {
      cell.className = "cell";
    });

    state.snake.forEach((segment, index) => {
      const idx = segment.y * GRID_SIZE + segment.x;
      const cell = cells[idx];
      if (!cell) return;
      cell.classList.add("snake");
      if (index === 0) cell.classList.add("head");
    });

    if (state.food) {
      const idx = state.food.y * GRID_SIZE + state.food.x;
      const cell = cells[idx];
      if (cell) cell.classList.add("food");
    }

    scoreEl.textContent = String(state.score);

    if (!state.alive) {
      overlayEl.hidden = false;
      overlayTitleEl.textContent = "Game Over";
      overlaySubtitleEl.textContent = "Press Restart to play again.";
    } else if (state.paused) {
      overlayEl.hidden = false;
      overlayTitleEl.textContent = "Paused";
      overlaySubtitleEl.textContent = "Press Space to resume.";
    } else {
      overlayEl.hidden = true;
    }
  };

  const initBoard = () => {
    boardEl.innerHTML = "";
    cells.length = 0;
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i += 1) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cells.push(cell);
      boardEl.appendChild(cell);
    }
  };

  let state = createInitialState();
  let timerId = null;

  const setDirection = (dir) => {
    if (OPPOSITES[state.direction] === dir) return;
    state = { ...state, nextDirection: dir };
  };

  const togglePause = () => {
    if (!state.alive) return;
    state = { ...state, paused: !state.paused };
    render(state);
  };

  const restart = () => {
    state = createInitialState();
    render(state);
  };

  const tick = () => {
    state = stepState(state);
    render(state);
  };

  const handleKey = (event) => {
    const key = event.key.toLowerCase();
    if (["arrowup", "w"].includes(key)) setDirection("up");
    if (["arrowdown", "s"].includes(key)) setDirection("down");
    if (["arrowleft", "a"].includes(key)) setDirection("left");
    if (["arrowright", "d"].includes(key)) setDirection("right");
    if (key === " ") togglePause();
    if (key === "r") restart();
  };

  const handlePad = (event) => {
    const btn = event.target.closest("[data-dir]");
    if (!btn) return;
    setDirection(btn.dataset.dir);
  };

  const start = () => {
    initBoard();
    render(state);
    document.addEventListener("keydown", handleKey);
    restartBtn.addEventListener("click", restart);
    document.querySelector(".pad").addEventListener("click", handlePad);

    timerId = setInterval(tick, TICK_MS);
  };

  start();
})();
