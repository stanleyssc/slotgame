//DOM Elements
const output = document.querySelector('.myDiv');
output.innerHTML = '';
const messageTop = makeElement(output, 'div', 'Welcome to Naija Game Hub. The home of Winners!!!', 'topMessage');
const userBal = makeElement(output, 'div', '', 'userBalance');
const gameArea = makeElement(output, 'div', '', 'gameArea');
const betSelect = makeElement(output, 'select', '', 'betSelect');
const btn = makeElement(output, 'button', 'START SPIN', 'btn');
const message = makeElement(output, 'div', '', 'message');
const panelSelect = makeElement(output, 'select', '', 'panelSelect');
const panelOptions = [3, 4];
panelOptions.forEach((panel) => {
    const option = document.createElement('option');
    option.value = panel;
    option.textContent = `${panel} Panels`;
    if(panel === 4){
        option.selected = true;
    }
    panelSelect.appendChild(option);
});

// Card Images
const iconImages = ['circle_1.png', 'circle_2.png', 'circle_3.png', 'circle_4.png', 'circle_5.png', 'circle_7.png', 'circle_8.png', 'circle_10.png', 'circle_11.png', 'circle_12.png', 
'circle_13.png', 'circle_14.png', 'triangle_1.png', 'triangle_2.png', 'triangle_3.png', 'triangle_4.png', 'triangle_5.png', 
'triangle_7.png', 'triangle_8.png', 'triangle_10.png', 'triangle_11.png', 'triangle_12.png', 'triangle_13.png', 'triangle_14.png', 'cross_1.png', 'cross_2.png', 'cross_3.png', 'cross_5.png', 'cross_7.png', 'cross_10.png', 'cross_11.png', 'cross_13.png', 'cross_14.png', 'square_1.png', 'square_2.png', 'square_3.png', 'square_5.png', 'square_7.png', 'square_10.png', 'square_11.png', 'square_13.png', 'square_14.png', 'star_1.png', 'star_2.png', 'star_3.png', 'star_4.png', 'star_5.png', 'star_7.png', 'star_8.png', 'whot_20.png'].map(
    fileName => `./cards/${fileName}`
);

// Game parameters/settings
const game = {
    total: parseInt(panelSelect.value, 10),
    inPlay: false,
    balance: 0, // Initial balance set to 0 until fetched from the server
    speed: 10,
    totalItems: iconImages.length,
    main: []
};

// Bet options
const betOptions = [10, 50, 100, 200, 500];
betOptions.forEach((amount) => {
    const option = document.createElement('option');
    option.value = amount;
    option.textContent = `₦${amount}`;
    betSelect.appendChild(option);
});

async function checkToken() {
    try {
        const jwt_decode = (await import('jwt-decode')).default;
        const token = getToken();

        if (!token) {
            showSessionExpiredAlert();
            return;
        }

        const decoded = jwt_decode(token);
        const currentTime = Date.now() / 1000; 
        if (decoded.exp < currentTime) {
            showSessionExpiredAlert(); 
        } else {
            return;
        }
    } catch (error) {
        showSessionExpiredAlert();
    }
}

function showSessionExpiredAlert() {
    const alertContainer = document.createElement('div');
    alertContainer.style.position = 'fixed';
    alertContainer.style.top = '50%';
    alertContainer.style.left = '50%';
    alertContainer.style.transform = 'translate(-50%, -50%)';
    alertContainer.style.backgroundColor = '#f8d7da';
    alertContainer.style.color = '#721c24';
    alertContainer.style.padding = '20px';
    alertContainer.style.border = '1px solid #f5c6cb';
    alertContainer.style.borderRadius = '5px';
    alertContainer.style.zIndex = '1000';
    alertContainer.innerHTML = `
        <p>Your session has expired. Please log in again.</p>
        <button id="loginButton" style="padding: 10px 20px; background-color: #007bff; color: white; border: none; border-radius: 5px;">Log in</button>
    `;

    document.body.appendChild(alertContainer);

    document.getElementById('loginButton').addEventListener('click', () => {
        window.location.href = '/login';
    });
};

