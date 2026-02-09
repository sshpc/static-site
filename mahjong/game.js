class MahjongGame {
    constructor() {
        this.tiles = [];
        this.players = [];
        this.currentPlayer = 0;
        this.dealer = 0;
        this.wind = 0;
        this.discardPile = [];
        this.lastDiscard = null;
        this.lastDiscardPlayer = -1;
        this.gameStarted = false;
        this.selectedTile = null;
        this.canChi = false;
        this.canPeng = false;
        this.canGang = false;
        this.canHu = false;
        this.waitingForAction = false;
        
        this.initElements();
        this.initEventListeners();
    }

    initElements() {
        this.elements = {
            dealer: document.getElementById('dealer'),
            wind: document.getElementById('wind'),
            remaining: document.getElementById('remaining'),
            discardPile: document.getElementById('discard-pile'),
            gameMessage: document.getElementById('game-message'),
            currentAction: document.getElementById('current-action'),
            modal: document.getElementById('modal'),
            modalTitle: document.getElementById('modal-title'),
            modalMessage: document.getElementById('modal-message'),
            btnStart: document.getElementById('btn-start'),
            btnSort: document.getElementById('btn-sort'),
            btnHu: document.getElementById('btn-hu'),
            btnGang: document.getElementById('btn-gang'),
            btnPeng: document.getElementById('btn-peng'),
            btnChi: document.getElementById('btn-chi'),
            btnModalClose: document.getElementById('btn-modal-close')
        };
    }

    initEventListeners() {
        this.elements.btnStart.addEventListener('click', () => this.startGame());
        this.elements.btnSort.addEventListener('click', () => this.sortPlayerHand(0));
        this.elements.btnHu.addEventListener('click', () => this.playerHu());
        this.elements.btnGang.addEventListener('click', () => this.playerGang());
        this.elements.btnPeng.addEventListener('click', () => this.playerPeng());
        this.elements.btnChi.addEventListener('click', () => this.playerChi());
        this.elements.btnModalClose.addEventListener('click', () => this.closeModal());
    }

    createTiles() {
        this.tiles = [];
        
        const suits = ['wan', 'tiao', 'tong'];
        const suitNames = ['万', '条', '筒'];
        
        suits.forEach((suit, suitIndex) => {
            for (let i = 1; i <= 9; i++) {
                for (let j = 0; j < 4; j++) {
                    this.tiles.push({
                        type: suit,
                        value: i,
                        display: i + suitNames[suitIndex],
                        id: `${suit}-${i}-${j}`
                    });
                }
            }
        });

        const winds = ['东', '南', '西', '北'];
        winds.forEach((wind, index) => {
            for (let i = 0; i < 4; i++) {
                this.tiles.push({
                    type: 'wind',
                    value: index,
                    display: wind,
                    id: `wind-${index}-${i}`
                });
            }
        });

        const dragons = ['中', '发', '白'];
        dragons.forEach((dragon, index) => {
            for (let i = 0; i < 4; i++) {
                this.tiles.push({
                    type: 'dragon',
                    value: index,
                    display: dragon,
                    id: `dragon-${index}-${i}`
                });
            }
        });

        const flowers = ['春', '夏', '秋', '冬', '梅', '兰', '菊', '竹'];
        flowers.forEach((flower, index) => {
            this.tiles.push({
                type: 'flower',
                value: index,
                display: flower,
                id: `flower-${index}`
            });
        });
    }

    shuffleTiles() {
        for (let i = this.tiles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.tiles[i], this.tiles[j]] = [this.tiles[j], this.tiles[i]];
        }
    }

    dealTiles() {
        this.players = [
            { name: '玩家', hand: [], score: 0, isHuman: true, chi: [], peng: [], gang: [], hu: false },
            { name: '机器人1', hand: [], score: 0, isHuman: false, chi: [], peng: [], gang: [], hu: false },
            { name: '机器人2', hand: [], score: 0, isHuman: false, chi: [], peng: [], gang: [], hu: false },
            { name: '机器人3', hand: [], score: 0, isHuman: false, chi: [], peng: [], gang: [], hu: false }
        ];

        this.currentPlayer = this.dealer;
        this.tilesToDeal = [...this.tiles];
        this.dealIndex = 0;
        
        this.dealTilesWithAnimation();
    }

    dealTilesWithAnimation() {
        const maxDeals = 4 * 13 + 1; // 每个玩家13张，庄家多1张
        
        if (this.dealIndex < maxDeals) {
            const playerIndex = (this.dealer + this.dealIndex % 4) % 4;
            const tile = this.tilesToDeal.shift();
            if (!tile) return;
            
            tile.dealing = true;
            
            const player = this.players[playerIndex];
            if (player && player.hand) {
                player.hand.push(tile);
                
                this.updateDisplay();
                
                setTimeout(() => {
                    tile.dealing = false;
                    this.dealIndex++;
                    this.dealTilesWithAnimation();
                }, 50);
            }
        } else {
            this.tiles = this.tilesToDeal;
            
            this.players.forEach(player => {
                if (player && player.hand) {
                    this.sortHand(player.hand);
                    this.checkFlowers(player);
                }
            });
            
            this.updateDisplay();
            this.showMessage('游戏开始！庄家先出牌');
            this.updateCurrentAction('请出牌');
            
            const currentPlayer = this.players[this.currentPlayer];
            if (currentPlayer) {
                if (currentPlayer.isHuman) {
                    this.enablePlayerActions();
                } else {
                    this.disablePlayerActions();
                    setTimeout(() => this.aiTurn(), 1000);
                }
            }
        }
    }

    checkFlowers(player) {
        if (!player || !player.hand) return;
        
        const flowerTiles = player.hand.filter(tile => tile.type === 'flower');
        flowerTiles.forEach(flower => {
            const index = player.hand.indexOf(flower);
            if (index > -1) {
                player.hand.splice(index, 1);
                if (this.tiles.length > 0) {
                    const newTile = this.tiles.pop();
                    player.hand.push(newTile);
                }
            }
        });
        this.sortHand(player.hand);
    }

    sortHand(hand) {
        const suitOrder = { 'wan': 0, 'tiao': 1, 'tong': 2, 'wind': 3, 'dragon': 4 };
        hand.sort((a, b) => {
            if (a.type === 'flower' || b.type === 'flower') return 0;
            if (suitOrder[a.type] !== suitOrder[b.type]) {
                return suitOrder[a.type] - suitOrder[b.type];
            }
            return a.value - b.value;
        });
    }

    startGame() {
        this.createTiles();
        this.shuffleTiles();
        this.discardPile = [];
        this.lastDiscard = null;
        this.lastDiscardPlayer = -1;
        this.gameStarted = true;
        this.wind = 0;
        this.dealer = 0;
        this.currentPlayer = 0;
        
        this.showMessage('正在发牌...');
        this.updateCurrentAction('发牌中');
        this.disablePlayerActions();
        
        this.dealTiles();
    }

    updateDisplay() {
        this.elements.dealer.textContent = ['东', '南', '西', '北'][this.dealer];
        this.elements.wind.textContent = ['东', '南', '西', '北'][this.wind];
        this.elements.remaining.textContent = this.tiles.length;
        
        if (this.players && this.players.length > 0) {
            this.updatePlayerDisplay(0, 'hand-bottom', 'actions-bottom');
            this.updatePlayerDisplay(1, 'hand-top', 'actions-top');
            this.updatePlayerDisplay(2, 'hand-left', 'actions-left');
            this.updatePlayerDisplay(3, 'hand-right', 'actions-right');
        }
        
        this.updateDiscardPile();
        
        document.querySelectorAll('.player-area').forEach((area, index) => {
            area.classList.remove('active');
            if (index === this.currentPlayer) {
                area.classList.add('active');
            }
        });
    }

    updatePlayerDisplay(playerIndex, handId, actionsId) {
        const handElement = document.getElementById(handId);
        const actionsElement = document.getElementById(actionsId);
        const player = this.players[playerIndex];
        
        handElement.innerHTML = '';
        actionsElement.innerHTML = '';
        
        if (player && player.hand) {
            player.hand.forEach((tile, index) => {
                const tileElement = document.createElement('div');
                tileElement.className = `tile ${tile.type}`;
                if (tile.dealing) {
                    tileElement.classList.add('dealing');
                } else if (tile.justDrawn) {
                    tileElement.classList.add('just-drawn');
                }
                tileElement.textContent = tile.display;
                tileElement.dataset.index = index;
                tileElement.dataset.player = playerIndex;
                
                if (player.isHuman && this.currentPlayer === playerIndex) {
                    tileElement.addEventListener('click', () => this.selectTile(index));
                } else if (!player.isHuman) {
                    tileElement.classList.add('hidden');
                }
                
                handElement.appendChild(tileElement);
            });

            if (player.chi) {
                player.chi.forEach(chi => {
                    const chiElement = document.createElement('div');
                    chiElement.className = 'action-button chi';
                    chiElement.textContent = '吃';
                    actionsElement.appendChild(chiElement);
                });
            }

            if (player.peng) {
                player.peng.forEach(peng => {
                    const pengElement = document.createElement('div');
                    pengElement.className = 'action-button peng';
                    pengElement.textContent = '碰';
                    actionsElement.appendChild(pengElement);
                });
            }

            if (player.gang) {
                player.gang.forEach(gang => {
                    const gangElement = document.createElement('div');
                    gangElement.className = 'action-button gang';
                    gangElement.textContent = '杠';
                    actionsElement.appendChild(gangElement);
                });
            }
        }
    }

    updateDiscardPile() {
        this.elements.discardPile.innerHTML = '';
        this.discardPile.forEach(tile => {
            const tileElement = document.createElement('div');
            tileElement.className = `tile ${tile.type} discarded`;
            tileElement.textContent = tile.display;
            this.elements.discardPile.appendChild(tileElement);
        });
    }

    selectTile(index) {
        if (!this.players[this.currentPlayer].isHuman) return;
        
        const tiles = document.querySelectorAll(`#hand-bottom .tile`);
        tiles.forEach(tile => tile.classList.remove('selected'));
        
        if (this.selectedTile === index) {
            this.discardTile(index);
            this.selectedTile = null;
        } else {
            this.selectedTile = index;
            tiles[index].classList.add('selected');
        }
    }

    discardTile(index) {
        const player = this.players[this.currentPlayer];
        const tile = player.hand.splice(index, 1)[0];
        
        this.lastDiscard = tile;
        this.lastDiscardPlayer = this.currentPlayer;
        this.discardPile.push(tile);
        
        this.updateDisplay();
        this.showMessage(`${player.name} 出了 ${tile.display}`);
        
        this.checkOtherPlayersActions(tile);
    }

    checkOtherPlayersActions(tile) {
        let canAct = false;
        
        for (let i = 1; i < 4; i++) {
            const playerIndex = (this.currentPlayer + i) % 4;
            const player = this.players[playerIndex];
            
            if (player && this.canPlayerHu(player, tile)) {
                canAct = true;
                if (player.isHuman) {
                    this.canHu = true;
                }
            }
            
            if (player && this.canPlayerPeng(player, tile)) {
                canAct = true;
                if (player.isHuman) {
                    this.canPeng = true;
                }
            }
            
            if (i === 1 && player && this.canPlayerChi(player, tile)) {
                canAct = true;
                if (player.isHuman) {
                    this.canChi = true;
                }
            }
        }
        
        if (canAct) {
            this.waitingForAction = true;
            if (this.canHu || this.canPeng || this.canChi) {
                this.updateCurrentAction('可以选择碰、杠、和牌');
                this.enableActionButtons();
            } else {
                setTimeout(() => this.processAiActions(), 500);
            }
        } else {
            this.nextPlayer();
        }
    }

    canPlayerHu(player, tile) {
        if (!player || !player.hand) return false;
        const tempHand = [...player.hand, tile];
        return this.checkHu(tempHand);
    }

    canPlayerPeng(player, tile) {
        if (!player || !player.hand) return false;
        const count = player.hand.filter(t => 
            t.type === tile.type && t.value === tile.value
        ).length;
        return count >= 2;
    }

    canPlayerChi(player, tile) {
        if (!player || !player.hand) return false;
        if (tile.type === 'wind' || tile.type === 'dragon' || tile.type === 'flower') {
            return false;
        }
        
        const values = player.hand
            .filter(t => t.type === tile.type)
            .map(t => t.value);
        
        if (values.includes(tile.value - 1) && values.includes(tile.value - 2)) {
            return true;
        }
        if (values.includes(tile.value - 1) && values.includes(tile.value + 1)) {
            return true;
        }
        if (values.includes(tile.value + 1) && values.includes(tile.value + 2)) {
            return true;
        }
        return false;
    }

    processAiActions() {
        for (let i = 1; i < 4; i++) {
            const playerIndex = (this.currentPlayer + i) % 4;
            const player = this.players[playerIndex];
            
            if (player && !player.isHuman) {
                if (this.canPlayerHu(player, this.lastDiscard)) {
                    this.aiHu(playerIndex);
                    return;
                }
                if (this.canPlayerPeng(player, this.lastDiscard) && Math.random() > 0.5) {
                    this.aiPeng(playerIndex);
                    return;
                }
            }
        }
        
        this.nextPlayer();
    }

    aiHu(playerIndex) {
        const player = this.players[playerIndex];
        if (!player) return;
        
        player.hu = true;
        player.score += 100;
        
        this.showModal('和牌！', `${player.name} 和牌了！得分：100`);
        this.gameStarted = false;
        this.waitingForAction = false;
    }

    aiPeng(playerIndex) {
        const player = this.players[playerIndex];
        if (!player || !player.hand) return;
        
        const tile = this.lastDiscard;
        if (!tile) return;
        
        const indices = [];
        player.hand.forEach((t, i) => {
            if (t.type === tile.type && t.value === tile.value) {
                indices.push(i);
            }
        });
        
        if (indices.length >= 2) {
            indices.slice(0, 2).reverse().forEach(i => {
                player.hand.splice(i, 1);
            });
            
            if (!player.peng) player.peng = [];
            player.peng.push({ tiles: [tile, tile, tile] });
            this.currentPlayer = playerIndex;
            this.lastDiscard = null;
            this.lastDiscardPlayer = -1;
            this.waitingForAction = false;
            
            this.updateDisplay();
            this.showMessage(`${player.name} 碰了 ${tile.display}`);
            this.updateCurrentAction('请出牌');
            
            setTimeout(() => this.aiTurn(), 1000);
        }
    }

    playerHu() {
        if (!this.canHu) return;
        
        const player = this.players[0];
        if (!player) return;
        
        player.hu = true;
        player.score += 100;
        
        this.showModal('恭喜！', '你和牌了！得分：100');
        this.gameStarted = false;
        this.waitingForAction = false;
        this.disableActionButtons();
    }

    playerPeng() {
        if (!this.canPeng) return;
        
        const player = this.players[0];
        if (!player || !player.hand) return;
        
        const tile = this.lastDiscard;
        if (!tile) return;
        
        const indices = [];
        player.hand.forEach((t, i) => {
            if (t.type === tile.type && t.value === tile.value) {
                indices.push(i);
            }
        });
        
        if (indices.length >= 2) {
                indices.slice(0, 2).reverse().forEach(i => {
                    player.hand.splice(i, 1);
                });
                
                if (!player.peng) player.peng = [];
                player.peng.push({ tiles: [tile, tile, tile] });
                this.currentPlayer = 0;
                this.lastDiscard = null;
                this.lastDiscardPlayer = -1;
                this.waitingForAction = false;
                
                this.canPeng = false;
                this.canChi = false;
                this.canHu = false;
                
                this.updateDisplay();
                this.showMessage(`你碰了 ${tile.display}`);
                
                // 检查碰牌后是否和牌
                if (this.checkHu(player.hand)) {
                    this.canHu = true;
                    this.elements.btnHu.disabled = false;
                    this.updateCurrentAction('可以和牌！');
                    this.enableActionButtons();
                } else {
                    this.updateCurrentAction('请出牌');
                    this.disableActionButtons();
                    this.enablePlayerActions();
                }
            }
    }

    playerChi() {
        if (!this.canChi) return;
        
        const player = this.players[0];
        if (!player || !player.hand) return;
        
        const tile = this.lastDiscard;
        if (!tile) return;
        
        const values = player.hand
            .filter(t => t.type === tile.type)
            .map(t => t.value);
        
        let chiTiles = null;
        
        if (values.includes(tile.value - 1) && values.includes(tile.value - 2)) {
            chiTiles = [tile.value - 2, tile.value - 1, tile.value];
        } else if (values.includes(tile.value - 1) && values.includes(tile.value + 1)) {
            chiTiles = [tile.value - 1, tile.value, tile.value + 1];
        } else if (values.includes(tile.value + 1) && values.includes(tile.value + 2)) {
            chiTiles = [tile.value, tile.value + 1, tile.value + 2];
        }
        
        if (chiTiles) {
            const indices = [];
            player.hand.forEach((t, i) => {
                if (t.type === tile.type && chiTiles.includes(t.value)) {
                    indices.push(i);
                }
            });
            
            if (indices.length >= 2) {
                indices.slice(0, 2).reverse().forEach(i => {
                    player.hand.splice(i, 1);
                });
                
                if (!player.chi) player.chi = [];
                player.chi.push({ tiles: chiTiles.map(v => ({ type: tile.type, value: v })) });
                this.currentPlayer = 0;
                this.lastDiscard = null;
                this.lastDiscardPlayer = -1;
                this.waitingForAction = false;
                
                this.canPeng = false;
                this.canChi = false;
                this.canHu = false;
                
                this.updateDisplay();
                this.showMessage(`你吃了 ${tile.display}`);
                
                // 检查吃牌后是否和牌
                if (this.checkHu(player.hand)) {
                    this.canHu = true;
                    this.elements.btnHu.disabled = false;
                    this.updateCurrentAction('可以和牌！');
                    this.enableActionButtons();
                } else {
                    this.updateCurrentAction('请出牌');
                    this.disableActionButtons();
                    this.enablePlayerActions();
                }
            }
        }
    }

    playerGang() {
        const player = this.players[0];
        if (!player || !player.hand) return;
        
        const tileCounts = {};
        
        player.hand.forEach(tile => {
            const key = `${tile.type}-${tile.value}`;
            tileCounts[key] = (tileCounts[key] || 0) + 1;
        });
        
        for (const [key, count] of Object.entries(tileCounts)) {
            if (count === 4) {
                const [type, value] = key.split('-');
                const indices = [];
                player.hand.forEach((t, i) => {
                    if (t.type === type && t.value === parseInt(value)) {
                        indices.push(i);
                    }
                });
                
                indices.reverse().forEach(i => {
                    player.hand.splice(i, 1);
                });
                
                if (!player.gang) player.gang = [];
                player.gang.push({ tiles: [{ type, value: parseInt(value) }] });
                
                if (this.tiles.length > 0) {
                    const newTile = this.tiles.pop();
                    player.hand.push(newTile);
                    this.sortHand(player.hand);
                    this.checkFlowers(player);
                }
                
                this.updateDisplay();
                this.showMessage('你杠牌了');
                
                // 检查杠牌后是否和牌
                if (this.checkHu(player.hand)) {
                    this.canHu = true;
                    this.elements.btnHu.disabled = false;
                    this.updateCurrentAction('可以和牌！');
                    this.enableActionButtons();
                } else {
                    this.updateCurrentAction('请出牌');
                    this.disableActionButtons();
                    this.enablePlayerActions();
                }
                return;
            }
        }
        
        this.showMessage('没有可以杠的牌');
    }

    enableActionButtons() {
        this.elements.btnHu.disabled = !this.canHu;
        this.elements.btnPeng.disabled = !this.canPeng;
        this.elements.btnChi.disabled = !this.canChi;
        // 检查是否有可杠的牌
        const player = this.players[this.currentPlayer];
        if (player && player.hand) {
            const canGang = this.canGang(player.hand);
            this.elements.btnGang.disabled = !canGang;
        } else {
            this.elements.btnGang.disabled = true;
        }
    }
    
    canGang(hand) {
        if (!hand || hand.length === 0) return false;
        
        const counts = {};
        hand.forEach(tile => {
            const key = `${tile.type}-${tile.value}`;
            counts[key] = (counts[key] || 0) + 1;
        });
        
        for (const count of Object.values(counts)) {
            if (count >= 3) {
                return true;
            }
        }
        return false;
    }

    disableActionButtons() {
        this.elements.btnHu.disabled = true;
        this.elements.btnPeng.disabled = true;
        this.elements.btnChi.disabled = true;
        this.elements.btnGang.disabled = true;
    }

    enablePlayerActions() {
        this.elements.btnSort.disabled = false;
    }

    disablePlayerActions() {
        this.elements.btnSort.disabled = true;
        this.disableActionButtons();
    }

    nextPlayer() {
        this.currentPlayer = (this.currentPlayer + 1) % 4;
        this.lastDiscard = null;
        this.lastDiscardPlayer = -1;
        this.waitingForAction = false;
        
        this.canPeng = false;
        this.canChi = false;
        this.canHu = false;
        
        this.updateDisplay();
        this.disableActionButtons();
        
        if (this.tiles.length === 0) {
            this.showModal('游戏结束', '牌已摸完，流局！');
            this.gameStarted = false;
            return;
        }
        
        const currentPlayer = this.players[this.currentPlayer];
        if (currentPlayer) {
            this.showMessage(`${currentPlayer.name} 摸牌中...`);
            this.updateCurrentAction('摸牌中...');
            
            setTimeout(() => this.drawTileWithAnimation(), 500);
        }
    }

    drawTileWithAnimation() {
        const currentPlayer = this.players[this.currentPlayer];
        if (!currentPlayer || !currentPlayer.hand) return;
        
        const tile = this.tiles.pop();
        if (!tile) return;
        
        currentPlayer.hand.push(tile);
        
        const playerHand = currentPlayer.hand;
        const lastTile = playerHand[playerHand.length - 1];
        lastTile.justDrawn = true;
        
        this.updateDisplay();
        
        setTimeout(() => {
            lastTile.justDrawn = false;
            this.sortHand(currentPlayer.hand);
            this.checkFlowers(currentPlayer);
            
            this.updateDisplay();
            this.showMessage(`${currentPlayer.name} 摸了一张牌`);
            
            if (currentPlayer.isHuman) {
                this.updateCurrentAction('请出牌');
                this.enablePlayerActions();
                
                if (this.checkHu(currentPlayer.hand)) {
                    this.canHu = true;
                    this.elements.btnHu.disabled = false;
                    this.updateCurrentAction('可以和牌！');
                }
            } else {
                this.updateCurrentAction(`${currentPlayer.name} 思考中...`);
                this.disablePlayerActions();
                setTimeout(() => this.aiTurn(), 1000);
            }
        }, 500);
    }

    aiTurn() {
        const player = this.players[this.currentPlayer];
        if (!player || !player.hand) return;
        
        if (this.checkHu(player.hand)) {
            this.aiHu(this.currentPlayer);
            return;
        }
        
        const discardIndex = this.aiChooseDiscard(player);
        this.discardTile(discardIndex);
    }

    aiChooseDiscard(player) {
        if (!player || !player.hand) return 0;
        
        const tileCounts = {};
        player.hand.forEach(tile => {
            const key = `${tile.type}-${tile.value}`;
            tileCounts[key] = (tileCounts[key] || 0) + 1;
        });
        
        let bestIndex = 0;
        let minCount = 1;
        
        player.hand.forEach((tile, index) => {
            const key = `${tile.type}-${tile.value}`;
            const count = tileCounts[key];
            
            if (count < minCount || (count === minCount && Math.random() > 0.5)) {
                bestIndex = index;
                minCount = count;
            }
        });
        
        return bestIndex;
    }

    checkHu(hand) {
        if (hand.length !== 14 && hand.length !== 13) return false;
        
        const tempHand = hand.filter(tile => tile.type !== 'flower');
        
        if (tempHand.length % 3 !== 2) return false;
        
        const counts = {};
        tempHand.forEach(tile => {
            const key = `${tile.type}-${tile.value}`;
            counts[key] = (counts[key] || 0) + 1;
        });
        
        for (const [key, count] of Object.entries(counts)) {
            if (count >= 2) {
                const remaining = [...tempHand];
                const [type, value] = key.split('-');
                
                let removed = 0;
                for (let i = remaining.length - 1; i >= 0; i--) {
                    if (remaining[i].type === type && remaining[i].value === parseInt(value)) {
                        remaining.splice(i, 1);
                        removed++;
                        if (removed === 2) break;
                    }
                }
                
                if (this.checkSets(remaining)) {
                    return true;
                }
            }
        }
        
        return false;
    }

    checkSets(tiles) {
        if (tiles.length === 0) return true;
        
        const counts = {};
        tiles.forEach(tile => {
            const key = `${tile.type}-${tile.value}`;
            counts[key] = (counts[key] || 0) + 1;
        });
        
        for (const [key, count] of Object.entries(counts)) {
            if (count >= 3) {
                const [type, value] = key.split('-');
                const remaining = [...tiles];
                
                let removed = 0;
                for (let i = remaining.length - 1; i >= 0; i--) {
                    if (remaining[i].type === type && remaining[i].value === parseInt(value)) {
                        remaining.splice(i, 1);
                        removed++;
                        if (removed === 3) break;
                    }
                }
                
                if (this.checkSets(remaining)) {
                    return true;
                }
            }
        }
        
        const suitTiles = tiles.filter(tile => 
            tile.type === 'wan' || tile.type === 'tiao' || tile.type === 'tong'
        );
        
        for (const tile of suitTiles) {
            const v = tile.value;
            const has1 = tiles.some(t => t.type === tile.type && t.value === v);
            const has2 = tiles.some(t => t.type === tile.type && t.value === v + 1);
            const has3 = tiles.some(t => t.type === tile.type && t.value === v + 2);
            
            if (has1 && has2 && has3) {
                const remaining = [...tiles];
                
                let removed = 0;
                for (let i = remaining.length - 1; i >= 0; i--) {
                    if (remaining[i].type === tile.type && 
                        (remaining[i].value === v || remaining[i].value === v + 1 || remaining[i].value === v + 2)) {
                        remaining.splice(i, 1);
                        removed++;
                        if (removed === 3) break;
                    }
                }
                
                if (this.checkSets(remaining)) {
                    return true;
                }
            }
        }
        
        return false;
    }

    showMessage(message) {
        this.elements.gameMessage.textContent = message;
        this.elements.gameMessage.style.animation = 'none';
        this.elements.gameMessage.offsetHeight;
        this.elements.gameMessage.style.animation = 'fadeIn 0.3s ease-in';
    }

    updateCurrentAction(action) {
        this.elements.currentAction.textContent = action;
    }

    showModal(title, message) {
        this.elements.modalTitle.textContent = title;
        this.elements.modalMessage.textContent = message;
        this.elements.modal.classList.add('show');
    }

    closeModal() {
        this.elements.modal.classList.remove('show');
    }

    sortPlayerHand(playerIndex) {
        const player = this.players[playerIndex];
        if (player && player.hand) {
            this.sortHand(player.hand);
            this.updateDisplay();
        }
    }
}

const game = new MahjongGame();