function getToken() {
    const token = localStorage.getItem('token');
    return token;
}
// Fetch and display user info
const getUserInfo = () => {
    const token = localStorage.getItem('token');

    if (!token) {
        return;
    }

    fetch('https://slot-backend-f32n.onrender.com/user-info', {
        method: 'GET',
        headers: {
            Authorization: token,
            'Content-Type': 'application/json',
        },
    })
    .then((response) => {
        if (!response.ok) {
            throw new Error('Failed to fetch user info');
        }
        return response.json();
    })
    .then((data) => {
        game.balance = Math.floor(data.balance);
        userBal.innerHTML = `Welcome, ${data.username} <br>
            Account Balance: ₦${data.balance}
        `;
    })
    .catch((error) => {
        console.error('Error fetching user info:', error);
    });
};

async function updateBalanceOnServer(balance) {
    try {
        const token = getToken();
        if (!token) {
            throw new Error('No authentication token found.');
        }

        const response = await fetch("https://slot-backend-f32n.onrender.com/balance", {
            method: "POST",
            headers: {
                Authorization: token,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ balance }),
        });

        if (!response.ok) {
            throw new Error("Failed to update user balance on the server.");
        }
    } catch (error) {}
};

function getSelectedBet() {
    return parseInt(betSelect.value, 10);
}

// Event Listeners
window.addEventListener('DOMContentLoaded', init);

btn.addEventListener('click', async (e) => {
    const bet = getSelectedBet();

    if (!bet) {
        updateMessage('Please select your bet amount.');
        return;
    }

    try {
        getUserInfo();
        if (game.balance < bet) {
            updateMessage('You do not have enough funds to place this bet. Please recharge your account.');
            return;
        }

        if (btn.textContent === 'START SPIN' && !game.inPlay) {
            setButtonState(true, 'STOP SPIN', 'grey');
            game.balance -= bet;
            startSpin();
            disableButtons();
            updateBalanceOnServer(game.balance);
            getUserInfo();
        } else {
            game.inPlay = false;
            setButtonState(false, 'START SPIN', 'green');
        }
    } catch (error) {
        updateMessage('Failed to process the bet. Please try again.');
    }
});

/*const socket = new WebSocket('wss://slotgame-backend.onrender.com');

socket.onmessage = (event) => {
    const { balance } = JSON.parse(event.data);
    updateBalance(balance, 'set'); // Sync balance on update
};
*/

//Game initializer
function init() {
    setButtonState(false, 'START SPIN', 'green');
    getUserInfo();
    gameArea.style.width = game.total * 102 + 'px';
    gameArea.style.left = 5px;

    panelSelect.addEventListener('change', (e) => {
        game.total = parseInt(e.target.value, 10);
        init();
    });

    game.main.forEach((panel) => panel.remove());

    for (let i = 0; i < game.total; i++) {
        game.main[i] = makeElement(gameArea, 'div', '', 'wheel');
        const randomIndex = Math.floor(Math.random() * game.totalItems);

        for (let x = 0; x < game.totalItems; x++) {
            const el = makeElement(game.main[i], 'div', '', 'box');
            const img = document.createElement('img');
            img.src = iconImages[(randomIndex + x) % game.totalItems];
            el.appendChild(img);
            el.faceValue = (randomIndex + x) % game.totalItems + 1;
        }
        game.main[i].style.left = `${i * 100}px`;
    }
    window.addEventListener('resize', adjustGameArea);
};

// Create game elements
function makeElement(parent, ele, html, myClass) {
    const el = document.createElement(ele);
    el.classList.add(myClass);
    el.innerHTML = html;
    parent.append(el);
    return el;
}

function updateMessage(html) {
    message.innerHTML = html;
}

// Button state 
function setButtonState(isDisabled, text, bgcolor) {
    btn.disabled = isDisabled;
    btn.textContent = text;
    btn.style.backgroundColor = bgcolor;
}

// Start spinning 
function startSpin() {
    const bet = getSelectedBet();
    game.bet = bet;
    updateMessage(`Spinning... Bet: ₦${bet}.`);
    game.inPlay = true;
    for (let i = 0; i < game.total; i++) {
        game.main[i].mover = Math.floor(Math.random() * 300 + 10);
    }
    game.ani = requestAnimationFrame(spin);    
}

function spin() {
    let spinner = 5000;
    spinner--;
    if (spinner <= 0) stopGameplay();

    let holder = [];
    for (let i = 0; i < game.total; i++) {
        let el = game.main[i];
        let elY = el.offsetTop;

        if (el.mover > 0) {
            el.mover--;
            elY += game.speed;

            if (elY > -150) {
                elY -= 100;
                const last = el.lastElementChild;
                el.prepend(last);
            }
            if (el.mover == 0 && elY % 100 != 0) el.mover++;        
            el.style.top = elY + 'px';
        } else {
            // Value of visible panel
            let viewEl = el.children[2];
            let faceValue = elY == -200 ? viewEl.faceValue : null;
            let cardName = faceValue !== null ? iconImages[faceValue - 1] : null;
            holder.push({ faceValue, cardName });
        }
    }

// Spin completed
if (holder.length >= game.total) {
    stopGameplay();
    enableButtons();

    // Aggregate results
    const score = aggregateResults(holder);

    // Payout logic
    payout(score);
}

if (game.inPlay) {
    game.ani = requestAnimationFrame(spin);
}

function aggregateResults(holder) {
    const score = {};
    holder.forEach((item) => {
        if (item.cardName) {
            score[item.cardName] = (score[item.cardName] || 0) + 1;
        }
    });
    return score;
}

function stopGameplay() {
    game.inPlay = false;
    setButtonState(false, 'START SPIN', 'green');
}

function payout(outcome) {
    const suits = {};
    const numbers = {};
    let whotCount = 0;
    let jackPotTriggered = false;
    let jackpotType = '';
    const bet = game.bet || 0;

    // Group by suits and numbers
    Object.entries(outcome).forEach(([cardName, count]) => {
        const [suit, number] = cardName.split('_');
        
        if (suit === 'whot') {
            whotCount += count;
        }
        
        if (!suits[suit]) suits[suit] = 0;
        suits[suit] += count;

        if (number) {
            if (!numbers[number]) numbers[number] = 0;
            numbers[number] += count;
        }
    });

    // Payout Logic
    let payoutAmount = 0;

    // Check for jackpots
    if (game.total === 3){
        if (whotCount === 3) {
            payoutAmount += calculateJackpot(bet, 'four_whot');
            jackpotType = 'FOUR WHOT';
            jackPotTriggered = true;
        } else if (whotCount === 2) {
            payoutAmount += calculateJackpot(bet, 'three_whot');
            jackpotType = 'THREE WHOT';
            jackPotTriggered = true;
        } else if (Object.keys(suits).length === 1) {
            payoutAmount += calculateJackpot(bet, 'silver');
            jackpotType = 'SILVER';
            jackPotTriggered = true;
        } else if (Object.keys(numbers).length === 1) {
            payoutAmount += calculateJackpot(bet, 'gold');
            jackpotType = 'GOLD';
            jackPotTriggered = true;
        }
        else if (Object.keys(numbers).length === 1 && Object.keys(suits).length === 1) {
            payoutAmount += calculateJackpot(bet, 'platinum');
            jackpotType = 'PLATINUM';
            jackPotTriggered = true;
        }
    }
    else if (game.total ===4) {
        if (whotCount === 4) {
            payoutAmount += calculateJackpot(bet, 'four_whot');
            jackPotTriggered = true;
        } else if (whotCount === 3) {
            payoutAmount += calculateJackpot(bet, 'three_whot');
            jackPotTriggered = true;
        } else if (whotCount === 2) {
            payoutAmount += calculateJackpot(bet, 'two_whot');
            jackPotTriggered = true;
        } else if (Object.keys(suits).length === 1) {
            payoutAmount += calculateJackpot(bet, 'silver');
            jackPotTriggered = true;
        } else if (Object.keys(numbers).length === 1) {
            payoutAmount += calculateJackpot(bet, 'gold');
            jackPotTriggered = true;
        }
    }

    if(jackPotTriggered){
        triggerCoinAnimation()
    }
    if (!jackPotTriggered) {
        updateMessage('No win this time. Try again.');
    };

    saveGameOutcome(game.username, bet, game.total, outcome, payoutAmount);

    // Update balance
    game.balance += payoutAmount;
    updateBalanceOnServer(game.balance);
    getUserInfo();

function calculateJackpot(bet, jackpotType) {
    let jackpotMultipliers = {};
    if (game.total ===4){
        jackpotMultipliers = {
            four_whot: 2000,
            three_whot: 300,
            two_whot: 50,
            silver: 100,
            gold: 200,
            platinum: 1000
        };
    }
    else if (game.total ===3){
        jackpotMultipliers = {
            three_whot: 200,
            two_whot: 30,
            silver: 50,
            gold: 100,
            platinum: 500
        };
    }

    const multiplier = jackpotMultipliers[jackpotType] || 0;
    const payoutAmount = bet * multiplier;

    updateMessage(`${jackpotType.toUpperCase()} JACKPOT!!! You won N${payoutAmount}`);
    return payoutAmount;
}
}

async function saveGameOutcome(user_id, betAmount, numberOfPanels, outcome, payout, jackpot_type) {
    const token = getToken();
    try {
        const response = await fetch(
          "https://slot-backend-f32n.onrender.com/outcome",
          {
            method: "POST",
            headers: {
              Authorization: token,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              user_id: user_id,
              betAmount: betAmount,
              numberOfPanels: numberOfPanels,
              outcome: outcome,
              payout: payout,
              jackpot_type: jackpot_type,
            }),
          }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Failed to save game outcome: ${errorData.message || response.statusText}`);
        };
    
        const data = await response.json();

        const balance_After = data.balance_after_spin;
    } catch (error) {
        throw error;
    }
}
}

function adjustGameArea() {
    gameArea.style.width = game.total * 102 + 'px'; 
    let leftPos = (document.body.clientWidth - (game.total * 102)) / 2 + 'px';  // Center the game area
    gameArea.style.left = leftPos;  // Set the position of the game area
};

function disableButtons() {
    panelSelect.disabled = true;
    betSelect.disabled = true;
}
function enableButtons() {
    panelSelect.disabled = false;
    betSelect.disabled = false;
}

function triggerCoinAnimation() {
    playSound();

    const coinContainer = document.getElementById('coinContainer');
    const numCoins = Math.floor(Math.random() * 5) + 5; 
    const coinSize = Math.min(window.innerWidth, window.innerHeight) * 0.25; 

    for (let i = 0; i < numCoins; i++) {
        const coin = document.createElement('div');
        coin.classList.add('coin');
        
        const startLeft = Math.random() * window.innerWidth; 
        const delay = Math.random() * 5; 
        
        coin.style.left = `${startLeft}px`;
        coin.style.animationDelay = `${delay}s`; 
        
        coin.style.width = `${coinSize}px`; 
        coin.style.height = `${coinSize}px`;

        coinContainer.appendChild(coin);

        setTimeout(() => {
            coinContainer.removeChild(coin);
        }, 10000 + delay * 1000); 
    }
}

function playSound() {
    const sound = new Audio('sprites/sound.mp3');
    sound.play();
}

const fetchWinners = async () => {
  try {
    const response = await fetch('https://slot-backend-f32n.onrender.com/winners');
    const data = await response.json();

    const bannerElement = document.getElementById('winner-banner');
    const defaultMessage = "Welcome to Naija Gamers Hub. Get ready to win millions!!!";

    if (data.winners && data.winners.length > 0) {
      const winnersText = data.winners.join(' • ') + ' • ' + defaultMessage;
      bannerElement.innerHTML = `<div class="winner-marquee">${winnersText}</div>`;
    } else {
      // Fallback message if no winners are retrieved
      bannerElement.innerHTML = `<div class="winner-marquee">${defaultMessage}</div>`;
    }
  } catch (error) {
    console.error('Error fetching winners:', error);
    const bannerElement = document.getElementById('winner-banner');
    const defaultMessage = "Welcome to Naija Gamers Hub. Get ready to win millions!!!";
    bannerElement.innerHTML = `<div class="winner-marquee">${defaultMessage}</div>`;
  }
};

// Initial fetch and periodic updates
fetchWinners();
setInterval(fetchWinners, 30000); // Update every 30 seconds

  
  document.addEventListener('DOMContentLoaded', () => {
    const rows = document.querySelectorAll('.outcome-table tbody tr');
    const hoverWindow = document.getElementById('hover-window');

    rows.forEach(row => {
        row.addEventListener('click', (e) => {
            const info = row.dataset.info;
            hoverWindow.textContent = info;
            hoverWindow.style.left = `${e.pageX + 10}px`;
            hoverWindow.style.top = `${e.pageY + 10}px`;
            hoverWindow.classList.remove('hidden');
        });
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.outcome-table')) {
            hoverWindow.classList.add('hidden');
        }
    });
});
